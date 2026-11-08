import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";

import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { DataGrid, useGridApiContext } from "@mui/x-data-grid";
import { MdAdd, MdDeleteOutline } from "react-icons/md";
import { BsFillPatchCheckFill, BsThreeDotsVertical } from "react-icons/bs";
import { AiOutlineClear, AiOutlineCloseCircle } from "react-icons/ai";
import { MenuOverlay } from "../CrudComponents/ComponentsOverlay";
import { BiCopy, BiPaste } from "react-icons/bi";

const FieldDetailItems = ({
  name,
  icon,
  fieldId,
  readonly,
  currentField,
  fieldValues,
  fields,
  setFields
}) => {
  const setFieldValues = ({label, value}) => {
    const updatedFields = fields?.map((field) => {
        let fld = {...field}
        if (field?.id === fieldId) {
            fld.frontend[label] = value;

            if(label==="options") {
                let newOptions = value?.map((val)=>val?.value)
                fld.backend.options = newOptions
            }
            if(label==="multiple" && value == true) {
                fld.backend.type = 2
            }
            else if(label==="multiple" && value == false) {
                fld.backend.type = 13
            }
            
            if(fld?.frontend.type == 'divider') {
                fld.backend = {};
            }
        }
        return fld;
    });

    setFields(updatedFields)

    
  }

  return (
    <div className="pt-6">
        <div className="list-card-body border-b">
          {
            <Grid container spacing={1}>
              {/* select only fields*/}
              {(currentField?.frontend?.type == "select") && (
                <div className="w-full">
                  <Box
                    sx={{ width: "100%" }}
                    style={{
                      border: "2px solid white",
                      borderRadius: 5,
                      padding: 10,
                      marginTop: -3,
                    }}
                  >
                    {/* <Stack direction="row" spacing={1} sx={{ mb: 1 }}> */}
                    <div className="flex justify-between items-center w-full mb-2">
                      <Button
                        size="small"
                        onClick={() => {
                          const value = currentField?.frontend?.options;
                          const updatedValue = [
                            ...value,
                            {
                              name: "Option" + (value?.length + 1),
                              value: "Option" + (value?.length + 1),
                            },
                          ]
                          setFieldValues({label: "options", value: updatedValue})
                        }}
                        startIcon={<MdAdd />}
                      >
                        Add option
                      </Button>

                      <div className="mr-5">
                        <FormControlLabel
                          sx={{
                            fontFamily: "ubuntu",
                            //ml: 1,
                          }}
                          control={
                            <Checkbox
                              checked={currentField?.frontend?.color}
                              onChange={(e) => {
                                setFieldValues({label: "color", value: e.target.value})
                              }}
                              size="small"
                            />
                          }
                          label={<p style={{ fontSize: 15 }}>Enable Color</p>}
                        />
                      </div>
                    </div>
                    {/* </Stack> */}
                    <DataGrid
                      rows={currentField?.frontend?.options ?? []}
                      columns={[
                        {
                          field: "name",
                          headerName: "Name",
                          flex: 1,
                          editable: true,
                          sortable: false,
                        },
                        {
                          field: "value",
                          headerName: "Value",
                          flex: 1,
                          editable: true,
                          sortable: false,
                        },
                        (currentField?.frontend?.color ?? false) && {
                          field: "color",
                          headerName: "Color",
                          renderCell: (params) => (
                            <div
                              style={{
                                width: 80,
                                height: 50,
                                backgroundColor: params?.row?.color,
                                fontFamily: "ubuntu",
                              }}
                              className="flex justify-center items-center rounded-md"
                            >
                              <p className="text-white">{params?.row?.color}</p>
                            </div>
                          ),
                          flex: 1,
                          editable: true,
                          sortable: false,
                        },
                        {
                          field: "delete",
                          headerName: "Delete",
                          sortable: false,
                          renderCell: (params) => (
                            <IconButton
                              onClick={() => {
                                let options =
                                  currentField?.frontend?.options?.filter(
                                    (op) => op?.value != params?.row?.value
                                  );
                                  setFieldValues({label: "options", value: options})
                              }}
                            >
                              <MdDeleteOutline />
                            </IconButton>
                          ),
                        },
                      ]}
                      autoHeight={true}
                      //style={{backgroundColor:"rgba(0,0,0,.8)",color:"white"}}
                      hideFooter
                      disableColumnMenu
                      disableColumnFilter
                      disableColumnSelector
                      getRowId={(row) => {
                        let id = 0;
                        currentField?.frontend?.options?.map((op, index) => {
                          if (
                            op?.name == row?.name &&
                            op?.value == row?.value
                          ) {
                            id = index + 1;
                          }
                        });
                        return id;
                      }}
                      sx={{
                        mx: 2,
                        /*"& .MuiDataGrid-columnHeader:last-child .MuiDataGrid-columnSeparator": {
                                    display: "none"
                                }*/
                        "& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator":
                          {
                            display: "none",
                          },
                      }}
                      components={{
                        NoRowsOverlay: () => (
                          <Stack
                            height="100%"
                            alignItems="center"
                            justifyContent="center"
                          >
                            No item added
                          </Stack>
                        ),
                        NoResultsOverlay: () => (
                          <Stack
                            height="100%"
                            alignItems="center"
                            justifyContent="center"
                          >
                            Local filter returns no result
                          </Stack>
                        ),
                      }}
                      // onCellEditStop={(rowsCommit)=>{
                      //   if(rowsCommit?.reason != "escapeKeyDown") {
                      //     console.log(rowsCommit)
                      //   }
                      // }}
                      onCellEditCommit={(params, event) => {
                        const { id, field, value } = params;
                        let options = [];
                        currentField?.frontend?.options?.map((op, index) => {
                          if (index + 1 == id) {
                            options.push({ ...op, [field]: value });
                          } else {
                            options.push(op);
                          }
                        });
                        setFieldValues({label: "options", value: options});
                      }}
                    />
                  </Box>
                </div>
              )}

              {/* collections */}
              {currentField?.frontend?.type == "collection" && (
                <Grid item xs={12}>
                  <label
                    style={{ fontSize: 15, fontWeight: "lighter" }}
                    className="mx-4 -mb-1"
                  >
                    Columns
                  </label>
                  <div className="flex full-width border rounded-md m-4">
                    <div className="w-full">
                      <Box
                        sx={{ width: "100%" }}
                        style={{
                          border: "2px solid white",
                          borderRadius: 5,
                          padding: 10,
                          marginTop: -3,
                        }}
                      >
                        {/* <Stack direction="row" spacing={1} sx={{ mb: 1 }}> */}
                        <div className="flex justify-between items-center w-full mb-2">
                          <Button
                            size="small"
                            onClick={() => {
                              const value =
                                currentField?.frontend?.collectionCollumns ??
                                [];
                              const val = [
                                ...value,
                                {
                                  id: (value?.length ?? 0) + 1,
                                  field: "",
                                  header: "",
                                  type: "text",
                                  options: [],
                                  color: false,
                                  // params: [],
                                },
                              ];
                              setFieldValues({label: "collectionCollumns", value: val})
                              
                            }}
                            startIcon={<MdAdd />}
                          >
                            Add Column
                          </Button>
                        </div>
                        {/* </Stack> */}
                        <DataGrid
                          rows={
                            currentField?.frontend?.collectionCollumns ?? []
                          }
                          columns={[
                            {
                              field: "field",
                              headerName: "Field",
                              flex: 2,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                            },
                            {
                              field: "header",
                              headerName: "Header",
                              flex: 2,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                            },
                            {
                              field: "type",
                              headerName: "Type",
                              flex: 2,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                              renderEditCell: (props) => {
                                const { id, value, field } = props;
                                const apiRef = useGridApiContext();

                                const handleValueChange = (event) => {
                                  const newValue = event.target.value;
                                  apiRef.current.setEditCellValue({
                                    id,
                                    field,
                                    value: newValue,
                                  });
                                };

                                return (
                                  <Select
                                    value={value}
                                    sx={{
                                      height: 45,
                                      padding: 0,
                                      borderRadius: 2,
                                    }}
                                    fullWidth
                                    multiple={false}
                                    className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                                    onChange={(e) => {
                                      handleValueChange(e);
                                    }}
                                  >
                                    <MenuItem value="text">Text</MenuItem>
                                    <MenuItem value="select">Select</MenuItem>
                                    <MenuItem value="checkbox">
                                      Checkbox
                                    </MenuItem>
                                    <MenuItem value="date">Date</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="currency">
                                      Currency
                                    </MenuItem>
                                    <MenuItem value="datetime">
                                      Date Time
                                    </MenuItem>
                                  </Select>
                                );

                                // return <input type="text" value={value} onChange={handleValueChange} />;
                              },
                            },
                           
                            {
                              field: "delete",
                              headerName: "Delete",
                              sortable: false,
                              renderCell: (params) => (
                                <IconButton
                                  onClick={() => {
                                    let options =
                                      currentField?.frontend?.collectionCollumns?.filter(
                                        (op) => op?.id != params?.row?.id
                                      );

                                    setFieldValues({label: "collectionCollumns", value: options})
                                  }}
                                >
                                  <MdDeleteOutline />
                                </IconButton>
                              ),
                            },
                          ]}
                          autoHeight={true}
                          //style={{backgroundColor:"rgba(0,0,0,.8)",color:"white"}}
                          hideFooter
                          disableColumnMenu
                          disableColumnFilter
                          disableColumnSelector
                          getRowId={(row) => {
                            // let id = 0;
                            // fieldValues?.filterOptions?.map((op, index)=>{
                            //   if(op?.name==row?.name && op?.value==row?.value) {
                            //     id = index+1;
                            //   }
                            // })
                            // return id;
                            return row?.id;
                          }}
                          sx={{
                            mx: 2,
                            /*"& .MuiDataGrid-columnHeader:last-child .MuiDataGrid-columnSeparator": {
                                  display: "none"
                              }*/
                            "& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator":
                              {
                                display: "none",
                              },
                          }}
                          components={{
                            NoRowsOverlay: () => (
                              <Stack
                                height="100%"
                                alignItems="center"
                                justifyContent="center"
                              >
                                No column added
                              </Stack>
                            ),
                            NoResultsOverlay: () => (
                              <Stack
                                height="100%"
                                alignItems="center"
                                justifyContent="center"
                              >
                                Local filter returns no result
                              </Stack>
                            ),
                          }}
                          // onCellEditStop={(rowsCommit)=>{
                          //   if(rowsCommit?.reason != "escapeKeyDown") {
                          //     console.log(rowsCommit)
                          //   }
                          // }}
                          onCellEditCommit={(params, event) => {
                            const { id, field, value } = params;
                            let options = [];
                            currentField?.frontend?.collectionCollumns?.map(
                              (op, index) => {
                                if (op?.id == id) {
                                  options.push({ ...op, [field]: value });
                                } else {
                                  options.push(op);
                                }
                              }
                            );

                            setFieldValues({label: "collectionCollumns", value: options});
                          }}
                        />

                        {currentField?.frontend?.collectionCollumns?.map(
                          (cc, ccIndex) => {
                            if (cc?.type != "select") return;
                            return (
                              <Box
                                key={ccIndex}
                                sx={{ width: "100%" }}
                                style={{
                                  border: "2px solid white",
                                  borderRadius: 5,
                                  padding: 10,
                                  marginTop: -3,
                                }}
                              >
                                {/* <Stack direction="row" spacing={1} sx={{ mb: 1 }}> */}
                                <div className="flex justify-between items-center w-full mb-2">
                                  <Button
                                    size="small"
                                    onClick={() => {
                                      const valueOptions = cc?.options ?? [];
                                      const value =
                                        currentField?.frontend?.collectionCollumns?.map(
                                          (val) => {
                                            if (val?.id == cc?.id) {
                                              return {
                                                ...val,
                                                options: [
                                                  ...valueOptions,
                                                  {
                                                    id:
                                                      (valueOptions?.length ??
                                                        0) + 1,
                                                    name:
                                                      "Option" +
                                                      (valueOptions?.length +
                                                        1),
                                                    value:
                                                      "Option" +
                                                      (valueOptions?.length +
                                                        1),
                                                  },
                                                ],
                                              };
                                            } else {
                                              return val;
                                            }
                                          }
                                        );

                                        setFieldValues({label: "collectionCollumns", value: value})
                                      
                                    }}
                                    startIcon={<MdAdd />}
                                  >
                                    Add {cc?.header ? cc?.header : cc?.field}{" "}
                                    option
                                  </Button>

                                  <div className="mr-5">
                                    <FormControlLabel
                                      sx={{
                                        fontFamily: "ubuntu",
                                        //ml: 1,
                                      }}
                                      control={
                                        <Checkbox
                                          checked={console.clear()?.color}
                                          onChange={(e) => {
                                            const value =
                                              currentField?.frontend?.collectionCollumns?.map(
                                                (val) => {
                                                  if (val?.id == cc?.id) {
                                                    return {
                                                      ...val,
                                                      color: e.target.checked,
                                                    };
                                                  } else {
                                                    return val;
                                                  }
                                                }
                                              );
                                              setFieldValues({label: "collectionCollumns", value: value})
                                          }}
                                          size="small"
                                        />
                                      }
                                      label={
                                        <p style={{ fontSize: 15 }}>
                                          Enable Color
                                        </p>
                                      }
                                    />
                                  </div>
                                </div>
                                {/* </Stack> */}
                                <DataGrid
                                  rows={cc?.options ?? []}
                                  columns={[
                                    {
                                      field: "name",
                                      headerName: "Name",
                                      flex: 1,
                                      editable: true,
                                      sortable: false,
                                    },
                                    {
                                      field: "value",
                                      headerName: "Value",
                                      flex: 1,
                                      editable: true,
                                      sortable: false,
                                    },
                                    (cc?.color ?? false) && {
                                      field: "color",
                                      headerName: "Color",
                                      renderCell: (params) => (
                                        <div
                                          style={{
                                            width: 80,
                                            height: 50,
                                            backgroundColor: params?.row?.color,
                                            fontFamily: "ubuntu",
                                          }}
                                          className="flex justify-center items-center rounded-md"
                                        >
                                          <p className="text-white">
                                            {params?.row?.color}
                                          </p>
                                        </div>
                                      ),
                                      flex: 1,
                                      editable: true,
                                      sortable: false,
                                    },
                                    {
                                      field: "delete",
                                      headerName: "Delete",
                                      sortable: false,
                                      renderCell: (params) => (
                                        <IconButton
                                          onClick={() => {
                                            let options = cc?.options?.filter(
                                              (op) =>
                                                op?.value != params?.row?.value
                                            );
                                            const value =
                                              currentField?.frontend?.collectionCollumns?.map(
                                                (val) => {
                                                  if (val?.id == cc?.id) {
                                                    return {
                                                      ...val,
                                                      options: options,
                                                    };
                                                  } else {
                                                    return val;
                                                  }
                                                }
                                              );

                                            setFieldValues({label: "collectionCollumns", value: value});
                                          }}
                                        >
                                          <MdDeleteOutline />
                                        </IconButton>
                                      ),
                                    },
                                  ]}
                                  autoHeight={true}
                                  //style={{backgroundColor:"rgba(0,0,0,.8)",color:"white"}}
                                  hideFooter
                                  disableColumnMenu
                                  disableColumnFilter
                                  disableColumnSelector
                                  getRowId={(row) => {
                                    let id = 0;
                                    cc?.options?.map((op, index) => {
                                      if (
                                        op?.name == row?.name &&
                                        op?.value == row?.value
                                      ) {
                                        id = index + 1;
                                      }
                                    });
                                    return id;
                                  }}
                                  sx={{
                                    mx: 2,
                                    /*"& .MuiDataGrid-columnHeader:last-child .MuiDataGrid-columnSeparator": {
                                            display: "none"
                                        }*/
                                    "& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator":
                                      {
                                        display: "none",
                                      },
                                  }}
                                  components={{
                                    NoRowsOverlay: () => (
                                      <Stack
                                        height="100%"
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        No item added
                                      </Stack>
                                    ),
                                    NoResultsOverlay: () => (
                                      <Stack
                                        height="100%"
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        Local filter returns no result
                                      </Stack>
                                    ),
                                  }}
                                  // onCellEditStop={(rowsCommit)=>{
                                  //   if(rowsCommit?.reason != "escapeKeyDown") {
                                  //     console.log(rowsCommit)
                                  //   }
                                  // }}
                                  onCellEditCommit={(params, event) => {
                                    const { id, field, value } = params;

                                    const opEdited = cc?.options?.map(
                                      (op, index) => {
                                        if (index + 1 == id) {
                                          return { ...op, [field]: value };
                                        } else {
                                          return op;
                                        }
                                      }
                                    );

                                    const valueEdited =
                                      currentField?.frontend?.collectionCollumns?.map(
                                        (val) => {
                                          if (val?.id == cc?.id) {
                                            return {
                                              ...val,
                                              options: opEdited,
                                            };
                                          } else {
                                            return val;
                                          }
                                        }
                                      );

                                    setFieldValues({label: "collectionCollumns", value: valueEdited})
                                  }}
                                />
                              </Box>
                            );
                          }
                        )}
                      </Box>
                    </div>
                  </div>
                </Grid>
              )}

              {/* avatar */}
              {currentField?.frontend?.type == "select" && (
                <div className="rounded border ml-4">
                  <div className="flex gap-4 mt-4 ml-0">
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"avatar" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.avatar ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label:"avatar", value: checked})
                        }}
                      />
                      <label
                        htmlFor={"avatar" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Avatar
                      </label>
                    </div>
                    {/* checkbox */}
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"checkbox" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.checkbox ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "checkbox", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"checkbox" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Checkbox
                      </label>
                    </div>

                    {/* flex */}
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"flex" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.flex ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "flex", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"flex" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Flex
                      </label>
                    </div>
                    {/* multiple */}
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"multiple" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.multiple ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "multiple", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"multiple" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Multiple
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <Grid item xs={12}></Grid>
              {/* date only fields */}
              {currentField?.frontend?.type == "date" && (
                <Grid item xs={12}>
                  <div className="flex">
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"body-frontend-primary_date" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.date ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "date", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"body-frontend-primary_date" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Date
                      </label>
                    </div>

                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"body-frontend-primary_time" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.time ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "time", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"body-frontend-primary_time" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Time
                      </label>
                    </div>
                  </div>

                  {((currentField?.frontend?.date ?? false) ||
                    (currentField?.frontend?.time ?? false)) && (
                    <div className="flex border m-3 pt-4">
                      {/* date */}
                      {(currentField?.frontend?.date ?? false) && (
                        <div className="body-checkbox-div">
                          <input
                            type="checkbox"
                            id={"body-frontend-primary_day" + fieldId}
                            className="hover:cursor-pointer"
                            checked={currentField?.frontend?.day ?? false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldValues({label: "day", value: checked});
                            }}
                          />
                          <label
                            htmlFor={"body-frontend-primary_day" + fieldId}
                            className="hover:cursor-pointer"
                          >
                            Day
                          </label>
                        </div>
                      )}
                      {(currentField?.frontend?.date ?? false) && (
                        <div className="body-checkbox-div">
                          <input
                            type="checkbox"
                            id={"body-frontend-primary_month" + fieldId}
                            className="hover:cursor-pointer"
                            checked={currentField?.frontend?.month ?? false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldValues({label: "month", value: checked});
                            }}
                          />
                          <label
                            htmlFor={"body-frontend-primary_month" + fieldId}
                            className="hover:cursor-pointer"
                          >
                            Month
                          </label>
                        </div>
                      )}
                      {(currentField?.frontend?.date ?? false) && (
                        <div className="body-checkbox-div">
                          <input
                            type="checkbox"
                            id={"body-frontend-primary_year" + fieldId}
                            className="hover:cursor-pointer"
                            checked={currentField?.frontend?.year ?? false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldValues({label: "year", value: checked});
                            }}
                          />
                          <label
                            htmlFor={"body-frontend-primary_year" + fieldId}
                            className="hover:cursor-pointer"
                          >
                            Year
                          </label>
                        </div>
                      )}

                      {/* time */}
                      {(currentField?.frontend?.time ?? false) && (
                        <div className="body-checkbox-div">
                          <input
                            type="checkbox"
                            id={"body-frontend-primary_hour" + fieldId}
                            className="hover:cursor-pointer"
                            checked={currentField?.frontend?.hour ?? false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldValues({label: "hour", value: checked});
                            }}
                          />
                          <label
                            htmlFor={"body-frontend-primary_hour" + fieldId}
                            className="hover:cursor-pointer"
                          >
                            Hour
                          </label>
                        </div>
                      )}
                      {(currentField?.frontend?.time ?? false) && (
                        <div className="body-checkbox-div">
                          <input
                            type="checkbox"
                            id={"body-frontend-primary_minute" + fieldId}
                            className="hover:cursor-pointer"
                            checked={currentField?.frontend?.minute ?? false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldValues({label: "minute", value: checked});
                            }}
                          />
                          <label
                            htmlFor={"body-frontend-primary_minute" + fieldId}
                            className="hover:cursor-pointer"
                          >
                            Minute
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </Grid>
              )}
              
              <Grid item xs={12} className="pt-2 ml-2 mt-2 border-t"></Grid>

              {currentField?.frontend?.type == "divider" && (
                <Grid>
                  <div className="flex my-4 flex-wrap items-center">
                    <div style={{ marginLeft: 25, marginBottom: 20 }}>
                      <TextField
                        value={currentField?.frontend?.alignment ?? "center"}
                        sx={{
                          minWidth: 200,
                          marginRight: 2,
                        }}
                        size="small"
                        select
                        label="Alignment"
                        onChange={(e) => {
                          setFieldValues({label: "alignment", value: e.target.value});
                        }}
                      >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                      </TextField>
                    </div>
                  </div>
                </Grid>
              )}
              {currentField?.frontend?.type == "divider" && (
                <Grid>
                  <div className="body-checkbox-div mt-4">
                    <input
                      type="checkbox"
                      id={"noLabel" + fieldId}
                      className="hover:cursor-pointer"
                      checked={currentField?.frontend?.noLabel ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFieldValues({label: "noLabel", value: checked});
                      }}
                    />
                    <label
                      htmlFor={"noLabel" + fieldId}
                      className="hover:cursor-pointer"
                    >
                      No Label
                    </label>
                  </div>
                </Grid>
              )}
              {/* mui toggle */}
              <Grid item>
                <div className="flex justify-between flex-wrap">
            
                  {/* Row */}
                  {(currentField?.frontend?.type == "radio" ?? false) && (
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"row" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.row ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "row", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"row" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Row
                      </label>
                    </div>
                  )}
                </div>
              </Grid>
              <Grid item xs={12}></Grid>
              {/* placeholder */}
              {(currentField?.frontend?.type != "radio" ?? false) &&
                (currentField?.frontend?.type != "slider" ?? false) &&
                (currentField?.frontend?.type != "checkbox" ?? false) &&
                (currentField?.frontend?.type != "select" ?? false) &&
                (currentField?.frontend?.type != "custom" ?? false) &&
                (currentField?.frontend?.type != "file" ?? false) &&
                (currentField?.frontend?.type != "image" ?? false) &&
                currentField?.type != 3 &&
                currentField?.frontend?.type != "divider" &&
                currentField?.frontend?.type != "signature" &&
                (currentField?.frontend?.type != "rich_text" ?? false) && (
                  <Grid item xs={12} md={12} lg={6}>
                    <div className="body-checkbox-div flex flex-col">
                      <label className="hover:cursor-pointer -mb-1 -ml-2">
                        Placeholder
                      </label>
                      <input
                        style={{
                          border: "1px solid #cccccc",
                          //outline: error ? '1px solid red' : '',
                          padding: 15,
                          paddingLeft: 10,
                          borderRadius: 4,
                          width: "100%",
                          marginRight: 10,
                          height: 45,
                        }}
                        id={"body-frontend-primary" + fieldId}
                        className="hover:cursor-pointer"
                        value={currentField?.frontend?.placeholder ?? ""}
                        onChange={(e) => {
                          let value = e.target.value;
                          setFieldValues({label: "placeholder", value: value});
                        }}
                      />
                    </div>
                  </Grid>
                )}
              {currentField?.frontend?.type == "slider" && (
                <>
                  {/* min */}
                  <Grid item xs={4}>
                    <div className="body-checkbox-div flex flex-col">
                      <label className="hover:cursor-pointer -mb-1 -ml-2">
                        Min
                      </label>
                      <input
                        style={{
                          border: "1px solid #cccccc",
                          //outline: error ? '1px solid red' : '',
                          padding: 15,
                          paddingLeft: 10,
                          borderRadius: 4,
                          width: "100%",
                          marginRight: 10,
                          height: 45,
                        }}
                        className="hover:cursor-pointer"
                        value={currentField?.frontend?.min ?? 0}
                        onChange={(e) => {
                          let value = parseFloat(e.target.value);
                          setFieldValues({label: "min", value: value});
                        }}
                      />
                    </div>
                  </Grid>

                  {/* max */}
                  <Grid item xs={4}>
                    <div className="body-checkbox-div flex flex-col">
                      <label className="hover:cursor-pointer -mb-1 -ml-2">
                        Max
                      </label>
                      <input
                        style={{
                          border: "1px solid #cccccc",
                          //outline: error ? '1px solid red' : '',
                          padding: 15,
                          paddingLeft: 10,
                          borderRadius: 4,
                          width: "100%",
                          marginRight: 10,
                          height: 45,
                        }}
                        className="hover:cursor-pointer"
                        value={currentField?.frontend?.max ?? 100}
                        onChange={(e) => {
                          let value = parseFloat(e.target.value);
                          setFieldValues({label: "max", value: value});
                        }}
                      />
                    </div>
                  </Grid>

                  {/* step */}
                  <Grid item xs={4}>
                    <div className="body-checkbox-div flex flex-col">
                      <label className="hover:cursor-pointer -mb-1 -ml-2">
                        Step
                      </label>
                      <input
                        style={{
                          border: "1px solid #cccccc",
                          //outline: error ? '1px solid red' : '',
                          padding: 15,
                          paddingLeft: 10,
                          borderRadius: 4,
                          width: "100%",
                          marginRight: 10,
                          height: 45,
                        }}
                        className="hover:cursor-pointer"
                        value={currentField?.frontend?.step ?? 1}
                        onChange={(e) => {
                          let value = parseInt(e.target.value);
                          setFieldValues({label: "step", value: value});
                        }}
                      />
                    </div>
                  </Grid>

                  {/* symbol */}
                  <Grid item xs={3}>
                    <div className="body-checkbox-div flex flex-col">
                      <label className="hover:cursor-pointer -mb-1 -ml-2">
                        Symbol
                      </label>
                      <input
                        style={{
                          border: "1px solid #cccccc",
                          //outline: error ? '1px solid red' : '',
                          padding: 15,
                          paddingLeft: 10,
                          borderRadius: 4,
                          width: "100%",
                          marginRight: 10,
                          height: 45,
                        }}
                        className="hover:cursor-pointer"
                        value={currentField?.frontend?.symbol ?? "%"}
                        onChange={(e) => {
                          let value = e.target.value;
                          setFieldValues({label: "symbol", value: value});
                        }}
                      />
                    </div>
                  </Grid>

                  {/* show value */}
                  <Grid item xs={9}>
                    <div className="body-checkbox-div">
                      <input
                        type="checkbox"
                        id={"showValue" + fieldId}
                        className="hover:cursor-pointer"
                        checked={currentField?.frontend?.showValue ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValues({label: "showValue", value: checked});
                        }}
                      />
                      <label
                        htmlFor={"showValue" + fieldId}
                        className="hover:cursor-pointer"
                      >
                        Show Value (like 75%)
                      </label>
                    </div>
                  </Grid>
                </>
              )}

              {/* grid */}
              {(currentField?.frontend?.override ?? false) && (
                <Grid item xs={12} md={12} lg={6}>
                  <div className="body-checkbox-div flex flex-col">
                    <label className="hover:cursor-pointer -mb-1 -ml-2">
                      Grid (max 12)
                    </label>
                    <input
                      style={{
                        border: "1px solid #cccccc",
                        //outline: error ? '1px solid red' : '',
                        padding: 15,
                        paddingLeft: 10,
                        borderRadius: 4,
                        width: "100%",
                        marginRight: 10,
                        height: 45,
                      }}
                      id={"body-frontend-primary" + fieldId}
                      className="hover:cursor-pointer"
                      value={currentField?.frontend?.grid ?? ""}
                      onChange={(e) => {
                        let value = parseFloat(e.target.value);
                        if (!value || isNaN(value)) value = 0;
                        if (value < 0.01) value = 0.01;
                        if (value > 12) value = 12;
                        setFieldValues({label: "grid", value: value});
                      }}
                    />
                  </div>
                </Grid>
              )}

              <div className="mx-6 my-2 w-full">
                <Grid container spacing={2}>
                  <Grid item>
                    <FormControlLabel
                      sx={{
                        fontFamily: "ubuntu",
                        //ml: 1,
                      }}
                      control={
                        <Checkbox
                          checked={currentField?.frontend?.enableDependencies}
                          onChange={(e) => {
                            setFieldValues({label: "enableDependencies", value: e.target.checked});
                          }}
                          size="small"
                        />
                      }
                      label={
                        <p style={{ fontSize: 15, marginLeft: -10 }}>
                          Enable Dependencies
                        </p>
                      }
                    />
                  </Grid>
                </Grid>
              </div>

              {/* dependencies */}
              {currentField?.frontend?.enableDependencies && (
                <Grid item xs={12}>
                  <div className="flex items-between">
                    <label
                      style={{ fontSize: 15, fontWeight: "lighter" }}
                      className="mx-4 -mb-1"
                    >
                      Dependencies
                    </label>
                    <div>
                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={
                            currentField?.frontend?.dependencyOperator ?? "&&"
                          }
                          label="Operator"
                          multiple={false}
                          onChange={(e) => {
                            setFieldValues({label: "dependencyOperator", value: e.target.value});
                          }}
                        >
                          <MenuItem value="&&">AND</MenuItem>
                          <MenuItem value="||">OR</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                    <div className="flex gap-2 w-full items-center justify-end mr-5">
                      <div>
                        <MenuOverlay
                          button={
                            <IconButton>
                              <BsThreeDotsVertical size={20} />
                            </IconButton>
                          }
                          menuItems={[
                            {
                              name: "Copy",
                              icon: <BiCopy />,
                              onClick: () => {
                                const deps =
                                  currentField?.frontend?.dependencies;
                                const depFormulas =
                                  currentField?.frontend?.dependencyFormulas;
                                let value = {
                                  dependencies: {
                                    dependencies: deps ?? [],
                                    dependencyFormulas: depFormulas ?? [],
                                  },
                                };
                                localStorage.setItem(
                                  "clipboard",
                                  JSON.stringify(value)
                                );
                              },
                            },
                            {
                              name: "Paste",
                              icon: <BiPaste />,
                              divider: true,
                              onClick: () => {
                                if (confirm("Are you sure?")) {
                                  const localValue =
                                    localStorage.getItem("clipboard");
                                  const text = localValue
                                    ? JSON.parse(localValue)
                                    : [];
                                  if (text) {
                                    const value = text;
                                    if (
                                      value?.dependencies &&
                                      value?.dependencies?.dependencies
                                    ) {
                                      const dependencies =
                                        value?.dependencies?.dependencies;
                                      const dependencyFormulas =
                                        value?.dependencies?.dependencyFormulas;

                                      if (dependencies) {
                                        setFieldValues({label: "dependencies", value: dependencies ?? []});
                                      }
                                      if (dependencies) {
                                        setFieldValues({label: "dependencyFormulas", value: dependencyFormulas ?? []});
                                      }
                                    } else {
                                      alert("Copy dependency first");
                                    }
                                  } else {
                                    alert("Copy dependency first");
                                  }
                                }
                              },
                            },
                            {
                              name: "Clear",
                              icon: <AiOutlineClear />,
                              onClick: () => {
                                const value =
                                  currentField?.frontend?.dependencies ?? [];
                                if (confirm("Are you sure?")) {
                                  setFieldValues({label: "dependencies", value: []});
                                  setFieldValues({label: "dependencyFormulas", value: []});
                                }
                              },
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex full-width border rounded-md m-4">
                    <div className="w-full">
                      <Box
                        sx={{ width: "100%" }}
                        style={{
                          border: "2px solid white",
                          borderRadius: 5,
                          padding: 10,
                          marginTop: -3,
                        }}
                      >
                        {/* <Stack direction="row" spacing={1} sx={{ mb: 1 }}> */}
                        <div className="flex justify-between items-center w-full mb-2">
                          <Button
                            size="small"
                            onClick={() => {
                              const value =
                                currentField?.frontend?.dependencies ?? [];
                              const val = [
                                ...value,
                                {
                                  id: (value?.length ?? 0) + 1,
                                  target: "",
                                  value: "",
                                  type: "string",
                                  formula: false,
                                  op: "==",
                                },
                              ];
                              setFieldValues({label: "dependencies", value: val});
                            }}
                            startIcon={<MdAdd />}
                          >
                            Add Dependency
                          </Button>
                        </div>
                        {/* </Stack> */}
                        <DataGrid
                          rows={currentField?.frontend?.dependencies ?? []}
                          columns={[
                            {
                              field: "target",
                              headerName: "Target",
                              flex: 1,
                              editable: true,
                              sortable: false,
                              renderCell: (params) => (
                                <Tooltip title={params?.row?.target}>
                                  <span> {params?.row?.target}</span>
                                </Tooltip>
                              ),
                              renderEditCell: (props) => {
                                const { id, value, field } = props;
                                const apiRef = useGridApiContext();

                                const handleValueChange = (event) => {
                                  const newValue = event.target.value;
                                  apiRef.current.setEditCellValue({
                                    id,
                                    field,
                                    value: newValue,
                                  });
                                };

                                const option =
                                  currentField?.frontend?.dependencies?.find(
                                    (item) => item?.id == id
                                  );

                                return (
                                  <Select
                                    value={value}
                                    sx={{
                                      height: 45,
                                      padding: 0,
                                      borderRadius: 2,
                                    }}
                                    fullWidth
                                    multiple={false}
                                    className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                                    onChange={(e) => {
                                      handleValueChange(e);
                                    }}
                                  >
                                    {fields?.map((field, ind) => {
                                      if (
                                        field?.relation?.isRelation ??
                                        false
                                      ) {
                                        const fk = field?.relation?.foreignKey;
                                        let found = false;
                                        currentField?.frontend?.dependencies?.map(
                                          (dep) => {
                                            if (dep?.target == fk) {
                                              found = true;
                                            }
                                          }
                                        );
                                        if (found) return;

                                        return (
                                          <MenuItem value={fk} key={ind}>
                                            {fk}
                                          </MenuItem>
                                        );
                                      } else if (field?.backend?.db_label) {
                                        let found = false;
                                        currentField?.frontend?.dependencies?.map(
                                          (dep) => {
                                            if (
                                              dep?.target == field?.backend?.db_label
                                            ) {
                                              found = true;
                                            }
                                          }
                                        );
                                        if (found) return;
                                        return (
                                          <MenuItem
                                            value={field?.backend?.db_label}
                                            key={ind}
                                          >
                                            {field?.backend?.db_label}
                                          </MenuItem>
                                        );
                                      } 
                                    })}
                                  </Select>
                                );
                              },
                            },
                            {
                              field: "op",
                              headerName: "Operator",
                              flex: 1,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                              renderEditCell: (props) => {
                                const { id, value, field } = props;
                                const apiRef = useGridApiContext();

                                const handleValueChange = (event) => {
                                  const newValue = event.target.value;
                                  apiRef.current.setEditCellValue({
                                    id,
                                    field,
                                    value: newValue,
                                  });
                                };

                                return (
                                  <Select
                                    value={value}
                                    sx={{
                                      height: 45,
                                      padding: 0,
                                      borderRadius: 2,
                                    }}
                                    fullWidth
                                    multiple={false}
                                    className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                                    onChange={(e) => {
                                      handleValueChange(e);
                                    }}
                                  >
                                    <MenuItem value="==">Equals</MenuItem>
                                    <MenuItem value="!=">Not Equals</MenuItem>
                                    <MenuItem value="<">Less Than</MenuItem>
                                    <MenuItem value=">">Greater Than</MenuItem>
                                    <MenuItem value="<=">
                                      Less Than Or Equal To
                                    </MenuItem>
                                    <MenuItem value=">=">
                                      Greater Than Or Equal To
                                    </MenuItem>
                                  </Select>
                                );

                                // return <input type="text" value={value} onChange={handleValueChange} />;
                              },
                            },
                            {
                              field: "value",
                              headerName: "Value",
                              flex: 2,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                              renderEditCell: (props) => {
                                const { id, value, field } = props;
                                const apiRef = useGridApiContext();

                                const handleValueChange = (event) => {
                                  const newValue = event.target.value;
                                  apiRef.current.setEditCellValue({
                                    id,
                                    field,
                                    value: newValue,
                                  });
                                };

                                const option =
                                  currentField?.frontend?.dependencies?.find(
                                    (item) => item?.id == id
                                  );

                                return option?.type == "ref" ? (
                                  <Select
                                    value={value}
                                    sx={{
                                      height: 45,
                                      padding: 0,
                                      borderRadius: 2,
                                    }}
                                    fullWidth
                                    multiple={false}
                                    className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                                    onChange={(e) => {
                                      handleValueChange(e);
                                    }}
                                  >
                                    {fields?.map((field, ind) => {
                                      if (field?.backend?.db_label) {
                                        return (
                                          <MenuItem
                                            value={field?.backend?.db_label}
                                            key={ind}
                                          >
                                            {field?.backend?.db_label}
                                          </MenuItem>
                                        );
                                      }
                                    })}
                                  </Select>
                                ) : (
                                  <div
                                    className="flex justify-center items-center"
                                    style={{ backgroundColor: "red" }}
                                  >
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={handleValueChange}
                                      className="flex justify-center text-center"
                                    />
                                  </div>
                                );
                              },
                            },
                            {
                              field: "type",
                              headerName: "Type",
                              flex: 2,
                              headerAlign: "center",
                              align: "center",
                              editable: true,
                              sortable: false,
                              renderEditCell: (props) => {
                                const { id, value, field } = props;
                                const apiRef = useGridApiContext();

                                const handleValueChange = (event) => {
                                  const newValue = event.target.value;
                                  apiRef.current.setEditCellValue({
                                    id,
                                    field,
                                    value: newValue,
                                  });
                                };

                                return (
                                  <Select
                                    value={value}
                                    sx={{
                                      height: 45,
                                      padding: 0,
                                      borderRadius: 2,
                                    }}
                                    fullWidth
                                    multiple={false}
                                    className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                                    onChange={(e) => {
                                      handleValueChange(e);
                                    }}
                                  >
                                    <MenuItem value="string">String</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="ref">Reference</MenuItem>
                                  </Select>
                                );

                                // return <input type="text" value={value} onChange={handleValueChange} />;
                              },
                            },
                            {
                              field: "delete",
                              headerName: "Delete",
                              sortable: false,
                              renderCell: (params) => (
                                <IconButton
                                  onClick={() => {
                                    let options =
                                      currentField?.frontend?.dependencies?.filter(
                                        (op) => op?.id != params?.row?.id
                                      );
                                    setFieldValues({label: "dependencies", value: options});
                                  }}
                                >
                                  <MdDeleteOutline />
                                </IconButton>
                              ),
                            },
                          ]}
                          autoHeight
                          hideFooter
                          disableColumnMenu
                          disableColumnFilter
                          disableColumnSelector
                          getRowId={(row) => {
                            return row?.id;
                          }}
                          sx={{
                            mx: 2,
                            "& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator":
                              {
                                display: "none",
                              },
                          }}
                          components={{
                            NoRowsOverlay: () => (
                              <Stack
                                height="100%"
                                alignItems="center"
                                justifyContent="center"
                              >
                                No dependency added
                              </Stack>
                            ),
                            NoResultsOverlay: () => (
                              <Stack
                                height="100%"
                                alignItems="center"
                                justifyContent="center"
                              >
                                Local filter returns no result
                              </Stack>
                            ),
                          }}
                          onCellEditCommit={(params, event) => {
                            const { id, field, value } = params;
                            let options = [];
                            currentField?.frontend?.dependencies?.map(
                              (op, index) => {
                                if (op?.id == id) {
                                  options.push({ ...op, [field]: value });
                                } else {
                                  options.push(op);
                                }
                              }
                            );
                            setFieldValues({label: "dependencies", value: options})
                          }}
                        />
                      </Box>
                    </div>
                  </div>
                </Grid>
              )}
            </Grid>
          }
        </div>
    </div>
  );
};

export default FieldDetailItems;
