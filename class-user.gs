
/**
* setLoggedInStatus
*
* Set the user property 'loggedIn'
* when a user logs in or out
*
* @param status {boolean} true if logged in. false if logged out
*
* return nothing
*/
function setLoggedInStatus(status,companyName){
  var storedObj = {
    status: status,
    company: companyName,
  };
   userProps().setProperty('loggedIn', JSON.stringify(storedObj));
}




/**
* @param {object} accessObject The object containing the client's company name and access code
  - {accessCode: '1234',name: 'Acme Inc.'}
* @return {object} The login status and a message if unsuccessful
  - {loggedIn: false,message: 'Could not verify login credentials'}
*/
function userLogin(accessObject) {
  var loggedIn = false;
  var userData;
  if ( userData = getUser_().logIn(accessObject) ) {
   loggedIn = true; 
  }
  var status = 'Log in = '+loggedIn;
  return {loggedIn: loggedIn,message:status,userData:userData,page:'home'};
}


/**
* Sets the users login status to false
*
* return {string} The name of the file that will be dynamically loaded after logout
*/
function userLogout(){
  getUser_().logOut();
  return 'login';
}


function reset(){
 var prop = PropertiesService;
// prop.getScriptProperties().deleteAllProperties();
 prop.getUserProperties().deleteAllProperties();
//  CacheService.getScriptCache().removeAll();
}



function logUserProperties(){
 var ps = PropertiesService.getUserProperties().getProperties();
  Logger.log(JSON.stringify(prop));
}



// @return {object} The client's app data
function test_getClientData_(){
  const deets = getUserData();
  return conn_().getClientInfo(deets.company);
}


function test_getUserData_(){
 return getUser_().getDetails(); 
}


function test_createUser_(){
  var accessCode = '123456'; // The unique identifier given to a client
  var name = 'Artivem Mead Co.';// The client's business name
  var obj = {accessCode:accessCode,name:name}
  var response = getUser_().createUserAccessObject(obj);
  Logger.log(response)
}



function getUser_() {
 return new User_; 
}


/**
* @constructor
*/
var User_ = function() {
  this.userEmail = Session.getActiveUser().getEmail();
  this.detailsKey = 'userDetails';
  this.loginKey = 'loggedIn';
};



/**
* Set active user's data into the user properties service
*/
User_.prototype.setDetails = function (userObject) {
  this.getStorage_('user').set(this.detailsKey,userObject);
};



/**
* Get active user's stored info
*/
User_.prototype.getDetails = function () {
if (!this.userDetails_) this.userDetails_ = this.getStorage_('user').get(this.detailsKey);
  return this.userDetails_;
};



/**
* Get user's logged in status
*/
User_.prototype.getLoggedInStatus = function () {
  if (!this.userLogin_) this.userLogin_ = this.getStorage_('user').get(this.loginKey);
  return this.userLogin_;
};


/**
* Logs the user out by removing their loginKey
*/
User_.prototype.logOut = function () {
  this.getStorage_('user').remove(this.loginKey);
};



/**
* Logs the user in by setting their loginKey
* @param {object} accessObject The company name and access code
* @return {object} The user's app object. Null if invalid
*/
User_.prototype.logIn = function (accessObject) {
  var validUser = null;
  if ( validUser = this.loginValidation(accessObject) ) {
    // Set user login
    this.getStorage_('user').set(this.loginKey,true);
  }
  return validUser;
};






/**
* Confirms the input company information is valid and the user is valid
* @param {object} accessObject The company name and access code
* @return {object} The active user's app data object
*/
User_.prototype.loginValidation = function (accessObject) {
  var user = null;
  var clientRecord;
  var userRecord;
  
  Logger.log('function: logValidation');
  
  // Client record exists and is active
  if ( clientRecord = conn_().getClientInfo(accessObject,this.userEmail), this.userEmail ) { // Connect to Company Spreadsheet and search for companyId and name
    Logger.log('client exists')
    Logger.log(clientRecord);
    // User record exists in client's database
    if ( clientRecord && (userRecord = conn_(clientRecord.sheets.production).getUserRecordFromClientDb(this.userEmail) )) { // Active user's info from client's database  
      Logger.log('User record exists');
      // User is active
      if (userRecord.status == 'ACTIVE') {
        Logger.log('user is active');
        // User's app-data object exists
        if ( user = this.getDetails() ) { 
          Logger.log('already have user app object')
          // Update the user's app data object
          user.userDetails = userRecord;
          this.setDetails(user);
          
        } else { // If the user's app data doesn't exist
          Logger.log('creating a userAppDataObject');
          Logger.log(userRecord);
          user = this.createUserAccessObject(accessObject,userRecord);
        }
      }
    }
  }
  return user;
};


/**
* Checks if active user has valid credentials on page load
* @return {boolean}
*/
User_.prototype.isValid = function () {
  var user = this.getDetails();
  var clientRecord;
  var userRecord;
  
  Logger.log('function: isValid');
  
  // Get user details if the user exists and is logged in
  if ( user && (this.getLoggedInStatus()) ) { 
    Logger.log(user)
    Logger.log('user app object exists and user is logged in')
    // Client record exists and is active
    if ( clientRecord = conn_().getClientInfo(user.company, this.userEmail) ) { // Connect to Company Spreadsheet and search for companyId and name
      Logger.log('is an active client');
      // User record exists in client's database
      if ( userRecord = conn_(clientRecord.sheets.production).getUserRecordFromClientDb(this.userEmail) ) { // Active user's info from client's database  
        Logger.log('found user record');
        // Update the user's app data object
        user.userDetails = userRecord;
        Logger.log(user.userDetails.status == 'ACTIVE');
        this.setDetails(user);
        
        user = user.userDetails.status == 'ACTIVE' ? user : null;
      }
    } 
  } else {
   user = null; 
  }
  return user;
}


/**
* Creates a new user object in the user properties service
* a user must already exist in the company database
* This is used the first time a user logs on
* @param {object} accessObject An object containing the parameters the client's 'accesscode' and 'name'
* @param {object} userRecord The user's record from the client's database
* @return {object} The user's app data object
*/
User_.prototype.createUserAccessObject = function (accessObject,userRecord) {
 // Get template user object and add details
  var newUserObject = globalTemplate_.user;
  newUserObject.company.accessCode = accessObject.accessCode;
  newUserObject.company.name = accessObject.name;
  // Put user details into the user's app data
  newUserObject.userDetails = userRecord;
  // Set user app data in user properties
  this.setDetails(newUserObject);
  return newUserObject;
};


/**
* Delete all properties for current user ( need to confirm that it is only for the active user)
*/
User_.prototype.delete = function () {
  this.getStorage_().removeAll();
};


/**
* Gets the storage layer for this service, used to persist responses.
* Custom values associated with the service can be stored here.
* @return {Storage} The service's storage.
*/
User_.prototype.getStorage_ = function(storageService) {
  if (!this.storage_) {
    const prefix = 'user_';
    const store = new Storage_(prefix);
    this.storage_ = store;
  }
  this.storage_.setServiceType(storageService);
  return this.storage_;
};


/**
* @return {!User_} This service, for chaining.
*/
User_.prototype.getTemporaryAccess = function(key){
  return this.getStorage_('cache').getAndRemove(key);
}


/**
* @return {!User_} This service, for chaining.
*/
User_.prototype.setTemporaryAccess = function(key,value){
  this.getStorage_('cache').set(key,value); // Store value in temporary cache
  return this;
}