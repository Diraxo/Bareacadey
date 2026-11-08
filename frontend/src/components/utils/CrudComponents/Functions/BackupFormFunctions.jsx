import { CheckboxOverlay } from "../InputsOverlay";

  const bulkLabelComponent = (label, name, type, bulkSelections, setBulkSelections) => {
    return (
      <div className="flex items-center justify-start">
        <div>
        <CheckboxOverlay
            onChange={(e)=>{
              setBulkSelections({
                ...bulkSelections,
                [name]: e.target.checked
              })
            }}
            value={bulkSelections?.[name]}
        />
        </div>
        <p className="-ml-3 truncate">{(type == "border" || lAlignment=="side")  ? "" : label}</p>
      </div>
    )
  }

  export const GenerateForm = (groupId, left, tab=false, schema, globalProperties, theme, formData, setFormData, others) => {
    const {
        newPage,
        fullScreenFormStyle,
        bulk,
        bulkSelections,
        setBulkSelections,
        keepSideGridFull,
        lAlignment,
        type
    } = others;
    const items = [];
    // let lastGrid = 12;
    Object.keys(schema).map((key, ind) => {
      const fieldSchema = schema[key];
      const fieldType = fieldSchema.type;
      const properties = {
        height: fieldSchema.height
          ? fieldSchema.height
          : globalProperties.height
          ? globalProperties.height
          : 50,
        mui:
          fieldSchema.mui != null
            ? fieldSchema.mui
            : globalProperties.mui
            ? globalProperties.mui
            : false,
        borderRadius: fieldSchema.borderRadius
          ? fieldSchema.borderRadius
          : globalProperties.borderRadius
          ? globalProperties.borderRadius
          : 5,
        focusWidth: fieldSchema.focusWidth
          ? fieldSchema.focusWidth
          : globalProperties.focusWidth
          ? globalProperties.focusWidth
          : 1.7,
        borderWidth: fieldSchema.borderWidth
          ? fieldSchema.borderWidth
          : globalProperties.borderWidth
          ? globalProperties.borderWidth
          : 1.5,
        focusColor: fieldSchema.focusColor
          ? fieldSchema.focusColor
          : globalProperties.focusColor
          ? globalProperties.focusColor
          : theme.palette.primary.dark,
        borderColor: theme?.palette?.mode=="dark" ? "" 
          : fieldSchema.borderColor
          ? fieldSchema.borderColor
          : globalProperties.borderColor
          ? globalProperties.borderColor
          : "#cccccc",
        variant: fieldSchema.variant
          ? fieldSchema.variant
          : globalProperties.variant
          ? globalProperties.variant
          : "outlined",
        grid: fieldSchema.grid
          ? fieldSchema.grid
          : ((newPage || fullScreenFormStyle) && globalProperties?.grid == 12) ? 6 
          : globalProperties.grid ? globalProperties.grid
          : 12,
        sx: {...(newPage || fullScreenFormStyle) ? {maxWidth: 600} : {}, ...(fieldSchema.sx
          ? fieldSchema.sx
          : globalProperties.sx
          ? globalProperties.sx
          : {})},
        labelStyle: fieldSchema?.labelStyle
          ? fieldSchema?.labelStyle
          : globalProperties?.labelStyle
          ? globalProperties?.labelStyle
          : {fontWeight: 700, fontSize: 15, opacity: .8},
        disabled: bulk ? (!bulkSelections[key]??true) : (fieldSchema.disabled??false)
      };
      let grid = properties.grid;
      if (grid > 12) grid = 12;
      if((keepSideGridFull && lAlignment == "side") || (!(newPage || fullScreenFormStyle) && lAlignment == "side" && grid != 12)) {
        grid = 12;
      }
  

      const multiline = fieldSchema?.multiline ? true : false;
      const required = fieldSchema?.required ? true : false;
      const rows = fieldSchema.rows ?? 4;
      const inputType = fieldSchema.inputType ?? "text";

      let inputComponent = null;
      switch (fieldType) {
        case "text":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <TextFieldOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                regex={fieldSchema.regex ?? ".+"}
                errorMessage={fieldSchema.errorMessage}
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "file":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <FileOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                errorMessage={fieldSchema.errorMessage}
                accept={fieldSchema?.accept ?? ""}
                dnd={fieldSchema?.dnd ?? false}
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "files":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <FilesOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                fileLabel={fieldSchema?.fileLabel}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                rows={rows}
                required={required}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                errorMessage={fieldSchema.errorMessage}
                accept={fieldSchema?.accept ?? ""}
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "email":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <EmailOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                fullWidth={fieldSchema.fullWidth ?? true}
                onChange={fieldSchema.onChange}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                regex={
                  fieldSchema.regex ??
                  "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$"
                }
                errorMessage={
                  fieldSchema.errorMessage ?? "Valid email is required"
                }
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "phone":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <PhoneNumberOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                onChange={fieldSchema.onChange}
                setFormData={setFormData}
                fullWidth={fieldSchema.fullWidth ?? true}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                regex={fieldSchema.regex ?? "^[0-9]{6,11}$"}
                errorMessage={
                  fieldSchema.errorMessage ?? "Valid phone number is required"
                }
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "password":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <PasswordOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                regex={fieldSchema.regex ?? "^.{5,}$"}
                errorMessage={
                  fieldSchema.errorMessage ?? "Password must be 5 characters"
                }
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "confirm_password":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <ConfirmPasswordOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                rows={rows}
                required={required}
                multiline={multiline}
                type={inputType}
                disabled={properties?.disabled}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                referName={fieldSchema.referName ?? "password"}
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "color":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <ColorPickerOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                type={inputType}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                height={multiline ? "" : properties.height}
                mui={properties.mui}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                disabled={properties?.disabled}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                labelStyle={properties?.labelStyle}
                bulk={bulk}
              />
            );
          }
          break;
        case "select":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <SelectOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                type={inputType}
                options={fieldSchema.options}
                filter={fieldSchema?.filter??false}
                //set properties
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                mui={properties.mui}
                height={multiline ? "" : properties.height}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                nameLabel={fieldSchema.nameLabel ?? "name"}
                valueLabel={fieldSchema.valueLabel ?? "value"}
                imgLabel={fieldSchema.imgLabel ?? "img"}
                colorLabel={fieldSchema.colorLabel ?? "color"}
                multiple={fieldSchema.multiple ?? false}
                checkbox={fieldSchema.checkbox ?? false}
                flex={fieldSchema.flex ?? false}
                disabled={properties?.disabled}
                avatar={fieldSchema.avatar ?? false}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                renderValue={fieldSchema?.renderValue}
                renderRegular={fieldSchema?.renderRegular ?? false}
                optionRenderFunction={fieldSchema?.optionRenderFunction}
                labelStyle={properties?.labelStyle}
                maxSelectCount={fieldSchema?.maxSelectCount}
                bulk={bulk}
              />
            );
          }
          break;
        case "checkbox":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <CheckboxOverlay
                label={bulk ? bulkLabelComponent("", key, type) : ""}
                labelText={lAlignment=="side" ? "" : fieldSchema.label}
                // label={lAlignment=="side" ? "" : fieldSchema.label}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                sx={properties.sx}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "slider":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <SliderOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : lAlignment=="side" ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                // label={lAlignment=="side" ? "" : fieldSchema.label}
                placeholder={fieldSchema.placeholder ?? fieldSchema.label ?? ""}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                type={inputType}
                step={fieldSchema.step ?? 1}
                min={fieldSchema.min ?? 0}
                max={fieldSchema.max ?? 100}
                mui={properties.mui}
                //set properties
                sx={properties.sx}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "radio":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <RadioOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : lAlignment=="side" ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                // label={lAlignment=="side" ? "" : fieldSchema.label}
                name={key}
                formData={formData}
                onChange={fieldSchema.onChange}
                setFormData={setFormData}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                options={fieldSchema.options ?? []}
                row={fieldSchema.row ?? false}
                nameLabel={fieldSchema?.nameLabel}
                valueLabel={fieldSchema?.valueLabel}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "date":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <DatePickerOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={fieldSchema.label}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                options={fieldSchema.options ?? []}
                type={fieldSchema.inputType ?? "date"}
                layout={fieldSchema.layout ?? "default"}
                views={fieldSchema.views ?? ["year", "month", "day"]}
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                mui={properties.mui}
                height={properties.height}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "number":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <NumberOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={
                  fieldSchema.placeholder
                    ? fieldSchema.placeholder
                    : fieldSchema.label
                }
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                mui={properties.mui}
                height={properties.height}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                fractionDigits={fieldSchema.fractionDigits ?? 4}
                regex={fieldSchema.regex ?? "^\\d+(\\.\\d+)?$"}
                errorMessage={fieldSchema.errorMessage}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "currency":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <CurrencyOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : (type == "border" || lAlignment=="side")  ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                placeholder={
                  fieldSchema.placeholder
                    ? fieldSchema.placeholder
                    : fieldSchema.label
                }
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                sx={
                  type === "border"
                    ? { ...properties.sx, mb: -2 }
                    : properties.sx
                }
                mui={properties.mui}
                height={properties.height}
                borderwidth={properties.borderWidth}
                focuswidth={properties.focusWidth}
                focuscolor={properties.focusColor}
                borderColor={properties.borderColor}
                borderRadius={properties.borderRadius}
                variant={properties.variant}
                panelType={type}
                startIcon={fieldSchema.startIcon}
                endIcon={fieldSchema.endIcon}
                regex={fieldSchema.regex ?? "^\\d+(\\.\\d+)?$"}
                errorMessage={fieldSchema.errorMessage}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "rich_text":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <RichTextOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : lAlignment=="side" ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                // label={lAlignment=="side" ? "" : fieldSchema.label}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                height={fieldSchema.height ?? 320}
                image={fieldSchema.image ?? false}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "signature":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = (
              <SignatureOverlay
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : lAlignment=="side" ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                // label={lAlignment=="side" ? "" : fieldSchema.label}
                name={key}
                formData={formData}
                setFormData={setFormData}
                onChange={fieldSchema.onChange}
                fullWidth={fieldSchema.fullWidth ?? true}
                required={required}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        case "divider":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = fieldSchema?.noLabel ? (
                <Divider 
                  sx={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: theme.palette.primary.dark,
                    ...fieldSchema?.textStyle??{},
                    borderRadius: properties?.borderRadius, 
                    borderColor: properties?.borderColor, borderBottomWidth: properties?.borderWidth, '&::before': {borderTopWidth: properties.borderWidth, borderRadius: properties?.borderRadius, borderColor: properties?.borderColor}, '&::after': {borderTopWidth: properties.borderWidth, borderRadius: properties?.borderRadius, borderColor: properties?.borderColor}
                  }}
                />
            ) : (
                <Divider textAlign={fieldSchema?.alignment ? (fieldSchema?.alignment??"center") : "center"} 
                  sx={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: theme.palette.primary.dark,
                    ...fieldSchema?.textStyle??{},
                    borderRadius: properties?.borderRadius, 
                    borderColor: properties?.borderColor, borderBottomWidth: properties?.borderWidth, '&::before': {borderTopWidth: properties.borderWidth, borderRadius: properties?.borderRadius, borderColor: properties?.borderColor}, '&::after': {borderTopWidth: properties.borderWidth, borderRadius: properties?.borderRadius, borderColor: properties?.borderColor},
                  }}
                >{fieldSchema?.label}</Divider>
            );
          }
          break;
        case "custom":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              let conditions = [];
              const dependencies = fieldSchema?.dependencies?.dependencies;
              Object.keys(dependencies).map((dependency) => {
                let { value, op, valueType, type, formula } =
                  dependencies[dependency];
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
                        if (formData[dependency]?.value == value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!=":
                      {
                        if (formData[dependency]?.value != value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<=":
                      {
                        if (formData[dependency]?.value <= value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">=":
                      {
                        if (formData[dependency]?.value >= value) {
                          cond = true;
                        }
                      }
                      break;
                    case "<":
                      {
                        if (formData[dependency]?.value < value) {
                          cond = true;
                        }
                      }
                      break;
                    case ">":
                      {
                        if (formData[dependency]?.value > value) {
                          cond = true;
                        }
                      }
                      break;
                    case "===":
                      {
                        if (formData[dependency]?.value === value) {
                          cond = true;
                        }
                      }
                      break;
                    case "!==":
                      {
                        if (formData[dependency]?.value !== value) {
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
              const op = fieldSchema?.dependencies?.op ?? "&&";
              if (op == "&&" || op == "and" || op == "AND" || op == "And") {
                if (!conditions?.every((element) => element === true)) {
                  br = true;
                }
              } else if (op == "||" || op == "or" || op == "OR" || op == "Or") {
                if (!conditions?.some((element) => element === true)) {
                  br = true;
                }
              }
            }
            if (br) break;

            inputComponent = fieldSchema?.element && <>{fieldSchema.element}</>;
          }
          break;
        case "collection":
          if (fieldSchema.group === groupId || type === "no-group") {
            let br = false;
            if (fieldSchema?.dependencies) {
              const dependencies = fieldSchema.dependencies;
              Object.keys(dependencies).map((dependency) => {
                if (formData[dependency]?.value !== dependencies[dependency]) {
                  br = true;
                }
              });
            }
            if (br) break;

            inputComponent = (
              <CustomDatatableForm 
                columns={fieldSchema?.columns}
                formData={formData}
                setFormData={setFormData}
                label={bulk ? bulkLabelComponent(fieldSchema?.label, key, type) : lAlignment=="side" ? "" : fieldSchema.label}
                labelText={fieldSchema?.label??""}
                // label={fieldSchema?.label}
                name={key}
                data={fieldSchema?.key}
                labelStyle={properties?.labelStyle}
                disabled={properties?.disabled}
                bulk={bulk}
              />
            );
          }
          break;
        default:
          return null;
      }
      if (inputComponent && type === "panel") {
        items.push(
          <Grid item xs={12} md={grid} key={key}>
            {(lAlignment!="side") && animateForm(inputComponent, ind, tab)}
            {lAlignment=="side" && 
              <div key={ind} className={`flex gap-2 ${!sm ? 'ml-2' : ''} ${ !(newPage || fullScreenFormStyle) ? (sideLabelLayout=="box" ? "border shadow-2 p-3 pb-0 rounded-md" : sideLabelLayout=="border" ? "border-2 p-3 pb-0 rounded-md" : sideLabelLayout=="border-bottom" ? "border-b" : sideLabelLayout=="shade" ? "p-3 pb-0 rounded-md" : "") : ""} my-2`} style={{backgroundColor: !(newPage || fullScreenFormStyle) && sideLabelLayout=="shade" ? theme?.palette?.customColors?.shade : ""}}>
                <label style={{width: sm ? 100 : 150, paddingTop: 5, fontWeight: 700, opacity: .7}}>{fieldSchema?.label}</label>
                <div className={`flex-1 ${sm ? '' : 'mr-4'}`}>
                  {animateForm(inputComponent, ind, tab)}
                </div>
              </div>
            }
          </Grid>
        );
      } else if (inputComponent && type === "label") {
        items.push(
          <Grid item xs={12} md={grid} key={key}>
            {lAlignment!="side" && animateForm(inputComponent, ind, tab)}
            {lAlignment=="side" && 
              <div key={ind} className={`flex gap-2 ${!sm ? 'ml-2' : ''} ${ !(newPage || fullScreenFormStyle) ? (sideLabelLayout=="box" ? "border shadow-2 p-3 pb-0 rounded-md" : sideLabelLayout=="border" ? "border-2 p-3 pb-0 rounded-md" : sideLabelLayout=="border-bottom" ? "border-b" : sideLabelLayout=="shade" ? "p-3 pb-0 rounded-md" : "") : ""} my-2`} style={{backgroundColor: !(newPage || fullScreenFormStyle) && sideLabelLayout=="shade" ? theme?.palette?.customColors?.shade : ""}}>
                <label style={{width: sm ? 100 : 150, paddingTop: 5, fontWeight: 700, opacity: .7}}>{fieldSchema?.label}</label>
                <div className={`flex-1 ${sm ? '' : 'mr-4'}`}>
                  {animateForm(inputComponent, ind, tab)}
                </div>
              </div>
            }
            {/* {animateForm(inputComponent, ind)} */}
          </Grid>
        );
      } else if (inputComponent && type === "vertical-wizard") {
        items.push(
          <Grid item xs={12} md={grid} key={key}>
            {animateForm(inputComponent, ind)}
          </Grid>
        );
      } else if (inputComponent && type === "horizontal-wizard") {
        items.push(
          <Grid item xs={12} md={grid} key={key}>
            {animateForm(inputComponent, ind)}
          </Grid>
        );
      } else if (inputComponent && type === "no-group") {
        items.push(
          <Grid item xs={12} md={grid} key={key}>
            {animateForm(inputComponent, ind)}
          </Grid>
        );
      } else if (inputComponent && type === "border") {
        if (
          fieldType === "radio" ||
          fieldType === "checkbox" ||
          fieldType === "slider"
        ) {
          items.push(
            <div
              key={key}
              className="mb-2 mt-4"
              style={{ width: "calc(100% - 10px)", paddingLeft: 20 }}
            >
              {animateForm(inputComponent, ind)}
            </div>
          );
        } else {
          if (left) {
            items.push(
              <div className="cat-container" key={"btd" + key}>
                <div className="child"></div>
                <div className="ch-child-item">
                  <div className="box-container">
                    {animateForm(inputComponent, ind)}
                  </div>
                </div>
              </div>
            );
          } else {
            items.push(
              <div className="cat-container" key={"btd" + key}>
                <div className="ch-child-item">
                  <div className="box-container">
                    {animateForm(inputComponent, ind)}
                  </div>
                </div>
                <div className="child"></div>
              </div>
            );
          }
        }
      }
      // lastGrid = lastGrid >= 12 ? grid :  lastGrid + grid >= 12 ? 12 : lastGrid + grid;
    });

    return items;
  };