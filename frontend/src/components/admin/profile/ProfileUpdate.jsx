import { useState, useEffect, forwardRef, Suspense } from "react";

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
import DatePickerWrapper from "../../../MuiTheme/styles/libs/react-datepicker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MdClose } from "react-icons/md";
import { OutlinedInput, Divider, InputAdornment } from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import {
  useUpdateUserProfileMutation,
  useGetAccessTokenMutation,
} from "../../../features/user/usersApiSlice";
import { setCredentials } from "../../../features/auth/authSlice";
import { setAlert } from "../../../app/slices/commonSlice";
import { Card } from "@mui/material";

import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import Loader from "../../utils/Loader";

import {useNavigate} from 'react-router-dom';
import AccountDeletionModal from "./AccountDeletionModal";

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

const ProfileUpdate = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate()
  const [updateUser, { isLoading }] = useUpdateUserProfileMutation();
  const [getAccessToken] = useGetAccessTokenMutation();


  // ** redux
  const userInfo = useSelector((state) => state.auth.user);

  
  useState(()=>{
    if(!userInfo) {
     navigate("/")
    }
   },[])

  // ** State
  const [openAlert, setOpenAlert] = useState(!userInfo?.confirmed);

  

  const onChange = (file) => {
    const reader = new FileReader();
    const { files } = file.target;
    if (files && files.length !== 0) {
      reader.onload = () => setFormData({ ...formData, img: reader.result });
      reader.readAsDataURL(files[0]);
    }
  };


 

  const [formData, setFormData] = useState({
    full_name: userInfo?.full_name ?? "",
    phone: userInfo?.phone ?? "",
    gender: userInfo?.gender ?? "",
    date_of_birth: userInfo?.date_of_birth ? new Date(userInfo?.date_of_birth) : null,
    about_me: userInfo?.about_me ?? "",
    role: userInfo?.role ?? "",
    img: userInfo?.img_url ?? "/user.png",
    username: userInfo?.username ?? "",
    email: userInfo?.email ?? "",
    newPassword: "",
    currentPassword: "",
    showNewPassword: false,
    confirmNewPassword: "",
    showCurrentPassword: false,
    showConfirmNewPassword: false,
  });

  const submitEmailOrUsername = async () => {
      if(formData.email || formData.username) {
        const fd = {id: userInfo?.id, email: formData.email, username: formData.username}
        const userData = await updateUser(fd).unwrap();
        // console.log(userData);
        if (userData?.message === "Successfully Updated") {

          if (userData?.emailUpdated || userData.usernameUpdated) {
            let msg = ""
            if(userData.emailUpdated && userData.usernameUpdated) {
              msg = "Both Username & Email Updated Successfully!"
            } else if(userData.emailUpdated) {
              msg = "Email updated Successfully!"
            } else if(userData.usernameUpdated) {
              msg = "Username Updated Successfully!"
            }
            dispatch(
              setAlert({
                openAlert: true,
                severity: "success",
                message: msg,
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
            setTimeout(() => {
              navigate("/admin/main/logout")
            }, 3000);
          } else if (userData?.usernameTaken || userData?.emailTaken) {
            let msg = ""
            if(userData.usernameTaken && userData.emailTaken) {
              msg = "Both Username & Email already taken!"
            } else if(userData.emailTaken) {
              msg = "Email already taken!"
            } else if(userData.usernameTaken) {
              msg = "Username already taken!"
            }
            dispatch(
              setAlert({
                openAlert: true,
                severity: "error",
                message: msg,
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          } else {
            dispatch(
              setAlert({
                openAlert: true,
                severity: "error",
                message: "No change made!",
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          }

          
        }
      }
  }
  const submitForm = async (e) => {
    if(e) {
      e.preventDefault();
    }
    let data = e != null ? new FormData(e.target) : new FormData();
    data.append("id", userInfo?.id);
    if (formData.full_name) data.append("full_name", formData.full_name);
    if (formData.phone) data.append("phone", formData.phone);
    if (formData.gender) data.append("gender", formData.gender);
    if (formData.date_of_birth)
      data.append("date_of_birth", formData.date_of_birth);
    if (formData.about_me) data.append("about_me", formData.about_me);
    if (e && e?.target?.file?.files[0]) {
      data.append("file", e.target.file);
    }
    // if(formData?.currentPassword && (formData?.username || formData?.email)) {
    //   data.append("username", formData?.username)
    //   data.append("email", formData?.email)
    // }
    if (
      formData?.currentPassword &&
      formData?.newPassword &&
      formData?.newPassword == formData?.confirmNewPassword
    ) {
      data.append("old_password", formData?.currentPassword);
      data.append("password", formData?.newPassword);
      
    }

    if(formData.email) {
      formData.email 
    }
    const userData = await updateUser(data).unwrap();
    if (userData?.message === "Successfully Updated") {
      if (userData?.passwordChanged) {
        dispatch(
          setAlert({
            openAlert: true,
            severity: "success",
            message: "Password Changed Successfully!",
            autoHideDuration: 5000,
            vertical: "top",
            horizontal: "right",
          })
        );
        setTimeout(() => {
          navigate("/admin/main/logout")
        }, 3000);
      } else if (userData?.incorrectOldPassword) {
        dispatch(
          setAlert({
            openAlert: true,
            severity: "error",
            message: "Incorrect Password",
            autoHideDuration: 5000,
            vertical: "top",
            horizontal: "right",
          })
        );
      } else {
        dispatch(
          setAlert({
            openAlert: true,
            severity: "success",
            message: userData?.message,
            autoHideDuration: 5000,
            vertical: "top",
            horizontal: "right",
          })
        );
      }

      getAccessToken().then((credentials) => {
        dispatch(setCredentials({ ...credentials.data }));
      });
    }
  };

  // Handle Current Password
  const handleCurrentPasswordChange = (label) => (event) => {
    setFormData({ ...formData, [label]: event.target.value });
  };

  const handleClickShowCurrentPassword = () => {
    setFormData({
      ...formData,
      showCurrentPassword: !formData?.showCurrentPassword,
    });
  };

  const handleMouseDownCurrentPassword = (event) => {
    event.preventDefault();
  };

  // Handle New Password
  const handleNewPasswordChange = (label) => (event) => {
    setFormData({ ...formData, [label]: event.target.value });
  };

  const handleClickShowNewPassword = () => {
    setFormData({ ...formData, showNewPassword: !formData?.showNewPassword });
  };

  const handleMouseDownNewPassword = (event) => {
    event.preventDefault();
  };

  // Handle Confirm New Password
  const handleConfirmNewPasswordChange = (label) => (event) => {
    setFormData({ ...formData, [label]: event.target.value });
  };

  const handleClickShowConfirmNewPassword = () => {
    setFormData({
      ...formData,
      showConfirmNewPassword: !formData?.showConfirmNewPassword,
    });
  };

  const handleMouseDownConfirmNewPassword = (event) => {
    event.preventDefault();
  };

  // eslint-disable-next-line react/display-name
  const CustomInput = forwardRef((props, ref) => {
    return <TextField inputRef={ref} label="Birth Date" fullWidth {...props} />;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, []);

  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const handleAccountDeleteClose = () => setAccountDeleteOpen(false);
  return loading || !userInfo ? (
    <Loader />
  ) : (
    <div style={{margin: 20}}>
    <AccountDeletionModal open={accountDeleteOpen} handleClose={handleAccountDeleteClose} />
    <Card sx={{maxWidth: 900, margin: 'auto'}}>
      <Suspense
        fallback={
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
              margin: "300px 10px",
            }}
          ></div>
        }
      >
        <CardContent>
          <form onSubmit={submitForm} encType="multipart/form-data">
            <Grid container spacing={7}>
              <Grid item xs={12} md={6} sx={{ marginTop: 4.8, marginBottom: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ImgStyled
                    src={formData.img ?? "/user.png"}
                    alt="Profile Pic"
                    crossOrigin="anonymous"
                  />
                  <Box>
                    <ButtonStyled
                      component="label"
                      variant="contained"
                      htmlFor="account-settings-upload-image"
                    >
                      Upload New Photo
                      <input
                        hidden
                        type="file"
                        name="file"
                        onChange={onChange}
                        accept="image/png, image/jpeg"
                        id="account-settings-upload-image"
                      />
                    </ButtonStyled>
                    {/* <ResetButtonStyled
                    color="error"
                    variant="outlined"
                    onClick={() => setFormData({ ...formData, img: "/user.png" })}
                  >
                    Reset
                  </ResetButtonStyled> */}
                    <Typography variant="body2" sx={{ marginTop: 5 }}>
                      Allowed PNG or JPEG. Max size of 1MB.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} alignItems={'center'}>
                <div className="flex justify-end h-full items-center">
                  <Button 
                    variant="contained" 
                    color="error" 
                    className="h-fit"
                    onClick={()=>{
                      setAccountDeleteOpen(true);
                    }}
                  >
                    Delete Account Permanently
                  </Button>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  placeholder="Full name"
                  value={formData.full_name ?? ""}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="Phone number"
                  value={
                    formData.phone?.split("-")[1]
                      ? formData.phone?.split("-")[1]
                      : formData.phone?.split("-")
                  }
                  InputProps={{
                    startAdornment: formData.phone?.split("-")[1] && (
                      <InputAdornment position="start">
                        {formData.phone?.split("-")[0]}
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      phone:
                        formData.phone?.split("-")[0] + "-" + e.target.value,
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePickerWrapper>
                  <DatePicker
                    selected={new Date(formData.date_of_birth)}
                    showYearDropdown
                    showMonthDropdown
                    id="account-settings-date"
                    placeholderText="MM-DD-YYYY"
                    customInput={<CustomInput />}
                    onChange={(date) =>
                      setFormData({ ...formData, date_of_birth: date })
                    }
                  />
                </DatePickerWrapper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  label="About Me"
                  minRows={3}
                  placeholder="Write something about yourself..."
                  value={formData.about_me ?? ""}
                  onChange={(e) => {
                    setFormData({ ...formData, about_me: e.target.value });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  placeholder="Role"
                  disabled
                  defaultValue={userInfo?.role ?? ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Status"
                  placeholder="Status"
                  disabled
                  defaultValue={userInfo?.active ? "Active" : "InActive"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    label="Gender"
                    value={formData.gender ?? "Male"}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                    }}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  sx={{ marginRight: 3.5}}
                  type="submit"
                >
                  Save Changes
                </Button>
                {/* <Button type="reset" variant="outlined" color="secondary">
                  Reset
                </Button> */}
              </Grid>

              {openAlert && false ? (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Alert
                    severity="warning"
                    sx={{ "& a": { fontWeight: 400 } }}
                    action={
                      <IconButton
                        size="small"
                        color="inherit"
                        aria-label="close"
                        onClick={() => setOpenAlert(false)}
                      >
                        <MdClose fontSize="inherit" />
                      </IconButton>
                    }
                  >
                    <AlertTitle>
                      Your email is not confirmed. Please check your inbox.
                    </AlertTitle>
                    <Link href="/" onClick={(e) => e.preventDefault()}>
                      Resend Confirmation
                    </Link>
                  </Alert>
                </Grid>
              ) : null}

              {/* <Grid item xs={12} sx={{ mt: 4, mb: 4 }}>
                <Divider textAlign="center" style={{ fontWeight: "bold" }}>
                  Username And Email Section
                </Divider>
              </Grid> */}
              {/* password area */}
              <Grid item xs={12} sm={12}>
              <Grid item xs={12} sx={{ mt: 4, mb: 10 }}>
                    <Divider textAlign="center" style={{ fontWeight: "bold" }}>
                      Change Username Section
                    </Divider>
                  </Grid>
                <Grid container spacing={5}>
                  <Grid item xs={12} md={6} lg={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      placeholder="Username"
                      value={formData.username ?? ""}
                      disabled
                      InputProps={{ readOnly: true }}
                      helperText="Username cannot be changed here."
                    />
                  </Grid>

                  {/* <Grid item xs={12} md={4} lg={5}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                      }}
                    />
                  </Grid> */}

                  <Grid item xs={12} md={6} lg={6} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      sx={{ marginRight: 3.5  }}
                      // type="submit"
                      onClick={(e)=>{
                        if(formData?.email?.length > 2 || formData?.username?.length > 5) {
                          submitEmailOrUsername()
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                    {/* <Button type="reset" variant="outlined" color="secondary">
                  Reset
                </Button> */}
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 4, mb: 4 }}>
                    <Divider textAlign="center" style={{ fontWeight: "bold" }}>
                      Change Password Section
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ marginTop: 0 }}>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="account-settings-current-password">
                        Current Password
                      </InputLabel>
                      <OutlinedInput
                        label="Current Password"
                        value={formData?.currentPassword}
                        id="account-settings-current-password"
                        type={
                          formData?.showCurrentPassword ? "text" : "password"
                        }
                        onChange={handleCurrentPasswordChange(
                          "currentPassword"
                        )}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label="toggle password visibility"
                              onClick={handleClickShowCurrentPassword}
                              onMouseDown={handleMouseDownCurrentPassword}
                            >
                              {formData?.showCurrentPassword ? (
                                <MdOutlineVisibility />
                              ) : (
                                <MdOutlineVisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ marginTop: 0 }}>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="account-settings-new-password">
                        New Password
                      </InputLabel>
                      <OutlinedInput
                        label="New Password"
                        value={formData?.newPassword}
                        id="account-settings-new-password"
                        onChange={handleNewPasswordChange("newPassword")}
                        type={formData?.showNewPassword ? "text" : "password"}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={handleClickShowNewPassword}
                              aria-label="toggle password visibility"
                              onMouseDown={handleMouseDownNewPassword}
                            >
                              {formData?.showNewPassword ? (
                                <MdOutlineVisibility />
                              ) : (
                                <MdOutlineVisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="account-settings-confirm-new-password">
                        Confirm New Password
                      </InputLabel>
                      <OutlinedInput
                        label="Confirm New Password"
                        value={formData?.confirmNewPassword}
                        id="account-settings-confirm-new-password"
                        type={
                          formData?.showConfirmNewPassword ? "text" : "password"
                        }
                        onChange={handleConfirmNewPasswordChange(
                          "confirmNewPassword"
                        )}
                        error={formData?.confirmNewPassword != formData?.newPassword}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label="toggle password visibility"
                              onClick={handleClickShowConfirmNewPassword}
                              onMouseDown={handleMouseDownConfirmNewPassword}
                            >
                              {formData?.showConfirmNewPassword ? (
                                <MdOutlineVisibility />
                              ) : (
                                <MdOutlineVisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      sx={{ marginRight: 3.5 }}
                      // type="submit"
                      onClick={(e)=>{
                        if((formData?.newPassword == formData?.confirmNewPassword && formData?.newPassword?.length > 5) || ((formData?.email || formData?.username) && formData?.currentPassword)) {
                          submitForm()
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                    {/* <Button type="reset" variant="outlined" color="secondary">
                  Reset
                </Button> */}
                  </Grid>
                </Grid>
              </Grid>

              {/* <Grid
            item
            sm={6}
            xs={12}
            sx={{ display: 'flex', marginTop: [7.5, 2.5], alignItems: 'center', justifyContent: 'center' }}
          >
            <img width={183} alt='avatar' height={256} src='/images/pages/pose-m-1.png' />
          </Grid> */}

              {/* <Grid item xs={12}>
              <Button variant="contained" sx={{ marginRight: 3.5 }} type="submit">
                Save Changes
              </Button>
              <Button type="reset" variant="outlined" color="secondary">
                Reset
              </Button>
            </Grid> */}
            </Grid>
          </form>
          <div className="mt-14" />
        </CardContent>
      </Suspense>
    </Card>
    </div>
  );
};

export default ProfileUpdate;
