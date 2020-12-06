import { EduLogger } from './../core/logger/index';
import { EduClassroomDataController } from './../room/edu-classroom-data-controller';
import { EduClassroomManager } from '@/sdk/education/room/edu-classroom-manager';
import { EventEmitter } from 'events';
import { EduStreamData, EduVideoConfig, EduRoleType, EduVideoSourceType, EduAudioSourceType, EduCourseState, EduShareScreenConfig, EduUserData } from '../interfaces';
import { EduRenderConfig, EduStream, EduUser, EduSubscribeOptions, EduStreamConfig } from '../interfaces';
import { AgoraEduApi } from '../core/services/edu-api';

export interface EduModelViewOption {
  dom: HTMLElement
  stream: EduStream
  config?: EduRenderConfig
}

export enum PeerInviteEnum {
  studentApply = 1,
  teacherReject = 2,
  studentCancel = 3,
  teacherAccept = 4,
  teacherStop = 5,
  studentStop = 6
}
export interface IEduUserService {
  // setVideoConfig(config: EduVideoConfig): void;

  // startOrUpdateLocalStream(eduStreamConfig: EduStreamConfig): Promise<any>;

  // switchCamera(label: string): Promise<any>;

  // switchMicrophone(label: string): Promise<any>;

  // subscribeStream(stream: EduStream, options: EduSubscribeOptions): Promise<any>;

  // unsubscribeStream(stream: EduStream, options: EduSubscribeOptions): Promise<any>;

  publishStream(stream: EduStream): Promise<any>;

  unpublishStream(stream: EduStream): Promise<any>;

  sendRoomMessage(message: string): Promise<any>;

  sendUserMessage(message: string, remoteUser: EduUser): Promise<any>;  

  sendRoomChatMessage(message: string, remoteUser: EduUser): Promise<any>;

  sendUserChatMessage(message: string, remoteUser: EduUser): Promise<any>;
}

/**
 * This class is provided user service ability.
 * It supposed used in EduClassroomManager.
 * It is bridge to backend room manager for most edu scenario.
 * You can use this class to interactive with the same room participants.
 */
export class EduUserService extends EventEmitter implements IEduUserService {

  /** @internal */
  roomManager!: EduClassroomManager;

  /** @internal */
  constructor(roomManager: EduClassroomManager) {
    super();
    this.roomManager = roomManager;
  }

  /**
   * roomUuid
   */
  get roomUuid(): string {
    return this.roomManager.roomUuid
  }

  /**
   * apiService only used internal
   */
  get apiService(): AgoraEduApi {
    return this.roomManager.apiService;
  }

  /**
   * localUser info
   */
  get localUser(): EduUser {
    if (this.roomManager.data.localUser) {
      return this.roomManager.data.localUser.user
    }
    return {} as EduUser
  }

  /**
   * localUserUuid
   */
  get localUserUuid(): string {
    return this.localUser.userUuid
  }

  /**
   * local stream data
   */
  get localStream(): EduStreamData {
    return this.roomManager.data.localStreamData
  }

  /**
   * local screen stream data
   */
  get screenStream(): EduStreamData {
    return this.roomManager.data.localScreenShareStream
  }

  /**
   * data controller
   */
  get data(): EduClassroomDataController {
    return this.roomManager.data
  }

  /**
   * publish stream in channel
   * @param eduStream 
   * @returns Promise<any>
   */
  public async publishStream(stream: EduStream) {
    let res = await this.apiService.upsertBizStream({
      roomUuid: this.roomUuid,
      userUuid: this.localUserUuid,
      streamUuid: stream.streamUuid,
      streamName: stream.streamName,
      audioState: +stream.hasAudio as number,
      videoState: +stream.hasVideo as number,
      videoSourceType: stream.videoSourceType,
      audioSourceType: stream.audioSourceType,
    })
    const screenStreamData = new EduStreamData({
      state: 1,
      streamUuid: stream.streamUuid,
      streamName: stream.streamName,
      hasAudio: stream.hasAudio,
      hasVideo: stream.hasVideo,
      videoSourceType: stream.videoSourceType,
      audioSourceType: stream.audioSourceType,
      token: res.rtcToken,
      userInfo: {
        userUuid: this.data.localUser.user.userUuid,
        userName: this.data.localUser.user.userName,
        role: this.data.localUser.user.role
      },
      updateTime: res.ts,
    })
    this.data.upsertLocalStream('main', screenStreamData)
    return {
      streamUuid: res.streamUuid,
      rtcToken: res.rtcToken
    }
  }

