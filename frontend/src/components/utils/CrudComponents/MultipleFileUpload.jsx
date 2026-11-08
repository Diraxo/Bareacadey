import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';

import {FiDownload, FiDownloadCloud, FiUploadCloud} from 'react-icons/fi';
import { IconButton } from '@mui/material';
import { BsDownload, BsPlayFill } from 'react-icons/bs';
import { MdAudiotrack } from 'react-icons/md';

import {useTheme} from '@mui/material/styles';

const MultipleFileUpload = ({label="Files", onFileSelected, multiple=true, accept=""}) => {
    const toast = useRef(null);
    const fileUploadRef = useRef(null);

    const theme = useTheme();

    const [files, setFiles] = useState([]);


    const onTemplateSelect = (e) => {
        const newFiles = e.files;
        const updatedFiles = [...files, ...newFiles];
        onFileSelected(updatedFiles)
        setFiles((prev) => updatedFiles)
    };

    const onTemplateRemove = (file, callback) => {
        const updatedFiles = files?.filter((f)=>!(f?.name==file?.name && f?.size==file?.size && f?.type==file?.type));
        setFiles(prev=>updatedFiles)
        onFileSelected(updatedFiles)
        callback();
    };

    const onTemplateClear = () => {
        onFileSelected([])
         setFiles(files=>([]))
    };

    const itemTemplate = (file, props) => {
        const type = file?.type?.split('/')[0];

        return (
        
            <div className="flex items-center space-x-4 border-2 shadow-2 mb-2 p-3 rounded">

                <div className="flex items-center" style={{width: 'calc(100% - 3rem)'}}>
                    { type=="image" &&
                      <img alt={file.name} role="presentation" src={file.objectURL} truncate className='truncate w-4rem border-round shadow-2' style={{minWidth: '4rem', maxHeight: 60, objectFit: 'contain'}} />
                    }
                    {
                        type=="video" && 
                        <div className='flex justify-center items-center bg-[#ff0000] p-0 rounded' style={{minWidth: '4rem', height: 30, maxHeight: 60}}>
                            <BsPlayFill size={24} color="white" />
                        </div>
                    }
                    { type == "audio" &&
                        <div className='flex justify-center items-center p-0 rounded-full' style={{minWidth: '4rem', maxHeight: 60}}>
                            <div style={{width: 40, height: 40 }} className="border rounded-full flex items-center justify-start p-2"><MdAudiotrack size={24} color={theme.palette.primary.main}/></div>
                        </div>
                    }
                    { type != "image" && type != "video" && type != "audio" &&
                        <div className='flex justify-center items-center p-0 rounded-full' style={{minWidth: '4rem', maxHeight: 60}}>
                            <div style={{width: 40, height: 40 }} className=" rounded-full flex items-center justify-start p-2"><FiDownloadCloud size={30} color={theme.palette.primary.main}/></div>
                        </div>
                    }
                    <span className="flex-1 min-w-0 max-w-full text-left ml-3 ">
                        <p style={{}} className="truncate">{file.name}</p>
                        <small><Tag value={props.formatSize} severity="warning" className="px-2 py-1" /></small>
                    </span>
                </div>
                <Button type="button" icon="pi pi-times" className="p-button-outlined p-button-rounded p-button-danger ml-auto" style={{minWidth: '2.3rem', marginLeft: 10}} onClick={() => onTemplateRemove(file, props.onRemove)} />
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center flex-column">
                {/* <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i> */}
                <FiUploadCloud size={50} color="#cccccc"/>
                <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                Drag and Drop {label} Here...
                </span>
            </div>
        );
    };

    const chooseOptions = { icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-choose-btn p-button-rounded p-button-outlined' };
    const uploadOptions = { icon: 'pi pi-fw pi-cloud-upload', iconOnly: true, className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined' };
    const cancelOptions = { icon: 'pi pi-fw pi-times', iconOnly: true, className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined' };
    
    function getAcceptString() {
        const fileTypes = accept;
        if(!fileTypes) return "";
        const acceptMap = {
          "video": "video/*",
          "audio": "audio/*",
          "image": "image/*",
          "word_document": ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "pdf": ".pdf,application/pdf",
          "archives": ".zip,.7z,.rar,application/zip,application/x-7z-compressed,application/x-rar-compressed",
          "excel": ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "power_point": ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
        };
      
        const fileTypesArray = fileTypes.split(",").map(type => type.trim());
        const acceptArray = [];
        if(fileTypesArray?.includes("all")) return "";
      
        for (let type of fileTypesArray) {
          if (acceptMap[type]) {
            acceptArray.push(acceptMap[type]);
          }
          else {
            console.error(`Invalid file type: ${type}`);
          }
        }
        return acceptArray.join(",");
    }

    return (
        <div className='rounded'>
            <Toast ref={toast}></Toast>

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
            <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />
            {/* accept="image/*"  */}
            <FileUpload ref={fileUploadRef} mode="advanced" multiple={multiple} accept={getAcceptString()}
                customUpload  onError={onTemplateClear}
                itemTemplate={itemTemplate} emptyTemplate={emptyTemplate} onSelect={onTemplateSelect} onClear={onTemplateClear}
                chooseOptions={chooseOptions} uploadOptions={{style: {display: 'none'}}} cancelOptions={cancelOptions} />
        </div>
    )
}

export default MultipleFileUpload;