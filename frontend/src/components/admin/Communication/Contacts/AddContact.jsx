import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddContactMutation } from '../../../../features/main/contactsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddContact = ({ newPage=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    full_name: {value: "", error: ""},
    email: {value: "", error: ""},
    phone: {value: "", error: ""},
    company_name: {value: "", error: ""},
    message: {value: "", error: ""},
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
  const [addContact, {isLoading}] = useAddContactMutation()
  
  const submitForm = async () => {
    const submitData = {
      _full_name: addFormData?.full_name?.value,
      _email: addFormData?.email?.value,
      _phone: addFormData?.phone?.countryCode+"-"+addFormData?.phone?.value,
      _company_name: addFormData?.company_name?.value,
      _message: addFormData?.message?.value,
    };
    const data = await addContact(submitData).unwrap();
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
    sx: {mb: 5},
  }
  const groups = [
    {
      id: 2,
      name: "Contact Information",
    },
  ];
  
  let addSchema = {
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

export default AddContact;