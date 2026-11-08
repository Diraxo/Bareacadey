import { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Button,
  Chip,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Popover,
  RadioGroup,
  Radio,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ListItemText,
  OutlinedInput,
  Avatar,
  ListSubheader,
  FormHelperText,
  IconButton,
  InputAdornment,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SketchPicker } from "react-color";
import { Box } from "@mui/system";
import { Editor } from 'primereact/editor';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DesktopDatePicker, MobileDatePicker, TimePicker, DateTimePicker, DesktopTimePicker, DesktopDateTimePicker, MobileTimePicker, MobileDateTimePicker, jaJP } from '@mui/x-date-pickers';
import { Calendar } from 'primereact/calendar';
import {MdCalendarToday, MdClose, MdOutlineVisibility, MdOutlineVisibilityOff, MdSearch} from "react-icons/md";

import { useSelector } from "react-redux";
import { countries } from "../countries";
import MultipleFileUpload from "./MultipleFileUpload";
import SignaturePad from "react-signature-canvas";
import { OverlayPanel } from 'primereact/overlaypanel';
import { useMemo } from "react";

import { PiSignatureDuotone } from "react-icons/pi";
import axios from "axios";

const PrettoSlider = styled(Slider)(({ theme }) => ({
  height: 6,
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    height: 22,
    width: 22,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "unset",
    padding: 0,
    width: 26,
    height: 26,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: theme.palette.primary.main,
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&:before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
}));

const TextFieldStyled = styled(TextField, {
  //shouldForwardProp: (props) => props !== "focuscolor"
})((p) => {
  const theme = useTheme();
  const mode = theme?.palette?.mode || "light";

  const bdColor = mode == "dark" ? "rgba(255,255,255,0.14)" : p.bordercolor;
  const backgroundColor = mode == "dark" ? "#1a1d21" : "";
  const bdRadius = mode == "dark" ? 5 : p.borderradius;
  return ({
  "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiInputLabel-root": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    marginTop: -17
  },
  "& .MuiInputBase-root": {
    borderWidth: p.borderwidth ?? 1.5,
    borderColor: bdColor ?? "#cccccc",
    borderRadius: bdRadius ?? 7,
    "&:hover": {
      //border: `2px solid ${p.focuscolor}`,
    },
    "&.Mui-focused": {
      borderColor: p.focuscolor,
      borderWidth: p.focuswidth,
    },
  },

  "& label.Mui-focused": {
    //color: p.focuscolor,
  },
  "& .MuiInput-underline:after": {
    // borderBottomColor: p.focuscolor,
    height: p.height ? p.height : "", 
  },
  "& .MuiFilledInput-underline:after": {
    // borderBottomColor: p.focuscolor,
    height: p.height ? p.height : "",
  },
  "& .MuiOutlinedInput-root": {
    // "&.Mui-focused fieldset": {
    //   borderColor: p.focuscolor,
    //   borderWidth: p.focuswidth,
    //   boxShadow:".1px .1px .1px rgba(0,0,0,.6)",
    // },
    height: p.height ? p.height : "",
    backgroundColor: backgroundColor
  },
})
});

export const SliderOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  required = false,
  step = 1,
  min = 0,
  max = 100,
  mui=false,
  sx = {},
  labelStyle = {},
  panelType="panel",
  disabled=false,
  
}) => {
  const handleChange = (event, newValue) => {
    onChange
          ? onChange(event, newValue)
          : setFormData
          ? setFormData({
              ...formData,
              [name]: {
                ...formData[name],
                value: newValue,
                error: newValue
                  ? ""
                  : `${
                      labelText ? labelText : name
                    } is required`,
              },
            })
          : setValue
          ? setValue(newValue)
          : () => {
              console.log("no callback defined!");
            };
  };

  

  return  (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <p className="text-[#58545f] dark:text-[#cfcbe4]">{label}</p>
      </label>}
      {!mui &&
      <div className="flex items-center gap-2"> 
        <PrettoSlider
          valueLabelDisplay="auto"
          //aria-label="range-slider"
          value={value ? value : formData ? formData[name]?.value??"" : ""}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          disableSwap
          onChange={(event, newValue) => {
            handleChange(event, newValue)
          }}
          sx={sx}
        />
        <p style={{marginTop: -17, fontWeight: 700}}>{value ? value : formData ? formData[name]?.value??"" : ""}</p>
      </div>
      }
      {mui &&
      <div className="flex items-center gap-2"> 
          <Slider
            valueLabelDisplay="auto"
            aria-label="range-slider"
            value={value ? value : formData ? formData[name]?.value??"" : ""}
            step={step}
            min={min}
            max={max}
            disableSwap
            disabled={disabled}
            onChange={(event, newValue) => {
              handleChange(event, newValue)
            }}
            sx={sx}
          />
          <p style={{marginTop: -17, fontWeight: 700}}>{value ? value : formData ? formData[name]?.value??"" : ""}</p>
      </div>
      }
          {panelType !== "border" && (
              <div
                className="text-red-500"
                style={{
                  fontSize: 12,
                  marginTop: -10,
                  marginBottom: 12,
                  marginLeft: 5,
                }}
              >
                {!required
                  ? ""
                  : formData
                  ? formData[name]?.error
                  : required && !value
                  ? `${labelText ? labelText : name} is required`
                  : ""}
              </div>
            )}
    </div>
  );
};

