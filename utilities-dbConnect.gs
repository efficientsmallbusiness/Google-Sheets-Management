


function getLossTypeList(data){
  var header = data[0];
  var lossTypeIndex = header.indexOf('LOSS TYPE');
  
  return data
  .map(function(val,index){if (val) {if (index > 0) {return val[lossTypeIndex];}}})
  .filter(function(e) {return e});
}



function log_(value) {
  SpreadsheetApp
  .openById('198vD7x9Yu0jCQzWwzBP4GqffEX-Jz71LhH9dke_8FVQ')
  .getSheetByName('ERROR_LOG')
  .appendRow([new Date(),JSON.stringify(value)])
}

/**
* Client-side script calls this function to get all the array values of the specified table
* @param {string} tableName The table to get the array values of
* @param {object} accessObject The object containing the client's access object and company name
* @param {boolean} isQuery Determines if a table or query tab is retrieved
* @return {2D array} 
*/
function getTableArray(accessObject,tableName,isQuery) {
  const clientInfo = conn_().getStoredInfo(accessObject);
  return JSON.stringify({mainArray:conn_(clientInfo.sheets.production).setTable(tableName,isQuery).getValuesArray()});
}



function test_getNextId(){
var response = getNextId({accessCode:'1234567',name:'Artivem Mead Co.'},'recipe');
Logger.log(response);
}
/**
* @param {object} accessObject
* @param {string} idType
  - ID types: row, batch, recipe, user
*/
function getNextId(accessObject,idType){
  const lock = LockService.getScriptLock();
  
  // Create lock to avoid concurrent use
  if (lock.tryLock(10*1000)) {  
    const clientInfo = conn_().getStoredInfo(accessObject);
    Logger.log(clientInfo);
    const ids = clientInfo.ids;
    var nextId = parseInt(ids[idType]) + 1;
    
    clientInfo.ids[idType] = nextId; // update client info
    conn_().setClientInfo(accessObject,clientInfo); // Set new ID
  }
  
  // Add id suffix
  if (idType == 'batch') nextId += 'B';
  else if (idType == 'recipe') nextId += 'R';
  
  return nextId;
}


/**
* Return all table data for specified batch id for both the primary table and the associated details table
* EXAMPLE: 
 - page = recipe
 - recordId = 200B
 - returns array from table_RECIPE where the column 'ID' = 200B
           and an object from table_RECIPE_DETAILS where the column 'RECIPE ID' = 200B
*
* @param {object} accessObject The client's accessCode and company name
* @param {string} table The main table to search in
* @param {string} recordId [optional] The recordId to use
* @return {object}
*/
var getPageData = function(accessObject,tableName,recordId){
  const output = {};
  const clientInfo = conn_().getStoredInfo(accessObject);
  const conn = conn_(clientInfo.sheets.production);
  const primaryObject = conn.setTable(tableName).getRecordById(recordId);
  output.subTable = {};
  output.recordId = recordId;
  output[tableName] = primaryObject;
  
  
  // The subTable keys must match the associated table id they are supposed to fill
  // EX: 
  // - <table id='batch-table-ingredient'></table>
  // - subTable['batch-table-ingredient']
  switch (tableName) {
    case 'batch':
      
      output['recipe'] = conn.setTable('recipe').getRecordById(primaryObject.recipeId);//Fills input fields not a table
      
      // Get the sub tables
      const splitBatchTable = separateIngredientTables_(getSubTableRecords_(conn,'batch_details',recordId,'batchId'));
      output.subTable['batch-table-ingredient'] = splitBatchTable.ingredients;
      output.subTable['batch-table-additive'] = splitBatchTable.additives;
      output.subTable['batch-table-loss'] = getSubTableRecords_(conn,'loss_details',recordId,'batchId');
      output.subTable['batch-table-ferment'] = getSubTableRecords_(conn,'ferment_details',recordId,'batchId');
      output.subTable['batch-table-blend'] = getSubTableRecords_(conn,'blend_details',recordId,'batchId');
      break;
    case 'recipe':
      const splitRecipeTable = separateIngredientTables_(getSubTableRecords_(conn,'recipe_details',recordId,'recipeId'));
      output.subTable['recipe-table-ingredient'] = splitRecipeTable.ingredients;
      output.subTable['recipe-table-additive'] = splitRecipeTable.additives;
      break;
    case 'inventory':
      break;
    case 'vessels':
      break;
    case 'aging':
      break;
    case 'schedule':
      break;
  }
  
  return JSON.stringify(output);
}

