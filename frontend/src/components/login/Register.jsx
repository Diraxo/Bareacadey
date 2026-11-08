import React,{useState} from 'react'
import { useTheme } from '@mui/material/styles';
import FormGenerator from '../utils/CrudComponents/FormGenerator';

import { useDispatch } from 'react-redux';
import { hideDialog, setAlert } from '../../app/slices/commonSlice';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import UserLogo from "./create-account.png";
import { useCreateAccountMutation } from '../../features/auth/authApiSlice';

const RegisterPage = () => {
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        //basic info
        full_name: {value: "", error: ""},
        role: {value: "", error: ""},
        phone: {value: "", error: ""},
        date_of_birth: {value: "", error: ""},
        gender: {value: "Male", error: ""},
        about_me: {value: "", error: ""},
        verified: {value: false, error: ""},
        active: {value: false, error: ""},
        profile_image: {value: [], error: ""},
        
        /*  credentials */
        email: {value: "", error: ""},
        username: {value: "", error: ""},
        password: {value: "", error: ""},
    });




    const [createAccount, {isLoading: addLoading}] = useCreateAccountMutation()

    const submitForm = async () => {
      const userAgent = navigator.userAgent;
       const submitData = {
          //basic
          full_name: (formData.full_name?.value ?? "").trim().replace(/\s+/g, " "),
          username: formData.username?.value,
          email: formData.email?.value,
          phone: formData.phone?.countryCode+"-"+formData.phone?.value,
          about_me: formData.about_me?.value,
          gender: formData.gender?.value,
          date_of_birth: Date(formData.date_of_birth?.value),
          password: formData.password?.value,
          role: formData.role?.value,
          device: userAgent
          
       }
       const fd = new FormData();
       Object.keys(submitData).map((key)=>{
          fd.append(key,submitData[key])
       })
       if(formData.profile_image?.value?.length > 0)  fd.append("file",formData.profile_image?.value[0])
       const data = await createAccount(fd).unwrap()
       if(data.message==="Successfully Registered") {
          dispatch(setAlert(
            {
              openAlert: true,
              severity: "success",
              message: data?.note ? `${data.message}. ${data.note}` : data?.message,
              autoHideDuration: data?.note ? 10000 : 5000,
              vertical: "top",
              horizontal: "right"
            }
          ))
          navigate("/auth/login")
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
        grid: 12,
        mui: false,

        //others
        sx: {mb: 5,},   //type=border ? mb: -2 : 0
    }
    const groups = [
        {
          id: 1,
          name: "Basic User Detail",
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
            // { value: 'Other', label: 'Other' },
          ],
          group: 1,
          grid: 12,
          required: true,
        },
        role: {
          type: 'select',
          label: 'Register As',
          placeholder: "Register As",
          options: [{id: 5, name: "Student"},{id: 12, name: "Instructor/Teacher (needs administrator approval)"}],
          valueLabel: "id",
          nameLabel: "name",
          imgLabel: "img2",
          colorLabel: "color",
          group: 1,
          avatar: true,
          required: true,
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
      
        //credentials
        username: {
          type: 'text',
          label: 'Username',
          placeholder: "Username",
          group: 5,
          required: true,
          //inputType: 'number'
        },
        email: {
          type: 'email',
          label: 'Email',
          placeholder: "Email",
          group: 5,
          required: true
        },
        password: {
          type: 'password',
          label: 'Password',
          placeholder: "Password",
          group: 5,
          required: true,
          mui: false,
        },
        confirm_password: {
          type: 'confirm_password',
          label: 'Confirm Password',
          placeholder: "Confirm Password",
          group: 5,
          required: true,
          referName: "password"
        },
        submit: {
          type: "submit",
          right: true,
          onClick: submitForm,
          leftComponent: <p 
              className='font-bold text-blue-300 hover:cursor-pointer hover:underline'
              onClick={()=>{
                navigate("/auth/login")
              }}
            >
              Back To Login
            </p>,
          //loading: updateLoading,
          submitType: "save",
          submitText: "Register"
        },
    }
   
    return (
        <div className='my-20 flex flex-col w-full items-center'>
            <div className='shadow-2 mb-2 p-4 border w-full rounded-md flex items-center gap-3'style={{maxWidth: 600}}>
              <img src={UserLogo} width={70}/>
              <div className='flex flex-col'>
                 <p className='text-3xl font-bold text-blue-400'>Register New Account</p>
                 <p className='text-md opacity-60'>Register either as student or instructor</p>
              </div>
            </div>
            <FormGenerator
              schema={schema}
              groups={groups}
              maxWidth={600}
              formData={formData}
              setFormData={setFormData}
              type={sm ? "vertical-wizard" :  "horizontal-wizard"} //panel, border, label, no-group, horizontal-wizard, vertical-wizard
              alternativeLabel={true}
              globalProperties={globalProperties}     
            />
        </div>
    )
}

export default RegisterPage