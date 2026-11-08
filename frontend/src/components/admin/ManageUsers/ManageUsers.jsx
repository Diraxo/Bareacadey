/**** import common staff ***/
import React, { useState, useEffect } from 'react';
import { BreadcrumbOverlay, TabOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { useSelector } from 'react-redux';
import EmployeeDocuments from './EmployeeDocuments/EmployeeDocuments';
import EmployeeDocumentTypes from './EmployeeDocumentTypes/EmployeeDocumentTypes';

import {useTheme} from '@mui/material/styles';

const ManageUsersTab = () => {
  
  const theme = useTheme();
  
  const permissions = useSelector(state=>state?.common?.permissions?.main??[]);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  
  const [options, setOptions] = useState([]);
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    employeeDocument: false,
    employeeDocumentType: false,
  });
  
  useEffect(()=>{
    let userAccessData = { add: false, edit: false, delete: false, detail: false };
    
    //employeeDocument permission check
    const foundViewEmployeeDocumentRoles = authPermissions?.filter(role => permissions?.employeeDocument?.view?.includes(role));
    if (foundViewEmployeeDocumentRoles?.length > 0) {
      userAccessData = {...userAccessData, employeeDocument: true}
    }
    
    //employeeDocumentType permission check
    const foundViewEmployeeDocumentTypeRoles = authPermissions?.filter(role => permissions?.employeeDocumentType?.view?.includes(role));
    if (foundViewEmployeeDocumentTypeRoles?.length > 0) {
      userAccessData = {...userAccessData, employeeDocumentType: true}
    }
    
    setUserAccess(()=>userAccessData);
  },[])
  
  useEffect(()=>{
    let ops = []
    
    if(userAccess?.employeeDocument) {
      ops.push({
        name: "Employee Documents",
        element: <EmployeeDocuments />,
      })
    }
    
    if(userAccess?.employeeDocumentType) {
      ops.push({
        name: "Employee Document Types",
        element: <EmployeeDocumentTypes />,
      })
    }
    
    setOptions(ops);
  },[userAccess])
  
  return (
    <div>
      <BreadcrumbOverlay
        title={"Manage Users"}
        enableClickActive={true}
        subtitle={"This is the place to see all Manage Users and related items" }
      />
      <div className='mt-3'></div>
      <TabOverlay
        tabs={options??[]}
        nameLabel="name"
        tabStyle={{textTransform: 'capitalize', fontSize: 14}}
        remember={true}
        rememberTag="Manage Users-11830"
        card={false}
      />
    </div>
  )
}

export default ManageUsersTab;