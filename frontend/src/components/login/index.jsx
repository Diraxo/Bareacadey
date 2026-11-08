import { useEffect, useState } from "react";

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
import { MdOutlineLogin, MdSend } from 'react-icons/md';

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

const LoginPage = () => {

  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation()
  const [resetPassword, { isLoading: isLoadingResetPassword }] = useResetPasswordMutation()

  const [formData, setFormData] = useState({
    userOrEmail: "",
    password: "",
    showPassword: false,
  });

  const [resetEmail, setResetEmail] = useState("")
  const [errorResetEmail, setErrorResetEmail] = useState("")

  const [page, setPage] = useState("login")

  let [errors, setErrors] = useState({
    userOrEmail: "",
    password: "",
  })

  const theme = useTheme();
  const navigate = useNavigate();

  const handleChange = (prop) => (event) => {
    if (prop === "userOrEmail") {
      errors.userOrEmail = event.target.value ? "" : "Username or email is required";
    }
    else if (prop === "password") {
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
    return Object.values(temp).every(x => x == "");
  }

  const validateResetPassword = () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const validEmail = emailRegex.test(resetEmail)
    setErrorResetEmail(validEmail ? "" : "Enter valid email address")
    return validEmail;
  }



  const ResetPassowrdCallback = async () => {
    if (!validateResetPassword()) {
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

    const data = await resetPassword({ email: resetEmail }).unwrap()
    if (data?.message) {
      if (data?.error) {
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
    setResetEmail(() => "")
    setPage("login")
  }

  const Login = async () => {
    if (!validate()) {
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
      const userData = await login({ userOrEmail: formData.userOrEmail, password: formData.password, device: userAgent }).unwrap()
      dispatch(setCredentials({ ...userData }))
      dispatch(setAlert({
        openAlert: true,
        severity: "success",
        message: userData?.message,
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "right"
      }))
      navigate('/admin')
    } catch (err) {
      console.log(err)
      if (!err?.status) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "No Server Response",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      } else if (err?.status === 400) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: "Missing Username or Password",
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "center"
        }))
      } else if (err?.status === 401) {
        dispatch(setAlert({
          openAlert: true,
          severity: "error",
          message: err?.data?.message ?? "Unauthorized",
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

  const location = useLocation()

  const queryParams = new URLSearchParams(location.search);
  const errorUserNotFount = queryParams.get('e');
  useEffect(()=>{
    if(errorUserNotFount=="1") {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "User Not Fount",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "center"
      }))
    }
  },[])

  const handleGoogleLogin = () => {
    window.open(`${import.meta.env.VITE_API_URL}/auth/google`, '_self');
  };

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
          <div className="mb-4">
            <img src={Logo} style={{ width: 130, height: 120, margin: 'auto' }} />
          </div>
          <Box
            sx={{
              mb: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            {/* <Divider 
               orientation="vertical" 
               flexItem 
               sx={{ml:4, mr:4, borderRightWidth: 3, borderColor: theme.palette.primary.main}}
              /> */}
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
            {page == "login" &&
              <Typography variant="body2" sx={{ fontSize: "17px", marginTop: 10 }}>
                Sign in to your account
              </Typography>
            }
            {page == "reset_password" &&
              <Typography variant="body2" sx={{ fontSize: "20px", marginTop: 10 }}>
                Reset Your Password
              </Typography>
            }
          </Box>
          <form
            noValidate
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            {page == "login" &&
              <TextField
                autoFocus
                fullWidth
                id="email"
                label="Email or username"
                value={formData.userOrEmail}
                onChange={handleChange("userOrEmail")}
                placeholder="Enter email or username"
                sx={{ marginBottom: 6 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AiOutlineUser /></InputAdornment>,
                }}
                error={errors.userOrEmail ? true : false}
                helperText={errors.userOrEmail}

              />
            }
            {page == "login" &&
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
                      <AiOutlineLock />
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
            }

            {/** reset password ui */}
            {page == "reset_password" &&
              <>
                <TextField
                  autoFocus
                  fullWidth
                  id="email"
                  label="Email Address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter email address"
                  sx={{ marginBottom: 4 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AiOutlineUser /></InputAdornment>,
                  }}
                  error={errorResetEmail ? true : false}
                  helperText={errorResetEmail}
                />
                <Box
                  sx={{
                    mb: 4,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <div></div>
                  <Link to="/">
                    <LinkStyled onClick={(e) => {
                      e.preventDefault();
                      setPage("login")
                    }}
                      style={{
                        fontSize: 14,
                      }}
                    >
                      Back to login?
                    </LinkStyled>
                  </Link>
                </Box>
                <ButtonOverlay
                  text="Send Reset Link"
                  size="large"
                  variant="contained"
                  sx={{ marginBottom: 4, height: 40, width: '100%' }}
                  onClick={() => ResetPassowrdCallback()}
                  startIcon={<MdSend />}
                  loading={isLoadingResetPassword}
                  loadingPosition="start"

                />
                {/* <Button
                fullWidth
                size="large"
                variant="contained"
                sx={{ marginBottom: 4, height: 40 }}
                onClick={() => ResetPassowrdCallback()}
                startIcon={<MdSend/>}
              >
                Send Reset Link
              </Button> */}
              </>}
            {page == "login" &&
              <>
                <Box
                  sx={{
                    mb: 4,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <FormControlLabel control={<Checkbox />} label="Remember Me" />
                  <Link to="/">
                    <LinkStyled onClick={(e) => {
                      e.preventDefault();
                      setPage("reset_password")
                    }}>
                      Forgot Password?
                    </LinkStyled>
                  </Link>
                </Box>
                <ButtonOverlay
                  text="Sign In"
                  fullWidth
                  size="large"
                  variant="contained"
                  sx={{ marginBottom: 7, height: 42, }}
                  onClick={() => Login()}
                  startIcon={<MdOutlineLogin />}
                  loading={isLoading}
                  // loadingPosition="end"
                  loadingLabel={"Signing in..."}
                />
                {/* <Button
                fullWidth
                size="large"
                variant="contained"
                sx={{ marginBottom: 7 }}
                onClick={() => Login()}
                startIcon={<MdOutlineLogin/>}
              >
                Login
              </Button> */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ marginRight: 2 }}>
                    Haven't registered yet?
                  </Typography>
                  <Typography variant="body2">
                    <Link to="/auth/register">
                      <LinkStyled>Create an account</LinkStyled>
                    </Link>
                  </Typography>
                </Box>
                {/* <Divider sx={{ my: 5 }}>or</Divider>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Link to="/">
                    <IconButton component="span" onClick={(e) => {
                      e.preventDefault();
                      handleGoogleLogin();
                    }}>
                      <Google sx={{ color: "#db4437" }} />
                    </IconButton>
                  </Link>

                  <Link to="/">
                    <IconButton component="span" onClick={(e) => e.preventDefault()}>
                      <Twitter sx={{ color: "#1da1f2" }} />
                    </IconButton>
                  </Link>

                  <Link to="/">
                    <IconButton component="span" onClick={(e) => e.preventDefault()}>
                      <Facebook sx={{ color: "#497ce2" }} />
                    </IconButton>
                  </Link>                 
                </Box> */}
              </>}
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
