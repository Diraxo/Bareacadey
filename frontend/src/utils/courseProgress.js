// Tracks which course videos a learner has watched to the end (per user + course, in this browser)
// and whether we have already asked them to review the course.
const key = (userId, courseId, kind) => `johar:${kind}:${userId}:${courseId}`;

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? null;
  } catch (e) {
    return null;
  }
};

const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};

export const getFinished = (userId, courseId) => read(key(userId, courseId, "finished")) || [];

export const markFinished = (userId, courseId, path) => {
  const list = getFinished(userId, courseId);
  if (!path || list.includes(path)) return list;
  const next = [...list, path];
  write(key(userId, courseId, "finished"), next);
  return next;
};

export const reviewAsked = (userId, courseId) => !!read(key(userId, courseId, "asked"));

export const setReviewAsked = (userId, courseId) => write(key(userId, courseId, "asked"), true);

export const courseVideoPaths = (chapters = []) =>
  chapters.flatMap((c) =>
    (c?.chapter_files || []).filter((f) => String(f?.mimetype).includes("mp4")).map((f) => f?.filepath)
  );

export const isCourseFinished = (chapters, finished) => {
  const paths = courseVideoPaths(chapters);
  return paths.length > 0 && paths.every((p) => finished.includes(p));
};
