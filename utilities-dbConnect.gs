function getLossTypeList(data){
  var header = data[0];
  var lossTypeIndex = header.indexOf('LOSS TYPE');
  
  return data.map(function(val,index){if (val) {if (index > 0) {return val[lossTypeIndex];}}})
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
* @para {object} options Contains options for determining what data to retreive
    - {string} table The main table to search in
    - {string} recordId [optional] The recordId to use
    - {boolean} getRecipesDetails
* @return {object}
*/

function test_getPageData(){
  var accessObject = {"accessCode":"1234567","name":"Artivem Mead Co."}
  var options = {"subTable":{"batch-table-ingredient":[{"id":47,"recipeId":"73R","ingredient":"Honey: Wildflower","qty":0.225,"uom":"gal","note":"","created":"2020-11-24T08:00:00.000Z"},{"id":48,"recipeId":"73R","ingredient":"Yeast: AW4","qty":0.05,"uom":"g","note":"","created":"2020-11-24T08:00:00.000Z"}],"batch-table-loss":[],"batch-table-ferment":[],"batch-table-blend":[]},"recordId":"96B","batch":{"id":"96B","recipeId":"73R","created":"2020-11-24T08:00:00.000Z","description":"","batchVessel":"","batchStatus":"ON HOLD","initialGallons":10,"batchStart":"","projectedFinish":"","filtered":"","porosity":"","finalAbv":"","batchFinish":"","finishedGallons":"","remainingGallons":"","og":"","alcPotential":"","stopO2":"","stopManagement":"","stopSg":"","stopAbv":"","batchNotes":"","archived":""},"recipe":{"id":"73R","created":"2020-11-24T08:00:00.000Z","shortDescription":"Strawberry, blueberry, raspberry","alcType":"MEAD","batchType":"FERM","recipeStatus":"DEVELOPING","recipeName":"","carbonated":"","gPerMl":"","startGravity":1,"endGravity":0.9,"startBrix":"","endBrix":"","abvBase":14,"abvFinal":12,"notes":"My many notes about this spectacular mead","cola":"","ttbStatus":"","formulaSubmitted":"","formulaApproved":"","labelSubmitted":"","labelApproved":"","notableDetails":"This is a very notable fruited mead","awards":"It was won MANY awards","archived":""}};
  const clientInfo = conn_().getStoredInfo(accessObject);
  const conn = conn_(clientInfo.sheets.production);
  
  
  // START HERE
  
  const initGals = options.batch.initialGallons;
  
  // Get the values from the recipe_details table
  const batchDetails = getSubTableRecords_(conn,'recipe_details', '73R','recipeId');
  //Logger.log(options);
  
  batchDetails.forEach(function(row){
    var newRows = {};
    // multiply the quantities by the initial gallons to get the appropriate quantities for the new batch
    row.qty = row.qty * initGals;
    
    // Add the sheet name to the object
    newRows['sheetName'] = 'batch_details';
    newRows['recordId'] = options.recordId;
    newRows['inputValues'] = row;
    
    Logger.log(newRows);
    createNewSheetRecord(accessObject,newRows,'row')
  });
  
  
}


/**
* @param {object} accessObject The client's accessCode and company name {accessCode:'',name:''}
* @param {object} options The 
*/
var getPageData = function(accessObject,options){
  const output = {};
  const clientInfo = conn_().getStoredInfo(accessObject);
  const conn = conn_(clientInfo.sheets.production);
  const primaryObject = conn.setTable(options.sheetName).getRecordById(options.recordId);
  output.subTable = {};
  output.recordId = options.recordId;
  output[options.sheetName] = primaryObject;
  
  // The subTable keys must match the associated table id they are supposed to fill
  // EX: 
  // - <table id='batch-table-ingredient'></table>
  // - subTable['batch-table-ingredient']
  switch (options.sheetName) {
    case 'batch':
      
      // Get the sub tables
      let batchDetails;
      const initGals = options.initialGallons;
      
      if (!initGals) { // the initialGallons key will be in the options object if it's a new batch
      
        batchDetails = getSubTableRecords_(conn,'batch_details',options.recordId,'batchId');
        
      } else {
        // This will only happen when a new batch is created using a current recipe
        // Get recipe details table and multiply the values by the target batch size
        
        batchDetails = getSubTableRecords_(conn,'recipe_details', primaryObject.recipeId,'recipeId');// Get the values from the recipe_details table
        
        batchDetails.forEach(function(row){
          var newRows = {};
          // multiply the quantities by the initial gallons to get the appropriate quantities for the new batch
          row.qty = row.qty * initGals;
          
          row['batchId'] = options.recordId;
          // Add the sheet name to the object
          newRows['sheetName'] = 'batch_details';
          newRows['inputValues'] = row;
          // Add new row to the batch_details sheet
          createNewSheetRecord(accessObject,newRows,'row')
        });
        
      }
      
      output['recipe'] = conn.setTable('recipe').getRecordById(primaryObject.recipeId);//Fills input fields - not a table
      output.subTable['batch-table-ingredient'] = batchDetails;
      output.subTable['batch-table-loss'] = getSubTableRecords_(conn,'loss_details',options.recordId,'batchId');
      output.subTable['batch-table-packaging'] = getSubTableRecords_(conn,'packaging_details',options.recordId,'batchId');
      output.subTable['batch-table-ferment'] = getSubTableRecords_(conn,'ferment_details',options.recordId,'batchId');
      output.subTable['batch-table-blend'] = getSubTableRecords_(conn,'blend_details',options.recordId,'batchId');
      
      break;
    case 'recipe':
      // delete the commented out lines unless something breaks with the inventory table
     // const splitRecipeTable = separateDetailsTable_(getSubTableRecords_(conn,'recipe_details',options.recordId,'recipeId'));
      output.subTable['recipe-table-ingredient'] = getSubTableRecords_(conn,'recipe_details',options.recordId,'recipeId');//splitRecipeTable.ingredients;
      //output.subTable['recipe-table-additive'] = splitRecipeTable.additives;
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
  log_(output);
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
var separateDetailsTable_ = function(arrayOfObjects) {
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
  createNewRowObject_(rowDetails,clientInfo.settings.timezone);
  
  
  Logger.log('insert row');
  Logger.log(rowDetails.initialRowValues);
  // Create new record in sheet
  conn_(clientInfo.sheets.production).setTable(rowDetails.sheetName).createRecord(rowDetails.initialRowValues);

  return JSON.stringify(rowDetails);
};


/**
* Creates a new row in the recipe and batch spreadsheets and sets the initial values
* @param {string} idType The type of id to use (must match the client's app object: row, batch, recipe)
* @param {object} rowDetails Object containing all of the details required to populate a sheet row
* @param {object} accessObject
* @return {object} The initial row values to display
 - The initial values will be used to populate the new table row on the UI
*/
var createNewRecipeAndBatchRecords = function (accessObject,initRecipeValues) {
  const clientInfo = conn_().getStoredInfo(accessObject);
  const recipeDetails = {inputValues:initRecipeValues};
  const batchDetails = {};
  
  // Get next available record
  recipeDetails.id = getNextId(accessObject,'recipe');
  batchDetails.id = getNextId(accessObject,'batch');
  batchDetails.inputValues = {recipeId:recipeDetails.id,batchStatus:'ON HOLD'}; // Add recipe id to the batch. 
  
  // Create initial values for the new recipe row
  createNewRowObject_(recipeDetails,clientInfo.settings.timezone)
  // Create initial values for the new recipe row
  createNewRowObject_(batchDetails,clientInfo.settings.timezone)
  
  const conn = conn_(clientInfo.sheets.production);
  // Create new record in sheet
  conn.setTable('recipe').createRecord(recipeDetails.initialRowValues);
  conn.setTable('batch').createRecord(batchDetails.initialRowValues);
  
  // The alcType and shortDescription are necessary for populating the UI batchList table
  batchDetails.initialRowValues['alcType'] = recipeDetails.initialRowValues.alcType;
  batchDetails.initialRowValues['shortDescription'] = recipeDetails.initialRowValues.shortDescription;
  
  return JSON.stringify({recipe:recipeDetails.initialRowValues,batch:batchDetails.initialRowValues});
};


/**
* Adds the required values for a new record to the icoming object
* @param {object} obj The object containing the edited row values
*/
var createNewRowObject_ = function (obj,timezone) {
  const btnId = obj.btnId; // The button id determines what table is being used. Not applicable if it is a new batch, recipe, etc...
  obj.initialRowValues = {};
 
  if (btnId) { // This is for sub tables
    // Check if the object contains an ingredient table
//    if (btnId.indexOf('ingredient') > -1 || btnId.indexOf('additive') > -1 ) {
//      const type = btnId.substring(btnId.length,btnId.lastIndexOf("-")+1);
//      obj.initialRowValues.type = type; 
//    }
    const foreignKey = btnId.substring(btnId.indexOf("-"),0) + 'Id'; // The foreign key field (eg "RECIPE ID")
    obj.initialRowValues[foreignKey] = obj.loadedRecordId;
  }
  
  // Check for any initial values input by the user
  // Add any user values to the initialRowValues object
  if (obj.inputValues) {
    Object.keys(obj.inputValues).forEach(function(key) {
      obj.initialRowValues[key] = obj.inputValues[key];
    });
  }
  
  // These are mandatory fields for every table record
  obj.initialRowValues.id = obj.id; // Generated record number
  obj.initialRowValues.created = Utilities.formatDate(new Date(), timezone, "MM/dd/yyyy");
};

function getClientTimeZone_(accessObject){
  return conn_().getStoredInfo(accessObject).settings.timezone;
}