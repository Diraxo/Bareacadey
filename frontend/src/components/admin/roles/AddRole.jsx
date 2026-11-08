import React,{ useEffect, useState } from 'react'
import { useAddRoleMutation } from '../../../features/user/rolesApiSlice'
import FormGenerator from '../../utils/CrudComponents/FormGenerator'
import { useTheme } from '@mui/material/styles'
import { useDispatch } from 'react-redux'
import { hideSidebar, setAlert } from '../../../app/slices/commonSlice'

const AddRole = ({roles, myRole}) => {
    //common variables
    const theme = useTheme();
    const dispatch = useDispatch();

    //formData
    const [addFormData, setAddFormData] = useState({
        role: {value: "", error: ""},
        plural: {value: "", error: ""},
        color: {value: "", error: ""},
        parent: {value: "", error: ""},
    })

    const handleClose = () => {
        dispatch(hideSidebar());
    };

    //rtk query
    const [addRole, {isLoading}] = useAddRoleMutation()
    
    const [ops, setOps] = useState([]);

    useEffect(()=>{
        let options = []
        if(!myRole?.parent) {
            options.push({id: null, role: "No Parent"})
         }
         roles.map((role)=>{
            options.push(role)
         })
         setOps(options)
    },[])

    //submit form callback
    const submitForm = async () => {
        const submitData = {
           role: addFormData?.role?.value,
           plural: addFormData?.role?.value,
           color: addFormData?.color?.value,
           parent: addFormData?.parent?.value,
        }
        const data = await addRole(submitData).unwrap()
        if(data.message==="Successfully Created") {
        dispatch(setAlert(
            {
            openAlert: true,
            severity: "success",
            message: data?.message,
            autoHideDuration: 5000,
            vertical: "top",
            horizontal: "right"
            }
        ))
        if(handleClose) {
            handleClose()
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
        ))
        }
    }

    const globalProperties = {
        //input
        mui: false,
        height: 46,
        focusWidth: 1.7,
        borderWidth: 1.3,
        focusColor: theme.palette.primary.dark,
        borderColor: '#cccccc',
        borderRadius: 5,
        variant: "outlined",
        grid: 12,
        //others
        sx: {mb: 5},   //type=border ? mb: -2 : 0
    }
    const groups = [
        {
          id: 1,
          name: "Role Details",
        },
    ]


    const addSchema = {
        role: {
          type: 'text',
          label: 'Role',
          placeholder: "Role name",
          group: 1,
          grid: 12,
          required: true,
        },
        plural: {
          type: 'text',
          label: 'Plural',
          placeholder: "Plural",
          group: 1,
          grid: 12,
          required: true,
        },
        color: {
          type: 'color',
          label: 'Color',
          placeholder: 'Select color',
          required: true,
          group: 1,
        },
        parent: {
          type: 'select',
          label: 'Parent',
          placeholder: "Select Parent",
          options: ops,
          valueLabel: "id",
          nameLabel: "role",
          imgLabel: "",
          colorLabel: "color",
          group: 1,
          avatar: false,

        },
        submit: {
          type: "submit",
          onClick: submitForm,
          loading: isLoading,
          submitType: "submit",
          submitText: "Register Role",
          right: true,
          //handleClose: ()=>{}
          card: false,
          iconStyle: {width: '100%', height: 26 },
          sx: {borderRadius: 1, width: '100%', height: 40, textTransform: 'capitalize', fontWeight: 700, fontSize: 16}
        }
    }
    return (
        <div>
            <FormGenerator
              schema={addSchema}
              groups={groups}
              formData={addFormData}
              setFormData={setAddFormData}
              type="no-group" //panel, border, label, no-group, horizontal-wizard, vertical-wizard
              alternativeLabel={true}
              globalProperties={globalProperties}        
            />
        </div>
    )
}

export default AddRole