/*
What is stored

System preferences - doesn't exist


Company details (Script properties)
Access Code
ID
Name
Spreadsheet IDs
preferences - doesn't exist


User details (User properties)
User ID
Company ID - determines what company to display and if the company's app access
Name
Position
Etc..
preferences  - doesn't exist yet
trigger details


*/



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


// Adapted from the OAuth2 Apps Script library
// Source: https://script.google.com/d/1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF/edits


function store_(prefix) {
 return new Storage_(prefix); 
}

/**
* Creates a new Storage_ instance, which is used to persist Client and User data
* Public Methods
 - setServiceType(serviceType) // Must be called before any other methods The storage service to use options: [user, script, cache]
 - getAndRemove(key) // gets cached property and deletes it after retrieval
 - get(key) // Return property of selected service
 - set(key,value) // sets property to selected service
 - remove(key) // removes property of selected service
 - removeAll // clears user properties
* @constructor
*/
const Storage_ = function (prefix) {
  this.prefix_ = prefix || null;
  this.memory_ = {};
}


/**
 * The special value to use in the cache to indicate that there is no value.
 * @type {string}
 * @private
 */
Storage_.CACHE_NULL_VALUE = '__NULL__';


Storage_.prototype.getScriptService_ = function () {
  if (!this.scriptProperties_ ) this.scriptProperties_ = PropertiesService.getScriptProperties();
  return this.scriptProperties_;
} 


Storage_.prototype.getUserService_ = function () {
  if (!this.userProperties_ ) this.userProperties_ = PropertiesService.getUserProperties();
  return this.userProperties_;
} 


Storage_.prototype.getCacheService_ = function () {
  if (!this.cacheService_ ) this.cacheService_ = CacheService.getScriptCache();
  return this.cacheService_;
} 



Storage_.prototype.getAndRemove = function(key) {
  this.get(key);
  this.remove(key);
};


Storage_.prototype.setServiceType = function(serviceType) {
  this.serviceType = serviceType;
  return this;
}




/**
* Gets a stored value.
* @param {string} serviceType The storage service to use
* @param {string} key The key.
* @return {*} The stored value.
*/
Storage_.prototype.get = function(key) {
  var prefixedKey = this.getPrefixedKey_(key);
  
  var jsonValue;
  var value;
  
  // Check in-memory cache.
  if (value = this.memory_[prefixedKey] && 
      serviceType !== 'cache') {
    if (value === Storage_.CACHE_NULL_VALUE) {
      return null;
    }
    return value;
  }
  
  switch (this.serviceType) {
    case 'cache':
      if (jsonValue = this.getCacheService_().get(prefixedKey)) {
        value = JSON.parse(jsonValue);
        return value;
      }
      break;
    case 'user':
      // Check user properties.
      if (jsonValue = this.getUserService_().getProperty(prefixedKey)) {
        value = JSON.parse(jsonValue);
        this.memory_[prefixedKey] = value;
        return value;
      }
      break;
    case 'script':
      // Check script properties.
      // Typically used to store global client data
      if (jsonValue = this.getScriptService_().getProperty(prefixedKey)) {
        
        value = JSON.parse(jsonValue);
        this.memory_[prefixedKey] = value;
        return value;
      }
      break;
  }
      
  // Not found. Store a special null value in the memory and cache to reduce
  // hits on the PropertiesService.
  this.memory_[prefixedKey] = Storage_.CACHE_NULL_VALUE;
  
  return null;
};



/**
* Stores a value.
* @param {string} key The key.
* @param {*} value The value.
* @param {number} minutesToCache The number of minutes to leave the value in the cache (max=6hrs)
*/
Storage_.prototype.set = function(key, value, minutesToCache) {
  var prefixedKey = this.getPrefixedKey_(key);
  var jsonValue = JSON.stringify(value);
  var storeInMemory = true;
  switch (this.serviceType.toLowerCase()) {
    case 'cache':
      if (this.getCacheService_()) {
        minutesToCache = minutesToCache > 360 ? 360 : minutesToCache; // If the input time is greater than 360 minutes, than only do 360 minutes
        this.getCacheService_().put(prefixedKey,jsonValue,minutesToCache*60); // expires after 10 minutes. source: https://developers.google.com/apps-script/reference/cache/cache 
        storeInMemory = false;
      }
      break;
    case 'user':
      if (this.getUserService_()) {
        this.getUserService_().setProperty(prefixedKey, jsonValue);
      }
      break;
    case 'script':
      if (this.getScriptService_()) {
        this.getScriptService_().setProperty(prefixedKey, jsonValue);
      }
      break;
    
   if (storeInMemory) this.memory_[prefixedKey] = value;
 
  }
};

/**
* Removes a stored value.
* @param {string} key The key.
*/
Storage_.prototype.remove = function(key,) {
  var prefixedKey = this.getPrefixedKey_(key);
  this.removeValueWithPrefixedKey_(prefixedKey);
};


/**
* Removes all user properties
*/
Storage_.prototype.removeAll = function() {
  this.getUserService_().deleteAllProperties();
};

/**
* Removes a stored value.
* @param {string} key The key.
*/
Storage_.prototype.removeValueWithPrefixedKey_ = function(prefixedKey) {
  var storeInMemory = true;
  switch ( this.serviceType.toLowerCase() ) {
    case 'cache':
      if (this.getCacheService_()) {
        this.getCacheService_().remove(prefixedKey);// Cached values are one-time use only, so they are deleted as soon as they are retrieved 
        storeInMemory = false;
      }
      break;
    case 'user':
      if (this.getUserService_()) {
        this.getUserService_().deleteProperty(prefixedKey);
      }
      break;
    case 'script':
      if (this.getScriptService_()) {
        this.getScriptService_().deleteProperty(prefixedKey);
      }
      break;
  }
  
  if (storeInMemory) delete this.memory_[prefixedKey];
};

/**
* Gets a key with the prefix applied.
* @param {string} key The key.
* @return {string} The key with the prefix applied.
* @private
*/
Storage_.prototype.getPrefixedKey_ = function(key) {
  if (key) {
    return this.prefix_ + '.' + key;
  } else {
    return this.prefix_;
  }
};
