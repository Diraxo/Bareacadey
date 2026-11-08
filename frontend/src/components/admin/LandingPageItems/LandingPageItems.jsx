/**** import common staff ***/
import React, { useState, useEffect } from 'react';
import { BreadcrumbOverlay, TabOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { useSelector } from 'react-redux';
import LandingPageContents from './LandingPageContents/LandingPageContents';
import Services from './Services/Services';
import Faqs from './Faqs/Faqs';
import EditLandingPageContent from './LandingPageContents/EditLandingPageContent';
import {useTheme} from '@mui/material/styles';

const LandingPageItemsTab = () => {
  
  const permissions = useSelector(state=>state?.common?.permissions?.main??[]);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const theme = useTheme();

  const [options, setOptions] = useState([]);
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    landingPageContent: false,
    service: false,
    faq: false,
  });
  
  useEffect(()=>{
    let userAccessData = { add: false, edit: false, delete: false, detail: false };
    
    //landingPageContent permission check
    const foundViewLandingPageContentRoles = authPermissions?.filter(role => permissions?.landingPageContent?.view?.includes(role));
    if (foundViewLandingPageContentRoles?.length > 0) {
      userAccessData = {...userAccessData, landingPageContent: true}
    }
    
    //service permission check
    const foundViewServiceRoles = authPermissions?.filter(role => permissions?.service?.view?.includes(role));
    if (foundViewServiceRoles?.length > 0) {
      userAccessData = {...userAccessData, service: true}
    }
    
    //faq permission check
    const foundViewFaqRoles = authPermissions?.filter(role => permissions?.faq?.view?.includes(role));
    if (foundViewFaqRoles?.length > 0) {
      userAccessData = {...userAccessData, faq: true}
    }
    
    setUserAccess(()=>userAccessData);
  },[])
  
  useEffect(()=>{
    let ops = []
    
    if(userAccess?.landingPageContent) {
      ops.push({
        name: "Landing Page Contents",
        element: (<div className='shadow-2 w-full' style={{backgroundColor: theme?.palette?.background?.paper}}>
                    <EditLandingPageContent />
                  </div>)
      })
    }
    
    if(userAccess?.service) {
      ops.push({
        name: "Services",
        element: <Services />
      })
    }
    
    if(userAccess?.faq) {
      ops.push({
        name: "Faqs",
        element: <Faqs />
      })
    }
    
    setOptions(ops);
  },[userAccess])
  
  return (
    <div>
      <BreadcrumbOverlay
        title={"Landing Page Items"}
        enableClickActive={true}
        subtitle={"This is the place to see all Landing Page Items and related items" }
      />
      <div className='mt-3'></div>
      <TabOverlay
        tabs={options??[]}
        nameLabel="name"
        tabStyle={{textTransform: 'capitalize', fontSize: 14}}
        remember={true}
        rememberTag="Landing Page Items-52872"
        card={false}
      />
    </div>
  )
}

export default LandingPageItemsTab;