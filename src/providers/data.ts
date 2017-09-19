import { Injectable, OpaqueToken } from '@angular/core';
import { Network } from 'ionic-native';
import { NativeStorage } from '@ionic-native/native-storage';
import { Platform, ToastController, AlertController, Events} from 'ionic-angular';

import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';

//import CryptoPouch from 'crypto-pouch';
import CryptoJS from 'crypto-js';

import { DO_LOGIN,
  APP_NAME,
  PRODUCT_DB_NAME,
  COUCHDB_SERVER,
  COUCHDB_SERVER_URL,
  REMOTE_SERVER,
  SKIP_SECURESTORAGE,
  ENCRYPT_DATA } from '../app/app.settings';

import * as moment from 'moment';


/*
 Provider for all database stuff
 Uses PouchDB/CouchDB:
 https://pouchdb.com/
 http://couchdb.apache.org/
 */

@Injectable()
export class DataProvider {

  data:                       any;
  _userDB:                    any;
  _remoteUserDB:              any;
  _productDB:                 any;
  _remoteProductDB:           any;
  encryptKey:                 string = '';
  _syncHandler:               any = null;
  remote:                     any;
  syncHandler:                any;

  // Array of field names used by the encryption functions to determine which fields need to be JSON.stringified
  // All the fields listed in this array will be passed through JSON.stringify (encrypt) and JOSN.parse (decrypt)
  // If a field is a string it does not need to be in this list. ALL other fields do need to be in this list.
  nonStringFields:            any = [
    'media',
    'flagged',
    'offer',
    'annotations'];

  constructor(public alertCtrl: AlertController,
              public nativeStorage: NativeStorage,
              public platform: Platform,
              public events: Events) {

  }


  cancelSyncing()
  // Cancels syncing data to the server
  {
    if (this.syncHandler != null) this.syncHandler.cancel();
  }



  getDBPaths()
  {
    console.log('DataProvider: getDBPaths(): called.');

    return new Promise(resolve => {
      if (this.platform.is('cordova')) {
        this.nativeStorage.getItem('dbPaths')
          .then(
            data => {
              console.log('Data: getDBPaths(): get from secure storage = ' + data);
              resolve(JSON.parse(data));
            },
            error => {
              console.log('Data: getDBPaths(): get from secure ERROR = ' + error);
              resolve(false);
            }
          );
      }
      else {
        resolve(false);
      }
    });
  }


