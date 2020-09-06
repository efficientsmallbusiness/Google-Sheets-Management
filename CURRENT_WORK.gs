/*
Continue working on User_.prototype.isValid

Create a new client if there isn't a client object in the script properties
*/

/*
CREATING A NEW CLIENT

dbConn_.prototype.getClientInfo
This should also create a new userObject when creating the new clientObject

Test this function



User_.prototype.getDetails 
This should cache the user's details for 1 hour

*/



function tt(){
  const spreadsheetId = '18GrM5sSx3BsA_4lOT90z17i0OJMvktqDm6-ToV_5des';
  var sheetId = '0';
  var url = "https://docs.google.com/spreadsheets/d/" + spreadsheetId +
    //"/gviz/tq?tqx=out:json"+ // Returns a JSON object
    // "/tqx=out:html"+ // Returns HTML table
    //"/range={A1:B}"+
    //"/gviz/tq?tqx=out:csv"+
    '&gid=' + sheetId + // Specify what tab/sheet - default is sheet 0
      '&headers=0' + // This line prevents sheets with multiple header rows from combining row text
        "&access_token=" + 
          ScriptApp.getOAuthToken();  
  
  url = 'https://spreadsheets1.google.com/spreadsheet/tq?tqx=out:html&key='+spreadsheetId +"&access_token=" + ScriptApp.getOAuthToken();  
  var res = UrlFetchApp.fetch(url);
  Logger.log(res.getContentText());
  
  return;
  var request_options = {
    "headers": {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
      "contentType": "application/json"
    }
  };
  
  // json resource: https://developers.google.com/chart/interactive/docs/querylanguage#setting-the-query-from-javascript
  var key = 1;
  var query = encodeURIComponent("SELECT * WHERE B=" + key + "   ");
  //    var d = UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/' + spreadsheetId
  //        + '/gviz/tq?tqx=out:json&tq=' + query).getContentText();
  // for private files add the access token as option
  var url = 'https://docs.google.com/spreadsheets/d/' + 
    spreadsheetId + 
      '/gviz/tq?tqx=out:json&tq=' + query;
  var d = UrlFetchApp.fetch(url, request_options).getContentText();
  
  
  Logger.log(d);
  // parse result
  d = d.replace("/*O_o*/", "");
  d = d.replace("google.visualization.Query.setResponse(", "");
  d = d.substr(0, d.length - 2);
  d = JSON.parse(d);
  // I did not know better how to parse the result ... /*O_o*/ has to be removed...
  if (d.table.rows.length == 0)
    ret = 'not found';
  else
    ret = d.table.rows[0].c[0].v;
  Logger.log(ret);
  
  return ret;
}