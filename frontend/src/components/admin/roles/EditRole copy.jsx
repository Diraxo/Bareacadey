import React,{useEffect, useState} from 'react'
import { useTheme } from '@mui/material/styles';
import FormGenerator from '../../utils/CrudComponents/FormGenerator';
import { useSelector } from 'react-redux';

import { Grid } from '@mui/material';
import { CheckboxOverlay } from '../../utils/CrudComponents/InputsOverlay';
import { useGetPermissionsQuery, useGetPermissionsGroupedQuery } from '../../../features/user/permissionsApiSlice';
import { useUpdateRolesMutation } from '../../../features/user/rolesApiSlice';
import { useDispatch } from 'react-redux';
import { hideDialog, setAlert } from '../../../app/slices/commonSlice';

const EditRole = ({roles}) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const roleId = useSelector(state=>state.common.editId)
    const userPermissions = useSelector(state=>state.auth.user.permissions)
    const role = roles.find(rl=>rl.id===roleId)
    const {data: permissions, isLoading} = useGetPermissionsQuery()
    const {data: permissionsGrouped, isLoadingGrouped} = useGetPermissionsGroupedQuery()
  
    const handleClose=()=>{
       dispatch(hideDialog())
    }
    const [editFormData, setEditFormData] = useState({
        role: {value: role?.role??"", error: ""},
        plural: {value: role?.plural??"", error: ""},
        color: {value: role?.color??"", error: ""},
        parent: {value: role?.parent??"", error: ""},
        permissions: {value: [], error: ""}
    })
    const [editPermissions, setEditPermissions] = useState({})

    const [updateRoles, {isLoading: updateLoading}] = useUpdateRolesMutation()

    const submitData = async () => {
      if(!role.id) return;
      let perms = [];
      Object.keys(editPermissions).map((key)=>{
        if(editPermissions[key]?.value===true) {
            perms.push(parseInt(key.split("permission")[1]))
        }
      })
       const submitData = {
          id: role.id,
          role: editFormData?.role?.value,
          plural: editFormData?.plural?.value,
          color: editFormData?.color?.value,
          parent: editFormData?.parent?.value,
          permissions: perms,
       }
       const data = await updateRoles(submitData).unwrap()
       if(data.message==="Successfully Updated") {
          //refetch()
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

    

    let perms = {}
    
    const [allowedPermissions, setAllowedPermissions] = useState([])

    useEffect(()=>{
      if(role && permissions) {
          let rolePermissions = []
          permissions.map((permCategory)=>{
            let cat = {category: permCategory.name, permissions: []};
            permCategory.permissions.map((permission)=>{
              
              if(userPermissions.includes(permission.permission)) {
                 cat.permissions.push(permission)
              }
            })
            if(cat.permissions.length > 0) {
              rolePermissions.push(cat)
            }
          })
          
          role.permissions.map((permCategory, index)=>{
            {permCategory.permissions.map((permission)=>{
               if(userPermissions.includes(permission.permission)) {
                 const label = `permission${permission.id}`;
                 
                 perms = {...perms, [label]: { value: true}}
               }
            })}
          })
          if(rolePermissions.length > 0) {
            setAllowedPermissions((allowed)=>rolePermissions)
          }
          setEditPermissions(perms)
        }
    },[role, permissions])
    
    const editSchema = {
      role: {
        type: 'text',
        label: 'Role',
        placeholder: "Role name",
        group: 1,
        grid: 12,
        required: true,
        mui: false
      },
      plural: {
        type: 'text',
        label: 'Plural',
        placeholder: "Plural",
        group: 1,
        grid: 12,
        required: true,
        mui: false
      },
      color: {
        type: 'color',
        label: 'Color',
        placeholder: 'Select color',
        required: true,
        group: 1,
        mui: false,
      },
      parent: {
        type: 'select',
        label: 'Parent',
        placeholder: "Select Parent",
        options: [{id: null, role: "No Parent"},...roles],
        valueLabel: "id",
        nameLabel: "role",
        imgLabel: "",
        group: 1,
        mui: false,
        avatar: false,
      },
      permissions: {
        type: "custom",
        group: 2,
        grid: 12,
        element: (
          <div>
             {allowedPermissions.length <= 0 && <div className='flex justify-center items-center h-48 text-lg'>No privileges to add</div>}
             {allowedPermissions.map((permCategory, index)=>{
                return (
                  <div className='border p-3 rounded-md mb-2 text-lg text-bold' key={index}>
                     {permCategory.category}
                     <div>
                        <Grid container spacing={2}>
                          {permCategory.permissions.map((permission)=>{
                              return (
                                <Grid item key={permission.id}>
                                    <div className='ml-4 p-1 mt-2'>
                                      <CheckboxOverlay
                                        formData={editPermissions}
                                        setFormData={setEditPermissions}
                                        name={`permission${permission.id}`}
                                        labelText={permission.permission}
                                      />
                                    </div>
                                </Grid>
                              )
                          })}
                         </Grid>
                      </div>
                  </div>
                )
             })}
          </div>
        )
      },
      submit: {
        type: "submit",
        onClick: submitData,
        loading: updateLoading,
        submitType: "update",
        handleClose: handleClose
      }
    }
    const globalProperties = {
        //input
        mui: true,
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
        {
          id: 2,
          name: "Permissions"
        }
    ]

    // const schema = {
    //     role: {
    //       type: 'text',
    //       label: 'Role',
    //       placeholder: "Role name",
    //       group: 1,
    //       grid: 12,
    //       required: true,
    //       mui: false,
    //     },
    //     color: {
    //       type: 'color',
    //       label: 'Color',
    //       placeholder: 'Select color',
    //       required: true,
    //       group: 1,
    //     },
    //     parent: {
    //       type: 'select',
    //       label: 'Parent',
    //       placeholder: "Select Parent",
    //       options: [
    //         { value: 1, label: 'Ousman Seid', img: "/user.png"},//group: true
    //         { value: 2, label: 'Faysal Ali', img: "/user.png" },
    //         { value: 3, label: 'Kadar Baxar', img: "/user.png" },
    //       ],
    //       valueLabel: "value",
    //       nameLabel: "label",
    //       imgLabel: "img2",
    //       group: 2,
    //       mui: false,
    //       avatar: true,
    //     },
    //     hobbies: {
    //       type: 'select',
    //       label: 'Hobbies',
    //       options: [
    //         { value: 'reading', label: 'Reading', img2: "/user.png" },
    //         { value: 'writing', label: 'Writing' },
    //         { value: 'drawing', label: 'Drawing' },
    //         { value: 'playing', label: 'Playing' },
    //         { value: 'playing2', label: 'Playing' },
    //         { value: 'playing3', label: 'Playing' },
    //         { value: 'playing4', label: 'Playing' },
    //         { value: 'playing5', label: 'Playing' },
    //         { value: 'playing6', label: 'Playing' },
    //         { value: 'playing7', label: 'Playing' },
    //         { value: 'playing8', label: 'Playing' },
    //         { value: 'playing9', label: 'Playing' },
    //         { value: 'playing10', label: 'Playing' },
    //         { value: 'playing11', label: 'Playing' },
    //       ],
    //       imgLabel: "img2",
    //       group: 2,
    //       valueLabel: "value",
    //       nameLabel: "label",
    //       flex: false,
    //       multiple: true,
    //       checkbox: true,
    //       disabled: false,
    //       mui: false,
    //       avatar: true,

    //     },
    //     agreement: {
    //       type: 'checkbox',
    //       label: 'I agree to the terms and conditions',
    //       required: false,
    //       group: 2,
    //     },
    //     age: {
    //       type: 'slider',
    //       label: 'Age',
    //       min: 18,
    //       max: 65,
    //       step: 1,
    //       group: 2,
    //       mui: false, 
    //     },
    //     gender: {
    //       type: 'radio',
    //       label: 'Gender',
    //       options: [
    //         { value: 'male', label: 'Male' },
    //         { value: 'female', label: 'Female' },
    //         { value: 'other', label: 'Other' },
    //       ],
    //       group: 2,
    //       grid: 8,
    //     },
    //     custom: {
    //       type: 'custom',
    //       element: <div></div>,
    //       group: 2,
    //     },
    //     rich: {
    //       type: 'rich_text_light',
    //       label: "Rich Text Editor",
    //       group: 2,
    //       required: true
    //     }
    // }

    return (
        <div>
            {/* <FormGenerator
              schema={schema}
              groups={groups}
              formData={formData}
              setFormData={setFormData}
              type="panel" //panel, border, label, no-group, wizard
              alternativeLabel={true}
              globalProperties={globalProperties}        
            /> */}
            <FormGenerator
              schema={editSchema}
              groups={groups}
              formData={editFormData}
              setFormData={setEditFormData}
              type="panel" //panel, border, label, no-group, wizard
              alternativeLabel={true}
              globalProperties={globalProperties}        
            />
        </div>
    )
}

export default EditRole