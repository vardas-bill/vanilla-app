import { Injectable } from '@angular/core';
import { File } from 'ionic-native';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Camera, MediaCapture, MediaFile, CaptureError, CaptureImageOptions, CaptureVideoOptions, CaptureAudioOptions } from 'ionic-native';

/*
 Provider for accessing media (photos, video, audio) on the phone
 */

declare var cordova: any;

@Injectable()
export class MediaProvider {

  constructor(public http: Http)
  {
    console.log('Hello Camera Provider');
  }



  takePhotograph()
  // Accesses camera to take a photograph
  {
    console.log('Media: takePhotograph()');
    return new Promise(resolve =>
    {
      Camera.getPicture(
        {
          destinationType 	 : Camera.DestinationType.DATA_URL,
          targetWidth 	     : 640,
          targetHeight	     : 480
        })
        .then((data) =>
        {
          // imageData is a base64 encoded string
          //this.cameraImage 	= "data:image/jpeg;base64," + data;
          resolve(data);
        });
    });
  }




  selectPhotograph()
  // Accesses the photo library for selecting a photo
  {
    return new Promise(resolve =>
    {
      let cameraOptions = {
        sourceType         : Camera.PictureSourceType.PHOTOLIBRARY,
        destinationType    : Camera.DestinationType.DATA_URL,
        quality            : 100,
        targetWidth        : 640,
        targetHeight       : 480,
        encodingType       : Camera.EncodingType.JPEG,
        correctOrientation : true
      };

      Camera.getPicture(cameraOptions)
        .then((data) =>
        {
          //this.cameraImage 	= "data:image/jpeg;base64," + data;
          resolve(data);
        });

    });
  }



  recordVideo()
  // Accesses the camera for taking a photo
  {
    return new Promise(resolve =>
    {
      let options: CaptureVideoOptions = { limit: 1, duration: 15 };
      MediaCapture.captureVideo(options)
        .then(
          (data: MediaFile[]) => {
            let base64File:any;

            console.log('Media: recordVideo: got video with data = ' + JSON.stringify(data));

            // Turn the video file into base64 so we can store in database

            // :TO DO: Work out correct pathname for Android video files

            let filePath = "file://"+data[0].fullPath.substring(7,data[0].fullPath.lastIndexOf("/"));
            let fileName = data[0].name;
            File.readAsDataURL(filePath, fileName)
              .then((result:any)=>{

                // :TO DO: Check base64 result for Android media

                // Remove the video file type from the start of the result to leave a base64 string
                let res = result.split(',');
                base64File = res[1];
                resolve(base64File);
              })
              .catch((err)=>{
                console.log('ERROR: Media: recordVideo: File.readAsDataURL: err = ' + JSON.stringify(err));
              });
          },
          (err: CaptureError) => console.error('ERROR - Media: recordVideo: captureVideo error = ' + JSON.stringify(err))
        );
    });
  }



  recordAudio()
  // Accesses the microphone for recording an audio snippet
  {
    return new Promise(resolve =>
    {
      let options: CaptureAudioOptions = { limit: 1, duration: 15 };
      MediaCapture.captureAudio(options)
        .then(
          (data: MediaFile[]) => {
            let base64File:any;

            console.log('Media: recordAudio: got audio with data = ' + JSON.stringify(data));

            // Turn the video file into base64 so we can store in database

            // :TO DO: Work out correct pathname for Android audio files

            let filePath = "file://"+data[0].fullPath.substring(0,data[0].fullPath.lastIndexOf("/"));
            let fileName = data[0].name;
            console.log('Media: recordAudio(): filePath is: ' + filePath);
            console.log('Media: recordAudio(): fileName is: ' + fileName);
            File.readAsDataURL(filePath, fileName)
              .then((result:any)=>{

                // :TO DO: Check base64 result for Android media

                // Remove the video file type from the start of the result to leave a base64 string
                let res = result.split(',');
                base64File = res[1];
                resolve(base64File);
              })
              .catch((err)=>{
                console.log('ERROR: Media: recordAudio: File.readAsDataURL: err = ' + JSON.stringify(err));
              });
          },
          (err: CaptureError) => console.error('ERROR - Media: recordAudio: captureAudio error = ' + JSON.stringify(err))
        );
    });
  }

}

