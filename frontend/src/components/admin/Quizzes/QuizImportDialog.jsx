import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useImportQuizzesMutation } from '../../../features/quizzes/quizApiSlice';
import { parseImportFile, summarize, SAMPLE_CSV, SAMPLE_JSON } from './quizImport';

const errorText = (error) => error?.data?.message || error?.data?.error || (typeof error?.data === 'string' ? error.data : 'Something went wrong');

const download = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

/* Choose a .csv/.json file (or paste JSON), check it with the server (dry run, nothing stored), then import.
 * Imported quizzes that are marked "draft" stay hidden from students until published. */
const QuizImportDialog = ({ open, onClose, notify }) => {
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [problems, setProblems] = useState([]);
  const [checked, setChecked] = useState(null); // { quizzes, questions } after a successful dry run
  const [importQuizzes, { isLoading }] = useImportQuizzesMutation();

  const reset = () => { setFileName(''); setText(''); setProblems([]); setChecked(null); };
  const close = () => { reset(); onClose(); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setProblems(['The file is larger than 3 MB. Split it into several files.']); return; }
    setFileName(file.name); setChecked(null); setProblems([]);
    setText(await file.text());
  };

  const parse = () => parseImportFile(text, fileName);

  const validate = async () => {
    const { payload, errors } = parse();
    if (errors.length) { setProblems(errors); setChecked(null); return; }
    const res = await importQuizzes({ ...payload, dry_run: true });
    if (res.error) { setProblems([errorText(res.error)]); setChecked(null); return; }
    setProblems([]); setChecked(summarize(payload));
  };

  const runImport = async () => {
    const { payload, errors } = parse();
    if (errors.length) { setProblems(errors); return; }
    const res = await importQuizzes(payload);
    if (res.error) { setProblems([errorText(res.error)]); return; }
    notify('success', `Imported ${res.data.quizzes} quiz(zes) with ${res.data.questions} questions.`);
    close();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>Import quizzes</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Upload a CSV (one row per question) or JSON file. The file is checked first and nothing is saved unless every quiz in it is valid.
          Quizzes marked <code>draft</code> (the CSV default) stay hidden from students until you publish them.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="outlined" component="label">Choose file<input hidden type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} /></Button>
          <Button size="small" onClick={() => download('quiz-import-template.csv', SAMPLE_CSV, 'text/csv')}>Download CSV template</Button>
          <Button size="small" onClick={() => download('quiz-import-template.json', SAMPLE_JSON, 'application/json')}>Download JSON template</Button>
          {fileName && <Typography sx={{ alignSelf: 'center' }}>{fileName}</Typography>}
        </Box>
        <TextField
          label="…or paste JSON here" value={fileName ? '' : text} onChange={(e) => { setText(e.target.value); setChecked(null); setProblems([]); }}
          multiline minRows={4} maxRows={10} fullWidth disabled={!!fileName} placeholder={'{"quizzes": [ ... ]}'}
        />
        {problems.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>{problems.slice(0, 15).map((p, i) => <li key={i}>{p}</li>)}</Box>
            {problems.length > 15 && <div>…and {problems.length - 15} more.</div>}
          </Alert>
        )}
        {checked && <Alert severity="success" sx={{ mt: 2 }}>Valid: {checked.quizzes} quiz(zes), {checked.questions} questions. Nothing has been saved yet.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button onClick={validate} disabled={!text.trim() || isLoading}>Check file</Button>
        <Button variant="contained" onClick={runImport} disabled={!checked || isLoading}>Import</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizImportDialog;
