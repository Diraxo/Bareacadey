const { resetDb, api, models, sequelize, MOBILE } = require('./helpers')

beforeAll(resetDb)

test('/healthz answers without the database and reports the release', async () => {
  const res = await api().http.get('/healthz')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok', release: expect.any(String) })
  expect(res.body.release).not.toBe('unknown')
})

test('/healthz?deep=1 reads the main tables and says so', async () => {
  const res = await api().http.get('/healthz?deep=1')
  expect(res.status).toBe(200)
  expect(res.body.schema).toBe('ok')
})

test('/healthz?deep=1 answers 503 when the database no longer matches the code', async () => {
  const qi = sequelize.getQueryInterface()
  await qi.removeColumn('Users', 'full_name') // the same kind of drift as a removed column the old code still reads
  try {
    const res = await api().http.get('/healthz?deep=1')
    expect(res.status).toBe(503)
    expect(res.body.status).toBe('schema_mismatch')
  } finally {
    await qi.addColumn('Users', 'full_name', { type: sequelize.constructor.STRING, allowNull: true, defaultValue: '' })
  }
})