  init()//localDBName, remoteDBName)
  // Initialises the database - Called every time the App starts or the user logs in or registers
  {
    console.log('DataProvider: init() called');

    // Get the DB paths from local storage so we can open and sync to them
    return this.getDBPaths().then((paths:any)=>{
      console.log('Data: init(): getDBPaths returned = ' + JSON.stringify(paths));

      var localProductDBName = PRODUCT_DB_NAME;

      if (paths) {
        var localUserDBName = paths.localUserDB;
        var remoteUserDBName = paths.remoteUserDB;
        var remoteProductDBName = paths.remoteProductDB;

        console.log('DataProvider: init(): getDBPaths gave = ' + JSON.stringify(paths));
      }
      else { // This needed for testing with ionic serve when there is not any localstorage
        localUserDBName = "a@a.com";
        if (DO_LOGIN) {
          remoteUserDBName = "http://SDAaphrRTlm7Fg0J9sFHhA:W7oft_IsTtaZmOZ04Q0Tdg@localhost:5984/vanilla$a(40)a(2e)com";
          remoteProductDBName = "http://SDAaphrRTlm7Fg0J9sFHhA:W7oft_IsTtaZmOZ04Q0Tdg@localhost:5984/product";
        }
        else {
          remoteUserDBName = null;
          remoteProductDBName = "http://localhost:5984/product";
        }
        console.log('DataProvider: init(): getDBPaths returned false. Using paths remoteUserDBName = ' + remoteUserDBName + ', remoteProductDBName = ' + remoteProductDBName);

      }


      // ------------------------------------------------
      // [1] First connect to the shared product database
      //
      this._productDB = new PouchDB(localProductDBName);

      console.log('Data: init(): PouchDB database opened for localProductDBName = ' + localProductDBName);
      console.log('Data: init(): this._productDB = ' + JSON.stringify(this._productDB));

      // Insert the url for the CouchDB server into the remoteProductDBName
      var realRemoteProductDB = remoteProductDBName.replace("localhost:5984", COUCHDB_SERVER_URL);

      console.log('Data: init(): real remoteProductDB path being used is: ' + realRemoteProductDB);

      this._remoteProductDB = new PouchDB(realRemoteProductDB);

      console.log('Data: init(): this._remoteProductDB = ' + JSON.stringify(this._remoteProductDB));

      let options = {
        live: true,
        retry: true,
        continuous: true
      };

      this._productDB.sync(this._remoteProductDB) //No options here -> One time sync
        .on('complete', (info) => {
          this.events.publish('SYNC_FINISHED', true); // Let login etc. know we have synced the product data
          console.log('++++++ Data: init(): *productDB* first one time sync has completed about to do live syncing now');
          //this.events.publish('SYNC_FINISHED', true); // Let login etc. know we have synced the data
          return this._productDB.sync(this._remoteProductDB, options) //Continous sync with options
            .on('complete', (info) => {
              console.log('***** DATA: init() *productDB* Complete: Handling syncing complete');
              console.dir(info);
            })
            .on('change', (info) => {
              console.log('***** DATA: init() *productDB* Change: Handling syncing change');
              console.dir(info);
            })
            .on('paused', (info) => {
              console.log('***** DATA: init() *productDB* Paused: Handling syncing pause');
              console.dir(info);
            })
            .on('active', (info) => {
              console.log('***** DATA: init() *productDB* Active: Handling syncing resumption');
              console.dir(info);
            })
            .on('error', (err) => {
              console.log('***** DATA: init() *productDB* Error: Handling syncing error');
              console.dir(err);
            })
            .on('denied', (err) => {
              console.log('***** DATA: init() *productDB* Denied: Handling syncing denied');
              console.dir(err);
            });
        })
        .on('error', (err) => {
          console.log('ERROR ***** DATA: init() *productDB* Error: First Sync: Handling syncing error');
          console.dir(err);
          this.events.publish('SYNC_FINISHED', false); // Let login etc. know sync failed
        })
        .on('denied', (err) => {
          console.log('DENIED ***** DATA: init() *productDB* Denied: First Sync: Handling syncing denied');
          console.dir(err);
        });


      // ------------
      // [2] Connect to the user's private database (for user settings, bookmarks, profile, etc.)
      //
      // Only do this if users have to login
      if (DO_LOGIN) {
        this._userDB = new PouchDB(localUserDBName);

        console.log('Data: init(): PouchDB database opened for localDBName = ' + localUserDBName);

        if (!remoteUserDBName) return;  // Don't sync local DB with remote DB as there is no remote DB to sync with

        // Insert the url for the CouchDB server into the remoteDBName
        var realRemoteUserDB = remoteUserDBName.replace("localhost:5984", COUCHDB_SERVER_URL);

        console.log('Data: init(): realRemoteUserDB path being used is: ' + realRemoteUserDB);

        this._remoteUserDB = new PouchDB(realRemoteUserDB);

        options = {
          live: true,
          retry: true,
          continuous: true
        };

        this._userDB.sync(this._remoteUserDB) //No options here -> One time sync
          .on('complete', (info) => {
            console.log('++++++ Data: init(): *userDB* first one time sync has completed about to do live syncing now');
            return this._userDB.sync(this._remoteUserDB, options) //Continous sync with options
              .on('complete', (info) => {
                console.log('***** DATA: init() *userDB* Complete: Handling syncing complete');
                console.dir(info);
              })
              .on('change', (info) => {
                console.log('***** DATA: init() *userDB* Change: Handling syncing change');
                console.dir(info);
              })
              .on('paused', (info) => {
                console.log('***** DATA: init() *userDB* Paused: Handling syncing pause');
                console.dir(info);
              })
              .on('active', (info) => {
                console.log('***** DATA: init() *userDB* Active: Handling syncing resumption');
                console.dir(info);
              })
              .on('error', (err) => {
                console.log('***** DATA: init() *userDB* Error: Handling syncing error');
                console.dir(err);
              })
              .on('denied', (err) => {
                console.log('***** DATA: init() *userDB* Denied: Handling syncing denied');
                console.dir(err);
              });
          })
          .on('error', (err) => {
            console.log('***** DATA: init() *userDB* Error: First Sync: Handling syncing error');
            console.dir(err);
          })
          .on('denied', (err) => {
            console.log('***** DATA: init() *userDB* Denied: First Sync: Handling syncing denied');
            console.dir(err);
          });
      }
    });
  }



  //========================
  //+++ PRODUCTS DB ++++++++
  //========================

  //=====================
  // ITEMS

  addItem(data)
  // Add a new item (e.g. a product or service)
  {
    console.log('Data: addItem(): called with data = ' + JSON.stringify(data));

    let timeStamp = new Date().toISOString();
    let item = {
      _id: 'ITEM:' + timeStamp,
      itemType: data.itemType.toLowerCase(),
      title: data.title,
      productID: data.productID,
      description: data.description,
      size: data.size,
      price: data.price,
      currency: data.currency,
      media: data.media,         // An array of IDs for the associated media texts, images, audio, etc.
      flagged: data.flagged,
      specialOffer: data.specialOffer,
      offerDescription: data.offerDescription,
      created: timeStamp,
      updated: timeStamp
    };

    var encryptedData = this.encryptData(item);
    console.log('Data: addItem(): Completed encryption of item. encryptedData = ' + JSON.stringify(encryptedData));

    return this._productDB.put(encryptedData)
      .then(function (response) {
        console.log('Data: addItem(): Put returned - ' + JSON.stringify(response));
        return response.id;
      })
      .catch((err) => {
        console.log('ERROR: Data: addItem(): Error: ' + err);
        return false;
      });
  }



