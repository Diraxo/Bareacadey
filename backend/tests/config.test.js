const config = require('../config')

const good = {
  DB_NAME: 'x', DB_USER: 'x', DB_PASSWORD: 'x',
  FRONTEND_URL: 'https://www.example.org', API_PUBLIC_URL: 'https://api.example.org',
  ACCESS_TOKEN_SECRET: 'a'.repeat(40), REFRESH_TOKEN_SECRET: 'b'.repeat(40),
  SESSION_SECRET: 'c'.repeat(40), MEDIA_TOKEN_SECRET: 'd'.repeat(40),
  ACCESS_TOKEN_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_IN: '30d',
}

describe('configuration validation', () => {
  test('a complete production configuration has no problems', () => {
    expect(config.validate(good, true)).toEqual([])
  })

  test.each(['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'MEDIA_TOKEN_SECRET', 'API_PUBLIC_URL', 'FRONTEND_URL', 'DB_NAME'])(
    'missing %s is reported', (key) => {
      const env = { ...good }
      delete env[key]
      expect(config.validate(env, true).join(' ')).toContain(key)
    })

  test('short secrets are rejected in production', () => {
    expect(config.validate({ ...good, ACCESS_TOKEN_SECRET: 'short' }, true).join(' ')).toMatch(/ACCESS_TOKEN_SECRET must be at least 32/)
  })

  test('placeholder values are rejected', () => {
    expect(config.validate({ ...good, SESSION_SECRET: 'change-me-change-me-change-me-change-me' }, true).join(' ')).toMatch(/placeholder/)
  })

  test('secrets must be distinct from each other', () => {
    expect(config.validate({ ...good, REFRESH_TOKEN_SECRET: good.ACCESS_TOKEN_SECRET }, true).join(' ')).toMatch(/must all be different/)
  })

  test('production requires https public URLs and a database password', () => {
    const problems = config.validate({ ...good, API_PUBLIC_URL: 'http://api.example.org', DB_PASSWORD: '' }, true).join(' ')
    expect(problems).toMatch(/API_PUBLIC_URL must be https/)
    expect(problems).toMatch(/DB_PASSWORD/)
  })
})

describe('public URL configuration', () => {
  test('URLs come from configuration, with trailing slashes removed', () => {
    const built = config.build()
    expect(built.urls.api).toBe('https://api.test.example')
    expect(built.urls.frontend).toBe('https://www.test.example')
    expect(built.urls.socket).toBe(built.urls.api)
    expect(built.allowedOrigins).toContain('https://www.test.example')
  })
})
