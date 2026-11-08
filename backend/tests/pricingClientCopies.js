/* Loads the browser/mobile price helpers (ES modules) so that tests can run them under Jest/CommonJS. */
const fs = require('fs')
const path = require('path')

const load = (file) => {
  const src = fs.readFileSync(file, 'utf8').replace(/^export (const|function)/gm, '$1')
  // eslint-disable-next-line no-new-func
  return new Function(`${src}; return { getCoursePrice, getDiscountedAmount, isDiscountActive }`)()
}

const root = path.join(__dirname, '..', '..')
const files = {
  web: path.join(root, 'frontend', 'src', 'components', 'utils', 'coursePrice.js'),
  mobile: path.join(root, 'bare', 'components', 'utils', 'coursePrice.js'),
}
module.exports = {
  files,
  identical: fs.readFileSync(files.web, 'utf8') === fs.readFileSync(files.mobile, 'utf8'),
  clientPrice: Object.entries(files).map(([name, f]) => ({ name, fn: load(f).getCoursePrice, discounted: load(f).getDiscountedAmount })),
}
