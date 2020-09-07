var DEFAULT_PAGE = 'recipe';

var PAGE_TITLE = 'Production - Meadery Solutions';


var devurl = 'https://script.google.com/macros/s/AKfycbzI8vYN2SQaj2XeNrtVpYOWtMfhnRtWsjlda0IfgZQ/dev';




const doGet = function (e){

  var user = getUser_().isValid();

  if (!user) return loadLogin_();
  
  return loadHome_();
      var param = e.parameter;
    
      // --- Page routing
      ROUTE.path('batchList',loadBatchList_);
      if (ROUTE[param.p]) {
        return ROUTE[param.p]();
      }
  
      return RENDER('index','Production - Meadery Solutions',{page:DEFAULT_PAGE});
 
  
  /*
  ** If there isn't a parameter or if the parameter doesn't exist
  ** default to index
  */
  return RENDER('index','Production - Meadery Solutions',{page:'login'});
}




/*
** Allows the doGet function to dynamically select which page is loaded
** based on the parameters passed in the URL
*/
var ROUTE = {};
ROUTE.path = function(route,callback) {
  ROUTE[route] = callback;
}






/*
** Renders the appropriate page
*/
function RENDER(title,argObj) {
  var html = HtmlService.createTemplateFromFile('index');
  if (argObj) {
    var keys = Object.keys(argObj);
    keys.forEach(function(key){
      html[key] = argObj[key];
    })
  }
  return html.evaluate()
  .addMetaTag('viewport', 'width=device-width, initial-scale=1')
  .setTitle(title)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}



/*
** Function to allow html page to load script content
** If isPageLoad is passed to the function, then return an object with html and js pages.
*/
function include(fileName,isPageLoad,recordId) {
  if (!fileName) return;
  
  var jsContent = '';
  var cssContent = '';
  var fileObject = {};
  fileObject.fileName = fileName;
  
  if (isPageLoad) {
    // An error will occur if either of the javascript and css files don't exist.
    try{jsContent = HtmlService.createHtmlOutputFromFile(fileName+"-js").getContent();} catch(e){}
    try{cssContent = HtmlService.createHtmlOutputFromFile(fileName+"-css").getContent();} catch(e){}
    fileObject.fileData = {
      html: HtmlService.createHtmlOutputFromFile(fileName+"-html").getContent(),
      js: jsContent,
      css: cssContent,
      id: recordId
    };
    return fileObject;
  }
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

function loadLogin_() {
  var argObj = {page:'login'};
  return RENDER(PAGE_TITLE,argObj);
}

function loadBatchList_() {
  var argObj = {page:'batchList'};
  return RENDER(PAGE_TITLE,argObj);
}

function loadHome_() {
  var argObj = {page:'home'};
  return RENDER(PAGE_TITLE,argObj);
}
