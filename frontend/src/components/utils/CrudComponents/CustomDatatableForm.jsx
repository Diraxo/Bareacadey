import React, { useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, Checkbox, IconButton } from "@mui/material";
import { MdAdd, MdDeleteOutline } from "react-icons/md";
import { InputText } from "primereact/inputtext";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Dropdown } from "primereact/dropdown";

import { BsFillPatchCheckFill } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { useSelector } from "react-redux";

const CustomDatatableForm = ({
  columns,
  formData,
  setFormData,
  name,
  label,
  labelStyle = {},
  roleNo=false
}) => {
  const selectedCurrency = useSelector((state) => state.common.currency);
  const confirm = (event, id) => {
    confirmPopup({
      target: event.currentTarget,
      message: "Do you want to delete this record?",
      icon: "pi pi-info-circle",
      acceptClassName: "p-button-danger",
      accept: () => accept(id),
    });
  };

  const accept = (id) => {
    let _items = [...formData?.[name]?.value];
    _items = _items?.filter((item) => item?.id != id);
    setFormData((prev) => ({
      ...formData,
      [name]: { ...formData?.[name], value: _items },
    }));
  };

  const onRowEditComplete = (e) => {
    let _items = [...formData?.[name]?.value];
    let { newData, index } = e;
    _items[index] = newData;
    setFormData({
      ...formData,
      [name]: { ...formData?.[name], value: _items },
    });
  };

  const textEditor = (options) => {
    if(options.rowData?.disableEdit) {
      return options.rowData[options.field];
    }
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
      />
    );
  };

  const numberEditor = (options) => {
    if(options.rowData?.disableEdit) {
      return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
    }
    return (
      <InputNumber
        value={options.value}
        onChange={(e) => {
          options.editorCallback(e.value);
        }}
      />
    );
  };

  const currencyEditor = (options) => {
    if(options.rowData?.disableEdit) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits:  2,
        maximumFractionDigits: 2,
      }).format(options.rowData[options.field])
    }
    return (
      <InputNumber
        value={options.value}
        onChange={(e) => {
          options.editorCallback(e.value);
        }}
        mode="currency"
        currency={selectedCurrency}
        locale="en-US"
      />
    );
  };

  const table = useRef();

  const format_date_time = (value) => {
    return value.toLocaleTimeString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const date_time_editor = (options) => {
    if(options.rowData?.disableEdit) {
      return format_date_time(options.rowData[options.field] ? new Date(options.rowData[options.field]) : new Date());
    }
    return (
      <Calendar
        value={options?.value ? (new Date(options?.value)) : new Date()}
        onChange={(e) => {
          options.editorCallback(e.value);
        }}
        showTime
        hourFormat="12"
      />
    );

    // return format_date_time(options.rowData[options.field]);
  };

  const format_date = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const date_editor = (options) => {
    if(options.rowData?.disableEdit) {
      return format_date(options.rowData[options.field] ? new Date(options.rowData[options.field]) : new Date());
    }
    return (
      <Calendar
        value={new Date(options.value)}
        onChange={(e) => {
          options.editorCallback(e.value);
        }}
      />
    );

    // return format_date(options.rowData[options.field]);
  };

  const select_editor = (options, items, title = "Item", label) => {
    if(options.rowData?.disableEdit) {
      return options.rowData[options.field];
    }
    return (
      <Dropdown
        value={options.value}
        options={items}
        optionLabel={"header"}
        optionValue={"label"}
        onChange={(e) => options.editorCallback(e?.value)}
        placeholder={"Select " + title}
        // itemTemplate={(option) => {
        //     return <p>{option?.[label]}</p>;
        // }}
      />
    );
  };

  const verifiedBodyTemplate = (rowData, nameLabel) => {
    return (
      <div className="flex justify-start pl-3">
        {rowData[nameLabel] ? (
          <BsFillPatchCheckFill size={20} color="#2b91f7" />
        ) : (
          <AiOutlineCloseCircle size={20} color="#ed4e84" />
        )}
      </div>
    );
  };

  const checkbox_editor = (options) => {
    if(options.rowData?.disableEdit) {
      return (
        <div className="flex justify-center">
          {options.rowData[options.field] ? (
            <BsFillPatchCheckFill size={20} color="#2b91f7" />
          ) : (
            <AiOutlineCloseCircle size={20} color="#ed4e84" />
          )}
        </div>
      );
    }
    return (
      <div className="flex justify-left pl-2">
        <Checkbox
          onChange={(e) => options.editorCallback(e.target.checked)}
          checked={options.value ?? false}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="text-md mb-1" style={{ ...labelStyle }}>
        <p className="text-[#58545f] dark:text-[#cfcbe4]">{label}</p>
      </div>

      <div className="shadow-1 border p-1 rounded-md">
        <ConfirmPopup />
        <DataTable
          ref={table}
          paginator={false}
          value={formData?.[name]?.value}
          editMode="row"
          dataKey="id"
          onRowEditComplete={onRowEditComplete}
          emptyMessage={
            <div className="flex justify-center items-center my-3">
              No Record
            </div>
          }
        >
          {(roleNo==true) && <Column
                        key={"col-0"}
                        field={"no"}
                        header={"No"}
                        body={(rowData) => {
                          let no = 1;
                          formData?.[name]?.value?.map((dt, index)=>{
                            if(dt?.id == rowData?.id) {
                              no = index + 1;
                            }
                          })
                          
                            return new Intl.NumberFormat("en-US", {
                              style: "decimal",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(no);
                          
                        }}
                      />}
          
          {columns.map((column, index) => {
            switch (column.type) {
              case "text":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      editor={(options) => textEditor(options)}
                      body={(rowData) => {
                        if (rowData?.[column?.field]) {
                          return rowData?.[column?.field];
                        } else {
                          return <p className="w-full ml-4">-</p>;
                        }
                      }}
                    />
                  );
                }
                
              case "select":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      editor={(options) =>
                        select_editor(
                          options,
                          column?.options,
                          column?.header,
                          column?.field
                        )
                      }
                      body={(rowData) => {
                        let header = "";
                        column?.options?.map((op) => {
                          if (op?.label == rowData[column?.field]) {
                            header = op?.header;
                          }
                        });
                        return <p>{header}</p>;
                      }}

                      // body={(props) => column.body ? column.body(props) :  statusBodyTemplate(props, column.field, column.options??[], column.nameLabel??"name", column.valueLabel??"value", column?.colorLabel??"color", column.sx)}
                    />
                  );
                }
                
              case "checkbox":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      editor={(options) => checkbox_editor(options)}
                      body={(rowData) =>
                        verifiedBodyTemplate(rowData, column?.field)
                      }

                      // body={(props) => column.body ? column.body(props) :  statusBodyTemplate(props, column.field, column.options??[], column.nameLabel??"name", column.valueLabel??"value", column?.colorLabel??"color", column.sx)}
                    />
                  );
                }
                
              case "datetime":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      body={(props) =>
                        column?.body
                          ? column.body(props)
                          : props[column?.field] ? 
                          format_date_time(
                              props[column?.field]
                                ? new Date(props[column?.field])
                                : new Date()
                            ) : ""
                      }
                      editor={(options) => date_time_editor(options)}
                    />
                  );
                }
                
              case "date":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      body={(props) => 
                        column?.body
                          ? column.body(props)
                          : props[column?.field] ? 
                          format_date(
                              props[column?.field]
                                ? new Date(props[column?.field])
                                : new Date()
                            ) : ""
                      }
                      editor={(options) => date_editor(options)}
                    />
                  );
                }
                
              case "number":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      editor={(options) => numberEditor(options)}
                      body={(rowData) => {
                        if (
                          rowData?.[column?.field] ||
                          rowData?.[column?.field] == 0
                        ) {
                          return new Intl.NumberFormat("en-US", {
                            style: "decimal",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4,
                          }).format(rowData[column?.field]);
                        } else {
                          return <p className="w-full ml-4">-</p>;
                        }
                      }}
                    />
                  );
                }
                
              case "currency":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      editor={(options) => currencyEditor(options)}
                      body={(rowData) => {
                        if (
                          rowData?.[column?.field] ||
                          rowData?.[column?.field] == 0
                        ) {
                          return new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: selectedCurrency,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(rowData[column?.field]);
                        } else {
                          return <p className="w-full ml-4">-</p>;
                        }
                      }}
                    />
                  );
                }
                
              case "custom":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      dataType={column.dataType}
                      body={column.body}
                      editor={column.editor}
                      onRowEditComplete={onRowEditComplete}
                    />
                  );
                }
                
            }
          })}
          <Column rowEditor style={{ textAlign: "right" }} ></Column>
          <Column
            body={(rowData) => (
              !rowData?.disableDelete ? ( 
              <IconButton
                sx={{
                  mt: -1,
                  ml: -1,
                  p: 0,
                }}
                onClick={(e) => {
                  let id = rowData?.id ? rowData?.id : 0;
                  confirm(e, id);
                }}
              >
                <MdDeleteOutline size={20} />
              </IconButton> 
             ) : <></>
            )}
            style={{
              width: 50,
            }}
          />
        </DataTable>
        <Button
          variant="outlined"
          size="small"
          sx={{
            m: 3,
            ml: 1,
          }}
          startIcon={
            <MdAdd size={20} style={{ marginRight: -3, marginTop: 1 }} />
          }
          onClick={() => {
            let id = 0;
            let _items = [...formData?.[name]?.value];
            _items?.map((item) => {
              if (item?.id > id) {
                id = item?.id;
              }
            });
            id = id + 1;
            setFormData({
              ...formData,
              [name]: {
                ...formData?.[name],
                value: [...formData?.[name]?.value, { id: id }],
              },
            });
          }}
        >
          Add Record
        </Button>
      </div>
    </div>
  );
};

