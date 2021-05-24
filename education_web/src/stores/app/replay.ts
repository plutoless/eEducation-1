import { EduRecordService } from './../../sdk/record/edu-record-service';
import { BoardClient } from '@/components/netless-board/board-client';
import { AppStore } from '@/stores/app';
import { observable, action, computed } from "mobx";
import CombinePlayerFactory from '@netless/combine-player';
import { t } from '@/i18n';
import { PlayerPhase } from 'white-web-sdk';

const cdnPrefix = 'https://agora-adc-artifacts.oss-accelerate.aliyuncs.com'

export function getOSSUrl (mediaUrl: string): string {
  const res = `${cdnPrefix}/${mediaUrl}`;
  console.log("resolve: ", res, cdnPrefix);
  return res;
}

export class ReplayStore {

  @observable
  roomUuid: string = ''

  @observable
  boardUuid: string = ''

  @observable
  boardPreparing: boolean = false

  @observable
  statusText: string = ''

  @observable
  startTime: number = 0

  @observable
  endTime: number = 0

  appStore: AppStore
  boardClient: BoardClient
  recordService: EduRecordService
  combinePlayer: any;

  constructor(appStore: AppStore) {
    this.appStore = appStore
    this.boardClient = new BoardClient({identity: 'host'})
    this.recordService = new EduRecordService('')
  }

  @observable
  ready: boolean = true;

  @observable
  online: boolean = false;

  @computed
  get duration(): number {
    return Math.abs(this.startTime - this.endTime)
  }

  @observable
  player: any = undefined

  @observable
  currentTime: number = 0

  @action
  setCurrentTime(t: number) {
    this.currentTime = t
  }

  @observable
  playFailed: boolean = false

  @action
  setReplayFail(v: boolean) {
    this.playFailed = v
  }

  @observable
  phase: any = ''

  @action
  updatePhaseState(v: any) {
    this.phase = v
  }

  @observable
  firstFrame: boolean = false

  @action
  loadFirstFrame() {
    this.firstFrame = true
    if (this.combinePlayer) {
      this.combinePlayer.seek(0)
    }
  }

  @action
  async replay($el: HTMLVideoElement) {
    console.log("[replay] replayed", $el);
    this.boardClient.on('onCatchErrorWhenRender', error => {
      console.warn('onCatchErrorWhenRender', error)
    })
    this.boardClient.on('onCatchErrorWhenAppendFrame', error => {
      console.warn('onCatchErrorWhenAppendFrame', error)
    })
    this.boardClient.on('onPhaseChanged', state => {
      this.updatePhaseState(state)
    })
    this.boardClient.on('onLoadFirstFrame', state => {
      this.loadFirstFrame()
      console.log('onLoadFirstFrame', state)
    })
    this.boardClient.on('onSliceChanged', () => {
      console.log('onSliceChanged')
    })
    this.boardClient.on('onPlayerStateChanged', state => {
      console.log('onPlayerStateChanged', state)
    })
    this.boardClient.on('onStoppedWithError', error => {
      this.appStore.uiStore.addToast(t('toast.replay_failed'))
      this.setReplayFail(true)
      console.warn('onStoppedWithError', JSON.stringify(error))
    })
    this.boardClient.on('onProgressTimeChanged', scheduleTime => {
      this.setCurrentTime(scheduleTime)
    })
    try {
      await this.boardClient.replay({
        beginTimestamp: this.startTime,
        duration: this.duration,
        room: this.boardId,
        // mediaURL: `${cdnPrefix}/${this.mediaUrl}`,
        roomToken: this.boardToken,
      });
      this.player = this.boardClient.player
      this.player.disableCameraTransform = true
      const combinePlayerFactory = new CombinePlayerFactory(this.player, {
        url: getOSSUrl(this.mediaUrl) as string,
        videoElementID: 'whiteboard',
      }, true)
      const combinePlayer = combinePlayerFactory.create()
      combinePlayer.setOnStatusChange((status: any, message: any) => {
        console.log("[aclass] [replay] combine player status: ", status, message)
      })
      this.combinePlayer = combinePlayer
      // this.player.seekToProgressTime(0);
    } catch (err) {
      this.appStore.uiStore.addToast(t('toast.replay_failed'))
      throw err
    }

    this.player.bindHtmlElement($el)
    this.online = true
    window.addEventListener('keydown', (evt: any) => {
      if (evt.code === 'Space') {
        const player = this.player
        if (this.online && player) {
          switch (player.phase) {
            case PlayerPhase.WaitingFirstFrame:
            case PlayerPhase.Pause: {
              player.play();
              break;
            }
            case PlayerPhase.Playing: {
              player.pause();
              break;
            }
            case PlayerPhase.Ended: {
              player.seekToProgressTime(0);
              break;
            }
          }
        }
      }
    })
    window.addEventListener('resize', () => {
      if (this.online && this.player) {
        this.player.refreshViewSize();
      }
    })
  }

