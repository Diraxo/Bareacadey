import { IconButton } from '@mui/material'
import React, {useState} from 'react'
import { MdArrowBackIosNew, MdDeleteOutline } from 'react-icons/md'
import {TiArrowForwardOutline} from 'react-icons/ti';
import parse from 'html-react-parser'
import DeleteDialog from './DeleteConfirm';


const MessageDetail = ({message, backClick, deleteCallBack}) => {
  
  const [showDelete, setShowDelete] = useState(false)

  const handleDeleteClose = () => {
    setShowDelete(false)
  }

  return (
    <div style={{fontFamily: 'ubuntu'}}>
        <DeleteDialog open={showDelete} handleClose={handleDeleteClose} ids={message.id} callBack={deleteCallBack} exitCallBack={backClick} />
        <div className='bg-white dark:bg-gray-800 shadow-lg py-2 pt-4 rounded-md'>
            <div className='flex items-center border-b pb-4 px-4'>
                <IconButton
                onClick={backClick}
                style={{marginRight: 15}}
                >
                    <MdArrowBackIosNew
                    className='text-gray-500 dark:text-gray-100'
                    />
                </IconButton>
                <p className='text-gray-600 dark:text-gray-100' style={{fontFamily: 'ubuntu', fontSize: 20}}>
                    {message?.subject}
                </p>
            </div>
            <div className='flex items-center px-4 pt-2'>
                <IconButton
                onClick={()=>{
                    setShowDelete(true)                                                                                  
                }}
                style={{marginRight: 10}}
                >
                    <MdDeleteOutline
                    className='text-gray-500 dark:text-gray-100'
                    />
                </IconButton>
                <IconButton
                onClick={backClick}
                style={{marginRight: 15}}
                >
                    <TiArrowForwardOutline
                    className='text-gray-500 dark:text-gray-100'
                    />
                </IconButton>
                
            </div>
            <div className='bg-gray-200 p-5 dark:bg-gray-700'>

                <div className='bg-white dark:bg-gray-800 shadow-lg py-2 pt-4 rounded'>
                    <div className='flex items-center justify-between border-b pb-4 px-4'>
                        <div className="flex items-center">
                            <img src={message.to.url} width="60" height="60" className="rounded-full mr-2"/>
                            <div className='pl-3 dark:text-gray-100'>
                               <p className={``} style={{}}>{message.to.name}</p>
                               <p className={``}>{message.to.email}</p>
                            </div>
                        </div>
                        <div>
                            <p className='text-xs bg-green-200 rounded-full px-3 py-1 text-gray-700 dark:text-gray-700 mr-1'>{message.time}</p>
                        </div>
                    </div>
                    <div className='p-6 pt-8'>
                        <p className='dark:text-gray-100'>{parse(message.message)}</p>
                    </div>
                </div>

            </div>
        </div>
    </div>
  )
}

export default MessageDetail