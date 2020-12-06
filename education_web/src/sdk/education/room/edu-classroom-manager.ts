import { MediaService } from './../core/media-service/index';
import { EduClassroomDataController } from './edu-classroom-data-controller';
import { EduUserService } from '../user/edu-user-service';
import { EduLogger } from '../core/logger';
import { AgoraEduApi } from '../core/services/edu-api';
import { EventEmitter } from 'events';
import { EduManager } from "../manager";
import { EduStreamData, EduUserData, EduUser, EduStream, EduRoleType, EduClassroom, EduVideoSourceType, EduChannelMessageCmdType, EduClassroomStateType, EduTextMessage, EduStreamAction, EduCustomMessage } from '../interfaces';
import { get } from 'lodash';
import { RTMWrapper } from '../core/rtm';
import { MessageSerializer } from '../core/rtm/message-serializer';

export type ClassroomJoinOption = {
  userRole: string
  roomUuid: string
  userName: string
  userUuid: string
  autoPublish?: boolean
}

export type EduClassroomInitParams = {
  eduManager: EduManager
  roomUuid: string
  roomName: string
  apiService: AgoraEduApi
  // rtcProvider: any
}

export declare interface EduClassroomManager {
  //@internal
  on(event: 'seqIdChanged', listener: (evt: any) => void): this
  /**
   * This is local user updated event
   * @param event 'local-user-updated'
   * @param listener 
   */
  on(event: 'local-user-updated', listener: (evt: any) => void): this
    /**
   * This is local user removed event
   * @param event 'local-user-removed'
   * @param listener 
   */
  on(event: 'local-user-removed', listener: (evt: any) => void): this
    /**
   * This is local stream removed event
   * @param event 'local-stream-removed'
   * @param listener 
   */
  on(event: 'local-stream-removed', listener: (evt: any) => void): this
    /**
   * This is local stream updated event
   * @param event 'local-stream-updated'
   * @param listener 
   */
  on(event: 'local-stream-updated', listener: (evt: any) => void): this
    /**
   * This is remote user added event
   * @param event 'remote-user-added'
   * @param listener 
   */
  on(event: 'remote-user-added', listener: (evt: any) => void): this
  /**
   * This is remote user updated event
   * @param event 'remote-user-updated'
   * @param listener 
   */
  on(event: 'remote-user-updated', listener: (evt: any) => void): this
  /**
   * This is local user updated event
   * @param event 'local-user-updated
   * @param listener 
   */
  on(event: 'remote-user-removed', listener: (evt: any) => void): this
    /**
   * This is local user updated event
   * @param event 'local-user-updated
   * @param listener 
   */
  on(event: 'remote-stream-added', listener: (evt: any) => void): this
  /**
   * This is remote stream removed
   * @param event 'remote-stream-removed'
   * @param listener 
   */
  on(event: 'remote-stream-removed', listener: (evt: any) => void): this
  /**
   * This is remote stream updated
   * @param event 'remote-stream-updated'
   * @param listener 
   */
  on(event: 'remote-stream-updated', listener: (evt: any) => void): this
    /**
   * This is classroom property updated
   * @param event 'classroom-property-updated'
   * @param listener 
   */
  on(event: 'classroom-property-updated', listener: (evt: any) => void): this
    /**
   * This is room chat message
   * @param event 'room-chat-message'
   * @param listener 
   */
  on(event: 'room-chat-message', listener: (evt: any) => void): this
}

/**
 * This class is used to connect with agora.io edu backend service.
 * There is a userService, which provide the sender responsibility to interactive with other classroom user participants.
 * It is only provide the message-passing and message receiving in the edu scenarios.
 * @class EduClassroomManager
 */
export class EduClassroomManager extends EventEmitter {

  /** @internal */
  private _roomUuid: string

  /** @internal */
  private rawRoomUuid: string = ''
  
  /** @internal */
  private _roomName: string
  /** @internal */
  private eduManager: EduManager
  /** @internal */
  private _apiService?: AgoraEduApi
  /** @internal */
  private _userService?: EduUserService
  /** @internal */
  private _rtmObserver?: EventEmitter
  // private _mediaService?: MediaService

