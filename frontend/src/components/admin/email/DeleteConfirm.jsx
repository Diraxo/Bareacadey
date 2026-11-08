import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import {GoAlert} from 'react-icons/go';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DeleteDialog = ({open, handleClose, ids, exitCallBack=()=>{}, callBack }) => {
 

  return (
    <div>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="delete-budget"
      >
        <DialogTitle style={{background: '#474950', color: '#fff', fontFamily: 'ubuntu'}}>
            {"Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-budget" className='pt-4'>
            <div className='flex gap-4 items-center'>
              <GoAlert style={{
                color: 'orange',
                fontSize: 28
              }}/>
               <p className='font-san' style={{fontFamily: 'ubuntu'}}>
                 Are you sure you want to permanently remove this item?
               </p>
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions className='mb-2'>
          <Button 
            onClick={handleClose}
            variant="contained" 
            color="error"
            size="small"
            style={{
                backgroundColor: '#747475',
                fontFamily: 'ubuntu'
            }}
          >Cancel</Button>
          <Button 
            onClick={()=>{
                callBack(ids);
                exitCallBack()
                handleClose();
            }}
            variant="contained" 
            color="error"
            size="small"
           
            style={{
                backgroundColor: '#e8384f',
                fontFamily: 'ubuntu',
                marginLeft: 20
            }}
          >Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeleteDialog;