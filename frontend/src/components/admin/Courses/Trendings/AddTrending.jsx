import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddTrendingMutation } from '../../../../features/main/trendingsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddTrending = ({ newPage=false, fullScreenFormStyle=false, parentId, courses }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    title: {value: "", error: ""},
    group_under: {value: "", error: ""},
    course_id: {value: [], error: ""},
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
  const [addTrending, {isLoading}] = useAddTrendingMutation()
  
  const submitForm = async () => {
    const submitData = {
      _title: addFormData?.title?.value,
      _group_under: addFormData?.group_under?.value,
      _course_id: addFormData?.course_id?.value?.join(','),
    };
    const data = await addTrending(submitData).unwrap();
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
      name: "Section Detail",
    },
  ];
  
  let addSchema = {
    title: {
      type: 'text',
      label: "Title",
      placeholder: "Enter Title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    group_under: {
      type: 'text',
      label: "Group Under",
      placeholder: "Enter Group Under",
      group: 2,
      multiline: false,
      rows: 3,
      required: false,
    },
    course_id: {
      type: 'select',
      label: "Select course",
      group: 2,
      options: courses,
      nameLabel: "title",
      valueLabel: "id",
      colorLabel: "color",
      multiple: true,
      checkbox: true,
      renderRegular: true,
      flex: true
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
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
        labelAlignment="side"
        sideLabelLayout='border-bottom'
      />
    </div>
  )
}

export default AddTrending;