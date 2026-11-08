import {RxDashboard} from 'react-icons/rx';
import {AiOutlineDashboard} from 'react-icons/ai';
import {SlOrganization} from 'react-icons/sl';
import {FaRegUser} from 'react-icons/fa';
import {BsTruck} from 'react-icons/bs';
import {FiTruck} from 'react-icons/fi';
    

export const SidebarData = [
   {
       id: '1',
       name: "Overview",
       link: '/',
       icon: <RxDashboard />,
       items: [
        {
            id: '1>1',
            name: "Dashboard",
            link: '/',
            icon: <AiOutlineDashboard />,
            type: 0
        },
    ]
   },
   {
        id: '2',
        name: "Organization",
        link: '/organization',
        icon: <SlOrganization />,
        items: [ 
            {
                id: '2>1',
                name: "Users",
                link: '/users',
                icon: <FaRegUser />,
                type: 0,
            },
            {
                id: '2>2',
                name: "Vehicles",
                link: '/vehicles',
                icon: <BsTruck />,
                type: 1,
                items: [
                    {
                        id: '2>2>1',
                        name: "View Vehicles",
                        link: "/vehicles",
                        icon: <FiTruck />
                    }
                ]
            }
        ]
    },

];