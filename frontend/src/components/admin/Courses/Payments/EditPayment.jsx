import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { hideDialog, hideSidebar, setAlert } from '../../../../app/slices/commonSlice';
import FormGenerator from '../../../utils/CrudComponents/FormGenerator';
import { useGetPaymentQuery, useUpdatePaymentMutation } from '../../../../features/main/paymentsApiSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';

const EditPayment = ({ newPage = false, fullScreenFormStyle=false, doubleHistoryBack=false, viewPanel="dialog", bulk = false, parentId, users, courses, chapters }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const editId = useSelector(state=>state?.common?.editId);
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const {data: payment} = bulk ? {} : useGetPaymentQuery(editId);
  
  /* formData variables */
  const [editFormData, setEditFormData] = useState({
    user_id: {value: "", error: ""},
    course_id: {value: "", error: ""},
    chapter_id: {value: "", error: ""},
    amount: {value: 0, error: ""},
    currency: {value: "", error: ""},
  });
  
  useEffect(()=>{
    if(payment) {
      setEditFormData({
        user_id: { value: payment?.user_id??"", error: "" },
        course_id: { value: payment?.course_id??"", error: "" },
        chapter_id: { value: payment?.chapter_id??"", error: "" },
        amount: { value: payment?.amount??"", error: "" },
        currency: { value: payment?.currency??"", error: "" },
      });
    }
  }, [payment])
  
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
  const [updatePayment, {isLoading}] = useUpdatePaymentMutation()
  
  const submitForm = async () => {
    const submitData = {
      id: editId,
      _user_id: editFormData?.user_id?.value,
      _course_id: editFormData?.course_id?.value,
      _chapter_id: editFormData?.chapter_id?.value,
      _amount: editFormData?.amount?.value,
      _currency: editFormData?.currency?.value,
    };
    let data;
    data = await updatePayment(submitData).unwrap();
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
    chapter_id: {
      type: 'select',
      label: "Select chapter",
      group: 1,
      options: chapters,
      nameLabel: "title",
      valueLabel: "id",
      colorLabel: "color",
    },
    amount: {
      type: 'currency',
      label: "Amount",
      placeholder: "Enter Amount",
      group: 1,
      required: false,
    },
    currency: {
      type: 'select',
      label: "Currency",
      group: 1,
      required: false,
      options: [{name: "ETB", value: "ETB"}, {name: "USD", value: "USD"}],
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      flex: false,
      multiple: false,
      checkbox: false,
      avatar: false,
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

export default EditPayment;