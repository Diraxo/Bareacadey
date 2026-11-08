import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetServiceQuery, useUpdateServiceMutation } from '../../../../features/main/servicesApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';

const EditService = ({ newPage = false,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: service} = useGetServiceQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    images: {value: [], error: ""},
    title: {value: "", error: ""},
    subtitle: {value: "", error: ""},
    features: {value: [], error: ""},
  });
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(service) {
      if(service?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: service?.localStorage??""}))
      }
      setEditFormData({
        images_existing: { value: JSON.parse(service?.images)??[], error: "" },
        title: { value: service?.title??"", error: "" },
        subtitle: { value: service?.subtitle??"", error: "" },
      features: { value: JSON.parse(service?.features)??[], error: "" },
      });
    }
  }, [service])
  
  const handleClose = () => {
    if(newPage) {
      navigate(-1);
    } else {
      dispatch(hideDialog());
      dispatch(hideSidebar());
    }
  }
  
  //rtk query
  const [updateService, {isLoading}] = useUpdateServiceMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _title: editFormData?.title?.value,
      _subtitle: editFormData?.subtitle?.value,
      _features: JSON.stringify(editFormData?.features?.value??[]),
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    fd.append('_images', JSON.stringify(editFormData?.images_existing?.value))
    if(editFormData?.images?.value?.length > 0)  {
      for (const file of editFormData?.images?.value) {
        fd.append("images",file)
      }
    }
    
    const data = await updateService(fd).unwrap();
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
    sx: {mb: 5},
  }
  const groups = [
    {
      id: 2,
      name: "Service Information",
    },
    {
      id: 3,
      name: "Images",
    },
  ];
  
  const editSchema = {
    images: {
      type: 'files',
      label: "Images",
      group: 3,
      required: false,
      accept: "image",
      grid: 12,
    },
    images_existing: {
      type: 'custom',
      group: 3,
      grid: 12,
      element: editFormData?.images_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.images_existing?.value} onChange={(files)=>setEditFormData({...editFormData, images_existing: {...editFormData?.images_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    title: {
      type: 'text',
      label: "Title",
      placeholder: "Enter title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    subtitle: {
      type: 'text',
      label: "Subtitle",
      placeholder: "Enter subtitle",
      group: 2,
      multiline: true,
      rows: 5,
      required: true,
      grid: 12,
    },
    features: {
      type: 'collection',
      label: "Features",
      group: 2,
      required: false,
      columns: [
        {
          field: "feature",
          header: "Feature",
          type: "text",
        },
      ],
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
        enableUploadProgress={true}
      />
    </div>
  )
}

export default EditService;