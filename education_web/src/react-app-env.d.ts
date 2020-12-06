/// <reference types="react-scripts" />

/** @internal */
interface RtmTextMessage {
  text: string;
  messageType?: 'TEXT';
  rawMessage?: never;
  description?: never;
}
/** @internal */
interface RtmRawMessage {
  rawMessage: Uint8Array;
  description?: string;
  messageType?: 'RAW';
  text?: never;
}
/** @internal */
type RtmMessage = RtmTextMessage | RtmRawMessage;
/** @internal */
declare interface RecordState {
  roomId: string
  recordId: string
  isRecording: number
  recordingTime: number
}
/** @internal */
type RecordStateParams = RecordState
/** @internal */
declare interface RecordingConfigParams {
  maxIdleTime: number, // seconds
  streamTypes: number,
  channelType: number,
  transcodingConfig: any,
  subscribeVideoUids: Array<string>,
  subscribeAUdioUids: Array<string>,
  subscribeUidGroup: number,
}
/** @internal */
declare interface StorageConfigParams {
  vendor: number
  region: number
  accessKey: string
  bucket: string
  secretKey: string
  fileNamePrefix: Array<string>
}
/** @internal */
declare interface RecordingConfig {
  recordingConfig: Partial<RecordingConfigParams>
  storageConfig?: Partial<StorageConfigParams>
}

/** @hidden */
declare module 'react-gtm-module'
/** @hidden */
declare module 'eruda'

/** @internal */
declare module 'js-md5' {
  const MD5: any;
  export default MD5;
}

/** @internal */
declare module 'ua-parser-js' {
  const UAParserJs: any;
  export default UAParserJs;
}
/** @internal */
declare interface Device {
  deviceId: string
  label: string
  kind: string
}

/** @hidden */
declare module '*.scss';