TongWen.loadFilter = function () 
{
	var filter = TongWen.getOptions("tongwentang.filter.list", "");
	if (filter.length === 0) {return false;}
	
	var val = null;
	var aMap = {};
	var nodes = filter.split("\n");
	
	for (var i = 0; i < nodes.length; i++)
	{
		var ary = nodes[i].split("\t");
		aMap[ary[0]] = ary;
	}
	
	//set global variable
	TongWen.filterMap = aMap;
};

// copy from IETab (nsIeTabWatchFactory.js)
TongWen.isMatchURL = function(url, pattern)
{
	if ((!pattern) || (pattern.length === 0)) {return false;}
	var repat = pattern;
	repat = repat.replace(/\\/, "\\\\");
	repat = repat.replace(/\./g, "\\.");
	repat = repat.replace(/\?/g, "\\?");
	repat = repat.replace(/\//g, "\\/");
	repat = repat.replace(/\*/g, ".*");
	repat = "^" + repat;
	var reg = new RegExp(repat);
	var matched = (reg.test(url));
	return matched;
};

TongWen.doFilterApplyTextzoom = function(curDoc, zoomValue){
	try {
			// text zoom
			if (zoomValue != "")
			{
				//var gBrowser = document.getElementById("content");
				var targetBrowser = null;
				
				if (gBrowser.mTabbedMode)
				{
					var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(curDoc);
					if (targetBrowserIndex == -1) {return;}
					targetBrowser = gBrowser.getBrowserAtIndex(targetBrowserIndex);
				}
				else
				{
					targetBrowser = gBrowser.mCurrentBrowser;
				}

				var zval = parseInt(zoomValue) / 100;
				TongWen.setMarkupDocumentViewerTextzoom(targetBrowser.markupDocumentViewer, zval);
			}
	} catch(ex){
		TongWen.dump("AutoTrans - doFilterApplyTextzoom: " + ex);
	}
};

/*
// support  textzoom only
TongWen.setMarkupDocumentViewerTextzoom = function(markupViewer, zoomVal){
	try {
		var hasFullzoom = markupViewer.hasOwnProperty("fullZoom");		
		TongWen.dump("AutoTrans - setMarkupDocumentViewerTextzoom:  hasFullzoom: " + hasFullzoom);

		markupViewer.textZoom = zoomVal;		
		if (hasFullzoom) {
			markupViewer.fullZoom = 1;
			TongWen.applyZoomValueToRef();
		}

	} catch(ex){
		TongWen.dump("AutoTrans - setMarkupDocumentViewerTextzoom: " + ex);
	}
};
*/

// support fullzoom or textzoom
TongWen.setMarkupDocumentViewerTextzoom = function(markupViewer, zoomVal){
	try {	
		//include textzoom.js function 'TongWen.useTextzoomInsteadOfFullzoom'
		var useTextzoom = TongWen.useTextzoomInsteadOfFullzoom();				
		var haveTextzoom = markupViewer.hasOwnProperty("textZoom");
		var hasFullzoom = markupViewer.hasOwnProperty("fullZoom");
		
		TongWen.dump("AutoTrans - setMarkupDocumentViewerTextzoom:  hasFullzoom: " + hasFullzoom);
		
		if (useTextzoom && haveTextzoom){
			markupViewer.textZoom = zoomVal;
			if (hasFullzoom) {
				markupViewer.fullZoom = 1;
			}
		} else if(!useTextzoom && hasFullzoom){
			markupViewer.textZoom = 1;
			markupViewer.fullZoom = zoomVal;
		} else {
			markupViewer.textZoom = zoomVal;
		}
		
		if (hasFullzoom) {
			TongWen.applyZoomValueToRef();
		}
	} catch(ex){
		TongWen.dump("AutoTrans - setMarkupDocumentViewerTextzoom: " + ex);
	}
};

//load every document included iframe or frame and test it url
TongWen.doFilter = function(event) {
	if (TongWen.filterEnable)
	{
		try {
			TongWen.dump("AutoTrans - doFilter: Enter");			
			//TongWen.dump("AutoTrans - event.originalTarget: " + event.originalTarget);
			
			if (event.originalTarget instanceof HTMLDocument)
			{
				var curDoc = (event.originalTarget.document)?(event.originalTarget.document):event.originalTarget;
				//var curDoc = event.originalTarget;
				var strCurrentURI = curDoc.URL;
				//var strCurrentURI = curDoc.documentURI;
				
				if (strCurrentURI == 'about:blank') {return true;}
				
				//don't handle frames or iframe, just handle top document only.
				if (curDoc.ownerDocument!= null) {return true;}
				//if (curDoc.defaultView != curDoc.defaultView.top){return true;}
				
				var strPrePath1 = TongWen.getBaseURL(strCurrentURI);
				var strPrePath2 = TongWen.getBaseURL(strCurrentURI) + '\/';
				var strPrePath3 = TongWen.getParentFolder(strCurrentURI);
								
				var isCurrentUrlMatch = false;				
				var matchFilterUrl = '';
				var matchFilterFlag = '';
				var matchFilterTextzoom = '';
								
				var filterMap = TongWen.filterMap;
				
				if (strCurrentURI in filterMap)	{
					isCurrentUrlMatch = true;
					matchFilterUrl = strCurrentURI;
					matchFilterFlag = filterMap[strCurrentURI][1];
					matchFilterTextzoom = filterMap[strCurrentURI][2];
				} else if (strPrePath3 in filterMap){
					isCurrentUrlMatch = true;					
					matchFilterUrl = strPrePath3;
					matchFilterFlag = filterMap[strPrePath3][1];
					matchFilterTextzoom = filterMap[strPrePath3][2];
				}else if (strPrePath2 in filterMap){
					isCurrentUrlMatch = true;					
					matchFilterUrl = strPrePath2;
					matchFilterFlag = filterMap[strPrePath2][1];
					matchFilterTextzoom = filterMap[strPrePath2][2];
				} else if (strPrePath1 in filterMap){
					isCurrentUrlMatch = true;					
					matchFilterUrl = strPrePath1;
					matchFilterFlag = filterMap[strPrePath1][1];
					matchFilterTextzoom = filterMap[strPrePath1][2];
				}

				/*
				TongWen.dump("AutoTrans:  \t doFilter: " + "\n" + 
							"title:\t" + curDoc.title + "\n" +
							"URL:\t" + strCurrentURI + "\n" + 
							"matchFilterUrl:\t" + matchFilterUrl + "\n" + 
							"matchFilterFlag:\t" + matchFilterFlag);
				*/
				
				if (isCurrentUrlMatch){
					TongWen.dump("AutoTrans - filter: URL or domain is Match [" + matchFilterUrl + " - " + matchFilterFlag + " - " + matchFilterTextzoom + "]");
					TongWen.inFilter = true;
						
					switch (matchFilterFlag) {
						case "simp": TongWen.doFrames(curDoc, TongWen.SIMFLAG, 0); break;
						case "trad": TongWen.doFrames(curDoc, TongWen.TRAFLAG, 0); break;
						default:
					}
					
					TongWen.setZhFlag(curDoc, matchFilterFlag);
						
					//set document markupDocumentViewer textzoom
					TongWen.doFilterApplyTextzoom(curDoc, matchFilterTextzoom);
						
					TongWen.inFilter = false;
					return true;
				}
				//==============================================================================================
				
				
				//==============================================================================================
				//loop thought filter List inclube regular expression rules
				for(var key in TongWen.filterMap)
				{
				
					if (TongWen.isMatchURL(strCurrentURI, key))					
					{
						var filterURL = key;
						var filterFlag = TongWen.filterMap[key][1];
						var filterTextZoom = TongWen.filterMap[key][2]; 
						
						TongWen.dump("AutoTrans - filter: URL Match :\n" + filterURL + " \nflag: " + filterFlag + "\nTextzoom: " + filterTextZoom);
						TongWen.inFilter = true;
						// convert
						switch (filterFlag) {
							case "simp": TongWen.doFrames(curDoc, TongWen.SIMFLAG, 0); break;
							case "trad": TongWen.doFrames(curDoc, TongWen.TRAFLAG, 0); break;
							//case "simp": TongWen.doADoc(curDoc, TongWen.SIMFLAG, 0); break;		//remark it
							//case "trad": TongWen.doADoc(curDoc, TongWen.TRAFLAG, 0); break;
							default:
						}
						
						// text zoom
						if (filterTextZoom != "")
						{						
							var zval2 = parseInt(filterTextZoom) / 100;
							TongWen.doFilterApplyTextzoom(curDoc, zval2);
						}
						
						TongWen.inFilter = false;
						return true;
					}
				}
				//==============================================================================================
			}
		}
		catch (ex)
		{
			TongWen.dump("AutoTrans - doFilter: " + ex);
		}
	}
	return false;
};