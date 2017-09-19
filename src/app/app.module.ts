import { NgModule, ErrorHandler } from '@angular/core';
import { Http } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';

import { AppVersion } from '@ionic-native/app-version';
import { StatusBar } from '@ionic-native/status-bar';
import { NativeStorage } from '@ionic-native/native-storage';
import { SplashScreen } from '@ionic-native/splash-screen';
import { CallNumber } from '@ionic-native/call-number';

import { VanillaApp } from './app.component';

import { TabsPage } from '../pages/tabs/tabs';
import { HomePage } from '../pages/home/home';
import { CardsPage } from '../pages/cards/cards';
import { ContactPage } from '../pages/contact/contact';
import { LoginPage } from '../pages/login/login';
import { MapPage } from '../pages/map/map';
import { SignupPage } from '../pages/signup/signup';
import { TutorialPage } from '../pages/tutorial/tutorial';
import { WelcomePage } from '../pages/welcome/welcome';
import { ListMasterPage } from '../pages/list-master/list-master';
import { ItemCreatePage } from '../pages/item-create/item-create';
import { ItemEditPage } from '../pages/item-edit/item-edit';
import { CommentCreatePage } from '../pages/comment-create/comment-create';
import { ItemDetailPage } from '../pages/item-detail/item-detail';
import { SearchPage } from '../pages/search/search';
import { SwipePage } from '../pages/swipe/swipe';

//import { Settings } from '../providers/settings';
import { AuthenticationProvider } from '../providers/authentication';
import { DataProvider } from '../providers/data';
import { MediaProvider } from '../providers/media';
import { ConnectivityService } from '../providers/connectivity-service';
import { LocalStorageProvider } from '../providers/local-storage';

import { OneSignal } from '@ionic-native/onesignal';

import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';

// The translate loader needs to know where to load i18n files
// in Ionic's static asset pipeline.
export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, './assets/i18n', '.json');
}


/**
 * The Pages array lists all of the pages we want to use in our app.
 * We then take these pages and inject them into our NgModule so Angular
 * can find them. As you add and remove pages, make sure to keep this list up to date.
 */
let pages = [
  TabsPage,
  VanillaApp,
  CardsPage,
  ContactPage,
  LoginPage,
  MapPage,
  SignupPage,
  TutorialPage,
  WelcomePage,
  ListMasterPage,
  ItemDetailPage,
  ItemCreatePage,
  ItemEditPage,
  CommentCreatePage,
  SearchPage,
  SwipePage,
  HomePage
];

export function declarations() {
  return pages;
}

export function entryComponents() {
  return pages;
}

export function providers() {
  return [
    AuthenticationProvider,
    DataProvider,
    MediaProvider,
    ConnectivityService,
    LocalStorageProvider,
    AppVersion,
    StatusBar,
    SplashScreen,
    NativeStorage,
    CallNumber,
    OneSignal,
    // Keep this to enable Ionic's runtime error handling during development
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ];
}

@NgModule({
  declarations: declarations(),
  imports: [
    IonicModule.forRoot(VanillaApp),
    BrowserModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: entryComponents(),
  providers: providers()
})
export class AppModule {}