  /**
   * unpublish stream in channel
   * @param stream 
   * @returns Promise<any>
   */
  public async unpublishStream(stream: Pick<EduStream, 'streamUuid'>) {
    let res = await this.apiService.deleteBizStream({
      roomUuid: this.roomUuid,
      userUuid: this.localUserUuid,
      streamUuid: stream.streamUuid
    })
    EduLogger.info('[EDU-STATE] unpublish stream remove local stream, streamUuid: ', stream.streamUuid)
    this.data.removeLocalStream(stream.streamUuid)
  }

  /**
   * send room message in channel
   * @param message 
   * @returns Promise<any>
   */
  async sendRoomMessage(message: string) {
    await this.apiService.sendChannelMessage({
      roomUuid: this.roomUuid,
      msg: message
    })
  }

  /**
   * send user message in peer
   * @param message 
   * @param remoteUser
   * @returns Promise<any>
   */
  async sendUserMessage(message: string, remoteUser: EduUser) {
    await this.apiService.sendPeerMessage({
      roomUuid: this.roomUuid,
      userId: remoteUser.userUuid,
      msg: message
    })
  }

  /**
   * send room chat message
   * @param message 
   * @returns Promise<any>
   */
  async sendRoomChatMessage(message: string): Promise<any> {
    await this.apiService.sendRoomChatMessage({
      message,
      roomUuid: this.roomUuid,
    })
  }

  /**
   * send user chat message
   * @param message 
   * @param remoteUser
   * @returns Promise<any>
   */
  async sendUserChatMessage(message: string, remoteUser: EduUser): Promise<any> {
    await this.apiService.sendUserChatMessage({
      message,
      remoteUser,
      roomUuid: this.roomUuid,
    })
  }

  /**
   * update room properties in channel
   * @param record 
   * @returns Promise<any>
   */
  public async updateRoomProperties(record: Record<string, any>) {
    await this.apiService.updateRoomProperties({
      roomUuid: this.roomUuid,
      key: record.key,
      value: record.value,
      cause: record.cause
    })
  }

  /**
   * update course state in channel
   * @param courseState 
   * @returns Promise<any>
   */
  public async updateCourseState(courseState: EduCourseState) {
    await this.apiService.updateCourseState({
      roomUuid: this.roomUuid,
      courseState: +courseState
    })
  }

  /**
   * update kick user in channel
   * @param userUuid 
   * @returns Promise<any>
   */
  public async kickUser(userUuid: string) {
    await this.apiService.kickUser({
      roomUuid: this.roomUuid,
      userUuid
    })
  }

  /**
   * mute/unmute in channel student's by role type
   * @param enable true is mean unmute false is mute
   * @param roles 
   * @returns Promise<any>
   */
  public async allowStudentChatByRole(enable: boolean, roles: string[]) {
    await this.apiService.allowStudentChatByRole({
      roomUuid: this.roomUuid,
      enable,
      roles,
    })
  }

  /**
   * mute/unmute in channel with one student
   * @param enable true is mean unmute false is mute
   * @param roles 
   * @returns Promise<any>
   */
  public async allowRemoteStudentChat(enable: boolean, user: EduUser) {
    await this.apiService.allowRemoteStudentChat({
      roomUuid: this.roomUuid,
      userUuid: user.userUuid,
      muteChat: enable,
    })
  }

