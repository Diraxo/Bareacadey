import { IconButton } from '@mui/material'
import React from 'react'
import { AiOutlineUser } from 'react-icons/ai'
import { MdCall, MdCallEnd } from 'react-icons/md'

const Notifications = ({name, onCallingCanceled, onCallingAnswered}) => {
  return (
    <div style={{
      height: 500,
      width: 300,
      backgroundColor: 'black',
      borderRadius: 3,
    }} className="flex flex-col items-center justify-around text-white">
      <div className='flex flex-col items-center'>
        <p style={{fontSize: 25, color: 'rgba(255,255,255,.9)'}}>{name}</p>
        <p style={{fontSize: 15, color: 'rgba(255,255,255,.6)'}}>Incoming Call</p>
      </div>
      <div className='rounded-full p-3 bg-gray-800'>
        <AiOutlineUser size={50}/>
      </div>
      <div className='flex justify-between w-full px-10 mt-20'>
        <IconButton
          onClick={onCallingCanceled}
        >
         <div className='bg-red-800 p-4 rounded-full text-white'>
          <MdCallEnd size={22}/>
         </div>
        </IconButton>
        <IconButton
          onClick={onCallingAnswered}
        >
         <div className='bg-green-600 p-4 rounded-full text-white'>
          <MdCall />
        </div>
        </IconButton>
      </div>
    </div>

  )
}

export default Notifications