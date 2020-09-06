/**
* Gets the company name from the user script property
*/
function getCompanyName(){
  return JSON.parse(userProps().getProperty('loggedIn')).company;
}



/**
* return company JSON object
*/
function getCompanyDetails(){
  return getScriptProp(getCompanyName());
}



/**
* return spreadsheet id for production sheet
*/
function getProductionSheetId(){
  return getCompanyDetails().sheetId.production;
}


/**
* return {object} Spreadsheet object
*/
function dbConn() {
// var spreadsheetId = '198vD7x9Yu0jCQzWwzBP4GqffEX-Jz71LhH9dke_8FVQ'; // Micah
  // This needs tested soon to see when access is granted
  //var spreadsheetId = '1-wq5o1gknAVFf02v2UmoYrDznv-PV9ev0tRR9jPfLkE'; // Hannah
  //  var sheetName = 'table_BATCH';
  return SpreadsheetApp.openById(getProductionSheetId());
}




/**
* Sets a single value in a page sheet, so it needs the sheet name, row, col, and value
* return nothing
*/
function setValueInSheet(sheetName,row,col,val){
  dbConn().getSheetByName(sheetName).getRange(row,col).setValue(val);
}






/**
* Append row to batch tab
*
* This may need updated so it adds the fields based on their column name
*
* @param batchId {array} 
*/
function createNewBatchRecord(batchId){
    dbConn().getSheetByName('table_BATCH').appendRow(batchId)
}



/**
* Append row to recipe tab
*
* @param recipeId {array} 1D array containing the new recipe id and the date it was created
*/
function createNewRecipeRecord(recipeId){
    dbConn().getSheetByName('table_RECIPE').appendRow(recipeId)
}




// For testing purposes only
function setSheetValue(value){
  return dbConn().getSheetByName('NOTES').getRange(1,1).setValue(value);
}


/**
* Get values from sheet data range
*/
function getSheetData(sheetName){
  return dbConn().getSheetByName(sheetName).getDataRange().getValues();
}






/**
* Get the top row values from sheet
*/
function getSheetHeader(sheetName){
var sheet = dbConn().getSheetByName(sheetName);
  return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues();
}






// Client-side script calls this function to get the values to populate the batch list for the Batch management page
function getBatchList(){
  // Get data from batch sheet and stringify it
  return JSON.stringify(getSheetData('query_BATCH_RECIPE_LIST'));
}




// Client-side script calls this function to get the values to populate the recipe list for the Recipe management page
function getRecipeList(){
  // Get data from recipe sheet and stringify it
  return JSON.stringify(getSheetData('table_RECIPE'));
}







var testBlendData = [{
date: '2020-01-06',
temp: '73',
tempOn: '',
tempOff: '',
sg: '1.112',
id: 88,
batch: 123,
}];


var testFermTable = [{
date: '2020-01-02',
temp: '73',
tempOn: '',
tempOff: '',
sg: '1.068',
id: '98',
batch: '123',
ph: '3.14',
degas: 'Yes',
o2Lpm: '1',
abv: '7',
fermK: '6',
},
{
date: '2020-02-03',
temp: '83',
tempOn: '70',
tempOff: '79',
sg: '1.012',
abv: '12',
o2Lpm: 'x',
degas: 'Yes',
note: 'This is a short note.',
id: '99',
batch: '123',
}];


// Return all table data for specified batch id
function getBatchData(batchId){
  
  var output = {
    id: batchId,
    tableName: 'BATCH',
    sheetName: 'table_BATCH',
    data: getSheetData('table_BATCH'),
    ingredientTable: getBatchIngredientData(batchId),
    uiLists: getUiLists(),
    lossTable:'',
    blendTable:'',
    fermentTable: testFermTable,
  }
  
  return JSON.stringify(output);
}




// Return all table data for specified batch id
function getRecipeData(recipeId){
  var uiLists = getUiLists()
  
  var output = {
    id: recipeId,
    tableName: 'RECIPE',
    sheetName: 'table_RECIPE',
    data: getSheetData('table_RECIPE'),
    tableData: getRecipeTableData(recipeId),
    uiLists: uiLists,
    }
    
  
  return JSON.stringify(output);
}





