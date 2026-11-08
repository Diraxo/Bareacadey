import { Avatar, Button, Card, IconButton, TextField } from '@mui/material'
import React, { useState, useEffect, useRef } from 'react'
import { useSettings } from '../../../MuiTheme/hooks/useSettings';
import {useTheme} from '@mui/material/styles';
import { useGetChatsQuery, useDeleteChatMutation, useUpdateChatMutation, useAddChatMutation } from '../../../features/user/chatsApiSlice';

import {IoCallOutline} from 'react-icons/io5';
import {BsCameraVideo} from 'react-icons/bs';
import {AiOutlineSearch} from 'react-icons/ai';
import {MdOutlineAttachment, MdSend} from 'react-icons/md';
import OtherChatItem from './OtherChatItem';
import MyChatItem from './MyChatItem';
import { useSelector } from 'react-redux';
import { BsChatDots } from 'react-icons/bs';
import { HiMenu } from 'react-icons/hi';
import Loader from '../../utils/Loader';
import useMediaQuery from '@mui/material/useMediaQuery';
import Notifications from '../VideoCall/Notifications';
import Room from './Room';

import ReactImagePickerEditor from 'react-image-picker-editor';
import 'react-image-picker-editor/dist/index.css'
import { OverlayPanel } from 'primereact/overlaypanel';
import { PopoverOverlay } from '../../utils/CrudComponents/ComponentsOverlay';