  constructor(payload: EduClassroomInitParams) {
    super()
    this.eduManager = payload.eduManager
    this.rawRoomUuid = payload.roomUuid
    this._roomUuid = payload.roomUuid
    this._roomName = payload.roomName
    this._apiService = payload.apiService
    this._userService = undefined
    this._rtmObserver = undefined
    // this._mediaService = new MediaService(payload.rtcProvider)
  }

  /** @internal */
  public get syncingData(): boolean {
    const states = ['DISCONNECTED', 'RECONNECTING']
    if (states.includes(this.eduManager.rtmConnectionState)) {
      return false
    } else {
      this.data
    }    
    return true
  }

  /**
   * Get current roomName
   * @returns roomName
   */
  public get roomName(): string {
    return this._roomName as string
  }

  /**
   * Get current roomUuid
   * @returns roomUuid
   */
  public get roomUuid(): string {
    return this._roomUuid as string
  }

  /**
   * Get current apiService
   * @returns apiService
   */
  public get apiService(): AgoraEduApi {
    return this._apiService as AgoraEduApi
  }

  /**
   * Get current local user info
   * @returns localUser
   */
  public get localUser(): EduUserData {
    return this.data.localUser
  }

  /**
   * Get current local user service
   * @returns userService
   */
  get userService(): EduUserService {
    return this._userService as EduUserService
  }

  /**
   * Get current internal data controller,
   * It contains the room manager living data from {@link agora.io education backend service}.
   * @returns edu classroom data
   */
  get data(): EduClassroomDataController {
    return this.eduManager._dataBuffer[this.rawRoomUuid] as EduClassroomDataController
  }

  /** @internal */
  private async prepareRoomJoin(args: any) {
    console.log('[breakout] params ', args.userRole)
    let joinRoomData = await this.apiService.joinRoom({
      roomUuid: args.roomUuid,
      userRole: args.userRole,
      userName: args.userName,
      userUuid: args.userUuid,
      // autoPublish: args.autoPublish,
      streamUuid: args.streamUuid ? args.streamUuid : `0`
    })
    return joinRoomData
    
    // this.eduManager._dataBuffer[this.roomUuid] = this.data
  }

  /** @internal */
  private get rtmWrapper(): RTMWrapper {
    return this.eduManager._rtmWrapper as RTMWrapper;
  }

  /**
   * Run the join for start live room lifecycle
   * @param params is a object of {@link ClassroomJoinOption}
   * @returns join result
   */
  async join(params: ClassroomJoinOption) {
    EduLogger.debug(`join classroom ${this.roomUuid}`)
    const roomParams = {
      ...params,
      roomUuid: this.roomUuid,
      roomName: this.roomName,
    }
    let joinRoomData = await this.prepareRoomJoin(roomParams)
    EduLogger.debug(`join classroom [prepareRoomJoin] ${this.roomUuid} success`)
    if (this.rtmWrapper) {
      const [channel, observer] = this.rtmWrapper.createObserverChannel({
        channelName: this.roomUuid,
      })
      observer.on('ChannelMessage', (evt: any) => {
        console.log("[rtm] ChannelMessage channelName", evt.channelName)
        if (evt.channelName !== this.roomUuid) {
          return
        }
        try {
          const res = MessageSerializer.readMessage(evt.message.text)
          if (res === null) {
            return console.warn('[room] ChannelMessage is invalid', res)
          }
          const { sequence, cmd, version, data } = res
          EduLogger.info('[EDU-STATE] Raw ChannelMessage', JSON.stringify(res))
          if (version !== 1) {
            return EduLogger.warn('using old version')
          }

          // if (cmd === EduChannelMessageCmdType.roomChatState) {
          //   const textMessage: EduTextMessage = MessageSerializer.getEduTextMessage(data)
          //   this.data.isLocalUser(textMessage.fromUser.userUuid)
          //   return
          // }

          const obj = {
            seqId: sequence,
            cmd,
            data
          }

          console.log("appendBuffer in Raw Message ",obj)
          
          this.data.appendBuffer({
            seqId: sequence,
            cmd,
            data
          })
          this.data.asyncBatchUpdateData(500)
        } catch (err) {
          console.error(err)
        }
      })

      await this.rtmWrapper.join(
        channel, observer,
        {
          channelName: this.roomUuid,
        }
      )

      this._rtmObserver = observer
      this.data.setLocalData(joinRoomData)
      await this.data.syncFullSequence()
      this.data.BatchUpdateData()
      this._userService = new EduUserService(this)
      EduLogger.debug(`join classroom ${this.roomUuid} success`)
    }
  }

