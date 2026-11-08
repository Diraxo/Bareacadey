import { Avatar, Card } from '@mui/material'
import React, { useRef, useState } from 'react'
import { useSettings } from '../../../MuiTheme/hooks/useSettings';
import {useTheme} from '@mui/material/styles';
import { MdDeleteOutline, MdEdit, MdKeyboardArrowDown } from 'react-icons/md';
import { MenuOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { useDeleteChatMutation, useUpdateChatMutation } from '../../../features/user/chatsApiSlice';

const MyChatItem = ({chat, url, editable=false}) => {
  const theme = useTheme();
  const {settings} = useSettings();
  const mode = settings?.mode;
  const [hover, setHover] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(chat?.message??"")

  const [updateChat, {isLoading}] = useUpdateChatMutation()
  const [deleteChat] = useDeleteChatMutation()

  const submitEdit = async (e) => {
    e.preventDefault();
    const data = await updateChat({id: chat?.id, _message: editText}).unwrap()
    setEditMode(false)
  }
  return (
    <div className='flex gap-2'>
    <Avatar
      src={url}
      sx={{
        width: 32,
        height: 32
      }}
    />
    <Card
      style={{
        fontSize: 15,
        backgroundColor: mode=='dark' ? '#1E1A33' : ''
      }}
      onMouseEnter={()=>{
        setHover(true)
      }}
      onMouseLeave={()=>{
        setHover(false)
      }}
      className="w-fit px-3 py-2 flex"
    >
        {!editMode && chat?.message}
        {editMode && 
          <form onSubmit={submitEdit}>
          <input 
            className='outline-none'
            placeholder='Write message...'
            value={editText}
            autoFocus
            onChange={(e)=>setEditText(e.target.value)}
          />
          </form>
        }
        {hover && !editMode &&
        <div style={{width: 10, marginTop: 3}} className="opacity-50 hover:cursor-pointer">
           {/* <MdKeyboardArrowDown /> */}
           <MenuOverlay
            arrow={false}
            transformVertical = "center"
            transformHorizontal = "left"
          
            button={
                <MdKeyboardArrowDown />
            }
            sx={{
              mt: 4,
              ml: 3
            }}
            menuItems={[
              {
                name: "Edit Chat",
                icon: <MdEdit />,
                hide: !editable,
                onClick: (e) => {
                  setEditMode(true)
                }
              },
              {
                name: "Delete Chat",
                icon: <MdDeleteOutline />,
                onClick: (e) => {
                  deleteChat({id: chat?.id}).unwrap()
                }
              }

            ]}
          />
        </div>
        }
    </Card>
    </div>
  )
}

export default MyChatItem