export const RichTextOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  required = false,
  height = 320,
  labelStyle={},
  panelType="panel",
  image=false,
}) => {
  const editorRef = useRef(null);

  const handleChange = (event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event.htmlValue)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event.htmlValue,
            error: event.htmlValue
              ? ""
              : `${
                  labelText ? labelText : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/uploads/richtext', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = response.data;
      const quill = editorRef.current.getQuill();
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', imageUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const header = (
    <div className="ql-toolbar">
      <div className="ql-formats">
        <select className="ql-font" aria-label="Font"></select>
        <select className="ql-size" aria-label="Size"></select>
      </div>
      <div className="ql-formats">
        <button className="ql-bold" aria-label="Bold"></button>
        <button className="ql-italic" aria-label="Italic"></button>
        <button className="ql-underline" aria-label="Underline"></button>
      </div>
      <div className="ql-formats">
        <select className="ql-color" aria-label="Text Color"></select>
        <select className="ql-background" aria-label="Background Color"></select>
      </div>
      <div className="ql-formats">
        <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
        <button className="ql-list" value="bullet" aria-label="Unordered List"></button>
        <button className="ql-indent" value="-1" aria-label="Decrease Indent"></button>
        <button className="ql-indent" value="+1" aria-label="Increase Indent"></button>
        <select className="ql-align" aria-label="Text Alignment"></select>
      </div>
      <div className="ql-formats">
        <button className="ql-link" aria-label="Insert Link"></button>
      </div>
      <div className="ql-formats">
        {image && <button className="ql-image" aria-label="Insert Image"></button> }
        <button className="ql-video" aria-label="Insert Video"></button>
      </div>
      <div className="ql-formats">
        <button className="ql-script" value="sub" aria-label="Subscript"></button>
        <button className="ql-script" value="super" aria-label="Superscript"></button>
      </div>
      {/* <div className="ql-formats">
        <button className="ql-formula" aria-label="Insert Formula"></button>
        <button className="ql-clean" aria-label="Remove Formatting"></button>
      </div> */}
    </div>
  );

  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],

    ['clean'],                                         // remove formatting button
    ['link', 'image'],                                 // link and image
  ];

  // Register the imageResize module
  //Quill.register("modules/imageResize", ImageResize);

  // const modules = {
  //   toolbar: toolbarOptions,
  //   imageResize: {
  //     modules: ['Resize', 'DisplaySize', 'Toolbar'],
  //   },
  //   imageDrop: false,
  // };




  return (
    <div className="w-full">
      {label &&
      <label className="text-md" style={{...labelStyle}}>
        <p className="text-[#58545f] dark:text-[#cfcbe4]">{label}</p>
      </label>}
      <div className="mt-2"></div>
          <Editor
            ref={editorRef}
            value={value ? value : formData ? formData[name]?.value??"" : ""} 
            onTextChange={(e) => handleChange(e)} 
            style={{ height: height }} 
            headerTemplate={header}
          />
        {panelType !== "border" && (
        <div
          className="text-red-500 mt-2"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
}

export const RadioOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  placeholder="",
  labelText = "",
  required = false,
  options=[],
  nameLabel="label",
  valueLabel="value",
  mui=false,
  sx = {},
  labelStyle = {},
  panelType="panel",
  row=false,
  disabled=false,
  bulk=false,
  
}) => {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange
          ? onChange(event)
          : setFormData
          ? setFormData({
              ...formData,
              [name]: {
                ...formData[name],
                value: value,
                error: value
                  ? ""
                  : `${
                      labelText ? labelText : placeholder ? placeholder : name
                    } is required`,
              },
            })
          : setValue
          ? setValue(value)
          : () => {
              console.log("no callback defined!");
            };
  };

  

  return  (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
       
          <RadioGroup
              name={name}
              value={value ? value : formData ? formData[name]?.value??"" : ""}
              onChange={handleChange}
          >
            <Grid container>
              {options.map((option) => (
               <Grid item xs={!row && 12} key={option[valueLabel]}>
                <FormControlLabel
                  key={option[valueLabel]}
                  value={option[valueLabel]}
                  control={<Radio />}
                  label={option[nameLabel]}
                  disabled={disabled}
                />
              </Grid>
              ))}
            </Grid>
          </RadioGroup>

      {panelType !== "border" && (
          <div
            className="text-red-500"
            style={{
              fontSize: 12,
              marginTop: 1,
              marginBottom: 12,
              marginLeft: 0,
            }}
          >
            {!required
              ? ""
              : formData
              ? formData[name]?.error
              : required && !value
              ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
              : ""}
          </div>
        )}
    </div>
  );
};

export const TextFieldOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  type = "text",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  regex = ".+",
  errorMessage,
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const regexObject = new RegExp(regex)

  const handleValueChange =(event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event.target.value)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event.target.value,
            error: (regexObject.test(event.target.value))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }
  
  const theme = useTheme();
  const mode = theme?.palette?.mode || "light";

  const bdColor = mode == "dark" ? "rgba(255,255,255,0.14)" : borderColor;
  const backgroundColor = mode == "dark" ? "#0E1117" : "";
  const bdRadius = mode == "dark" ? 5 : borderRadius;

  return mui && !bulk ? (
    <TextField
      label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value ? value : formData ? formData[name]?.value??"" : ""}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        // helperText={panelType!=="border" ? "" :
        //   !required ? "" :
        //   formData
        //     ? formData[name]?.error
        //     : required && !value
        //     ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
        //     : ""
        // }
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          // backgroundColor: backgroundColor,
          // border: theme?.palette?.mode=="dark" ? '1px solid #363a3d' : "",
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const FileOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = false,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  errorMessage,
  accept="",
  dnd=false,
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const handleValueChange =(event) => {
    let files = dnd ? event :  event?.target?.files;
    const selectedFiles = Array.from(files);
    onChange
      ? onChange(event)
      : setValue
      ? setValue(selectedFiles)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: selectedFiles,
            error: (selectedFiles.length > 0)
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  function getAcceptString() {
    const fileTypes = accept;
    if(!fileTypes) return "";
    const acceptMap = {
      "video": "video/*",
      "audio": "audio/*",
      "image": "image/*",
      "word_document": ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "pdf": ".pdf,application/pdf",
      "archives": ".zip,.7z,.rar,application/zip,application/x-7z-compressed,application/x-rar-compressed",
      "excel": ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "power_point": ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  
    const fileTypesArray = fileTypes.split(",").map(type => type.trim());
    const acceptArray = [];
    if(fileTypesArray?.includes("all")) return "";
  
    for (let type of fileTypesArray) {
      if (acceptMap[type]) {
        acceptArray.push(acceptMap[type]);
      }
      else {
        console.error(`Invalid file type: ${type}`);
      }
    }
    return acceptArray.join(",");
}

  const theme = useTheme();
  return dnd ? (
    <div className="w-full">
    {!mui && label &&
    <label className="text-md" style={labelStyle}>
      <p className="text-[#58545f] dark:text-[#cfcbe4]">{label}</p>
    </label>}
    <div style={{marginTop: sx?.mt??6,...sx}}>
      <MultipleFileUpload label={labelText??"File"} onFileSelected={handleValueChange} accept={accept}/>
    </div>

    {panelType !== "border" && (
      <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
      </div>
      )}
  </div>
  ) : mui && !bulk ? (
    <TextField
      type="file"
      name={name}
      placeholder={placeholder}
      inputProps={{accept:getAcceptString()}}
      // value={value ? value : formData ? formData[name]?.value??"" : ""}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments,
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type="file"
        name={name}
        placeholder={placeholder}
        inputProps={{accept:getAcceptString()}}
        // value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        // helperText={panelType!=="border" ? "" :
        //   !required ? "" :
        //   formData
        //     ? formData[name]?.error
        //     : required && !value
        //     ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
        //     : ""
        // }
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const EmailOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  // errorMessage="Password must be 8 characters, 1 uppercase letter, and 1 symbol",
  // regex = "^(?=.*[A-Z])(?=.*[!@#$&*])(?=.{8,})"
  // regex = ".+"
  regex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
  errorMessage="Valid email is required",
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  
  const regexObject = new RegExp(regex)

  const handleValueChange =(event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event.target.value)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event.target.value,
            error: (regexObject.test(event.target.value))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const theme = useTheme();
  return mui && !bulk ? (
    <TextField
      label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
      type={"text"}
      name={name}
      placeholder={placeholder}
      value={value ? value : formData ? formData[name]?.value??"" : ""}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type={"text"}
        name={name}
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const PhoneNumberOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  // errorMessage="Password must be 8 characters, 1 uppercase letter, and 1 symbol",
  // regex = "^(?=.*[A-Z])(?=.*[!@#$&*])(?=.{8,})"
  // regex = ".+"
  regex = "^[0-9]{6,11}$",
  errorMessage="Valid phone number is required",
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const defaultCountrycode = useSelector(state=>state.common.defaultCountrycode)
  const regexObject = new RegExp(regex)

  const handleValueChange =(event) => {
    const { value } = event.target;
    const numericValue = value.replace(/\D/g, "");
    onChange
      ? onChange(event)
      : setValue
      ? setValue(numericValue)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: numericValue,
            countryCode: countryCode??defaultCountrycode,
            error: (regexObject.test(numericValue))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const cc = formData ? formData[name]?.countryCode??defaultCountrycode : defaultCountrycode
  const [countryCode, setCountryCode] = useState(cc);

  const handleCountryCodeChange = (event) => {
    const { value } = event.target;
    if(setValue) {
      setCountryCode(value);
    }
    if(formData) {
      setFormData({
        ...formData,
        [name]: {...formData[name], countryCode: value}
      })
    }
  };

  const theme = useTheme();

  function formatPhoneNumber(str) {
    if(str?.length !=  10) {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
      }).format(str)
    }
    let cleaned = str.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else {
      return "";
    }
  }

  return mui && !bulk ? (
    <TextField
      label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
      type="text"
      name={name}
      placeholder={placeholder}
      value={formatPhoneNumber(value ? value : formData ? formData[name]?.value??0 : 0).replace(/,/g, "-")}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments,
        startAdornment: (
          <InputAdornment position="start">
            <TextFieldStyled
              select
              value={formData ? formData[name]?.countryCode??countryCode : countryCode}
              onChange={handleCountryCodeChange}
              // variant="standard"
              borderwidth={0}
              focuswidth={0}
              sx={{
                ml: -4
              }}
            >
              {countries.reduce((acc, country) => {
                    const codes = acc.map(item => item.callingCodes[0]);
                    if (!codes.includes(country.callingCodes[0])) {
                      acc.push(country);
                    }
                    return acc;
                  }, []).sort((a, b) => {
                    return a.callingCodes[0] - b.callingCodes[0];
                  }).map((option, index) => (
                <MenuItem key={option.callingCodes[0]+index} value={"+"+option.callingCodes[0]}>
                  {"+"+option.callingCodes[0]}
                </MenuItem>
              ))}
            </TextFieldStyled>
          </InputAdornment>
        ),
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type={"text"}
        name={name}
        placeholder={placeholder}
        value={formatPhoneNumber(value ? value : formData ? formData[name]?.value??0 : 0).replace(/,/g, "-")}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments,
          startAdornment: (
            <InputAdornment position="start" sx={{ maxWidth: 60, '& fieldset': { border: 'none' } }}>
              <TextFieldStyled
                select
                value={formData ? formData[name]?.countryCode??countryCode : countryCode}
                onChange={handleCountryCodeChange}
                // variant="standard"
                borderwidth={0}
                focuswidth={0}
                
                bordercolor="transparent"
                focuscolor="transparent"
                error={false}
                sx={{
                  ml: -4
                }}
              >
                {countries.reduce((acc, country) => {
                    const codes = acc.map(item => item.callingCodes[0]);
                    if (!codes.includes(country.callingCodes[0])) {
                      acc.push(country);
                    }
                    return acc;
                  }, []).sort((a, b) => {
                    return a.callingCodes[0] - b.callingCodes[0];
                  }).map((option, index) => (
                  <MenuItem key={option.callingCodes[0]+index} value={"+"+option.callingCodes[0]}>
                    {/* {option.name} ({"+"+option.callingCodes[0]}) */}
                    <span style={{marginTop: -2}}>+</span>{option.callingCodes[0]}
                  </MenuItem>
                ))}
              </TextFieldStyled>
            </InputAdornment>
          ),
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const PasswordOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  type = "password",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  // endIcon,
  // errorMessage="Password must be 8 characters, 1 uppercase letter, and 1 symbol",
  // regex = "^(?=.*[A-Z])(?=.*[!@#$&*])(?=.{8,})"
  // regex = ".+"
  regex = "^.{5,}$",
  errorMessage="Password must be atleast 5 characters",
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
    //  endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }

  const [showPassword, setShowPassword] = useState(false)

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const regexObject = new RegExp(regex)

  const handleValueChange =(event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event.target.value)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event.target.value,
            error: (regexObject.test(event.target.value))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const theme = useTheme();
  return mui && !bulk ? (
    <TextField
      label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
      type={showPassword ? "text" : "password"}
      name={name}
      placeholder={placeholder}
      value={value ? value : formData ? formData[name]?.value??"" : ""}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              aria-label="toggle password visibility"
            >
              {showPassword ? <MdOutlineVisibility size={22}/> : <MdOutlineVisibilityOff  size={22}/>}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        // helperText={panelType!=="border" ? "" :
        //   !required ? "" :
        //   formData
        //     ? formData[name]?.error
        //     : required && !value
        //     ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
        //     : ""
        // }
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                aria-label="toggle password visibility"
              >
                {showPassword ? <MdOutlineVisibility size={22}/> : <MdOutlineVisibilityOff  size={22}/>}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const ConfirmPasswordOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  type = "password",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  referName="password",
  errorMessage="Password didn't match",
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
    //  endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }

  const [showPassword, setShowPassword] = useState(false)

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };


  const handleValueChange =(event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event.target.value)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event.target.value,
            error: (formData[referName]?.value === event.target.value)
              ? ""
              : errorMessage??`Password didn't match`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const theme = useTheme();
  return mui && !bulk ? (
    <TextField
      label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
      type={showPassword ? "text" : "password"}
      name={name}
      placeholder={placeholder}
      value={value ? value : formData ? formData[name]?.value??"" : ""}
      onChange={handleValueChange}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
      helperText={
        !required
          ? ""
          : formData
          ? formData[name]?.error
          : required && !value
          ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
          : ""
      }
      variant={variant}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      disabled={disabled}
      size={size}
      sx={{
        ...sx,
      }}
      {...others}
      InputProps={{
        ...adornments,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              aria-label="toggle password visibility"
            >
              {showPassword ? <MdOutlineVisibility size={22}/> : <MdOutlineVisibilityOff  size={22}/>}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleValueChange}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        // helperText={panelType!=="border" ? "" :
        //   !required ? "" :
        //   formData
        //     ? formData[name]?.error
        //     : required && !value
        //     ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
        //     : ""
        // }
        variant="outlined"
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                aria-label="toggle password visibility"
              >
                {showPassword ? <MdOutlineVisibility size={22}/> : <MdOutlineVisibilityOff  size={22}/>}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const NumberOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  mui = false,
  disabled = false,
  labelStyle = {},
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  fractionDigits=2,
  regex = "^\\d+(\\.\\d+)?$",
  errorMessage,
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const regexObject = new RegExp(regex)

  const theme = useTheme();

  const handleChange =(event) => {
    const inputValue = parseFloat(event.target.value.replace(/[^0-9.-]/g, ''));
    onChange
      ? onChange(event)
      : setValue
      ? setValue(isNaN(inputValue) ? 0 : inputValue)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: isNaN(inputValue) ? 0 : inputValue,
            error: (regexObject.test(inputValue))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const inputProps = {
    fullWidth: fullWidth,
    label: mui ? labelText : "",
    name: name,
    variant:variant,
    borderwidth: borderwidth,
    focuswidth: focuswidth,
    focuscolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : focuscolor
        ? focuscolor
        : theme.palette.primary.main,
    bordercolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : borderColor,
    height: height,
    borderradius: borderRadius,
    InputLabelProps: { shrink: mui ? true : false },
    size: size,
    sx: mui ? {...sx} : {
      "& legend": { display: "none" },
      "& fieldset": { top: 0 },
      mb: 4,
      mt: label ? 1 : 0,
      ...sx,
    },
    disabled: disabled,
    error:
      !required
        ? false
        : formData
        ? formData[name]?.error ?? ""
          ? true
          : false
        : required && !value
        ? true
        : false,
    helperText: 
      !required || !mui
        ? ""
        : formData
        ? formData[name]?.error
        : required && !value
        ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
        : "",
  };
  // (!value && !formData[name]?.value && formData[name]?.value !== 0 && value !== 0) ? "" :
  return mui && !bulk ? (
    <TextField
        value={new Intl.NumberFormat('en-US', {
        style: 'decimal',
        //minimumFractionDigits: fractionDigits,
      }).format(value ? value : formData ? formData[name]?.value??0 : 0)}
      onChange={handleChange}
      {...inputProps}
      InputProps={{
        ...adornments
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
        <label className="text-md" style={labelStyle}>
          <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
        </label>}
        <TextFieldStyled
          value={new Intl.NumberFormat('en-US', {
            style: 'decimal',
           // minimumFractionDigits: fractionDigits,
           // maximumFractionDigits: fractionDigits,
          }).format(value ? value : formData ? formData[name]?.value??0 : 0)}
          onChange={handleChange}
          {...inputProps}
          InputProps={{
            ...adornments
          }}
        />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  )
}

export const CurrencyOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  mui = false,
  disabled = false,
  labelStyle = {},
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  regex = "^\\d+(\\.\\d+)?$",
  errorMessage,
  bulk=false,
  minimumFractionDigits,
  maximumFractionDigits,
  currency=""
}) => {
  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }

  const regexObject = new RegExp(regex)

  const cur = currency ? currency : useSelector(state=>state.common.currency)
  const fractionDigit = useSelector(state=>state.common.fractionDigit)
  
  const theme = useTheme();

  const handleChange =(event) => {
    // let inputValue =  event?.target?.value?.replace(/[^0-9.-]+/g, ""); //parseFloat(event.target.value.replace(/[^0-9.-]/g, ''));
    let inputValue = parseFloat(event.target.value.replace(/[^0-9.-]/g, ''));
    onChange
      ? onChange(event)
      : setValue
      ? setValue(isNaN(inputValue) ? 0 : inputValue)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: isNaN(inputValue) ? 0 : inputValue,
            error: (regexObject.test(inputValue))
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const inputProps = {
    fullWidth: fullWidth,
    label: mui ? labelText : "",
    name: name,
    variant:variant,
    borderwidth: borderwidth,
    focuswidth: focuswidth,
    focuscolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : focuscolor
        ? focuscolor
        : theme.palette.primary.main,
    bordercolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : borderColor,
    height: height,
    borderradius: borderRadius,
    InputLabelProps: { shrink: mui ? true : false },
    size: size,
    sx: mui ? {...sx} : {
      "& legend": { display: "none" },
      "& fieldset": { top: 0 },
      mb: 4,
      mt: label ? 1 : 0,
      ...sx,
    },
    disabled: disabled,
    error:
      !required
        ? false
        : formData
        ? formData[name]?.error ?? ""
          ? true
          : false
        : required && !value
        ? true
        : false,
    helperText: 
      !required || !mui
        ? ""
        : formData
        ? formData[name]?.error
        : required && !value
        ? errorMessage ? errorMessage : `${labelText ? labelText : placeholder ? placeholder : name} is required`
        : "",
  };
  return mui && !bulk ? (
    <TextField
        value={new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: fractionDigit ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(value ? value : formData ? formData[name]?.value??0 : 0)}
      onChange={handleChange}
      {...inputProps}
      InputProps={{
        ...adornments
      }}
    />
  ) : (
    <div className="w-full">
      {label &&
        <label className="text-md" style={labelStyle}>
          <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
        </label>}
        <TextFieldStyled
            value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: cur,
            minimumFractionDigits: minimumFractionDigits ? minimumFractionDigits : fractionDigit ? 2 : 0,
            maximumFractionDigits: maximumFractionDigits ? maximumFractionDigits : 2,
          }).format(value ? value : formData ? formData[name]?.value??0 : 0)}
          onChange={handleChange}
          {...inputProps}
          InputProps={{
            ...adornments
          }}
        />
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  )
}

