import { Component, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { NavController, ViewController, NavParams, AlertController } from 'ionic-angular';

import { Camera } from 'ionic-native';

import { DataProvider } from '../../providers/data';
import { MediaProvider } from '../../providers/media';

@Component({
  selector: 'page-item-create',
  templateUrl: 'item-create.html'
})
export class ItemCreatePage {
  @ViewChild('fileInput') fileInput;

  isReadyToSave: boolean;

  item: any;
  annotationID: string = '';

  form: FormGroup;

  constructor(public navCtrl: NavController,
              public viewCtrl: ViewController,
              public dataProvider: DataProvider,
              public mediaProvider: MediaProvider,
              public navParams: NavParams,
              public alertCtrl: AlertController,
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

    // Watch the form for changes, and
    this.form.valueChanges.subscribe((v) => {
      this.isReadyToSave = this.form.valid;
    });
  }



  ionViewDidLoad() {
    console.log('ItemCreatePage did load');
  }



  getPicture()
  {
    console.log('ItemCreatePage: getPicture()');

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
    console.log('ItemCreatePage: processWebImage()');
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



  done()
  /**
   * The user is done and wants to create the item, so return it
   * back to the presenter.
   */
  {
    if(!this.form.valid) { return; }

    let data:any = {};
    data.itemType = this.form.value.itemType;
    data.title = this.form.value.title;
    data.productID = this.form.value.productID;
    data.description = this.form.value.description;
    data.size = this.form.value.size;
    data.price = this.form.value.price;
    data.currency = this.form.value.currency;
    data.flagged = this.form.value.promote;
    data.specialOffer = this.form.value.specialOffer;
    data.offerDescription = this.form.value.offerDescription;
    data.media = ((this.annotationID == '') ? [] : [this.annotationID]);

    // Add item to the database
    this.dataProvider.addItem(data).then((result)=>{
      this.viewCtrl.dismiss(this.form.value);
    });

  }
}
