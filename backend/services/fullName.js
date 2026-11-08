/* The single place that turns a request body into a user's full name. Clients send `full_name`; older mobile builds
 * still send `first_name` + `last_name`, which are joined so they keep working. Always returns a trimmed string with
 * inner whitespace collapsed ('' when nothing usable was sent). */
const fullNameFrom = (body = {}) => {
  const raw = body.full_name != null && body.full_name !== ''
    ? body.full_name
    : [body.first_name, body.last_name].filter((p) => typeof p === 'string' && p.trim()).join(' ')
  return typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
}

/* Read-only legacy view for clients that still display first_name / last_name (the mobile app). Never stored. */
const legacyNameParts = (fullName) => {
  const [first = '', ...rest] = String(fullName ?? '').trim().split(/\s+/)
  return { first_name: first, last_name: rest.join(' ') }
}

module.exports = { fullNameFrom, legacyNameParts }
