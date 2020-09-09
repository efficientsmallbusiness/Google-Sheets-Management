var USER_OBJECT;

/*
** Allows the doGet function to dynamically select which page is loaded
** based on the parameters passed in the URL
*/
var ROUTE = {};
ROUTE.path = function(route,callback) {
  ROUTE[route] = callback;
}

var devurl = 'https://script.google.com/macros/s/AKfycbzI8vYN2SQaj2XeNrtVpYOWtMfhnRtWsjlda0IfgZQ/dev';



/**
* renders the appropriate page
*/
var render_ = function(page,recordId) {
  var html = HtmlService.createTemplateFromFile('index');
  html.payload = {};
  html.payload.initPage = page;
  html.payload.recordId = recordId;
  html.payload.user = USER_OBJECT;
  html.payload = JSON.stringify(html.payload);
  return html.evaluate()
  .addMetaTag('viewport', 'width=device-width, initial-scale=1')
  .setTitle('Production - Meadery Solutions')
  .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
* Function to allow html page to load script content
* If isPageLoad is passed to the function, then return an object with string html, js, and css files.
* @param {string} fileName The page files to retrieve
* @param {boolean} isPageLoad [optional] Determines if the fileObject or individual file should be returned
* @param {recordId} recordId [optional] The record details to load once the page has been loaded
* @return {HTML string}
*/
function include(page,isPageLoad,recordId) {
  if (!page) return;
  const fileObject = {};
  fileObject.fileName = page;
  
  /**
  * Gets script file. If a file doesn't exist, an error is thrown. Errors are caught and ignored
  * @return {HTML string}
  */
  var getScriptFile_ = function(fileName,suffix) {
    const file = fileName + (suffix ? "-"+suffix : '');
    let htmlString = '';
    try {htmlString = HtmlService.createHtmlOutputFromFile(file).getContent();}catch(e){};
    return htmlString;
  }
  
  // If this is a page load, then return the HTML strings of the page's files
  if (isPageLoad) {
    fileObject.fileData = {
      html: getScriptFile_(page,'html'),
      js: getScriptFile_(page,'js'),
      css: getScriptFile_(page,'css')
    };
    fileObject.recordId = recordId;
    return fileObject;
  }
  // If this isn't a page load, return the individual file
  return getScriptFile_(page);
}


/**
* System required function to handle initial page load
*/
const doGet = function (e = {}){
  const param = e.parameter;
  USER_OBJECT = getUser_().isValid();
  // If user isn't valid, load the login page
  if (!USER_OBJECT) return render_('login');
  // If user is valid and has passed a page parameter, load that page (option: load page w/ id)
  if (param.p) {return render_(param.p,param.r);}
  // If there isn't a page parameter passed, load the home screen
  return render_('home');
}