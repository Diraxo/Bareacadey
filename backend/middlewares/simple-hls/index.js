"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transcoder = void 0;
const child_process_1 = require("child_process");
const default_renditions_1 = __importDefault(require("./default-renditions"));
const fs_1 = __importDefault(require("fs"));
class Transcode {
    constructor(inputPath, outputPath, options) {
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.options = options || {};
    }
    transcode() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const commands = yield this.buildCommands();
            const masterPlaylist = yield this.writePlaylist();
            // let coms = [
            //     '-hide_banner',
            //     '-y',
            //     '-i',
            //     './files/uploads/test.mp4',
            //     '-vf',
            //     'scale=w=640:h=360:force_original_aspect_ratio=decrease',
            //     '-c:a',
            //     'aac',
            //     '-ar',
            //     '48000',
            //     '-c:v',
            //     'h264',
            //     '-profile:v',
            //     'main',
            //     '-crf',
            //     '20',
            //     '-sc_threshold',
            //     '0',
            //     '-g',
            //     '48',
            //     '-hls_time',
            //     '4',
            //     '-hls_playlist_type',
            //     'vod',
            //     '-b:v',
            //     '800k',
            //     '-maxrate',
            //     '856k',
            //     '-bufsize',
            //     '1200k',
            //     '-b:a',
            //     '96k',
            //     '-hls_segment_filename',
            //     './files/uploads/videos/test//360p_%03d.ts',
            //     './files/uploads/videos/test//360.m3u8',
            //     '-vf',
            //     'scale=w=842:h=480:force_original_aspect_ratio=decrease',
            //     '-c:a',
            //     'aac',
            //     '-ar',
            //     '48000',
            //     '-c:v',
            //     'h264',
            //     '-profile:v',
            //     'main',
            //     '-crf',
            //     '20',
            //     '-sc_threshold',
            //     '0',
            //     '-g',
            //     '48',
            //     '-hls_time',
            //     '4',
            //     '-hls_playlist_type',
            //     'vod',
            //     '-b:v',
            //     '1400k',
            //     '-maxrate',
            //     '1498k',
            //     '-bufsize',
            //     '2100k',
            //     '-b:a',
            //     '128k',
            //     '-hls_segment_filename',
            //     './files/uploads/videos/test//480p_%03d.ts',
            //     './files/uploads/videos/test//480.m3u8',
            //     '-vf',
            //     'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
            //     '-c:a',
            //     'aac',
            //     '-ar',
            //     '48000',
            //     '-c:v',
            //     'h264',
            //     '-profile:v',
            //     'main',
            //     '-crf',
            //     '20',
            //     '-sc_threshold',
            //     '0',
            //     '-g',
            //     '48',
            //     '-hls_time',
            //     '4',
            //     '-hls_key_info_file',
            //     './files/uploads/hls-key/enc.keyinfo',
            //     '-hls_playlist_type',
            //     'vod',
            //     '-b:v',
            //     '2800k',
            //     '-maxrate',
            //     '2996k',
            //     '-bufsize',
            //     '4200k',
            //     '-b:a',
            //     '128k',
            //     '-hls_segment_filename',
            //     './files/uploads/videos/test//720p_%03d.ts',
            //     './files/uploads/videos/test//720.m3u8',
            // ]
            // console.log(this?.options?.ffmpegPath);
            const ls = (0, child_process_1.spawn)(this?.options?.ffmpegPath, commands);
            let showLogs = true;
            if (this.options.showLogs == false) {
                showLogs = false;
            }
            ls.stdout.on('data', (data) => {
                if (showLogs) {
                    console.log(data.toString());
                }
            });
            ls.stderr.on('data', (data) => {
                if (showLogs) {
                    console.log(data.toString());
                } 
            });
            ls.on('exit', (code) => {
                if (showLogs) {
                    console.log(`Child exited with code ${code}`);
                }
                if (code == 0)
                    return resolve(masterPlaylist);
                return reject('Video Failed to Transcode');
            });
        }));
    }
    buildCommands() {
        return new Promise((resolve, reject) => {
            let commands = ['-hide_banner', '-y', '-i', this.inputPath];
            const renditions = this.options.renditions || default_renditions_1.default;
            for (let i = 0, len = renditions.length; i < len; i++) {
                const r = renditions[i];
                commands = commands.concat(['-vf', `scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=decrease`, '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264', `-profile:v`, r.profile, '-crf', '20', '-sc_threshold', '0', '-g', '48', '-hls_time', r.hlsTime, '-hls_playlist_type', 'vod', '-b:v', r.bv, '-maxrate', r.maxrate, '-bufsize', r.bufsize, '-b:a', r.ba,'-hls_key_info_file','./files/uploads/hls-key/enc.keyinfo', '-hls_segment_filename',`${this.outputPath}/${r.ts_title}_%03d.ts`, `${this.outputPath}/${r.height}.m3u8`]);
            }
            resolve(commands);
        });
    }
    writePlaylist() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let m3u8Playlist = `#EXTM3U
#EXT-X-VERSION:3`;
            const renditions = this.options.renditions || default_renditions_1.default;
            for (let i = 0, len = renditions.length; i < len; i++) {
                const r = renditions[i];
                m3u8Playlist += `
#EXT-X-STREAM-INF:BANDWIDTH=${r.bv.replace('k', '000')},RESOLUTION=${r.width}x${r.height}
${r.height}.m3u8`;
            }
            const m3u8Path = `${this.outputPath}/index.m3u8`;
            fs_1.default.writeFileSync(m3u8Path, m3u8Playlist);
            resolve(m3u8Path);
        }));
    }

    // writePlaylist() {
    //     return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
    //         let m3u8Playlist = `#EXTM3U
    // #EXT-X-VERSION:3`;
    //         const renditions = this.options.renditions || default_renditions_1.default;
    
    //         // Add auto resolution entry
    //         m3u8Playlist += `
    // #EXT-X-STREAM-INF:BANDWIDTH=AUTO
    // auto.m3u8`;
    
    //         for (let i = 0, len = renditions.length; i < len; i++) {
    //             const r = renditions[i];
    //             m3u8Playlist += `
    // #EXT-X-STREAM-INF:BANDWIDTH=${r.bv.replace('k', '000')},RESOLUTION=${r.width}x${r.height}
    // ${r.height}.m3u8`;
    //         }
    
    //         const m3u8Path = `${this.outputPath}/index.m3u8`;
    //         fs_1.default.writeFileSync(m3u8Path, m3u8Playlist);
    //         resolve(m3u8Path);
    //     }));
    // }
    
}
exports.Transcoder = Transcode;
/*
const t = new Transcoder(`${__dirname}/test.mp4`, `${__dirname}/output`, {});
t.transcode();
*/ 
