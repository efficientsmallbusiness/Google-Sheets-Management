
/**
* Template variables for new clients and users
*/
var globalTemplate_ = (function (){
  // Template values
  var clientValues = {};
  clientValues.folderName = 'Meadery_Solutions_App';
  clientValues.production = {
    id:'198vD7x9Yu0jCQzWwzBP4GqffEX-Jz71LhH9dke_8FVQ', // The template production spreadsheet
    name:'meaderySolutions_production_db',
  };
  
  // Blank client object
  var clientObject = {};
  clientObject.folders = {main:''};
  clientObject.sheets = {production:''};
  clientObject.ids = {row:0,batch:0,recipe:0,user:0};
  clientObject.produced = {gallons:''};
  clientObject.settings = {timezone:'America/Phoenix'};
  
  // Blank user object
  var userObject = {}
  userObject.company = {accessCode:'',name:''}; // Used to access the client record in the Meadery Solutions database
  userObject.userDetails = {};
  
  return {
    clientValues:clientValues,
    client:clientObject,
    user:userObject,
  }
})();



/**
* Creates a new folder and spreadsheet database in the current users drive
* And sets a new property in the script properties
* this is used the first time a client logs in
* Their business name and accessCode must already exist in the Registered Client's spreadsheet
*/
var test_createClient_ = function(){
  // Generate accessCode
  var accessCode = '123456';
  var activeUserEmail = 'micahmailand@gmail.com';
  var response = conn_().createClientAppDataObject(accessCode,activeUserEmail);
  Logger.log(response)
}




function conn_(spreadsheetId){
 return new dbConn_(spreadsheetId); 
}


/**
* Creates a new dbConn_ service.
*
* Public Methods
* - 
* @param (string) spreadsheetId [OPTIONAL] The spreadsheet to connect to
* @constructor
*/
const dbConn_ = function(spreadsheetId) {
  this.spreadsheetId = spreadsheetId;
};


/**
* Creates an array output that matches the destination sheet
* Appends row to the sheet with the new array
* @param {object} newValues The key/value pairs to be appended to the sheet. The keys must match the column headers
*/
dbConn_.prototype.createRecord = function (newValues){
 // log_('createRecord');
  const tableValues = this.getValues();
  const output = removeNull_(formatTableArray_(tableValues.normalizedHeader,newValues));
  this.getSheet_().appendRow(output);
}

/**
* Updates row values
* @param {object} newValues The object values to add to the sheet
* @return {!dbConn_} This service, for chaining.
*/
dbConn_.prototype.updateRecord = function (newValues){
//log_('updateRecord');
//log_(newValues);
  // If there is no id key, throw an error
  if (! newValues.id ) throwError_('Missing record id');
  
  const lock = LockService.getScriptLock();
  
  // Create lock to avoid concurrent use
  if (lock.tryLock(10*1000)) {  
    
    try {
      const sheet = this.getSheet_();
      const tableValues = this.getValues();
      const values = tableValues.object;
      const valuesArray = tableValues.valuesArray;
      var output = formatTableArray_(tableValues.normalizedHeader,newValues);
      
      // Create a url containing a new user id as an argument
      // Insert the new url into the output array
      // There should be a direct link for batches and maybe other things
      //  output[header.indexOf('directLink')] = getFormUrl_(newValues.id);
    
      for (let i=0;i<values.length;i++){
        if (!values[i].id) continue;
        
        if (values[i].id.toString() === newValues.id.toString()){
          // Identify null values in the array and replace them with the value from the current records values
          this.insertMissingValues_( this.findNull_(output) , valuesArray[i] ); 
          sheet.getRange(i+2, 1,1,output.length).setValues([output]);
          return {response:"Record saved!",status:'success'};
        }
      }
    
      // Replace null values in array
      output = removeNull_(output);
      // If there is no id match, append a new row
      sheet.appendRow(output);
      
    } catch(e) {
      Logger.log('The following error occured while attempting to run the function "": ' + e);
    } 
    
  } else {
    // if lock times out
    return {response:"Server timed out! Wait a moment and try again.",status:'error'};
  }
}


