import React, { useState } from 'react';
import FormGenerator from './FormGenerator';
import { useTheme } from '@mui/material/styles';


const SchemaForm = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
      name: {value: "", error: ""},
      email: {value: "", error: ""},
      password: {value: "", error: ""},
      color: {value: "", error: ""},
      hobbies: {value: [], error: ""},
      agreement: {value: false, error: ""},
      age: {value: 0, error: ""},
      gender: {value: "", error: ""},
  });
  const globalProperties = {
    //input
    mui: false,
    height: 50,
    focusWidth: 1.7,
    borderWidth: 1.3,
    focusColor: theme.palette.primary.dark,
    borderColor: '#cccccc',
    borderRadius: 5,
    variant: "outlined",

    //others
    sx: {},   //type=border ? mb: -2 : 0
  }
  const groups = [
    {
      id: 1,
      name: "Group 1",
    },
    {
      id: 2,
      name: "Group 2"
    }
  ]
  const schema = {
    name: {
      type: 'text',
      label: 'Name',
      required: false,
      group: 1,
      grid: 12,
      multiline: false,
      dependencies: {email: "ousman", password: "seid", color: 'red'}
    },
    email: {
      type: 'text',
      label: 'Email',
      required: true,
      validation: {
        pattern: {
          value: /^\S+@\S+\.\S+$/,
          message: 'Invalid email address',
        },
      },
      group: 1,
      grid: 12
    },
    password: {
      type: 'text',
      label: 'Password',
      required: true,
      validation: {
        minLength: {
          value: 8,
          message: 'Password must be at least 8 characters long',
        },
      },
      group: 1,
      grid: 12,
      height: 45
    },
    color: {
      type: 'select',
      label: 'Favorite color',
      options: [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
      ],
      valueLabel: 'value',
      nameLabel: 'label',
      group: 1,
      name: "color"
    },
    hobbies: {
      type: 'select',
      label: 'Hobbies',
      options: [
        { value: 'reading', label: 'Reading' },
        { value: 'writing', label: 'Writing' },
        { value: 'drawing', label: 'Drawing' },
        { value: 'playing', label: 'Playing' },
      ],
      nameLabel: 'label',
      valueLabel: 'value',
      group: 2,
      name: "hobbies",
      multiple: true,
    },
    agreement: {
      type: 'checkbox',
      label: 'I agree to the terms and conditions',
      required: false,
      group: 2,
      name: "agreement",
    },
    age: {
      type: 'slider',
      label: 'Age',
      min: 18,
      max: 65,
      step: 1,
      group: 2,
      name: "age"
    },
    gender: {
      type: 'radio',
      label: 'Gender',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
      group: 2,
      name: "gender"
    },
  };

  
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(formData);
  };
  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };
  const handleSelectChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };
  const handleMultiSelectChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };
  const handleCheckboxChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.checked,
    });
  };
  const handleSliderChange = (event, value) => {
    setFormData({
      ...formData,
      [event.target.name]: value,
    });
  };
  const handleRadioChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };
  return (
    <FormGenerator
      schema={schema}
      groups={groups}
      formData={formData}
      setFormData={setFormData}
      type="panel" //panel, border, label, no-group, wizard
      alternativeLabel={true}
      globalProperties={globalProperties}

      //input handler callback
      handleInputChange={handleInputChange}
      handleSelectChange={handleSelectChange}
      handleMultiSelectChange={handleMultiSelectChange}
      handleCheckboxChange={handleCheckboxChange}
      handleSliderChange={handleSliderChange}
      handleRadioChange={handleRadioChange}
      handleSubmit={handleSubmit}
    />
  );
}

export default SchemaForm;
