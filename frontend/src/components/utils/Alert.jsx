import { forwardRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { handleCloseAlert } from '../../app/slices/commonSlice';
import { useDispatch } from 'react-redux';

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


function ShowAlert({open, severity="error", message, autoHideDuration=6000, vertical="top", horizontal="right"}) {
    const dispatch = useDispatch()
    const handleClose=()=>{
       dispatch(handleCloseAlert())
    }
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={handleClose} anchorOrigin={{ vertical, horizontal }}>
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%', fontFamily: 'ubuntu', fontWeight: 400, color: severity==="info" || severity === "success" ? 'white' : '' }}>
              <p style={{fontSize: 16, marginTop: 0-2.5}}>{message}</p>
            </Alert>
        </Snackbar>
    );
}

export default ShowAlert;

