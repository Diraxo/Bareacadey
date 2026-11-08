import React, { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog';
import { hideDialog } from '../../../app/slices/commonSlice';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Loader from '../Loader';

const DialogOverlay = ({baseIndex=-1, children}) => {
  const dispatch = useDispatch()
  const handleClose=()=>{
      dispatch(hideDialog())
  }
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const flsc = useSelector(state=>state?.common?.fullScreen)
  const md = useMediaQuery(theme.breakpoints.down('md'));
  const lg = useMediaQuery(theme.breakpoints.down('lg'));
  const xl = useMediaQuery(theme.breakpoints.up('xl'));
  const visible = useSelector((state) => state.common.openDialog);
  const header = useSelector((state) => state.common.header);
  const openDialog = useSelector(state=>state.common.openDialog)
  const oneSide = useSelector(state=>state.common.oneSide)
  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 50);
  },[openDialog])

//  console.log('fullscreen: ',fullScreen, ' md: ', md,' lg: ',lg,' xl: ',xl)
  return (
    <div className="flex justify-content-center">
        {/* <Dialog blockScroll={true} baseZIndex={-1} header={header} visible={visible} maximizable={fullScreen ? false : true} maximized={fullScreen ? true : false} style={{ width: fullScreen ? '100%' : md ? '80vw' : lg ? '50vw' : xl ? '40vw' : '30vw' }} onHide={handleClose}> */}
        <Dialog blockScroll={true} baseZIndex={baseIndex??-1} header={header} headerStyle={{fontSize: 22, fontWeight: "700px !important"}} visible={visible}  maximizable={fullScreen || flsc ? false : true} maximized={fullScreen || flsc ? true : false} style={oneSide ? { width: fullScreen ? '100%' : md ? '80vw' : lg ? '70vw' : xl ? '40vw' : '40vw' } : {  width: fullScreen ? '100%' : xl ? '60vw' : '80vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={handleClose}>
           {loading ? <Loader /> :  children}
        </Dialog>
    </div>
  )
}

export default DialogOverlay;