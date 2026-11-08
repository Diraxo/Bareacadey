import React, { useRef, useState } from 'react'
import {useTheme} from '@mui/material/styles'; 
import { IconButton } from '@mui/material';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdLockOutline } from 'react-icons/md';
import { PiVideoFill } from 'react-icons/pi';
import {OverlayPanel} from "primereact/overlaypanel";
import { useSelector } from 'react-redux';
import LoginPageModal from '../../../login/LoginModal';
import {FcFolder} from 'react-icons/fc';
import { BsFilePdf } from 'react-icons/bs';

const BookItems = ({course, selectedVideo, setSelectedVideo, card=true }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(true);
    const user = useSelector((state)=>state?.auth?.user);
    return (
     <div className={`flex flex-col ${card ? "shadow-2 border" : "" } rounded-md`} key={course?.id}>
      <div className='' style={{maxWidth: card ? 400 : "", height: expanded ? "auto" : 0, backgroundColor: theme?.palette?.background?.paper}}>
        {
          course?.pdf_files?.map((file, index)=>{
            const mimetype = String(file?.mimetype);
            if(mimetype?.includes("pdf")) {
              return (
                <div 
                key={"file"+index}
                  className={`${expanded ? 'flex' : 'hidden'} items-center gap-2 p-2 m-2 rounded hover:cursor-pointer hover:bg-blue-300 hover:text-white`}
                  style={{
                    backgroundColor: selectedVideo?.path == file?.filepath ? theme?.palette?.primary?.main : "",
                    color: selectedVideo?.path == file?.filepath ? "white" : "",
                  }}
                  onClick={()=>{
                    setSelectedVideo({name: file?.filename, path: file?.filepath, chapter: [], index: index})
                  }}
                >
                  <BsFilePdf size={20} color="#ff0000" />
                  <p className='truncate flex-1' style={{maxWidth: card ? 300 : ""}}>{String(file?.filename)?.substring(0, String(file?.filename)?.lastIndexOf("."))}</p>
                </div>
              )
            }
          })
        }
      </div>
     </div>
    );
}

export default BookItems
