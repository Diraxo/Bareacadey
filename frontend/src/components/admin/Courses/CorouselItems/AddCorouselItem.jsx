import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddCorouselItemMutation } from '../../../../features/main/corouselItemsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddCorouselItem = ({ newPage=false, fullScreenFormStyle=false, parentId,  }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    title: {value: "", error: ""},
    subtitle: {value: "", error: ""},
    image: {value: [], error: ""},
    enable_action_button: {value: false, error: ""},
    action_button_type: {value: "", error: ""},
    action_message: {value: "", error: ""},
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
  const [addCorouselItem, {isLoading}] = useAddCorouselItemMutation()
  
  const submitForm = async () => {
    const submitData = {
      _title: addFormData?.title?.value,
      _subtitle: addFormData?.subtitle?.value,
      _enable_action_button: addFormData?.enable_action_button?.value,
      _action_button_type: addFormData?.action_button_type?.value,
      _action_message: addFormData?.action_message?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    if(addFormData?.image?.value?.length > 0)  {
      for (const file of addFormData?.image?.value) {
        fd.append("image",file)
      }
    }
    
    const data = await addCorouselItem(fd).unwrap();
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
      name: "Item Detail",
    },
  ];
  
  let addSchema = {
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
      required: true,
      accept: "image",
      dnd: false,
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
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
        enableUploadProgress={true}
      />
    </div>
  )
}

export default AddCorouselItem;