  /**
   * This method will publish a share screen stream in channel
   * @returns Promise<any>
   */
  public async startShareScreen() {
    if (this.screenStream && this.screenStream.stream && this.screenStream.stream.streamUuid) {  
      const { rtcToken, streamUuid, ts } = await this.apiService.upsertBizStream({
        roomUuid: this.roomUuid,
        userUuid: this.localUserUuid,
        streamName: this.screenStream.stream.streamName,
        streamUuid: this.screenStream.stream.streamUuid,
        videoSourceType: this.screenStream.stream.videoSourceType,
        audioSourceType: this.screenStream.stream.audioSourceType,
        videoState: this.screenStream.stream.hasVideo,
        audioState: this.screenStream.stream.hasAudio,
      } as any)
      const screenStreamData = new EduStreamData({
        state: 1,
        streamUuid: streamUuid,
        streamName: this.screenStream.stream.streamName,
        hasAudio: true,
        hasVideo: true,
        videoSourceType: EduVideoSourceType.screen,
        audioSourceType: EduAudioSourceType.mic,
        token: rtcToken,
        userInfo: {
          userUuid: this.data.localUser.user.userUuid,
          userName: this.data.localUser.user.userName,
          role: this.data.localUser.user.role
        },
        updateTime: ts
      })
      this.data.upsertLocalStream('screen', screenStreamData)
    } else {
      const stream: EduStreamData = new EduStreamData({
        state: 1,
        streamUuid: `0`,
        streamName: `${this.localUser.userName}的屏幕共享`,
        hasAudio: true,
        hasVideo: true,
        videoSourceType: EduVideoSourceType.screen,
        audioSourceType: EduAudioSourceType.mic,
        token: '',
        userInfo: {
          userUuid: this.data.localUser.user.userUuid,
          userName: this.data.localUser.user.userName,
          role: this.data.localUser.user.role
        }
      })
      const params = {
        roomUuid: this.roomUuid,
        userUuid: this.localUserUuid,
        streamName: stream.stream.streamName,
        streamUuid: stream.stream.streamUuid,
        audioState: +stream.stream.hasAudio,
        videoState: +stream.stream.hasVideo,
        videoSourceType: EduVideoSourceType.screen,
        audioSourceType: EduAudioSourceType.mic,
      }
      const { rtcToken, streamUuid, ts } = await this.apiService.upsertBizStream(params)
      stream.setRtcToken(rtcToken)
      stream.updateStreamUuid(streamUuid)
      stream.updateTime(ts)
      this.data.upsertLocalStream('screen', stream)
    }
  }

  /**
   * This method will unpublish a share screen stream in channel
   * @returns Promise<any>
   */
  public async stopShareScreen() {
    if (this.screenStream) {
      await this.apiService.stopShareScreen(this.roomUuid, this.screenStream.stream.streamUuid, this.data.localUser.user.userUuid)
      EduLogger.info('[EDU-STATE] unpublish stream remove local screen stream, streamUuid: ', this.screenStream.stream.streamUuid)
      this.data.removeLocalStream(this.screenStream.stream.streamUuid)
    }
  }

  /**
   * This method will start student camera
   * @param stream
   * @returns Promise<any>
   */
  public async remoteStartStudentCamera(stream: EduStream) {
    await this.apiService.remoteStartStudentCamera({
      roomUuid: this.roomUuid,
      userUuid: (stream.userInfo as any).userUuid,
      streamUuid: stream.streamUuid
    })
  }

  /**
   * This method will stop student camera
   * @param stream
   * @returns Promise<any>
   */
  public async remoteStopStudentCamera(stream: EduStream) {
    await this.apiService.remoteStopStudentCamera({
      roomUuid: this.roomUuid,
      userUuid: (stream.userInfo as any).userUuid,
      streamUuid: stream.streamUuid
    })
  }

  /**
   * This method will start student microphone
   * @param stream
   * @returns Promise<any>
   */
  public async remoteStartStudentMicrophone(stream: EduStream) {
    await this.apiService.remoteStartStudentMicrophone({
      roomUuid: this.roomUuid,
      userUuid: (stream.userInfo as any).userUuid,
      streamUuid: stream.streamUuid
    })
  }

  /**
   * This method will stop student microphone
   * @param stream
   * @returns Promise<any>
   */
  public async remoteStopStudentMicrophone(stream: EduStream) {
    await this.apiService.remoteStopStudentMicrophone({
      roomUuid: this.roomUuid,
      userUuid: (stream.userInfo as any).userUuid,
      streamUuid: stream.streamUuid
    })
  }


  /**
   * This method will close student microphone
   * @param stream
   * @returns Promise<any>
   */
  public async remoteCloseStudentStream(stream: EduStream) {
    await this.apiService.remoteCloseStudentStream({
      roomUuid: this.roomUuid,
      userUuid: (stream.userInfo as any).userUuid,
      streamUuid: stream.streamUuid
    })
  }

