import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetLandingPageContentQuery, useUpdateLandingPageContentMutation } from '../../../../features/main/landingPageContentsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';

const EditLandingPageContent = ({ newPage = false, doubleHistoryBack=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = 1;
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: landingPageContent} = useGetLandingPageContentQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
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
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(landingPageContent) {
      if(landingPageContent?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: landingPageContent?.localStorage??""}))
      }
      setEditFormData({
        label_1: { value: landingPageContent?.label_1??"", error: "" },
        label_title_colored: { value: landingPageContent?.label_title_colored??"", error: "" },
        title_color_label: { value: landingPageContent?.title_color_label??"", error: "" },
        label_title: { value: landingPageContent?.label_title??"", error: "" },
        label_2_description: { value: landingPageContent?.label_2_description??"", error: "" },
        title: { value: landingPageContent?.title??"", error: "" },
        title_colored: { value: landingPageContent?.title_colored??"", error: "" },
        title_color: { value: landingPageContent?.title_color??"", error: "" },
        subtitle: { value: landingPageContent?.subtitle??"", error: "" },
        subtitle_short: { value: landingPageContent?.subtitle_short??"", error: "" },
        hero_image_existing: { value: JSON.parse(landingPageContent?.hero_image)??[], error: "" },
      });
    }
  }, [landingPageContent])
  
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
  const [updateLandingPageContent, {isLoading}] = useUpdateLandingPageContentMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _label_1: editFormData?.label_1?.value,
      _label_title_colored: editFormData?.label_title_colored?.value,
      _title_color_label: editFormData?.title_color_label?.value,
      _label_title: editFormData?.label_title?.value,
      _label_2_description: editFormData?.label_2_description?.value,
      _title: editFormData?.title?.value,
      _title_colored: editFormData?.title_colored?.value,
      _title_color: editFormData?.title_color?.value,
      _subtitle: editFormData?.subtitle?.value,
      _subtitle_short: editFormData?.subtitle_short?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    fd.append('_hero_image', JSON.stringify(editFormData?.hero_image_existing?.value))
    if(editFormData?.hero_image?.value?.length > 0)  {
      for (const file of editFormData?.hero_image?.value) {
        fd.append("hero_image",file)
      }
    }
    
    const data = await updateLandingPageContent(fd).unwrap();
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
  
  let editSchema = {
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
    title_colored: {
      type: 'text',
      label: "Title Colored",
      placeholder: "Enter title colored",
      group: 2,
      multiline: false,
      rows: 3,
      required: false,
    },
    title: {
      type: 'text',
      label: "Other Title",
      placeholder: "Enter other title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    
    title_color: {
      type: 'color',
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
    hero_image_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.hero_image_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.hero_image_existing?.value} onChange={(files)=>setEditFormData({...editFormData, hero_image_existing: {...editFormData?.hero_image_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    submit: {
      type: "submit",
      onClick: submitForm,
      loading: isLoading,
      right: true,
      submitType:"save",
      // handleClose: ()=>handleClose(),
      card: true,
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
        newPage={true}
        maxWidth={800}
        dropMaxWidthCard={true}
        labelAlignment="side"
        keepSideGridFull={true}
      />
    </div>
  )
}

export default EditLandingPageContent;