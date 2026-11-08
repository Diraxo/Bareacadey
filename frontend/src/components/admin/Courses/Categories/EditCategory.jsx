import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetCategoryQuery, useUpdateCategoryMutation } from '../../../../features/main/categoriesApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditCategory = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: category} = bulk ? {} : useGetCategoryQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    name: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(category) {
      setEditFormData({
        name: { value: category?.name??"", error: "" },
      });
    }
  }, [category])
  
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
  const [updateCategory, {isLoading}] = useUpdateCategoryMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _name: editFormData?.name?.value,
    };
    let data;
    data = await updateCategory(submitData).unwrap();
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
      name: "Category Detail",
    },
  ];
  
  let editSchema = {
    name: {
      type: 'text',
      label: "Name",
      placeholder: "Enter Name",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    submit: {
      type: "submit",
      right: true,
      onClick: submitForm,
      loading: isLoading,
      submitType: "update",
      submitText: "Update",
      card: false,
      iconStyle: {width: '100%', height: 26 },
      sx: {borderRadius: 1, width: '100%', height: 40, textTransform: 'capitalize', fontWeight: 700, fontSize: 16}
    },
  }
  
  return (
    <div>
      <FormGenerator
        schema={editSchema}
        groups={groups}
        formData={editFormData}
        setFormData={setEditFormData}
        type="no-group" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
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

export default EditCategory;