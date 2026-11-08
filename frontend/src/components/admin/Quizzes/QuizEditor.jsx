import React, { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel,
  IconButton, InputLabel, MenuItem, Paper, Radio, RadioGroup, Select, TextField, Tooltip, Typography,
} from '@mui/material';
import { MdOutlineDeleteOutline, MdOutlineModeEditOutline, MdAdd, MdArrowBack } from 'react-icons/md';
import {
  useGetQuizQuery, useSaveQuizMutation, useAddQuestionMutation, useUpdateQuestionMutation, useDeleteQuestionMutation,
  useGetQuizCategoriesQuery, useAddQuizCategoryMutation,
} from '../../../features/quizzes/quizApiSlice';

const errorText = (error) => error?.data?.message || error?.data?.error || (typeof error?.data === 'string' ? error.data : 'Something went wrong');
const blankAnswers = () => [{ title: '' }, { title: '' }, { title: '' }, { title: '' }];

/* ---------- one question: text, explanation, 2-10 answers, exactly one correct ---------- */
const QuestionDialog = ({ open, question, onClose, onSave, saving }) => {
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [answers, setAnswers] = useState(blankAnswers());
  const [correct, setCorrect] = useState(0);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (!open) return;
    setProblem('');
    if (question) {
      setTitle(question.title);
      setExplanation(question.explanation || '');
      setAnswers(question.answers.map((a) => ({ id: a.id, title: a.title })));
      setCorrect(Math.max(0, question.answers.findIndex((a) => a.is_correct)));
    } else {
      setTitle(''); setExplanation(''); setAnswers(blankAnswers()); setCorrect(0);
    }
  }, [open, question]);

  const setAnswer = (index, value) => setAnswers((list) => list.map((a, i) => (i === index ? { ...a, title: value } : a)));
  const removeAnswer = (index) => {
    setAnswers((list) => list.filter((_, i) => i !== index));
    setCorrect((c) => (index < c ? c - 1 : index === c ? 0 : c));
  };

  const submit = () => {
    const filled = answers.map((a, i) => ({ ...a, i })).filter((a) => a.title.trim());
    if (!title.trim()) return setProblem('Write the question.');
    if (filled.length < 2) return setProblem('Give at least two answers.');
    if (!filled.some((a) => a.i === correct)) return setProblem('Mark one of the filled-in answers as correct.');
    setProblem('');
    onSave({
      title: title.trim(),
      explanation: explanation.trim() || null,
      answers: filled.map((a) => ({ ...(a.id ? { id: a.id } : {}), title: a.title.trim(), correct: a.i === correct })),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{question ? 'Edit question' : 'Add question'}</DialogTitle>
      <DialogContent>
        <TextField label="Question" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth multiline minRows={2} margin="normal" autoFocus />
        <Typography variant="subtitle2" sx={{ mt: 1 }}>Answers (select the correct one)</Typography>
        <RadioGroup value={String(correct)} onChange={(e) => setCorrect(Number(e.target.value))}>
          {answers.map((a, i) => (
            <Box key={a.id ?? `new-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel value={String(i)} control={<Radio inputProps={{ 'aria-label': `Answer ${i + 1} is correct` }} />} label="" sx={{ mr: 0 }} />
              <TextField size="small" label={`Answer ${i + 1}`} value={a.title} onChange={(e) => setAnswer(i, e.target.value)} fullWidth margin="dense" />
              <Tooltip title="Remove answer"><span><IconButton aria-label={`Remove answer ${i + 1}`} disabled={answers.length <= 2} onClick={() => removeAnswer(i)}><MdOutlineDeleteOutline /></IconButton></span></Tooltip>
            </Box>
          ))}
        </RadioGroup>
        <Button size="small" startIcon={<MdAdd />} disabled={answers.length >= 10} onClick={() => setAnswers((l) => [...l, { title: '' }])}>Add answer</Button>
        <TextField label="Explanation (shown after answering, optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} fullWidth multiline minRows={2} margin="normal" />
        {problem && <Typography color="error" role="alert">{problem}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>Save question</Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- quiz details + its questions ---------- */
const QuizEditor = ({ quizId, onClose, onCreated, notify }) => {
  const { data: quiz, isLoading, isError, error } = useGetQuizQuery(quizId, { skip: !quizId });
  const { data: categories = [] } = useGetQuizCategoriesQuery();
  const [saveQuiz, { isLoading: saving }] = useSaveQuizMutation();
  const [addQuestion, { isLoading: adding }] = useAddQuestionMutation();
  const [updateQuestion, { isLoading: updating }] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [addCategory] = useAddQuizCategoryMutation();

  const [form, setForm] = useState({ title: '', year: '', diff_level: '', quiz_description: '', minutes: '', pass_mark: '', category_id: '' });
  const [questionDialog, setQuestionDialog] = useState({ open: false, question: null });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (!quiz) return;
    setForm({
      title: quiz.title || '', year: quiz.year || '', diff_level: quiz.diff_level || '', quiz_description: quiz.quiz_description || '',
      minutes: quiz.time ? String(Math.round(quiz.time / 60)) : '', pass_mark: quiz.pass_mark != null ? String(quiz.pass_mark) : '',
      category_id: quiz.category_id ?? '',
    });
  }, [quiz]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submitDetails = async () => {
    const minutes = form.minutes === '' ? null : Number(form.minutes);
    const pass = form.pass_mark === '' ? null : Number(form.pass_mark);
    if (!form.title.trim()) return notify('error', 'The quiz needs a title.');
    if (minutes !== null && !(Number.isFinite(minutes) && minutes > 0)) return notify('error', 'Time must be a positive number of minutes.');
    if (pass !== null && !(Number.isInteger(pass) && pass >= 0 && pass <= 100)) return notify('error', 'Pass mark must be a whole number from 0 to 100.');
    const body = {
      id: quizId || undefined, title: form.title.trim(), year: form.year.trim() || null, diff_level: form.diff_level.trim() || null,
      quiz_description: form.quiz_description || null, time: minutes === null ? null : Math.round(minutes * 60), pass_mark: pass,
      category_id: form.category_id === '' ? null : form.category_id,
      ...(quizId ? { routeState: quiz?.routeState } : {}), // keep the current state when only editing details
    };
    const res = await saveQuiz(body);
    if (res.error) return notify('error', errorText(res.error));
    notify('success', quizId ? 'Quiz saved.' : 'Quiz created. Now add its questions.');
    if (!quizId) onCreated(res.data.id);
  };

  const createCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await addCategory({ category: newCategory.trim() });
    if (res.error) return notify('error', errorText(res.error));
    setForm((f) => ({ ...f, category_id: res.data.id }));
    setNewCategory('');
  };

  const saveQuestion = async (body) => {
    const editing = questionDialog.question;
    const res = editing ? await updateQuestion({ id: editing.id, ...body }) : await addQuestion({ quizId, ...body });
    if (res.error) return notify('error', errorText(res.error));
    setQuestionDialog({ open: false, question: null });
    notify('success', editing ? 'Question updated.' : 'Question added.');
  };

  const removeQuestion = async (question) => {
    if (!window.confirm('Delete this question and its answers?')) return;
    const res = await deleteQuestion(question.id);
    if (res.error) notify('error', errorText(res.error));
    else notify('success', 'Question deleted.');
  };

  if (quizId && isLoading) return <CircularProgress />;
  if (quizId && isError) return (<Box><Button startIcon={<MdArrowBack />} onClick={onClose}>Back</Button><Typography color="error">{errorText(error)}</Typography></Box>);

  const questions = quiz?.questions || [];
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button startIcon={<MdArrowBack />} onClick={onClose}>All quizzes</Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{quizId ? 'Edit quiz' : 'New quiz'}</Typography>
        {quizId && <Chip label={quiz?.routeState === 'published' ? 'Published' : 'Draft'} color={quiz?.routeState === 'published' ? 'success' : 'default'} />}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField label="Title" value={form.title} onChange={set('title')} fullWidth margin="dense" required />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
          <TextField label="Year (e.g. 2013/2014)" value={form.year} onChange={set('year')} size="small" />
          <TextField label="Difficulty (e.g. Easy, Medium, Hard)" value={form.diff_level} onChange={set('diff_level')} size="small" />
          <TextField label="Time in minutes (empty = 30 s per question)" value={form.minutes} onChange={set('minutes')} size="small" type="number" inputProps={{ min: 1 }} />
          <TextField label="Pass mark % (empty = 50)" value={form.pass_mark} onChange={set('pass_mark')} size="small" type="number" inputProps={{ min: 0, max: 100 }} />
          <FormControl size="small">
            <InputLabel id="quiz-category">Category</InputLabel>
            <Select labelId="quiz-category" label="Category" value={form.category_id} onChange={set('category_id')}>
              <MenuItem value="">None</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.category}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField label="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} size="small" fullWidth />
            <Button onClick={createCategory} disabled={!newCategory.trim()}>Add</Button>
          </Box>
        </Box>
        <TextField label="Description" value={form.quiz_description} onChange={set('quiz_description')} fullWidth multiline minRows={2} margin="normal" />
        <Button variant="contained" onClick={submitDetails} disabled={saving}>{quizId ? 'Save details' : 'Create quiz'}</Button>
      </Paper>

      {quizId && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Questions ({questions.length})</Typography>
            <Button variant="contained" startIcon={<MdAdd />} onClick={() => setQuestionDialog({ open: true, question: null })}>Add question</Button>
          </Box>
          {questions.length === 0 && <Typography color="text.secondary">No questions yet. A quiz needs at least one before it can be published.</Typography>}
          {questions.map((question, index) => (
            <Box key={question.id} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1.5, display: 'flex', gap: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{index + 1}. {question.title}</Typography>
                {question.answers.map((a) => (
                  <Typography key={a.id} variant="body2" sx={{ pl: 2, color: a.is_correct ? 'success.main' : 'text.primary', fontWeight: a.is_correct ? 600 : 400 }}>
                    {a.is_correct ? '✔ ' : '• '}{a.title}
                  </Typography>
                ))}
                {question.explanation && <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>Explanation: {question.explanation}</Typography>}
              </Box>
              <Tooltip title="Edit question"><IconButton aria-label={`Edit question ${index + 1}`} onClick={() => setQuestionDialog({ open: true, question })}><MdOutlineModeEditOutline /></IconButton></Tooltip>
              <Tooltip title="Delete question"><IconButton aria-label={`Delete question ${index + 1}`} onClick={() => removeQuestion(question)}><MdOutlineDeleteOutline /></IconButton></Tooltip>
            </Box>
          ))}
        </Paper>
      )}

      <QuestionDialog
        open={questionDialog.open}
        question={questionDialog.question}
        saving={adding || updating}
        onClose={() => setQuestionDialog({ open: false, question: null })}
        onSave={saveQuestion}
      />
    </Box>
  );
};

export default QuizEditor;