export const CustomTableViewer = ({
  columns,
  data,
  label,
  labelStyle = {},
  headerBackgroundColor,
  roleNo=false,
}) => {
  const table = useRef();
  const selectedCurrency = useSelector((state) => state.common.currency);
  const format_date_time = (value) => {
    return value.toLocaleTimeString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const format_date = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const verifiedBodyTemplate = (rowData, nameLabel) => {
    return (
      <div className="flex justify-start pl-3">
        {rowData[nameLabel] ? (
          <BsFillPatchCheckFill size={20} color="#2b91f7" />
        ) : (
          <AiOutlineCloseCircle size={20} color="#ed4e84" />
        )}
      </div>
    );
  };

  return data?.length <= 0 ? (
    <p>-</p>
  ) : (
    <div>
      {/* <div className="text-md mb-1" style={{...labelStyle}}>
      <p className="text-[#58545f] dark:text-[#cfcbe4]">{label}</p>
    </div> */}

      <div className="shadow- border p-1 rounded-md">
        <ConfirmPopup />
        <DataTable
          ref={table}
          paginator={false}
          value={data}
          editMode="row"
          dataKey="id"
          emptyMessage={
            <div className="flex justify-center items-center my-3">
              No Record
            </div>
          }
        >
          {(roleNo==true) && <Column
                        key={"col-0"}
                        field={"no"}
                        header={"No"}
                        body={(rowData) => {
                          let no = 1;
                          data?.map((dt, index)=>{
                            if(dt?.id == rowData?.id) {
                              no = index + 1;
                            }
                          })

                            return new Intl.NumberFormat("en-US", {
                              style: "decimal",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(no);
                          
                        }}
                      />}
          {columns.map((column, index) => {
            switch (column.type) {
              case "text":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      style={{ minWidth: 70 }}
                      body={(rowData) => {
                        if (rowData?.[column?.field]) {
                          return rowData?.[column?.field];
                        } else {
                          return <p className="w-full ml-4">-</p>;
                        }
                      }}
                    />
                  );
                }
                
              case "select":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      style={{ minWidth: 70 }}
                      body={(rowData) => {
                        let header = "";
                        column?.options?.map((op) => {
                          if (op?.label == rowData[column?.field]) {
                            header = op?.header;
                          }
                        });
                        return <p>{header}</p>;
                      }}

                      // body={(props) => column.body ? column.body(props) :  statusBodyTemplate(props, column.field, column.options??[], column.nameLabel??"name", column.valueLabel??"value", column?.colorLabel??"color", column.sx)}
                    />
                  );
                }
                
              case "checkbox":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      style={{ minWidth: 70 }}
                      body={(rowData) =>
                        verifiedBodyTemplate(rowData, column?.field)
                      }

                      // body={(props) => column.body ? column.body(props) :  statusBodyTemplate(props, column.field, column.options??[], column.nameLabel??"name", column.valueLabel??"value", column?.colorLabel??"color", column.sx)}
                    />
                  );
                }
                
              case "datetime":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      style={{ minWidth: 70 }}
                      body={(props) =>
                        column?.body
                          ? column.body(props)
                          : props[column?.field] ? 
                          format_date_time(
                              props[column?.field]
                                ? new Date(props[column?.field])
                                : new Date()
                            ) : ""
                      }
                    />
                  );
                }
                
              case "date":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      style={{ minWidth: 70 }}
                      body={(props) => 
                        column?.body
                          ? column.body(props)
                          : props[column?.field] ? 
                          format_date(
                              props[column?.field]
                                ? new Date(props[column?.field])
                                : new Date()
                            ) : ""
                      }
                    />
                  );
                }
                
                case "number":
                  {
                    return (
                      <Column
                        key={"col-" + index}
                        field={column.field}
                        header={column.header}
                        body={(rowData) => {
                          if (
                            rowData?.[column?.field] ||
                            rowData?.[column?.field] == 0
                          ) {
                            return new Intl.NumberFormat("en-US", {
                              style: "decimal",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 4,
                            }).format(rowData[column?.field]);
                          } else {
                            return <p className="w-full ml-4">-</p>;
                          }
                        }}
                      />
                    );
                  }
                  
                case "currency":
                  {
                    return (
                      <Column
                        key={"col-" + index}
                        field={column.field}
                        header={column.header}
                        body={(rowData) => {
                          if (
                            rowData?.[column?.field] ||
                            rowData?.[column?.field] == 0
                          ) {
                            return new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: selectedCurrency,
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(rowData[column?.field]);
                          } else {
                            return <p className="w-full ml-4">-</p>;
                          }
                        }}
                      />
                    );
                  }
                  
              case "custom":
                {
                  return (
                    <Column
                      key={"col-" + index}
                      field={column.field}
                      header={column.header}
                      dataType={column.dataType}
                      body={column.body}
                    />
                  );
                }
                
            }
          })}
        </DataTable>
      </div>
    </div>
  );
};

export default CustomDatatableForm;
