/** @internal */
declare const REACT_APP_AGORA_APP_SDK_DOMAIN: string;
/** @internal */
declare const REACT_APP_AGORA_APP_SDK_LOG_SECRET: string;
/** @internal */
declare module "worker-loader!*" {
  /** @internal */
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}