
// Converts column header and specified row values to object key value pair
function getDataFromSheet_(sheet,columnHeadersRowIndex) {
  return getRowsData_.fromArray(sheet.getDataRange().getValues(),columnHeadersRowIndex).object;
}



function getDataFromArray_(array) {
  return getRowsData_.fromArray(array).object;
}

function testGetData(){
//  var myArray = [['col1','col2','col3'],['val1','val2','val3']];
//  var newArr = getRowsData_.fromArray(myArray).object;
//  Logger.log(newArr); 

}



/**
* SOURCE: https://docs.google.com/document/d/1tIGrDRvYBp4dExzcIS6uIevLlTpGfctLtu5LP5dYn1Y/edit
* For every row of data in data, generates an object that contains the data. Names of
* object fields are defined in keys.
* Methods:
*   - fromArray: arguments(JavaScript 2d array, headerIndex)
* @return {object} 
*         object: array as an object
          valuesArray: Array values without the header row
          normalizedHeader: Header with normalized values
          header: header with unchanged values
*/
var getRowsData_ = (function(main) {

  
  /**
  * Converts a 2D array to an object
  * The top row is used as the object key
  * @param {array} array The array to convert
  * @return {object} 
  */
  main.fromArray = function (array,columnHeadersRowIndex){
    if (checkArrayLength_(array)) return {};
    var headersIndex = columnHeadersRowIndex || 1;
    return createReturnObject_(array.slice(headersIndex),array[headersIndex-1]);
  };
  
  
  function createReturnObject_(arr,header){
    var normalizedHeader = normalizeHeaders_(header);
    return {
      object:getObjects_(arr,normalizedHeader ),
      valuesArray:arr,
      normalizedHeader:normalizedHeader,
      plainHeader:header
    };
  };
  
  
  
  function checkArrayLength_(array){
    return array.length < 2;
  };
  
  
  
  function getObjects_(data, keys) {
    var objects = [];
    for (var i = 0; i < data.length; ++i) {
      var object = {};
      var hasData = false;
      for (var j = 0; j < data[i].length; ++j) {
        var cellData = data[i][j];
        if (isCellEmpty_(cellData)) {
          object[keys[j]] = '';
          continue;
        }
        object[keys[j]] = cellData;
        hasData = true;
      }
      if (hasData) {
        objects.push(object);
      }
    }
    
    return objects;
  };
  
  // Returns an Array of normalized Strings.
  // Empty Strings are returned for all Strings that could not be successfully normalized.
  // Arguments:
  //   - headers: Array of Strings to normalize
  function normalizeHeaders_(headers) {
    var keys = [];
    for (var i = 0; i < headers.length; ++i) {
      keys.push(normalizeHeader_(headers[i]));
    }
    return keys;
  };
  
  // Normalizes a string, by removing all alphanumeric characters and using mixed case
  // to separate words. The output will always start with a lower case letter.
  // This function is designed to produce JavaScript object property names.
  // Arguments:
  //   - header: string to normalize
  // Examples:
  //   "First Name" -> "firstName"
  //   "Market Cap (millions) -> "marketCapMillions
  //   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"  
  function normalizeHeader_(header) {
    var key = "";
    var upperCase = false;
    for (var i = 0; i < header.length; ++i) {
      var letter = header[i];
      if (letter == " " && key.length > 0) {
        upperCase = true;
        continue;
      }
      if (!isAlnum_(letter)) {
        continue;
      }
      if (key.length == 0 && isDigit_(letter)) {
        continue; // first character must be a letter
      }
      if (upperCase) {
        upperCase = false;
        key += letter.toUpperCase();
      } else {
        key += letter.toLowerCase();
      }
    }
    return key;
  };
  
  // Returns true if the cell where cellData was read from is empty.
  // Arguments:
  //   - cellData: string
  function isCellEmpty_(cellData) {
    return typeof(cellData) == "string" && cellData == "";
  };
  
  // Returns true if the character char is alphabetical, false otherwise.
  function isAlnum_(char) {
    return char >= 'A' && char <= 'Z' ||
      char >= 'a' && char <= 'z' ||
        isDigit_(char);
  };
  
  // Returns true if the character char is a digit, false otherwise.
  function isDigit_(char) {
    return char >= '0' && char <= '9';
  };
  
  return main;
}(getRowsData_ || {}));