const ChatUI = ({selectedChat, setSelectedChat, setMenu, socket}) => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const md = useMediaQuery(theme.breakpoints.down('md'));
  const xs = useMediaQuery(theme.breakpoints.down('xs'));
  const {settings} = useSettings();
  const {
    data: chats,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch
  } = useGetChatsQuery(selectedChat?.id);
  const [updateChat, { isLoading: updateLoading }] = useUpdateChatMutation();
  const [sendChat, {isLoading: sendLoading}] = useAddChatMutation();
  const [deleteChat, { isLoading: deleteLoading }] = useDeleteChatMutation();

  const user = useSelector(state=>state?.auth?.user)

  const [message, setMessage] = useState("")
  const [file, setFile] = useState("");

  const mode = settings?.mode;

  const config2 = {
    borderRadius: '8px',
    language: 'en',
    width: '330px',
    height: '250px',
    objectFit: 'contain',
    compressInitial: null,
  };

  const initialImage = '';
  const imageUploaderRef = useRef()

  const sendChatCallback = async (e) => {
    try {
      e.preventDefault();
      const submitData = {
        _message: message,
        _type: "text",
        _private: false,
        _to: selectedChat?.id,
        _chatupload_id: null,
      };
      await sendChat(submitData).unwrap();
      const emit = { from: user?.id, to: selectedChat?.id };
      if (socket) {
        socket.emit('new_message', emit);
      } else {
        console.error('Socket is not available');
      }
      setMessage("");
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const [videoCalling, setVideoCalling] = useState({
    show: false,
    name: "",
    data: {}
  })
  const [videoAnswered, setVideoAnswered] = useState({
    status: false,
    room: ""
  })

  const [searchText, setSearchText] = useState("")
  const [enableSearch, setEnableSearch] = useState(false)

  const videoCall = (e) => {
    try {
      const emit = { from: user?.id, to: selectedChat?.id, name: user?.full_name };
      if (socket) {
        socket.emit('video-call', emit);
        setVideoAnswered({
          status: true,
          room: user?.id + "-" + selectedChat?.id
        });
      } else {
        console.error('Socket is not available');
      }
    } catch (error) {
      console.error('Error during video call:', error);
    }
  };

  useEffect(() => {
    if (selectedChat?.id) {
      try {
        if (socket) {
          socket.on('new_message', function(data) {
            try {
              const { from, to } = data;
              if (from === selectedChat?.id && to === user?.id) {
                refetch();
              }
            } catch (error) {
              console.error('Error handling new_message event:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error setting up new_message event listener:', error);
      }
  
      return () => {
        try {
          if (socket) {
            socket.off('new_message');
          }
        } catch (error) {
          console.error('Error removing new_message event listener:', error);
        }
      };
    }
  }, [selectedChat?.id, socket, refetch, user?.id]);
  


  useEffect(() => {
    if (selectedChat?.id) {
      try {
        if (socket) {
          socket.on('video-call', function(data) {
            try {
              const { from, to, name } = data;
              if (to === user?.id) {
                setVideoCalling({ show: true, name: name, data: data });
              }
            } catch (error) {
              console.error('Error handling video-call event:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error setting up video-call event listener:', error);
      }
      
      return () => {
        try {
          if (socket) {
            socket.off('video-call');
          }
        } catch (error) {
          console.error('Error removing video-call event listener:', error);
        }
      };
    }
  }, [selectedChat?.id, socket]);

  const onCallingAnswered = () => {
    const {from, to, name} = videoCalling?.data;
    setVideoAnswered({
      status: true,
      room: from+"-"+to
    })
  }
  const onCallingCanceled = () => {
    setVideoCalling({show: false, name: '', data: {}})
  }

  const onFileSelected = (file) => {
    const reader = new FileReader();
    const { files } = file.target;
    if (files && files.length !== 0) {
      reader.onload = () => setFile(reader.result );
      reader.readAsDataURL(files[0]);
    }
  };

  const chatRef = useRef(null);

  useEffect(() => {
    const div = chatRef.current;
    if(div) {
      div.scrollTop = div.scrollHeight;
    }
  }, [chatRef, selectedChat?.id, chats]);

  const [anchorEl, setAnchorEl] = useState({
    anchor: null,
    id: 0,
  });
  const handleClickEl = (event) => {
    setAnchorEl({
      anchor: event.currentTarget,
    });
  }
  
  const handleClose = () => {
    setAnchorEl({
      ...anchorEl,
      anchor: null,
      name: null
    });
  }

  return videoAnswered?.status == true ? (
    <Room socket={socket} room={videoAnswered?.room} videoAnswered={videoAnswered} setVideoAnswered={setVideoAnswered} />
  )
  : (
    <div style={{minHeight: '90vh', borderRadius: settings?.mode=="light" ? "5px 0 0 5px" : 0}}>
       <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleClose}
        headerTitle="Confirm Delete"
        // eslint-disable-next-line react/no-children-prop
        children={<p>Hello</p>}
        showHeader={false}
        showFooter={false}
        popPosition='top'
        marginFromButton={30}
       
      />
      <div className={`flex justify-between px-4 py-4 border-b ${settings?.mode=='light' ? '' : 'border-gray-700'}`}>
            {!xs &&
          <div className='flex items-center gap-2' style={{marginBottom: 0}}>
            {md && <IconButton
              onClick={()=>{
                setMenu((menu)=>!menu)
              }}
            >
              <HiMenu size={23}/>
            </IconButton>}
            
            <Avatar src={selectedChat?.url} sx={{width: 42, height: 42, border: `1px solid white`}}/>
            <div>
                <p style={{fontSize: 14.5, fontWeight: 500, color: mode=="light" ? '#77747c' : ''}} className="truncate mr-2">{selectedChat?.name}</p>
                {!sm && <p style={{fontSize: 13, fontWeight: 400, color: mode=="light" ? '#b4b2b7' : '#716c89'}}>{selectedChat?.role}</p>}
            </div>
          </div>}
          <div className='flex gap-2'>
          <AiOutlineSearch size={18} style={{marginTop: 11, opacity: "50%"}}/>
              <input
                className='outline-none bg-transparent border-b'
                value={searchText}
                onChange={(e)=>setSearchText(e.target.value)}
                placeholder='Search'
              />
            
            {/* <IconButton
              onClick={()=>{
                // setEnableSearch(!enableSearch)
              }}
            >
              <AiOutlineSearch size={22}/>
            </IconButton> */}
            {/* <IconButton
            
            >
              <IoCallOutline size={20}/>
            </IconButton>
            <IconButton
              onClick={()=>{
                videoCall()
              }}
            >
              <BsCameraVideo size={20}/>
            </IconButton> */}
            
          </div>
      </div>
      <div style={{overflowY: 'auto', height: '75vh', padding: 20, transition: "scroll-behavior 2s ease-in-out"}} ref={chatRef}>
        {
          !isLoading && chats?.map((chat, chatIndex)=>{
            if(chat?.message?.includes(searchText))
            return chat?.from == user?.id ? (
              <div 
               className='mb-4'
               key={'chat'+chatIndex}
               style={{
                marginRight: md && !sm ? '25%' : sm ? '3%' : '30%',
                marginBottom: 15
              }}
              >
                <MyChatItem chat={chat} url={ user?.img_url} editable={chats?.length - 1 == chatIndex} />
              </div>
            ) : (
              <div
                className='flex justify-end'
                key={'chat'+chatIndex}
                style={{
                  marginLeft: md && !sm ? '25%' : sm ? '3%' : '30%',
                  marginBottom: 15
                }}
              >
                <OtherChatItem chat={chat} url={selectedChat?.url}/>
              </div>
            );
          })
        }
        {
          !isLoading && chats?.length <= 0 && (
            <div className='flex justify-center items-center w-full h-full'>
                <div className='flex justify-center items-center flex-col gap-4' style={{marginTop: -100}}>
                    <BsChatDots size={45}/>
                    <div className='text-lg'>
                        No messages yet!
                    </div>
                </div>
            </div>
          )
        }
        {
          isLoading && <Loader />
        }
      </div>
      <div>
        <form onSubmit={sendChatCallback}>
        <Card 
          className={`flex justify-between border ${mode=='light' ? '' : 'border-gray-700'}`}
          style={{
            height: 50,
            backgroundColor: mode=='light' ? '#ffffff' : '',
            width: '90%',
            marginLeft: '5%',
            paddingLeft: 5,
            paddingRight: 15,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div className='w-full flex'>
          {/* <IconButton sx={{mt: -0.3}}
            onClick={(e)=>{
              handleClickEl(e)
            }}
          >
            <label htmlFor="file-attach" className='hover:cursor-pointer'>
            
              <MdOutlineAttachment size={23}/>
            </label>
            </IconButton> */}
            <OverlayPanel ref={imageUploaderRef} showCloseIcon >
              < ReactImagePickerEditor
                config={config2}
                imageSrcProp={initialImage}
                imageChanged={(newDataUri) => { setFile(newDataUri) }} />
            </OverlayPanel>
          <div className='w-full mr-4 ml-2'>
          <input
            value={message}
            onChange={(e)=>{
              setMessage(e.target.value)
            }}
            placeholder="Send a message..."
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              height: 40,
              marginLeft: 3,
              width: '100%'
            }}

          />
          </div>
          </div>
          <div className='flex gap-3'>
            <Button
              variant='contained'
              type='submit'
              sx={{
                height: 34,
                marginTop: 1
              }}
              startIcon={<MdSend/>}
            >
              Send
            </Button>
          </div>
        </Card>
        </form>
        {videoCalling?.show &&
        <div className='fixed right-0 bottom-0'>
           <Notifications name={videoCalling?.name} onCallingAnswered={onCallingAnswered} onCallingCanceled={onCallingCanceled}/>
        </div>}
      </div>
    </div>
  )
}

export default ChatUI