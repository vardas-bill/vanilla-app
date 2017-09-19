import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { DataProvider } from '../../providers/providers';

import { APP_NAME } from '../../app/app.settings';

import * as moment from 'moment';

/*
  Generated class for the Cards page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html'
})
export class CardsPage {

  hasDataItems: boolean = false;
  dataItems: any[];
  itemImage: any = [];
  itemComments: any = [];
  itemCommentsCount: any = [];
  keyword: string;
  name: string;


  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public dataProvider: DataProvider) {

    this.keyword = this.navParams.get('keyword');
    this.name = this.navParams.get('name');

    this.displayDataItems();

  }



  displayDataItems()
  // Shows all of the items
  {
    this.dataProvider.getItems().then((data) => {
      console.log('ListMasterPage: displayDataItems: dataService.getItems() returned: ' + JSON.stringify(data));

      let numItems = Object.keys(data).length;

      console.log('ListMasterPage: displayDataItems(): numItems = ' + numItems);

      if (numItems !== 0) {
        this.hasDataItems = true;
        this.dataItems = data;

        // Go through changing the edit date of each Plan from iso format to the format we want and add associated immages to array.
        for (let i = 0; i < numItems; i++) {
          // Don't include this entry if it doesn't match the keyword
          console.log('+++++ this.dataItems[i].itemType = ' + this.dataItems[i].itemType + ', this.keyword = ' + this.keyword
            + ', this.dataItems[i].itemType.indexOf(this.keyword) = ' + this.dataItems[i].itemType.indexOf(this.keyword));
          if (this.keyword != 'ALL' && this.keyword != '' && this.dataItems[i].itemType.indexOf(this.keyword) == -1) {
            this.dataItems.splice(i,1);
            i = i - 1;
            numItems = numItems - 1;
            continue;
          }

          this.dataItems[i].updated = moment(this.dataItems[i].updated).format('MMM Do YYYY');

          // Initialise itemImage array entry in preparation for being filled by displayMedia
          this.itemImage.push({'type':'', 'media':''});
          this.displayMedia(i, this.dataItems[i].media[0]);

          // Initialise itemComments array entry in preparation for being filled by displayMedia
          this.itemComments.push({'type':'', 'media':''});
          this.displayComments(i, this.dataItems[i]._id);
        }
      }
      else {
        this.hasDataItems = false;
        this.dataItems = [];
        console.log("ListMasterPage: displayPlans() - No items to show");
      }

      return;

    });
  }



  displayMedia(itemIndex, annotationID)
  // Adds an item's image to the itemImage[] array
  {
    console.log('ListMasterPage: displayMedia(): Called with itemIndex = ' + itemIndex + ', ' + annotationID);

    // Get every step so it can be shown
    this.dataProvider.getAnnotation(annotationID).then((annotation)=>
    {
      if (annotation) {
        this.itemImage[itemIndex] = annotation[0];
        console.log('ListMasterPage: displayMedia(): itemImage array after getting annotation is now: ' + JSON.stringify(this.itemImage));
      }
      else console.log('ListMasterPage: displayMedia(): getAnnotation: NO annotation returned ');
    });
  }



  displayComments(itemIndex, itemID)
  // Gets the comments for the given item
  {
    console.log('ListMasterPage: displayComments(): Called with itemIndex = ' + itemIndex + ', and itemID = ' + itemID);

    // Get every comment so it can be shown
    this.dataProvider.getComments(itemID).then((comments)=>{
      if (comments) {
        console.log('CardsPage: displayComments(): number of comments found is = ' + comments.length);
        this.itemCommentsCount[itemIndex] = comments.length;
        // Put array of comments in most recent first order
        this.itemComments[itemIndex] = comments.reverse();
      }
      else {
        console.log('ItemDetailPage: getComments(): No comments found ');
        this.itemCommentsCount[itemIndex] = 0;
      }
    });
  }
}
