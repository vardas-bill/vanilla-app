// Global settings for app such as the server to be used for API calls

//export var SUPERLOGIN_SERVER = 'http://127.0.0.1:3000';



// LOCAL TEST SERVER (For testing via browser)
/*
export var SUPERLOGIN_SERVER = 'http://127.0.0.1:3000';
export var COUCHDB_SERVER = 'http://127.0.0.1:5984';
export var COUCHDB_SERVER_URL = '127.0.0.1:5984';
export var REMOTE_SERVER = false;
*/

// LOCAL TEST SERVER (For testing via App running on a device)
export var SUPERLOGIN_SERVER = 'http://9637c8ca.ngrok.io';
export var COUCHDB_SERVER = 'http://7c3b4c00.ngrok.io';
export var COUCHDB_SERVER_URL = '7c3b4c00.ngrok.io';
export var REMOTE_SERVER = false;

// AWS TEST SERVER
/*
export var SUPERLOGIN_SERVER = 'http://ec2-35-157-74-47.eu-central-1.compute.amazonaws.com:3000';
export var COUCHDB_SERVER = 'http://ec2-35-157-74-47.eu-central-1.compute.amazonaws.com:5984';
export var COUCHDB_SERVER_URL = 'ec2-35-157-74-47.eu-central-1.compute.amazonaws.com:5984';
export var REMOTE_SERVER = true;
 */


// PRODUCTION SERVER
/*
export var SUPERLOGIN_SERVER = 'http://185.83.120.50:3000';
export var COUCHDB_SERVER = 'http://185.83.120.50:5984';
export var COUCHDB_SERVER_URL = '185.83.120.50:5984';
export var REMOTE_SERVER = true;
*/

// When running ionic serve -lab we can't use SecureStorage so for testing purposes we skip code that uses it!
export const SKIP_SECURESTORAGE = false;
export const ENCRYPT_DATA = false; // Says whether or not PouchDB/CouchDB data gets encrypted

export const APP_NAME = 'VanillaApp'; // This is the name of the local storage (amongst other things)

export let PRODUCT_CATEGORIES = 2; // 0 | 2 | 3 | 4 | 6
export const PRODUCT_CATEGORY_NAMES = [
  {'name':'Craft Beer', 'keyword':'beer'},
  {'name':'Craft Cider','keyword':'cider'}];
export const PRODUCT_CATEGORY1_SUBCATEGORIES = [];
export const PRODUCT_CATEGORY2_SUBCATEGORIES = [];
export const PRODUCT_CATEGORY3_SUBCATEGORIES = [];
export const PRODUCT_CATEGORY4_SUBCATEGORIES = [];
export const PRODUCT_CATEGORY5_SUBCATEGORIES = [];
export const PRODUCT_CATEGORY6_SUBCATEGORIES = [];

export const MAJOR_CATEGORY_BUTTON = [
  {'name':'Craft Beer', 'keyword':'beer'},
  {'name':'Craft Cider','keyword':'cider'}
]



