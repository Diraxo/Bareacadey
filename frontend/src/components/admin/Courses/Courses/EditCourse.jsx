import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert, setUploadProgress } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetCourseQuery, useUpdateCourseMutation } from '../../../../features/main/coursesApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import ExistingFilesEdit from '../../../utils/CrudComponents/ExistingFilesEdit';
import Loader from '../../../utils/Loader';

const EditCourse = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId, categories }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: course, isLoading: itemLoading} = bulk ? {} : useGetCourseQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
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
  
  const [serverUrl, setServerUrl] = useState({
    localStorage: {value: "", error: ""}
  })
  
  useEffect(()=>{
    if(course) {
      if(course?.localStorage) {
        setServerUrl((prev) => ({...serverUrl, localStorage: course?.localStorage??""}))
      }
      setEditFormData({
        title: { value: course?.title??"", error: "" },
        category_id: { value: course?.category_id??"", error: "" },
        description: { value: course?.description??"", error: "" },
        thumbnail_existing: { value: JSON.parse(course?.thumbnail)??[], error: "" },
        introduction_video_existing: { value: JSON.parse(course?.introduction_video)??[], error: "" },
        tags: { value: course?.tags??"", error: "" },
        type: { value: course?.type??"", error: "" },
        pdf_files_existing: { value: JSON.parse(course?.pdf_files)??[], error: "" },
        routeState: { value: course?.routeState??"", error: "" },
      });
    }
  }, [course])
  
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
  const [updateCourse, {isLoading}] = useUpdateCourseMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _title: editFormData?.title?.value,
      _category_id: editFormData?.category_id?.value,
      _description: editFormData?.description?.value,
      _tags: editFormData?.tags?.value,
      _type: editFormData?.type?.value,
    };
    
    const fd = new FormData();
    Object.keys(submitData)?.map((sdKey)=>{
      fd.append(sdKey, submitData?.[sdKey])
    })
    
    fd.append('_thumbnail', JSON.stringify(editFormData?.thumbnail_existing?.value))
    fd.append('_introduction_video', JSON.stringify(editFormData?.introduction_video_existing?.value))
    fd.append('_pdf_files', JSON.stringify(editFormData?.pdf_files_existing?.value))
    if(editFormData?.thumbnail?.value?.length > 0)  {
      for (const file of editFormData?.thumbnail?.value) {
        fd.append("thumbnail",file)
      }
    }
    
    if(editFormData?.introduction_video?.value?.length > 0)  {
      for (const file of editFormData?.introduction_video?.value) {
        fd.append("introduction_video",file)
      }
    }

    if(editFormData?.pdf_files?.value?.length > 0)  {
      for (const file of editFormData?.pdf_files?.value) {
        fd.append("pdf_files",file)
      }
    }
    
    let data;
    data = await updateCourse(fd).unwrap();
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
      name: "Course Detail",
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
    thumbnail_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.thumbnail_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.thumbnail_existing?.value} onChange={(files)=>setEditFormData({...editFormData, thumbnail_existing: {...editFormData?.thumbnail_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    introduction_video: {
      type: 'file',
      label: "Introduction Video",
      group: 2,
      required: false,
      accept: "video",
      dnd: false,
    },
    introduction_video_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.introduction_video_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.introduction_video_existing?.value} onChange={(files)=>setEditFormData({...editFormData, introduction_video_existing: {...editFormData?.introduction_video_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    type: {
      type: 'select',
      label: "Type",
      group: 2,
      required: false,
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
    pdf_files_existing: {
      type: 'custom',
      group: 2,
      grid: 12,
      element: editFormData?.pdf_files_existing?.value?.length > 0 ? <ExistingFilesEdit files={editFormData?.pdf_files_existing?.value} onChange={(files)=>setEditFormData({...editFormData, pdf_files_existing: {...editFormData?.pdf_files_existing, value: files}})} localStorage={serverUrl?.localStorage??null}/> : null
    },
    // tags: {
    //   type: 'text',
    //   label: "Tags",
    //   placeholder: "Enter Tags",
    //   group: 2,
    //   multiline: false,
    //   rows: 3,
    // },
    submit: {
      type: "submit",
      right: true,
      onClick: submitForm,
      loading: isLoading,
      submitType: "update",
      handleClose: ()=>handleClose(),
    },
  }
  
  return itemLoading ? <Loader /> : (
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

export default EditCourse;