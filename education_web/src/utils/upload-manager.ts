import { MultipartUploadResult } from 'ali-oss';
import uuidv4 from 'uuid/v4';
import { Room, PPT, PPTKind, ApplianceNames, createPPTTask } from 'white-web-sdk';
import MD5 from 'js-md5';
import { resolveFileInfo } from './helper';
import { region } from "@/components/netless-board/region";

export type imageSize = {
  width: number
  height: number
};

export type PPTDataType = {
    active: boolean
    pptType: PPTType
    id: string
    data: any
    cover?: any
};

export enum PPTType {
    dynamic = "dynamic",
    static = "static",
    init = "init",
}
export type NetlessImageFile = {
  width: number;
  height: number;
  file: File;
  coordinateX: number;
  coordinateY: number;
};

export type TaskType = {
  uuid: string,
  imageFile: NetlessImageFile
};

export type PPTProgressListener = (phase: PPTProgressPhase, percent: number) => void;

export enum PPTProgressPhase {
  Uploading,
  Converting,
}

export class UploadManager {

  private readonly ossClient: any;
  private readonly room: Room;
  private readonly ossUploadCallback?: (res: any) => void;
  public constructor(ossClient: any, room: Room, ossUploadCallback?: (res: any) => void) {
    this.ossClient = ossClient;
    this.room = room;
    this.ossUploadCallback = ossUploadCallback;
  }
  
  public async convertFile(
    rawFile: File,
    pptConverter: any,
    kind: PPTKind,
    folder: string,
    uuid: string,
    onProgress?: PPTProgressListener,
    taskToken?: string
  ): Promise<void> {
    const {fileType} = resolveFileInfo(rawFile);
    const path = `/${folder}/${uuid}${fileType}`;
    const pptURL = await this.addFile(path, rawFile, onProgress);
    let res: PPT;

    // Conversion Api https://developer.netless.link/server-en/home/server-conversion
    // Need Get taskUuid and taskToken from developer backend

    //@ts-ignore
    const taskUuid = '69c71b00bcb911eb8db3d1c19e1a6228'
    // const token =
    // const taskUuid = 'taskUuid'

    //@ts-ignore
    const token = 'NETLESSTASK_YWs9MU53eWgwbDFvWWs4WkVjbmRtZGloMHJiY1VlbEJxNVJKTzFTJm5vbmNlPTE2MjE4Nzk3Mzk4MzUwMCZyb2xlPTAmc2lnPTk3ZmUwZTlmNDFiOGQ5Yjc3MWEyZTVhMWRiNGVlMWVmODcwZGUwMzkzM2QxZTQ2N2ZiN2FkODMyOTUwYWFlZjQmdXVpZD02OWM3MWIwMGJjYjkxMWViOGRiM2QxYzE5ZTFhNjIyOA'
    if (kind === PPTKind.Static) {
        // res = await pptConverter.convert({
        //   url: pptURL,
        //   kind: kind,
        //   onProgressUpdated: (progress: number) => {
        //     if (onProgress) {
        //       onProgress(PPTProgressPhase.Converting, progress);
        //     }
        //   },
        // });

        const resp = createPPTTask({
          uuid: `${taskUuid}`,
          kind: kind,
          taskToken: `${token}`,
          //@ts-ignore
          region: region,
          callbacks: {
            onProgressUpdated: progress => {
              console.log(' onProgressUpdated ', progress)
                if (onProgress) {
                  //@ts-ignore
                  onProgress(PPTProgressPhase.Converting, progress);
                }
              },
              onTaskFail: (err: any) => {
                console.log(' onTaskFail ', err)
                // payload.onProgress({
                //   phase: 'finish',
                //   progress: 1,
                //   isTransFile: true,
                // })
              },
              onTaskSuccess: () => {
                console.log(' onTaskSuccess ')
                // payload.onProgress({
                //   phase: 'finish',
                //   progress: 1,
                //   isTransFile: true,
                // })
              },
          }
        })
  
        const ppt = await resp.checkUtilGet();
        const documentFile: PPTDataType = {
          active: true,
          id: `${uuidv4()}`,
          pptType: PPTType.static,
          data: ppt.scenes,
        };
        const scenePath = MD5(`/${uuid}/${documentFile.id}`);
        this.room.putScenes(`/${scenePath}`, ppt.scenes);
        this.room.setScenePath(`/${scenePath}/${ppt.scenes[0].name}`);
    } else {
      const resp = createPPTTask({
        uuid: `${taskUuid}`,
        kind: kind,
        taskToken: `${token}`,
        //@ts-ignore
        region: region,
        callbacks: {
          onProgressUpdated: progress => {
            console.log(' onProgressUpdated ', progress)
              if (onProgress) {
                //@ts-ignore
                onProgress(PPTProgressPhase.Converting, progress);
              }
            },
            onTaskFail: (err: any) => {
              console.log(' onTaskFail ', err)
              // payload.onProgress({
              //   phase: 'finish',
              //   progress: 1,
              //   isTransFile: true,
              // })
            },
            onTaskSuccess: () => {
              console.log(' onTaskSuccess ')
              // payload.onProgress({
              //   phase: 'finish',
              //   progress: 1,
              //   isTransFile: true,
              // })
            },
        }
      })
      const ppt = await resp.checkUtilGet();
        // res = await pptConverter.convert({
        //   url: pptURL,
        //   kind: kind,
        //   onProgressUpdated: (progress: number) => {
        //     if (onProgress) {
        //       onProgress(PPTProgressPhase.Converting, progress);
        //     }
        //   },
        // });
        const documentFile: PPTDataType = {
          active: true,
          id: `${uuidv4()}`,
          pptType: PPTType.dynamic,
          data: ppt.scenes,
        };
        const scenePath = MD5(`/${uuid}/${documentFile.id}`);
        this.room.putScenes(`/${scenePath}`, ppt.scenes);
        this.room.setScenePath(`/${scenePath}/${ppt.scenes[0].name}`);
    }
    if (onProgress) {
        onProgress(PPTProgressPhase.Converting, 1);
    }
  }
  private getImageSize(imageInnerSize: imageSize): imageSize {
    const windowSize: imageSize = {width: window.innerWidth, height: window.innerHeight};
    const widthHeightProportion: number = imageInnerSize.width / imageInnerSize.height;
    const maxSize: number = 960;
    if ((imageInnerSize.width > maxSize && windowSize.width > maxSize) || (imageInnerSize.height > maxSize && windowSize.height > maxSize)) {
      if (widthHeightProportion > 1) {
        return {
          width: maxSize,
          height: maxSize / widthHeightProportion,
        };
      } else {
        return {
          width: maxSize * widthHeightProportion,
          height: maxSize,
        };
      }
    } else {
      if (imageInnerSize.width > windowSize.width || imageInnerSize.height > windowSize.height) {
        if (widthHeightProportion > 1) {
          return {
            width: windowSize.width,
            height: windowSize.width / widthHeightProportion,
          };
        } else {
          return {
            width: windowSize.height * widthHeightProportion,
            height: windowSize.height,
          };
        }
      } else {
        return {
          width: imageInnerSize.width,
          height: imageInnerSize.height,
        };
      }
    }
  }
  public async uploadImageFiles(folder: string, imageFiles: File[], x: number, y: number, onProgress?: PPTProgressListener): Promise<void> {
    const newAcceptedFilePromises = imageFiles.map(file => this.fetchWhiteImageFileWith(file, x, y));
    const newAcceptedFiles = await Promise.all(newAcceptedFilePromises);
    await this.uploadImageFilesArray(folder, newAcceptedFiles, onProgress);
  }