/**
* Get table records of sub tables (The tables that hold details about the main table)
* Returns the records of a "Details" table
* @param {string} subTableName The table to search in
* @param {string} searchId The foreign id to search for
* @param {string} foreignCol The name of the foreign column to search in
*/
var getSubTableRecords_ = function(conn,subTableName,searchId,foreignCol) {
    // This is processed on the server side, because this table will get huge and I don't want to send that large of an array to the client-side
    const values = conn.setTable(subTableName).getValues().object;  
    return values ? values.filter(function(item){return item[foreignCol] == searchId}) : null;
}

/**
* separate object values (specifically ingredient/additive types from the recipe and batch tables) 
* @param {array} arrayOfObjects The details table for the batch 
* @param {object} 
*/
var separateIngredientTables_ = function(arrayOfObjects) {
  var ingredients = [];
  var additives = [];
  // Loop through array
  for (var i=0;i<arrayOfObjects.length;i++) {
    var valuesObject = arrayOfObjects[i];
    // Loop through object to check values
    Object.values(valuesObject).forEach(function(val) {
      if (typeof val != 'string') return;
      if (val.toLowerCase() == 'ingredient') ingredients.push(valuesObject);
      else if (val.toLowerCase() == 'additive') additives.push(valuesObject);
    });
  }
  return {ingredients:ingredients,additives:additives};
}


function test_createNewSheetRecord (){
  var respon = createNewSheetRecord({accessCode:'1234567'},
                               {btnId:'recipe-btn-blend',loadedRecordId:'123B'},
                               'row');
  Logger.log(respon);
}


/**
* Updates the spreadsheet database
* @param {object} accessObject Cotains the client accessCode and company name
* @param {object} detailsObject
- {sheetName: 'batch', // The sheet name to update (will be converted to "table_BATCH" to match the actual sheet title)
   record: '123B', // The ID to update
   columnName: 'batchStatus', // normalized header name
   value: this.value} // the value to enter
* @param {string} action The action to take: 'create', 'update', 'delete'
*/
var updateDatabase = function (accessObject,rowDetails,action) {
  const clientInfo = conn_().getStoredInfo(accessObject);
  if (action == 'update') {
    conn_(clientInfo.sheets.production).setTable(rowDetails.sheetName).updateRecord(rowDetails);
  } else if (action == 'delete') {
    conn_(clientInfo.sheets.production).setTable(rowDetails.sheetName).deleteRecord(rowDetails);
  } 
  
}


/**
* Creates a new row in a spreadsheet and sets the initial values
* @param {string} idType The type of id to use (must match the client's app object: row, batch, recipe)
* @param {object} rowDetails Object containing all of the details required to populate a sheet row
* @param {object} accessObject
* @return {object} The initial row values to display
 - The initial values will be used to populate the new table row on the UI
*/
var createNewSheetRecord = function (accessObject,rowDetails,idType) {
  const clientInfo = conn_().getStoredInfo(accessObject);
  // Get next available record
  rowDetails.id = getNextId(accessObject,idType);
  // Create initial values for the new row
  createNewRowObject_(rowDetails,clientInfo.settings.timezone)
  // Create new record in sheet
  conn_(clientInfo.sheets.production).setTable(rowDetails.sheetName).createRecord(rowDetails.initialRowValues);

  return JSON.stringify(rowDetails);
};



/**
* Adds the required values for a new record to the icoming object
* @param {object} obj The object containing the edited row values
*/
var createNewRowObject_ = function (obj,timezone) {
  const btnId = obj.btnId;
  obj.initialRowValues = {};
  
  if (btnId) {
    // Check if the object contains an ingredient table
    if (btnId.indexOf('ingredient') > -1 || btnId.indexOf('additive') > -1 ) {
      const type = btnId.substring(btnId.length,btnId.lastIndexOf("-")+1);
      obj.initialRowValues.type = type; 
    }
    const foreignKey = btnId.substring(btnId.indexOf("-"),0) + 'Id'; // The foreign key field (eg "RECIPE ID")
    obj.initialRowValues[foreignKey] = obj.loadedRecordId;
  }
  // These are mandatory fields for every table record
  obj.initialRowValues.id = obj.id; // Generated record number
  obj.initialRowValues.created = Utilities.formatDate(new Date(), timezone, "MM/dd/yyyy");
};

function getClientTimeZone_(accessObject){
  return conn_().getStoredInfo(accessObject).settings.timezone;
}