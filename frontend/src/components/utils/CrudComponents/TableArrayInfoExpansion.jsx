import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import { motion } from 'framer-motion';
import {BsFillPatchCheckFill} from 'react-icons/bs';
import {AiOutlineCloseCircle} from 'react-icons/ai';
import { Chip } from '@mui/material';

export const TableArrayInfoExpansion = (data, theme, listViewSpacing=10, listViewToggle=true) => {

    
    const rowClass = (data) => {
        return {
            'card': listViewToggle ? true : false,
            'drop-shadow-sm': listViewToggle ? true : false,
        };
    };

    const verifiedBodyTemplate = (rowData, nameLabel) => {
        return (
          <div className="flex justify-left pl-3">
             {rowData[nameLabel] ? <BsFillPatchCheckFill size={20} color="#2b91f7"/> : <AiOutlineCloseCircle size={20} color="#ed4e84"/>}
          </div>
        );
    };

    function isValidDate (str) {
        if(!isNaN(str)) return;
        var date = new Date (str);
        return !isNaN (date.getTime ());
    }
    

    const format_date = (value) => {
        return new Date(value).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
    }

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
        <motion.div
          initial={{
            scaleX: 0,
            scaleY: 0.4
          }}
          animate={{
            scaleX: 1,
            scaleY: 1
          }}
          transition={{
            duration: 0.3
          }}
        >
        <div className="ml-3 my-2 border-l-4 border-t border-b border-r rounded-md  flex" style={{borderLeftColor: theme.palette.primary.main}}>
            {/* <div
              style={{
                width: 60,
                backgroundColor: 'red',
                border: '2px 4px 5px 20px'
              }}
            /> */}
            {
                data?.map((dt, index)=>{
                    let columns = []
                    if(dt?.data?.length > 0) {
                        let keys = dt?.data[0]??{};
                        Object.keys(keys).map((key) => {
                          if(key) {
                            columns.push(key)
                          }
                       })
                    }
                    return (
                        <div className='' key={index}>
                            {/* <h3 style={{fontSize: 15, marginBottom: 10}}>{dt?.title}</h3> */}
                            <DataTable 
                               value={dt?.data??[]} 
                              // scrollable 
                               //showGridlines={false}
                               size="large"
                              // alwaysShowPaginator={false} 
                              // stripedRows={true}
                               scrollHeight="flex" 
                               tableStyle={{ 
                                //  minWidth: '50rem',
                                 width: '100%',
                                 borderCollapse: 'separate',
                                 borderSpacing: `0px ${listViewSpacing}px`,
                                 paddingLeft: 4,
                                 paddingRight: 4,
                               }}
                               cellClassName="border-none"
                               rowClassName={rowClass}
                            >
                                {
                                    columns.map((col, ind)=>{
                                        return (
                                            <Column 
                                               field={col}
                                               key={ind} 
                                                
                                               //headerClassName="hidden"
                                               headerClassName="border-none"
                                               style={{ minWidth: "11rem" }}
                                               header={col?.split("_").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")} 
                                               body= {(rowData)=>{
                                                let value = rowData[col]
                                                if(value != null && (value == true || value.toString() == 'false')) {
                                                    return verifiedBodyTemplate(rowData, col)
                                                }
                                                else if(isValidDate(value)) {
                                                    return format_date(value)
                                                }
                                                else if(value== "Yes" || value == "No" || value == "Partial") {
                                                    return statusBodyTemplate(rowData, col)
                                                }
                                                 return (
                                                    <div>{value != null ? value.toString() : ' - '}</div>
                                                 )
                                               }}
                                            />
                                        )
                                    })
                                }
                            </DataTable>
                        </div>
                    )
                })
            }
            
        </div>
        </motion.div>
    );
}

// export default TableArrayInfoExpansion;