  private fetchWhiteImageFileWith(file: File, x: number, y: number): Promise<NetlessImageFile> {
    return new Promise(resolve => {
      const image = new Image();
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        image.src = reader.result as string;
        image.onload = async () => {
          const res = this.getImageSize(image);
          const imageFile: NetlessImageFile = {
            width: res.width,
            height: res.height,
            file: file,
            coordinateX: x,
            coordinateY: y,
          };
          resolve(imageFile);
        };
      };
    });
  }
  private async uploadImageFilesArray(folder: string, imageFiles: NetlessImageFile[], onProgress?: PPTProgressListener): Promise<void> {
    if (imageFiles.length > 0) {

      const tasks: { uuid: string, imageFile: NetlessImageFile }[] = imageFiles.map(imageFile => {
        return {
          uuid: uuidv4(),
          imageFile: imageFile,
        };
      });

      for (const {uuid, imageFile} of tasks) {
        const {x, y} = this.room.convertToPointInWorld({x: imageFile.coordinateX, y: imageFile.coordinateY});
        this.room.insertImage({
          uuid: uuid,
          centerX: x,
          centerY: y,
          width: imageFile.width,
          height: imageFile.height,
          locked: false,
        });
      }
      await Promise.all(tasks.map(task => this.handleUploadTask(folder, task, onProgress)));
      if (this.room.isWritable) {
        this.room.setMemberState({
          currentApplianceName: ApplianceNames.selector,
        });
      }
    }
  }
  private async handleUploadTask(folder: string, task: TaskType, onProgress?: PPTProgressListener): Promise<void> {
    const fileUrl: string = await this.addFile(`/${folder}/${task.uuid}${task.imageFile.file.name}`, task.imageFile.file, onProgress);
    if (this.room.isWritable) {
      this.room.completeImageUpload(task.uuid, fileUrl);
    }
  }

  private getFile = (name: string): string => {
    return this.ossClient.generateObjectUrl(name);
  }
  public addFile = async (path: string, rawFile: File, onProgress?: PPTProgressListener): Promise<string> => {
    const res: MultipartUploadResult = await this.ossClient.multipartUpload(
      path,
      rawFile,
      {
        progress: (p: any) => {
          if (onProgress) {
            onProgress(PPTProgressPhase.Uploading, p);
          }
        },
      });
      if (this.ossUploadCallback) {
        this.ossUploadCallback(res);
      }
    if (res.res.status === 200) {
      return this.getFile(path);
    } else {
      throw new Error(`upload to ali oss error, status is ${res.res.status}`);
    }
  }
}