/**** import common staff ***/
import React, { useState, useEffect } from 'react';
import { BreadcrumbOverlay, TabOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { useSelector } from 'react-redux';
import Contacts from './Contacts/Contacts';

import {useTheme} from '@mui/material/styles';

const CommunicationTab = () => {
  
  const theme = useTheme();
  
  const permissions = useSelector(state=>state?.common?.permissions?.main??[]);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  
  const [options, setOptions] = useState([]);
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    contact: false,
  });
  
  useEffect(()=>{
    let userAccessData = { add: false, edit: false, delete: false, detail: false };
    
    //contact permission check
    const foundViewContactRoles = authPermissions?.filter(role => permissions?.contact?.view?.includes(role));
    if (foundViewContactRoles?.length > 0) {
      userAccessData = {...userAccessData, contact: true}
    }
    
    setUserAccess(()=>userAccessData);
  },[])
  
  useEffect(()=>{
    let ops = []
    
    if(userAccess?.contact) {
      ops.push({
        name: "Contacts",
        element: <Contacts />,
      })
    }
    
    setOptions(ops);
  },[userAccess])
  
  return (
    <div>
      <BreadcrumbOverlay
        title={"Communication"}
        enableClickActive={true}
        subtitle={"This is the place to see all Communication and related items" }
      />
      <div className='mt-3'></div>
      <TabOverlay
        tabs={options??[]}
        nameLabel="name"
        tabStyle={{textTransform: 'capitalize', fontSize: 14}}
        remember={true}
        rememberTag="Communication-24699"
        card={false}
      />
    </div>
  )
}

export default CommunicationTab;