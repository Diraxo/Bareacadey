/* Test environment: in-memory SQLite (see database.js) and throw-away secrets. No real service is contacted. */
process.env.NODE_ENV = 'test'
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-0000000000000000000001'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-000000000000000000002'
process.env.SESSION_SECRET = 'test-session-secret-000000000000000000003'
process.env.MEDIA_TOKEN_SECRET = 'test-media-secret-0000000000000000000004'
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN = '1d'
process.env.EMAIL_TOKEN_EXPIRES_IN = '1h'
process.env.API_PUBLIC_URL = 'https://api.test.example'
process.env.FRONTEND_URL = 'https://www.test.example'
process.env.MOBILE_APP_KEY = 'test-mobile-key'
process.env.CHAPA_AUTH = 'test-chapa-key'
process.env.DB_NAME = 'unused'
process.env.DB_USER = 'unused'
delete process.env.CLIENT_ID
delete process.env.CLIENT_SECRET
// belt and braces: even if some module loaded a .env file, real credentials must not be reachable from tests
for (const key of ['EMAIL_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'BACKUP_PASSWORD', 'GEOTAB_USERNAME', 'GEOTAB_PASSWORD']) delete process.env[key]
// upload-start rate limit: the suites send hundreds of uploads in seconds; the limit itself is tested explicitly
process.env.UPLOAD_INIT_RATE_LIMIT_PER_MIN = '100000'
process.env.UPLOAD_PUBLIC_RATE_LIMIT_PER_HOUR = '100000'
process.env.COURSES_ARE_FREE = 'false' // the existing payment suites exercise the (kept) paid path; free-courses.test.js turns it on