export const DatePickerOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  mui = false,
  disabled = false,
  labelStyle = {},
  panelType = "panel",
  size = "",
  startIcon, 
  endIcon,
  views=['year', 'month', 'day'],
  type="date",
  layout="default",
  bulk=false,
}) => {

  const timeZone = useSelector(state=>state?.common?.timeZone)
  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const handleChange = (date) => {
    setValue(date);
  };
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  // const md = useMediaQuery(theme.breakpoints.down('md'));
  const inputProps = {
    fullWidth: fullWidth,
    label: mui ? labelText : "",
    name: name,
    variant:variant,
    borderwidth: borderwidth,
    focuswidth: focuswidth,
    focuscolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : focuscolor
        ? focuscolor
        : theme.palette.primary.main,
    bordercolor:
      required &&
      !value &&
      (formData ? formData[name]?.error.length > 0 : true)
        ? theme.palette.error.main
        : borderColor,
    height: height,
    borderradius: borderRadius,
    InputLabelProps: { shrink: mui ? true : false },
    size: size,
    sx: mui ? {...sx} : {
      "& legend": { display: "none" },
      "& fieldset": { top: 0 },
      mb: 4,
      mt: label ? 1 : 0,
      ...sx,
    },
    disabled: disabled,
    error:
      !required
        ? false
        : formData
        ? formData[name]?.error ?? ""
          ? true
          : false
        : required && !value
        ? true
        : false,
    helperText: 
      !required || !mui
        ? ""
        : formData
        ? formData[name]?.error
        : required && !value
        ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
        : "",
  };



  const onValueChange=(date) => {
    onChange
      ? onChange(date)
      : setValue
      ? handleChange(date)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: date,
            error: date
              ? ""
              : `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }
  const slots={
    textField: mui ? TextField : TextFieldStyled,
  }
  const slotProps = {
    textField: {
      ...inputProps,
      InputProps:{
         ...adornments
      }
    }
  }

  const slotPropsDesktop = {
    textField: {
      ...inputProps
    }
  }

  const otherProperties = {
    views: views ? views : ['year', 'month', 'day']
  }

  const timeViews = {
  }
  if(views?.includes("hours")) {
    timeViews.views = views;
  }

  const calendarRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
    <div className="w-full">
    {label &&
      <label className="text-md" style={labelStyle}>
        <p className="text-[#58545f] dark:text-[#cfcbe4]">{!mui ? bulk ? label : ((required ? label+(required ? " *": "") : label)) : ""}</p>
      </label>}
        {type==="date" && (
          layout==="default" ? 
          <DatePicker
            value={value ? value : formData ? (formData[name]?.value=="" ? null : formData[name]?.value??Date.now()) : Date.now()}
            onChange={onValueChange}
            slots={slots}
            slotProps={slotPropsDesktop}
            timezone={timeZone}
            {...otherProperties}
          />
          : layout==="desktop" ?
          <DesktopDatePicker
            value={value ? value : formData ? (formData[name]?.value=="" ? null : formData[name]?.value??Date.now()) : Date.now()}
            onChange={onValueChange}
            slots={slots}
            slotProps={slotPropsDesktop}
            timezone={timeZone}
            {...otherProperties}
          />
          :
          <MobileDatePicker
            value={value ? value : formData ? (formData[name]?.value=="" ? null : formData[name]?.value??Date.now()) : Date.now()}
            onChange={onValueChange}
            slots={slots}
            slotProps={slotProps}
            timezone={timeZone}
            {...otherProperties}
          />
          )
        }
        {type==="time" && 
          <MobileTimePicker
            value={value ? value : formData ? (formData[name]?.value=="" ? null : formData[name]?.value??Date.now()) : Date.now()}
            onChange={onValueChange}
            slots={slots}
            slotProps={slotProps}
            timezone={timeZone}
            {...timeViews}
          />
        }
        {type==="datetime" && 
          <MobileDateTimePicker
            value={value ? value : formData ? (formData[name]?.value=="" ? null : formData[name]?.value??Date.now()) : Date.now()}
            onChange={onValueChange}
            slots={slots}
            slotProps={slotProps}
            timezone={timeZone}
            {...timeViews}
          />
        }
        {type==="daterange" &&
           <>
            {mui &&
            <TextField
              value={value ? (value?.length === 2 ? "["+value[0]?.toLocaleDateString()+"] - ["+value[1]?.toLocaleDateString()+"]" : "") : formData ? (formData[name]?.value?.length === 2 ? ""+formData[name]?.value[0]?.toLocaleDateString()+" - "+formData[name]?.value[1]?.toLocaleDateString()+"" : "") :null}
              onClick={handleClick}
              {...inputProps}
              placeholder={bulk ? label : ((required ? label+(required ? " *": "") : label))}
              InputProps={{
                readOnly: true,
                endAdornment: <InputAdornment position="end"><MdCalendarToday/></InputAdornment>,
              }}
            />}
            {!mui &&
            <TextFieldStyled
              value={value ? (value?.length === 2 ? "["+value[0]?.toLocaleDateString()+"] - ["+value[1]?.toLocaleDateString()+"]" : "") : formData ? (formData[name]?.value?.length === 2 ? ""+formData[name]?.value[0]?.toLocaleDateString()+" - "+formData[name]?.value[1]?.toLocaleDateString()+"" : "") :null}
              onClick={handleClick}
              {...inputProps}
              label=""
              placeholder={bulk ? label : ((required ? label+(required ? " *": "") : label))}
              InputProps={{
                readOnly: true,
                ...adornments,
                endAdornment: <InputAdornment position="end"><MdCalendarToday/></InputAdornment>,
              }}
            />}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                style: { minWidth: sm ? 300 : 500 },
              }}
            >
              <Calendar
                ref={calendarRef}
                value={value ? value : formData ? formData[name]?.value??null :null}
                selectionMode="range" 
                onChange={(event)=>{
                  const date = event.value
                  onChange
                  ? onChange(date)
                  : setValue
                  ? handleChange(date)
                  : setFormData
                  ? setFormData({
                      ...formData,
                      [name]: {
                        ...formData[name],
                        value: date,
                        error: date
                          ? ""
                          : `${
                              labelText ? labelText : placeholder ? placeholder : name
                            } is required`,
                      },
                    })
                  : () => {
                      console.log("no callback defined!");
                    };
                    //handleClose();
                }}
                inline 
                showWeek
                className="w-full"
              />
            </Popover>
          </>
        }
       {panelType !== "border" && !mui &&(
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}

    </div>
    </>
  ) 
};

export const CheckboxOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  required = false,
  type = "checkbox",
  errorLabel="You have to agree first to continue",
  sx={},
  panelType = "panel",
  disabled=false,
  labelStyle,
  mui=false,
  bulk=false,
}) => {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange
      ? onChange(event)
      : setValue
      ? setValue(checked)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: checked,
            error: checked
              ? ""
              : `${errorLabel}`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  };
  return (
    <div className="flex">
    {label &&
      <label className="text-md" style={labelStyle}>
        <p className="text-[#58545f] dark:text-[#cfcbe4]">{!mui ? bulk ? label : ((required ? label+(required ? " *": "") : label)) : ""}</p>
      </label>}
      <FormControl
        component="fieldset"
        fullWidth
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
      >
        <FormGroup>
          
          <FormControlLabel
            sx={sx}
            disabled={disabled}
            control={
              <Checkbox
                checked={value ? value || false : formData ? formData[name]?.value || false : false}
                onChange={handleCheckboxChange}
                name={name}
              />
            }
            label={labelText}
          />
        </FormGroup>
        {(!required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false) && (
          <FormHelperText sx={{marginLeft:2, marginTop: 0}}>
            {!required
              ? ""
              : formData
              ? formData[name]?.error
              : required && !value
              ? `${errorLabel}`
              : ""}
          </FormHelperText>
        )}
      </FormControl>
    </div>
  );
};

export const ColorPickerOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  required = false,
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  variant = "outlined",
  fullWidth = true,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
  }
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (event) => {
    onChange
      ? onChange(event)
      : setValue
      ? setValue(event)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: event,
            error: event
              ? ""
              : `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  };
  const theme = useTheme();
  return mui && !bulk ? (
    <div className="w-full">
      <TextField
        label={labelText}//"Color"
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onClick={handleClick}
        fullWidth={fullWidth}
        size={size}
        InputProps={{
          ...adornments,
          endAdornment: (
            <div
              onClick={handleClick}
              style={{
                backgroundColor: value
                  ? value
                  : formData
                  ? formData[name]?.value??""
                  : "",
                width: 30,
                height: 25,
                borderRadius: 5,
              }}
            ></div>
          ),
        }}
        sx={{
          ...sx,
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          style: { minWidth:  300 },
        }}
     >
        <SketchPicker
          color={value ? value : formData ? formData[name]?.value??"" : ""}
          onChange={(color) => handleChange(color.hex)}
        />
      </Popover>
    </div>
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <TextFieldStyled
        // label={label}
        type="text"
        name={name}
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onClick={(e)=>!disabled ? handleClick(e) : ()=>{}}
        InputProps={{
          ...adornments,
          endAdornment: (
            <div
              // onClick={(e)=>!disabled ?  handleClick : ()=>{}}
              style={{
                backgroundColor: value
                  ? value
                  : formData
                  ? formData[name]?.value
                  : "",
                width: 30,
                height: 25,
                borderRadius: 5,
              }}
            ></div>
          ),
        }}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        variant="outlined"
        fullWidth={fullWidth}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        size={size}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <SketchPicker
          color={value ? value : formData ? formData[name]?.value??"" : ""}
          onChange={(color) => handleChange(color.hex)}
        />
      </Popover>
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const SelectOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  options = [],
  placeholder = "",
  multiple=false,
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = true,
  variant = "outlined",
  fullWidth = true,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size,
  nameLabel = "name",
  valueLabel = "id",
  imgLabel="img",
  colorLabel="color",
  checkbox=false,
  flex=false,
  avatar=false,
  startIcon,
  endIcon,
  renderValue,
  renderRegular=false,
  optionRenderFunction,
  filter=false,
  maxSelectCount,
  bulk=false,
}) => {
  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }

  const containsText = (text, searchText) => text?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
  
  const [searchText, setSearchText] = useState("")

  const displayedOptions = useMemo(
    () => options?.filter((option) => containsText(option[nameLabel]??"", searchText)),
    [searchText, options]
  );
    
  const handleChange = (event) => {
    const { value } = event.target;
    if(maxSelectCount != null) {
      if(value?.length > (parseFloat(maxSelectCount) ?? 0)) {
        return;
      }
    }
    onChange
      ? onChange(event)
      : setValue
      ? setValue(value)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: value,
            error: value
              ? ""
              : `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  };
    const handleDelete = (index) => {
     setValue ? setValue(value.filter((v, i) => i !== index)) 
     : setFormData ? setFormData({
      ...formData,
      [name]: {
        ...formData[name],
        value: formData[name]?.value.filter((v,i) => i !== index )
      }
     }) : ()=>{}
    };
    const colors = [
      "#f69e49",
      "#da0ae7",
      "#835e6a",
      "#7f79e8",
      "#c142d6",
      "#c94115",
      "#ee7f12",
      "#008ff2",
      "#416b27",
      "#525b13",
      "#eb1bca",
    ];
    const theme = useTheme();
  return mui && !bulk ? (
    <FormControl
      fullWidth
      variant="outlined"
      size={size}
      error={
        !required
          ? false
          : formData
          ? formData[name]?.error ?? ""
            ? true
            : false
          : required && !value
          ? true
          : false
      }
    >
      <InputLabel id={`${name}-label`} sx={{zIndex: 0}}>{(required ? labelText+(required ? " *": "") : labelText)}</InputLabel>
      <Select
        labelId={`${name}-label`}
        label={(labelText && required ? labelText+(required ? " *": "") : labelText)}
        name={name}
        value={value ? value : formData ? (formData[name]?.value??"") : ""}
        onChange={handleChange}
        multiple={multiple}
        MenuProps={{ autoFocus: false, disableAutoFocusItem: true}}
        onClose={() => setSearchText("")}
        {...adornments}
        renderValue={(selected) => {
          let index = 0;
          if(!multiple) {
            options.map((option,ind)=>{
              if(!multiple && option[valueLabel]===selected) {
                index = ind;
              }
            })
          }
          let color = options[index]?.[colorLabel]??false ? options[index][colorLabel] : colors[index % colors.length];
          return renderValue ? renderValue(selected) : (
          !multiple ?
                (
                  <Box sx={{ display: 'flex', alignItems:'center',  gap: 3 }}>
                    {
                        options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel] ? 
                        <Avatar sx={{ width: 28, height: 28 }} src={options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel]} />
                        :  ""
                      }
                      {
                        avatar &&
                        !options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            options.find(
                              (option) => option[valueLabel] === selected
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      }
                    <p className="text-lg">{
                      options.find(
                        (option) => option[valueLabel] === selected
                      )?.[nameLabel]}
                    </p>
                  </Box>
                )
                : flex ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value, index) => renderRegular ?
                     (
                      <span key={index}><span className="mr-1">{`${index == 0 ? "" : ","}`}</span>{`${options.find(
                        (option) => option[valueLabel] === value
                      )?.[nameLabel]}`}</span>
                    )
                    :(
                      <Chip
                      key={value}
                      sx={{fontWeight: 700}}
                      label={
                        options.find(
                          (option) => option[valueLabel] === value
                        )?.[nameLabel]
                      }
                      avatar={
                        options?.find(
                          (option, indx) => {
                           if(avatar && option[valueLabel]===value) {
                             color = colors[indx % colors.length]+" !important";
                           }
                           return option[valueLabel] === value
                          }
                        )?.[imgLabel] ? 
                        <Avatar src={options?.find(
                          (option) => option[valueLabel] === value
                        )?.[imgLabel]} />
                        : avatar ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 500,
                          }}
                        >
                          {
                            options.find(
                              (option, indx) => option[valueLabel] === value
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        : ""
                      }
                      variant="outlined"
                      onMouseDown={(e)=>{e.stopPropagation()}}
                      onClick = {(e) => {
                        e.stopPropagation()
                        let onClick = options.find(
                          (option) => option[valueLabel] === value
                        )?.onClick
                         if(onClick) {
                            onClick(e)
                         }
                      }}
                      
                      onDelete={()=>{
                        handleDelete(index)
                      }}
                      color="primary"
                    />
                    ))}
                  </Box>
    
                ) : (
                <div>
                  {selected.map((value, index) => {
                    
                    return renderRegular ?
                    (
                      <span><span className="mr-1">{`${index == 0 ? "" : ","}`}</span>{`${options.find(
                        (option) => option[valueLabel] === value
                      )?.[nameLabel]}`}</span>
                    )
                    : (
                    <Chip
                      key={value}
                      sx={{fontWeight: 700}}
                      label={
                        options.find(
                          (option) => option[valueLabel] === value
                        )?.[nameLabel]
                      }
                      avatar={
                        options.find(
                          (option, indx) => {
                           if(avatar && option[valueLabel]===value) {
                            color = colors[indx % colors.length]+" !important";
                           }
                           return option[valueLabel] === value
                          }
                        )?.[imgLabel] ? 
                        <Avatar src={options.find(
                          (option) => option[valueLabel] === value
                        )?.[imgLabel]} />
                        : avatar ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400,
                          }}
                        >
                          {
                            options.find(
                              (option, indx) => option[valueLabel] === value
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        : ""
                      }
                      variant="outlined"
                      onMouseDown={(e)=>{e.stopPropagation()}}
                      onClick = {(e) => {
                        e.stopPropagation()
                        let onClick = options.find(
                          (option) => option[valueLabel] === value
                        )?.onClick
                         if(onClick) {
                            onClick(e)
                         }
                      }}
                      
                      onDelete={()=>{
                        handleDelete(index)
                      }}
                      color="primary"
                    />
                  )
                    }
                  )}
                </div>
                )
        )}}
      >
        {(filter || options?.length >= 10) &&
        <ListSubheader key="subheader-search">
          <TextField
            size="small"
            autoFocus={true}
            placeholder="Search..."
            fullWidth
            value={searchText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={()=>setSearchText("")}><MdClose size={14} style={{opacity: .6}}/></IconButton>
                </InputAdornment>
              )
            }}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") {
                // Prevents autoselecting item while typing (default Select behaviour)
                e.stopPropagation();
              }
            }}
          />
        </ListSubheader>}
        {displayedOptions.map((option, index) => {
           let color = option[colorLabel] ? option[colorLabel] : colors[index % colors.length];
          return  option.group??false ? (
            <ListSubheader  key={option[valueLabel]+"-"+index}>{option[nameLabel]}</ListSubheader>
          ) :
          (!checkbox || !multiple) ? (
            <MenuItem sx={{ml: 2}} value={option[valueLabel]} key={option[valueLabel]+"-"+index}>
                <Box sx={{ display: 'flex', alignItems:'center',  gap: 2 }}>
                  {
                      option[imgLabel] ? 
                      <Avatar sx={{ width: 28, height: 28 }} src={option[imgLabel]} />
                      :  ""
                    }
                    {
                        avatar &&
                        !option[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            option[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      }
                  <p className="text-lg">
                  {optionRenderFunction ? optionRenderFunction(option[nameLabel]) : option[nameLabel]}
                  </p>
                </Box>
            </MenuItem>
          )
           : (
            <MenuItem key={option[valueLabel]+"-"+index} value={option[valueLabel]}>
              <Checkbox
                  // checked={true}
                   checked={formData ? formData[name]?.value.includes(option[valueLabel]) : value ? value.includes(option[valueLabel]) : false  }
                />
                {/* <ListItemText primary={option[nameLabel]} /> */}
                <Box sx={{ display: 'flex', alignItems:'center',  gap: 2 }}>
                  {
                      option[imgLabel] ? 
                      <Avatar sx={{ width: 28, height: 28 }} src={option[imgLabel]} />
                      :  ""
                    }
                    {
                        avatar &&
                        !option[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            option[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      }
                  <p className="text-lg">
                  {optionRenderFunction ? optionRenderFunction(option[nameLabel]) : option[nameLabel]}
                  </p>
                </Box>
            </MenuItem>
           );
        })}
        {displayedOptions?.length <= 0 &&
          <ListSubheader key={"subh-empty"}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 50,
            }}>
              <div className="px-2 py-1 rounded-md" style={{fontWeight: 700, fontSize: 13}}>No available options</div>
            </div>
          </ListSubheader>
        }
      </Select>
    </FormControl>
  ) : (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>
      }
      <TextFieldStyled
        label={
          !multiple && (formData && !formData[name]?.value && !value)
            ? labelText
            : multiple && ((formData ? formData[name]?.value?.length <= 0 : true) && (value ? value?.length <= 0 : true))
            ? labelText
            : ""
        }
        name={name}
        select
        placeholder={placeholder}
        value={value ? value : formData ? formData[name]?.value??"" : ""}
        onChange={handleChange}
        multiple={multiple}
        autoFocus={false}
        SelectProps={{
              multiple: multiple,
              autoFocus: false,
             
              MenuProps: { autoFocus: false, disableAutoFocusItem: true },
              renderValue: (selected) => {
                let index = 0;
                if(!multiple) {
                  options.map((option,ind)=>{
                    if(!multiple && option[valueLabel]===selected) {
                      index = ind;
                    }
                  })
                }
                let color = options[index]?.[colorLabel]??false ? options[index][colorLabel] : colors[index % colors.length];
                return renderValue ? renderValue(selected) : (
                !multiple ?
                (
                  <Box sx={{ display: 'flex', alignItems:'center',  gap: 3 }}>
                    {
                        options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel] ? 
                        <Avatar sx={{ width: 28, height: 28 }} src={options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel]} />
                        :  ""
                      }
                       {
                        avatar &&
                        !options.find(
                          (option) => option[valueLabel] === selected
                        )?.[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            options.find(
                              (option) => option[valueLabel] === selected
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      }
                    <p className="text-lg">{
                      options.find(
                        (option) => option[valueLabel] === selected
                      )?.[nameLabel]}
                    </p>
                  </Box>
                )
                : flex ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value, index) => renderRegular ? 
                    (
                      <span key={index}><span className="mr-1">{`${index == 0 ? "" : ","}`}</span>{`${options.find(
                        (option) => option[valueLabel] === value
                      )?.[nameLabel]}`}</span>
                    )
                    : (
                      <Chip
                      key={value}
                      sx={{fontWeight: 700}}
                      label={
                        options.find(
                          (option) => option[valueLabel] === value
                        )?.[nameLabel]
                      }
                      avatar={
                        options.find(
                          (option, indx) => {
                           if(avatar && option[valueLabel]===value) {
                            color = option[colorLabel] ? option[colorLabel] : colors[indx % colors.length]+" !important";
                           }
                           return option[valueLabel] === value
                          }
                        )?.[imgLabel] ? 
                        <Avatar src={options.find(
                          (option) => option[valueLabel] === value
                        )?.[imgLabel]} />
                        : avatar ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400,
                          }}
                        >
                          {
                            options.find(
                              (option, indx) => option[valueLabel] === value
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        : ""
                      }
                      variant="outlined"
                      onMouseDown={(e)=>{e.stopPropagation()}}
                      onClick = {(e) => {
                        e.stopPropagation()
                        let onClick = options.find(
                          (option) => option[valueLabel] === value
                        )?.onClick
                         if(onClick) {
                            onClick(e)
                         }
                      }}
                      
                      onDelete={()=>{
                        handleDelete(index)
                      }}
                      color="primary"
                    />
                    ))}
                  </Box>
    
                ) : (
                <div>
                  {selected.map((value, index) => 
                  renderRegular ? (
                    
                      <span key={index}><span className="mr-1">{`${index == 0 ? "" : ","}`}</span>{`${options.find(
                        (option) => option[valueLabel] === value
                      )?.[nameLabel]}`}</span>
                    
                  ) : 

                  (
                    <Chip
                      key={value}
                      sx={{fontWeight: 700}}
                      label={
                        options.find(
                          (option) => option[valueLabel] === value
                        )?.[nameLabel]
                      }
                      avatar={
                        options.find(
                          (option, indx) => {
                           if(avatar && option[valueLabel]===value) {
                            color = option[colorLabel] ? option[colorLabel] : colors[indx % colors.length]+" !important";
                           }
                           return option[valueLabel] === value
                          }
                        )?.[imgLabel] ? 
                        <Avatar src={options.find(
                          (option) => option[valueLabel] === value
                        )?.[imgLabel]} />
                        : avatar ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400,
                          }}
                        >
                          {
                            options.find(
                              (option, indx) => option[valueLabel] === value
                            )?.[nameLabel][0]
                          }
                        </Avatar>
                        : ""
                      }
                      variant="outlined"
                      onMouseDown={(e)=>{e.stopPropagation()}}
                      onClick = {(e) => {
                        e.stopPropagation()
                        let onClick = options.find(
                          (option) => option[valueLabel] === value
                        )?.onClick
                         if(onClick) {
                            onClick(e)
                         }
                      }}
                      
                      onDelete={()=>{
                        handleDelete(index)
                      }}
                      color="primary"
                    />
                  ))}
                </div>
                )
              )},
            }}
        error={
          !required
            ? false
            : formData
            ? formData[name]?.error ?? ""
              ? true
              : false
            : required && !value
            ? true
            : false
        }
        
        size={size ?? ""}
        variant="outlined"
        fullWidth={fullWidth}
        borderwidth={borderwidth}
        focuswidth={focuswidth}
        focuscolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : focuscolor
            ? focuscolor
            : theme.palette.primary.main
        }
        bordercolor={
          required &&
          !value &&
          (formData ? formData[name]?.error.length > 0 : true)
            ? theme.palette.error.main
            : borderColor
        }
        height={flex ? "auto" : height}
        borderradius={borderRadius}
        InputLabelProps={{ shrink: false }}
        sx={{
          "& legend": { display: "none" },
          "& fieldset": { top: 0 },
          mb: 4,
          mt: label ? 1 : 0,
          ...sx,
        }}
        disabled={disabled}
        InputProps={{
          ...adornments
        }}
        
      >
         {(filter || options?.length >= 10) &&
        <ListSubheader key="subheader-search">
          <TextField
            size="small"
            autoFocus={true}
            placeholder="Search..."
            value={searchText}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={()=>setSearchText("")}><MdClose size={14} style={{opacity: .6}}/></IconButton>
                </InputAdornment>
              )
          
            }}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") {
                // Prevents autoselecting item while typing (default Select behaviour)
                e.stopPropagation();
              }
            }}
            
          />
        </ListSubheader>}
        {displayedOptions?.map((option, index) => {
          let color = option[colorLabel] ? option[colorLabel] : colors[index % colors.length];
          return  option.group??false ? (
            <ListSubheader  key={option[valueLabel]+"-"+index}>{option[nameLabel]}</ListSubheader>
          ) :
          (!checkbox || !multiple) ? (
            <MenuItem sx={{ml: 2}} value={option[valueLabel]} key={option[valueLabel]+"-"+index}>
                <Box sx={{ display: 'flex', alignItems:'center',  gap: 2 }}>
                  {
                      option[imgLabel] ? 
                      <Avatar sx={{ width: 28, height: 28 }} src={option[imgLabel]} />
                      :  ""
                    }
                    {
                        avatar &&
                        !option[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            option[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      }
                  <p className="text-lg">
                    {optionRenderFunction ? optionRenderFunction(option[nameLabel]) : option[nameLabel]}
                  </p>
                </Box>
            </MenuItem>
          )
           : (
            <MenuItem key={option[valueLabel]+"-"+index} value={option[valueLabel]}>
              <Checkbox
                  // checked={true}
                   checked={formData ? formData[name]?.value.includes(option[valueLabel]) : value ? value.includes(option[valueLabel]) : false  }
                />
                {/* <ListItemText primary={option[nameLabel]} /> */}
                <Box sx={{ display: 'flex', alignItems:'center',  gap: 2 }}>
                  {
                      option[imgLabel] ? 
                      <Avatar sx={{ width: 28, height: 28 }} src={option[imgLabel]} />
                      : avatar ?
                        !option[imgLabel] ? 
                        <Avatar 
                          sx={{ 
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            color: 'white',
                            fontWeight: 400
                          }}
                        >
                          {
                            option[nameLabel][0]
                          }
                        </Avatar>
                        :  ""
                      : ""
                    }
                  <p className="text-lg">
                    {optionRenderFunction ? optionRenderFunction(option[nameLabel]) : option[nameLabel]}
                  </p>
                </Box>
            </MenuItem>
           );
        })}
        {displayedOptions?.length <= 0 &&
          <ListSubheader key="subh-empty">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 50,
            }}>
              <div className="px-2 py-1 rounded-md" style={{fontWeight: 700, fontSize: 13}}>No available options</div>
            </div>
          </ListSubheader>
        }
      </TextFieldStyled>
      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const FilesOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  borderwidth = 1.5,
  focuswidth = 1.7,
  height = 50,
  focuscolor,
  borderRadius = 7,
  borderColor = "#cccccc",
  required = false,
  variant = "outlined",
  fullWidth = true,
  multiline = false,
  rows = 4,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  errorMessage,
  accept="",
  fileLabel,
  bulk=false,
}) => {

  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }
  const handleValueChange =(files) => {
    const selectedFiles = Array.from(files);
    onChange
      ? onChange(files)
      : setValue
      ? setValue(selectedFiles)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: selectedFiles,
            error: (selectedFiles.length > 0)
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
  }

  const theme = useTheme();
  return  (
    <div className="w-full">
      {!mui && label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <div style={{marginTop: sx?.mt??6,...sx}}>
        <MultipleFileUpload label={(fileLabel?fileLabel : labelText)??"Files"} onFileSelected={handleValueChange} accept={accept}/>
      </div>

      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};

export const SignatureOverlay = ({
  value,
  setValue,
  onChange,
  formData,
  setFormData,
  name,
  label = "",
  labelText = "",
  placeholder = "",
  sx,
  required = false,
  mui = false,
  disabled = false,
  labelStyle = {},
  others,
  panelType = "panel",
  size = "",
  startIcon,
  endIcon,
  errorMessage,
  accept="",
  bulk=false,
  fullName="",
  fileType="base64", //file
}) => {
  const user = useSelector(state=>state?.auth?.user)
  const adornments = {
     startAdornment: startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>,
     endAdornment: endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>,
  }

  const ReadFile = (file) => {
    const reader = new FileReader();
    const { files } = file.target;
    let tempFile = null;
    if (files && files.length !== 0) {
      reader.onload = () => {tempFile = reader.result;} //setFormData({ ...formData, img: reader.result });
      reader.readAsDataURL(files[0]);
      return tempFile;
    }
  };

  const handleValueChange =() => {
    const base64String = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
    let file = null;
    if(fileType=="file") {
      const binaryData = atob(base64String);
      file = new Blob([binaryData], { type: "image/png" });
    }
    const selectedFiles = (fileType=="base64") ? base64String : file
    onChange
      ? onChange(selectedFiles)
      : setValue
      ? setValue(selectedFiles)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: selectedFiles,
            error: (selectedFiles?.length > 0)
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
        op?.current?.hide()
  }

  const clearValue =() => {
    const selectedFiles = ""
    onChange
      ? onChange(selectedFiles)
      : setValue
      ? setValue(selectedFiles)
      : setFormData
      ? setFormData({
          ...formData,
          [name]: {
            ...formData[name],
            value: selectedFiles,
            error: (selectedFiles?.length > 0)
              ? ""
              : errorMessage ?? `${
                  labelText ? labelText : placeholder ? placeholder : name
                } is required`,
          },
        })
      : () => {
          console.log("no callback defined!");
        };
        op?.current?.hide()
  }

  const sigCanvas = useRef({});
  const op = useRef(null);

  // const save = () =>
  //   setImageURL(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));

  const clear = () => sigCanvas.current.clear();

  const theme = useTheme();
  const val = (value ? value : formData ? formData[name]?.value??false : false)
  return  (
    <div className="w-full">
      {label &&
      <label className="text-md" style={labelStyle}>
        <div className="text-[#58545f] dark:text-[#cfcbe4]">{bulk ? label : ((required ? label+(required ? " *": "") : label))}</div>
      </label>}
      <div style={{marginTop: sx?.mt??6,...sx}} className={`flex justify-left ${!val ? "pl-4 py-3 border rounded" : ""}`}>
          {val ? (
            <div className="flex justify-between w-full p-3 hover:cursor-pointer">
              <img
                src={fileType=="file" ? FileReader(val) : val}
                alt="signature"
                style={{
                  display: "block",
                  // margin: "0 auto",
                  // border: "1px solid black",
                  maxHeight: 100
                }}
                onClick={(e) => op.current.toggle(e)}
              />
              <Button
                onClick={clearValue}
                size="large"
                variant="contained"
                sx={{
                  height: 30
                }}
              >Clear</Button>
            </div>
          ) : <Button 
                onClick={(e) => op.current.toggle(e)}
                startIcon={<PiSignatureDuotone />}
                variant="contained"
              >Sign Now</Button>}
          <OverlayPanel ref={op} showCloseIcon>
            <div className="flex flex-col m-auto" style={{maxWidth: 350}}>
              <div className="flex gap-1 items-center mb-2">
               <p className="text-lg">Put your signature below</p>
              </div>
              <SignaturePad
                ref={sigCanvas}
                canvasProps={{
                  className: "signatureCanvas rounded",
                }}
                
              />
              <div className="flex items-start mt-3 border-t pt-2 justify-between flex-wrap">
                <div className="flex items-center gap-2">
                  <Button size="small" onClick={handleValueChange} color="success" variant="contained">Save</Button>
                  <Button size="small" onClick={clear} color="error" variant="outlined">Clear</Button>
                </div>
                <p className="text-right font-bold">{fullName ? fullName : (user?.full_name)}</p>
              </div>
            </div>
          </OverlayPanel>
      </div>

      {panelType !== "border" && (
        <div
          className="text-red-500"
          style={{
            fontSize: 12,
            marginTop: -10,
            marginBottom: 12,
            marginLeft: 5,
          }}
        >
          {!required
            ? ""
            : formData
            ? formData[name]?.error
            : required && !value
            ? `${labelText ? labelText : placeholder ? placeholder : name} is required`
            : ""}
        </div>
      )}
    </div>
  );
};