  @observable
  recordStatus: number = 0

  @observable
  mediaUrl: string = ''

  @observable
  boardId: string = ''

  @observable
  boardToken: string = ''

  @computed
  get totalTime(): number {
    return Math.abs(this.startTime - this.endTime)
  }

  pauseCurrentTime() {
    if (this.online && this.combinePlayer) {
      this.combinePlayer.pause()
    }
  }

  seekToCurrentTime() {
    const combinePlayer = this.combinePlayer
    if (this.online && combinePlayer) {
      combinePlayer.seek(this.currentTime);
      combinePlayer.play();
    }
  }

  @observable
  progress: number = 0

  @action
  updateProgress(v: number) {
    this.progress = v;
    this.currentTime = v;
    // this.replayMessages = this.chatMessages.filter((it: any) => (this.startTime + this.currentTime >= it.ms))
    this.combinePlayer.seek(v)
  }

  handlePlayerClick() {
    const combinePlayer = this.combinePlayer
    if (this.online && combinePlayer) {
      if (this.phase === PlayerPhase.Playing) {
        combinePlayer.pause();
        return;
      }
      if (this.phase === PlayerPhase.WaitingFirstFrame || this.phase === PlayerPhase.Pause) {
        combinePlayer.play();
        return;
      }
  
      if (this.phase === PlayerPhase.Ended) {
        combinePlayer.seekToProgressTime(0);
        combinePlayer.play();
        return;
      }
    }
  }

  @action
  async getCourseRecordBy(roomUuid: string) {
    if (this.recordStatus === 2 && this.mediaUrl) {
      // console.log("recordStatus changed", roomUuid)
      return
    }
    try {
      let res = await this.recordService.getCourseRecordBy(roomUuid)
      const recordList = res.list
      recordList.sort((prev: any, cur: any) => {
        return prev.startTime - cur.startTime
      })
      const lastRecord = recordList.slice(-1)[0]
      const record = lastRecord
      if (record) {
        this.recordStatus = record.status
        this.boardId = record.boardId
        this.boardToken = record.boardToken
        this.statusText = record.statusText
        this.startTime = record.startTime
        this.endTime = record.endTime
        this.mediaUrl = record.url
        this.currentTime = 0
        console.log("record", record)
      }
    } catch (err) {
      this.appStore.uiStore.addToast(t('toast.failed_to_query_playback_list') + `${err.msg}`)
      throw err
    }
  }

  @action
  reset () {
    this.roomUuid = ''
    this.boardUuid = ''
    this.boardPreparing = false
    this.recordStatus = 0
    this.startTime = 0
    this.endTime = 0
    this.mediaUrl = ''
    this.boardId = ''
    this.boardToken = ''
    this.statusText = ''
    this.currentTime = 0
    this.player = undefined
    this.combinePlayer = undefined
    window.removeEventListener('resize', () => {})
    window.removeEventListener('keydown', () => {})
  }
}