/**
* Updates row values
* @param {object} newValues The object values to add to the sheet
* @return {!dbConn_} This service, for chaining.
*/
dbConn_.prototype.deleteRecord = function (newValues){
log_('deleteRecord');
log_(newValues);
  // If there is no id key, throw an error
  if (! newValues.id ) throwError_('Missing record id');
  
  const lock = LockService.getScriptLock();
  // Create lock to avoid concurrent use
  if (lock.tryLock(10*1000)) {  
    
    try {
      const sheet = this.getSheet_();
      const values = this.getValues().object;
      
      for (let i=0;i<values.length;i++){
        if (!values[i].id) continue;// If there is no id in the column, continue
        if (values[i].id.toString() === newValues.id.toString()){
          sheet.deleteRow(i+2)
          return {response:"Record saved!",status:'success'};
        }
      }
      
    } catch(e) {
      lock.releaseLock();
      Logger.log('The following error occured while attempting to run the function "": ' + e);
    } 
    
  } else {
    // if lock times out
    return {response:"Server timed out! Wait a moment and try again.",status:'error'};
  }
}


/**
* Gets the dataRange of values from the set sheet
* @return {object} Sheet values
*/
dbConn_.prototype.getRecordById = function (id){
  const tableValues = this.getValues();
  const valuesObject = tableValues.object;
  var record = {};
  
  // Replace the object and valuesArray key/value pairs
  // with the individual record's data
  valuesObject.forEach(function(row,i){
    if ( row.id == id ) {
      record = row; 
      return;
    }
  });
  
  return record;
};

/**
* @return {object} Client record for the active user
*/
dbConn_.prototype.getUserRecordFromClientDb = function (email){  
  const tableValues = this.setTable('users').getValues();
  const valuesObject = tableValues.object;
  var record = null;
  
  // Replace the object and valuesArray key/value pairs
  // with the individual record's data
  valuesObject.forEach(function(row,i){
    if ( row.email == email ) {
      record = row; 
      return;
    }
  });
  
  return record;
};

/**
* Gets the dataRange of values
* @return {object} Sheet values in object and array formats
*/
dbConn_.prototype.getValues = function (columnHeadersRowIndex){
  return getRowsData_.fromArray(this.getSheet_().getDataRange().getValues(),columnHeadersRowIndex);
};

/**
* Gets the dataRange of values
* @return {array} Sheet datarange values
*/
dbConn_.prototype.getValuesArray = function (){
  return this.getSheet_().getDataRange().getValues();
};

/**
* Sets the sheet(tab) ID for the specified spreadsheet
* @param {string} id Sheet id
* @return {!dbConn_} This service, for chaining.
* @see https://developers.google.com/apps-script/reference/properties/
*/
dbConn_.prototype.setSheetId = function(id) {
  this.sheetId = id;
  this.sheet_ = null; // Reset the sheet
  return this;
};

/**
* Sets the Spreadsheet ID 
* @param {string} id Spreadsheet id
* @return {!dbConn_} This service, for chaining.
*/
dbConn_.prototype.setSpreadsheetUrl = function(url) {
  this.spreadsheetUrl = url;
  return this;
};

/**
* Sets the Spreadsheet ID 
* @param {string} id Spreadsheet id
* @return {!dbConn_} This service, for chaining.
*/
dbConn_.prototype.setSpreadsheetId = function(id) {
  this.spreadsheetId = id;
  return this;
};


/**
* Sets the Sheet/tab name
* @param {string} name The sheet/tab name
* @return {!dbConn_} This service, for chaining.
*/
dbConn_.prototype.setSheetName = function(name) {
  this.sheetName = name;
  this.sheet_ = null; // Reset the sheet
  return this;
};

/**
* Sets the sheet name with the "table_" prefix
*/
dbConn_.prototype.setTable = function(tableName,isQuery) {
  const tablePrefix = !isQuery ? 'table_' : 'query_';
  this.setSheetName( tablePrefix + tableName.toUpperCase() );
  return this
};


/**
* Gets Sheet object
* @return {Sheet Object}
* @private
*/
dbConn_.prototype.getSheet_ = function() {
  if ( !this.sheet_ ) {
    if (this.sheetName) this.sheet_ = this.getSpreadsheet_().getSheetByName(this.sheetName);
    else if (this.sheetId) this.sheet_ = this.getSheetById_(this.sheetId);
    else throwError_('Missing sheet name or id');
  }
  return this.sheet_;
};


/**
* @return {Spreadsheet object}
* @private
*/
dbConn_.prototype.getSpreadsheet_ = function() {
  let spreadsheet;
  if (this.spreadsheetUrl) spreadsheet = SpreadsheetApp.openByUrl(this.spreadsheetUrl);
  else if (this.spreadsheetId) spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
  else throwError_('Missing spreadsheet url or id');
  
  return spreadsheet;
};

