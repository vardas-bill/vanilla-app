import { Component, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { NavController, ViewController, NavParams, AlertController, ToastController } from 'ionic-angular';

import { Camera } from 'ionic-native';

import { DataProvider } from '../../providers/data';
import { MediaProvider } from '../../providers/media';

@Component({
  selector: 'page-item-edit',
  templateUrl: 'item-edit.html'
})
export class ItemEditPage {
  @ViewChild('fileInput') fileInput;

  isReadyToSave:  boolean = true;

  item:           any;
  itemID:         string;
  itemImage:      any;
  annotationID:   string = '';

  form: FormGroup;

  constructor(public navCtrl: NavController,
              public viewCtrl: ViewController,
              public dataProvider: DataProvider,
              public mediaProvider: MediaProvider,
              public navParams: NavParams,
              public alertCtrl: AlertController,
              public toastCtrl: ToastController,
              formBuilder: FormBuilder) {

    this.form = formBuilder.group({
      itemPic: [''],
      itemType: ['', Validators.required],
      title: ['', Validators.required],
      productID: [''],
      description: ['', Validators.required],
      price: [''],
      currency: [''],
      size: [''],
      promote: [false],
      specialOffer: [false],
      offerDescription: ['']
    });

    this.itemID = this.navParams.get('itemID');
    this.dataProvider.getItem(this.itemID).then((result)=>{
      if (result) {
        console.log('ItemEditPage: Constructor: getItem returned result = ' + JSON.stringify(result));

        this.item = result;

        // :TO DO: Cater for multiple photos!

        this.annotationID = result.media[0];
        // Get the photo annotation
        this.dataProvider.getAnnotation(this.annotationID).then((annotation)=>
        {
          if (annotation) {
            this.itemImage = annotation[0].media;

            // Fill the form
            this.form = formBuilder.group({
              itemPic: [this.itemImage],
              itemType: [result.itemType, Validators.required],
              title: [result.title, Validators.required],
              productID: [result.productID],
              description: [result.description, Validators.required],
              price: [result.price],
              currency: [result.currency],
              size: [result.size],
              promote: [result.flagged],
              specialOffer: [result.specialOffer],
              offerDescription: [result.offerDescription]
            });
            console.log('ItemEditPage: Constructor: itemImage after getting annotation is now: ' + JSON.stringify(this.itemImage));
          }
          else console.log('ItemEditPage: Constructor: getAnnotation: NO annotation returned ');
        });
      }
    });

    // Watch the form for changes, and
    this.form.valueChanges.subscribe((v) => {
      this.isReadyToSave = this.form.valid;
    });
  }



  ionViewDidLoad() {
    console.log('ItemEditPage did load');
  }



  getPicture()
  {
    console.log('ItemEditPage: getPicture()');

    let alert = this.alertCtrl.create({
      title: 'Supply Image',
      message: 'Do you want to take a new photo, or select one from your device?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'New Photo',
          handler: () => {
            this.mediaProvider.takePhotograph()
              .then((image)=>
              {
                let itemImage 	= image.toString();

                this.dataProvider.addAnnotation('PHOTO', '', itemImage).then((id)=>{

                  if (!id) return;

                  this.annotationID = id;

                  // :TO DO: Delete old photo annotation

                  this.form.patchValue({ 'itemPic': 'data:image/jpg;base64,' +  image });
                });
              })
              .catch((err)=>
              {
                console.log('ERROR: ItemCreatePage: getPicture(): err = ' + err);
              });
          }
        },
        {
          text: 'Select Photo',
          handler: () => {
            this.mediaProvider.selectPhotograph()
              .then((image)=>
              {
                let itemImage 	= image.toString();

                this.dataProvider.addAnnotation('PHOTO', '', itemImage).then((id)=>{

                  if (!id) return;

                  this.annotationID = id;

                  // :TO DO: Delete old photo annotation

                  this.form.patchValue({ 'itemPic': 'data:image/jpg;base64,' +  image });
                });
              })
              .catch((err)=>
              {
                console.log('ERROR: ItemCreatePage: getPicture(): err = ' + err);
              });
          }
        }
      ]
    });
    alert.present();
  }



  processWebImage(event)
  // Gets image from computer (called when testing App on computer rather than mobile device)
  {
    console.log('ItemEditPage: processWebImage()');
    let input = this.fileInput.nativeElement; // Get reference to the fileInput DOM element

    var reader = new FileReader();
    reader.onload = (readerEvent) => {
      input.parentNode.removeChild(input);

      var imageData = (readerEvent.target as any).result;
      this.form.patchValue({ 'itemPic': imageData });
    };

    reader.readAsDataURL(event.target.files[0]);
  }



  getItemImageStyle()
  {
    return 'url(' + this.form.controls['itemPic'].value + ')'
  }



  cancel()
  /**
   * The user cancelled, so we dismiss without sending data back.
   */
  {
    this.viewCtrl.dismiss();
  }



  save()
  // Save the edits
  {
    if(!this.form.valid) { return; }

    this.item.itemType = this.form.value.itemType;
    this.item.title = this.form.value.title;
    this.item.productID = this.form.value.productID;
    this.item.description = this.form.value.description;
    this.item.size = this.form.value.size;
    this.item.price = this.form.value.price;
    this.item.currency = this.form.value.currency;
    this.item.flagged = this.form.value.promote;
    this.item.specialOffer = this.form.value.specialOffer;
    this.item.offerDescription = this.form.value.offerDescription;
    this.item.media = ((this.annotationID == '') ? [] : [this.annotationID]);

    // Update the item in the database
    this.dataProvider.updateItem(this.item).then((result)=>{
      this.viewCtrl.dismiss(this.form.value);
    });

  }



  delete()
  {
    let alert = this.alertCtrl.create({
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
            this.dataProvider.getItem(this.itemID).then((item)=>{
              if (item) this.dataProvider.removeItem(item._id,item._rev).then((result)=>{
                this.viewCtrl.dismiss(false);
              });
            })
          }
        }
      ]
    });
    alert.present();
  }
}
