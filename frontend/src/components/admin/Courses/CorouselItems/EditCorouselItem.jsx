import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetCorouselItemQuery, useUpdateCorouselItemMutation } from '../../../../features/main/corouselItemsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';

const EditCorouselItem = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: corouselItem} = bulk ? {} : useGetCorouselItemQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    title: {value: "", error: ""},
    subtitle: {value: "", error: ""},
    image: {value: [], error: ""},
    enable_action_button: {value: false, error: ""},
    action_button_type: {value: "", error: ""},
    action_message: {value: "", error: ""},
  });
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(corouselItem) {
      if(corouselItem?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: corouselItem?.localStorage??""}))
      }
      setEditFormData({
        title: { value: corouselItem?.title??"", error: "" },
        subtitle: { value: corouselItem?.subtitle??"", error: "" },
        image_existing: { value: JSON.parse(corouselItem?.image)??[], error: "" },
        enable_action_button: { value: corouselItem?.enable_action_button??"", error: "" },
        action_button_type: { value: corouselItem?.action_button_type??"", error: "" },
        action_message: { value: corouselItem?.action_message??"", error: "" },
      });
    }
  }, [corouselItem])
  
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
  const [updateCorouselItem, {isLoading}] = useUpdateCorouselItemMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _title: editFormData?.title?.value,
      _subtitle: editFormData?.subtitle?.value,
      _enable_action_button: editFormData?.enable_action_button?.value,
      _action_button_type: editFormData?.action_button_type?.value,
      _action_message: editFormData?.action_message?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    fd.append('_image', JSON.stringify(editFormData?.image_existing?.value))
    if(editFormData?.image?.value?.length > 0)  {
      for (const file of editFormData?.image?.value) {
        fd.append("image",file)
      }
    }
    
    let data;
    data = await updateCorouselItem(fd).unwrap();
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
      name: "Item Detail",
    },
  ];
  
  let editSchema = {
    title: {
      type: 'text',
      label: "Title",
      placeholder: "Enter Title",
      group: 2,
      multiline: false,
      rows: 3,
      required: true,
    },
    subtitle: {
      type: 'text',
      label: "Subtitle",
      placeholder: "Enter Subtitle",
      group: 2,
      multiline: true,
      rows: 5,
      required: false,
      grid: 12,
    },
    image: {
      type: 'file',
      label: "Image",
      group: 2,
      accept: "image",
      dnd: false,
    },
    image_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.image_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.image_existing?.value} onChange={(files)=>setEditFormData({...editFormData, image_existing: {...editFormData?.image_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    enable_action_button: {
      type: 'checkbox',
      label: "Enable Action Button",
      group: 2,
      required: false,
    },
    action_button_type: {
      type: 'radio',
      label: "Action Button Type",
      group: 2,
      required: false,
      row: true,
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      options: [{name: "Contact Us", value: "Contact Us"}, {name: "Register", value: "Register"}],
      dependencies: {
        op: "&&",
        dependencies: {
          enable_action_button: {
            op: "==",
            value: true,
            valueType: "number",
            type: "value",
            formula: [],
          },
        },
      },
    },
    action_message: {
      type: 'text',
      label: "Action Message",
      placeholder: "Enter Action Message",
      group: 2,
      multiline: false,
      rows: 3,
      required: false,
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
        fullScreenFormStyle={fullScreenFormStyle}
        bulk={bulk}
        viewPanel={viewPanel}
      />
    </div>
  )
}

export default EditCorouselItem;