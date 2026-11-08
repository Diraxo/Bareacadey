import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { setAlert } from '../../../app/slices/commonSlice';
import { useGetUsersQuery } from '../../../features/user/usersApiSlice';
import {
  useGetInstructorRequestsQuery, useApproveInstructorRequestMutation, useRejectInstructorRequestMutation, useGetInstructorsQuery,
  useSetInstructorCoursesMutation, useRevokeInstructorMutation, useGetAllCoursesQuery, useGetUserDevicesQuery, useResetUserDevicesMutation,
} from '../../../features/instructors/instructorApiSlice';

const errorText = (error) => error?.data?.message || error?.data?.error || (typeof error?.data === 'string' ? error.data : 'Something went wrong');
const fullName = (u) => u?.full_name || u?.email || `#${u?.id}`;

/* Picks one or more courses; the server refuses an empty list because instructors need explicit assignments. */
const CourseDialog = ({ open, title, intro, initial = [], courses, confirmLabel, onClose, onConfirm, busy }) => {
  const [selected, setSelected] = useState(initial);
  React.useEffect(() => { if (open) setSelected(initial); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {intro && <Typography variant="body2" sx={{ mb: 2 }}>{intro}</Typography>}
        <Autocomplete
          multiple options={courses} value={selected} getOptionLabel={(c) => c.title || `Course ${c.id}`}
          isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, value) => setSelected(value)}
          renderInput={(params) => <TextField {...params} label="Courses this instructor may manage" margin="dense" />}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={selected.length === 0 || busy} onClick={() => onConfirm(selected.map((c) => c.id))}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};

