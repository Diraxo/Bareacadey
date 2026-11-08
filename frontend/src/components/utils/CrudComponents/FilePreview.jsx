import React, { useState, useRef, useEffect } from 'react'
import { Image } from 'primereact/image';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useTheme } from "@mui/material/styles";
import { MdAudiotrack, MdDownload, MdVisibility } from "react-icons/md";
import { BsPlayFill, BsFileEarmarkExcelFill, BsFileEarmarkPdf, BsFileEarmarkZipFill, BsFileEarmarkWordFill, BsFileEarmarkPptFill } from 'react-icons/bs';
import { FiDownloadCloud, FiUploadCloud } from "react-icons/fi";
import { IconButton, Tooltip } from '@mui/material';
import { useSettings } from '../../../MuiTheme/hooks/useSettings';
import axios from 'axios';
import { useMediaToken, addMediaToken } from '../../../utils/media';
import DocumentViewer from '../DocumentViewer';

const FilePreview = ({file, selectedIndex=0, allFiles=[]}) => {
  const mediaToken = useMediaToken();
  const mediaSrc = addMediaToken(file?.filepath, mediaToken);
  const theme = useTheme();
  const videoOverlay = useRef(null);
  const type = file?.mimetype?.split('/')[0];
  const ext = file?.mimetype?.split('/')[1];
  const {settings} = useSettings();

  const videoRef = useRef(null);

  const [activeOverlay, setActiveOverlay] = useState("video");

  function updateFilePath(filePath) {
    // Check if the filePath contains the old IP address
    if (filePath.includes('10.10.10.69:4000')) {
        // Replace the old IP address with the new one
        const updatedPath = filePath.replace('10.10.10.69:4000', '196.191.66.64:4000');
        return updatedPath;
    } else {
        // No need to update, return the original filePath
        return filePath;
    }
}

  // const docUrl = `https://docs.google.com/gview?url=${updateFilePath(file?.filepath)}&embedded=true`;
  const docUrl = `https://view.officeapps.live.com/op/view.aspx?src=https://www.labnol.org/files/word.docx`;

  // useEffect(() => {
  //   // Get the video element
  //   const video = videoRef?.current;

  //   if(video) {
  //       video.crossOrigin = "anonymous";
  //       video.addEventListener("loadedmetadata", () => {
  //         const randomTime = Math.random() * video.duration;
    
  //         video.currentTime = randomTime;
    
  //         video.addEventListener("seeked", () => {
  //           const canvas = document.createElement("canvas");
  //           const context = canvas.getContext("2d");
  //           canvas.width = video.videoWidth;
  //           canvas.height = video.videoHeight;
  //           context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //           const imageDataURL = canvas.toDataURL();
  //           video.poster = imageDataURL;
  //         });
  //       });
  //   }
  // }, []);

  const showPreview = 
  (ext=="pdf") ||
  (ext=="doc" || ext=="docx" || ext=="msword" || ext=="vnd.openxmlformats-officedocument.wordprocessingml.document") ||
  (ext=="xls" || ext=="xlsx" || ext=="vnd.ms-excel" || ext=="vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
  (ext=="ppt" || ext=="pptx" || ext=="vnd.ms-powerpoint" || ext=="vnd.openxmlformats-officedocument.presentationml.presentation");


  function downloadFile (filePath=file?.filepath, fileName=file?.filename) {
    // var link = document.createElement ("a");
    // link.download = fileName;
    // link.href = filePath;
    // link.click ();

    axios.get(addMediaToken(filePath, mediaToken), { responseType: "blob" })
    .then (response => {
      const href = URL.createObjectURL (response.data);
      const link = document.createElement ("a");
      link.href = href;
      link.download = fileName;
      document.body.appendChild (link);
      link.click ();
      document.body.removeChild (link);
      URL.revokeObjectURL (href);
    });
  }

  return (
    <div>

      {
    type=="image" ? (
  <div style={{minWidth: '6rem'}}>
    <Image src={file?.filepath} alt={file?.filename} key={file?.filepath} draggable={true} downloadable={true} imageClassName="w-6rem shadow-2 border-round" preview />
  </div>
  ) : type=="video" ?
   (
    <Tooltip title={file?.filename}>
    <div className='relative w-6rem shadow-2 border-round hover:cursor-pointer'
        onClick={(e) => {
          setActiveOverlay((prev)=>"video")
          videoOverlay?.current?.toggle(e);
        }}
    >
      
        <video
            key={file?.filepath}
            src={mediaSrc}
            ref={videoRef}
            // controls
            className="w-6rem shadow-2 border-round"
        />
        <div className='absolute bg-black opacity-20 w-full h-full top-0 left-0' />
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
            <BsPlayFill color='rgba(255,255,255,.6)'/>
        </div>
        
    </div>
    </Tooltip>
   ) : type=="audio" ? 
   (
    <div 
      className='flex flex-col gap-0 justify-start h-fit'
      style={{ maxHeight: 60, maxWidth: 300 }}
    >
      <div
        className="flex justify-start gap-0 items-center p-0 rounded-full"
        style={{marginTop: -11}}
      >
        <div
          style={{  height: 40 }}
          className="rounded-full flex items-center justify-start p-2"
        >
          <MdAudiotrack size={20} color={theme.palette.primary.main} />
        </div>
        <Tooltip title={file?.filename}><span className='truncate hover:cursor-pointer' style={{}}>{file?.filename}</span></Tooltip>
      </div>
      <audio controls  key={file?.filepath} className="shadow-2 border-round" style={{height: 25, marginTop: -5}}>
         <source src={mediaSrc} type={file?.mimetype} />
         Your browser does not support the audio element.
      </audio>
    </div>
   ) :
   (
      <div
        className="flex items-center rounded-xl pl-2 pr-3 bg-gray-200"
        style={{ maxHeight: 60 }}
      >
        <div
          style={{ width: 40, height: 40 }}
          className=" rounded-full flex items-center justify-start p-2"
        >
          {ext=="pdf" ? 
          <BsFileEarmarkPdf  size={21} color={theme.palette.error.dark}/>
          : (ext=="doc" || ext=="docx" || ext=="msword" || ext=="vnd.openxmlformats-officedocument.wordprocessingml.document") ?
          <BsFileEarmarkWordFill  size={21} color="#1757b7"/>
          : (ext=="xls" || ext=="xlsx" || ext=="vnd.ms-excel" || ext=="vnd.openxmlformats-officedocument.spreadsheetml.sheet") ?
          <BsFileEarmarkExcelFill  size={21} color="#1f6f45"/>
          : (ext=="ppt" || ext=="pptx" || ext=="vnd.ms-powerpoint" || ext=="vnd.openxmlformats-officedocument.presentationml.presentation") ?
          <BsFileEarmarkPptFill  size={21} color="#ca4223"/>
          : (ext=="zip" || ext=="7z" || ext=="rar" || ext=="x-7z-compressed" || ext=="x-rar-compressed") ?
          <BsFileEarmarkZipFill  size={21} color="#90598f"/>
          :<FiDownloadCloud size={21} color={theme.palette.primary.main} />
          }
        </div>
        <div className='flex justify-center items-center gap-2 -ml-1'>
           <Tooltip title={file?.filename}><span className='truncate hover:cursor-pointer' style={{maxWidth: 100}}>{file?.filename}</span></Tooltip>
           <Tooltip title="Download"><IconButton onClick={()=>downloadFile()} size='small' color="primary" className='border rounded-full'><MdDownload/></IconButton></Tooltip>
           {showPreview &&
              <Tooltip title="Preview" className='-ml-1'><IconButton
                  size='small'
                  color="primary"
                  className='border rounded-full'
                  onClick={(e) => {
                    setActiveOverlay((prev)=>"document")
                    videoOverlay?.current?.toggle(e);
                  }}
                ><MdVisibility /></IconButton></Tooltip>
            }
        </div>
      </div>
   )
   }
  
   <OverlayPanel ref={videoOverlay} showCloseIcon={true} dismissable={false} >
        {activeOverlay=="video" &&
        <video
            key={file?.filepath}
            src={mediaSrc}
            controls={true}
            autoPlay={true}
            // className="w-6rem shadow-2 border-round"
        />}
        {activeOverlay=="document" && 
          // <div className="doc-embed">
          //   <iframe src={docUrl} width="800" height="600"></iframe>
          // </div>
           <DocumentViewer docs={allFiles?.map((fl) => {
            let fileType = fl?.fileType;
            if(fileType == "vnd.openxmlformats-officedocument.wordprocessingml.document") {
              fileType = "docx"
            } 
            return (
              {
                uri: fl?.uri,
                fileName: fl?.fileName,
                 fileType: fileType
              }
            )
          })
          } index={selectedIndex} print={false}/>
        }
    </OverlayPanel>
   </div>
  )
}

export default FilePreview