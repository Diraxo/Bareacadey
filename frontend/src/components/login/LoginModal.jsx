import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardContent from "@mui/material/CardContent";
import { styled, useTheme } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import MuiFormControlLabel from "@mui/material/FormControlLabel";


import EyeOutline from "mdi-material-ui/EyeOutline";
import EyeOffOutline from "mdi-material-ui/EyeOffOutline";


import { AiOutlineUser, AiOutlineLock } from "react-icons/ai";
import {MdOutlineLogin, MdSend} from 'react-icons/md';

import Logo from '../../assets/logo.png';

import { useDispatch } from "react-redux";
import { setAlert } from "../../app/slices/commonSlice";

import { useLoginMutation, useResetPasswordMutation } from "../../features/auth/authApiSlice";
import { setCredentials } from "../../features/auth/authSlice";
import { ButtonOverlay } from "../utils/CrudComponents/ComponentsOverlay";

const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: { width: "28rem" },
}));

const LinkStyled = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  textDecoration: "none",
  color: theme.palette.primary.main,
}));

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  "& .MuiFormControlLabel-label": {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
}));

const LoginPageModal = ({onClose=()=>{}}) => {

  const dispatch = useDispatch();
  const [login, {isLoading}] = useLoginMutation()
  const [resetPassword, {isLoading: isLoadingResetPassword}] = useResetPasswordMutation()

  const [formData, setFormData] = useState({
    userOrEmail: "",
    password: "",
    showPassword: false,
  });

  const [resetEmail, setResetEmail] = useState("")
  const [errorResetEmail, setErrorResetEmail]= useState("")

  const [page, setPage] = useState("login")

  let [errors, setErrors] = useState({
    userOrEmail: "",
    password: "",
  })

  const theme = useTheme();

  const handleChange = (prop) => (event) => {
    if(prop==="userOrEmail") {
      errors.userOrEmail = event.target.value ? "" : "Username or email is required";
    }
    else if(prop==="password") {
      errors.password = event.target.value ? "" : "Password is required"
    }
      setFormData({ ...formData, [prop]: event.target.value });
  };
const a = new FormData()

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validate = () => {
    let temp = {};
    temp.userOrEmail = formData.userOrEmail ? "" : "Username or email is required";
    temp.password = formData.password ? "" : "Password is required";
    setErrors(temp)
    return Object.values(temp).every(x => x=="");
  }

  const validateResetPassword = () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const validEmail = emailRegex.test(resetEmail)
    setErrorResetEmail(validEmail ? "" : "Enter valid email address")
    return validEmail;
  }



  const ResetPassowrdCallback = async () => {
    if(!validateResetPassword()) {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "Enter valid email first!",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "center"
      }))
      return;
    }

    const data = await resetPassword({email: resetEmail}).unwrap()
    if(data?.message) {
      if(data?.error) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      }
      else {
        dispatch(setAlert({
          openAlert: true,
          severity: "success",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      }
    }
    else {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "Something went wrong",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "center"
      }))
    }
    setResetEmail(()=>"")
    setPage("login")
  }

  const Login = async () => {
    if(!validate()) {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "Enter all input fields first!",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "center"
      }))
      return;
    }
    try {
      const userAgent = navigator.userAgent;
      const userData = await login({userOrEmail: formData.userOrEmail, password: formData.password, device: userAgent}).unwrap()
      dispatch(setCredentials({...userData}))
      dispatch(setAlert({
        openAlert: true,
        severity: "success",
        message: userData?.message,
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "right"
      }))
      onClose();
   } catch (err) {
      console.log(err)
      if(!err?.status) {
         dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "No Server Response",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      } else if(err?.status === 400) {
         dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "Missing Username or Password",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      } else if(err?.status === 401) {
         dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: err?.data?.message??"Unauthorized",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      } else {
         dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "Login Failed",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      }
   }

  }

  return (
      <Box sx={{ zIndex: 1, marginLeft: 5, marginRight: 5 }}>
        <div
          // sx={{ padding: (theme) => `${theme.spacing(12, 9, 7)} !important` }}
        >
          <div className="mb-4">
          <img src={Logo} style={{width: 130, height: 120, margin: 'auto'}} />
          </div>
          <Box
            sx={{
              mb: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            
            <Typography
              variant="h6"
              sx={{
                lineHeight: 1,
                fontWeight: 600,
                fontSize: "1.8rem !important",
              }}
            >
              <div className="flex gap-2 items-center font-bold text-4xl mr-2">
                <p>BARE</p>
                <p className="text-white bg-blue-400 px-3 py-2 rounded-md">ACADEMY</p>
              </div>
              {/* {themeConfig.templateName} */}
            </Typography>
          </Box>
          <Box sx={{ mb: 6 }}>
          {page=="login" &&
            <Typography variant="body2" sx={{fontSize: "17px", marginTop: 10 }}>
              {/* Sign in to your account */}
            </Typography>
          }
          </Box>
          <form
            noValidate
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-3"
          >
              <TextField
                autoFocus
                fullWidth
                variant="standard"
                id="email"
                label="Email or username"
                value={formData.userOrEmail}
                onChange={handleChange("userOrEmail")}
                placeholder="Enter email or username"
                sx={{ marginBottom: 6 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AiOutlineUser/></InputAdornment>,
                }}
                error={errors.userOrEmail ? true : false}
                helperText={errors.userOrEmail}
                
              />
              <TextField
                label="Password"
                placeholder="Enter password"
                variant="standard"
                value={formData.password}
                id="auth-login-password"
                onChange={handleChange("password")}
                type={formData.showPassword ? "text" : "password"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AiOutlineLock/>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        aria-label="toggle password visibility"
                      >
                        {formData.showPassword ? <EyeOutline /> : <EyeOffOutline />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                error={errors.password ? true : false}
                helperText={errors.password}
                sx={{
                  width: '100%',
                  marginBottom: 8
                }}
              />

      
              <ButtonOverlay
                text="Sign In"
                fullWidth
                size="large"
                variant="contained"
                sx={{ marginBottom: 7, height: 42,}}
                onClick={() => Login()}
                startIcon={<MdOutlineLogin/>}
                loading={isLoading}
                // loadingPosition="end"
                loadingLabel={"Signing in..."}
              />
          </form>
        </div>
      </Box>
  );
};

export default LoginPageModal;
