import { Component } from '@angular/core';
import { NavController, ModalController, AlertController } from 'ionic-angular';

import { ItemDetailPage } from '../item-detail/item-detail';
import { ItemCreatePage } from '../item-create/item-create';
import { ItemEditPage } from '../item-edit/item-edit';

import { DataProvider } from '../../providers/providers';

import * as moment from 'moment';

@Component({
  selector: 'page-list-master',
  templateUrl: 'swipe.html'
})
export class SwipePage {

  currentItems:   any = [];
  dataItems:      any = [];
  itemImage:      any = [{"type":"PHOTO"}, {"type":"PHOTO"}];
  hasDataItems:   boolean = false;

  constructor(public navCtrl: NavController,
              public alertController: AlertController,
              public dataProvider: DataProvider,
              public modalCtrl: ModalController) {

    // Show the items from the Vanilla App database
    this.displayDataItems();
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() {
    console.log('SwipePage did load');
  }


  displayDataItems()
  // Shows all of the items
  {
    this.dataProvider.getItems().then((data) => {
      console.log('SwipePage: displayDataItems: dataService.getItems() returned: ' + JSON.stringify(data));

      let numItems = Object.keys(data).length;

      console.log('SwipePage: displayDataItems(): numItems = ' + numItems);

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
        console.log("SwipePage: displayPlans() - No items to show");
      }

      return;

    });
  }



  displayMedia(itemIndex, annotationID)
  // Adds an item's image to the itemImage[] array
  {
    console.log('SwipePage: displayMedia(): Called with itemIndex = ' + itemIndex + ', ' + annotationID);

    this.itemImage[itemIndex].type = "";

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



  addItem()
  // Shows the ItemCreatePage for adding a new item
  {
    console.log('SwipePage: addItem()');
    let addModal = this.modalCtrl.create(ItemCreatePage);
    addModal.onDidDismiss(item => {
      // Refresh the display
      this.displayDataItems();
    });
    addModal.present();
  }



  editItem(itemID)
  // Shows the ItemEditPage to let user edit an item
  {
    console.log('ListMasterPage: editItem(): itemID = ' + itemID);
    let addModal = this.modalCtrl.create(ItemEditPage, {'itemID':itemID});
    addModal.onDidDismiss(item => {
      // Refresh the display
      this.displayDataItems();
    });
    addModal.present();
  }



  deleteItem(itemID)
  // Deletes an item
  {
    console.log('ListMasterPage: deleteItem()');
    let alert = this.alertController.create({
      title: 'Delete item',
      message: 'Are you sure you want to permanently delete this?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.dataProvider.getItem(itemID).then((item)=>{
              if (item) this.dataProvider.removeItem(item._id,item._rev).then((result)=>{
                this.displayDataItems();
              });
            })
          }
        }
      ]
    });
    alert.present();
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