/**
* Gets sheet with specified id
* @return {Sheet object}
* @private
*/
dbConn_.prototype.getSheetById_ = function(id){
  const sheets =  this.getSpreadsheet_().getSheets();
  var sheet;
  sheets.forEach(function(sht){
    if (sht.getSheetId() == id) {
      sheet = sht; 
      return;
    }
  });
  return sheet;
};


/**
* NOT IN USE
* Is used to determine the appropriate method for retrieving sheet data
*/
dbConn_.prototype.showHiddenRows = function(boolean) {
  this.hiddenRows = boolean;
  return this;
};

/**
* Gets the stored app data for the specified company
* This can only be called after a user has successfully signed in
* so the property store must exist
* @param {object} accessObject 
*/
dbConn_.prototype.getStoredInfo = function(accessObject) {
  return this.getStorage_('script').get(accessObject.accessCode);
};



/**
* Sets the client's info
* This is used to update a client's app data object. Used in conjuction with "getClientInfo"
*/
dbConn_.prototype.setClientInfo = function(accessObject,value) {
  this.getStorage_('script').set(accessObject.accessCode,value);
}

/**
* Checks if the client is active in the Meadery Solutions database
* If they are active, but they're app data doesn't exist in the properties store, create the required file structure
* returns the stored properties
* All request must be a JSON object
* NOTE: a client will still be able to access the web app up to 6 hours after they have been made "INACTIVE"
*/
dbConn_.prototype.getClientInfo = function(accessObject,activeUserEmail) {
  var storageKey = accessObject.accessCode + accessObject.name;
  var cachedRecord = this.getStorage_('cache').get(storageKey);
  var clientRecord = null;
  
 // clears the cache for troubleshooting
  //this.getStorage_('cache').remove(storageKey);
  
  if ( !cachedRecord ) {
    // Get the client's business information stored in the Registered Client's spreadsheet
    // The registered client's script: spreadsheetUrl = https://docs.google.com/spreadsheets/d/18GrM5sSx3BsA_4lOT90z17i0OJMvktqDm6-ToV_5des/edit#gid=0
    var baseUrl = 'https://script.google.com/macros/s/AKfycbxu6J7GF8ZZA6rRT2_TLxWGtI_zAJnF8EEDQX_CEGRi8UMoOFI/exec';
    const url = baseUrl + '?authorize=' + encrypt_(JSON.stringify(accessObject));
    var response;
    
    // If the client exists in the Meadery Solutions DB then continue
    if ( response = this.fetchResponse_(url) ) {
      
      // If the client is 'ACTIVE' then continue
      if (response.status == 'ACTIVE') {
        // Set client's information in temporary cache.
        // This is the client's business information NOT the persistent client app data
        var minutesToCache = 360;// 6hrs
        this.getStorage_('cache').set(storageKey,response,minutesToCache);
        // Get the persistent client app data
        clientRecord = this.getStorage_('script').get(accessObject.accessCode);
        
        // if client's app data object doesn't exist and the active user's email is the Primary Email
        // Create a new Client Object and database
        if (!clientRecord &&
            response.primaryEmail == activeUserEmail) {
          clientRecord = this.createClientAppDataObject(accessObject.accessCode, activeUserEmail);
        }
      }
    }
  } else if (cachedRecord.status == 'ACTIVE'){
    clientRecord = this.getStorage_('script').get(accessObject.accessCode);
  }
  
  return clientRecord;
};



/**
* NOT IN USE (or set up)
* Updates values in the client spreadsheet
*/
dbConn_.prototype.setClientRecord = function(accessCode) {
  var mySuperSecretObject = JSON.stringify({accessCode:accessCode,companyName:'Artivem Mead Co.',values:{moreValues:'inside this object',soMany:'can they be accessed?'}});
  var encryptedString = encrypt_(mySuperSecretObject);
  var url = 'https://script.google.com/macros/s/AKfycbxu6J7GF8ZZA6rRT2_TLxWGtI_zAJnF8EEDQX_CEGRi8UMoOFI/exec';
  const response = this.fetchResponse_(url,encryptedString,'post');
  return this;
};



