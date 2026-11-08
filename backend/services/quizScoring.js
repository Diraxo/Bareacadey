/* Quiz scoring, identical to what the shipped mobile app does on the device (bare/app/QuizDetails.jsx):
 *   correct   = questions whose selected answer id equals the question's correct answer id
 *   percent   = round(correct / total * 100), 0 for an empty quiz
 *   passed    = percent >= pass_mark, where a missing/zero pass_mark means 50
 * Unanswered questions and answers that belong to a different question count as wrong. Nothing is stored. */
const DEFAULT_PASS_MARK = 50

const scoreQuiz = ({ quiz, questions, answers = [] }) => {
  const selected = new Map()
  for (const a of Array.isArray(answers) ? answers : []) {
    const qid = Number(a?.question_id)
    const aid = Number(a?.answer_id)
    if (Number.isInteger(qid) && Number.isInteger(aid)) selected.set(qid, aid)
  }
  const details = questions.map((q) => {
    const selectedAnswer = selected.get(q.id) ?? null
    const validChoice = selectedAnswer !== null && q.answers.some((a) => a.id === selectedAnswer)
    const correctAnswer = q.answers.find((a) => a.is_correct)?.id ?? null
    return {
      question_id: q.id,
      selected_answer_id: validChoice ? selectedAnswer : null,
      correct_answer_id: correctAnswer,
      correct: validChoice && correctAnswer !== null && selectedAnswer === correctAnswer,
    }
  })
  const total = questions.length
  const correct = details.filter((d) => d.correct).length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const pass_mark = quiz?.pass_mark ? Number(quiz.pass_mark) : DEFAULT_PASS_MARK
  return { total, correct, wrong: total - correct, percent, pass_mark, passed: percent >= pass_mark, details }
}

module.exports = { scoreQuiz, DEFAULT_PASS_MARK }
