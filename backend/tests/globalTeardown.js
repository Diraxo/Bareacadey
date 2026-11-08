/* The upload tests leave express-fileupload temp files behind; remove them so a test run never litters files/uploads/temp. */
const fs = require('fs')
const path = require('path')

module.exports = async () => {
  const dir = path.join(__dirname, '..', 'files', 'uploads', 'temp')
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (/^tmp-\d/.test(name) || /^req-[0-9a-f]{16}$/.test(name)) fs.rmSync(path.join(dir, name), { force: true, recursive: true })
  }
}
