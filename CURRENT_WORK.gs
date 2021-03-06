/*
Recipe fields should be editable, but if they are changed
The user should be prompted to "convert to recipe" (create a new recipe from the current config)
otherwise notify the user that the recipe will be updated and the cola and labels may need resubmitted
Have an "update recipe" and "convert to recipe" buttons


New Batch (from recipe - select recipe to load)
- This needs more work
- The table_RECIPE_DETAILS needs to be pulled when a new batch is created
- I need to figure out the best way to do this
New Batch (new recipe - require alc type, short description, status, created, ID)


- Show loading bar when signing in
- Add new users from the settings page
  This should add the new email to the company folder as an editor. 
  Add a record to the user table 
  And send a welcome email
- If user validation ever returns null, log the user out

- When a new batch is created, prompt the user to select "from recipe" or "create new"
  If "create new", make them enter a brief description [required], optionally a name, type of alc.
  Then create a new recipe from those details, use default values if none exist
  
  Recipe list page
  - Create new recipe button
  
  Recipe details page
  - Create new recipe button and a "back to recipes list" button
  
  COLOR PALETTE GENERATOR
  https://coolors.co/897c79-ffeaee-13c4a3-083d77-d9bbf9
*/

/*
NOTES:
Everytime a user logs in or refreshes the page, their user properties are updated
So if their name is changed in the system, they will need to refresh their browser for changes to take effect.

When adding a new table to a page, you must make sure the table details are added to the "getPageData" function

Load specific record using url parameters
?p=batchDetail&r=123B // loads batch # 123B
?p=recipeDetail&r=54R // loads recipe # 54R
?p=recipeDetail // loads a blank recipe page
?p=recipeList // loads the recipe lists

ADDING NEW INPUT FIELDS
- The input element ID must be the normalized version of the associated column title
  Examples: 
    The input field saving to the column "INITIAL GALLONS 1" would be "<input id="initialGallons1">"
    The input fields saving to "1 UNIQUE-ITEM" would be "<input id="uniqueItem">" (because a normalized name cannot lead with a number and characters are omitted)
- Input fields that should be saved to a specific record must include the data attribute data-saveTo="[SHEET NAME]" without the "table_" prefix.
  Example: The input "<input id="myInput" data-saveTo="batch">" would save to the "table_BATCH" spreadsheet tab

ADDING NEW TABLES
- The table tag and the "add" button must include the data attribute "data-saveTableTo="[SHEET NAME]"" 
  EXAMPLE: The following would save to the sheet "table_RECIPE_DETAILS": <table data-saveTableTo="recipe_details"> and <button data-saveTableTo="recipe_details">ADD</button>
*/

function testingUrlFetchApp(){
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