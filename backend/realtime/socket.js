/* Authenticated Socket.IO layer.
 *
 * - Every connection must present a valid access JWT in the handshake (`auth.token`).
 * - The user id always comes from the verified token, never from event payloads.
 * - Direct messages / call invitations are delivered only to the recipient's own room.
 * - Video-call rooms are named "<callerId>-<calleeId>"; only those two users may join, and
 *   WebRTC signalling is relayed only between sockets that share the room. */
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const config = require('../config')

const CHAT_PERMISSION = 'Chat'
const CHAT_ROOM = 'chat-users'
const userRoom = (id) => `user:${id}`
const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0
const callRoomPattern = /^(\d+)-(\d+)$/

const verifyHandshakeToken = (token) => {
  if (!token || typeof token !== 'string') return null
  try {
    return jwt.verify(token, config.secrets.accessToken, { algorithms: ['HS256'] })
  } catch (e) {
    return null
  }
}

const hasChat = (user) => Array.isArray(user?.permissions) && user.permissions.includes(CHAT_PERMISSION)

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
  })

  const online = new Map() // userId -> Set(socket.id)
  const callRooms = new Map() // roomId -> Set(socket.id)

  const broadcastOnline = () => io.to(CHAT_ROOM).emit('onlineUsers', Array.from(online.keys()))

  const markOffline = (socket) => {
    const id = socket.data.user?.id
    const set = online.get(id)
    if (!set) return
    set.delete(socket.id)
    if (set.size === 0) online.delete(id)
    broadcastOnline()
  }

  /* Public, read-only namespace: clients (including signed-out visitors) only learn THAT the catalogue changed
   * and then re-fetch through the normal API, so nothing sensitive travels here. */
  io.of('/catalog')

  io.use((socket, next) => {
    const decoded = verifyHandshakeToken(socket.handshake.auth?.token)
    if (!decoded || !isId(decoded.id)) return next(new Error('unauthorized'))
    socket.data.user = { id: Number(decoded.id), permissions: decoded.permissions || [] }
    socket.data.exp = decoded.exp
    next()
  })

  io.on('connection', (socket) => {
    const user = socket.data.user
    // only chat users get an addressable room; students connected for other reasons receive nothing
    if (hasChat(user)) socket.join(userRoom(user.id))

    // drop the connection when the access token expires; the client reconnects with a fresh token
    if (socket.data.exp) {
      const ms = socket.data.exp * 1000 - Date.now()
      const timer = setTimeout(() => socket.disconnect(true), Math.max(ms, 0))
      timer.unref?.()
      socket.once('disconnect', () => clearTimeout(timer))
    }

    // `join` is kept for client compatibility; the supplied id is ignored in favour of the token's id
    socket.on('join', () => {
      if (!hasChat(user)) return
      socket.join(CHAT_ROOM)
      if (!online.has(user.id)) online.set(user.id, new Set())
      online.get(user.id).add(socket.id)
      broadcastOnline()
    })

    const goOffline = () => markOffline(socket)
    socket.on('leave', goOffline)
    socket.on('logout', goOffline)

    socket.on('new_message', (data) => {
      if (!hasChat(user) || !isId(data?.to)) return
      io.to(userRoom(Number(data.to))).emit('new_message', { from: user.id, to: Number(data.to) })
    })

    socket.on('video-call', (data) => {
      if (!hasChat(user) || !isId(data?.to)) return
      const name = typeof data?.name === 'string' ? data.name.slice(0, 100) : ''
      io.to(userRoom(Number(data.to))).emit('video-call', { from: user.id, to: Number(data.to), name })
    })

    socket.on('join room', (roomID) => {
      const match = callRoomPattern.exec(String(roomID))
      if (!match || !hasChat(user)) return
      if (![match[1], match[2]].includes(String(user.id))) return

      const members = callRooms.get(roomID) || new Set()
      if (!members.has(socket.id) && members.size >= 2) return
      const other = Array.from(members).find((sid) => sid !== socket.id)
      members.add(socket.id)
      callRooms.set(roomID, members)
      socket.data.callRoom = roomID
      if (other) {
        socket.emit('other user', other)
        socket.to(other).emit('user joined', socket.id)
      }
    })

    const sharesRoom = (target) => {
      const room = socket.data.callRoom
      return !!room && callRooms.get(room)?.has(target) && target !== socket.id
    }

    socket.on('offer', (payload) => {
      if (sharesRoom(payload?.target)) io.to(payload.target).emit('offer', payload)
    })
    socket.on('answer', (payload) => {
      if (sharesRoom(payload?.target)) io.to(payload.target).emit('answer', payload)
    })
    socket.on('ice-candidate', (incoming) => {
      if (sharesRoom(incoming?.target)) io.to(incoming.target).emit('ice-candidate', incoming.candidate)
    })

    socket.on('disconnect', () => {
      markOffline(socket)
      const room = socket.data.callRoom
      if (room && callRooms.has(room)) {
        callRooms.get(room).delete(socket.id)
        if (callRooms.get(room).size === 0) callRooms.delete(room)
      }
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error?.message)
    })
  })

  return io
}

const CATALOG_PATHS = {
  '/api/courses': ['Courses', 'Trendings'],
  '/api/chapters': ['Courses', 'Chapters'],
  '/api/categories': ['Categories', 'Courses'],
  '/api/trendings': ['Trendings', 'Courses'],
  '/api/corouselitems': ['CorouselItems'],
  '/api/userratings': ['Courses', 'UserRatings'],
}

/* Express middleware: after any successful write to a catalogue route, tell every connected client what to refresh. */
const catalogBroadcaster = (app) => (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const prefix = Object.keys(CATALOG_PATHS).find((p) => req.originalUrl.startsWith(p))
    if (prefix) {
      res.on('finish', () => {
        if (res.statusCode >= 400) return
        app.locals.io?.of('/catalog').emit('catalog:changed', { tags: CATALOG_PATHS[prefix], at: Date.now() })
      })
    }
  }
  next()
}

module.exports = { createSocketServer, catalogBroadcaster, verifyHandshakeToken, userRoom, CHAT_ROOM }
