/// <reference types="react-scripts" />
/// <reference types="./sdk/education/interfaces" />

declare const REACT_APP_AGORA_APP_SDK_DOMAIN: string;
declare const REACT_APP_AGORA_APP_SDK_LOG_SECRET: string;
interface RtmTextMessage {
  text: string;
  messageType?: 'TEXT';
  rawMessage?: never;
  description?: never;
}

interface RtmRawMessage {
  rawMessage: Uint8Array;
  description?: string;
  messageType?: 'RAW';
  text?: never;
}

type RtmMessage = RtmTextMessage | RtmRawMessage;

declare interface RecordState {
  roomId: string
  recordId: string
  isRecording: number
  recordingTime: number
}

type RecordStateParams = RecordState

declare interface RecordingConfigParams {
  maxIdleTime: number, // seconds
  streamTypes: number,
  channelType: number,
  transcodingConfig: any,
  subscribeVideoUids: Array<string>,
  subscribeAUdioUids: Array<string>,
  subscribeUidGroup: number,
}

declare interface StorageConfigParams {
  vendor: number
  region: number
  accessKey: string
  bucket: string
  secretKey: string
  fileNamePrefix: Array<string>
}

declare interface RecordingConfig {
  recordingConfig: Partial<RecordingConfigParams>
  storageConfig?: Partial<StorageConfigParams>
}

/** @ignore */
declare module 'react-gtm-module'
/** @ignore */
declare module 'eruda'

/** @ignore */
declare module 'js-md5' {
  const MD5: any;
  export default MD5;
}

/** @ignore */
declare module 'ua-parser-js' {
  const UAParserJs: any;
  export default UAParserJs;
}

declare interface Device {
  deviceId: string
  label: string
  kind: string
}

/** @ignore */
declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

/** @ignore */
declare module '*.scss';