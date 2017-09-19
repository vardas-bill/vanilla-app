import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { DataProvider } from '../../providers/data';

import { CardsPage } from '../cards/cards';


import {
  APP_NAME,
  DO_LOGIN,
  MAJOR_CATEGORY_BUTTON,
  PRODUCT_CATEGORY1_SUBCATEGORIES,
  PRODUCT_CATEGORY2_SUBCATEGORIES,
  PRODUCT_CATEGORY3_SUBCATEGORIES,
  PRODUCT_CATEGORY4_SUBCATEGORIES,
  PRODUCT_CATEGORY5_SUBCATEGORIES,
  PRODUCT_CATEGORY6_SUBCATEGORIES } from '../../app/app.settings';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  majorCategoryButton: any = MAJOR_CATEGORY_BUTTON;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public dataProvider: DataProvider) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Home');
  }



  goto(categoryButton)
  {
    switch (categoryButton) {
      case 0:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
      case 1:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
      case 2:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
      case 3:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
      case 4:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
      case 5:
        this.navCtrl.setRoot(CardsPage, {'keyword':this.majorCategoryButton[categoryButton].keyword, 'name':this.majorCategoryButton[categoryButton].name});
        break;
    }
  }

}
