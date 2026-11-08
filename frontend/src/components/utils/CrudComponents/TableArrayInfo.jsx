import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import {BsFillPatchCheckFill} from 'react-icons/bs';
import {AiOutlineCloseCircle} from 'react-icons/ai';
import { Chip } from "@mui/material";

const TableArrayInfo = ({ dialogVisible, setDialogVisible, data }) => {
  const dialogFooterTemplate = () => {
    return (
      <Button
        label="Ok"
        icon="pi pi-check"
        style={{ minWidth: 70, marginBottom: 10 }}
        onClick={() => setDialogVisible({ show: false, data: [] })}
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

  function isValidDate(str) {
    if(!isNaN(str)) return;
    var date = new Date(str);
    return !isNaN(date.getTime());
  }

  const format_date = (value) => {
    return new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const statusBodyTemplate = (rowData, nameLabel) => {
    let value = rowData[nameLabel];
    let backgroundColor = "";
    if(value=="Yes") {
        backgroundColor = 'green';
    }
    else if(value == "No") {
        backgroundColor = 'red';
    }
    else if(value == 'Partial') {
        backgroundColor = "orange";
    }
    return  (
      <span  className={`customer-badge`}>
          <Chip
              sx={{
                height: 25,
                borderRadius: 1,
                color: backgroundColor ? 'white' : '',
                backgroundColor: backgroundColor,
              }}
              label={value}
          />
       </span>
    );
  }

  return (
    <div className="">
      {data?.map((dt, index) => {
        let columns = [];
        if (dt?.data?.length > 0) {
          let keys = dt?.data[0] ?? {};
          Object.keys(keys).map((key) => {
            if (key) {
              columns.push(key);
            }
          });
        }
        return (
          <Dialog
            key={index}
            header={dt?.title}
            visible={dialogVisible}
            style={{ width: "75vw" }}
            maximizable
            modal
            baseZIndex={-0.9}
            contentStyle={{ padding: "20px 40px" }}
            onHide={() => setDialogVisible(false)}
            footer={dialogFooterTemplate}
          >
            <DataTable
              value={dt?.data ?? []}
              scrollable
              scrollHeight="flex"
              tableStyle={{ minWidth: "50rem" }}
            >
              {columns.map((col, ind) => {
                return (
                  <Column
                    field={col}
                    key={ind}
                    header={col
                      ?.split("_")
                      .map((word) => word[0].toUpperCase() + word.slice(1))
                      .join(" ")}
                    body= {(rowData)=>{
                    let value = rowData[col]
                    if(value == true || value == false) {
                        return verifiedBodyTemplate(rowData, col)
                    }
                    else if(isValidDate(value)) {
                        return format_date(value)
                    }
                    else if(value== "Yes" || value == "No" || value == "Partial") {
                        return statusBodyTemplate(rowData, col)
                    }
                        return (
                        <div className="w-full">{value != null ? value.toString() : <span className="pl-1">-</span>}</div>
                        )
                    }}
                  />
                );
              })}
            </DataTable>
          </Dialog>
        );
      })}
    </div>
  );
};

export default TableArrayInfo;
