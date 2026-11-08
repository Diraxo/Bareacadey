/* Course price shown to the student. Mirrors backend/services/pricing.js (the server recomputes the price at checkout,
 * so this only affects what is displayed): a percentage discount takes that percentage OFF the main price,
 * e.g. 20% off 1000 Birr = 800 Birr. tests/pricing.test.js checks both implementations agree.
 * Keep this file identical to bare/components/utils/coursePrice.js. */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const isDiscountActive = (course, now = new Date()) => {
  if (!course?.enable_discount) return false;
  const start = course.discount_start_date ? new Date(course.discount_start_date) : null;
  const end = course.discount_end_date ? new Date(course.discount_end_date) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return now >= start && now <= end;
};

/* What to charge: the discounted price while a discount is active, otherwise the main price. */
export const getCoursePrice = (course, now = new Date()) => {
  const main = Number(course?.main_price) || 0;
  if (!isDiscountActive(course, now)) return round2(main);
  const pct = Number(course.discount_percentage);
  if (Number.isFinite(pct) && pct > 0 && pct < 100) return round2(main - (main * pct) / 100);
  const fixed = Number(course.discounted_price);
  if (Number.isFinite(fixed) && fixed > 0) return round2(fixed);
  return round2(main);
};

/* The list views show "<struck-through main price> <discounted price>" when this is > 0, else just the main price. */
export const getDiscountedAmount = (course, now = new Date()) => {
  const price = getCoursePrice(course, now);
  return isDiscountActive(course, now) && price > 0 && price !== round2(Number(course?.main_price) || 0) ? price : 0;
};
