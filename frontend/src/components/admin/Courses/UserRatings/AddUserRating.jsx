import React,{useState, useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useAddUserRatingMutation } from '../../../../features/main/userRatingsApiSlice';
import { useNavigate } from 'react-router-dom';

const AddUserRating = ({ newPage=false, fullScreenFormStyle=false, parentId, users, courses }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /* formData variables */
  const [addFormData, setAddFormData] = useState({
    user_id: {value: "", error: ""},
    course_id: {value: "", error: ""},
    rating: {value: 0, error: ""},
    comment: {value: "", error: ""},
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
  const [addUserRating, {isLoading}] = useAddUserRatingMutation()
  
  const submitForm = async () => {
    const submitData = {
      _user_id: addFormData?.user_id?.value,
      _course_id: addFormData?.course_id?.value,
      _rating: addFormData?.rating?.value,
      _comment: addFormData?.comment?.value,
    };
    const data = await addUserRating(submitData).unwrap();
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
  
  let addSchema = {
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
      placeholder: 'Enter Rating',
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
        sideLabelLayout='none'
      />
    </div>
  )
}

export default AddUserRating;