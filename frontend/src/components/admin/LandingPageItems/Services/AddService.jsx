import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddServiceMutation } from '../../../../features/main/servicesApiSlice';
import { useNavigate } from 'react-router-dom';

const AddService = ({ newPage=false,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    images: {value: [], error: ""},
    title: {value: "", error: ""},
    subtitle: {value: "", error: ""},
    features: {value: [], error: ""},
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
  const [addService, {isLoading}] = useAddServiceMutation()
  
  const submitForm = async () => {
    const submitData = {
      _title: addFormData?.title?.value,
      _subtitle: addFormData?.subtitle?.value,
      _features: JSON.stringify(addFormData?.features?.value??[]),
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    if(addFormData?.images?.value?.length > 0)  {
      for (const file of addFormData?.images?.value) {
        fd.append("images",file)
      }
    }
    
    const data = await addService(fd).unwrap();
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
  
  const addSchema = {
    images: {
      type: 'files',
      label: "Images",
      group: 3,
      required: false,
      accept: "image",
      grid: 12,
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

export default AddService;