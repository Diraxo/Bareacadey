import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetMyTaskQuery, useUpdateMyTaskMutation } from '../../../../features/main/myTasksApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditMyTask = ({ newPage = false, doubleHistoryBack=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: myTask} = useGetMyTaskQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    title: {value: "", error: ""},
    start: {value: "", error: ""},
    end: {value: "", error: ""},
    allDay: {value: false, error: ""},
    description: {value: "", error: ""},
    routeState: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(myTask) {
      setEditFormData({
        title: { value: myTask?.title??"", error: "" },
        start: { value: new Date(myTask?.start)??"", error: "" },
        end: { value: new Date(myTask?.end)??"", error: "" },
        allDay: { value: myTask?.allDay??"", error: "" },
        description: { value: myTask?.description??"", error: "" },
        routeState: { value: myTask?.routeState??"", error: "" },
      });
    }
  }, [myTask])
  
  const handleClose = () => {
    if(newPage) {
      if(doubleHistoryBack) {
        navigate(-2);
      } else {
        navigate(-1);
      }
    } else {
      dispatch(hideDialog());
      dispatch(hideSidebar());
    }
  }
  
  //rtk query
  const [updateMyTask, {isLoading}] = useUpdateMyTaskMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _title: editFormData?.title?.value,
      _start: editFormData?.start?.value,
      _end: editFormData?.end?.value,
      _allDay: editFormData?.allDay?.value,
      _description: editFormData?.description?.value,
    };
    const data = await updateMyTask(submitData).unwrap();
    if(data.message==="Successfully Updated") {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "success",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right",
        }
      ));
      if(handleClose) {
        handleClose();
      }
    }
    else if(data?.error) {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "error",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right"
        }
      ));
    }
  }
  
  const globalProperties = {
    mui: false,
    height: "46px",
    focusWidth: "1.7px",
    borderWidth: "1.3px",
    focusColor: theme.palette.primary.dark,
    borderColor: "#cccccc",
    borderRadius: "5px",
    variant: "outlined",
    grid: 12,
    sx: { mb: 5 },
  }
  const groups = [
    {
      id: 2,
      name: "Task Detail",
    },
  ];
  
  let editSchema = {
    title: {
      type: 'text',
      label: "Title",
      placeholder: "Enter title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    start: {
      type: 'date',
      label: "Start Date",
      inputType: 'datetime',
      views: ["day","month","year","hours","minutes"],
      layout: 'desktop',
      group: 2,
      required: true,
    },
    end: {
      type: 'date',
      label: "End Date",
      inputType: 'datetime',
      views: ["day","month","year","hours","minutes"],
      layout: 'desktop',
      group: 2,
      required: false,
    },
    allDay: {
      type: 'checkbox',
      label: "All Day",
      group: 2,
      required: false,
      sx: !sm ? { my: 5 } : null
    },
    description: {
      type: 'text',
      label: "Description",
      placeholder: "Enter description",
      group: 2,
      multiline: true,
      rows: 5,
      required: false,
      grid: 12,
    },
    submit: {
      type: "submit",
      right: true,
      onClick: submitForm,
      loading: isLoading,
      submitType: "update",
      handleClose: ()=>handleClose(),
    },
  }
  
  return (
    <div>
      <FormGenerator
        schema={editSchema}
        groups={groups}
        formData={editFormData}
        setFormData={setEditFormData}
        type="panel" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
        alternativeLabel={true}
        globalProperties={globalProperties}
        isLoading={isLoading}
        newPage={newPage}
      />
    </div>
  )
}

export default EditMyTask;