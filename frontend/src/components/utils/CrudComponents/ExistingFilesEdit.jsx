import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";

import { FiDownloadCloud, FiUploadCloud } from "react-icons/fi";
import { BsPlayFill } from "react-icons/bs";
import { MdAudiotrack } from "react-icons/md";

import { useTheme } from "@mui/material/styles";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const ExistingFilesEdit = ({ files, onChange, localStorage }) => {
  const theme = useTheme();
  const onTemplateRemove = (file) => {
    const updatedFiles = files?.filter(
      (f) =>
        !(
          f?.filename == file?.filename &&
          f?.size == file?.size &&
          f?.mimetype == file?.mimetype
        )
    );
    onChange(updatedFiles);
  };

  function formatBytes(bytes) {
    if (isNaN(bytes) || bytes < 0) {
      return "0 bytes";
    }
    const units = ["bytes", "KB", "MB", "GB"];
    const thresholds = [1000, 1000 ** 2, 1000 ** 3];
    for (let i = 0; i < units.length; i++) {
      if (bytes < thresholds[i] || i === units.length - 1) {
        return (bytes / (thresholds[i - 1] || 1)).toFixed(3) + " " + units[i];
      }
    }
  }

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const newFiles = reorder(
      files,
      result.source.index,
      result.destination.index
    );

    onChange(newFiles);
  };

  const itemTemplate = (file, index) => {
    const type = file?.mimetype?.split("/")[0];
    const mainUrl = localStorage;
    return (
      <div
        className="flex items-center space-x-4 border mb-2 p-3 shadow-0 rounded"
        key={file?.filepath+index}
        style={{maxWidth: 588}}
      >
        <div
          className="flex items-center"
          style={{ width: "calc(100% - 3rem)" }}
        >
          {type == "image" && (
            <img
              alt={file?.filename}
              role="presentation"
              src={mainUrl+file?.filepath}
              className="truncate w-4rem border-round shadow-2"
              style={{ minWidth: "4rem", maxHeight: 60, objectFit: "contain" }}
            />
          )}
          {type == "video" && (
            <div
              className="flex justify-center items-center bg-[#ff0000] p-0 rounded"
              style={{ minWidth: "4rem", height: 30, maxHeight: 60 }}
            >
              <BsPlayFill size={24} color="white" />
            </div>
          )}
          {type == "audio" && (
            <div
              className="flex justify-center items-center p-0 rounded-full"
              style={{ minWidth: "4rem", maxHeight: 60 }}
            >
              <div
                style={{ width: 40, height: 40 }}
                className="border rounded-full flex items-center justify-start p-2"
              >
                <MdAudiotrack size={24} color={theme.palette.primary.main} />
              </div>
            </div>
          )}
          {type != "image" && type != "video" && type != "audio" && (
            <div
              className="flex justify-center items-center p-0 rounded-full"
              style={{ minWidth: "4rem", maxHeight: 60 }}
            >
              <div
                style={{ width: 40, height: 40 }}
                className=" rounded-full flex items-center justify-start p-2"
              >
                <FiDownloadCloud size={30} color={theme.palette.primary.main} />
              </div>
            </div>
          )}
          <span className="flex-1 min-w-0 max-w-full text-left ml-3 ">
            <p style={{}} className="truncate">
              {file.filename}
            </p>
            <small>
              <Tag
                value={formatBytes(file?.size)}
                severity="warning"
                className="px-2 py-1"
              />
            </small>
          </span>
        </div>
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          style={{ minWidth: "2.3rem", marginLeft: 10 }}
          onClick={() => onTemplateRemove(file)}
        />
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column">
        {/* <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i> */}
        <FiUploadCloud size={50} color="#cccccc" />
        <span
          style={{ fontSize: "1.2em", color: "var(--text-color-secondary)" }}
          className="my-5"
        >
          Drag and Drop {label} Here...
        </span>
      </div>
    );
  };

  const sanitize = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
    {files?.length > 0 &&
    <div className="rounded border p-3 pb-2 shadow-1">
      <Droppable droppableId="files">
        {(provided, snapshot) => (
          // make sure the ref prop is set to provided.innerRef
          <div
            className={`${snapshot.isDraggingOver ? 'border border-dashed' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
            
          >
            {files?.map((file, index) => (
              // make sure the key and draggableId props are strings and unique
              <Draggable
                key={sanitize(file.filename)+index}
                draggableId={sanitize(file.filename) + file.size}
                index={index}
              >
                {(provided, snapshot) => (
                  // make sure the ref prop is set to provided.innerRef
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                   
                  >
                        {itemTemplate(file, index)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>}
    </DragDropContext>
  );
};

export default ExistingFilesEdit;
