declare class Transcode {
    inputPath: string;
    outputPath: string;
    options: any | undefined;
    constructor(inputPath: string, outputPath: string, options: any);
    transcode(): Promise<unknown>;
    buildCommands(): Promise<unknown>;
    writePlaylist(): Promise<unknown>;
}
export declare const Transcoder: typeof Transcode;
export {};
