
// Converts column header and specified row values to object key value pair
function getDataFromSheet_(sheet,columnHeadersRowIndex) {
  return getRowsData_.fromArray(sheet.getDataRange().getValues(),columnHeadersRowIndex).object;
}



function getDataFromArray_(array) {
  return getRowsData_.fromArray(array).object;
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

  // Returns true if the cell where cellData was read from is empty.
  // Arguments:
  //   - cellData: string
  var isCellEmpty_ = function(cellData) {
    return typeof(cellData) == "string" && cellData == "";
  };
  
  // Returns true if the character char is alphabetical, false otherwise.
  var isAlnum_ = function(char) {
    return char >= 'A' && char <= 'Z' ||
      char >= 'a' && char <= 'z' ||
        isDigit_(char);
  };
  
  // Returns true if the character char is a digit, false otherwise.
  var isDigit_ = function(char) {
    return char >= '0' && char <= '9';
  };
  
 
  
  
  var createReturnObject_ = function(arr,header){
    const normalizedHeader = normalizeHeaders_(header);
    let arrayOfObjects;
    if (arr.length >= 1) {
     arrayOfObjects = getObjects_(arr,normalizedHeader ) 
    };
    
    return {
      object: arrayOfObjects || [],
      valuesArray:arr,
      normalizedHeader:normalizedHeader,
      plainHeader:header
    };
  };
  
  
  
  var getObjects_ = function(data, keys) {
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
  var normalizeHeaders_ = function (headers) {
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
  var normalizeHeader_ = function(header) {
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
  
   /**
  * Converts a 2D array to an object
  * The top row is used as the object key
  * @param {array} array The array to convert
  * @return {object} 
  */
  main.fromArray = function (array,columnHeadersRowIndex){
    var headersIndex = columnHeadersRowIndex || 1;
    return createReturnObject_(array.slice(headersIndex),array[headersIndex-1]);
  };
  
  
  return main;
}(getRowsData_ || {}));