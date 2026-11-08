import React, { useState } from "react";
import { IoIosArrowForward, IoIosArrowDown, IoIosLock } from "react-icons/io";
import { MdDeleteOutline } from "react-icons/md";
import { IconButton, Button, Grid } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import FieldDetailItems from "./FieldDetailItems";

const FieldDetail = ({
  name,
  icon,
  fieldId,
  readonly,
  fields,
  setFields
}) => {
  const [expand, setExpand] = useState(false);
  const [error, setError] = useState(false);

  let fieldValues = {
    //frontend
    grid: null,

    //backend
    fieldIndex: 0,
    primaryKey: false,
    allowNull: true,
    autoIncrement: false,
    unique: false,
    type: 1,
    defaultValue: "",
    required: false,
  };

  let currentField;
  fields?.map((field, index) => {
        if (field.id === fieldId) {
          currentField = field;
          const backend = field.backend;
        fieldValues = {
          fieldIndex: index,
          primaryKey: backend?.primaryKey,
          allowNull: backend?.allowNull,
          autoIncrement: backend?.autoIncrement,
          unique: backend?.unique,
          type: backend?.type,
          defaultValue: backend?.defaultValue,
          mainTargetField: backend?.mainTargetField,
          required: (field?.frontend?.required==true) || (field?.frontend?.required=="true")
        };
      }})
  return (
    <div className="list-card shadow-1 items-center py-2 border rounded-md" style={{ height: expand ? "auto" : "" }}>
      <div
        className="list-card-header"
        style={{
          alignItems: expand ? "flex-start" : "",
          height: expand ? (error ? 70 : 50) : "",
        }}
      >
        <div className="list-card-header-left w-full">
          <div className="icon">{icon}</div>
          <p className="p-name w-full">
            {expand && (
              <>
                <input
                  value={name}
                  placeholder="Enter field name"
                  style={{
                    border: error ? "1px solid red" : "",
                    //outline: error ? '1px solid red' : '',
                    padding: 10,
                    borderRadius: error ? 3 : 1,
                    width: "100%",
                    marginRight: 10,
                  }}
                  onChange={(e) => {
                    const flds = fields;
                    let found = false;
                    flds.map((fld) => {
                      if (
                        fld.id !== fieldId &&
                        fld.name.toLowerCase() ==
                          e.target.value.toLocaleLowerCase()
                      ) {
                        found = true;
                      }
                    });
                    if (!error && found) {
                      setError((err) => "field already exists");
                    } else if (e.target.value == "") {
                      setError((err) => "field cannot be empty");
                    } else if (error && !found) {
                      setError((err) => "");
                    }
                    const value = e.target.value;
                    let updatedFields = fields?.map((field, index)=>{
                      if(field?.id === fieldId) {
                              field.name = value;
                              if(field?.frontend.type==="text") {
                                  field.frontend.label = value?.split(/(?=[A-Z])/).join(' ');
                                  field.frontend.placeholder = "Enter "+value?.split(/(?=[A-Z])/).join(' ').toLowerCase();
                              }
          
                              let str = value.replace(/[^a-z0-9_\s]/gi, "");
                              str = str.trim();
                              str = str.replace(/\s+/g, " ");
                              str = str.split(" ").join("_");
                              
                              
                              field.backend.db_label = str.toLowerCase();
          
                          }
                          return field
                      })
                      setFields(updatedFields)
                  }}
                />
                {error && (
                  <label
                    style={{
                      fontSize: 11,
                      color: "#fd5869",
                      marginTop: 3,
                      fontWeight: "lighter",
                    }}
                  >
                    {error}
                  </label>
                )}
              </>
            )}

            {!expand && name}
          </p>
        </div>
        {!expand && (
          <IconButton
            onClick={() => {
              if (!readonly) {
                setExpand(true);
              }
            }}
          >
            {readonly && (
              <IoIosLock
                style={{
                  color: "#172b4d",
                  fontSize: 16,
                }}
              />
            )}
            {!readonly && (
              <IoIosArrowForward
                style={{
                  color: "#172b4d",
                  fontSize: 16,
                }}
              />
            )}
          </IconButton>
        )}
        {expand && (
          <IconButton
            onClick={() => {
              setExpand(false);
            }}
          >
            <IoIosArrowDown
              style={{
                color: "#172b4d",
                fontSize: 16,
              }}
            />
          </IconButton>
        )}
      </div>
      
      {expand &&
      <div className="border">
        <FieldDetailItems 
            name={name}
            icon={icon}
            fieldId={fieldId}
            readonly={readonly}
            currentField={currentField}
            fieldValues={fieldValues}
            fields={fields}
            setFields={setFields}
        />
      </div>
      }


      {expand && (
        <div className="list-card-footer">
          <div className="footer-required">
            <input
              type="checkbox"
              id={"footer-required" + fieldId}
              className="hover:cursor-pointer"
              checked={fieldValues?.required??false}
              onChange={(e)=>{
                  let value =e.target.checked;
                  let newFields = fields?.map((field)=>{
                    if(field?.id == fieldId) {
                      field.frontend.required = e.target.checked
                    }
                    return field
                  })
                  setFields(fields)
              }}
            />
            <label
              htmlFor={"footer-required" + fieldId}
              className="hover:cursor-pointer"
            >
              Required
            </label>
          </div>
          <Button
            color="error"
            variant="standard"
            size="small"
            startIcon={<MdDeleteOutline />}
            style={{
              marginLeft: 15,
            }}
            onClick={() => {

              let newField = fields?.find((field)=>(field?.id == fieldId))
              if(!newField) return;
              newField.id == uuidv4();
              newField.name = newField?.name+"_1";
              setFields([...fields, newField])
            }}
          >
            <p
              style={{
                marginTop: 1,
                textTransform: "capitalize",
                fontSize: 15,
                fontWeight: "lighter",
                color: "#091e42",
              }}
            >
              Duplicate
            </p>
          </Button>
          <Button
            color="error"
            variant="standard"
            size="small"
            startIcon={<MdDeleteOutline />}
            style={{
              marginLeft: 15,
            }}
            onClick={() => {
              if (confirm("Are you sure?")) {
                const newFields = fields?.filter((field)=>field?.id != fieldId)
                setFields(newFields)
              }
            }}
          >
            <p
              style={{
                marginTop: 1,
                textTransform: "capitalize",
                fontSize: 15,
                fontWeight: "lighter",
                color: "#091e42",
              }}
            >
              Remove
            </p>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FieldDetail;
