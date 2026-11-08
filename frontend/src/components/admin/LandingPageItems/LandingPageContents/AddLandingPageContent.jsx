import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddLandingPageContentMutation } from '../../../../features/main/landingPageContentsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddLandingPageContent = ({ newPage=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    label_1: {value: "", error: ""},
    label_title_colored: {value: "", error: ""},
    title_color_label: {value: "", error: ""},
    label_title: {value: "", error: ""},
    label_2_description: {value: "", error: ""},
    title: {value: "", error: ""},
    title_colored: {value: "", error: ""},
    title_color: {value: "", error: ""},
    subtitle: {value: "", error: ""},
    subtitle_short: {value: "", error: ""},
    hero_image: {value: [], error: ""},
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
  const [addLandingPageContent, {isLoading}] = useAddLandingPageContentMutation()
  
  const submitForm = async () => {
    const submitData = {
      _label_1: addFormData?.label_1?.value,
      _label_title_colored: addFormData?.label_title_colored?.value,
      _title_color_label: addFormData?.title_color_label?.value,
      _label_title: addFormData?.label_title?.value,
      _label_2_description: addFormData?.label_2_description?.value,
      _title: addFormData?.title?.value,
      _title_colored: addFormData?.title_colored?.value,
      _title_color: addFormData?.title_color?.value,
      _subtitle: addFormData?.subtitle?.value,
      _subtitle_short: addFormData?.subtitle_short?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    if(addFormData?.hero_image?.value?.length > 0)  {
      for (const file of addFormData?.hero_image?.value) {
        fd.append("hero_image",file)
      }
    }
    
    const data = await addLandingPageContent(fd).unwrap();
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
      name: "Hero Section",
    },
    {
      id: 3,
      name: "Label 1",
    },
    {
      id: 4,
      name: "Label 2",
    },
    {
      id: 5,
      name: "Enter group name...",
    },
  ];
  
  let addSchema = {
    label_1: {
      type: 'text',
      label: "Label 1",
      placeholder: "Enter label 1",
      group: 3,
      multiline: true,
      rows: 5,
      required: true,
      grid: 12,
    },
    label_title_colored: {
      type: 'text',
      label: "Label Title Colored",
      placeholder: "Enter label  title  colored",
      group: 4,
      multiline: false,
      rows: 3,
      required: false,
    },
    title_color_label: {
      type: 'color',
      label: "Title Color",
      placeholder: "Select Enter title  color",
      group: 4,
      required: true,
    },
    label_title: {
      type: 'text',
      label: "Label Title",
      placeholder: "Enter label  title",
      group: 4,
      multiline: false,
      rows: 3,
      required: true,
    },
    label_2_description: {
      type: 'text',
      label: "Label 2 Description",
      placeholder: "Enter label 2  description",
      group: 4,
      multiline: true,
      rows: 5,
      required: true,
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
    title_colored: {
      type: 'text',
      label: "Title Colored",
      placeholder: "Enter title  colored",
      group: 2,
      multiline: false,
      rows: 3,
      required: false,
    },
    title_color: {
      type: 'text',
      label: "Title Color",
      placeholder: "Enter title  color",
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
    subtitle_short: {
      type: 'text',
      label: "Subtitle Short",
      placeholder: "Enter subtitle  short",
      group: 2,
      multiline: true,
      rows: 5,
      required: true,
      grid: 12,
    },
    hero_image: {
      type: 'file',
      label: "Hero Image",
      group: 2,
      required: false,
      accept: "image",
      dnd: true,
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

export default AddLandingPageContent;