const RequestsTab = ({ courses, notify }) => {
  const { data: requests = [], isLoading } = useGetInstructorRequestsQuery('pending');
  const [approve, { isLoading: approving }] = useApproveInstructorRequestMutation();
  const [reject] = useRejectInstructorRequestMutation();
  const [target, setTarget] = useState(null);

  const doApprove = async (course_ids) => {
    const res = await approve({ id: target.id, course_ids });
    if (res.error) return notify('error', errorText(res.error));
    notify('success', `${fullName(target.user)} is now an instructor. They must sign in again to see the new access.`);
    setTarget(null);
  };
  const doReject = async (request) => {
    if (!window.confirm(`Reject the request from ${fullName(request.user)}?`)) return;
    const res = await reject({ id: request.id });
    if (res.error) notify('error', errorText(res.error)); else notify('success', 'Request rejected.');
  };

  if (isLoading) return <CircularProgress />;
  return (
    <>
      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
        People who chose “Instructor” when signing up are students until you approve them here. Approving needs at least one course to assign.
      </Typography>
      {requests.length === 0 ? <Paper sx={{ p: 3 }}><Typography>No pending requests.</Typography></Paper> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Requested</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{fullName(r.user)}</TableCell><TableCell>{r.user?.email}</TableCell><TableCell>{r.user?.phone}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" variant="contained" onClick={() => setTarget(r)}>Approve…</Button>
                    <Button size="small" color="error" onClick={() => doReject(r)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <CourseDialog
        open={!!target} title={`Approve ${fullName(target?.user)}`} courses={courses} confirmLabel="Approve instructor" busy={approving}
        intro="Choose the courses this person may manage. They cannot touch any other course." onClose={() => setTarget(null)} onConfirm={doApprove}
      />
    </>
  );
};

const InstructorsTab = ({ courses, notify }) => {
  const { data: instructors = [], isLoading } = useGetInstructorsQuery();
  const [setCourses, { isLoading: saving }] = useSetInstructorCoursesMutation();
  const [revoke] = useRevokeInstructorMutation();
  const [target, setTarget] = useState(null);

  const doSave = async (course_ids) => {
    const res = await setCourses({ userId: target.id, course_ids });
    if (res.error) return notify('error', errorText(res.error));
    notify('success', 'Course assignments updated.'); setTarget(null);
  };
  const doRevoke = async (user) => {
    if (!window.confirm(`Remove instructor access from ${fullName(user)}? Their course assignments are removed too.`)) return;
    const res = await revoke({ userId: user.id });
    if (res.error) notify('error', errorText(res.error)); else notify('success', 'Instructor access removed.');
  };

  if (isLoading) return <CircularProgress />;
  if (instructors.length === 0) return <Paper sx={{ p: 3 }}><Typography>There are no instructors yet.</Typography></Paper>;
  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Courses</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {instructors.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{fullName(u)}{u.active === false && <Chip size="small" label="inactive" sx={{ ml: 1 }} />}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{(u.assignedCourses || []).map((c) => <Chip key={c.id} size="small" label={c.title} sx={{ mr: 0.5, mb: 0.5 }} />)}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" onClick={() => setTarget(u)}>Edit courses</Button>
                  <Button size="small" color="error" onClick={() => doRevoke(u)}>Remove access</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CourseDialog
        open={!!target} title={`Courses of ${fullName(target)}`} courses={courses} initial={target?.assignedCourses || []} confirmLabel="Save" busy={saving}
        onClose={() => setTarget(null)} onConfirm={doSave}
      />
    </>
  );
};

/* Support tool for the one-registered-device rule: the user contacted support after changing phone. */
const DevicesTab = ({ notify }) => {
  const { data: users = [] } = useGetUsersQuery();
  const [user, setUser] = useState(null);
  const { data: devices = [], isFetching } = useGetUserDevicesQuery(user?.id, { skip: !user });
  const [reset, { isLoading }] = useResetUserDevicesMutation();

  const doReset = async () => {
    if (!window.confirm(`Clear the registered device of ${fullName(user)}? The next device they sign in with becomes their registered device.`)) return;
    const res = await reset(user.id);
    if (res.error) notify('error', errorText(res.error)); else notify('success', res.data.message);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
        Each student account is tied to the phone it first used. If a student lost or replaced their phone and cannot wait for the self-service email link,
        clear the registration here. The change is recorded in the activity log.
      </Typography>
      <Autocomplete
        options={Array.isArray(users) ? users : []} value={user} onChange={(_, v) => setUser(v)} sx={{ maxWidth: 480 }}
        getOptionLabel={(u) => `${fullName(u)} (${u.email || u.phone || u.id})`} isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={(params) => <TextField {...params} label="Find a user" />}
      />
      {user && (
        <Paper sx={{ p: 2, mt: 2, maxWidth: 640 }}>
          <Typography variant="subtitle1">Registered device</Typography>
          {isFetching ? <CircularProgress size={20} /> : devices.length === 0 ? (
            <Typography color="text.secondary">None yet. The next device they sign in with will be registered.</Typography>
          ) : devices.map((d) => (
            <Box key={d.id} sx={{ my: 1 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{d.device}</Typography>
              <Typography variant="caption" color="text.secondary">
                registered {d.registered_at ? new Date(d.registered_at).toLocaleString() : 'before records began'}
                {d.last_seen_at ? `, last used ${new Date(d.last_seen_at).toLocaleString()}` : ''}
              </Typography>
            </Box>
          ))}
          <Button sx={{ mt: 1 }} variant="contained" color="warning" disabled={isLoading || devices.length === 0} onClick={doReset}>Reset device</Button>
        </Paper>
      )}
    </Box>
  );
};

const Instructors = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState(0);
  const { data: courses = [] } = useGetAllCoursesQuery();
  const notify = (severity, message) => dispatch(setAlert({ openAlert: true, severity, message }));
  const courseOptions = Array.isArray(courses) ? courses.map((c) => ({ id: c.id, title: c.title })) : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Instructors and devices</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Requests" /><Tab label="Instructors" /><Tab label="Reset device" />
      </Tabs>
      {tab === 0 && <RequestsTab courses={courseOptions} notify={notify} />}
      {tab === 1 && <InstructorsTab courses={courseOptions} notify={notify} />}
      {tab === 2 && <DevicesTab notify={notify} />}
    </Box>
  );
};

export default Instructors;
