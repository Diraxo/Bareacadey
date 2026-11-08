const fs = require('fs');
const path = require('path');
const { parentPort } = require('worker_threads');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('ffprobe-static').path;
// const { Transcoder } = require('simple-hls');
const { Transcoder } = require('./simple-hls/index')


var exec = require('mz/child_process').execFile;
var assert = require('assert');

function getDimensions(filename) {
  return exec(ffprobePath, [
    '-v', 'error',
    '-of', 'flat=s=_',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=height,width',
    filename
  ]).then(function (out) {
    var stdout = out[0].toString('utf8');
    var width = /width=(\d+)/.exec(stdout);
    var height = /height=(\d+)/.exec(stdout);
    assert(width && height, 'No dimensions found!');
    return {
      width: parseInt(width[1]),
      height: parseInt(height[1]),
    };
  });
}


const customRenditions = (name) => {
    return [
      {
          width: 640,
          height: 360,
          profile: 'main',
          hlsTime: '4',
          bv: '800k',
          maxrate: '856k',
          bufsize: '1200k',
          ba: '96k',
          ts_title: '360p',
          master_title: '360p'
      },
      {
          width: 842,
          height: 480,
          profile: 'main',
          hlsTime: '4',
          bv: '1400k',
          maxrate: '1498k',
          bufsize: '2100k',
          ba: '128k',
          ts_title: '480p',
          master_title: '480p'
      },
      {
          width: 1280,
          height: 720,
          profile: 'main',
          hlsTime: '4',
          bv: '2800k',
          maxrate: '2996k',
          bufsize: '4200k',
          ba: '128k',
          ts_title: '720p',
          master_title: '720p' 
      },
      {
          width: 1920,
          height: 1080,
          profile: 'main',
          hlsTime: '4',
          bv: '5000k',
          maxrate: '5350k',
          bufsize: '7500k',
          ba: '192k',
          ts_title: '1080p',
          master_title: '1080p'
      }
    ]
};

function roundToNearest (number, multiple) {
  return Math.round (number / multiple) * multiple;
}

const filterRenditions = async (filepath, name) => {
  const dimensions = await getDimensions(filepath, { ffprobePath: ffprobePath}).catch((e)=>{console.log(e.message)});
  const videoWidth = roundToNearest (dimensions?.width, 640)
  if(!videoWidth) return [];
  const filteredRenditions = customRenditions(name)?.filter((rendition) => {
      return rendition?.width <= videoWidth;
  });
  return filteredRenditions;
};

parentPort.on('message', async (data) => {
  const { fileName, filePath } = data;
  const fileDestFolder = "./files/uploads/videos/"+fileName;
  if (!fs.existsSync(fileDestFolder)) {
   fs.mkdir(fileDestFolder, (err) => {
     if (err) {
       console.error(err);
     } 
     else {
       fs.mkdir(fileDestFolder+"/thumbnails", (err) => {})
     }
   });
  } 
  const res = await filterRenditions(filePath, fileName)
  if(!res) return;
  const transcode = new Transcoder(filePath, fileDestFolder + '/', { renditions: res, showLogs: true, ffmpegPath: ffmpegPath});
  try { 
    fs.writeFile( fileDestFolder+'/transcoding_started', "", (err) => {});
   const hlsPath = await transcode.transcode();
   fs.writeFile( fileDestFolder+'/successfully_converted', "", (err) => {});
//    ffmpeg -i test.mp4 -vf 'scale=100:-1:force_original_aspect_ratio=decrease,fps=1/2' out/out%d.png
    // console.log('Successfully Transcoded Video');
   } catch(e){
    const folderPath = fileDestFolder
      if (fs.existsSync(folderPath)) {
        fs.rm(folderPath, { recursive: true, force: true }, (err) => {
          if (err) {} 
        });
      }
    
   }
});