  /**
   * This method will update local main stream state
   * @param args
   * @returns Promise<any>
   */
  public async updateMainStreamState(args: Record<string, boolean>) {
    const prevAudioState = +this.localStream.stream.hasAudio
    const prevVideoState = +this.localStream.stream.hasVideo
    const curAudioState = args.hasOwnProperty('audioState') ? +args['audioState']: prevAudioState
    const curVideoState = args.hasOwnProperty('videoState') ? +args['videoState'] : prevVideoState
    console.log("args>>> ", args, this.localStream.stream, args)
    await this.apiService.updateBizStream({
      roomUuid: this.roomUuid,
      userUuid: this.localUserUuid,
      streamUuid: this.data.streamMap['main'].streamUuid,
      videoSourceType: this.localStream.stream.videoSourceType,
      audioSourceType: this.localStream.stream.audioSourceType,
      videoState: curVideoState,
      audioState: curAudioState,
      streamName: this.localStream.stream.streamName
    })
    // this.localStream.updateMediaState({
    //   hasVideo: curVideoState,
    //   hasAudio: curAudioState,
    // })
  }

  /**
   * This method will mute student by roles
   * @param roles
   * @returns Promise<any>
   */
  public async muteStudentChatByRoles(roles: string[]) {
    await this.apiService.allowStudentChatByRole({enable: true, roomUuid: this.roomUuid, roles})
  }


  /**
   * This method will unmute student by roles
   * @param roles
   * @returns Promise<any>
   */
  public async unmuteStudentChatByRoles(roles: string[]) {
    await this.apiService.allowStudentChatByRole({enable: false, roomUuid: this.roomUuid, roles})
  }

  /**
   * This method will send co video apply to the specified user in the same room.
   * It is generally used in co-video apply scenario.
   * @param teacher
   * @returns Promise<any>
   */
  public async sendCoVideoApply(teacher: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: teacher.userUuid,
        userName: teacher.userName,
        type: PeerInviteEnum.studentApply,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: teacher,
      roomUuid: this.roomUuid
    })
  }

  /**
   * This method will accept co-video apply from the other participants in the same room.
   * It is generally used in co-video apply scenario.
   * @param student
   * @returns Promise<any>
   */
  public async acceptCoVideoApply(student: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: student.userUuid,
        userName: student.userName,
        type: PeerInviteEnum.teacherAccept,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: student,
      roomUuid: this.roomUuid
    })
  }

  /**
   * This method will reject co-video apply from the other participants in the same room.
   * It is generally used in co-video apply scenario.
   * @param student
   * @returns Promise<any>
   */
  public async rejectCoVideoApply(student: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: student.userUuid,
        userName: student.userName,
        type: PeerInviteEnum.teacherReject,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: student,
      roomUuid: this.roomUuid
    })  
  }

  /**
   * This method will launch invitation for publish stream.
   * @param args
   * @returns Promise<any>
   */
  public async inviteStreamBy(args: any) {
    await this.apiService.inviteUserPublishStream(args)
  }

  /**
   * This method will reject co-video apply from the other participants in the same room.
   * It is generally used in co-video apply scenario.
   * @param teacher
   * @returns Promise<any>
   */
  public async studentCancelApply(teacher: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: teacher.userUuid,
        userName: teacher.userName,
        type: PeerInviteEnum.studentCancel,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: teacher,
      roomUuid: this.roomUuid
    })
  }

  /**
   * This method is used for sender's close the its published stream
   * It is generally used in co-video apply scenario.
   * @param me
   * @returns Promise<any>
   */
  public async studentCloseStream(me: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: me.userUuid,
        userName: me.userName,
        type: PeerInviteEnum.studentCancel,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: me,
      roomUuid: this.roomUuid
    })
  }

  /**
   * This method is used for teacher close the student's published stream
   * It is generally used in co-video apply scenario.
   * @param student
   * @returns Promise<any>
   */
  public async teacherCloseStream(student: EduUser) {
    const msg = JSON.stringify({
      cmd: 1,
      data: {
        userUuid: student.userUuid,
        userName: student.userName,
        type: PeerInviteEnum.teacherStop,
      }
    })
    await this.apiService.sendUserChatMessage({
      message: msg,
      remoteUser: student,
      roomUuid: this.roomUuid
    })
  }
}

