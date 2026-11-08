/**** import common staff ***/
import React, { useState, useEffect } from 'react';
import { BreadcrumbOverlay, TabOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { useSelector } from 'react-redux';
import Courses from './Courses/Courses';
import UserRatings from './UserRatings/UserRatings';
import CorouselItems from './CorouselItems/CorouselItems';
import Categories from './Categories/Categories';
import Payments from './Payments/Payments';
import Trendings from './Trendings/Trendings';

import {useTheme} from '@mui/material/styles';
import { PiSlideshow, PiVideo } from 'react-icons/pi';
import { BiCategory, BiSolidGraduation } from 'react-icons/bi';
import { TbSection } from 'react-icons/tb';
import ConvertToHls from './Convert/ConvertToHls';

const CoursesTab = () => {
  
  const theme = useTheme();
  
  const permissions = useSelector(state=>state?.common?.permissions?.main??[]);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const user = useSelector(state=>state?.auth?.user);
  
  const [options, setOptions] = useState([]);
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    course: false,
    userRating: false,
    corouselItem: false,
    category: false,
    payment: false,
    trending: false,
  });
  
  useEffect(()=>{
    let userAccessData = { };
    
    //course permission check
    const foundViewCourseRoles = authPermissions?.filter(role => permissions?.course?.view?.includes(role));
    if (foundViewCourseRoles?.length > 0) {
      userAccessData = {...userAccessData, course: true}
    }
    
    //userRating permission check
    const foundViewUserRatingRoles = authPermissions?.filter(role => permissions?.userRating?.view?.includes(role));
    if (foundViewUserRatingRoles?.length > 0) {
      userAccessData = {...userAccessData, userRating: true}
    }
    
    //corouselItem permission check
    const foundViewCorouselItemRoles = authPermissions?.filter(role => permissions?.corouselItem?.view?.includes(role));
    if (foundViewCorouselItemRoles?.length > 0) {
      userAccessData = {...userAccessData, corouselItem: true}
    }
    
    //category permission check
    const foundViewCategoryRoles = authPermissions?.filter(role => permissions?.category?.view?.includes(role));
    if (foundViewCategoryRoles?.length > 0) {
      userAccessData = {...userAccessData, category: true}
    }
    
    //payment permission check
    const foundViewPaymentRoles = authPermissions?.filter(role => permissions?.payment?.view?.includes(role));
    if (foundViewPaymentRoles?.length > 0) {
      userAccessData = {...userAccessData, payment: true}
    }
    
    //trending permission check
    const foundViewTrendingRoles = authPermissions?.filter(role => permissions?.trending?.view?.includes(role));
    if (foundViewTrendingRoles?.length > 0) {
      userAccessData = {...userAccessData, trending: true}
    }
    
    setUserAccess(()=>userAccessData);
  },[])
  
  useEffect(()=>{
    let ops = []
    
    if(userAccess?.course) {
      ops.push({
        name: "Courses",
        element: <Courses />,
        icon: <BiSolidGraduation />
      })
    }
    
    // if(userAccess?.userRating) {
    //   ops.push({
    //     name: "User Ratings",
    //     element: <UserRatings />,
    //   })
    // }
    
    if(userAccess?.corouselItem) {
      ops.push({
        name: "Corousel Items",
        element: <CorouselItems />,
        icon: <PiSlideshow />
      })
    }
    
    if(userAccess?.category) {
      ops.push({
        name: "Categories",
        element: <Categories />,
        icon: <BiCategory />
      })
    }
    
    // if(userAccess?.payment) {
    //   ops.push({
    //     name: "Payments",
    //     element: <Payments />,
    //   })
    // }
    
    if(userAccess?.trending) {
      ops.push({
        name: "Home Section",
        element: <Trendings />,
        icon: <TbSection />
      })
    }
    if(user?.id==1) {
      ops.push({
        name: "HLS",
        element: <ConvertToHls />,
        icon: <PiVideo />
      })
    }
    
    setOptions(ops);
  },[userAccess])
  
  return (
    <div>
      <BreadcrumbOverlay
        title={"Courses"}
        enableClickActive={true}
        subtitle={"This is the place to see all Courses and related items" }
      />
      <div className='mt-3'></div>
      <TabOverlay
        tabs={options??[]}
        nameLabel="name"
        tabStyle={{textTransform: 'capitalize', fontSize: 14}}
        remember={true}
        rememberTag="Courses-93624"
        card={false}
      />
    </div>
  )
}

export default CoursesTab;