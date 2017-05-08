import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { SecureStorage } from 'ionic-native';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { checkFirstCharacterValidator } from '../validators/custom-validators';

import { MainPage } from '../../pages/pages';
import { LoginPage } from '../../pages/login/login';
import { Data } from '../../providers/data';
import { Authentication } from '../../providers/authentication';
import { ConnectivityService } from '../../providers/connectivity-service';

import { APP_NAME, SKIP_SECURESTORAGE, ENCRYPT_DATA } from '../../app/app.settings';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html'
})
export class SignupPage {
  // The account fields for the login form.
  // If you're using the username field with or without email, make
  // sure to add it to the type
  account: {username: string, email: string, password: string} = {
    username: '',
    email: '',
    password: ''
  };


  showLoadingSpinner : boolean = false;

  constructor(public navCtrl: NavController,
              public authentication: Authentication,
              public dataService: Data,
              public toastCtrl: ToastController,
              public connectivityService: ConnectivityService,
              public translateService: TranslateService,
              public fb: FormBuilder) {

  }



  ionViewDidLoad() {
    console.log('SignupPage did load');
  }


  register()
  // Try to register the user
  {

    // :TO DO: Check the email/username/password for validity

    // Check we have an internet connection before trying to register the user
    if (this.connectivityService.isOnline()) {

      console.log('SignupPage: register(): we are online');

      this.showLoadingSpinner = true;

      // Register the user
      this.authentication.register(this.account.username, this.account.email, this.account.password).then((details: any) => {

        // Successful registration so add stuff to SecureStorage and to user settings in DB
        console.log('SignupPage: register(): authentication.register returned = ' + JSON.stringify(details));

        if (details.success) {
          // Create the user settings in the database
          this.dataService.createUserSettings().then(() => {
            // Save the settings
            this.dataService.getUserSettings().then((settings:any) => {
              if (settings) {
                settings.username = this.account.username;
                settings.email = this.account.email;
                settings.password = this.account.password;
                this.dataService.updateUserSettings(settings).then((result:any) => {
                  if (!result) console.log('ERROR: SignupPage: register(): updateUserSettings() failed.');
                });
              }
              else {
                console.log('ERROR: SignupPage: register(): createUserSettings failed.');
              }
            });
          });

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
                console.log('ERROR: SignupPage: Secure storage failed with error = ' + error);
              }
            );

          this.showLoadingSpinner = false;

          this.navCtrl.setRoot(MainPage);

        }
        else {
          // Unable to sign up

          this.showLoadingSpinner = false;

          // :TO DO: Extract error messages

          console.log('SignupPage: register(): authentication.register returned details.data = ' +
            JSON.stringify(details.data));

          let errMessage = "There was a problem creating an account for you";
          if (typeof details.data.validationErrors.email[0] !== undefined)
            errMessage = errMessage + ' ' + details.data.validationErrors.email[0];

          let toast = this.toastCtrl.create({
            message: errMessage,
            duration: 5000,
            position: 'top'
          });
          toast.present();
        }
      })
      .catch((err) => {
        //Should never get here
        this.showLoadingSpinner = false;
      });
    }
    else {
      // Unable to sign up

      this.showLoadingSpinner = false;

      let toast = this.toastCtrl.create({
        message: "No internet connection!",
        duration: 3000,
        position: 'top'
      });
      toast.present();
      console.log('SignupPage: register(): we are NOT online');
    }
  }



  login()
  // Show the login page
  {
    this.navCtrl.setRoot(LoginPage);
  }
}