  getItem(id)
  // Get a specific item
  {
    return this._productDB.get(id)
      .then((doc) => {
        console.log('Data: getItem(): Found item: ' + JSON.stringify(doc));
        var decryptedData = this.decryptData(doc);
        console.log('Data: getItem(): About to return: ' + JSON.stringify(decryptedData));
        return decryptedData;
      })
      .catch((err)=>{
        console.log('ERROR Data: getItem(): could not get item. err = : ' + err);
        return false;
      });
  }



  getItems()
  // Get all of a user's items
  {
    return this._productDB.allDocs({
      include_docs: true,
      startkey: 'ITEM:',
      endkey: 'ITEM:\uffff',
      attachments: true})

      .then((doc)=> {
        let k;
        let items = [];
        let row = doc.rows;
        let decryptedData:any = [];

        for (k in row) {
          let item = row[k].doc;

          item = this.decryptData(item);

          // Items that have flagged = true go to the top (unshift) otherwise they go to the bottom (push)
          if (item.flagged)
            items.unshift(item);
          else
            items.push(item);
        }
        console.log('Data: getItems(): returning: ' + JSON.stringify(items));
        return items;
      })
      .catch((err)=>{
        return false;
      });
  }



  countItems()
  // Counts the number of items
  {
    return this._productDB.allDocs({
      include_docs: false,
      startkey: 'ITEM:',
      endkey: 'ITEM:\uffff',
      attachments: false
    })
      .then(function (result) {
        return(result.rows.length)
      })
      .catch(function (err) {
        return(0);
      });
  }



  updateItem(itemData:any)//id, title, important, steps, people)
  // Amend an existing item
  {
    console.log('Data: updateItem() called with new itemData = ' + JSON.stringify(itemData));
    console.log('Data: updateItem() itemData._id = ' + itemData._id);

    // Get from the DB the item we want to change to make sure we have the most up to date rev
    return this.getItem(itemData._id)
      .then((item: any) => {
        let now = new Date().toISOString();
        let updatedItem:any = itemData;

        updatedItem._id = itemData._id;
        updatedItem._rev = item._rev;
        updatedItem.created = item.created;
        updatedItem.updated = now;

        console.log('Data: updateItem() about to put updatedItem = ' + JSON.stringify(itemData));

        this._productDB.put(updatedItem)
          .then((result) => {
            console.log('Data: updateItem() put succeeded');
            return(true);
          })
          .catch((err)=>{
            console.log('ERROR: Data: updateItem(): Error doing put = ' + err);
            return(false);
          });
      }).catch((err) => {
        console.error('ERROR: Data: updateItem(): Error getting item to update, error = ', err);
        return(false);
      });
  }



  removeItem(id, rev)
  // Remove a specific item
  {
    let item = {_id: id, _rev: rev};

    // Remove the item's steps (annotations) from the database
    this.getItem(id).then((data:any)=>{
      // Remove each of the items's annotations
      for (var i = 0; i < data[0].media.length; i++) {
        this.getAnnotation(data[0].media[i]).then((data:any)=>{
          console.log('Data: removeItem(): About to remove annotation: ' + JSON.stringify(data));
          this.removeAnnotation(data[0].id, data[0].rev).then((result) => {
          });
        });
      }
    });

    return this._productDB.remove(item)
      .then((result)=>{
        return(true);
      })
      .catch((err) => {
        console.log('ERROR: Data: removeItem() _productDB.remove error is: ' + err);
        return(false);
      });
  }




  //==========================================
  // COMMENTS - For user's to comment on items

  addComment(theComment, thePhotoID, theUserID, theItemID)
  // Add a new comment
  {
    console.log('Data: addComment(): called with comment = ' + theComment);

    let timeStamp = new Date().toISOString();
    let comment = {
      _id: 'COMMENT:' + theItemID + ':' + timeStamp,
      itemID:  theItemID,
      comment: theComment,
      userID:  theUserID,
      photoID: thePhotoID,
      created: timeStamp,
      updated: timeStamp
    };

    var encryptedData = this.encryptData(comment);
    console.log('Data: addComment(): Completed encryption of addComment. encryptedData = ' + JSON.stringify(encryptedData));

    return this._productDB.put(encryptedData)
      .then(function (response) {
        console.log('Data: addComment(): Put returned - ' + JSON.stringify(response));
        return response.id;
      })
      .catch((err) => {
        console.log('ERROR: Data: addComment(): Error: ' + err);
        return false;
      });
  }



