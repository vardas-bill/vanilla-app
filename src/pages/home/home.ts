import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { ListMasterPage } from '../list-master/list-master';
import { CardsPage } from '../cards/cards';


import {
  APP_NAME,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_NAMES,
  PRODUCT_CATEGORY1_SUBCATEGORIES,
  PRODUCT_CATEGORY2_SUBCATEGORIES,
  PRODUCT_CATEGORY3_SUBCATEGORIES,
  PRODUCT_CATEGORY4_SUBCATEGORIES,
  PRODUCT_CATEGORY5_SUBCATEGORIES,
  PRODUCT_CATEGORY6_SUBCATEGORIES } from '../../app/app.settings';

/**
 * Generated class for the Home page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  twoCategories:    boolean = false;
  threeCategories:  boolean = false;
  fourCategories:   boolean = false;
  sixCategories:    boolean = false;
  category1Text:    any = {'name':'One', 'keyword':'one'};
  category2Text:    any = {'name':'Two', 'keyword':'two'};
  category3Text:    any = {'name':'Three', 'keyword':'three'};
  category4Text:    any = {'name':'Four', 'keyword':'four'};
  category5Text:    any = {'name':'Five', 'keyword':'five'};
  category6Text:    any = {'name':'Six', 'keyword':'six'};

  constructor(public navCtrl: NavController, public navParams: NavParams) {

    switch (PRODUCT_CATEGORIES) {
      case 0 :
        break;
      case 2 :
        this.twoCategories = true;
        this.category1Text = PRODUCT_CATEGORY_NAMES[0];
        this.category2Text = PRODUCT_CATEGORY_NAMES[1];
        break;
      case 3 :
        this.threeCategories = true;
        this.category1Text = PRODUCT_CATEGORY_NAMES[0];
        this.category2Text = PRODUCT_CATEGORY_NAMES[1];
        this.category3Text = PRODUCT_CATEGORY_NAMES[2];
        break;
      case 4 :
        this.fourCategories = true;
        this.category1Text = PRODUCT_CATEGORY_NAMES[0];
        this.category2Text = PRODUCT_CATEGORY_NAMES[1];
        this.category3Text = PRODUCT_CATEGORY_NAMES[2];
        this.category4Text = PRODUCT_CATEGORY_NAMES[3];
        break;
      case 6 :
        this.sixCategories = true;
        this.category1Text = PRODUCT_CATEGORY_NAMES[0];
        this.category2Text = PRODUCT_CATEGORY_NAMES[1];
        this.category3Text = PRODUCT_CATEGORY_NAMES[2];
        this.category4Text = PRODUCT_CATEGORY_NAMES[3];
        this.category5Text = PRODUCT_CATEGORY_NAMES[4];
        this.category6Text = PRODUCT_CATEGORY_NAMES[5];
        break;
      default :
        break;
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Home');
  }



  goto(categoryButton)
  {
    switch (categoryButton) {
      case 1:
        this.navCtrl.setRoot(CardsPage);
        break;
      case 2:
        this.navCtrl.setRoot(CardsPage);
        break;
      case 3:
        this.navCtrl.setRoot(CardsPage);
        break;
      case 4:
        this.navCtrl.setRoot(ListMasterPage);
        break;
      case 5:
        this.navCtrl.setRoot(ListMasterPage);
        break;
      case 6:
        this.navCtrl.setRoot(ListMasterPage);
        break;
    }
  }

}
