import React, { useRef, useState } from 'react'
import {useTheme} from '@mui/material/styles'; 
import { IconButton } from '@mui/material';
import { MdKeyboardArrowDown, MdKeyboardArrowRight, MdLockOutline } from 'react-icons/md';
import {OverlayPanel} from "primereact/overlaypanel";
import { useSelector } from 'react-redux';
import LoginPageModal from '../../../login/LoginModal';
import { PiVideoFill } from 'react-icons/pi';
import {FcFolder} from 'react-icons/fc';
const ChapterItems = ({chapter, selectedVideo, setSelectedVideo, card=true, refetch }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(true);
    const freeUpto = chapter?.free_first_n_chapters;

    const user = useSelector((state)=>state?.auth?.user);

    return (
     <div className={`flex flex-col ${card ? "shadow-2 border" : "" } rounded-md`} key={chapter?.id}>
      <div className='flex justify-between items-center border font-bold text-lg rounded-md p-2' style={{backgroundColor: theme?.palette?.background?.paper}}>
       <div className='flex flex-1 items-center truncate'>
        <FcFolder size={22} />
        <p className='truncate pl-2'>{chapter?.title}</p> 
       </div>
       <IconButton
         onClick={()=>{
            setExpanded((exp)=>!exp)
         }}
       >{expanded ? <MdKeyboardArrowDown size={25} /> : <MdKeyboardArrowRight size={25}/>}</IconButton>
      </div>
      <div className='' style={{maxWidth: card ? 400 : "", height: expanded ? "auto" : 0, backgroundColor: theme?.palette?.background?.paper}}>
        {
          chapter?.chapter_files?.map((file, index)=>{
            const mimetype = String(file?.mimetype);
            if(mimetype?.includes("mp4")) {
              return (
                <div 
                key={"file"+index}
                  className={`${expanded ? 'flex' : 'hidden'} items-center gap-2 p-2 m-2 rounded hover:cursor-pointer hover:bg-blue-300 hover:text-white`}
                  style={{
                    backgroundColor: selectedVideo?.path == file?.filepath ? theme?.palette?.primary?.main : "",
                    color: selectedVideo?.path == file?.filepath ? "white" : "",
                  }}
                  onClick={()=>{
                    setSelectedVideo({name: file?.filename, path: file?.filepath, chapter: chapter})
                  }}
                >
                  <PiVideoFill size={20} color="#ff0000" />
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

export default ChapterItems
