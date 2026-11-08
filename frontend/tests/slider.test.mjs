/* The website's home slider only ever shows real, validated slides whose pictures have loaded. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSlides, preloadSlides, loadPicture, slideSrc } from '../src/utils/sliderImages.js'

const rec = (id, extra = {}) => ({ id, title: `T${id}`, updatedAt: '2026-11-01T10:00:00.000Z', image: [{ filepath: `http://internal/uploads/common/s${id}.jpg` }], ...extra })

/* a fake <img>: `behaviour[src]` is 'ok' | 'error' | 'hang' | 'flaky' (fails once) */
const fakeImage = (behaviour, log = []) => class {
  set src(value) {
    log.push(value)
    const how = behaviour[value.split('?')[0].split('/').pop()] ?? 'ok'
    const flakyFirst = how === 'flaky' && log.filter((v) => v === value).length === 1
    if (how === 'hang') return
    queueMicrotask(() => (how === 'error' || flakyFirst ? this.onerror?.() : this.onload?.()))
  }
  decode() { return Promise.resolve() }
}

test('slides: newest first, picture served from the site API, version in the address, invalid ones dropped', () => {
  const out = normalizeSlides([rec(1), rec(3), { id: 2, image: [] }, rec(4, { image: [{ filepath: 'nope' }] }), null], 'https://api.test')
  assert.deepEqual(out.map((s) => s.id), [3, 1])
  assert.equal(out[0].src, `https://api.test/uploads/common/s3.jpg?v=${Date.parse('2026-11-01T10:00:00.000Z')}`)
  assert.equal(normalizeSlides({ error: true }), null)
  assert.deepEqual(normalizeSlides([]), [])
})

test('a replaced picture is a different address (so the browser cache cannot serve the old one)', () => {
  const a = slideSrc(rec(1), 'https://api.test')
  const b = slideSrc(rec(1, { updatedAt: '2026-11-02T10:00:00.000Z' }), 'https://api.test')
  assert.notEqual(a, b)
})

test('only slides whose picture loaded are kept; a failed picture is retried once', async () => {
  const slides = normalizeSlides([rec(1), rec(2), rec(3)], 'https://api.test')
  const log = []
  const ImageCtor = fakeImage({ 's1.jpg': 'error', 's2.jpg': 'flaky' }, log)
  const loaded = await preloadSlides(slides, { ImageCtor, timeoutMs: 50 })
  assert.deepEqual(loaded.map((s) => s.id), [3, 2])
  assert.equal(log.filter((v) => v.includes('s1.jpg')).length, 2)
})

test('a picture that never answers times out instead of blocking the slider forever', async () => {
  const t0 = Date.now()
  const ok = await loadPicture('https://api.test/hang.jpg', { ImageCtor: fakeImage({ 'hang.jpg': 'hang' }), timeoutMs: 30, retries: 0 })
  assert.equal(ok, false)
  assert.ok(Date.now() - t0 < 500)
})

test('the slider has no hardcoded slides or banner fallback', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(new URL('../src/components/landing_page/templates/ecommerce/HomeCorousel.jsx', import.meta.url), 'utf8')
  assert.equal(/Welcome to Bare Academy|bare-logo|Learn · Inform/.test(src), false)
})
