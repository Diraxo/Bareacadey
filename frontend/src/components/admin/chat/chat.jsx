// components/Notifications.js

import { Card, Grid } from '@mui/material';
import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatUI from './ChatUI';
import SelectChat from './SelectChat';
import {useTheme} from '@mui/material/styles'
import { useSettings } from '../../../MuiTheme/hooks/useSettings';
import useMediaQuery from '@mui/material/useMediaQuery';
import {motion} from 'framer-motion';
import { useSelector } from 'react-redux';

const Chat = ({socket}) => {
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down('md'));

  const onlineUsers = useSelector(state=>state?.common?.onlineUsers)
  const [selectedChat, setSelectedChat] = useState({
    id: 0,
    name: "",
    url: "",
    role: ""
  });
  const [menu, setMenu] = useState(false);
  const {settings} = useSettings();

  useEffect(()=>{
    if(md) {
      setMenu(false)
    }
    else {
      setMenu(true)
    }
  },[md])

  return (
    <div className='flex' style={{backgroundColor: '#f7f7f7', minHeight: '90vh'}}>
      <motion.div
        animate={{
          width: menu ? '' : 0,
          //display: menu ? "" : "none"
        }}
      >
      { !md && <div className='' style={{ minWidth: 350}}>
        <ChatList selectedChat={selectedChat} setSelectedChat={setSelectedChat} absolute={false} setMenu={setMenu}  onlineUsers={onlineUsers}/>
      </div>}
      { md && <motion.div className='absolute z-10' animate={{ minWidth: menu ? 350 : 0, width: menu ? '' : 0}}>
        <ChatList selectedChat={selectedChat} setSelectedChat={setSelectedChat} absolute={true} setMenu={setMenu} onlineUsers={onlineUsers}/>
      </motion.div>}

      </motion.div>
      
      <Card className={`w-full  border-l-2 ${settings?.mode=='light' ? '' : 'border-gray-700'}`} style={{borderRadius: settings?.mode == 'light' ? '0 5px 5px 0' : 0, backgroundColor: settings?.mode == "light" ? "#f7f7f7" : ''}}>
        {
        selectedChat?.id == 0 
        ? <SelectChat /> 
        : <ChatUI selectedChat={selectedChat} setSelectedChat={setSelectedChat} setMenu={setMenu} socket={socket}/>
      }
      </Card>
    </div>
  ); 
};

export default Chat;