  getComment(commentID)
  // Gets a specific comment
  {
    return this._productDB.get(commentID)
      .then((doc) => {
        console.log('Data: getComment(): Found comment: ' + JSON.stringify(doc));
        var decryptedData = this.decryptData(doc);
        return decryptedData;
      })
      .catch((err)=>{
        console.log('ERROR Data: getComment(): could not get comment. err = : ' + err);
        return false;
      });
  }



  getComments(itemID)
  // Get all comments for a given item
  {
    console.log('Data: getComments(): Called with itemID = ' + itemID);

    let startKey = 'COMMENT:' + itemID;
    let endKey = 'COMMENT:' + itemID + '\uffff';

    console.log('Data: getComments(): startKey = ' + startKey + ', endKey = ' + endKey);

    return this._productDB.allDocs({
      include_docs: true,
      startkey: startKey,
      endkey: endKey,
      attachments: false})

      .then((doc)=> {
        console.log('Data: getComments(): allDocs returned docs = ' + JSON.stringify(doc));
        let k;
        let comments = [];
        let row = doc.rows;
        console.log('Data: getComments(): row = ' + JSON.stringify(row));

        for (k in row) {
          let comment = row[k].doc;
          console.log('Data: getComments(): comment (in for loop) = ' + JSON.stringify(comment));
          comment = this.decryptData(comment);
          comments.push(comment);
        }
        //console.log('Data: getComments(): returning: ' + JSON.stringify(comments));
        return comments;
      })
      .catch((err)=>{
        console.log('ERROR: Data: getComments(): err = ' + err);
        return false;
      });
  }



  countComments(itemID)
  // Counts the number of comments for a given item
  {
    return this._productDB.allDocs({
      include_docs: false,
      startkey: 'COMMENT:' + itemID,
      endkey: 'COMMENT:' + itemID + '\uffff',
      attachments: false
    })
      .then(function (result) {
        return(result.rows.length)
      })
      .catch(function (err) {
        return(0);
      });
  }



  updateComment(commentData:any)//id, title, important, steps, people)
  // Amend an existing item
  {
    console.log('Data: updateComment() called with new commentData = ' + commentData);

    // Get from the DB the comment we want to change to make sure we have the most up to date rev
    return this.getComment(commentData._id)
      .then((comment: any) => {
        let now = new Date().toISOString();
        let updatedComment:any = commentData;

        updatedComment._id = commentData.id;
        updatedComment._rev = comment[0].rev;
        updatedComment.created = comment[0].created;
        updatedComment.updated = now;

        this._productDB.put(updatedComment)
          .then((result) => {
            console.log('Data: updateComment() put succeeded');
            return(true);
          })
          .catch((err)=>{
            console.log('ERROR: Data: updateComment(): Error doing put = ' + err);
            return(false);
          });
      }).catch((err) => {
        console.error('ERROR: Data: updateComment(): Error getting comment to update, error = ', err);
        return(false);
      });
  }



  removeComment(commentID, commentRev)
  // Remove a specific comment
  {
    let comment = {_id: commentID, _rev: commentRev};

    return this._productDB.remove(comment)
      .then((result)=>{
        return(true);
      })
      .catch((err) => {
        console.log('ERROR: Data: removeComment() _productDB.remove error is: ' + err);
        return(false);
      });
  }



  //================
  //++++++++++++++++
  //
  // COMMON/SHARED

  //========================
  // Walkthrough

  createWalkthroughFlags(walkthroughName)
  // Creates the tutorial flags database document, setting walkthroughName to true (if not null)
  // - walkthroughName is the name of a tutorial flag to be set to true (null means no flag to set)
  // - Returns id of created tutorialFlags
  {
    let startState = {
      'firstTime'     : 'false',
      'viewing'       : 'false',
      'saved'         : 'false',
      'bookmarks'     : 'false',
      'sharing'       : 'false',
      'comments'      : 'false'
    };

    if (walkthroughName != null)
      startState[walkthroughName] = 'true';

    let timeStamp = new Date().toISOString();
    let walkthrough = {
      _id           : 'WALKTHROUGH:',
      firstTime     : startState['firstTime'],
      viewing       : startState['viewing'],
      saved         : startState['saved'],
      bookmarks     : startState['bookmarks'],
      sharing       : startState['sharing'],
      comments      : startState['comments'],
      created: timeStamp,
      updated: timeStamp
    };
    console.log('Data: createWalkthroughFlags: About to .put: ' + JSON.stringify(walkthrough));
    return this._userDB.put(walkthrough)
      .then(function (response) {
        console.log('Data: createWalkthroughFlags(): created new walkthrough flags document put returned: ' + JSON.stringify(response));
        return response.id;
      })
      .catch((err) => {
        console.log('ERROR: Data: createWalkthroughFlags(): put returned error = ' + err);
        return err;
      });
  }



