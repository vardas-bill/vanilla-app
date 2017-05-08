import { Injectable } from '@angular/core';
import { Network } from 'ionic-native';
import { Platform } from 'ionic-angular';
import 'rxjs/add/operator/map';

/*
 Provider for determining whether or not there is an internet connection
 */

declare var Connection;

// Confirms whether or not there is an internet connection
@Injectable()
export class ConnectivityService {

  onDevice: boolean;

  constructor(public platform: Platform){
    this.onDevice = this.platform.is('cordova');
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  isOffline(): boolean {
    return !navigator.onLine;
  }

}
