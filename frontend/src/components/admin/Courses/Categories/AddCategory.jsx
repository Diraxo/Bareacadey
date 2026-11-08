import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddCategoryMutation } from '../../../../features/main/categoriesApiSlice';
import { useNavigate } from 'react-router-dom';

const AddCategory = ({ newPage=false, fullScreenFormStyle=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    name: {value: "", error: ""},
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
  const [addCategory, {isLoading}] = useAddCategoryMutation()
  
  const submitForm = async () => {
    const submitData = {
      _name: addFormData?.name?.value,
    };
    const data = await addCategory(submitData).unwrap();
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
      name: "Category Detail",
    },
  ];
  
  let addSchema = {
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
      onClick: submitForm,
      loading: isLoading,
      right: true,
      submitText: "Register",
      card: false,
      iconStyle: {width: '100%', height: 26 },
      sx: {borderRadius: 1, width: '100%', height: 40, textTransform: 'capitalize', fontWeight: 700, fontSize: 16}
    },
  }
  
  return (
    <div>
      <FormGenerator
        schema={addSchema}
        groups={groups}
        formData={addFormData}
        setFormData={setAddFormData}
        type="no-group" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
        alternativeLabel={true}
        isLoading={isLoading}
        globalProperties={globalProperties}
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
      />
    </div>
  )
}

export default AddCategory;