  getWalkthroughFlags(walkthroughName)
  // Gets the walkthrough flags document. If it doesn't exist yet it is created and walkthroughName is set to true (if not null)
  // - walkthroughName is the name of the tutorial flag to set, if any. null means no flag to set.
  // + Returns the tutorial flags document
  {
    return this._userDB.get('WALKTHROUGH:')
      .then((doc) => {
        console.log('Data: getWalkthroughFlags(): flags exist: ' + JSON.stringify(doc));
        return(doc);
      })
      .catch((err) => {
        console.log('Data: getWalkthroughFlags(): flags do not exist yet');
        // The tutorial flags document doesn't exist so create it
        this.createWalkthroughFlags(walkthroughName)
          .then((id)=>{
            console.log('Data: getWalkthoughFlags(): createTutorialFlags() has returned: ' + id);
            // Get the newly created tutorial flags
            this._userDB.get(id)
              .then((doc) => {
                return(doc);
              })
              .catch((err) => {
                console.log('ERROR: Data: - getWalkthroughFlags(): get after createWalkthroughFlags returned error = ' + JSON.stringify(err));
                return false;
              });
          });
      });
  }



  walkthroughSeen(walkthroughName)
  // Checks if the given walkthrough has been seen
  // - walkthroughName is the name of the tutorial to check
  // + Returns a boolean indicating if tutorial has been seen
  {
    return this.getWalkthroughFlags(null)
      .then((walkthroughFlags: any) => {
        console.log('Data: walkthroughSeen(): getWalkthroughFlags returned: ' + JSON.stringify(walkthroughFlags));
        if (walkthroughFlags[walkthroughName] == 'false') return(false);
        else return(true);
      })
      .catch((err) => {
        console.log('ERROR: Data: getWalkthroughFlags(): returned error = ' + JSON.stringify(err));
        return false;
      });
  }



  setWalkthroughSeen(walkthroughName)
  // Marks a walkthroughName as having been seen
  // - walkthroughName is the name of the tutorial that has been seen
  // + Returns true on success
  {
    return this.getWalkthroughFlags(walkthroughName)
      .then((walkthroughFlags:any)=>{
        walkthroughFlags[walkthroughName] = 'true';
        return this._userDB.put(walkthroughFlags)
          .then(function (response) {
            return true;
          })
          .catch((err) => {
            console.log('ERROR: Data: setWalkthroughSeen(): put returned error = ' + err);
            return false;
          });
      })
      .catch((err) => {
        console.log('ERROR: Data: setWalkthroughSeen(): getWalkthroughFlags() returned error =  ' + err);
        return false;
      });
  }




  //=========================
  // ANNOTATIONS
  /*
   annotation
   id:		string
   type:		TEXT | PHOTO | VIDEO | AUDIO
   text:		string
   attachment:	<attachment>
   created:		datetime
   updated:		datetime
   */

  addAnnotation(type, text, attachment)
  // Add a new annotation
  {

    // :TO DO: Add appropriate media types for Android (check latest PowerUp

    console.log('Data: addAnnotation() called with type = ' + type + ', and attachment = ' + JSON.stringify(attachment));
    /*
    let attachmentData: any;
    let base64String:   any;
    switch (type) {
      case 'PHOTO':
        attachmentData = {
          "annotation.jpg" : {
            content_type 	: 'image/jpeg',
            data 			    : attachment
          }
        };
        //console.log('Data: addAnnnotation: PHOTO attachment is:  ' + attachmentData);
        break;

      case 'VIDEO':
        attachmentData = {
          "annotation.mov" : {
            content_type 	: 'video/quicktime',
            data 			    : attachment
          }
        };
        //console.log('Data: addAnnnotation: VIDEO attachment is:  ' + JSON.stringify(attachmentData));
        break;

      case 'AUDIO':
        attachmentData = {
          "annotation.wav" : {
            content_type 	: 'audio/wav',
            data 			    : attachment
          }
        };
        //console.log('addAnnnotation: AUDIO attachment is:  ' + JSON.stringify(attachmentData));
        break;

      case 'TEXT':
        console.log('addAnnnotation: processing attachmentType TEXT');
        attachmentData = {

        };
        break;

      default:
        console.log('addAnnnotation: processing attachmentType none');
        attachmentData = {

        };
        break;

    }
    */

    let timeStamp = new Date().toISOString();
    let annotation = {
      _id: 'ANNOTATION:' + timeStamp,
      type: type,
      text: text,
      media: attachment,
      //_attachments: attachmentData,
      created: timeStamp,
      updated: timeStamp
    };

    console.log('addAnnotation: About to put: ' + JSON.stringify(annotation));
    return this._productDB.put(annotation)
      .then(function (response) {
        console.log('addAnnotation: Put returned - ' + JSON.stringify(response));
        return response.id;
      })
      .catch((err) => {
        console.log('addAnnotation: Error: ' + err);
        return false;
      });
  }



