/* Turns an uploaded file (JSON or CSV) into the payload of POST /api/quizzes/import.
 * Pure functions, no React: tests/quiz-import-client.test.js loads this file and exercises it.
 *
 * CSV layout - one row per question; rows with the same quiz_title + category + year form one quiz:
 *   quiz_title, category, year, diff_level, description, time_minutes, pass_mark, question, explanation,
 *   answer_1 ... answer_6, correct
 * `correct` is the number (1-6) or letter (A-F) of the right answer. The first row of a quiz supplies its details. */

const MAX_ANSWER_COLUMNS = 6;
const REQUIRED = ['quiz_title', 'question', 'answer_1', 'answer_2', 'correct'];

/* RFC 4180 parser: quoted fields, doubled quotes, commas and line breaks inside quotes, CRLF, BOM. */
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text ?? '').replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
};

const toPositiveInt = (value) => {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export const csvToPayload = (text) => {
  const errors = [];
  const rows = parseCsv(text);
  if (rows.length < 2) return { payload: null, errors: ['The file has no data rows.'] };
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const missing = REQUIRED.filter((name) => !header.includes(name));
  if (missing.length) return { payload: null, errors: [`Missing column(s): ${missing.join(', ')}`] };
  const col = (name) => header.indexOf(name);

  const quizzes = new Map();
  rows.slice(1).forEach((cells, index) => {
    const line = index + 2; // spreadsheet row number
    const get = (name) => (col(name) >= 0 ? String(cells[col(name)] ?? '').trim() : '');
    const title = get('quiz_title');
    const question = get('question');
    if (!title) { errors.push(`Row ${line}: quiz_title is empty.`); return; }
    if (!question) { errors.push(`Row ${line}: question is empty.`); return; }

    const answers = [];
    for (let n = 1; n <= MAX_ANSWER_COLUMNS; n += 1) {
      const text = get(`answer_${n}`);
      if (text) answers.push({ n, title: text });
    }
    if (answers.length < 2) { errors.push(`Row ${line}: at least two answers are needed.`); return; }

    const raw = get('correct').toUpperCase();
    const asNumber = /^\d+$/.test(raw) ? Number(raw) : raw.length === 1 && raw >= 'A' && raw <= 'F' ? raw.charCodeAt(0) - 64 : NaN;
    const correct = answers.find((a) => a.n === asNumber);
    if (!correct) { errors.push(`Row ${line}: "correct" must be the number or letter of a filled-in answer.`); return; }

    const key = [title, get('category'), get('year')].join('\u0001');
    if (!quizzes.has(key)) {
      const time = toPositiveInt(get('time_minutes'));
      const passMark = get('pass_mark') === '' ? null : Number(get('pass_mark'));
      if (passMark !== null && !(Number.isInteger(passMark) && passMark >= 0 && passMark <= 100)) {
        errors.push(`Row ${line}: pass_mark must be a whole number from 0 to 100.`);
      }
      quizzes.set(key, {
        title,
        category: get('category') || undefined,
        year: get('year') || undefined,
        diff_level: get('diff_level') || undefined,
        quiz_description: get('description') || undefined,
        time: time ? time * 60 : undefined,
        pass_mark: passMark === null || Number.isNaN(passMark) ? undefined : passMark,
        routeState: 'draft',
        questions: [],
      });
    }
    quizzes.get(key).questions.push({
      title: question,
      explanation: get('explanation') || undefined,
      answers: answers.map((a) => ({ title: a.title, correct: a === correct })),
    });
  });

  if (errors.length) return { payload: null, errors };
  return { payload: { quizzes: [...quizzes.values()] }, errors };
};

/* Accepts either the full import object or a bare list of quizzes. */
export const jsonToPayload = (text) => {
  let data;
  try { data = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { return { payload: null, errors: [`Not valid JSON: ${e.message}`] }; }
  const payload = Array.isArray(data) ? { quizzes: data } : data;
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.quizzes) || payload.quizzes.length === 0) {
    return { payload: null, errors: ['Expected {"quizzes": [...]} with at least one quiz.'] };
  }
  return { payload: { categories: payload.categories, titles: payload.titles, quizzes: payload.quizzes }, errors: [] };
};

export const parseImportFile = (text, fileName = '') => (/\.csv$/i.test(fileName) ? csvToPayload(text) : jsonToPayload(text));

export const summarize = (payload) => ({
  quizzes: payload?.quizzes?.length ?? 0,
  questions: (payload?.quizzes ?? []).reduce((n, q) => n + (q?.questions?.length ?? 0), 0),
});

export const SAMPLE_CSV = [
  'quiz_title,category,year,diff_level,description,time_minutes,pass_mark,question,explanation,answer_1,answer_2,answer_3,answer_4,correct',
  'Grade 12 Biology,Biology,2013/2014,Medium,Cells and genetics,10,60,Powerhouse of the cell?,Mitochondria make ATP,Nucleus,Mitochondria,Ribosome,,B',
  'Grade 12 Biology,Biology,2013/2014,,,,,2 + 2 = ?,,3,4,5,6,2',
].join('\n');

export const SAMPLE_JSON = JSON.stringify({
  categories: [{ category: 'Biology' }],
  titles: ['Grade 12'],
  quizzes: [{
    category: 'Biology', title: 'Grade 12 Biology', year: '2013/2014', diff_level: 'Medium', time: 600, pass_mark: 60, routeState: 'draft',
    questions: [{ title: 'Powerhouse of the cell?', explanation: 'Mitochondria make ATP', answers: [{ title: 'Nucleus' }, { title: 'Mitochondria', correct: true }, { title: 'Ribosome' }] }],
  }],
}, null, 2);