function getUiLists(){
  return getSheetData("UI_LISTS");
}






function getLossTypeList(data){
  var header = data[0];
  var lossTypeIndex = header.indexOf('LOSS TYPE');
  
  return data
  .map(function(val,index){if (val) {if (index > 0) {return val[lossTypeIndex];}}})
  .filter(function(e) {return e});
}









/**
* getBatchIngredientData 
*
* Get ingredient/additive data for specified batch id
*
* @param batchNum {string} batch id to search for in range
*
* return {array}
*/
function getBatchIngredientData(batchNum){
  var data = getSheetData("table_INGREDIENT_USAGE");
  var header = data[0];
  var batchIndex = header.indexOf("BATCH ID");
  var batchId = batchNum.toString();
  var values = [];
  
  // Add header to top of array
  values.push(header);
  
  // Loop through ingredient table and add values to array that matching the batch id
  for (var i=0;i<data.length;i++){
    if (data[i][batchIndex].toString() === batchId){
      values.push(data[i]);
    }
  }
  return values;

}






/**
* getRecipeTableData 
*
* Get ingredient/additive data for specified batch id
*
* @param batchNum {string} batch id to search for in range
*
* return {array}
*/
function getRecipeTableData(recipeId){
  var data = getSheetData("table_RECIPE_DETAILS");
  var header = data[0];
  var recipeIdIndex = header.indexOf("RECIPE ID");
  var strId = recipeId.toString();
  var values = [];
  
  // Add header to top of array
  values.push(header);
  
  // Loop through ingredient table and add values to array that matching the batch id
  for (var i=0;i<data.length;i++){
    if (data[i][recipeIdIndex].toString() === strId){
      values.push(data[i]);
    }
  }
  return values;

}





/**
* getInventoryData [NOT WORKING]
*
* Get current inventory data. 
*
* @param batchNum {string} batch id to search for in range
*
* return {array}
*/
function getInventoryData(batchId){
  var data = getSheetData('query_INGREDIENT_INVENTORY');
}





/**
* getLossData
*
* Get data range values from loss table for the selected batch
*
* @param batchNum {string} batch id to search for in range
*
* return {array}
*/
function getLossData(batchNum){
  var data = getSheetData("table_LOSS");
  var header = data[0];
  var batchIndex = header.indexOf("BATCH ID");
  
  var batchId = parseInt(batchNum);
  
  var values = [];
  
  // Add header to top of array
  values.push(header);
  
  // Add matching batch id rows to array
  for (var i=0;i<data.length;i++){
    if (parseInt(data[i][batchIndex]) === batchId){
      values.push(data[i]);
    }
  }
  
  return values;
}





/**
* Updates sheet value 
*/
function updateRecord(clientObject){
  var json = JSON.parse(clientObject);
  // replace undefined with blank
  var value = json.value ? json.value : '';
  var data = getSheetData(json.sheetName);
  var header = normalizeHeaders_(data[0]);
  var recordIndex = header.indexOf(json.recordColumnName);
  var record = json.record;
  
  // Get column by matching the element id with the normalized header
  var col = header.indexOf(json.columnName)+1;
  var row = 0;
  
  // Find row by matching the record id
  for (var i=0;i<data.length;i++){
    if (data[i][recordIndex] === record){
      row = i+1;
      break;
    }
  }
  
  setValueInSheet(json.sheetName,row,col,value);
}





/**
* processRow
*
* Processes table row updates
*
* @param rowObject {object} JSON object containing row values and other relevant data (such as sheet name)
*
* return nothing
*/
function processRow(rowObject){
  var rowVals = {};
  
  if (typeof rowObject === 'string') {
    rowVals = JSON.parse(rowObject);
  } else {
    rowVals = rowObject;
  }
  
  // Get the object key for the record id - batchId, recipeId, etc
  // and the column name - BATCH ID, RECIPE ID, and so on...
  var pageName = rowVals.tableId.substring(0,rowVals.tableId.indexOf('-'));
  rowVals.recordObjectKey = pageName + 'Id';
  
  
  var newRow = rowVals.isNew;
  var deleteRow = rowVals.isDelete;
  var updateRow = rowVals.isUpdate;
  
  // Determine if this row should be updated/deleted/added
  if (newRow) {
  
    if (deleteRow) return true; // don't do anything
    else if (updateRow) appendSheetRow(rowVals,true); // append to sheet
    rowVals.isNew = false;
  }
  else {
  
    if (deleteRow) deleteRowInTablesSheet(rowVals); // find and delete
    else if (updateRow) updateRowInTablesSheet(rowVals); // find and replace row values
  }
  
  // Return row object, so the "isNew" field can be removed from the table
  return JSON.stringify(rowVals);
}