  getAnnotation(id)
  // Gets a specific annotation
  {
    return this._productDB.get(id, {attachments: true})
      .then((doc) => {
        let item = [];
        // :TO DO: Add appropriate DataURIPrefix for Android
        let photoDataURIPrefix	= 'data:image/jpeg;base64,';
        let videoDataURIPrefix	= 'data:video/quicktime;base64,';
        let audioDataURIPrefix	= 'data:audio/wav;base64,';
        let attachment:any;
        let media:any;

        /*
        if(doc._attachments)
        {
          switch (doc.type) {
            case 'TEXT':
              attachment = {};
              break;
            case 'PHOTO':
              attachment = doc._attachments["annotation.jpg"].data;
              attachment = photoDataURIPrefix + attachment;
              console.log('Data: getAnnotation(): PHOTO attachment is: ' + JSON.stringify(attachment));
              break;
            case 'AUDIO':
              attachment = doc._attachments["annotation.wav"].data;
              attachment = audioDataURIPrefix + attachment;
              break;
            case 'VIDEO':
              attachment = doc._attachments["annotation.mov"].data;
              attachment = videoDataURIPrefix + attachment;
              break;
            default:
              attachment = {};
              break;
          }
        }
        else
        {
          console.log("data: getAnnotations: Annotation does not have an attachment (photo/audio/video)");
        }
        */

        media = "";

        switch (doc.type) {
          case 'PHOTO':
            media = photoDataURIPrefix + doc.media;
            //console.log('Data: getAnnotation(): PHOTO attachment is: ' + JSON.stringify(media));
            break;
          case 'AUDIO':
            media = audioDataURIPrefix + doc.media;
            break;
          case 'VIDEO':
            media = videoDataURIPrefix + doc.media;
            break;
          default:
            media = "";
            break;
        }


        item.push(
          {
            id: id,
            rev: doc._rev,
            type: doc.type,
            text: doc.text,
            media: media,
            //attachment: attachment,
            created: doc.created,
            updated: doc.updated
          });
        //console.log('getAnnotation: Found annotation: ' + JSON.stringify(item));
        return(item);
      })
      .catch((err)=>{
        return(false);
      });
  }



  getAnnotations(ids)
  // Get all of a user's annotations. ids is an array of database ids
  {
    console.log('Data: getAnnotations() recieved ids = ' + JSON.stringify(ids));

    // Remove any entries in the array of IDs that is false (which can happen if an error occurred during the creation of the annotation
    while(true){
      let index = ids.indexOf(false);
      if (index < 0) break;
      ids.splice(index, 1);
    }

    console.log('Data: getAnnotations() cleaned ids are = ' + JSON.stringify(ids));

    return this._productDB.allDocs({
      include_docs: true,
      keys: ids,
      attachments: true})

      .then((doc)=>{
        let k;
        let items = [];
        let row = doc.rows;

        // :TO DO: Add appropriate DataURIPrefix for Android

        let photoDataURIPrefix	= 'data:image/jpeg;base64,';
        let videoDataURIPrefix	= 'data:video/quicktime;base64,';
        let audioDataURIPrefix	= 'data:audio/wav;base64,';

        for (k in row) {

          let item = row[k].doc;
          let attachment:any;
          let media = "";

          if(item._attachments)
          {
            /*
            switch (item.type) {
              case 'TEXT':
                attachment = {};
                break;
              case 'PHOTO':
                //console.log("data: getAnnotations: Annotation has a photo attachment: " + JSON.stringify(item));
                attachment = item._attachments["annotation.jpg"].data;
                attachment = photoDataURIPrefix + attachment;
                break;
              case 'AUDIO':
                attachment = item._attachments["annotation.wav"].data;
                attachment = audioDataURIPrefix + attachment;
                break;
              case 'VIDEO':
                attachment = item._attachments["annotation.mov"].data;
                //let blob = this.b64toBlob(attachment, 'video/quicktime');
                //attachment = URL.createObjectURL(blob);
                //console.log('Data: getAnnotations(): Processing VIDEO created blob url = ' + attachment);
                attachment = videoDataURIPrefix + attachment;
                break;
              default:
                attachment = {};
                break;
            }
            */

            switch (item.type) {
              case 'PHOTO':
                media = photoDataURIPrefix + item.media;
                //console.log('Data: getAnnotation(): PHOTO attachment is: ' + JSON.stringify(media));
                break;
              case 'AUDIO':
                media = audioDataURIPrefix + item.media;
                break;
              case 'VIDEO':
                media = videoDataURIPrefix + item.media;
                break;
              default:
                media = "";
                break;
            }


          }
          else
          {
            //console.log("data: getAnnotations: Annotation does not have an attachment (photo/audio/video)");
          }

          let newItem =
            {
              id: item._id,
              rev: item._rev,
              type: item.type,
              text: item.text,
              media: media,
              created: item.created,
              updated: item.updated,

            };

          items.push(newItem);
        }
        //console.log('Data: getAnnotations(): allDocs() about to return items = ' + JSON.stringify(items));

        return(items);
      })
      .catch((err)=>{
        console.log('ERROR: Data: getAttachments(): allDocs() err = ' + JSON.stringify(err));
        return(false);
      });
  }



