const http = require('http')
const jwt = require('jsonwebtoken')
const { io: connect } = require('socket.io-client')
const { createSocketServer } = require('../realtime/socket')

const sign = (id, permissions, opts = {}) =>
  jwt.sign({ id, permissions }, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS256', expiresIn: '15m', ...opts })

let server, io, url
const clients = []

const client = (token, extra = {}) => {
  const c = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false, auth: token ? { token } : {}, ...extra })
  clients.push(c)
  return c
}
const connected = (c) => new Promise((resolve, reject) => { c.on('connect', () => resolve(c)); c.on('connect_error', reject) })
const waitFor = (c, event, ms = 400) => new Promise((resolve) => { const t = setTimeout(() => resolve(null), ms); c.once(event, (d) => { clearTimeout(t); resolve(d) }) })
const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms))

beforeAll((done) => {
  server = http.createServer()
  io = createSocketServer(server)
  server.listen(0, '127.0.0.1', () => { url = `http://127.0.0.1:${server.address().port}`; done() })
})
afterEach(() => { while (clients.length) clients.pop().close() })
afterAll((done) => { io.close(); server.close(done) })

const CHAT = ['Chat']

describe('handshake authentication (S5)', () => {
  test('connections without a token are refused', async () => {
    await expect(connected(client(null))).rejects.toThrow(/unauthorized/)
  })
  test.each([
    ['garbage', 'abc.def.ghi'],
    ['signed with another secret', jwt.sign({ id: 1 }, 'other-secret-other-secret-other-secret')],
    ['expired', sign(1, CHAT, { expiresIn: -10 })],
    ['alg none', Buffer.from('{"alg":"none"}').toString('base64url') + '.' + Buffer.from('{"id":1}').toString('base64url') + '.'],
  ])('%s token is refused', async (_n, token) => {
    await expect(connected(client(token))).rejects.toThrow(/unauthorized/)
  })
  test('a token for a non-user payload is refused', async () => {
    await expect(connected(client(sign('abc', CHAT)))).rejects.toThrow(/unauthorized/)
  })
  test('a valid access token connects', async () => {
    await connected(client(sign(1, CHAT)))
  })
  test('single-purpose tokens signed with other secrets do not connect', async () => {
    const media = jwt.sign({ typ: 'media', id: 1 }, process.env.MEDIA_TOKEN_SECRET)
    await expect(connected(client(media))).rejects.toThrow(/unauthorized/)
  })
})

describe('private messages are delivered only to the recipient', () => {
  test('new_message reaches the addressee and nobody else', async () => {
    const [a, b, c] = [client(sign(1, CHAT)), client(sign(2, CHAT)), client(sign(3, CHAT))]
    await Promise.all([a, b, c].map(connected))
    const gotB = waitFor(b, 'new_message')
    const gotC = waitFor(c, 'new_message')
    const gotA = waitFor(a, 'new_message')
    a.emit('new_message', { from: 1, to: 2 })
    expect(await gotB).toEqual({ from: 1, to: 2 })
    expect(await gotC).toBeNull()
    expect(await gotA).toBeNull()
  })

  test('the sender id comes from the token, a spoofed "from" is ignored', async () => {
    const [a, b] = [client(sign(1, CHAT)), client(sign(2, CHAT))]
    await Promise.all([a, b].map(connected))
    const gotB = waitFor(b, 'new_message')
    a.emit('new_message', { from: 99, to: 2 })
    expect(await gotB).toEqual({ from: 1, to: 2 })
  })

  test('users without the Chat permission can neither send nor receive', async () => {
    const [student, b] = [client(sign(5, ['Viewer'])), client(sign(2, CHAT))]
    await Promise.all([student, b].map(connected))
    const gotB = waitFor(b, 'new_message')
    student.emit('new_message', { from: 5, to: 2 })
    expect(await gotB).toBeNull()

    const gotStudent = waitFor(student, 'new_message')
    b.emit('new_message', { from: 2, to: 5 })
    expect(await gotStudent).toBeNull()
  })

  test('video-call invitations are addressed, not broadcast', async () => {
    const [a, b, c] = [client(sign(1, CHAT)), client(sign(2, CHAT)), client(sign(3, CHAT))]
    await Promise.all([a, b, c].map(connected))
    const gotB = waitFor(b, 'video-call')
    const gotC = waitFor(c, 'video-call')
    a.emit('video-call', { from: 1, to: 2, name: 'Ada' })
    expect(await gotB).toEqual({ from: 1, to: 2, name: 'Ada' })
    expect(await gotC).toBeNull()
  })

  test('malformed payloads are ignored without crashing the server', async () => {
    const a = client(sign(1, CHAT))
    await connected(a)
    a.emit('new_message', null)
    a.emit('new_message', { to: 'x' })
    a.emit('video-call', undefined)
    a.emit('offer', 'nonsense')
    await settle()
    expect(a.connected).toBe(true)
  })
})