/**
* Updates entire row from table. Needs sheet name, record Id, and row object to match object keys to column names
*
* @param obj {object} JSON object of table row data from client-side
*
* return nothing
*/
function updateRowInTablesSheet(obj){
  var sheet = dbConn().getSheetByName(obj.dbName);
  var data = sheet.getDataRange().getValues();
  var header = normalizeHeaders_(data[0]);
  var recordIndex = header.indexOf(obj.recordObjectKey);// BATCH/RECIPE ID INDEX
  var idIndex = header.indexOf('id');
  var recordId = obj[obj.recordObjectKey];
  var output = [];
  var row = 0;
  
  // Create output array by matching object keys to destination header indices
  for (var [key,val] in obj){
    output[header.indexOf(key)] = val;
  }
  // Remove null values in the event there is a random column in the table
  output = removeNull_(output);
  
  // Search data and match unique id and record id to get the sheet's row number
  for (var i=0;i<data.length;i++){
    if (data[i][idIndex] === obj.id && data[i][recordIndex] === recordId) {
        row = i+1;
        break;
    }
  }
  
  // If row is less than 1, no match was found.
  // Could be because a row was deleted, or because a new row failed to append. Now it's trying to update
  // So append a new row
  if (row < 1) {
    sheet.appendRow(output);
    return;
  }
  
  // Put row values into sheet
  sheet.getRange(row,1,1,output.length).setValues([output]);
}




/**
* Removes null values from array and replaces them with blanks
*
* @param array {array} 1D array
*
* return {array}
*/
function removeNull_(array){
    for (var i = 0; i < array.length;i++){
      !array[i] ? array[i]='' : null;
    }
    return array;
}






/**
* Finds the matching record within a table and deletes it
*
* @param obj {object} JSON object of table row data from client-side
*
* return nothing
*/
function deleteRowInTablesSheet(obj){
Logger.log('delete')
  var sheet = dbConn().getSheetByName(obj.dbName);
  var data = sheet.getDataRange().getValues();
  var header = normalizeHeaders_(data[0]);
  var recordIndex = header.indexOf(obj.recordObjectKey);// BATCH/RECIPE ID INDEX
  var idIndex = header.indexOf('id');
  var recordId = obj[obj.recordObjectKey];
  var row = 0;
  
  // Search data and match unique id and record id to get the sheet's row number
  for (var i=0;i<data.length;i++){
    if (data[i][idIndex] === obj.id && data[i][recordIndex] === recordId) {
        row = i+1;
        break;
    }
  }
  Logger.log(row);
  // If row is less than 1, stop
  // In case someone already deleted the row
  if (row < 1) return;
  
  // Delete specified row
  sheet.deleteRow(row)
}







/**
* appendSheetRow
*
* Appends a row to a sheet

* @param rowObject {object} The row values to be appended. Contains all relevant data including sheet name
*
* return nothing
*/
function appendSheetRow(obj) {
Logger.log('append')
 var sheet = dbConn().getSheetByName(obj.dbName);
  var data = sheet.getDataRange().getValues();
  var header = normalizeHeaders_(data[0]);
  var output = [];
  
  // Create output array by matching object keys to destination header indices
  for (var [key,val] in obj){
    output[header.indexOf(key)] = val;
  }
  // Remove null values in the event there is a random column in the table
  output = removeNull_(output);
  
  try{
  // Append row to sheet
  sheet.appendRow(output);
  } catch(e){Logger.log(e)};
}