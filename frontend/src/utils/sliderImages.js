/* Helpers for the home slider: slides are validated, newest first, and shown only after their picture is downloaded
 * (the browser keeps it in its cache, so the slider paints with the picture already there). Nothing here invents a
 * slide: the list comes from /api/public/corouselitems and from nowhere else. */

/* The server builds the picture address from the request's host and protocol, which can come back as plain http
 * (blocked on an https page) or an internal host. The pictures are public, so they load from the site's own API address.
 * `?v=` carries the record's last-change time, so a replaced picture is a new address and is downloaded again. */
export const slideSrc = (item, apiUrl = import.meta.env?.VITE_API_URL) => {
  const url = Array.isArray(item?.image) && typeof item.image[0]?.filepath === 'string' ? item.image[0].filepath : ''
  if (!url) return ''
  const changed = Date.parse(item?.updatedAt)
  const version = Number.isFinite(changed) ? `?v=${changed}` : ''
  try {
    const { pathname } = new URL(url)
    return `${apiUrl ? `${apiUrl}${pathname}` : url.split('?')[0]}${version}`
  } catch (e) {
    return ''
  }
}

/* null when the answer is not a slide list at all (the API reports some failures as a JSON object). Slides without a
 * usable id or picture address are dropped. Newest first, whatever order the server used. */
export const normalizeSlides = (raw, apiUrl) => {
  if (!Array.isArray(raw)) return null
  return raw
    .filter((item) => item && item.id != null)
    .map((item) => ({ ...item, src: slideSrc(item, apiUrl) }))
    .filter((slide) => /^https?:\/\//i.test(slide.src))
    .sort((a, b) => Number(b.id) - Number(a.id))
}

export const slidesKey = (slides) => slides.map((s) => `${s.id}|${s.src}|${s.title}|${s.subtitle}|${s.action_message}|${s.enable_action_button}|${s.action_button_type}`).join('\n')

/* Downloads one picture (and decodes it, so painting it does not stall); true only if it really loaded. */
export const loadPicture = (src, { timeoutMs = 8000, retries = 1, ImageCtor = globalThis.Image } = {}) => {
  const attempt = () => new Promise((resolve) => {
    const img = new ImageCtor()
    const timer = setTimeout(() => { img.onload = img.onerror = null; resolve(false) }, timeoutMs)
    img.onload = () => {
      clearTimeout(timer)
      Promise.resolve(img.decode?.()).then(() => resolve(true), () => resolve(true)) // a decode hiccup is not a load failure
    }
    img.onerror = () => { clearTimeout(timer); resolve(false) }
    img.src = src
  })
  return (async () => {
    for (let i = 0; i <= retries; i++) if (await attempt()) return true
    return false
  })()
}

/* The slides whose picture loaded (all downloads in parallel). */
export const preloadSlides = async (slides, options) => {
  const ok = await Promise.all(slides.map((s) => loadPicture(s.src, options)))
  return slides.filter((_, i) => ok[i])
}
