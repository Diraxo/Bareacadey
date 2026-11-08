import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddEmployeeDocumentMutation } from '../../../../features/main/employeeDocumentsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddEmployeeDocument = ({ newPage=false, parentId, users, employeeDocumentTypes }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    user_id: {value: "", error: ""},
    employeedocumenttype_id: {value: "", error: ""},
    description: {value: "", error: ""},
    documents: {value: [], error: ""},
    expiration_date: {value: "", error: ""},
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
  const [addEmployeeDocument, {isLoading}] = useAddEmployeeDocumentMutation()
  
  const submitForm = async () => {
    const submitData = {
      _user_id: addFormData?.user_id?.value,
      _employeedocumenttype_id: addFormData?.employeedocumenttype_id?.value,
      _description: addFormData?.description?.value,
      _expiration_date: addFormData?.expiration_date?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    if(addFormData?.documents?.value?.length > 0)  {
      for (const file of addFormData?.documents?.value) {
        fd.append("documents",file)
      }
    }
    
    const data = await addEmployeeDocument(fd).unwrap();
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
      dispatch(setUploadProgress(0))
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
      name: "Document Detail",
    },
  ];
  
  let addSchema = {
    user_id: {
      type: 'select',
      label: "Select employee",
      group: 2,
      options: users?.map((item)=>({id: item?.id, first_name: item?.full_name})),
      nameLabel: "first_name",
      valueLabel: "id",
      colorLabel: "color",
    },
    employeedocumenttype_id: {
      type: 'select',
      label: "Select employeedocumenttype",
      group: 2,
      options: employeeDocumentTypes,
      nameLabel: "type",
      valueLabel: "id",
      colorLabel: "color",
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
    documents: {
      type: 'files',
      label: "Documents",
      group: 2,
      required: false,
      accept: "all",
      grid: 12,
    },
    expiration_date: {
      type: 'date',
      label: "Expiration Date",
      inputType: 'date',
      views: ["day","month","year"],
      layout: 'desktop',
      group: 2,
      required: true,
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
        enableUploadProgress={true}
      />
    </div>
  )
}

export default AddEmployeeDocument;