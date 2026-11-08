import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetTrendingQuery, useUpdateTrendingMutation } from '../../../../features/main/trendingsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditTrending = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId, courses }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: trending} = bulk ? {} : useGetTrendingQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    title: {value: "", error: ""},
    group_under: {value: "", error: ""},
    course_id: {value: [], error: ""},
  });
  
  useEffect(()=>{
    if(trending) {
      setEditFormData({
        title: { value: trending?.title??"", error: "" },
        group_under: { value: trending?.group_under??"", error: "" },
        course_id: { value: trending?.Courses?.map((rls)=>rls?.id)??[], error: "" },
      });
    }
  }, [trending])
  
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
  const [updateTrending, {isLoading}] = useUpdateTrendingMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _title: editFormData?.title?.value,
      _course_id: editFormData?.course_id?.value?.join(','),
    };
    let data;
    data = await updateTrending(submitData).unwrap();
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
      name: "Section Detail",
    },
  ];
  
  let editSchema = {
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
        fullScreenFormStyle={fullScreenFormStyle}
        bulk={bulk}
        viewPanel={viewPanel}
      />
    </div>
  )
}

export default EditTrending;