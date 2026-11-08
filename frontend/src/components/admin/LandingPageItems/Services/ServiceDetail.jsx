import React,{useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@mui/material';

const ServiceDetail = ({ columns, data }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const groups = [
    {
      id: 2,
      name: "Service Information",
    },
    {
      id: 3,
      name: "Images",
    },
    {
      id: "userinfo",
      name: "Record Information",
    }
  ];
  
  return (
    <div className="mt-4 mx-2">
      {groups?.map((group, groupIndex) => {
        return (
          <div className="mb-6" key={"group"+groupIndex}>
            <p
              className="border-b-2 pb-3"
              style={{ fontSize: 23, marginBottom: 20, fontWeight: 700 }}
            >
             {group?.name}
           </p>
           <div className="mt-5">
             <table>
               <tbody>
                 {columns?.map((column, columnIndex) => {
                   if(column?.group != group?.id) return;
                   return (
                     <tr key={"column"+columnIndex}>
                       <td style={{ paddingBottom: 20 }}>
                         <p className="text-[16px]">{column?.header}</p>
                       </td>
                       <td width="30px"></td>
                       <td style={{ paddingBottom: 20 }}>
                         <div
                           className=""
                           style={{ fontSize: 16, fontWeight: 500, minWidth: 130 }}
                         >
                           {column?.body ? (column.body(data)??" - ") : Object?.keys(data)?.map((key, index)=> {
                             if(key == column?.field) {
                               let user = []; 
                               if(column.group == "userinfo" && (column?.header == "Added By" || column?.header == "Updated By")) {
                                 if (column?.header == "Added By") {
                                   user = column?.options?.addedByFilterOptions;
                                 } else {
                                   user = column?.options?.updatedByFilterOptions;
                                 }
                                 if (user) {
                                   return (
                                     user[0]?.name ? (
                                       <div className="flex justify-start items-center" key={"user"+index}>
                                         <Avatar
                                           src={user[0]?.url}
                                           sx={{ width: 28, height: 28 }}
                                         >
                                           {!user[0]?.url ? user[0]?.name[0] : ""}
                                         </Avatar>
                                         <span
                                           style={{
                                             marginLeft: ".5em",
                                             verticalAlign: "middle",
                                           }}
                                         >
                                           {user[0]?.name ?? " - "}
                                         </span>
                                       </div>
                                     ) : " - "
                                   )
                                 }
                               }
                               return column?.body ? column?.body(data) : data[key] ? data[key].toString() : " - ";
                             }
                           })}
                         </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         </div>
       );
     })}
   </div>
 )
}

export default ServiceDetail;