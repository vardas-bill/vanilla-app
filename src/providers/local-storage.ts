import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { SecureStorage } from 'ionic-native';
import { APP_NAME, SKIP_SECURESTORAGE, ENCRYPT_DATA } from '../app/app.settings';


/*
 Provider for wrapper functions for secure storage
 */

@Injectable()
export class LocalStorageProvider {

  secureStorage: SecureStorage = new SecureStorage();

  constructor()
  {
    console.log('Hello Secure Storage Provider');

    this.secureStorage.create(APP_NAME)
      .then(
        () => console.log('Secure storage is ready!'),
        error => console.log(error)
      );
  }



  settingsExist()
  // Returns true if there are settings stored in local storage
  {
    return this.secureStorage.get('settings')
      .then(
        data => {
          console.log('LocalStorage: settingsExist(): get settings returned: ' + data);
          return true;
        },
        error => {
          console.log(error);
          return false;
        }
      );
  }



  getSettings()
  // Gets the user's settings from local storage
  {
    return this.secureStorage.get('settings')
      .then(
        data => {
          console.log('LocalStorage: getSettings(): get settings returned: ' + data);
          return JSON.stringify(data);
        },
        error => {
          console.log('ERROR: LocalStorage: getSettings(): get settings returned: ' +error);
          return false;
        }
      );
  }



  setSetting(name, value)
  // Sets the given setting to the given value
  {
    // Get the settings, modify the given setting, and then put the settings back
    return this.secureStorage.get('settings')
      .then(
        data => {
          console.log('LocalStorage: setSettings(): get settings returned: ' + data);

          let newData = JSON.parse(data);
          newData[name] = value;

          this.secureStorage.set('settings', newData)
            .then(
              data => {
                console.log('LocalStorage: setSettings(): set settings returned: ' + data);
                return data;
              },
              error => {
                console.log(error);
                return false;
              }
            );
        },
        error => {
          console.log(error);
          return false;
        }
      );
  }



  removeSettings()
  // Removes the user's settings from secure storage
  {
    return this.secureStorage.remove('settings')
      .then(
        data => {
          console.log('LocalStorage: removeSettings(): remove settings returned: ' + data);
          return true;
        },
        error => {
          console.log(error);
          return false;
        }
      );
  }
}
