import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { MdOutlineDeleteOutline, MdOutlineModeEditOutline, MdOutlineFileUpload, MdAdd } from 'react-icons/md';
import { setAlert } from '../../../app/slices/commonSlice';
import { useGetQuizzesQuery, useSaveQuizMutation, useDeleteQuizMutation } from '../../../features/quizzes/quizApiSlice';
import QuizEditor from './QuizEditor';
import QuizImportDialog from './QuizImportDialog';

export const errorText = (error) => error?.data?.message || error?.data?.error || (typeof error?.data === 'string' ? error.data : 'Something went wrong');

const Quizzes = () => {
  const dispatch = useDispatch();
  const { data: quizzes = [], isLoading, isError, error } = useGetQuizzesQuery();
  const [saveQuiz] = useSaveQuizMutation();
  const [deleteQuiz, { isLoading: deleting }] = useDeleteQuizMutation();
  const [editing, setEditing] = useState(null); // null = list, 'new' = blank form, number = quiz id
  const [importing, setImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notify = (severity, message) => dispatch(setAlert({ openAlert: true, severity, message }));

  const togglePublish = async (quiz) => {
    const publish = quiz.routeState !== 'published';
    const res = await saveQuiz({
      id: quiz.id, title: quiz.title, year: quiz.year, diff_level: quiz.diff_level, quiz_description: quiz.quiz_description,
      time: quiz.time, pass_mark: quiz.pass_mark, category_id: quiz.category_id, routeState: publish ? 'published' : 'draft',
    });
    if (res.error) notify('error', errorText(res.error));
    else notify('success', publish ? 'Quiz published. Students can see it now.' : 'Quiz unpublished.');
  };

  const confirmAndDelete = async () => {
    const res = await deleteQuiz(confirmDelete.id);
    setConfirmDelete(null);
    if (res.error) notify('error', errorText(res.error));
    else notify('success', 'Quiz deleted.');
  };

  if (editing !== null) {
    return <QuizEditor quizId={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onCreated={(id) => setEditing(id)} notify={notify} />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Quizzes</Typography>
        <Button variant="outlined" startIcon={<MdOutlineFileUpload />} onClick={() => setImporting(true)}>Import</Button>
        <Button variant="contained" startIcon={<MdAdd />} onClick={() => setEditing('new')}>New quiz</Button>
      </Box>
      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
        Students only see published quizzes. The original quiz content could not be recovered, so quizzes start empty: create them here or import a file.
      </Typography>

      {isLoading && <CircularProgress />}
      {isError && <Typography color="error">{errorText(error)}</Typography>}
      {!isLoading && !isError && quizzes.length === 0 && (
        <Paper sx={{ p: 3 }}><Typography>No quizzes yet. Use “New quiz” or “Import”.</Typography></Paper>
      )}
      {quizzes.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>Year</TableCell><TableCell>Level</TableCell>
                <TableCell align="right">Questions</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id} hover>
                  <TableCell>{quiz.title}</TableCell>
                  <TableCell>{quiz.year || '-'}</TableCell>
                  <TableCell>{quiz.diff_level || '-'}</TableCell>
                  <TableCell align="right">{quiz.question_count ?? 0}</TableCell>
                  <TableCell>
                    <Chip size="small" label={quiz.routeState === 'published' ? 'Published' : 'Draft'} color={quiz.routeState === 'published' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" onClick={() => togglePublish(quiz)}>{quiz.routeState === 'published' ? 'Unpublish' : 'Publish'}</Button>
                    <Tooltip title="Edit"><IconButton aria-label={`Edit ${quiz.title}`} onClick={() => setEditing(quiz.id)}><MdOutlineModeEditOutline /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton aria-label={`Delete ${quiz.title}`} onClick={() => setConfirmDelete(quiz)}><MdOutlineDeleteOutline /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <QuizImportDialog open={importing} onClose={() => setImporting(false)} notify={notify} />

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this quiz?</DialogTitle>
        <DialogContent>
          <Typography>“{confirmDelete?.title}” and all of its questions and answers will be permanently deleted. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleting} onClick={confirmAndDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quizzes;
