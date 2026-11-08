const { resetDb, api, models, MOBILE } = require('./helpers')

beforeAll(resetDb)

const slide = (title, file) => ({ title, subtitle: '', image: JSON.stringify([{ filepath: `/uploads/common/${file}` }]), enable_action_button: false, action_button_type: 'Contact Us' })

test('public slider list: newest first, only slides, picture addresses built, malformed image data does not break it', async () => {
  const { http } = api()
  const empty = await http.get('/api/public/corouselitems').set(MOBILE)
  expect(empty.status).toBe(200)
  expect(empty.body).toEqual([])

  await models.CorouselItem.create(slide('old', 'old.jpg'))
  await models.CorouselItem.create({ ...slide('broken', 'x.jpg'), image: '{not json' })
  await models.CorouselItem.create(slide('new', 'new.jpg'))

  const res = await http.get('/api/public/corouselitems').set(MOBILE)
  expect(res.status).toBe(200)
  expect(res.body.map((s) => s.title)).toEqual(['new', 'broken', 'old'])
  expect(res.body[0].image[0].filepath).toMatch(/^https?:\/\/.+\/uploads\/common\/new\.jpg$/)
  expect(res.body[1].image).toEqual([])
  expect(res.body[0].updatedAt).toBeTruthy()
  // no admin details leak through the public list
  expect(JSON.stringify(res.body)).not.toMatch(/AddedBy|UpdatedBy|full_name/)
})