  updateAnnotation(id, type, text, media)
  // Amend an existing annotation
  {
    // Get from the DB the annotation we want to change to make sure we have the most up to date rev
    this.getAnnotation(id)
      .then((item: any) => {
        let now = new Date().toISOString();
        let annotation = {
          _id: id,
          _rev: item[0].rev,
          type: type,
          text: text,
          media: media,
          //attachment     : file,
          created: item[0].created,
          updated: now
        };

        return this._productDB.put(annotation)
          .then((result)=>{
            return(true);
          })
          .catch((err) => {
            console.log('ERROR: Data: updateAnnotation(): Error doing put = ' + err);
            return(false);
          });
      })
      .catch((err) => {
        console.error('ERROR: Data: updateAnnotation() Error getting item to update, error is: ', err);
        return(false);
      });
  }



  removeAnnotation(id, rev)
  // Remove a specific annotation
  {
    let annotation = {_id: id, _rev: rev};

    return this._productDB.remove(annotation)
      .then((result)=>{
        return(true);
      })
      .catch((err) => {
        console.log('ERROR: Data: removeAnnotation() error is: ' + err);
        return(false);
      });
  }



  b64toBlob(b64Data, contentType='', sliceSize=512)
  // NOT currently used
  {
    let byteCharacters = atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    let blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }




  //=========================================
  // USER SETTINGS (email, pin, themes, etc.)


  createUserSettings()
  // Creates the user's settings document for the first time (using blank/default entries)
  {
    console.log('Data: createUserSettings() called');

    let settings = {
      _id:                  'USER_SETTINGS:',
      email:                '',
      username:             '',
      password:             '',
      localDB:              '', // Local DB name
      remoteDB:             '', // Remote DB name on server
      theme:                'default', // App theme to be used
    };
    console.log('Data: createUserSettings: Creating new settings about to put: ' + JSON.stringify(settings));

    // Save the default user settings in the database
    return this._userDB.put(settings)
      .then(function (response) {
        console.log('Data: createUserSettings(): successfully created new user settings document put returned: ' + JSON.stringify(response));
        return(true);
      })
      .catch((err) => {
        console.log('ERROR - Data: createUserSettings(): put failed to create the new user settings document: ' + JSON.stringify(err));
        return(false);
      });
  }



  getUserSettings()
  // Gets all of the user's settings
  {
    return this._userDB.get('USER_SETTINGS')
      .then((doc) => {
        //var decryptedData = this.decryptData(doc, '1234');
        //console.log('Data: getUserSettings(): get got: ' + JSON.stringify(decryptedData));
        return(doc);
      })
      .catch((err) => {
        console.log('Data: getUserSettings(): get returned error: ' + JSON.stringify(err));
        return(false);
      });
  }



  updateUserSettings(newSettings)
  // Updates the user's settings
  {
    console.log('Data: updateUserSettings(): called with: ' + JSON.stringify(newSettings));
    //var encryptedData = this.encryptData(newSettings, '1234');
    return this._userDB.put(newSettings)
      .then(function (response) {
        console.log('Data: updateUserSettings(): put returned: ' + JSON.stringify(response));
        return(true);
      })
      .catch((err) => {
        console.log('ERROR - Data: updateUserSettings(): put returned error: ' + JSON.stringify(err));
        return(false);
      });
  }



  //=============================================
  // ENCRYPTION


