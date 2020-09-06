//Encryption resource: https://docs.google.com/document/d/1GJToVWIbkAq6iq3M6zcrl7j-4E-jHxfID-SvJ-8AC5c/edit

// Copyright 2020 MeaderySolutions All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Adapted from the OAuth2 Apps Script library
// Source: https://script.google.com/d/1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF/edits


function testServiceHelper(){
  var encryptedService = 'meaderySolutions';
  var crypt = new Crypto_;
  // Must set the encryption service first
  crypt.setEncryptedService(encryptedService);
  // This only needs to be set once
  crypt.setEncryptionKey('2x04ab71-12l2kl-2nbl3k-auiqqq090');
  var encryptedText = crypt.encrypt('mysecretphrase');
  var decryptedText = crypt.decrypt(encryptedText);
  Logger.log(encryptedText);
}



function newEncryptionService(serviceName){
  var serviceName = 'meaderySolutions';
  var sharedEncryptionKey = '2x04ab71-12l2kl-2nbl3k-auiqqq090';
  
  var service = new Crypto_;
  service.setEncryptedService(serviceName);
  // This only needs to be set once
  service.setEncryptionKey(sharedEncryptionKey);
}


function deleteEncryptionService_(serviceName){
  // Service to delete
  var service = new Crypto_;
  service.deleteEncryptionService(serviceName);
}

function decrypt_(encryptedString){
  var encryptedService = 'meaderySolutions';
  var service = new Crypto_;
  service.setEncryptedService(encryptedService);
  return service.decrypt(encryptedString);
}


function encrypt_(string) {
  // The encryptionService is used to connect to the external script
  // which connects to the Meadery Solutions DB
  var encryptedService = 'meaderySolutions';
  var service = new Crypto_;
  service.setEncryptedService(encryptedService);
  return service.encrypt(string); 
}





/**
* Helper class
* @return {object} main object containing property functions
*/
var Crypto_ = function(){};




/**
* Encrypts and URI encodes a string use AES encryption
* @param {string} string The string to be encrypted
* @return {string} The encrypted string
*/
Crypto_.prototype.encrypt = function(string) { 
  var encryptedString = this.getCryptoLibrary_().encrypt (string);
  return encodeURIComponent(encryptedString);
}



/**
* Decrypts and URI decodes a string with AES encryption
* @param {string} encryptedString The string to be decrypted
* @return {string} The decrypted string
*/
Crypto_.prototype.decrypt = function(encryptedString) {
  var decodedString = decodeURIComponent(encryptedString);
  return this.getCryptoLibrary_().decrypt (decodedString);
}




/**
* cCryptoGS library id: 1IEkpeS8hsMSVLRdCMprij996zG6ek9UvGwcCJao_hlDMlgbWWvJpONrs
* @return {Crypto library} the crypography library class
*/
Crypto_.prototype.getCryptoLibrary_ = function() {
  if (!this.cryptoLibrary_) {
      var encryptionType = 'aes';
      this.cryptoLibrary_ = new crypt.Cipher(this.getEncryptionKey_(), encryptionType);
  }
  return this.cryptoLibrary_
}




/**
* Sets the title of the service for a specified encryption
* This is used to recall encryption keys for different services
* @return {!Crypto_} This service, for chaining.
*/
Crypto_.prototype.setEncryptedService = function (serviceName) {
 this.encryptionService_ = serviceName;
  return this;
}

Crypto_.prototype.getEncryptionService_ = function () {
  if (!this.encryptionService_) {
    throwError_('Missing encryption service');
  }
  return this.encryptionService_;
}



/**
* Set encryption key in persistent storage
* @param {string} encryptionkey The string used to encrypt/decrypt a string;
* @return {!Crypto_} This service, for chaining.
*/
Crypto_.prototype.setEncryptionKey = function (encryptionKey) {
  var storageKey = this.getEncryptionService_();
  var storageService = 'script';
  this.getStorage_(storageService).set(storageKey ,encryptionKey);
  return this;
}



/**
* Get stored encryption key
* @return {string} parsed encryption key
*/
Crypto_.prototype.getEncryptionKey_ = function () {
  var storageKey = this.getEncryptionService_();
  var storageService = 'script';
  var encryptionKey = this.getStorage_(storageService).get(storageKey);
  if (!encryptionKey) throwError_('Missing encryption key');
  return encryptionKey;
}





/**
* Delete encryption key in persistent storage
* @param {string} encryptionService The service to be deleted
* @return {!Crypto_} This service, for chaining.
*/
Crypto_.prototype.deleteEncryptionService = function (encryptionService) {
  var storageKey =  this.getEncryptionService_();
  var storageService = 'script';
  this.getStorage_(storageService).remove(storageKey);
  return this;
}





/**
* Gets the storage layer for this service, used to persist responses.
* Custom values associated with the service can be stored here.
* @return {Storage} The service's storage.
*/
Crypto_.prototype.getStorage_ = function(storageService) {
  if (!this.storage_) {
    var prefix = 'crypto_';
    var store = new Storage_(prefix);
    this.storage_ = store;
  }
  store.setServiceType(storageService);
  return this.storage_;
};
  