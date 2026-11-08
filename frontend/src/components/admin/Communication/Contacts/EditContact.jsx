import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetContactQuery, useUpdateContactMutation } from '../../../../features/main/contactsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditContact = ({ newPage = false, doubleHistoryBack=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: contact} = useGetContactQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    full_name: {value: "", error: ""},
    email: {value: "", error: ""},
    phone: {value: "", error: ""},
    company_name: {value: "", error: ""},
    message: {value: "", error: ""},
    routeState: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(contact) {
      setEditFormData({
        full_name: { value: contact?.full_name??"", error: "" },
        email: { value: contact?.email??"", error: "" },
        phone: { value: contact?.phone?.split('-')[1]??"", error: "", countryCode: contact?.phone?.split('-')[0]??"+251" },
        company_name: { value: contact?.company_name??"", error: "" },
        message: { value: contact?.message??"", error: "" },
        routeState: { value: contact?.routeState??"", error: "" },
      });
    }
  }, [contact])
  
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
  const [updateContact, {isLoading}] = useUpdateContactMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _full_name: editFormData?.full_name?.value,
      _email: editFormData?.email?.value,
      _phone: editFormData?.phone?.countryCode+"-"+editFormData?.phone?.value,
      _company_name: editFormData?.company_name?.value,
      _message: editFormData?.message?.value,
    };
    const data = await updateContact(submitData).unwrap();
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
      name: "Contact Information",
    },
  ];
  
  let editSchema = {
    full_name: {
      type: 'text',
      label: "Full Name",
      placeholder: "Enter full  name",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    email: {
      type: 'email',
      label: "Email",
      placeholder: "Email",
      group: 2,
      required: true,
    },
    phone: {
      type: 'phone',
      label: "Phone",
      placeholder: "Phone",
      group: 2,
      required: false,
    },
    company_name: {
      type: 'text',
      label: "Company Name",
      placeholder: "Enter company  name",
      group: 2,
      multiline: false,
      rows: 3,
      required: false,
    },
    message: {
      type: 'text',
      label: "Message",
      placeholder: "Enter message",
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

export default EditContact;