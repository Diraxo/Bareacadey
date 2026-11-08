import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetFaqQuery, useUpdateFaqMutation } from '../../../../features/main/faqsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditFaq = ({ newPage = false, doubleHistoryBack=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: faq} = useGetFaqQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    question: {value: "", error: ""},
    answer: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(faq) {
      setEditFormData({
        question: { value: faq?.question??"", error: "" },
        answer: { value: faq?.answer??"", error: "" },
      });
    }
  }, [faq])
  
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
  const [updateFaq, {isLoading}] = useUpdateFaqMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _question: editFormData?.question?.value,
      _answer: editFormData?.answer?.value,
    };
    const data = await updateFaq(submitData).unwrap();
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
    sx: {mb: 5},
  }
  const groups = [
    {
      id: 2,
      name: "FAQ Information",
    },
  ];
  
  let editSchema = {
    question: {
      type: 'text',
      label: "Question",
      placeholder: "Enter question",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    answer: {
      type: 'text',
      label: "Answer",
      placeholder: "Enter answer",
      group: 2,
      multiline: true,
      rows: 5,
      required: true,
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

export default EditFaq;