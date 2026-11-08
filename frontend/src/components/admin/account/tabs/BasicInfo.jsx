import { useState, forwardRef } from "react";

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
import DatePickerWrapper from "../../../../MuiTheme/styles/libs/react-datepicker";
import DatePicker from "react-datepicker";
import {MdClose} from "react-icons/md";

import { useDispatch, useSelector } from "react-redux";
import { useUpdateUserMutation, useGetAccessTokenMutation } from "../../../../features/user/usersApiSlice";
import { setCredentials } from "../../../../features/auth/authSlice";
import { setAlert } from "../../../../app/slices/commonSlice";

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

const TabAccount = () => {
  // ** redux
  const userInfo = useSelector((state) => state.auth.user);
  // ** State
  const [openAlert, setOpenAlert] = useState(!userInfo.confirmed);

  const onChange = (file) => {
    const reader = new FileReader();
    const { files } = file.target;
    if (files && files.length !== 0) {
      reader.onload = () => setFormData({ ...formData, img: reader.result });
      reader.readAsDataURL(files[0]);
    }
  };

  const dispatch = useDispatch();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [getAccessToken] = useGetAccessTokenMutation();

  const [formData, setFormData] = useState({
    full_name: userInfo.full_name ?? "",
    phone: userInfo.phone ?? "",
    gender: userInfo.gender ?? "",
    date_of_birth: userInfo.date_of_birth ?? "",
    about_me: userInfo.about_me ?? "",
    role: userInfo.role ?? "",
    img: userInfo.img_url ?? "/user.png",
  });

  const submitForm = async (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    data.append("id", userInfo.id)
    if (formData.full_name) data.append("full_name", formData.full_name);
    if (formData.phone) data.append("phone", formData.phone);
    if (formData.gender) data.append("gender", formData.gender);
    if (formData.date_of_birth)
      data.append("date_of_birth", formData.date_of_birth);
    if (formData.about_me) data.append("about_me", formData.about_me);
    if (e.target.file.files[0]) {
      data.append("file", e.target.file);
    }

    const userData = await updateUser(data).unwrap();
    if(userData?.message==="Successfully Updated") {
            dispatch(setAlert({
              openAlert: true,
              severity: "success",
              message: userData?.message,
              autoHideDuration: 5000,
              vertical: "top",
              horizontal: "right"
            }))
            getAccessToken().then((credentials)=>{
            dispatch(setCredentials({...credentials.data}))
          })
    }
  };
  const CustomInput = forwardRef((props, ref) => {
    return <TextField inputRef={ref} label="Birth Date" fullWidth {...props} />;
  });
  return (
    <CardContent>
      <form onSubmit={submitForm} encType="multipart/form-data">
        <Grid container spacing={7}>
          <Grid item xs={12} sx={{ marginTop: 4.8, marginBottom: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ImgStyled src={formData.img??"/user.png"} alt="Profile Pic" />
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
              defaultValue={formData.phone ?? ""}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
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
              defaultValue={userInfo.role ?? ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Status"
              placeholder="Status"
              disabled
              defaultValue={userInfo.active ? "Active" : "InActive"}
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

          {openAlert ? (
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

          <Grid item xs={12}>
            <Button variant="contained" sx={{ marginRight: 3.5 }} type="submit">
              Save Changes
            </Button>
            <Button type="reset" variant="outlined" color="secondary">
              Reset
            </Button>
          </Grid>
        </Grid>
      </form>
    </CardContent>
  );
};

export default TabAccount;
