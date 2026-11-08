import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { useState } from 'react';
import { useDeleteUserAccountMutation } from '../../../features/user/usersApiSlice';
import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../app/slices/commonSlice';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const AccountDeletionModal = ({open, handleClose}) => {
const navigate = useNavigate();
const dispatch = useDispatch();

const [firstNumber] = useState(Math.floor(Math.random() * 10) + 1);
const [secondNumber] = useState(Math.floor(Math.random() * 10) + 1);

const [result, setResult] = useState()
const [password, setPassword] = useState('')

const [deleteUser, { isLoading }] = useDeleteUserAccountMutation();

const handleAccountDelete = async () => {
  const res = await deleteUser({ password }).unwrap().catch((e) => e?.data || { error: true, message: 'Something went wrong' });
  if(res?.error) {
    dispatch(
        setAlert({
          openAlert: true,
          severity: "error",
          message: res?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right",
        })
      );
  } else {
        dispatch(
            setAlert({
              openAlert: true,
              severity: "success",
              message: res?.message,
              autoHideDuration: 5000,
              vertical: "top",
              horizontal: "right",
            })
          );
        // navigate("/admin/main/logout")
        handleClose();
  }
}

return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        {isLoading ? <CircularProgress sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}} /> : <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Are you sure?
          </Typography>

          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            this will result in your account being permanently deleted including all your data.
          </Typography>
    
          <Typography variant="h6" sx={{ mt: 2 }} className='text-purple-500 font-bold mt-3'>
            <span className='text-red-500 text-md mr-1 font-normal'>Enter result of </span>{`${firstNumber} + ${secondNumber}`}<span className='text-red-500 text-md ml-1 font-normal'> to confirm</span>
          </Typography>
          <input type="password" autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} value={password} placeholder='Enter your password' className='w-full border-2 border-gray-300 rounded-lg px-3 py-2 mt-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent' />
          <input type="number" onChange={(e) => setResult(e.target.value)} value={result} placeholder='Enter result' className='w-full border-2 border-gray-300 rounded-lg px-3 py-2 mt-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent' />
          <Button variant='contained' className='mt-3' size='medium' color='error' onClick={handleAccountDelete} disabled={!password || parseInt(result) != (firstNumber + secondNumber)}>Delete Account</Button>
        </Box>}
      </Modal>
    </div>
  );
}

export default AccountDeletionModal;