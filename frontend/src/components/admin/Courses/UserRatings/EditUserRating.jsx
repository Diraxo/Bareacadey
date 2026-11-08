import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetUserRatingQuery, useUpdateUserRatingMutation } from '../../../../features/main/userRatingsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditUserRating = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId, users, courses }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: userRating} = bulk ? {} : useGetUserRatingQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    user_id: {value: "", error: ""},
    course_id: {value: "", error: ""},
    rating: {value: 0, error: ""},
    comment: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(userRating) {
      setEditFormData({
        user_id: { value: userRating?.user_id??"", error: "" },
        course_id: { value: userRating?.course_id??"", error: "" },
        rating: { value: userRating?.rating??"", error: "" },
        comment: { value: userRating?.comment??"", error: "" },
      });
    }
  }, [userRating])
  
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
  const [updateUserRating, {isLoading}] = useUpdateUserRatingMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _user_id: editFormData?.user_id?.value,
      _course_id: editFormData?.course_id?.value,
      _rating: editFormData?.rating?.value,
      _comment: editFormData?.comment?.value,
    };
    let data;
    data = await updateUserRating(submitData).unwrap();
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
      id: 1,
      name: "Root",
    },
  ];
  
  let editSchema = {
    user_id: {
      type: 'select',
      label: "Select user",
      group: 1,
      options: users,
      nameLabel: "full_name",
      valueLabel: "id",
      colorLabel: "color",
    },
    course_id: {
      type: 'select',
      label: "Select course",
      group: 1,
      options: courses,
      nameLabel: "title",
      valueLabel: "id",
      colorLabel: "color",
    },
    rating: {
      type: 'number',
      label: "Rating",
      placeholder: "Enter Rating",
      group: 1,
      required: false,
    },
    comment: {
      type: 'text',
      label: "Comment",
      placeholder: "Enter Comment",
      group: 1,
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
        newPage={newPage}
        fullScreenFormStyle={fullScreenFormStyle}
        bulk={bulk}
        viewPanel={viewPanel}
      />
    </div>
  )
}

export default EditUserRating;