  encryptData(data)
  // Encrypts PouchDB data in preparation for a Put.
  {
    if (!ENCRYPT_DATA) return data;

    let encryptedField:any;
    let password = this.encryptKey;
    let fieldToStringify = this.nonStringFields;

    console.log('+++++ encryptData: data in is: ' + JSON.stringify(data));
    Object.keys(data).forEach(function (field) {
      if (field !== '_id'
        && field !== 'id'
        && field !== '_rev'
        && field !== 'rev'
        && field !== '_attachments'
        && field !== 'created'
        && field !== 'updated') {
        if (data[field] != "" && data[field] != null)
        {
          console.log('+++++ encryptData(): About to encrypt data[' + field + '] = ' + data[field]);


          // For non string fields we have to JSON.stringify them
          let str:string = field;
          console.log('$$$$$ encryptData(): ' + field + ' index in nonStringFields is: ' + fieldToStringify.indexOf(str));
          if (fieldToStringify.indexOf(str) != -1) {
            console.log('+++++ encryptData(): ' + field + ' is in array of nonStringFields so going to stringify');
            encryptedField = CryptoJS.AES.encrypt(JSON.stringify(data[field]), password);
          }
          else {
            console.log('+++++ encryptData(): ' + field + ' is NOT in array of nonStringFields so NOT going to stringify');
            encryptedField = CryptoJS.AES.encrypt(data[field], password);
          }

          console.log('+++++ encryptData: encryptedField.toString = ' + encryptedField.toString());

          data[field] = encryptedField.toString();

          console.log('+++++ encryptData: encrypted data[field] is now = ' + data[field]);
        }
      }
    });
    console.log('+++++ Done encryptData() with data = ' + JSON.stringify(data));
    return data;
  }



  decryptData(data)
  // Decrypts PouchDB data that has just been returned by a Get or Alldocs
  {
    if (!ENCRYPT_DATA) return data;

    let password = this.encryptKey;
    let fieldToParse = this.nonStringFields;

    console.log('+++++ decryptData: data in is: ' + JSON.stringify(data));
    Object.keys(data).forEach(function (field) {
      if (field !== '_id'
        && field !== 'id'
        && field !== '_rev'
        && field !== 'rev'
        && field !== '_attachments'
        && field !== 'created'
        && field !== 'updated')
      {

        data[field] = CryptoJS.AES.decrypt(data[field], password);
        console.log('+++++ decryptData(): CryptoJS.AES.decrypt for data[' + field + '] = ' + data[field]);

        data[field] = data[field].toString(CryptoJS.enc.Utf8);
        console.log('+++++ decryptData(): data[' + field + '] after toString is now = ' + data[field]);

        // If the field is a non string field we must parse the JSON
        let str:string = field;

        if (fieldToParse.indexOf(str) != -1) {
          console.log('+++++ decryptData(): About to parse non string field: data[' + field + '] = ' + data[field]);
          if (typeof data[field] != "undefined" && data[field] != null && data[field].length > 0) data[field] = JSON.parse(data[field]);
          else data[field] = [];
          console.log('$$$$$ decryptData(): After possibly parsing JSON data[' + field + '] = ' + JSON.stringify(data[field]));
        }
      }
    });
    console.log('+++++ Done decryptData() about to return decrypted data = ' + JSON.stringify(data));
    return data;
  }






  //=============================================
  // DATABASE SYNCING


  handleChanges()
  // Checks for changes to the database so we can update the user's current view
  // NOTE: This code is not used yet
  {
    console.log('handleChanges called');

    this._userDB.changes({
      since: 'now',
      live: true,
      include_docs: true,
      attachments: true
    })
      .on('change', (change) => {
        // handle change
        console.log('Handling change');
        console.dir(change);
      })
      .on('complete', (info) => {
        // changes() was canceled
        console.log('Changes complete');
        console.dir(info);
      })
      .on('error', (err) => {
        console.log('Changes error');
        console.log(err);
      });
  }







/*
  // NOT working on iPhone
  getProfile(userID = null) {
    let qString = userID ? userID : '0';

    let headers = new Headers();
    headers.append('Authorization', UserSession.getAccessToken());

    let options = new RequestOptions({ headers: headers });

    return new Promise(resolve => {
      this.http.get(Config.API_ENDPOINT + 'api/profile/' + qString, options)
        .map(res => res.json())
        .subscribe(
          (data: any) => {
            resolve(data);
          },
          err => {
            //alert("Error! failed: "+JSON.stringify(err));
          },
          () => {
            //alert('Complete');
          }
        );
    });
  }

  // WORKING on iPhone
  getCategories(): Promise<any> {
    let headers = new Headers();
    headers.append('Authorization', UserSession.getAccessToken());

    let options = new RequestOptions({ headers: headers });

    return new Promise(resolve => {
      this.http.get(Config.API_ENDPOINT + 'api/categories/', options)
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          err => {
            console.log("Error! api/categories/ failed: " + JSON.stringify(err));
          },
          () => {

          }
        );
    });
  }



  getProfile(userID = 0): Promise<any> {
    let headers = new Headers();
    headers.append('Authorization', UserSession.getAccessToken());

    let options = new RequestOptions({ headers: headers });

    return new Promise(resolve => {
      this.http.get(Config.API_ENDPOINT + 'api/profile/' + userID, options)
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          err => {
            console.log("Error! api/profile/ failed: " + JSON.stringify(err));
          },
          () => {

          }
        );
    });
  }
  */
}




