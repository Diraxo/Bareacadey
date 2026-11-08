import React, { useState, useEffect, useRef } from 'react'
import VideoJS from './VideoJS';
import HlsPlayer from '../../../utils/HlsPlayer';
import { useMediaUrl } from '../../../../utils/media';

const VideoPlayer = ({ filePath: rawFilePath, poster, onEnded }) => {
  const onEndedRef = React.useRef(onEnded);
  onEndedRef.current = onEnded;
  const filePath = useMediaUrl(rawFilePath);

  const playerRef = React.useRef(null);

  const videoJsOptions = {
    autoplay: false,
    preload: 'metadata',
    poster: poster || undefined,
    controls: true,
    responsive: true,
    fluid: true,
    enableSmoothSeeking: true,
    // nativeControlsForTouch: false,
    playbackRates: [0.5, 1.7, 1, 1.3, 1.5, 2],
    sources: [{
      src: filePath,
      type: 'video/mp4'
    }],
  };

  const [portrait, setPortrait] = useState(true)
  const [playerReady, setPlayerReady] = useState(false)

  const handlePlayerReady = (player) => {
    if (!player) return;
    playerRef.current = player;

    player.on('loadedmetadata', () => {
      const videoWidth = player.videoWidth();
      const videoHeight = player.videoHeight();

      if (videoHeight > videoWidth) {
        const aspectRatio = videoWidth / videoHeight;
        const maxHeight = window.innerHeight * 0.7;
        const adjustedWidth = maxHeight * aspectRatio;

        // Disable fluid
        player.fluid(false);

        // Set player dimensions
        player.width(adjustedWidth);
        player.height(maxHeight);
        setPortrait(true)
      } else {
        setPortrait(false)
        // player.fluid(true);
        // setPlayerReady(true)
      }
    });

    player.on('ready', () => {
      setPlayerReady(true)
      // player.src({ src: filePath, type: 'video/mp4' });
    });


    player.on('ended', () => {
      onEndedRef.current?.();
    });

    player.on('waiting', () => {
      // Handle waiting event
    });

    player.on('dispose', () => {
      playerRef.current = null;
    });
  };





  function isVideoFile(filePath) {
    const extname = filePath?.split('.')?.pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    return videoExtensions.includes(extname);
  }

  const [videoUrl, setVideoUrl] = useState({ src: "", thumbnails: [] });
  function checkFileExist(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true);
    xhr.onload = function () {
      if (xhr.status == 200) {
        setVideoUrl({ src: url?.split("successfully_converted")[0] + "/index.m3u8" })
      }
    };
    xhr.send();
  }

  useEffect(() => {
    if (!filePath) return;
    setVideoUrl(() => ({ src: "", thumbnails: [] }))
    const path = (filePath?.split("/common")[0]) + "/videos/" + (filePath?.split("/").pop()) + ("/successfully_converted");
    // checkFileExist(path)
  }, [filePath])
  return (
    <div className='w-auto'>
      {!playerReady && <div className='flex justify-center items-center w-full bg-gray-900' style={{minHeight: '70vh'}}>
        {<VideoJS style={{display: 'none'}} onReady={handlePlayerReady} />}
      </div>}
        {portrait && playerReady && <div className='flex justify-center w-full bg-gray-900'>
          <VideoJS  options={videoJsOptions} onReady={handlePlayerReady} />
        </div>}
        {!portrait && playerReady &&
          <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
        }

    </div>
  )

}

export default VideoPlayer
