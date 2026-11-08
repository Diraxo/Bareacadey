import React, { useEffect, useRef } from 'react';
import './App.css'
import Layout from './components/layouts/layout'

// ** Loader Import
import NProgress from 'nprogress'
import { Outlet, useLocation } from 'react-router-dom';

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

// ** Config Imports
import themeConfig from './configs/themeConfig'

// ** Component Imports
// import UserLayout from './components/layouts/UserLayout'
import ThemeComponent from './MuiTheme/theme/ThemeComponent'

// ** Contexts
import { SettingsConsumer, SettingsProvider } from './MuiTheme/context/settingsContext'

// ** Utils Imports
import { createEmotionCache } from './MuiTheme/utils/create-emotion-cache'

import { IconContext } from "react-icons";

import ShowAlert from './components/utils/Alert';
import { useSelector } from 'react-redux';

import { restoreSession } from './app/api/apiSlice';
import { useDispatch } from 'react-redux';

//date imports
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import { setOnlineUsers, setStartingLocation } from './app/slices/commonSlice';

import { useSettings } from './MuiTheme/hooks/useSettings';



const clientSideEmotionCache = createEmotionCache()


const App = ({ socket }) => {
  const { settings } = useSettings()
  const location = useLocation();
  const dispatch = useDispatch();
  const alert = useSelector((state) => state.common);

  const onlineUsersRef = useRef([]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin/main")) {
      let arr = location?.pathname.split("/");
      // let result = arr.slice(3)[0]; 

      if (location?.pathname) {
        let regex = /\/admin\/main\/([^\/]+)/;
        const locations = location.pathname.match(regex);
        if (locations?.length > 0) {
          let result = locations[0];
          if (result) {
            dispatch(
              setStartingLocation(result)
            )
          }
        }
      }
    }
  }, [])


  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.mode === 'dark');
  }, [settings.mode]);

  useEffect(() => {
    let link;
    if (settings.mode === 'light') {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/themes/mdc-light-indigo/theme.css';
      document.head.appendChild(link);
    } else if (settings.mode === 'dark') {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/themes/mdc-dark-indigo/theme.css';
      document.head.appendChild(link);
    }
    return () => {
      document.head.removeChild(link);
    };
  }, [settings.mode]);

  useEffect(() => {
    if (themeConfig.routingLoader) {
      NProgress.start();
      NProgress.done();
    }
  }, [location.pathname]);

  // const [onlineUsers, setOnlineUsers] = useState([]);
  const userId = useSelector(state => state?.auth?.user?.id)
  const permissions = useSelector(state=>state?.auth?.user?.permissions);
  

  useEffect(() => {
    if (permissions?.length <= 0 || !permissions?.includes("Chat")) return;
    let intervalId;
  
    if (userId && socket) {
      // Initial emit
      socket.emit('join', userId);
  
      // Set interval to emit 'join' event periodically
      intervalId = setInterval(() => {
        socket.emit('join', userId);
      }, 120000);
  
      // Event listener for 'onlineUsers' event
      socket.on('onlineUsers', function (data) {
        if (!arraysAreEqual(data, onlineUsersRef.current)) {
          dispatch(setOnlineUsers(data));
          onlineUsersRef.current = data;
        }
      });
  
      // Add beforeunload event listener to handle user leaving the page
      const handleBeforeUnload = () => {
        socket.emit('leave', userId);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        socket.off('onlineUsers');
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [userId, socket, dispatch]);

  

  const arraysAreEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  };



  useEffect(() => {
    restoreSession(dispatch)
  }, []);


  return (
    <CacheProvider value={clientSideEmotionCache}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SettingsProvider>
          <SettingsConsumer>
            {({ settings }) => {
              return <ThemeComponent settings={settings}>
                <IconContext.Provider value={{ size: 19, className: "icons-global-style" }}>
                  <ShowAlert
                    open={alert.openAlert}
                    severity={alert.severity}
                    message={alert.message}
                    autoHideDuration={alert.autoHideDuration}
                    horizontal={alert.horizontal}
                    vertical={alert.vertical}
                  />
                  <Layout />
                </IconContext.Provider>
              </ThemeComponent>
            }}
          </SettingsConsumer>
        </SettingsProvider>
      </LocalizationProvider>
    </CacheProvider>

  )
}

export default App
