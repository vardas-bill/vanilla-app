import { Component, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { NavController, ViewController } from 'ionic-angular';

import { Camera } from 'ionic-native';

import { DataProvider } from '../../providers/data';
import { MediaProvider } from '../../providers/media';

@Component({
  selector: 'page-comment-create',
  templateUrl: 'comment-create.html'
})
export class CommentCreatePage {
  @ViewChild('fileInput') fileInput;

  isReadyToSave: boolean;

  item:           any;
  annotationID:   string = '';
  commentImage:   string = '';

  form: FormGroup;

  constructor(public navCtrl: NavController,
              public viewCtrl: ViewController,
              public dataProvider: DataProvider,
              public mediaProvider: MediaProvider,
              formBuilder: FormBuilder) {

    this.form = formBuilder.group({
      itemPic: [''],
      comment: ['']
    });

    // Watch the form for changes, and
    this.form.valueChanges.subscribe((v) => {
      this.isReadyToSave = this.form.valid;
    });
  }



  ionViewDidLoad() {
    console.log('CommentCreatePage did load');
  }



  getPicture()
  {
    console.log('CommentCreatePage: getPicture()');
    this.mediaProvider.takePhotograph()
      .then((image)=>
      {
        this.commentImage 	= image.toString();

        this.dataProvider.addAnnotation('PHOTO', '', this.commentImage).then((id)=>{
          console.log('CommentCreatePage: getPicture(): addAnnotation retrned ID = ' + id);
          if (!id) return;

          this.annotationID = id;
          this.form.patchValue({ 'itemPic': 'data:image/jpg;base64,' +  image });
        });
      })
      .catch((err)=>
      {
        console.log('ERROR: CommentCreatePage: getPicture(): err = ' + err);
      });
  }



  processWebImage(event)
  // Gets image from computer (called when testing App on computer rather than mobile device)
  {
    console.log('CommentCreatePage: processWebImage()');
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
    data.comment = this.form.value.comment;
    data.photoID = this.annotationID;

    this.viewCtrl.dismiss(data);
  }
}
