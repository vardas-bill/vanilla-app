import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, Config, AlertController, Events } from 'ionic-angular';
import { StatusBar, Splashscreen, SecureStorage } from 'ionic-native';
import { AppVersion } from '@ionic-native/app-version';

import { FirstRunPage } from '../pages/pages';
import { CardsPage } from '../pages/cards/cards';
import { ContentPage } from '../pages/content/content';
import { LoginPage } from '../pages/login/login';
import { MapPage } from '../pages/map/map';
import { SignupPage } from '../pages/signup/signup';
import { TutorialPage } from '../pages/tutorial/tutorial';
import { WelcomePage } from '../pages/welcome/welcome';
import { ListMasterPage } from '../pages/list-master/list-master';
import { SearchPage } from '../pages/search/search';
import { SwipePage } from '../pages/swipe/swipe';

import { Data } from '../providers/data';
import { LocalStorage } from '../providers/local-storage';
import { Authentication } from '../providers/authentication';
import { ConnectivityService } from '../providers/connectivity-service';

import { OneSignal } from '@ionic-native/onesignal';

import { APP_NAME, SKIP_SECURESTORAGE, ENCRYPT_DATA } from '../app/app.settings';


import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  templateUrl: 'app.html'
})
export class VanillaApp {

  //rootPage = WelcomePage;

  @ViewChild(Nav) nav: Nav;

  pages: any[] = [
    //{ title: 'Tutorial', icon: 'add-circle', component: TutorialPage },
    { title: 'WELCOME', icon: 'add-circle', component: WelcomePage },
    { title: 'ABOUT US', icon: 'add-circle', component: ContentPage },
    { title: 'CARDS', icon: 'add-circle', component: CardsPage },
    /*
    { title: 'Login', icon: 'add-circle', component: LoginPage },
    { title: 'Signup', icon: 'add-circle', component: SignupPage },
    */
    { title: 'MAP', icon: 'add-circle', component: MapPage },
    { title: 'LIST', icon: 'add-circle', component: ListMasterPage },
    { title: 'SWIPE', icon: 'add-circle', component: SwipePage },
    { title: 'SEARCH', icon: 'add-circle', component: SearchPage }
  ];

  appVersionNumber:   string = '';

  constructor(public translate: TranslateService,
              public platform: Platform,
              public dataService: Data,
              public authentication: Authentication,
              public localStorage: LocalStorage,
              public connectivityService: ConnectivityService,
              public alertCtrl: AlertController,
              public config: Config,
              public events: Events,
              public oneSignal: OneSignal,
              private appVersion: AppVersion) {

    console.log('VanillaApp constructor running');

    // Set the default language for translation strings, and the current language.
    translate.setDefaultLang('en');
    translate.use('en');

    translate.get(['BACK_BUTTON_TEXT']).subscribe(values => {
      config.set('ios', 'backButtonText', values.BACK_BUTTON_TEXT);
    });

    console.log('VanillaApp about to call initializeApp');

    this.initializeApp();

    console.log('VanillaApp about to call addConnectivityListeners');

    this.addConnectivityListeners();
/*
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
*/
  }



  initializeApp()
  // Checks what needs to be done to start the App depending on whether or not this is the first
  // time the App is being used and whether or not we have an internet connection
  {
    console.log('VanillaApp: initializeApp() called');

    this.platform.ready().then(() => {

      console.log('VanillaApp: Platform ready!');

      //StatusBar.overlaysWebView(false); // let status bar overlay webview
      //StatusBar.backgroundColorByHexString('#fa1cff'); // set status bar to white
      //StatusBar.styleDefault();
      //StatusBar.backgroundColorByName('yellow');
      //Splashscreen.hide();
      StatusBar.styleDefault();
      StatusBar.backgroundColorByName('yellow');
      Splashscreen.hide();

      // Are we running on a device or in the browser?
      if (this.platform.is('cordova'))
      {
        console.log('VanillaApp: Running on a Cordova device');
/*
        //this.oneSignal.setLogLevel({logLevel: 6, visualLevel: 4});
        // :TO DO: Add Android push ID for OneSignal
        this.oneSignal.startInit('73205d7d-b2a8-40ad-9f62-5ad8234360f6', '');

        this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);

        this.oneSignal.handleNotificationReceived().subscribe(() => {
          // do something when notification is received
        });

        this.oneSignal.handleNotificationOpened().subscribe(() => {
          // do something when a notification is opened
        });

        this.oneSignal.endInit();
*/
        // :TO DO: Use the version number in the menu
        // Can only run getVersionNumber on an actual device
        this.appVersion.getVersionNumber().then((result) => {
          console.log('VanillaApp: Constructor: getVersionNumber returned = ' + result);
          this.appVersionNumber = result;
        });
      }
      else {
        // We are running in the browser so can't use the locally stored settings
        console.log('VanillaApp: NOT running on Cordova device');
      }

      this.nav.setRoot(WelcomePage);
    });
  }



  addConnectivityListeners()
  // Listen to online/offline status and react accordingly
  // NOT CURRENTLY USED
  {
    let onOnline = () =>
      // Called every time the App goes online
    {
      // Do something
    };

    let onOffline = () =>
      // Called every time the App goes offline
    {
      // Do something
    };

    document.addEventListener('online', onOnline, false);
    document.addEventListener('offline', onOffline, false);
  }



  logout()
  {
    this.authentication.logout();
    this.nav.setRoot(WelcomePage);
  }



  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
