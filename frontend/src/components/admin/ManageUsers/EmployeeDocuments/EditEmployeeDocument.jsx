import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetEmployeeDocumentQuery, useUpdateEmployeeDocumentMutation } from '../../../../features/main/employeeDocumentsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';

const EditEmployeeDocument = ({ newPage = false, doubleHistoryBack=false, parentId, users, employeeDocumentTypes }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: employeeDocument} = useGetEmployeeDocumentQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    user_id: {value: "", error: ""},
    employeedocumenttype_id: {value: "", error: ""},
    description: {value: "", error: ""},
    documents: {value: [], error: ""},
    expiration_date: {value: "", error: ""},
  });
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(employeeDocument) {
      if(employeeDocument?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: employeeDocument?.localStorage??""}))
      }
      setEditFormData({
        user_id: { value: employeeDocument?.user_id??"", error: "" },
        employeedocumenttype_id: { value: employeeDocument?.employeedocumenttype_id??"", error: "" },
        description: { value: employeeDocument?.description??"", error: "" },
        documents_existing: { value: JSON.parse(employeeDocument?.documents)??[], error: "" },
        expiration_date: { value: new Date(employeeDocument?.expiration_date)??"", error: "" },
      });
    }
  }, [employeeDocument])
  
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
  const [updateEmployeeDocument, {isLoading}] = useUpdateEmployeeDocumentMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _user_id: editFormData?.user_id?.value,
      _employeedocumenttype_id: editFormData?.employeedocumenttype_id?.value,
      _description: editFormData?.description?.value,
      _expiration_date: editFormData?.expiration_date?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    fd.append('_documents', JSON.stringify(editFormData?.documents_existing?.value))
    if(editFormData?.documents?.value?.length > 0)  {
      for (const file of editFormData?.documents?.value) {
        fd.append("documents",file)
      }
    }
    
    const data = await updateEmployeeDocument(fd).unwrap();
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
  
  let editSchema = {
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
    documents_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.documents_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.documents_existing?.value} onChange={(files)=>setEditFormData({...editFormData, documents_existing: {...editFormData?.documents_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
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
        enableUploadProgress={true}
        newPage={newPage}
      />
    </div>
  )
}

export default EditEmployeeDocument;