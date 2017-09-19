import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { SUPERLOGIN_SERVER, APP_NAME, REMOTE_SERVER, SKIP_SECURESTORAGE } from '../app/app.settings';
import { SecureStorage } from 'ionic-native';

import { DataProvider } from './data';

/*
 Provider for all login/signup and related account details
 Uses the SuperLogin Node.js server code for PouchDB/CouchDB: https://github.com/colinskow/superlogin
 For information on how SuperLogin should be setup see: https://www.joshmorony.com/part-2-creating-a-multiple-user-app-with-ionic-2-pouchdb-couchdb/
*/

@Injectable()
export class AuthenticationProvider {

  constructor(public http: Http,
              public dataService: DataProvider)
  {
    console.log('Hello Authentication Provider');
  }



  userExists(username)
  // Checks if there is a user with the given username
  // + returns true or false
  {
    let url = SUPERLOGIN_SERVER + '/auth/validate-username/' + username;
    url = encodeURI(url);

    console.log('Authentication: userExists about to get for url: ' + url);

    return new Promise(resolve => {
      this.http.get(url)
        .subscribe(res => {
          console.log('Authentication: userExists: validate-username: Username does not exist - res = ' + JSON.stringify(res));
          resolve(false);
        }, err => {
          console.log('Authentication: userExists: validate-username Username exists or mal formed - err = ' + JSON.stringify(err));
          resolve(true);
        });
    });
  }



  register(username, email, password)
  // Registers a new user. Only called after we have checked that the user does not already exist (userExists())
  {
    console.log('Authentication: register() called with: username=' + username + ', email=' + email + ', pwd=' + password);

    return new Promise(resolve => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let user = {
        name: '',
        username: username,
        email: email,
        password: password,
        confirmPassword: password
      };

      let result = {
        success: false,
        data: []
      };

      this.http.post(SUPERLOGIN_SERVER + '/auth/register', JSON.stringify(user), {headers: headers})
        .subscribe(res => {

          let details = res.json();

          console.log('Authentication: register(): SuperLogin registration successful: res = ' + JSON.stringify(details));

          this.saveDBPaths(details.user_id, details.userDBs.vanilla, details.userDBs.product).then((success)=>{
            // Initialise the Pouch/Couch database and sync to server
            this.dataService.init();//details.user_id, details.userDBs.vanilla);
          });

          result.success = true;
          result.data = details;
          resolve(result);
        },
          (err) => {
          console.log('Authentication: Registration failed err = ' + JSON.stringify(err));
          let details = err.json();
          result.success = false;
          result.data = details;
          resolve(result);
        });
    });
  }



  login(email, password)
  // Login the user
  {
    console.log('Authentication: login(): Login function called');

    return new Promise(resolve => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let credentials = {
        email: email,
        username: email,
        password: password
      };

      let result = {
        success: false,
        data: []
      };

      console.log('Authentication: login(): credentials = ' + JSON.stringify(credentials));
      console.log('Authentication: login(): SUPERLOGIN_SERVER = ' + SUPERLOGIN_SERVER);

      this.http.post(SUPERLOGIN_SERVER + '/auth/login', JSON.stringify(credentials), {headers: headers})
        .subscribe(res => {
            var details = res.json();
            console.log('Authentication: login(): SuperLogin successful login: res = ' + JSON.stringify(details));

            this.saveDBPaths(details.user_id, details.userDBs.vanilla, details.userDBs.product).then((success)=>{
              // Initialise the Pouch/Couch database and sync to server
              console.log('Authentication: login(): in .then from saveDBPaths() about to call init()');
              this.dataService.init();//details.user_id, details.userDBs.vanilla);
            });

            result.success = true;
            result.data = details;
            resolve(result);
          },
          (err) => {
            console.log('Authentication: login(): Login failed err = ' + err);

            let details = err.json();
            result.success = false;
            result.data = details;
            resolve(result);
          });
    });
  }



  logout()
  // Clear authentication data from SecureStorage
  {
    let secureStorage: SecureStorage = new SecureStorage();
    secureStorage.create(APP_NAME)
      .then(
        () => {
          secureStorage.remove('authentication')
            .then(
              data => console.log(data),
              error => console.log(error)
            );
        },
        error => console.log(error)
      );
  }



  forgotPassword(email)
  // Send the user an email to let them reset their PIN
  {
    return new Promise(resolve => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let user = {
        email: email
      };

      this.http.post(SUPERLOGIN_SERVER + '/auth/forgot-password', JSON.stringify(user), {headers: headers})
        .subscribe(res => {
          console.log('Authentication: forgotPassword(): email reset request sent');

          let details = res.json();

          resolve(true);

        }, (err) => {
          console.log('Authentication: forgotPassword(): email reset request failed err = ' + JSON.stringify(err));
        });
    });
  }



  resetPassword(email, password, token)
  // Send the user an email to let them reset their PIN
  {
    return new Promise(resolve => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let user = {
        email: email,
        password: password,
        confirmPassword: password,
        token: token
      };

      this.http.post(SUPERLOGIN_SERVER + '/auth/password-reset', JSON.stringify(user), {headers: headers})
        .subscribe(res => {
          console.log('Authentication: forgotPIN: email reset request sent');

          let details = res.json();

          resolve(true);

        }, (err) => {
          console.log('Authentication: forgotPIN: email reset request failed err = ' + JSON.stringify(err));
        });
    });
  }



  saveDBPaths(localUserDB, remoteUserDB, remoteProductDB)
  {
    let secureStorage: SecureStorage = new SecureStorage();
    let dbPaths: any = {'localUserDB': localUserDB, 'remoteUserDB': remoteUserDB, 'remoteProductDB': remoteProductDB};
    let strDBPaths = JSON.stringify(dbPaths);

    console.log('Data: saveDBPaths(): strDBPaths = ' + strDBPaths);

    return new Promise(resolve => {
      secureStorage.create(APP_NAME)
        .then(
          () => {
            secureStorage.set('dbPaths', strDBPaths)
              .then(
                data => {
                  console.log('Authentication: saveDBPaths(): done secureStorage.set data = ' + data);
                  resolve(true);
                },
                error => {
                  console.log('Authentication: saveDBPaths(): done secureStorage.set error = ' + error);
                  resolve(false);
                }
              );
          },
          error => {
            console.log('Authentication: saveDBPaths(): done secureStorage.create error = ' + error);
            resolve(false);
          }
        );
    });
  }

}
