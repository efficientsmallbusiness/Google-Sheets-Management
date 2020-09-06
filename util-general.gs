function throwError_(string) {
 throw new Error(string); 
}


// Store a new user's information in the script properties
function createNewUser(){
  var companyName = "Artivem";
  var pinCode = 'asdf';
  var data = {
    pin: pinCode,
    // There may be additional folders added as the system grows. Will most likely add a folder for images
    folderId:{main:'',// The main folder containing all the company files. This is created with a new account       
             },
    // The ids of the spreadsheets associated with this company. Most of these are created with a new account
    sheetId: {production:'198vD7x9Yu0jCQzWwzBP4GqffEX-Jz71LhH9dke_8FVQ', 
             },
    // The recordId provides a method for creating unique ids for system records
    recordId: {row: 0, // For table rows
               batch: 0, // For batches
               recipe: 0, // For recipes
              }
  };
  PropertiesService.getScriptProperties().setProperty(companyName, JSON.stringify(data))
}



/*
* Get the user properties service
*/
function userProps(){
  return PropertiesService.getUserProperties();
}


/*
* Get the script properties service
*/
function scriptProps(){
  return PropertiesService.getScriptProperties();
}


/*
* Get a script property
*
* @param key {string} object key
*
* return {object}
*/
function getScriptProp(key){
var vals = scriptProps().getProperty(key);

// check if property has values before parsing
if (!vals) return;

  return JSON.parse(vals);
}



/*
* Set a script property
*/
function setScriptProp(key,value){
  return scriptProps().setProperty(key, value);
}







/**
* getSheetData
*
* Get sheet values from data range of the specified sheet
*
* @param sheetName {string} String value containing a valid sheet name
*
* return {array} JSON array containing spreadsheet values
*/
function getSheetData(sheetName){
  var sheet = dbConn().getSheetByName(sheetName);
  return sheet.getDataRange().getValues();
}


/**
* getBatchId
*
* Gets the next available batch id
*
* return {string value} id 
*/
function getBatchId(){
  var recordNumber = getRecordId('batch');
  var batchId = recordNumber + "B";
  // Create a new batch record
  createNewBatchRecord(batchId);
  return batchId;
}

function createId(type){
  
  
  
}


/**
* getRecipeId
*
* Gets the next available recipe id
*
* return {string} value id 
*/
function getRecipeId(){
  var recordNumber = getRecordId('recipe');
  var recipeId = recordNumber + "R";
  var output = [recipeId,new Date()];
  createNewRecipeRecord(output);
  return recipeId;
}





/**
* getRowId
*
* Gets the next available id to be used for a table row/record
*
* @param tableObject {object} [OPTIONAL] JSON object passed from client-side containing row data from a table
*
* return {integer} value id 
*/
function getRowId(tableObject){
  return getRecordId('row',tableObject);
}






/**
* getRecordId
*
* Gets the next available id of the id type that is passed through as an argument
*
* @param tableObject {object} [OPTIONAL] JSON object passed from client-side containing row data from a table
* @param type {string} a string denoting which id to get from the company object. The string being passed is the same as the nested object key
*
* return {integer} an incremented id
*/
function getRecordId(idType,tableObject){
  // get company name to be used as an object key
  // This comes from the USER properties service (which is user-specific "private" cache) and is used to access the script properties service (which is "public");
  var companyName = getCompanyName();

  // Get company object
  var companyObj = getScriptProp(companyName);
  
  // Get the last used (current) recordId from the company object
  // The record id type denotes which id to get. recipe/batch/row
  var currentRecordId = companyObj.recordId[idType];
  var newId = '';
  
  if (currentRecordId) {
  // The stored id is the last used id, so it must be incremented by 1
    newId = parseInt(currentRecordId) + 1;
  }
  // If key/value pair doesn't exist, create it and start from 1
  else {
    newId = 1;
  }
 
  setId(companyObj,companyName,idType,newId);
  
  // If there is a tableObject, then add the id as a key/value pair
  // and return the whole object
  if (tableObject) {
    var obj = JSON.parse(tableObject);
    obj.id = newId;
    return JSON.stringify(obj);
  }
  return newId;
}







/**
* setId
*
* Places a new id into the company object then replaces the current object with the updates object
*
* @param companyObj {object} JSON object containing general company info. Stored in script properties service
* @param companyName {string} The company name used as a key in the script properties service
* @param idType {string} The type of id being put into the company object. It is the key for the nested object "recordId"
* @param id {integer} The id to be placed in the company object
*
* return nothing
*/
function setId(companyObj,companyName,idType,id){
  companyObj.recordId[idType] = id;
  // Stringify the company object and put it as the value in the script properties service with the company name as the key
  setScriptProp(companyName, JSON.stringify(companyObj));
}






/**
* Creates a folder in the current users's Drive
* @return {string} Folder id
*/
function createFolder_(){
  return DriveApp.createFolder(globalTemplate_.clientValues.folderName).getId();
}

/**
* Creates a copy of the spreadsheet database template
* @return {string} Spreadsheet id
*/
function createProductionDatabase_(){
  var folder = DriveApp.getFoldersByName(globalTemplate_.clientValues.folderName).next()
  return DriveApp.getFileById(globalTemplate_.clientValues.production.id).makeCopy(globalTemplate_.clientValues.production.name, folder).getId();
}
