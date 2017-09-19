import { Injectable } from '@angular/core';
import { AlertController} from 'ionic-angular';
import { Platform } from 'ionic-angular';

import { FB_LINK, TW_LINK } from '../app/app.settings';

import moment from 'moment';


/*
 Some common shared functions
 */
@Injectable()
export class CommonFunctionsProvider {

  constructor(public alertCtrl: AlertController,
              public platform: Platform) {

  }

  extractYearMonth(id:string):any
  // Extracts the year/month data from a News item or Calendar item ID
  {
    let colon: number = id.indexOf(':');
    let index: number = 0;
    if (colon != -1) index = colon + 1;

    let year = id.substring(0, id.indexOf('-'));
    let monthID = id.substring(id.indexOf('-') + 1);
    let monthName = moment(monthID, 'MM').format('MMMM');

    return({
      'year': year,
      'monthID': monthID,
      'monthName': monthName
    });
  }




  showAlertMessage(title, message)
  {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: message,
      buttons: ['Ok']
    });
    alert.present(alert);
  }


  gotoFacebook()
  {
    window.open(FB_LINK, '_system', 'location=no');
  }



  gotoTwitter()
  {
    window.open(TW_LINK, '_system', 'location=no');
  }
}

