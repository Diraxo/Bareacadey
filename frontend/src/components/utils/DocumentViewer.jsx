// import React from 'react'
// import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// const DocumentViewer = ({ docs = [], index = 0, preview=true }) => {
//   return (
//     <div>
//       <DocViewer documents={docs} pluginRenderers={DocViewerRenderers} initialActiveDocument={docs[index]}
//         config={{
//           header: {
//             disableHeader: false,
//             disableFileName: !preview,
//             retainURLParams: true,
//           },


//           pdfVerticalScrollByDefault: false,

//         }}  style={{minWidth: !print ? 500 : "auto", minHeight: !print ? 700 : "auto"}} />
//     </div>
//   )
// }

// export default DocumentViewer;

import React, { useEffect, useState } from 'react';
import { Image } from 'primereact/image';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Button } from '@mui/material';
import { useMediaToken, addMediaToken } from '../../utils/media';

const DocumentViewer = ({ docs = [], index = 0, preview = true, minPdfWidth = 700 }) => {
  const [activeIndex, setActiveIndex] = useState(index);
  const mediaToken = useMediaToken();

  useEffect(() => {
    setActiveIndex(index);
  }, [index]);

  const doc = docs[activeIndex];
  const fileType = doc?.fileType || doc?.uri?.split('.').pop();

  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase());
  const isPdf = fileType.toLowerCase() === 'pdf';
  const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType.toLowerCase());
  const isVideo = ['mp4', 'webm', 'ogg'].includes(fileType.toLowerCase());

  const toolbarPluginInstance = toolbarPlugin();
  const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

  const transform = (slot) => ({
    ...slot,
    Download: () => <></>,
    Open: () => <></>,
    Print: () => <></>,
  });

  const renderToolbar = (Toolbar) => (
    <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [defaultTabs[0], defaultTabs[1]],
    renderToolbar: renderToolbar,
  });

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < docs.length - 1) setActiveIndex(activeIndex + 1);
  };

  return (
    <div>
      <div>
        {isImage && (
          <Image src={addMediaToken(doc.uri, mediaToken)} alt="document-image" preview={preview} />
        )}

        {isPdf && (
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <div className='border card1' style={{ width: minPdfWidth, height: '70vh' }}>
              <Viewer fileUrl={addMediaToken(doc.uri, mediaToken)} plugins={[defaultLayoutPluginInstance]} defaultScale={SpecialZoomLevel.PageWidth} />
            </div>
          </Worker>
        )}

        {isDoc && (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.uri)}`}
            width="100%"
            height="700px"
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {isVideo && (
          <video controls width="100%" height="70vh">
            <source src={addMediaToken(doc.uri, mediaToken)} type={`video/${fileType}`} />
            Your browser does not support the video tag.
          </video>
        )}

        {!isImage && !isPdf && !isDoc && !isVideo && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.uri)}&embedded=true`}
            width="100%"
            height="700px"
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>

      {docs.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: 10 }}>
          <Button variant='contained' size='small' onClick={handlePrev} disabled={activeIndex === 0}>
            Previous
          </Button>
          <Button variant='contained' size="small" onClick={handleNext} disabled={activeIndex === docs.length - 1}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
