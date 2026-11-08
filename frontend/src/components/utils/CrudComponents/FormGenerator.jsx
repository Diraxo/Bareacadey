import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  MobileStepper,
  Card,
  CardActions,
  Divider,
} from "@mui/material";
import { Panel } from "primereact/panel";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdClose,
  MdSend,
  MdCached,
  MdAdd,
  MdSave,
} from "react-icons/md";
import { ButtonOverlay, TabOverlay } from "./ComponentsOverlay";
import { setAlert } from "../../../app/slices/commonSlice";
import { useDispatch } from "react-redux";
import Loader from "../Loader";
import { motion } from "framer-motion";
import FormUploadProgress from "./FormUploadProgress";
import { useSettings } from "../../../MuiTheme/hooks/useSettings";
import CustomDatatableForm from "./CustomDatatableForm";
import { GenerateForm } from "./Functions/FormFunctions";

function FormGenerator({
  schema,
  groups,
  type = "no-group",
  maxWidth,
  alternativeLabel = true,
  globalProperties = {},
  formData,
  setFormData,
  isLoading = false,
  enableUploadProgress = false,
  newPage=false,
  fullScreenFormStyle=false,
  viewPanel="dialog",
  componentBeforeSubmit,
  dropMaxWidthCard=false,
  labelAlignment="default", //side
  sideLabelLayout="none", //box, border-bottom, border, shade
  keepSideGridFull=false,
  bulk=false,
  bulkSelections={},
  setBulkSelections,
  closeButtonText,
}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { settings } = useSettings();

  const [firstAnimated, setFirstAnimated] = useState(false);

  const [lAlignment, setLAlignment] = useState((!bulk && !viewPanel=="sidebar") ? labelAlignment : "default")
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  // const md = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(()=>{
    if(labelAlignment == "default" || bulk || viewPanel=="sidebar") return;
    if(sm && lAlignment != "default") {
      setLAlignment((prev)=>"default")
    }
    if(!sm && lAlignment != labelAlignment) {
       setLAlignment(labelAlignment)
    }
  },[sm])

  useEffect(() => {
    setTimeout(() => {
      setFirstAnimated(true);
    }, 5000);
  }, []);



  const removeEmptyGroups = () => {
    let grps = [];
    groups.map((group) => {
      let passed = false;
      Object.keys(schema).map((key) => {
        let conditions = [];
        const dependencies = schema[key]?.dependencies?.dependencies;
        if (dependencies) {
          let pass = true;

          Object.keys(dependencies).map((depKey) => {
            let { value, op, valueType, type, formula } = dependencies[depKey];
            if (valueType == "ref") {
              value =
                type == "formula"
                  ? parseFloat(formData[value]?.value)
                  : formData[value]?.value;
            }
            let cond = false;

            if (type == "value") {
              switch (op) {
                case "==":
                  {
                    if (formData[depKey]?.value == value) {
                      cond = true;
                    }
                  }
                  break;
                case "!=":
                  {
                    if (formData[depKey]?.value != value) {
                      cond = true;
                    }
                  }
                  break;
                case "<=":
                  {
                    if (formData[depKey]?.value <= value) {
                      cond = true;
                    }
                  }
                  break;
                case ">=":
                  {
                    if (formData[depKey]?.value >= value) {
                      cond = true;
                    }
                  }
                  break;
                case "<":
                  {
                    if (formData[depKey]?.value < value) {
                      cond = true;
                    }
                  }
                  break;
                case ">":
                  {
                    if (formData[depKey]?.value > value) {
                      cond = true;
                    }
                  }
                  break;
                case "===":
                  {
                    if (formData[depKey]?.value === value) {
                      cond = true;
                    }
                  }
                  break;
                case "!==":
                  {
                    if (formData[depKey]?.value !== value) {
                      cond = true;
                    }
                  }
                  break;
              }
            } else if (type == "formula") {
              let formulaValue = "";
              formula?.map((form) => {
                const { target, type } = form;
                let val = "";
                if (type == "field") {
                  val = parseFloat(formData[target]?.value);
                } else {
                  val = target;
                }
                formulaValue = formulaValue + val;
              });
              const formulaResult = eval(formulaValue);
              if (eval(formulaResult + op + value)) {
                cond = true;
              }
            }
            conditions.push(cond);
            // if(formData[depKey]?.value!==dependencies[depKey]) {
            //    pass = false;
            // }
          });
          const op = schema[key]?.dependencies?.op ?? "&&";
          if (op == "&&" || op == "and" || op == "AND" || op == "And") {
            if (conditions?.every((element) => element === true)) {
              pass = true;
            } else {
              pass = false;
            }
          } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
            if (conditions?.some((element) => element === true)) {
              pass = true;
            } else {
              pass = false;
            }
          }
          if (!pass) {
            return;
          }
        }

        if (schema[key]?.group === group.id) {
          passed = true;
        }
      });
      if (passed) {
        grps.push(group);
      }
    });
    return grps;
  };
  let groupsFiltered = removeEmptyGroups();
  
  const handleFormSubmit = (event) => {
    event.preventDefault();
  };

  const animateForm = (children, ind, noAnim=false) => {
    return type != "vertical-wizard" && type != "horizontal-wizard" && !noAnim? (
      <motion.div
        initial={{
          // x: Math.floor(Math.random() * (100 - (-100)) ) - 100,
          // y: 200,
          scaleX: 0,
        }}
        animate={{
          y: 0,
          x: 0,
          scaleX: 1,
        }}
        transition={{
          delay: firstAnimated ? 0.2 : ind * 0.08,
          duration: 0.2,
          bounceStiffness: 0.2,
        }}
        key={ind}
      >
        {children}
      </motion.div>
    ) : (
      children
    );
  };

  const generateForm = (groupId, left=true, tab=false) => {
    const others = {
      newPage,
      fullScreenFormStyle,
      bulk,
      bulkSelections,
      setBulkSelections,
      keepSideGridFull,
      lAlignment,
      type,
      sideLabelLayout,
      sm
    }
    return GenerateForm(groupId, left, tab, schema, globalProperties, theme, formData, setFormData, animateForm, others)
  }


  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([])
  
  const validateFormData = () => {
    if (!formData) return false;
    let data = formData;
    Object.keys(schema).map((key) => {
      const fieldSchema = schema[key];
      const fieldType = fieldSchema.type;
      const label = fieldSchema?.label
        ? fieldSchema?.label
        : fieldSchema?.placeholder
        ? fieldSchema?.placeholder
        : key;

      if (schema[key]?.required ?? false) {
        let conditions = [];
        const dependencies = fieldSchema?.dependencies?.dependencies;
        let groupFound = false;
        groupsFiltered?.map((group)=>{
          if(group?.id == fieldSchema?.group) {
            groupFound = true;
          }
        })
        if(!groupFound) {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value,
                error: "",
              },
            };
            return;
        }
        if(bulk && !bulkSelections[key]) {
          data = { ...data, [key]: { ...data[key], error: "" } };
        }
        else if (fieldType === "text") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }

            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex = fieldSchema.regex ?? ".+";
          const errorMessage = fieldSchema.errorMessage;
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "email") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex =
            fieldSchema.regex ??
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$";
          const errorMessage =
            fieldSchema.errorMessage ?? "Valid email is required";
          const regexObject = new RegExp(regex);
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "password") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex = fieldSchema.regex ?? "^.{5,}$";
          const errorMessage =
            fieldSchema.errorMessage ?? "Password must be atleast 5 characters";
          const regexObject = new RegExp(regex);
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "confirm_password") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage =
            fieldSchema.errorMessage ?? "Password didn't match";
          const referName = fieldSchema.referName;
          data = {
            ...data,
            [key]: {
              ...data[key],
              value: data[key]?.value ? data[key]?.value : "",
              error:
                data[referName]?.value === data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
            },
          };
        } else if (fieldType === "number") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          const regex = fieldSchema.regex ?? "^\\d+(\\.\\d+)?$";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }

        } else if (fieldType === "currency") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          const regex = fieldSchema.regex ?? "^\\d+(\\.\\d+)?$";
          const regexObject = new RegExp(regex);
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "phone") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage =
            fieldSchema.errorMessage ?? "Valid phone number is required";
          const regex = fieldSchema.regex ?? "^[0-9]{6,11}$";
          const regexObject = new RegExp(regex);
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "radio") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: allowedValues?.includes(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        }
        // else if(fieldType==="files"){

        // }
        // else if(fieldType==="file") {

        // }
        else {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);
            });

            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }
          const errorMessage = fieldSchema.errorMessage;

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: allowedValues?.includes(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          
        }
      } else {
        data = { ...data, [key]: { ...data[key], error: "" } };
      }
    });
    setFormData((prev) => data);
    return Object.values(data).every((x) => x.error == "");
  };

  const validateFormDataGroup = () => {
    if (!formData) return false;
    let group = groupsFiltered[activeStep];
    
    let data = {};
    Object.keys(formData).forEach((key) => {
      data[key] = {...formData[key]};
      data[key].error = "";
    });
    Object.keys(schema).map((key) => {
      const fieldSchema = schema[key];
      if (fieldSchema?.group != group?.id) return;
      const fieldType = fieldSchema.type;
      const label = fieldSchema?.label
        ? fieldSchema?.label
        : fieldSchema?.placeholder
        ? fieldSchema?.placeholder
        : key;

      if (schema[key]?.required ?? false) {
        let conditions = [];
        const dependencies = fieldSchema?.dependencies?.dependencies;
        
        if (fieldType === "text") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }

            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex = fieldSchema.regex ?? ".+";
          const errorMessage = fieldSchema.errorMessage;
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          
        } else if (fieldType === "email") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex =
            fieldSchema.regex ??
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$";
          const errorMessage =
            fieldSchema.errorMessage ?? "Valid email is required";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
         
        } else if (fieldType === "password") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const regex = fieldSchema.regex ?? "^.{5,}$";
          const errorMessage =
            fieldSchema.errorMessage ?? "Password must be atleast 5 characters";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "confirm_password") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage =
            fieldSchema.errorMessage ?? "Password didn't match";
          const referName = fieldSchema.referName;
          data = {
            ...data,
            [key]: {
              ...data[key],
              value: data[key]?.value ? data[key]?.value : "",
              error:
                data[referName]?.value === data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
            },
          };
        } else if (fieldType === "number") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          const regex = fieldSchema.regex ?? "^\\d+(\\.\\d+)?$";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        } else if (fieldType === "currency") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          const regex = fieldSchema.regex ?? "^\\d+(\\.\\d+)?$";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }

        } else if (fieldType === "phone") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage =
            fieldSchema.errorMessage ?? "Valid phone number is required";
          const regex = fieldSchema.regex ?? "^[0-9]{6,11}$";
          const regexObject = new RegExp(regex);

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value) && regexObject.test(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: regexObject.test(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }

        } else if (fieldType === "radio") {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }

          const errorMessage = fieldSchema.errorMessage;
          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: (allowedValues?.includes(data[key]?.value))
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
        }
        // else if(fieldType==="files"){

        // }
        // else if(fieldType==="file") {

        // }
        else {
          if (dependencies) {
            let pass = true;
            Object.keys(dependencies).map((depKey) => {
              let { value, op, valueType, type, formula } =
                dependencies[depKey];
              if (valueType == "ref") {
                value =
                  type == "formula"
                    ? parseFloat(formData[value]?.value)
                    : formData[value]?.value;
              }
              let cond = false;

              if (type == "value") {
                switch (op) {
                  case "==":
                    {
                      if (formData[depKey]?.value == value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!=":
                    {
                      if (formData[depKey]?.value != value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<=":
                    {
                      if (formData[depKey]?.value <= value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">=":
                    {
                      if (formData[depKey]?.value >= value) {
                        cond = true;
                      }
                    }
                    break;
                  case "<":
                    {
                      if (formData[depKey]?.value < value) {
                        cond = true;
                      }
                    }
                    break;
                  case ">":
                    {
                      if (formData[depKey]?.value > value) {
                        cond = true;
                      }
                    }
                    break;
                  case "===":
                    {
                      if (formData[depKey]?.value === value) {
                        cond = true;
                      }
                    }
                    break;
                  case "!==":
                    {
                      if (formData[depKey]?.value !== value) {
                        cond = true;
                      }
                    }
                    break;
                }
              } else if (type == "formula") {
                let formulaValue = "";
                formula?.map((form) => {
                  const { target, type, index, array, date } = form;
                  let val = "";
                  if (type == "field") {
                    if(array) {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value?.[index]+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value?.[index]);
                      }
                    }
                    else {
                      if(date) {
                        val = 'new Date("'+formData[target]?.value+'")';
                      }
                      else {
                        val = parseFloat(formData[target]?.value);
                      }
                    }
                  } else {
                    val = target;
                  }
                  formulaValue = formulaValue + val;
                });
                const formulaResult = eval(formulaValue);
                try {
                  if (eval(formulaResult + op + value)) {
                    cond = true;
                  }
                } catch(e) {}
              }
              conditions.push(cond);

              // if(data[depKey]?.value!==dependencies[depKey]) {
              //    pass = false;
              // }
            });
            const op = schema[key]?.dependencies?.op ?? "&&";
            if (op == "&&" || op == "and" || op == "AND" || op == "And") {
              if (conditions?.every((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
              if (conditions?.some((element) => element === true)) {
                pass = true;
              } else {
                pass = false;
              }
            }
            if (!pass) {
              data = {
                ...data,
                [key]: {
                  ...data[key],
                  value: data[key]?.value ? data[key]?.value : "",
                  error: "",
                },
              };
              return;
            }
          }
          const errorMessage = fieldSchema.errorMessage;

          if(fieldSchema?.allowedValues) {
            const allowedValues = fieldSchema?.allowedValues;
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: allowedValues?.includes(data[key]?.value)
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          else {
            data = {
              ...data,
              [key]: {
                ...data[key],
                value: data[key]?.value ? data[key]?.value : "",
                error: data[key]?.value
                  ? ""
                  : errorMessage ?? `${label} is required`,
              },
            };
          }
          
        }
      } else {
        data = { ...data, [key]: { ...data[key], error: "" } };
      }
    });
    setFormData((prev) => data);
    return Object.values(data).every((x) => x.error == "");
  };

  const handleNext = () => {
    if (bulk || validateFormDataGroup()) {
      let currentStep = 0;
      setActiveStep((prevActiveStep) => {
        currentStep = prevActiveStep;
        return prevActiveStep + 1;
      });
      setCompletedSteps((prev)=>[...new Set([...prev, currentStep, currentStep+1])])
    }
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div
      style={{
        display: type === "border" ? "block" : "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ width: "100%", maxWidth: maxWidth ?? "" }} className={maxWidth ? `${dropMaxWidthCard ? "" : "shadow-2"} p-4 rounded-md mt-2` : ''}>
        <form onSubmit={handleFormSubmit}>
          <Grid
            container
            spacing={type === "no-group" ? 2 : 5}
            sx={{ px: 2, py: 5 }}
          >
            {type === "panel" &&
              groupsFiltered.map((group, index) => {
                if(group?.tab) return;
                return (
                  <Grid item xs={12} key={index} className="">
                    <Panel
                      header={
                        <p style={{ /*color: theme.palette.primary.dark,*/ fontWeight: 700, fontSize: 22, marginBottom: 10, marginTop: 10 }}>
                          {group.name}
                        </p>
                      }
                      toggleable
                      className={`border shadow-2 ${(newPage || fullScreenFormStyle) ? 'p-3' : (lAlignment=="side") ? 'p-2' : 'p-2 pt-3' }`}
                      style={{
                        borderColor: theme?.palette?.mode == "dark" ? "#1A1D21" : ""
                      }}
                    >
                      <Grid container spacing={2} columnSpacing={10} sx={{ px: 2, py: 5 }}>
                         {generateForm(group.id, index)}
                      </Grid>
                    </Panel>
                  </Grid>
                );
              })}
            {type === "label" &&
              groupsFiltered.map((group, index) => {
                return (
                  <Grid item xs={12} key={index} className="border-gray-200">
                    <label className="text-xl">{group.name}</label>
                    <Grid container spacing={3} sx={{ px: 2, py: 5 }}>
                      {generateForm(group.id, index)}
                    </Grid>
                  </Grid>
                );
              })}
            {type === "no-group" && generateForm()}
          </Grid>
          {type === "vertical-wizard" && (
            <Box sx={{ width: "100%", mb: 6 }}>
              <Stepper
                activeStep={activeStep}
                alternativeLabel={false}
                orientation="vertical"
              >
                {groupsFiltered.map((group, index) => (
                  <Step key={group.id}>
                    <StepLabel
                    // optional={
                    //   index === 2 ? (
                    //     <Typography variant="caption">Last step</Typography>
                    //   ) : null
                    // }
                    className="hover:cursor-pointer"
                    onClick={()=>{
                       setActiveStep(index);
                      if(completedSteps?.includes(index)) {
                        //setActiveStep(index);
                      }
                    }}
                    >
                      <p className="text-lg hover:cursor-pointer">{group.name}</p>
                    </StepLabel>
                    <StepContent>
                      <Grid container spacing={3} sx={{ px: 2, py: 5 }}>
                        {generateForm(group.id, index)}
                        <Grid item xs={12}>
                          <Box sx={{ mb: 2 }}>
                            <div className="flex justify-between">
                              <Button
                                disabled={index === 0}
                                onClick={handleBack}
                                sx={{ mt: 1, mr: 1, borderRadius: 40 }}
                                variant="text"
                                color="secondary"
                              >
                                Back
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={handleNext}
                                sx={{ mt: 1, mr: 1, borderRadius: 50 }}
                                disabled={index === groupsFiltered.length - 1}
                              >
                                {"Continue"}
                              </Button>
                            </div>
                          </Box>
                        </Grid>
                      </Grid>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
          
          {type === "horizontal-wizard" && (
            <Box sx={{ width: "100%", mb: 4 }}>
              <Stepper
                activeStep={activeStep}
                alternativeLabel={alternativeLabel}
                orientation="horizontal"
              >
                {groupsFiltered.map((group, index) => (
                  <Step key={group.id}>
                    <StepLabel
                    // optional={
                    //   index === 2 ? (
                    //     <Typography variant="caption">Last step</Typography>
                    //   ) : null
                    // }
                    className="hover:cursor-pointer"
                    onClick={()=>{
                      if(completedSteps?.includes(index)) {
                        setActiveStep(index);
                      }
                    }}
                    >
                      {group.name}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
              <div className="mt-6 border rounded-lg p-3">
                <Grid container spacing={3} sx={{ px: 2, py: 5 }}>
                  {groupsFiltered.map((group, index) => {
                    if (index === activeStep) {
                      return generateForm(group.id, index);
                    }
                  })}
                  <Grid item xs={12} sx={{ mt: 5 }}>
                    <MobileStepper
                      variant="dots"
                      steps={groupsFiltered.length}
                      position="static"
                      activeStep={activeStep}
                      sx={{ flexGrow: 1 }}
                      nextButton={
                        <Button
                          size="small"
                          onClick={handleNext}
                          disabled={activeStep === groupsFiltered.length - 1}
                        >
                          Next
                          {theme.direction === "rtl" ? (
                            <MdKeyboardArrowLeft />
                          ) : (
                            <MdKeyboardArrowRight />
                          )}
                        </Button>
                      }
                      backButton={
                        <Button
                          size="small"
                          onClick={handleBack}
                          disabled={activeStep === 0}
                        >
                          {theme.direction === "rtl" ? (
                            <MdKeyboardArrowRight />
                          ) : (
                            <MdKeyboardArrowLeft />
                          )}
                          Back
                        </Button>
                      }
                    />
                  </Grid>
                </Grid>
              </div>
            </Box>
          )}
          {type === "border" &&
            groupsFiltered.map((group, index) => {
              const left = index % 2 === 0 ? true : false;
              return (
                <React.Fragment key={index}>
                  {left && (
                    <div
                      className="left-content-container"
                      key={"border" + index}
                    >
                      <div
                        className="form-label dark:text-gray-200 w-full"
                        style={{ color: theme.palette.primary.dark }}
                      >
                        <div
                          style={{
                            backgroundColor: theme.palette.primary.main,
                          }}
                        >
                          {index + 1}
                        </div>
                        {group.name}
                      </div>
                      <div className="bordered-form-container">
                        <div className="parent">
                          {generateForm(group.id, left)}
                        </div>
                        <div
                          className="dot1"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: theme.palette.primary.dark,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {!left && (
                    <div
                      className="right-content-container"
                      key={"border" + index}
                    >
                      <div
                        className="form-label dark:text-gray-200 w-full"
                        style={{ color: theme.palette.primary.dark }}
                      >
                        {group.name}
                        <div
                          style={{
                            backgroundColor: theme.palette.primary.main,
                          }}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div className="bordered-form-container-right">
                        <div className="parent">
                          {generateForm(group.id, left)}
                        </div>
                        <div className="dot-container-right">
                          <div
                            className="dot1"
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: theme.palette.primary.dark,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          
          {groupsFiltered.filter(group => group.tab)?.length > 0 &&  
          <div className="border shadow-1 rounded-lg m-1 mb-3">
            <TabOverlay 
              tabs={
                groupsFiltered.filter(group => group.tab).map((group, index) => (
                    {
                      name: group?.name,
                      element: (
                        <div className="p-2">
                          <Grid container rowSpacing={3} columnSpacing={15} sx={{ px: 2, py: 5 }}>
                            {generateForm(group.id, index, true)}
                          </Grid>
                        </div>
                      )
                      
                    }
                  ))
              }
            />
          </div>}

          {componentBeforeSubmit && 
            <div className="p-1">{componentBeforeSubmit}</div>
          }

          {isLoading && enableUploadProgress && <FormUploadProgress />}

          {Object.keys(schema).map((key, ind) => {
            const fieldSchema = schema[key];
            const fieldType = fieldSchema.type;
            if (fieldType === "submit") {
              return fieldSchema.card ?? true
                ? animateForm(
                    <Card className="border shadow-2 mx-1" key={key} style={{borderColor: theme?.palette?.mode == "dark" ? "#1A1D21" : ""}}>
                      <CardActions className="flex justify-between">
                        {fieldSchema.handleClose && (
                          <ButtonOverlay
                            variant="text"
                            className=""
                            text={closeButtonText ? closeButtonText : newPage ? "Back" : "Close"}
                            sx={{
                              color:
                                settings?.mode == "light"
                                  ? "rgba(0,0,0,.4)"
                                  : "rgba(255,255,255,.4)",
                            }}
                            startIcon={<MdClose />}
                            onClick={fieldSchema.handleClose}
                          />
                        )}
                        {fieldSchema?.right && <div>{fieldSchema?.leftComponent}</div>}
                        <ButtonOverlay
                          text={
                            fieldSchema.submitText
                              ? fieldSchema.submitText
                              : fieldSchema.submitType === "update"
                              ? (!fieldSchema.loading
                                ? "Update"
                                : "Updating...")
                              : fieldSchema.submitType === "save"
                              ? (!fieldSchema.loading
                                ? "Save"
                                : "Saving...")
                              : fieldSchema.submitType === "create"
                              ? (!fieldSchema.loading
                                ? "Create"
                                : "Creating...")
                              : (!fieldSchema.loading
                              ? "Submit"
                              : "Submitting...")
                          }
                          // className="bg-green-500"
                          
                          variant={fieldSchema.variant ?? "contained"}
                          disabled={
                            (type === "horizontal-wizard" ||
                              type === "vertical-wizard") &&
                            activeStep !== groupsFiltered.length - 1
                              ? false //true
                              : fieldSchema.disabled ?? false
                          }
                          onClick={() => {
                            if (validateFormData()) {
                              fieldSchema.onClick();
                            } else {
                              dispatch(
                                setAlert({
                                  openAlert: true,
                                  severity: "error",
                                  message:
                                    "Fill all required information correctly",
                                  autoHideDuration: 5000,
                                  vertical: "top",
                                  horizontal: "right",
                                })
                              );
                            }
                          }}
                          startIcon={
                            fieldSchema.startIcon ? (
                              fieldSchema.startIcon
                            ) : fieldSchema.submitType === "update" ? (
                              <MdCached style={fieldSchema.iconStyle} />
                            ) :
                            fieldSchema.submitType === "save" ? (
                              <MdSave style={fieldSchema.iconStyle} />
                            ) :
                            fieldSchema.submitType === "create" ? (
                              <MdAdd style={fieldSchema.iconStyle} />
                            )
                             : (
                              <MdSend style={fieldSchema.iconStyle} />
                            )
                          }
                          endIcon={fieldSchema.endIcon}
                          size={fieldSchema.size ?? "large"}
                          loading={fieldSchema.loading ?? false}
                          sx={
                            fieldSchema.sx ? fieldSchema?.sx : (fieldSchema.submitType == "save" || fieldSchema.submitType == "create") ? {} : {
                              borderRadius: 1,
                              minWidth: 150,
                              // backgroundColor: "#24AE7C",
                              [theme.breakpoints.down("sm")]: {
                                minWidth: 0,
                              },
                            }
                          }
                          loadingPosition={
                            fieldSchema.loadingPosition ?? "start"
                          }
                          fullScreenOnSmall={
                            fieldSchema.fullScreenOnSmall ?? false
                          }
                        />
                      </CardActions>
                    </Card>,
                    ind
                  )
                : animateForm(
                    <div className={"flex justify-between"} key={key}>
                      {fieldSchema.handleClose && (
                        <ButtonOverlay
                          variant="text"
                          text={closeButtonText ? closeButtonText : newPage ? "Back" : "Close"}
                          sx={{
                            color:
                              settings?.mode == "light"
                                ? "rgba(0,0,0,.4)"
                                : "rgba(255,255,255,.4)",
                          }}
                          startIcon={<MdClose />}
                          onClick={fieldSchema.handleClose}
                        />
                      )}
                      {fieldSchema?.right && <div>{fieldSchema?.leftComponent}</div>}
                      <ButtonOverlay
                        text={
                          fieldSchema.submitText
                              ? fieldSchema.submitText
                              : fieldSchema.submitType === "update"
                              ? (!fieldSchema.loading
                                ? "Update"
                                : "Updating...")
                              : fieldSchema.submitType === "save"
                              ? (!fieldSchema.loading
                                ? "Save"
                                : "Saving...")
                              : fieldSchema.submitType === "create"
                              ? (!fieldSchema.loading
                                ? "Create"
                                : "Creating...")
                              : (!fieldSchema.loading
                              ? "Submit"
                              : "Submitting...")
                        }
                        variant={fieldSchema.variant ?? "contained"}
                        disabled={
                          (type === "horizontal-wizard" ||
                            type === "vertical-wizard") &&
                          activeStep !== groupsFiltered.length - 1
                            ? true
                            : fieldSchema.disabled ?? false
                        }
                        onClick={() => {
                          if (validateFormData()) {
                            fieldSchema.onClick();
                          } else {
                            dispatch(
                              setAlert({
                                openAlert: true,
                                severity: "error",
                                message:
                                  "Fill all required information correctly",
                                autoHideDuration: 5000,
                                vertical: "top",
                                horizontal: "right",
                              })
                            );
                          }
                        }}
                        startIcon={
                          fieldSchema.startIcon ? (
                            fieldSchema.startIcon
                          ) : fieldSchema.submitType === "update" ? (
                            <MdCached style={fieldSchema.iconStyle} />
                          ) :
                          fieldSchema.submitType === "save" ? (
                            <MdSave style={fieldSchema.iconStyle} />
                          ) :
                          fieldSchema.submitType === "create" ? (
                            <MdAdd style={fieldSchema.iconStyle} />
                          )
                           : (
                            <MdSend style={fieldSchema.iconStyle} />
                          )
                        }
                        endIcon={fieldSchema.endIcon}
                        size={fieldSchema.size ?? "large"}
                        loading={fieldSchema.loading ?? false}
                        sx={
                            fieldSchema.sx ? fieldSchema?.sx : (fieldSchema.submitType == "save" || fieldSchema.submitType == "create") ? {} : {
                              borderRadius: 1,
                              minWidth: 150,
                              [theme.breakpoints.down("sm")]: {
                                minWidth: 0,
                              },
                            }
                          }
                        loadingPosition={fieldSchema.loadingPosition ?? "start"}
                        fullScreenOnSmall={
                          fieldSchema.fullScreenOnSmall ?? false
                        }
                      />
                    </div>,
                    ind
                  );
            }
          })}
        </form>
      </div>
    </div>
  );
}

FormGenerator.propTypes = {
  schema: PropTypes.object.isRequired,
};

export default FormGenerator;
