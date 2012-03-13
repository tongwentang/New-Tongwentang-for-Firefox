//==========================================================
// Code for textzoom

TongWen.useTextzoomInsteadOfFullzoom =function(){
	var bol = true;
	
	var useFullzoom = TongWen.getOptions('browser.zoom.full');	
	if (!useFullzoom){
		useFullzoom = false;
	}	
	bol = !useFullzoom;
	
	//update menuitem
	//var menuItem = document.getElementById("toggle_zoom");
	
	//if option is checked then use textzoom, if not checked it use textzoom
	//if (menuItem){
	//	bol = menuItem.getAttribute("checked");
	//}	
	return bol;
};

TongWen.getTextZoomValue = function (){
	var val = null;
	var useTextzoom = TongWen.useTextzoomInsteadOfFullzoom();	
	var markupViewer = TongWen.getMarkupDocViewer();
		
	if (useTextzoom && markupViewer.hasOwnProperty("textZoom")){
		val = markupViewer.textZoom;
	} else if(!useTextzoom && markupViewer.hasOwnProperty("fullZoom")){
		val = markupViewer.fullZoom;
	} else {
		val = markupViewer.textZoom;
	}	
	return val;
};

TongWen.applyZoomValueToRef = function (){
	try {
	// for firefox 3 update zoom pref instantly		
		if (typeof FullZoom !== 'undefined'){
		//if (FullZoom !== undefined) {
			//if ("_applySettingToPref" in FullZoom){			
			//if (Fullzoom._applySettingToPref instanceof Function){
			//if (typeof Fullzoom._applySettingToPref == 'function' ){
			if (FullZoom._applySettingToPref){
			//if (FullZoom.hasOwnProperty("_applySettingToPref")){
				FullZoom._applySettingToPref();
			}
		}
	}catch (ex){
			TongWen.dump("TongWen.applyZoomSettingToRef: error: " + ex);
	}
};

// https://developer.mozilla.org/en/Full_page_zoom
// http://mxr.mozilla.org/firefox/source/browser/base/content/browser-textZoom.js

TongWen.setTextZoomValue = function (zoomValue){	
	if (TongWen.isInValidDoc()){ return;}
	
	//var markupDocumentViewer = getBrowser().markupDocumentViewer;
	//var useFullZoom = markupDocumentViewer.fullZoom ? markupDocumentViewer.fullZoom : markupDocumentViewer.textZoom;
	
	try {		
		var markupViewer = TongWen.getMarkupDocViewer();		
		var currentZoomValue = TongWen.getTextZoomValue();
		
		if (currentZoomValue == zoomValue) { return;}
		
		var useTextzoom = TongWen.useTextzoomInsteadOfFullzoom();
		
		if (useTextzoom && markupViewer.hasOwnProperty("textZoom")){
			var oldTextZoom = markupViewer.textZoom;
			
			if (zoomValue!=1){			
				//quit if textzoom not change
				if (Math.abs(zoomValue - oldTextZoom) <= 0.01) {return;}
				markupViewer.textZoom = zoomValue;
			} else {
				markupViewer.textZoom = 1;
			}
			
			if (markupViewer.fullZoom){	
				markupViewer.fullZoom = 1;
			}
		} else if(!useTextzoom && markupViewer.hasOwnProperty("fullZoom")){
			//markupViewer.fullZoom += 0.1;
			//markupViewer.fullZoom = zoomValue;
			//zoomManager.fullZoom = zoomValue;
			//ZoomManager.zoom = zoomValue;
			//ZoomManager.zoom = Math.round(zoomValue * 100.0); 		
			markupViewer.textZoom = 1;
			markupViewer.fullZoom = zoomValue;
		} else {
			var oldTextZoom = markupViewer.textZoom;
			//quit if textzoom not change
			if (Math.abs(zoomValue - oldTextZoom) <= 0.01) {return;}
			markupViewer.textZoom = zoomValue;
		}
		
		// for firefox 3 update zoom pref instantly
		if (markupViewer.hasOwnProperty("fullZoom")){
			TongWen.applyZoomValueToRef();
		}
	}
	catch (ex){
		TongWen.dump("TongWen.setTextZoomValue: error: " + ex);
	}
};

//increase textzoom 10% per time
TongWen.textzoomEnlarge = function (){
	TongWen.setTextZoomValue(TongWen.getTextZoomValue() + 0.1);
};

//decrease textzoom 10% per time
TongWen.textzoomReduce = function (){
	TongWen.setTextZoomValue(TongWen.getTextZoomValue() - 0.1);
};

TongWen.textzoomReset = function (){
	TongWen.setTextZoomValue(1);
	
	// for firefox 3 update zoom pref instantly
	if (typeof FullZoom !== 'undefined'){
		FullZoom.reset();
	}
};

//==========================================================