  async leave() {
    if (this._rtmObserver) {
      this._rtmObserver.removeAllListeners()
      this._rtmObserver = undefined
    }
    EduLogger.debug(`leave classroom ${this.roomUuid}`)
    if (this.eduManager._rtmWrapper) {
      EduLogger.debug(`leave this.rtmWrapper ${this.roomUuid}`)
      await this.eduManager._rtmWrapper.leave({
        channelName: this.roomUuid,
      })
      delete this.eduManager._dataBuffer[this.rawRoomUuid]
      EduLogger.debug(`leave classroom ${this.roomUuid} success`)
    }
  }

  /**
   * @returns user token
   */
  get userToken() {
    return this.data.userToken
  }

  /** @internal */
  async joinRTC(params: any) {
    // EduLogger.debug(`joinRTC ${this.roomUuid}`)
    // if (this._mediaService) {
    //   await this._mediaService.join(params)
    //   EduLogger.debug(`joinRTC ${this.roomUuid} success`)
    // }
  }

  /** @internal */
  async leaveRTC() {
    // EduLogger.debug(`leaveRTC ${this.roomUuid}`)
    // if (this._mediaService) {
    //   await this._mediaService.leave()
    //   EduLogger.debug(`leaveRTC ${this.roomUuid} success`)
    // }
  }

  /**
   * @returns local stream data
   */
  getLocalStreamData(): EduStreamData {
    return this.data.localStreamData
  }

  /**
   * @returns local screen data
   */
  getLocalScreenData(): EduStreamData {
    return this.data.localScreenShareStream
  }

  /**
   * @returns local user data
   */
  getLocalUser(): EduUserData {
    return this.data.localUser
  }

  /**
   * @returns full users list
   */
  getFullUserList(): EduUser[] {
    return this.data.userList.map((t: EduUserData) => t.user);
  }

  /**
   * @returns full stream list
   */
  getFullStreamList(): EduStream[] {
    return this.data.streamList.map((t: EduStreamData) => t.stream);
  }

  /** @internal */
  private get classroom(): EduClassroom {
    return {
      roomInfo: this.data.roomInfo,
      roomProperties: this.data.roomProperties,
      roomStatus: this.data.roomState,
    }
  }

  /**
   * @returns edu classroom
   */
  getClassroomInfo(): EduClassroom {
    return this.classroom;
  }

  /**
   * @returns students count
   */
  getStudentCount(): number {
    return this.data.userList
      .filter((it: EduUserData) => it.user.role === EduRoleType.student).length
  }

  /**
   * @returns teachers count @type number
   */
  getTeacherCount(): number {
    return this.data.userList
      .filter((it: EduUserData) => it.user.role === EduRoleType.teacher).length
  }


  /**
   * Run studentList getter method return students list
   * @returns students list @type EduUser[]
   */
  get studentList(): EduUser[] {
    return this.data.userList
      .filter((it: EduUserData) => it.user.role === EduRoleType.student)
      .map((it: EduUserData) => it.user)
  }

  /**
   * Run teacherList getter method return teachers list
   * @returns teachers list
   */
  get teacherList(): EduUser[] {
    return this.data.userList
      .filter((it: EduUserData) => it.user.role === EduRoleType.teacher)
      .map((it: EduUserData) => it.user)
  }

  /**
   * alias method for {@link teacherList}
   * @returns teachers list
   */
  getTeacherList(): EduUser[] {
    return this.teacherList;
  }

  /**
   * alias method for {@link studentList}
   * @returns students list
   */
  getStudentList(): EduUser[] {
    return this.studentList;
  }
}