/**
* Create new if the client information is not in the properties store and is a registered client
*
* Creates the necessary folder/file structure in the active user's drive
* And createss the object containing the client's app data
* this function is used the first time a client logs in
* Conditions to run this function: 
 - The business name and accessCode must exist in the Registered Client's spreadsheet
 - The active user must be the Primary Contact/Email
 - The client's status must be "ACTIVE"
* @param {string} accessCode The client's access code
* @return {object} The persistent client app data
*/
dbConn_.prototype.createClientAppDataObject = function(accessCode,activeUserEmail) {
  const userId = getNextId('user');
  const clientObject = globalTemplate_.client;
  // Create folder
  clientObject.folders.main = createFolder_();
  // Create spreadsheet database
  const databaseId = createProductionDatabase_();
  const newUserValues = {status:'ACTIVE',permission:'ADMIN',email:activeUserEmail,id:userId};
  // Add first user
  this.setSpreadsheetId(databaseId).setTable('users').createRecord(newUserValues)
 
  clientObject.sheets.production = databaseId;
  // Store Client Object in persistent storage
  this.getStorage_('script').set(accessCode,clientObject);
  return clientObject;
};

/**
* Fetches values from another website/server
* @param {string} url The URL of the response endpoint.
* @param {boolean} auth If authorization needs used
* @param {Object} payload The response request payload.
* @return {Object} The parsed response.
*/
dbConn_.prototype.fetchResponse_ = function(url,payload,method,auth) {
  const headers = {
    "Authorization": "Bearer " + ScriptApp.getOAuthToken(),//"Authorization": "Basic " + Utilities.base64Encode(login/apikey + ":" + password/apisecret)),
  };
  const options = {
    "method": method ? method : 'get', // post
    "followRedirects" : true,
    "muteHttpExceptions": true,
    'contentType': 'application/json'
  }
  if (auth) options.headers = headers;
  if (payload) options.payload = payload;
  
  const response = UrlFetchApp.fetch(url, options);
  return this.getResponseData_(response);
};

/**
* @return {object} The UrlFetchApp response 
*/
dbConn_.prototype.getResponseData_ = function (response) {
  if (response.getResponseCode() == 200 &&
      response.getHeaders()['Content-Type'].indexOf('application/json') >= 0) {
    result = this.parseResponse_(response.getContentText());
    
    // If a server payload exists
    if (result.payload)  {
      result = this.parseResponse_(decrypt_(result.payload)); 
    }
  }
  return result;
};

/**
* Parses the response using the service's response format.
* @param {string} content The serialized response content.
* @return {!Object} The parsed response.
* @private
*/
dbConn_.prototype.parseResponse_ = function(content) {
  var response;
  try {
    response = JSON.parse(content);
  } catch (e) {
    throwError_('Server response not valid JSON: ' + e);
  }
  return response;
};

/**
* Identifies null values in an array, so they can be easily replaced
* @param array {array}
* @return {array}
* @private
*/
dbConn_.prototype.findNull_ = function (array){
  // Replace null values with 'isNullValue'
  for (i = 0; i < array.length;i++){
    !array[i] ? array[i]='isNullValue' : null;
  }
  return array;
};

/**
* insertMissingValuess
* If a value in the new row is missing, replace it with the value from the current row
* @return {array} Updated array
*/
dbConn_.prototype.insertMissingValues_ = function (newRow,currRow) {
  newRow.forEach(function(v,i){
    if (v == 'isNullValue') { newRow[i] = currRow[i];  }
  }); 
  return newRow;    
};

/**
* Gets the storage layer for this service, used to persist responses.
* Custom values associated with the service can be stored here.
* @return {Storage} The service's storage.
*/
dbConn_.prototype.getStorage_ = function(storageService) {
  if (!this.storage_) {
    var prefix = 'conn_';
    var store = new Storage_(prefix);
    this.storage_ = store;
  }
  this.storage_.setServiceType(storageService);
  return this.storage_;
};

/**
* Format an array to match the active table
* Create output array by comparing column headers to object keys
* Loop through object key/value pairs from the user interface
* If the key matches a column header, put the value in the matching header column within the output array
* @param {object} newValuesObject The values from the UI to be added to the table
* @param {array} tableheader The normalized values of the current table's header
* @return {array} The array with the values in their proper indices
*/
function formatTableArray_(tableheader,newValuesObject){
  var output =[];
      for (let formKey in newValuesObject){
        let index = tableheader.indexOf(formKey);
        output[index] = newValuesObject[formKey];
      }
  return output;
}