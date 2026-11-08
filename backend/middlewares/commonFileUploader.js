const fs = require('fs');
const path = require('path');
// const { Worker } = require('worker_threads');
// const os = require('os');
// sharp is optional: some shared hosts cannot install its native binary. Without it, blurred thumbnails are skipped.
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('sharp is not available; image thumbnails will be skipped.');
}
const { saveUpload, validateFile, planStoredName } = require('./safeUpload');

function isVideoFile(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  return videoExtensions.includes(extname);
}
function isImageFile(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const imageExtensions = ['.jpg', '.png', '.jpeg', '.bmp', '.webp'];
  return imageExtensions.includes(extname);
}


// const convertToHls = async (file, fileName, filePath) => {
//     try {
//         const worker = new Worker('./middlewares/worker.js', {
//           resourceLimits: {
//             maxOldGenerationSizeMb: os.freemem() / 2 / 1024 / 1024,
//             maxYoungGenerationSizeMb: os.cpus().length / 2
//           }
//         });
//         worker.postMessage({ fileName, filePath });
//         worker.on('message', (message) => {
//           console.log(message);
//         });
//         worker.on('error', (err) => {
//           console.error('Worker error:', err);
//         });
//      } catch (e) {
//          console.log('Something went wrong : ' + e);
//      }

// }


function isMp4File(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const videoExtensions = ['.mp4', '.webm'];
  return videoExtensions.includes(extname);
}
async function generateThumbnail(filePath, thumbnailPath) {
  if (!sharp) return;
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);

      if (buffer.length > 0) {
        const thumbnailBuffer = await sharp(buffer)
          .blur(1)
          .resize(10)
          .toBuffer();
        fs.writeFileSync(thumbnailPath, thumbnailBuffer);
        console.log(`Thumbnail generated at ${thumbnailPath}`);
      } else {
        console.error("Error: Input buffer is empty, thumbnail generation failed.");
      }
    } else {
      console.error("Error: File does not exist for thumbnail generation.");
    }
  } catch (error) {
    console.error("Error generating thumbnail:", error);
  }
}

/* The name (and public path) a media file will be stored under, decided before it is moved so it can be journaled. */
const planMediaFile = (file, index = 0) => {
  // mp4/webm are stored without extension (legacy layout; the HLS pipeline derives folder names from it)
  const keepExtension = !isMp4File(file.name);
  const storedName = planStoredName(file, { kind: 'media', keepExtension, index });
  return { storedName, filepath: "/uploads/common/" + storedName };
};

/* Validates and stores one file below uploads/common; returns the metadata entry kept in chapter_files. */
const storeMediaFile = async (file, index = 0, plan = null) => {
  const keepExtension = !isMp4File(file.name);
  const { storedName, destination } = await saveUpload(file, { subdir: 'common', kind: 'media', keepExtension, index, storedName: plan?.storedName });

  if (isImageFile(destination)) {
    const thumbnailPath = path.join(__dirname, '../files/uploads/common/thumbnails', storedName);
    await generateThumbnail(destination, thumbnailPath);
  }
  return {
    filename: file.name,
    mimetype: file.mimetype,
    size: file.size,
    filepath: "/uploads/common/" + storedName,
    type: "localStorage",
  };
};

/* Stores the files uploaded under `label` and sets req[label] to the metadata array the controllers persist.
 * Throws UploadError (status 400) for disallowed files; callers already wrap this in try/catch. */
const uploadFiles = async (label, req, res) => {
  if (!req.files || !req.files[label]) {
    req[label] = null;
    return;
  }
  const incoming = req.files[label];
  const files = Array.isArray(incoming) ? incoming : [incoming];
  // validate everything first so a rejected batch leaves nothing behind
  files.forEach((file) => validateFile(file, 'media'));

  const returnPath = [];
  for (let index = 0; index < files.length; index++) {
    returnPath.push(await storeMediaFile(files[index], index));
  }
  req[label] = returnPath;
};

const UPLOADS_PUBLIC_PREFIX = '/uploads/';

/* Only paths below /uploads/ that came from our own database are ever removed. */
const deleteFile = async (filePath) => {
  try {
    if (typeof filePath !== 'string' || !filePath.startsWith(UPLOADS_PUBLIC_PREFIX) || filePath.split('/').includes('..') || filePath.includes('\\')) return
    const root = path.resolve(__dirname, '..', 'files');
    const target = path.resolve(root, '.' + filePath);
    if (!target.startsWith(root + path.sep)) return;
    if (fs.existsSync(target)) {
      fs.unlink(target, (err) => {})
    }
    if (isImageFile(filePath)) {
      const thumbnailPath = path.resolve(root, '.' + filePath.replace('uploads/common', 'uploads/common/thumbnails'));
      if (thumbnailPath.startsWith(root + path.sep) && fs.existsSync(thumbnailPath)) {
        fs.unlink(thumbnailPath, (err) => {})
      }
    }

    const fileName = path.basename(filePath);
    const videoDir = path.resolve(root, 'uploads', 'videos', fileName);
    if (videoDir.startsWith(path.resolve(root, 'uploads', 'videos') + path.sep) && fs.existsSync(videoDir)) {
        fs.rm(videoDir, { recursive: true, force: true }, (err) => {});
    }
    return
  } catch(e) {console.log('error ',e)}
}

module.exports = uploadFiles;
module.exports.deleteFile = deleteFile;
module.exports.uploadFiles = uploadFiles;
module.exports.storeMediaFile = storeMediaFile;
module.exports.planMediaFile = planMediaFile;
