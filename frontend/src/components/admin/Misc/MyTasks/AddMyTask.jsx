import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddMyTaskMutation } from '../../../../features/main/myTasksApiSlice';
import { useNavigate } from 'react-router-dom';

const AddMyTask = ({ newPage=false, parentId, info}) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  let start = info ?
   ((info?.event == "select") ? info?.data?.start??""
   : (info?.event=="dateClick") ? info?.data?.date??"" : "")
  : ""
  let end = info ?
   ((info?.event == "select") ? info?.data?.end??""
   : (info?.event=="dateClick") ? (info?.data?.date?.getTime())??"" : "")
  : ""
  let allDay = info?.data?.allDay ?? false
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    title: {value: "", error: ""},
    start: {value: start??"", error: ""},
    end: {value: end??"", error: ""},
    allDay: {value: allDay??false, error: ""},
    description: {value: "", error: ""},
    routeState: {value: "", error: ""},
  });
  
  const handleClose = () => {
    if(newPage) {
      navigate(-1);
    } else {
      dispatch(hideDialog());
      dispatch(hideSidebar());
    }
  }
  
  //rtk query
  const [addMyTask, {isLoading}] = useAddMyTaskMutation()
  
  const submitForm = async () => {
    const submitData = {
      _title: addFormData?.title?.value,
      _start: addFormData?.start?.value,
      _end: addFormData?.end?.value,
      _allDay: addFormData?.allDay?.value,
      _description: addFormData?.description?.value,
    };
    const data = await addMyTask(submitData).unwrap();
    if(data.message==="Successfully Created") {
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
  
  let addSchema = {
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
      onClick: submitForm,
      loading: isLoading,
      right: true,
      handleClose: ()=>handleClose(),
    },
  }
  
  return (
    <div>
      <FormGenerator
        schema={addSchema}
        groups={groups}
        formData={addFormData}
        setFormData={setAddFormData}
        type="panel" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
        alternativeLabel={true}
        isLoading={isLoading}
        globalProperties={globalProperties}
      />
    </div>
  )
}

export default AddMyTask;