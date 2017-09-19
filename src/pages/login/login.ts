import { Component } from '@angular/core';
import { NavController, ToastController, Events } from 'ionic-angular';
import { SecureStorage } from 'ionic-native';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { SignupPage } from '../../pages/signup/signup';

import { AuthenticationProvider } from '../../providers/authentication';
import { ConnectivityService } from '../../providers/connectivity-service';

import { HomePage } from '../home/home';

import { APP_NAME, SKIP_SECURESTORAGE, ENCRYPT_DATA } from '../../app/app.settings';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  // The account fields for the login form.
  // If you're using the username field with or without email, make
  // sure to add it to the type
  account: {username: string, email: string, password: string} = {
    email: '',
    username: '',
    password: ''
  };

  // Our translated text strings
  private loginErrorString: string;
  private offlineErrorString: string;

  showNotOnline: boolean = false;
  showLoadingSpinner: boolean = false;

  // This needed to ensure label on Android doesn't go blue when selected
  labelColor: string = "white";

  constructor(public navCtrl: NavController,
              public authenticationProvider: AuthenticationProvider,
              public connectivityService: ConnectivityService,
              public toastCtrl: ToastController,
              public translateService: TranslateService,
              public events: Events) {

    this.translateService.get('LOGIN_ERROR').subscribe((value) => {
      this.loginErrorString = value;
    });

    this.translateService.get('OFFLINE_ERROR').subscribe((value) => {
      this.offlineErrorString = value;
    });

  }

  ionViewDidLoad() {
    console.log('LoginPage did load');
  }


  login()
  // Attempt to log the user in
  {
    // Check we have an internet connection
    if (this.connectivityService.isOnline()) {
      console.log('LoginPage: doLogin() We are online');

      this.showLoadingSpinner = true;

      // Log the user in
      this.authenticationProvider.login(this.account.email, this.account.password)
        .then((result:any)=>{
          console.log('LoginPage: doLogin(): authentication.login returned: ' + JSON.stringify(result));

          if (result.success) {
            console.log('LoginPage: doLogin(): Successful login - about to setRoot to MainPage ' + JSON.stringify(result));

            // :TO DO: Add loading gif for delay in syncing

            // Add data to SecureStorage
            let secureStorage: SecureStorage = new SecureStorage();
            secureStorage.create(APP_NAME)
              .then(
                () => {
                  console.log('Signup: Local storage is ready!');
                  let authentication = {'username':this.account.username, 'password':this.account.password, 'email':  this.account.email};
                  secureStorage.set('authentication', JSON.stringify(authentication))
                    .then(
                      data => console.log(data),
                      error => console.log(error)
                    );
                },
                error => {
                  console.log('ERROR: LoginPage: Secure storage failed with error = ' + error);
                }
              );

            this.events.subscribe('SYNC_FINISHED', (finished) => {
              this.events.unsubscribe('SYNC_FINISHED', null);
              this.showLoadingSpinner = false;
              console.log('***** LoginPage: login(): SYNC_FINISHED event');
              if (finished) this.navCtrl.setRoot(HomePage);
              else {
                let toast = this.toastCtrl.create({
                  message: 'There was a problem getting product details. Try again?',
                  duration: 4000,
                  position: 'top'
                });
                toast.present();
              }
            });
          }
          else {
            this.showLoadingSpinner = false;
            let toast = this.toastCtrl.create({
              message: this.loginErrorString,
              duration: 3000,
              position: 'top'
            });
            toast.present();
          }
        })
        .catch((err)=>{
          this.showLoadingSpinner = false;
          let toast = this.toastCtrl.create({
            message: 'Problem trying to log you in: ' + err,
            duration: 3000,
            position: 'top'
          });
          toast.present();
        });
    }
    else {
      console.log('LoginPage: doLogin(): We are NOT online');
      this.showLoadingSpinner = false;
      let toast = this.toastCtrl.create({
        message: this.offlineErrorString,
        duration: 3000,
        position: 'top'
      });
      toast.present();
    }
  }



  register()
  // Show the register page
  {
    this.navCtrl.setRoot(SignupPage);
  }
}
