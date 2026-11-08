import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import "plyr/dist/plyr.css"

const HlsPlayer = ({ src, previewThumbnails, ...props }) => {
  const videoRef = useRef();
  const playerRef = useRef();
  let hls = null;


  const controls = `
  <div class="plyr__controls">
      <button type="button" class="plyr__control" data-plyr="restart">
          <svg role="presentation"><use xlink:href="#plyr-restart"></use></svg>
          <span class="plyr__tooltip" role="tooltip">Restart</span>
      </button>
      <button type="button" class="plyr__control" data-plyr="rewind">
          <svg role="presentation"><use xlink:href="#plyr-rewind"></use></svg>
          <span class="plyr__tooltip" role="tooltip">Rewind {seektime} secs</span>
      </button>
      <button type="button" class="plyr__control" aria-label="Play, {title}" data-plyr="play">
          <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-pause"></use></svg>
          <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-play"></use></svg>
          <span class="label--pressed plyr__tooltip" role="tooltip">Pause</span>
          <span class="label--not-pressed plyr__tooltip" role="tooltip">Play</span>
      </button>
      <button type="button" class="plyr__control" data-plyr="fast-forward">
          <svg role="presentation"><use xlink:href="#plyr-fast-forward"></use></svg>
          <span class="plyr__tooltip" role="tooltip">Forward {seektime} secs</span>
      </button>
      <div class="plyr__progress">
          <input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek">
          <progress class="plyr__progress__buffer" min="0" max="100" value="0">% buffered</progress>
          <span role="tooltip" class="plyr__tooltip">00:00</span>
      </div>
      <div class="plyr__time plyr__time--current" aria-label="Current time">00:00</div>
      <div class="plyr__time plyr__time--duration" aria-label="Duration">00:00</div>
      <button type="button" class="plyr__control" aria-label="Mute" data-plyr="mute">
          <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-muted"></use></svg>
          <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-volume"></use></svg>
          <span class="label--pressed plyr__tooltip" role="tooltip">Unmute</span>
          <span class="label--not-pressed plyr__tooltip" role="tooltip">Mute</span>
      </button>
      <div class="plyr__volume">
          <input data-plyr="volume" type="range" min="0" max="1" step="0.05" value="1" autocomplete="off" aria-label="Volume">
      </div>
      <button type="button" class="plyr__control" data-plyr="captions">
          <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-captions-on"></use></svg>
          <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-captions-off"></use></svg>
          <span class="label--pressed plyr__tooltip" role="tooltip">Disable captions</span>
          <span class="label--not-pressed plyr__tooltip" role="tooltip">Enable captions</span>
      </button>
      <button type="button" class="plyr__control" data-plyr="fullscreen">
          <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-exit-fullscreen"></use></svg>
          <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-enter-fullscreen"></use></svg>
          <span class="label--pressed plyr__tooltip" role="tooltip">Exit fullscreen</span>
          <span class="label--not-pressed plyr__tooltip" role="tooltip">Enter fullscreen</span>
      </button>
  </div>
  `;
  

function updateQualities(newQuality) {
  if (hls) {
    if (newQuality === 1) {
      hls.currentLevel = -1; 
    } else {
      let levelIndex = hls.levels.findIndex((level) => level.height === newQuality);
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
  }
}

  useEffect(() => {
    if(!videoRef?.current) return;
    const defaultOptions = {};
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        const availableQualities = hls.levels.map((l)=> l.height);
        availableQualities.unshift(1)
        defaultOptions.controls = [
            'play-large',
            'restart', 
            'rewind', 
            'play', 
            'fast-forward', 
            'progress', 
            'current-time', 
            'duration',
            'mute', 
            'volume', 
            'captions', 
            'settings',
            'pip', 
            'airplay', 
            // 'download',
            'fullscreen',
        ]
        // defaultOptions.controls = controls
        defaultOptions.quality = {
            default: 1,
            options: availableQualities,
            forced: true,
            onChange: (e) => updateQualities(e)
        }
        defaultOptions.i18n = {
          qualityLabel: {
            1: 'Auto'
          }
        }
        // defaultOptions.previewThumbnails = {
        //   enabled: previewThumbnails?.length > 0,
        //   src: previewThumbnails,
        // }
        // defaultOptions.previewThumbnails = {
        //   enabled: true,
        //   src: ['https://cdn.plyr.io/static/demo/thumbs/100p.vtt', 'https://cdn.plyr.io/static/demo/thumbs/240p.vtt'],
        // },
        hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
          var span = document.querySelector(".plyr__menu__container [data-plyr='quality'][value='1'] span")
          if (hls.autoLevelEnabled) {
            span.innerHTML = `Auto (${hls.levels[data.level].height}p)`
          } else {
            span.innerHTML = `Auto`
          }
        })
        playerRef.current = new Plyr(videoRef.current, defaultOptions);      
      })

      hls.attachMedia(videoRef?.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
    } else {
      console.error('HLS is not supported by this browser');
    }

    return () => {
      hls.destroy();
      // if(playerRef?.current) {
      //   playerRef.current.destroy();
      // }
    };
  }, [src, videoRef?.current]);

  return (
    <div className="">
      <video ref={videoRef}/>
    </div>
  );
};

export default HlsPlayer;
