import React from 'react'
import { BiChat } from 'react-icons/bi'

const SelectChat = () => {
    
  return (
    <div className='flex justify-center items-center w-full h-full'>
        <div className='flex justify-center items-center flex-col gap-4' style={{marginTop: -100}}>
            <BiChat size={50}/>
            <div className='text-lg'>
                Select chat to start messaging!
            </div>
        </div>
    </div>
  )
}

export default SelectChat