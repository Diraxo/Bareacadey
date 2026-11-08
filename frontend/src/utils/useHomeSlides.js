import { useCallback, useEffect, useRef, useState } from 'react'
import { useGetPublicCorouselItemsQuery } from '../features/auth/publicApiSlice'
import { normalizeSlides, preloadSlides, slidesKey } from './sliderImages'
import { createRetryLoop } from './sliderRetry'

const RETRY_MS = 15000
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false

/* status: 'loading' | 'ready' | 'empty' | 'unavailable'.
 * The list is always requested fresh when the home page opens (the API answers `no-store`, and nothing is kept between
 * visits), is re-checked when the tab comes back into view or the connection returns, and a newer list replaces the
 * one on screen only after its pictures are downloaded. While nothing could be loaded it is retried every 15 seconds
 * (one request at a time, none while offline) until the server answers. */
const useHomeSlides = () => {
  const { data, isError, refetch } = useGetPublicCorouselItemsQuery(undefined, { refetchOnMountOrArgChange: true })
  const [view, setView] = useState({ status: 'loading', slides: [], key: '' })
  const [reload, setReload] = useState(0) // bumped after a good answer, so its pictures are tried again
  const [giveUps, setGiveUps] = useState(0) // bumped when a good answer's pictures all failed, so retrying restarts

  // every request (tab focus, connectivity, retry timer) goes through here: one at a time, answers are shared
  const inflight = useRef(null)
  const check = useCallback(() => {
    if (!inflight.current) {
      inflight.current = Promise.resolve()
        .then(() => refetch())
        .then((r) => {
          const good = !!r?.isSuccess && Array.isArray(r.data)
          if (good) setReload((n) => n + 1)
          return good
        })
        .catch(() => false)
        .finally(() => { inflight.current = null })
    }
    return inflight.current
  }, [refetch])

  useEffect(() => {
    let live = true
    const slides = normalizeSlides(data)
    if (data === undefined || slides === null) {
      if (isError || (slides === null && data !== undefined)) setView((v) => (v.status === 'ready' ? v : { status: 'unavailable', slides: [], key: '' }))
      return
    }
    if (slides.length === 0) { setView({ status: 'empty', slides: [], key: '' }); return }
    if (slidesKey(slides) === view.key) return
    preloadSlides(slides).then((loaded) => {
      if (!live) return
      if (loaded.length === 0) {
        setView((v) => (v.status === 'ready' ? v : { status: 'unavailable', slides: [], key: '' }))
        setGiveUps((n) => n + 1)
      } else setView({ status: 'ready', slides: loaded, key: slidesKey(loaded) })
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isError, reload])

  // tab back in view / connection back: re-check (never while the browser is offline, except the online event itself)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState !== 'hidden' && isOnline()) check() }
    const onOnline = () => { check() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', onOnline) }
  }, [check])

  // nothing could be loaded: keep trying in the background; stops by itself once the slider has a decision or on unmount
  useEffect(() => {
    if (view.status !== 'unavailable') return
    const loop = createRetryLoop({ check, isOnline, delayMs: RETRY_MS })
    loop.start()
    window.addEventListener('online', loop.online)
    return () => { window.removeEventListener('online', loop.online); loop.stop() }
  }, [view.status, giveUps, check])

  return view
}

export default useHomeSlides
