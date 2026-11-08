import React, {Suspense, useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as constants from './constants';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ErrorPage from "./ErrorPage";
import { Provider } from 'react-redux';
import {store, /* persistor */} from './app/store'
// import { PersistGate } from 'redux-persist/integration/react';
import RequireAuth from './features/auth/requireAuth'
import RequireLogOut from './features/auth/requireLogOut';
import UserLayout from './components/layouts/UserLayout';
import Roles from './components/admin/roles/roles';

import LoginPage from './components/login';
import Dashboard from './components/admin/dashboard/dashboard';
import Logout from './features/auth/Logout';

import 'primereact/resources/primereact.css';                       // core css
import 'primeflex/primeflex.css';        
import 'primeicons/primeicons.css';                                 // icons

 import './assets/primereact/styles/layout/layout.scss';
import './assets/primereact/styles/demo/Demos.scss';

import './index.scss';

import { DataProvider } from './DataContext';
import Settings from './components/admin/account/settings';
import Loader from './components/utils/Loader';
// import ProfileUpdate from './components/admin/profile/ProfileUpdate';
const ProfileUpdate = React.lazy(() => import('./components/admin/profile/ProfileUpdate'));
import Chat from './components/admin/chat/chat';
import Users from './components/admin/users/users';

import NewPageOverlay from './components/utils/CrudComponents/NewPageOverlay';
import EditPageOverlay from './components/utils/CrudComponents/EditPageOverlay';
import DetailPageOverlay from './components/utils/CrudComponents/DetailPageOverlay';

import Activities from './components/admin/activity/activities';
import Email from './components/admin/email/email';

import io from 'socket.io-client';
import LandingPageItemsTab from './components/admin/LandingPageItems/LandingPageItems';

import ChildOnePageOverlay from './components/utils/CrudComponents/ChildOnePageOverlay';
import ChildTwoPageOverlay from './components/utils/CrudComponents/ChildTwoPageOverlay';
import ChildThreePageOverlay from './components/utils/CrudComponents/ChildThreePageOverlay';
import ChildFourPageOverlay from './components/utils/CrudComponents/ChildFourPageOverlay';
import ChildFivePageOverlay from './components/utils/CrudComponents/ChildFivePageOverlay';

import ChildOneDetailPageOverlay from './components/utils/CrudComponents/ChildOnePageDetailOverlay';
import ChildTwoDetailPageOverlay from './components/utils/CrudComponents/ChildTwoPageDetailOverlay';
import ChildThreeDetailPageOverlay from './components/utils/CrudComponents/ChildThreePageDetailOverlay';
import ChildFourDetailPageOverlay from './components/utils/CrudComponents/ChildFourPageDetailOverlay';
import ChildFiveDetailPageOverlay from './components/utils/CrudComponents/ChildFivePageDetailOverlay';
import Contacts from './components/admin/Communication/Contacts/Contacts';
import ResetPasswordPage from './components/login/ResetPassword';
import MyTasksMain from './components/admin/Misc/MyTasks/MyTasksMain';
import DeviceVerifiedPage from './components/login/DeviceVerified';
import EmailVerifiedPage from './components/login/EmailVerified';
import NewDashboard from './components/admin/dashboard/NewDashboard';
import ELearn from './components/landing_page/templates/e-learning';
import ELearningLandingPage from './components/landing_page/templates/ecommerce/ELearning';
import RegisterPage from './components/login/Register';
import CoursesTab from './components/admin/Courses/Courses';
import ChaptersList from './components/landing_page/templates/ecommerce/ChaptersList';

const socket = io.connect(import.meta.env.VITE_API_URL);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App socket={socket}/>,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <ELearningLandingPage/>
      },
      {
        path: "courses/chapters",
        element: <ChaptersList />
      },
      {
        path: "e-learning",
        element: <ELearn/>
      },
      {
        path: "ecommerce",
        element: <ELearningLandingPage />
      },
      {
        path: "profile_update",
        element: <Suspense fallback={
        <Loader />
        }><ProfileUpdate /></Suspense>
      },
      {
        path: "logout",
        element: <Logout socket={socket}/>
      },
      {
        element: <RequireLogOut/>,
        children: [
          {
            path: "auth/login",
            element: <LoginPage />
          },
          {
            path: "auth/register",
            element: <RegisterPage />
          },
          {
            path: "auth/reset",
            element: <ResetPasswordPage />
          },
          {
            path: "auth/device_verified",
            element: <DeviceVerifiedPage />
          },
          {
            path: "auth/verify_email",
            element: <EmailVerifiedPage />
          },
          //continue with registration page when done
        ]
      },
      {
        element: <RequireAuth/>,
        path: "admin",
        children: [
          {
            path: "",
            element: <Navigate to="main" replace />
          },
          {
            path: "main",
            element: <UserLayout/>,
            children: [
              {
                 path: "",
                 element: <NewDashboard/>
                //  element: <Users/>
              },
              {
                path: "users",
                element: <Users/>
              },
              {
                path: "roles",
                element: <Roles/>
              },
              //main system
              {
                path: "courses",
                element: <CoursesTab />
              },
              {
                path: "contact-us",
                element: <Contacts />
              },
              {
                path: "landing_page_customization",
                element: <LandingPageItemsTab />
              },
             
              //end of main system
              {
                path: "chat",
                element: <Chat socket={socket} />
              },
              {
                path: "email",
                element: <Email/>
              },
              {
                path: "activities",
                element: <Activities/>
              },
              {
                path: "mytasks",
                element: <MyTasksMain/>
              },
              {
                path: "settings",
                element: <Settings/>
              },
              {
                path: "profile_update",
                element: <Suspense fallback={
                <Loader />
                }><ProfileUpdate /></Suspense>
              },

              //child one route
              {
                path: ":model/l/:model",
                element: <ChildOnePageOverlay />
              },
              {
                path: ":model/l/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/l/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/l/:model/detail",
                element: <ChildOneDetailPageOverlay />
              },
              {
                path: ":model/l/:model/detail/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail",
                element: <ChildOneDetailPageOverlay />
              },
              {
                path: ":model/detail/edit",
                element: <EditPageOverlay />
              },

              //child two route
              {
                path: ":model/l/:model/detail/:model",
                element: <ChildTwoPageOverlay />
              },
              {
                path: ":model/detail/:model",
                element: <ChildTwoPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail",
                element: <ChildTwoDetailPageOverlay />
              },
              {
                path: ":model/detail/:model/detail",
                element: <ChildTwoDetailPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },

              //child three route
              {
                path: ":model/l/:model/detail/:model/detail/:model",
                element: <ChildThreePageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model",
                element: <ChildThreePageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail",
                element: <ChildThreeDetailPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail",
                element: <ChildThreeDetailPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },

              //child four route
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model",
                element: <ChildFourPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model",
                element: <ChildFourPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail",
                element: <ChildFourDetailPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail",
                element: <ChildFourDetailPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },

              //child five route
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/:model",
                element: <ChildFivePageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/:model",
                element: <ChildFivePageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/:model/new",
                element: <NewPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/:model/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/:model/detail",
                element: <ChildFiveDetailPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/:model/detail",
                element: <ChildFiveDetailPageOverlay />
              },
              {
                path: ":model/l/:model/detail/:model/detail/:model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },
              {
                path: ":model/detail/:model/detail/:model/detail/:model/detail/:model/detail/edit",
                element: <EditPageOverlay />
              },

              {
                path: "new",
                element: <NewPageOverlay />
              },
            ]
          },
          {
            path: "logout",
            element: <Logout socket={socket}/>
          }
        ]
      }
    ]
  }
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <PersistGate persistor={persistor}> */}
       <DataProvider>
          <RouterProvider router={router}/>
       </DataProvider>
      {/* </PersistGate> */}
    </Provider>
  </React.StrictMode>
)
