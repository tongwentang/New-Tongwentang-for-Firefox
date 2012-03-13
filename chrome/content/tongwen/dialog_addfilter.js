var tongwenStrRes = null;
function getTopWin(){
   var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
                       .getService(Components.interfaces.nsIWindowMediator);
   return windowManager.getMostRecentWindow("navigator:browser"); 
}


var filterMap = {};

function loadFilter(){
	var filter = TongWen.getOptions("tongwentang.filter.list", "");	
	if (filter.length == 0){
		return;
	}
	
	var val = null;
	var aMap = {};
	var nodes = filter.split("\n");
	
	for (var i = 0; i < nodes.length; i++)
	{
		var ary = nodes[i].split("\t");
		aMap[ary[0]] = ary;
	}
	
	//set global variable
	filterMap = aMap;
}

function addFilter(filterURL, filterZhFlag, filterZoomPercent){
	if (filterURL.length == 0){return;}
	
	filterMap[filterURL] = [filterURL, filterZhFlag, filterZoomPercent];
	
	var filterAry = [];
	
	//alert('filterMap:\n' + filterMap.toSource());
	
	for(var key in filterMap){
		var ary = [];
		ary = filterMap[key];		
		filterAry[filterAry.length] = ary.join("\t");
	}
	
	TongWen.setOptions("tongwentang.filter.list", filterAry.join('\n'));
	
	TongWen.filterEnable = true;
	TongWen.setOptions("tongwentang.filter.enable", TongWen.filterEnable);	
}

function useTextzoomInsteadOfFullzoom (){
	var bol = true;
	
	var useFullzoom = TongWen.getOptions('browser.zoom.full');	
	if (!useFullzoom) {
		useFullzoom = false;
	}	
	bol = !useFullzoom;	
	return bol;
}

function getTextZoomValue(){
	var val = null;
	var useTextzoom = useTextzoomInsteadOfFullzoom();
	//var opener = getTopWin();
	var markupViewer = opener.getMarkupDocumentViewer();
		
	if (useTextzoom && markupViewer.hasOwnProperty("textZoom")){
		val = markupViewer.textZoom;
	} else if(!useTextzoom && markupViewer.hasOwnProperty("fullZoom")){
		val = markupViewer.fullZoom;
	} else {
		val = markupViewer.textZoom;
	}	
	return val;
};

function setCurrentZoomLevel(){
	var obj = document.getElementById("filterZoomPercent");
	try {
		var opener = getTopWin();
		var current_textZoom = Math.round(getTextZoomValue() * 100);
		
		//if current textzoom is not change
		if (current_textZoom == 100){
			current_textZoom = "";
		}		

		obj.value = current_textZoom;
	} catch(ex) {
		TongWen.dump("setCurrentZoomLevel:   error " + ex);
	}	
}

function clearZoomValue(){
	var obj = document.getElementById("filterZoomPercent");
		obj.value = "";
}

function getBaseURL(inURL) {		
	var isfileURL = (inURL.indexOf("file:\/\/\/") != -1);		
	if (!isfileURL){
		var strURL = inURL.split("\/");
			
		if (strURL.length >= 2){
			inURL = strURL[0] + "\/" + strURL[1] +"\/" + strURL[2] + '\/';
		}
	}	
	return inURL;
}

function getParentFolder(filepath){
	var tmpAry = filepath.split("\/");
	tmpAry.pop();	
	return (tmpAry.join("\/")) + "\/";
}


function isShowPopZoom(){
	return true;
}

function createMenuItem(aLabel) {
  const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  var item = document.createElementNS(XUL_NS, "menuitem"); // create a new XUL menuitem
  item.setAttribute("label", aLabel);
  return item;
}

function addNewMenuItem(newItemLabelTxt){
	var popup = document.getElementById("menupop_filter"); // a <menupopup> element
	var newMenuItem = createMenuItem(newItemLabelTxt);
	popup.appendChild(newMenuItem);
}


function init() {	
	try {
		//tongwenStrRes = document.getElementById("strRes");
		loadFilter();
		
		var opener = getTopWin();
		var	fullURL = opener.content.document.documentURI;				//address bar url
				
		var current_url = getBaseURL(fullURL);
		var current_rootDir = getParentFolder(fullURL);
		
		//var	focusedDocURL = opener.document.commandDispatcher.focusedWindow.document.URL;			//focused windows url
		//var current_url2 = getBaseURL(focusedDocURL);
		
		if (current_url == "") {return;}	
		
		//add menu item		
		var addUrlMap = {};
		addUrlMap[current_url] = 1;
		addUrlMap[current_rootDir] = 1;
		addUrlMap[fullURL] = 1;
		//addUrlMap[current_url2] = 1;
		
		for(var key in addUrlMap){
			addNewMenuItem(key);
		}		

		var convflag = "";
		
		//var charset = opener.content.document.characterSet.toLowerCase();
		//var convflag = "";
			
		//if ((charset in TongWen.zh_encodes["tw"] || charset in TongWen.zh_encodes["hk"])) {
		//	convflag = "simp";
		//} else if (charset in TongWen.zh_encodes["cn"]) {
		//	convflag = "trad";
		//}
	
		var current_textZoom = 100;
		
		if (window.arguments.length >0){
			current_textZoom = window.arguments[0];
		} else {
			current_textZoom = Math.round(getTextZoomValue() * 100);
		}
		
		if (current_url in filterMap){
			convflag = filterMap[current_url][1];
			current_textZoom = filterMap[current_url][2];
		}
		
		//if current textzoom is not change
		if (current_textZoom == 100){
			current_textZoom = "";
		}		
		
		TongWen.dump("dialog init:   textzoom " + current_textZoom);
		
		var obj = null;
		obj = document.getElementById("filterURL");
		obj.value = current_url;
		
		obj = document.getElementById("filterZhFlag");
		obj.value = convflag;
		
		obj = document.getElementById("filterZoomPercent");
		
		//alert(obj);
		
		//obj.value = current_textZoom;
		obj.value = current_textZoom;
				
				
	} catch(ex) {
		TongWen.dump("dialog init:   error " + ex);
	}
}

function accept() {
	try{
		var filterURL = document.getElementById("filterURL").value;
		var filterZhFlag = document.getElementById("filterZhFlag").value;
		var filterZoomPercent = document.getElementById("filterZoomPercent").value;
		
		filterZoomPercent = filterZoomPercent.replace(/\s/g, "");
		
		addFilter(filterURL, filterZhFlag, filterZoomPercent)
		
		return true;
	} catch(ex) {
		TongWen.dump("dialog: settings accept: Error:  " + ex);
		return true;
	}
}