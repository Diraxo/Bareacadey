import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddCourseMutation } from '../../../../features/main/coursesApiSlice';
import { useNavigate } from 'react-router-dom';

const AddCourse = ({ newPage=false, fullScreenFormStyle=false, parentId, categories }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    title: {value: "", error: ""},
    category_id: {value: "", error: ""},
    description: {value: "", error: ""},
    thumbnail: {value: [], error: ""},
    introduction_video: {value: [], error: ""},
    tags: {value: "", error: ""},
    type: {value: "", error: ""},
    pdf_files: {value: [], error: ""},
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
  const [addCourse, {isLoading}] = useAddCourseMutation()
  
  const submitForm = async () => {
    const submitData = {
      _title: addFormData?.title?.value,
      _category_id: addFormData?.category_id?.value,
      _description: addFormData?.description?.value,
      _tags: addFormData?.tags?.value,
      _type: addFormData?.type?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    if(addFormData?.thumbnail?.value?.length > 0)  {
      for (const file of addFormData?.thumbnail?.value) {
        fd.append("thumbnail",file)
      }
    }
    
    if(addFormData?.introduction_video?.value?.length > 0)  {
      for (const file of addFormData?.introduction_video?.value) {
        fd.append("introduction_video",file)
      }
    }

    if(addFormData?.pdf_files?.value?.length > 0)  {
      for (const file of addFormData?.pdf_files?.value) {
        fd.append("pdf_files",file)
      }
    }
    
    
    if(isLoading) return; // a second click would create a duplicate course
    let data;
    try {
      data = await addCourse(fd).unwrap();
    } catch (e) {
      dispatch(setUploadProgress(0))
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "error",
          message: e?.data?.message ?? "We lost the connection while uploading. Please check the course list before submitting again, as the course may have been saved.",
          autoHideDuration: 10000,
          vertical: "top",
          horizontal: "right"
        }
      ));
      return;
    }
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
      name: "Course Detail",
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
    category_id: {
      type: 'select',
      label: "Select category",
      group: 2,
      options: categories,
      nameLabel: "name",
      valueLabel: "id",
      colorLabel: "color",
    },
    description: {
      type: 'text',
      label: "Description",
      placeholder: "Enter Description",
      group: 2,
      multiline: true,
      rows: 5,
      required: true,
      grid: 12,
    },
    thumbnail: {
      type: 'file',
      label: "Thumbnail",
      group: 2,
      required: false,
      accept: "image",
      dnd: false,
    },
    introduction_video: {
      type: 'file',
      label: "Introduction Video",
      group: 2,
      required: false,
      accept: "video",
      dnd: false,
    },
    // tags: {
    //   type: 'text',
    //   label: "Tags",
    //   placeholder: "Enter Tags",
    //   group: 2,
    //   multiline: false,
    //   rows: 3,
    //   required: true,
    // },
    type: {
      type: 'select',
      label: "Type",
      group: 2,
      required: true,
      options: [{name: "Regular Course", value: "course"}, {name: "Book", value: "book"}],
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      flex: false,
      multiple: false,
      checkbox: false,
      avatar: false,
    },
    pdf_files: {
      type: 'files',
      label: "PDF Files",
      group: 2,
      required: false,
      accept: "pdf",
      grid: 12,
      dependencies: {
        op: "&&",
        dependencies: {
          type: {
            op: "==",
            value: "book",
            valueType: "string",
            type: "value",
            formula: [],
          },
        },
      },
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

export default AddCourse;