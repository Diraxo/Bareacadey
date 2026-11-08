const os = require('os');
const { Worker } = require('worker_threads');
const express = require('express');
const config = require('./config');
const app = express();
const port = config.hls.port;

const path = require('path');
const fs = require('fs');

app.use(express.json());

const getSystemLoad = () => {
  const load = os.loadavg();
  return load[0]; // 1-minute load average
};

const getFreeMemory = () => {
  return os.freemem();
};

const convertToHls = async (fileName, filePath, fileSize) => {
  try {
    const systemLoad = getSystemLoad();
    const freeMemory = getFreeMemory();
    const requiredMemory = fileSize * 2; // Estimate memory requirement (adjust multiplier as needed)

    if (systemLoad < 1 && freeMemory > requiredMemory) {
      const worker = new Worker('./middlewares/worker.js');
      worker.postMessage({ fileName, filePath });
      worker.on('message', (message) => {
        console.log(message);
      });
      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });
    } else {
      console.log('System load is too high or not enough memory, delaying task.');
      throw new Error('Not enough memory or system load is too high');
    }
  } catch (e) {
    console.log('Something went wrong: ' + e.message);
    throw e;
  }
};

app.post('/convert_to_hls', async (req, res) => {
  const { filePath } = req.body;
  try {
    if (typeof filePath !== 'string' || !filePath) {
      return res.status(400).json({ error: true, message: 'filePath is required' });
    }
    const fileName = path.basename(filePath);
    // only plain stored file names are accepted (no dot-files, separators or traversal)
    if (!/^[A-Za-z0-9._-]+$/.test(fileName) || fileName.startsWith('.')) {
      return res.status(400).json({ error: true, message: 'Invalid file name' });
    }
    const videoDir = `./files/uploads/videos/${fileName}`;
    const fPath = path.join(__dirname, "./files/uploads/common/" + fileName);
    const fileSize = fs.statSync(fPath).size; // Get the file size
    const successfullyConvertedPath = path.join(videoDir, 'successfully_converted');
    const transcodingStartedPath = path.join(videoDir, 'transcoding_started');

    if (fs.existsSync(successfullyConvertedPath)) {
      return res.json({ error: true, message: "Already Existed" });
    }

    if (fs.existsSync(transcodingStartedPath)) {
      return res.json({ error: true, message: "Task In Progress" });
    }

    await convertToHls(fileName, fPath, fileSize);
    return res.json({ message: "Task Started" });

  } catch (e) {
    console.error('convert_to_hls failed:', e.message);
    return res.status(500).json({ error: true, message: "Could not start the conversion" });
  }
});

// Internal task server: bound to loopback by default so it is never reachable from the internet.
app.listen(port, config.hls.host, () => {
  console.log(`FFmpeg task server listening at ${config.hls.host}:${port}`);
});
