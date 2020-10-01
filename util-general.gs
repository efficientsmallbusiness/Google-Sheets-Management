function throwError_(string) {
 throw new Error(string); 
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


var removeNull_ = function (array){
  // Replace null values with a blank string
  for (i = 0; i < array.length;i++){
    !array[i] ? array[i]='' : null;
  }
  return array;
}