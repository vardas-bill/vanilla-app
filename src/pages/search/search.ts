import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { ItemDetailPage } from '../item-detail/item-detail';


@Component({
  selector: 'page-search',
  templateUrl: 'search.html'
})
export class SearchPage {
  currentItems: any = [];

  constructor(public navCtrl: NavController,
              public navParams: NavParams) {}

  ionViewDidLoad() {
    console.log('SearchPage did load');
  }

  /**
   * Perform a service for the proper items.
   */
  getItems(ev) {
    let val = ev.target.value;
    if(!val || !val.trim()) {
      this.currentItems = [];
      return;
    }

    //this.currentItems = this.items.query({name: val});
  }

  /**
   * Navigate to the detail page for this item.
   */
  openItem(item: any) {
    this.navCtrl.push(ItemDetailPage, {
      item: item
    });
  }

}
