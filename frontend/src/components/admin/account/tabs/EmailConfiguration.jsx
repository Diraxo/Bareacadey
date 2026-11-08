import { useState, useEffect, forwardRef } from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Select from "@mui/material/Select";
import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import AlertTitle from "@mui/material/AlertTitle";
import IconButton from "@mui/material/IconButton";
import CardContent from "@mui/material/CardContent";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import {MdClose, MdOutlineVisibility, MdOutlineVisibilityOff} from "react-icons/md";

import { useDispatch, useSelector } from "react-redux";
import { useGetconfigQuery, useUpdateConfigMutation } from "../../../../features/user/configApiSlice";
import { setCredentials } from "../../../../features/auth/authSlice";
import { setAlert } from "../../../../app/slices/commonSlice";
import { OutlinedInput, InputAdornment, Divider } from "@mui/material";
import { CheckboxOverlay } from "../../../utils/CrudComponents/InputsOverlay";
import Loader from "../../../utils/Loader";

const ImgStyled = styled("img")(({ theme }) => ({
  width: 120,
  height: 120,
  marginRight: theme.spacing(6.25),
  borderRadius: theme.shape.borderRadius,
}));

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    textAlign: "center",
  },
}));

const ResetButtonStyled = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(4.5),
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    marginLeft: 0,
    textAlign: "center",
    marginTop: theme.spacing(4),
  },
}));

const EmailConfiguration = () => {
  // ** redux

  const dispatch = useDispatch();
  const {
    data: config,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetconfigQuery();
  const [updateConfig,] = useUpdateConfigMutation();

  const [formData, setFormData] = useState({
    service: "",
    host: "",
    port: "465",
    user: "",
    pass: "",
    secure: false,
    email_friendly_name: '"Bare Academy 🙂" <info@doheexpress.net>',
    expires_in: "1h",
    showPassword: false,
    enableService: true, 
    enableHost: true,
    enablePort: false,
  });

  useEffect(()=>{
    if(config && config[0]?.type == "email") {
      let configData = JSON.parse(config[0]?.config);
      setFormData({
        ...formData,
        service: configData?.service ?? "",
        host: configData?.host ?? "",
        port: configData?.port ?? "465",
        user: configData?.auth?.user ?? "",
        pass: configData?.auth?.pass ?? "",
        email_friendly_name: configData?.additional?.email_friendly_name,
        expires_in: configData?.additional?.expires_in ?? "1h",
        enableService: configData?.enable?.enableService??true,
        enableHost: configData?.enable?.enableHost ?? true,
        enablePort: configData?.enable?.enablePort ?? false,
      })
    }
  },[config])

  const submitForm = async (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    let conf = {};
    conf.service = formData?.service;
    conf.host = formData?.host;
    conf.port = formData?.port ? parseInt(formData?.port) : 465;
    let auth = {};
    auth.user = formData?.user;
    auth.pass = formData?.pass;
    conf.auth = auth;
    let additional = {};
    additional.email_friendly_name = formData?.email_friendly_name;
    additional.expires_in = formData?.expires_in;
    conf.additional = additional;
    let enable = {};
    enable.enableService = formData?.enableService;
    enable.enableHost = formData?.enableHost;
    enable.enablePort = formData?.enablePort;
    conf.enable = enable;

    let config = JSON.stringify(conf);
    data.append("id", 1)
    data.append("config", config);

    const configData = await updateConfig(data).unwrap();
    if(configData?.message==="Successfully Updated") {
      dispatch(setAlert({
        openAlert: true,
        severity: "success",
        message: configData?.message,
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "right"
      }))
    }
  };
  
  // Handle  Password
  const handlePasswordChange = prop => event => {
    setFormData({ ...formData, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword })
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }
  
  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    setLoading(false)
  },[])

  return loading ? <Loader/> : (
    <CardContent>
      <div className="mt-4"></div>
      <form onSubmit={submitForm} encType="multipart/form-data">
        <Grid container spacing={7}>

          <Grid item xs={12} sm={6}>
            <CheckboxOverlay
              labelText="Enable Service"
              value={formData.enableService ?? true}
              onChange={(e) => {
                setFormData({ ...formData, enableService: e.target.checked });
              }}
              sx={{maxWidth: 200}}
            />
            <div className="mb-2"></div>
            <TextField
              fullWidth
              label="Service"
              placeholder="Service"
              value={formData.service ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, service: e.target.value });
              }}
              disabled={!formData?.enableService}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
           <CheckboxOverlay
              labelText="Enable Host"
              value={formData.enableHost ?? true}
              onChange={(e) => {
                setFormData({ ...formData, enableHost: e.target.checked });
              }}
              sx={{maxWidth: 200}}
            />
            <div className="mb-2"></div>
            <TextField
              fullWidth
              label="Host"
              placeholder="Host"
              value={formData.host ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, host: e.target.value });
              }}
              disabled={!formData?.enableHost}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
           <CheckboxOverlay
              labelText="Enable Port"
              value={formData.enablePort ?? false}
              onChange={(e) => {
                setFormData({ ...formData, enablePort: e.target.checked });
              }}
              sx={{maxWidth: 200}}
            />
            <div className="mb-2"></div>
            <TextField
              fullWidth
              label="Port"
              placeholder="Port"
              value={formData.port ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, port: e.target.value });
              }}
              disabled={!formData?.enablePort}
            />
          </Grid>
         
          <Grid item xs={12} sx={{mt: 4,mb: 4}}>
              <Divider textAlign="center" style={{fontWeight: 'bold'}}>Email Auth Settings</Divider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="User"
              placeholder="User"
              value={formData.user ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, user: e.target.value });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ marginTop: 0 }}>
            <FormControl fullWidth>
              <InputLabel htmlFor='account-settings-password'>Password</InputLabel>
              <OutlinedInput
                label='Password'
                value={formData?.pass}
                id='account-settings-password'
                type={formData.showPassword ? 'text' : 'password'}
                onChange={handlePasswordChange('pass')}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      aria-label='toggle password visibility'
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {formData.showPassword ? <MdOutlineVisibility /> : <MdOutlineVisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sx={{mt: 4,mb: 4}}>
              <Divider textAlign="center" style={{fontWeight: 'bold'}}>Additional Settings</Divider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Friendly Name"
              placeholder="Friendly Name"
              value={formData.email_friendly_name ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, email_friendly_name: e.target.value });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expires In"
              placeholder="Expires In"
              value={formData.expires_in ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, expires_in: e.target.value });
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" sx={{ marginRight: 3.5 }} type="submit">
              Save Changes
            </Button>
            <Button type="reset" variant="outlined" color="secondary">
              Reset To Default
            </Button>
          </Grid>
        </Grid>
      </form>
      <div className="mb-10"></div>
    </CardContent>
  );
};

export default EmailConfiguration;
