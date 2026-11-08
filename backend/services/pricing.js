/* Single definition of what a course costs right now (ETB).
 *
 * Business rule (confirmed by the academy, migration-docs/07): `discount_percentage` is the percentage taken OFF
 * the main price, so a 20 % discount on 1,000 Birr is charged as 800 Birr. Before this fix the code charged
 * `percentage x price / 100` (200 Birr) - the amount of the discount instead of the price after it.
 *
 * Only prices computed from now on are affected. A Payment row stores the amount that was charged when it was created
 * and is never recalculated, so historical transactions keep their recorded value. */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const isDiscountActive = (course, now = new Date()) => {
  if (!course?.enable_discount) return false
  const start = course.discount_start_date ? new Date(course.discount_start_date) : null
  const end = course.discount_end_date ? new Date(course.discount_end_date) : null
  // same window semantics as before (inclusive); a missing date makes the window invalid, not open-ended
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return now >= start && now <= end
}

/* A usable percentage is a number above 0 and below 100. Anything else is ignored: never a negative price, and a
 * 100 % "discount" (free) is not something checkout can process, so it falls back to the next rule. */
const validPercentage = (p) => {
  const n = Number(p)
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null
}

const coursePrice = (course, now = new Date()) => {
  const main = Number(course?.main_price) || 0
  if (!isDiscountActive(course, now)) return round2(main)
  const pct = validPercentage(course.discount_percentage)
  if (pct !== null) return round2(main - (main * pct) / 100)
  const fixed = Number(course.discounted_price)
  // fixed discounted price: unchanged from the original behaviour
  if (Number.isFinite(fixed) && fixed > 0) return round2(fixed)
  return round2(main)
}

module.exports = { coursePrice, isDiscountActive, validPercentage, round2 }
