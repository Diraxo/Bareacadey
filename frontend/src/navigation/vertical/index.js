// ** Icon imports
import {HiOutlineMail, HiOutlineLogout} from 'react-icons/hi';
import {BiChat, BiCategory, BiSolidVideos} from 'react-icons/bi';
import {IoHomeOutline, IoCallOutline, IoSettingsOutline} from 'react-icons/io5'
import { MdOutlinePeople, MdHistory, MdEventAvailable, MdOutlineEditNote} from 'react-icons/md';
import {RiDragDropLine} from 'react-icons/ri';
import {FaRegUser, FaUserGraduate} from 'react-icons/fa6';
import {MdOutlineQuiz, MdOutlineSupervisorAccount} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { QUIZ_FEATURE_VISIBLE } from '../../configs/features';

const navigation = () => {
  const permissions = useSelector(state=>state.common.permissions)
  const items = [
    {
      title: 'Dashboard',
      icon: IoHomeOutline,
      path: '/admin/main',
    },
    {
      sectionTitle: "Manage Users",
      permissions: [...permissions.user.view,...permissions.role.view]
    },
    {
      title: 'Users',
      icon: MdOutlinePeople,
      path: '/admin/main/users',
      permissions: [...permissions.user.view]
    },
    {
      title: 'Roles',
      icon: BiCategory,
      path: '/admin/main/roles',
      permissions: [...permissions.role.view]

    },
    // {
    //   title: 'Documents',
    //   icon: AiOutlineFile,
    //   path: '/admin/main/employee_documents',
    //   permissions: [...permissions?.main?.employeeDocument?.view, ...permissions?.main?.employeeDocumentType?.view,]

    // },
    // {
    //   title: 'Employee Settings',
    //   icon: BsPersonGear,
    //   path: '/admin/main/employee_settings',
    //   permissions: [...permissions?.main?.employeeCategory?.view, ...permissions?.main?.employeePosition?.view, ...permissions?.main?.department?.view]

    // },
    {
      sectionTitle: "Main System",
      permissions: [...permissions?.main?.course?.view??[]]
    },
    {
      title: 'Courses',
      icon: BiSolidVideos,
      path: '/admin/main/courses',
      openInNewTab: false,
      permissions: [...permissions?.main?.course?.view??[]]
    },
    {
      title: 'Quizzes',
      icon: MdOutlineQuiz,
      path: '/admin/main/quizzes',
      openInNewTab: false,
      permissions: ["Instructor"]
    },
    {
      title: 'Instructors & Devices',
      icon: MdOutlineSupervisorAccount,
      path: '/admin/main/instructors',
      openInNewTab: false,
      permissions: [...permissions?.user?.edit??[]]
    },
    {
      sectionTitle: 'Communication',
      permissions: [...permissions?.common?.email??[], ...permissions?.common?.chat??[], ...permissions?.common?.contactUs??[]]
    },
    // {
    //   title: 'Email',
    //   icon: HiOutlineMail,
    //   path: '/admin/main/email',
    //   openInNewTab: false,
    //   permissions: [...permissions?.common?.email??[]]
    // },
    {
      title: 'Chat',
      icon: BiChat,
      path: '/admin/main/chat',
      openInNewTab: false,
      permissions: [...permissions?.common?.chat??[]]
    },
    {
      title: 'Contact Us',
      icon: IoCallOutline,
      path: '/admin/main/contact-us',
      permissions: [...permissions?.common?.contactUs??[]]
    },
    // {
    //   sectionTitle: 'Customizations'
    // },
    
    {
      sectionTitle: 'Customizations'
    },
    {
      title: 'Settings',
      icon: IoSettingsOutline,
      path: '/admin/main/settings',
      permissions: [...permissions?.user?.view??[]]
    },
    {
      title: 'Profile Update',
      path: '/admin/main/profile_update',
      icon: FaRegUser,
    },
    {
      title: 'Landing Page',
      icon: RiDragDropLine,
      path: '/admin/main/landing_page_customization',
      permissions: [...permissions?.main?.landingPageContent?.view??[], ...permissions?.main?.service?.view??[]]
    },
    {
      sectionTitle: 'Miscellaneous'
    },
    {
      title: 'My Tasks',
      icon: MdEventAvailable,
      path: '/admin/main/mytasks',
      permissions: [...permissions?.common?.myTask??[]]
    },
    {
      title: 'Activities',
      icon: MdHistory,
      path: '/admin/main/activities',
      permissions: [...permissions?.common?.activities??[]]
    },
    // {
    //   title: 'Cloud Files',
    //   icon: AiOutlineCloudUpload,
    //   path: '/admin/main/cloud',
    //   permissions: [...permissions?.common?.cloud??[]]
    // },
    {
      title: 'Log Out',
      icon: HiOutlineLogout,
      path: '/admin/logout'
    },
  ]
  return items.filter(item => QUIZ_FEATURE_VISIBLE || item.path !== '/admin/main/quizzes')
}

export default navigation
