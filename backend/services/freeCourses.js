/* Every course is free.
 *
 * One switch decides it for the whole backend: COURSES_ARE_FREE (default on; set it to "false" only to bring the
 * old paid behaviour back). While it is on, a course or chapter never needs a payment, whatever the stored price,
 * discount or currency columns still say. Old rows (price 0, 1, discounted, ...) therefore need no data change.
 *
 * Nothing is deleted: Payment rows, the payment routes and the price columns stay as history. The functions here only
 * change how a course is treated and how it is presented to clients. */
const coursesAreFree = () => String(process.env.COURSES_ARE_FREE ?? 'true').trim().toLowerCase() !== 'false'

/* true when this course (or chapter) can be opened without a payment */
const isFreeCourse = (course) => coursesAreFree() || !(Number(course?.main_price) > 0)

/* the stored monetary values, replaced by "free" in everything a student-facing API sends */
const FREE_FIELDS = Object.freeze({
  main_price: 0,
  enable_discount: false,
  discounted_price: 0,
  discount_percentage: 0,
  discount_start_date: null,
  discount_end_date: null,
})

const asFree = (json) => (coursesAreFree() ? { ...json, ...FREE_FIELDS } : json)
const asFreeChapter = (json) => (coursesAreFree() ? { ...json, price: 0 } : json)

module.exports = { coursesAreFree, isFreeCourse, asFree, asFreeChapter, FREE_FIELDS }