describe('presence list', () => {
  test('is only sent to chat users and is built from verified identities', async () => {
    const [a, student] = [client(sign(1, CHAT)), client(sign(5, ['Viewer']))]
    await Promise.all([a, student].map(connected))
    const toStudent = waitFor(student, 'onlineUsers')
    const toA = waitFor(a, 'onlineUsers')
    a.emit('join', 42) // spoofed id is ignored
    student.emit('join', 5) // not allowed to join presence
    expect(await toA).toEqual([1])
    expect(await toStudent).toBeNull()
  })
})

describe('video-call rooms', () => {
  test('only the two named users can join, and signalling stays inside the room', async () => {
    const [caller, callee, intruder] = [client(sign(1, CHAT)), client(sign(2, CHAT)), client(sign(3, CHAT))]
    await Promise.all([caller, callee, intruder].map(connected))

    caller.emit('join room', '1-2')
    await settle()
    const sawOther = waitFor(callee, 'other user')
    callee.emit('join room', '1-2')
    expect(await sawOther).toBe(caller.id)

    // an outsider cannot enter the room …
    const intruderSees = waitFor(intruder, 'other user')
    intruder.emit('join room', '1-2')
    expect(await intruderSees).toBeNull()

    // … and cannot inject signalling into somebody else’s call
    const gotOffer = waitFor(callee, 'offer')
    intruder.emit('offer', { target: callee.id, sdp: 'evil' })
    expect(await gotOffer).toBeNull()

    // members can
    const genuine = waitFor(callee, 'offer')
    caller.emit('offer', { target: callee.id, sdp: 'ok' })
    expect((await genuine).sdp).toBe('ok')
  })

  test('room names must match the caller-callee pattern', async () => {
    const [a, b] = [client(sign(1, CHAT)), client(sign(2, CHAT))]
    await Promise.all([a, b].map(connected))
    const seen = waitFor(b, 'other user')
    a.emit('join room', 'lobby')
    b.emit('join room', 'lobby')
    expect(await seen).toBeNull()
  })

  test('a third socket cannot join a full room', async () => {
    const [a, a2, b] = [client(sign(1, CHAT)), client(sign(1, CHAT)), client(sign(2, CHAT))]
    await Promise.all([a, a2, b].map(connected))
    a.emit('join room', '1-2'); b.emit('join room', '1-2')
    await settle()
    const seen = waitFor(a2, 'other user')
    a2.emit('join room', '1-2')
    expect(await seen).toBeNull()
  })
})

describe('token expiry', () => {
  test('a connection is dropped when its access token expires', async () => {
    const c = client(sign(1, CHAT, { expiresIn: 1 }))
    await connected(c)
    const closed = await new Promise((resolve) => { const t = setTimeout(() => resolve(false), 3500); c.on('disconnect', () => { clearTimeout(t); resolve(true) }) })
    expect(closed).toBe(true)
  })
})
