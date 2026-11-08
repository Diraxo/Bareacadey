import React,{useEffect, useState} from 'react'
import { useTheme } from '@mui/material/styles';
import FormGenerator from '../../utils/CrudComponents/FormGenerator';
import { useSelector } from 'react-redux';

import { Grid } from '@mui/material';
import { CheckboxOverlay } from '../../utils/CrudComponents/InputsOverlay';
import { useGetPermissionsGroupedQuery } from '../../../features/user/permissionsApiSlice';
import { useGetUserRolesQuery } from '../../../features/user/rolesApiSlice';
import {useUpdateUserMutation, useGetUserQuery} from '../../../features/user/usersApiSlice'
import { useDispatch } from 'react-redux';
import { hideDialog, setAlert } from '../../../app/slices/commonSlice';
import { countries } from '../../utils/countries';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import GroupedPermissions from '../roles/GroupedPermissions';

const EditUser = ({}) => {
    // console.log(user)
    const editId = useSelector(state=>state.common.editId)
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userPermissions = useSelector(state=>state.auth.user.permissions)
    const {data: permissionsGrouped, isLoading} = useGetPermissionsGroupedQuery()
    const {data: userRoles} = useGetUserRolesQuery()
    const {data: user, refetch} = useGetUserQuery(editId);

    const handleClose=()=>{
       dispatch(hideDialog())
    }
    const [formData, setFormData] = useState({
        //basic info
        full_name: {value: "", error: ""},
        role: {value: "", error: ""},
        phone: {value: "", error: ""},
        date_of_birth: {value: "", error: ""},
        gender: {value: "", error: ""},
        about_me: {value: "", error: ""},
        verified: {value: false, error: ""},
        active: {value: false, error: ""},
        profile_image: {value: [], error: ""},

        /*  credentials */
        email: {value: "", error: ""},
        username: {value: "", error: ""},
        password: {value: "", error: ""},
    });

    useEffect(()=>{
       if(user) {
        setFormData({
          ...formData,
         //basic info
          full_name: {value: user?.full_name??"", error: ""},
          role: {value: user?.role_id??"", error: ""},
          phone: {value: user?.phone?.split('-')[1]??"", error: "", countryCode: user?.phone?.split('-')[0]},
          date_of_birth: {value: new Date(user?.date_of_birth??""), error: ""},
          gender: {value: user?.gender??"", error: ""},
          about_me: {value: user?.about_me??"", error: ""},
          verified: {value: user?.confirmed??false, error: ""},
          active: {value: user?.active??false, error: ""},
       
          /*  credentials */
          email: {value: user?.email??"", error: ""},
          username: {value: user?.username??"", error: ""},
          password: {value: "", error: ""},
        })
       }
    },[user])

    const [addPermissions, setAddPermissions] = useState({})

    
    const [allowedPermissions, setAllowedPermissions] = useState([])
    
    useEffect(()=>{
      if(formData?.role?.value && permissionsGrouped) {
        let perms = {}
          if(!userRoles) return;
          let role = userRoles.find((rl)=>rl.id===formData.role?.value);
          if(!role || !user) return;
          
          let rolePermissions = []

          //extract role permissions into list of array
          let per = role.permissions.map((rp)=>{
            let rolePs = rp.permissions.map((roleP)=> roleP.permission);
            return rolePs
            
          })
          let rolePermissionsArray = []
          per.map((p)=>rolePermissionsArray = [...rolePermissionsArray, ...p])
          //end of extraction

          //filter roles to give to new user by roles included in both the current user roles and selected role
          //so that we can restrict current user from giving privilage beyond his own and the role he selected
          //list of permissions given to user will become intersection of current user permissions and selected role permissions

          permissionsGrouped?.map((permCategory)=>{
            let cat = {category: permCategory.name, permissions: []};
            permCategory?.permissions?.map((permission)=>{
              if(permission?.single) {
                if(userPermissions?.includes(permission?.permission) && rolePermissionsArray?.includes(permission?.permission)) {
                  cat.permissions.push(permission)
                }
              }
              else {
                let permGrouped = {id: permission?.id, permission: permission?.permission, permissions: [], single: permission?.single}
                permission?.permissions?.map((p)=>{
                  if(userPermissions?.includes(p?.permission)  && rolePermissionsArray?.includes(p?.permission)) {
                    permGrouped.permissions.push(p)
                  }
                })
                if(permGrouped?.permissions?.length > 0) {
                  cat.permissions.push(permGrouped)
                }
              }
            })
            if(cat?.permissions?.length > 0) {
              rolePermissions.push(cat)
            }
          })
          //end of that ugly logic

          //store selected permission data that should be fed to the custom inputs
          rolePermissions?.map((permCategory, index)=>{
            {permCategory?.permissions?.map((permission)=>{
              if(permission?.single) {
               if(userPermissions?.includes(permission?.permission)) {
                let selected = false;
                if(user?.permissions?.includes(permission?.permission)) {
                  selected = true;
                }
                 const label = `permission${permission.id}`;
                 
                 perms = {...perms, [label]: { value: selected}}
               }
              }
              else {
                permission?.permissions?.map((p)=>{
                  if(userPermissions?.includes(p?.permission)) {
                    let selected = false;
                    if(user?.permissions?.includes(p?.permission)) {
                      selected = true;
                    }
                     const label = `permission${p.id}`;
                     
                     perms = {...perms, [label]: { value: selected}}
                  }
                })
              }
            })}
          })
          // if(rolePermissions.length > 0) {
            setAllowedPermissions((allowed)=>rolePermissions)
          // }
          setAddPermissions(perms)
        }
    },[formData.role?.value, permissionsGrouped, user, userRoles])


    const [updateUser, {isLoading: addLoading}] = useUpdateUserMutation()

    const submitForm = async () => {

      let perms = [];
      Object.keys(addPermissions).map((key)=>{
        if(addPermissions[key]?.value===true) {
            perms.push(parseInt(key.split("permission")[1]))
        }
      })
       const submitData = {
          //basic
          id: editId,
          full_name: formData.full_name?.value,
          username: formData.username?.value,
          email: formData.email?.value,
          phone: formData.phone?.countryCode+"-"+formData.phone?.value,
          about_me: formData.about_me?.value,
          gender: formData.gender?.value,
          date_of_birth: Date(formData.date_of_birth?.value),
          password: formData.password?.value,
          role: formData.role?.value,
         
          //other
          active: formData.active?.value,
          confirmed: formData.verified?.value,
          permissions: perms,
       }
       const fd = new FormData();
       Object.keys(submitData).map((key)=>{
          fd.append(key,submitData[key])
       })
       if(formData.profile_image?.value?.length > 0)  fd.append("file",formData.profile_image?.value[0])
       const data = await updateUser(fd).unwrap()
       if(data.message==="Successfully Updated") {
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
          navigate("/admin/main/users")
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
        height: 46,
        focusWidth: 1.7,
        borderWidth: 1.3,
        focusColor: theme.palette.primary.dark,
        borderColor: '#cccccc',
        borderRadius: 5,
        variant: "outlined",
        grid: 6,
        mui: false,

        //others
        sx: {mb: 5},   //type=border ? mb: -2 : 0
    }
    const groups = [
        {
          id: 1,
          name: "Basic User Detail",
        },
        {
          id: 4,
          name: "Give Privileges"
        },
        {
            id: 5,
            name: "Credentials"
        }
    ]

    const schema = {
      //basic user info
        full_name: {
          type: 'text',
          label: 'Full Name',
          placeholder: "Full Name",
          group: 1,
          required: true,
        },
        phone: {
          type: 'phone',
          label: 'Phone Number',
          placeholder: "Phone Number",
          group: 1,
          required: true,
        },
      
        date_of_birth: {
          type: 'date',
          label: 'Birth Date',
          inputType: "date", //date, time, datetime, daterange
          layout: "desktop",
          group: 1,
          required: true,
        },
        gender: {
          type: 'radio',
          label: 'Gender',
          row: true,
          options: [
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' },
          ],
          group: 1,
          grid: 12
        },
        role: {
          type: 'select',
          label: 'Select Role',
          placeholder: "Select Role",
          options: userRoles,
          valueLabel: "id",
          nameLabel: "role",
          imgLabel: "img2",
          colorLabel: "color",
          group: 1,
          avatar: true,
        },
        profile_image: {
          type: 'file',
          label: "Profile Image",
          group: 1,
          // onChange:(e)=>console.log(e.target.files)
        },
        about_me: {
          type: 'text',
          label: 'About Me',
          placeholder: "About Me",
          group: 1,
          required: false,
          multiline: true,
          rows: 5,
          grid: 12,
        },
       
        verified: {
          type: 'checkbox',
          label: "Confirm User ( don't require Email Authentication! )",
          group: 1,
          sx: {}
        },
        active: {
          type: 'checkbox',
          label: "Activate User ( user will become active )",
          required: false,
          group: 1,
          sx: {},
          errorMessage: "Activate User is required"
        },
        //give privilages
        permissions: {
          type: "custom",
          group: 4,
          grid: 12,
          element: (
            <div>
               {allowedPermissions.length <= 0 && <div className='flex justify-center items-center h-48 text-lg'>No privileges to add</div>}
               {allowedPermissions?.map((permCategory, index)=>{
                  return (
                    <div className='border p-3 rounded-md mb-2 text-lg text-bold' key={index}>
                       {permCategory?.category}
                       <div>
                          <Grid container spacing={2}>
                            {permCategory?.permissions?.map((permission)=>{
                                return (
                                  <Grid item key={permission.id}>
                                      <div className='ml-4 p-1 mt-2'>
                                        {permission?.single &&
                                          <CheckboxOverlay
                                            formData={addPermissions}
                                            setFormData={setAddPermissions}
                                            name={`permission${permission.id}`}
                                            labelText={permission.permission}
                                          />
                                        }
                                         {!permission?.single &&
                                        <GroupedPermissions 
                                          formData={addPermissions}
                                          setFormData={setAddPermissions}
                                          permission={permission}
                                        />
                                      }
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

        //credentials
        username: {
          type: 'text',
          label: 'Username',
          placeholder: "Username",
          group: 5,
          //inputType: 'number'
        },
        email: {
          type: 'email',
          label: 'Email',
          placeholder: "Email",
          group: 5,
        },
        password: {
          type: 'password',
          label: 'Password',
          placeholder: "Password",
          group: 5,
          mui: false,
        },
        // confirm_password: {
        //   type: 'confirm_password',
        //   label: 'Confirm Password',
        //   placeholder: "Confirm Password",
        //   group: 5,
        //   required: true,
        //   referName: "password"
        // },
        submit: {
          type: "submit",
          right: true,
          onClick: submitForm,
          //loading: updateLoading,
          //submitType: "update",
          // handleClose: handleClose
        },
    }
   
    return (
        <div>
            {/* <p>{JSON.stringify(formData)}</p> */}
            <FormGenerator
              schema={schema}
              groups={groups}
              formData={formData}
              setFormData={setFormData}
              type={"vertical-wizard"} //panel, border, label, no-group, horizontal-wizard, vertical-wizard
              alternativeLabel={true}
              globalProperties={globalProperties}    
              maxWidth={800}    
            />
        </div>
    )
}

export default EditUser