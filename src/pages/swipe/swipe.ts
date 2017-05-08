import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';

import { ItemDetailPage } from '../item-detail/item-detail';
import { ItemCreatePage } from '../item-create/item-create';

import { Items } from '../../providers/providers';
import { Data } from '../../providers/providers';
import { Item } from '../../models/item';

import * as moment from 'moment';

@Component({
  selector: 'page-list-master',
  templateUrl: 'swipe.html'
})
export class SwipePage {

  currentItems:   Item[];
  dataItems:      any = [];
  itemImage:      any = [{"type":"PHOTO"}, {"type":"PHOTO"}];
  hasDataItems:   boolean = false;

  constructor(public navCtrl: NavController,
              public items: Items,
              public dataService: Data,
              public modalCtrl: ModalController) {

    // Get all of the DUMMMY items to be shown
    this.currentItems = this.items.query();

    // Show the items from the Vanilla App database
    this.displayDataItems();
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() {
    console.log('ListMasterPage did load');
  }


  displayDataItems()
  // Shows all of the items
  {
    this.dataService.getItems().then((data) => {
      console.log('ListMasterPage: displayDataItems: dataService.getItems() returned: ' + JSON.stringify(data));

      let numItems = Object.keys(data).length;

      console.log('ListMasterPage: displayDataItems(): numItems = ' + numItems);

      if (numItems !== 0) {
        this.hasDataItems = true;
        this.dataItems = data;

        // Go through changing the edit date of each Plan from iso format to the format we want and add associated immages to array.
        for (let i = 0; i < numItems; i++) {
          this.dataItems[i].updated = moment(this.dataItems[i].updated);

          this.displayMedia(i, this.dataItems[i].media[0]);
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

    this.itemImage[itemIndex].type = "";

    // Get every step so it can be shown
    this.dataService.getAnnotation(annotationID).then((annotation)=>
    {
      if (annotation) {
        this.itemImage[itemIndex] = annotation[0];
        console.log('ListMasterPage: displayMedia(): itemImage array after getting annotation is now: ' + JSON.stringify(this.itemImage));
      }
      else console.log('ListMasterPage: displayMedia(): getAnnotation: NO annotation returned ');
    });
  }


  addItem()
  /**
   * Prompt the user to add a new item. This shows our ItemCreatePage in a
   * modal and then adds the new item to our data source if the user created one.
   */
  {
    console.log('ListMasterPage: addItem()');
    let addModal = this.modalCtrl.create(ItemCreatePage);
    addModal.onDidDismiss(item => {
      if (item) {
        this.items.add(item);
      }
    })
    addModal.present();
  }




  deleteItem(item)
  /**
   * Delete an item from the list of items.
   */
  {
    console.log('ListMasterPage: deleteItem()');
    this.items.delete(item);
  }




  openItem(item, itemImage)
  /**
   * Navigate to the detail page for this item.
   */
  {
    console.log('ListMasterPage: openItem()');
    this.navCtrl.push(ItemDetailPage, {
      item: item,
      itemImage: itemImage
    });
  }
}
