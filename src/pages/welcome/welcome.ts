import { Component } from '@angular/core';
import { NavController, Events, Platform, AlertController, ToastController, NavParams } from 'ionic-angular';

import { AppVersion } from '@ionic-native/app-version';
import { NativeStorage } from '@ionic-native/native-storage';

import { LoginPage } from '../login/login';
import { SignupPage } from '../signup/signup';
import { ListMasterPage } from '../list-master/list-master';
import { HomePage } from '../home/home';

import { ConnectivityService } from '../../providers/connectivity-service';
import { DataProvider } from '../../providers/data';
import { AuthenticationProvider } from '../../providers/authentication';

import { APP_NAME, SKIP_SECURESTORAGE, ENCRYPT_DATA, DO_LOGIN } from '../../app/app.settings';

/**
 * The Welcome Page is a splash page that quickly describes the app,
 * and then directs the user to create an account or log in.
 * If you'd like to immediately put the user onto a login/signup page,
 * we recommend not using the Welcome page.
*/
@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html'
})
export class WelcomePage {

  savedSettings:      any = [];
  usersEmail:         string = '';
  usersPassword:      string = '';
  showLoadingSpinner: boolean = false;
  showButtons:        boolean = false;

  constructor(public navCtrl: NavController,
              public events: Events,
              public alertCtrl: AlertController,
              public toastCtrl: ToastController,
              public platform: Platform,
              public nativeStorage: NativeStorage,
              public connectivityService: ConnectivityService,
              public dataProvider: DataProvider,
              public authenticationProvider: AuthenticationProvider,
              public appVersion: AppVersion,
              navParams: NavParams) {

    this.showButtons = false;

    // Determine whether or not we can auto login the user using credentials saved in local storage
    this.getStarted();

  }


  ionViewDidLoad() {
    console.log('WelcomePage did load');
  }


/*
  loginWithSavedCredentials()
  // Use the users email and password that were saved in local storage and do an automatic login
  {
    this.showLoadingSpinner = true;
    this.authentication.login(this.usersEmail, this.usersPassword)
      .then((result) => {
        if (result) {
          console.log('VanillaApp: login(): Success');
          this.events.subscribe('SYNC_FINISHED', (finished) => {
            console.log('***** VanillaApp: inializeApp(): SYNC_FINISHED event');
            this.showLoadingSpinner = false;
            this.navCtrl.setRoot(ListMasterPage);
          });
        }
        else {
          // There was an error logging in using the saved settings so let user do login
          this.showLoadingSpinner = false;
        }
      })
      .catch((err) => {
        // There was an error logging in
        // Shouldn't get here!
        this.showLoadingSpinner = false;
      });
  }
*/

  getStarted()
  // Determine whether or not we can auto login the user using credentials saved in local storage
  {
    console.log('WelcomePage: getStarted(): called');

    this.platform.ready().then(() => {

      console.log('WelcomePage: getStarted(): Platform ready!');

      // Are we running on a device or in the browser?
      if (this.platform.is('ios') || this.platform.is('android'))
      {
        console.log('WelcomePage: getStarted(): Running on a device');

        // Check if email has been set
        this.nativeStorage.getItem('authentication')
          .then(
            result => {
              console.log('WelcomePage: getStarted(): SecureStorage get authentication returned authentication = ' + result);
              let authentication = JSON.parse(result);
              this.usersEmail = authentication.email;
              this.usersPassword = authentication.password;

              // Check if we are online and if not work offline
              if (this.connectivityService.isOnline())
              {

                console.log('WelcomePage: Phone is online so doing login');

                this.showLoadingSpinner = true;

                // Log the user in
                this.authenticationProvider.login(this.usersEmail, this.usersPassword)
                  .then((result) => {
                   if (result) {
                     console.log('WelcomePage: getStarted(): login(): Success');

                     // Wait until the database has been synced before showing the next screen
                     this.events.subscribe('SYNC_FINISHED', (finished) => {
                       this.showLoadingSpinner = false;
                       this.events.unsubscribe('SYNC_FINISHED', null);
                       console.log('***** WelcomePage: inializeApp(): SYNC_FINISHED event');
                       this.navCtrl.setRoot(HomePage);
                     });
                }
                else {
                  // There was an error logging in using the saved settings
                   this.showLoadingSpinner = false;
                  console.log('WelcomePage: getStarted(): Could not login with saved credentials');
                }
                })
                .catch((err) => {
                 // There was an error logging in
                 this.showLoadingSpinner = false;
                 console.log('WelcomePage: getStarted(): Unexpected error loging in');
                });

                let toast = this.toastCtrl.create({
                  message: 'Logging you in...',
                  duration: 3000,
                  position: 'top'
                });

                toast.present();
              }
              else
              {
                // Work offline
                console.log('WelcomePage: getStarted(): Phone is NOT online so working offline');

                let alert = this.alertCtrl.create({
                  title: 'No Internet Connection',
                  subTitle: 'There is no internet connection at the moment but you can continue to use this App offline.',
                  buttons: ['Ok']
                });
                alert.present(alert);

                // Initialise the database
                this.dataProvider.init();//this.usersEmail, false);

                this.navCtrl.setRoot(HomePage);
              }

          },
          error => {
            console.log('WelcomePage: getStarted(): get authentication returned error = ' + error);
            // Show the login/register buttons
            this.showButtons = true;
          });
      }
      else {
        // We are running in the browser so can't use the locally stored settings
        console.log('WelcomePage: getStared(): NOT running on Cordova device.');
        // Show the login/register buttons
        this.showButtons = true;
      }
    });
  }



  login() {
    this.navCtrl.setRoot(LoginPage);
  }



  signup() {
    this.navCtrl.setRoot(SignupPage);
  }
}
