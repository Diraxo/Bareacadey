import { useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import { styled, useTheme } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import MuiFormControlLabel from "@mui/material/FormControlLabel";

import Google from "mdi-material-ui/Google";
import Github from "mdi-material-ui/Github";
import Twitter from "mdi-material-ui/Twitter";
import Facebook from "mdi-material-ui/Facebook";
import EyeOutline from "mdi-material-ui/EyeOutline";
import EyeOffOutline from "mdi-material-ui/EyeOffOutline";

import themeConfig from "../../configs/themeConfig";

import { AiOutlineUser, AiOutlineLock } from "react-icons/ai";
import {MdOutlineLogin, MdSend} from 'react-icons/md';

import Logo from '../../assets/logo.png';

import { useDispatch } from "react-redux";
import { setAlert } from "../../app/slices/commonSlice";

import { useSetNewPasswordMutation } from "../../features/auth/authApiSlice";
import { setCredentials } from "../../features/auth/authSlice";
import { useEffect } from "react";

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

const ResetPasswordPage = () => {

  const dispatch = useDispatch();
  const [setPassword, {isLoading}] = useSetNewPasswordMutation()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search);
  const resetToken = queryParams.get('reset_token');

  const [formData, setFormData] = useState({
    confirm_password: "",
    password: "",
    showPassword: false,
    showConfirmPassword: false
  });

  let [errors, setErrors] = useState({
    confirm_password: "",
    password: "",
  })

  const theme = useTheme();
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    if(prop==="confirm_password") {
      errors.confirm_password = event.target.value == formData?.password ? "" : "Password didn't match";
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

  const handleClickShowConfirmPassword = () => {
    setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword });
  };

  const handleMouseDownConfirmPassword = (event) => {
    event.preventDefault();
  };

  const validate = () => {
    let temp = {};
    temp.confirm_password = formData.password==formData.confirm_password ? "" : "Password didn't match";
    temp.password = formData.password ? "" : "Password is required";
    setErrors(temp)
    return Object.values(temp).every(x => x=="");
  }

  const validateToken = async () => {
    if(!resetToken) {
      navigate("/auth/login")
    }

    const checkToken = await setPassword({resetToken: resetToken}).unwrap()
    if(!checkToken) {
      navigate("/auth/login")
    }
    if(checkToken?.error) {
      navigate("/auth/login")
    }
  }
  useEffect(()=>{
    validateToken()
  },[])

  const ResetPassword = async () => {
    if(!validate()) {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "Enter correct password first!",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "center"
      }))
      return;
    }
    try {
      const updatedPassword = await setPassword({newPassword: formData.password, resetToken: resetToken}).unwrap()
      console.log(updatedPassword)
      if(!updatedPassword) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "Invalid Token",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      }
      else if(updatedPassword?.error) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: updatedPassword?.message ?? "Invalid Token",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      }
      else if(updatedPassword?.message) {
        dispatch(setAlert({
          openAlert: true,
          severity: "success",
          message: updatedPassword?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right"
        }))
      }
      navigate("/auth/login")
   } catch (err) {
        console.log(err)
         dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "Something went wrong",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
        navigate("/auth/login")
   }

  }

  return (
    <Box 
      className="min-h-screen flex items-center justify-center"
      style={{
        //background:  "linear-gradient(to right, #0f1048, #0f1048), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #EEEFAF 0%, #C3E3FA 100%)",
        //clipPath: "polygon(0% 5%, 100% 15%, 100% 100%, 0% 90%, 0% 100%)",
        //background: "linear-gradient(to right, #42d0ff, #5bb0ff), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #EEEFAF 0%, #C3E3FA 100%)",
        //clipPath: "polygon(0% 0%, 100% 0%, 100% 50%, 0% 40%, 0% 100%)"
      }}
    >
      <div style={{
        position: 'absolute',
        width: '100vw',
        height: '100vh',
        background: "linear-gradient(to right, #42d0ff, #5bb0ff), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #EEEFAF 0%, #C3E3FA 100%)",
        clipPath: "polygon(0% 0%, 100% 0%, 100% 50%, 0% 40%, 0% 100%)"
      }}>
        </div>
      <Card sx={{ zIndex: 1, marginLeft: 5, marginRight: 5 }}>
        <CardContent
          sx={{ padding: (theme) => `${theme.spacing(12, 9, 7)} !important` }}
        >
          <Box
            sx={{
              mb: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={Logo} style={{width: 130}} />
            <Divider 
               orientation="vertical" 
               flexItem 
               sx={{ml:4, mr:4, borderRightWidth: 3, borderColor: theme.palette.primary.main}}
              />
            <Typography
              variant="h6"
              sx={{
                lineHeight: 1,
                fontWeight: 600,
                fontSize: "1.8rem !important",
              }}
            >
              {themeConfig.templateName}
            </Typography>
          </Box>
          <Box sx={{ mb: 6 }}>
          
            <Typography variant="body2" sx={{fontSize: "20px", marginTop: 10 }}>
              Set New Password
            </Typography>
          </Box>
          <form
            noValidate
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            
              <TextField
                label="Password"
                placeholder="Enter password"
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
                  width: '100%'
                }}
              />

              <TextField
                label="Confirm Password"
                placeholder="Enter password"
                value={formData.confirm_password}
                id="auth-login-confirm-password"
                onChange={handleChange("confirm_password")}
                type={formData.showConfirmPassword ? "text" : "password"}
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
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownConfirmPassword}
                        aria-label="toggle password visibility"
                      >
                        {formData.showConfirmPassword ? <EyeOutline /> : <EyeOffOutline />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                error={errors.confirm_password ? true : false}
                helperText={errors.confirm_password}
                sx={{
                  width: '100%',
                  marginTop: 8,
                  mb:6
                }}
              />


            
              <Button
                fullWidth
                size="large"
                variant="contained"
                sx={{ marginBottom: 4, height: 42 }}
                onClick={() => ResetPassword()}
                // startIcon={<MdOutlineLogin/>}
              >
                Reset Password
              </Button>
              
              
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
