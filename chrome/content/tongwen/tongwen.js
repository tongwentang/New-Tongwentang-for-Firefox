/**
 * Hashao Product.
 * passerby rewrite
 * Convert a web page between Simplified Chinese and Traditional Chinese. 
 **/

TongWen.zhMaxPhraseLength   = 15;
TongWen.autoConvert			= "off";
TongWen.useInsideTable      = true;
TongWen.useOutsideTable     = false;
TongWen.useRedefineTable     = false;
TongWen.out_t2s_phrase      = {};
TongWen.out_s2t_phrase      = {};
TongWen.redefine_phrase_s2t = "";
TongWen.redefine_phrase_t2s = "";
TongWen.useAdvanceSetting   = false;
TongWen.menuIcon            = true;
TongWen.textZoomDefValue    = 1;
TongWen.textZoomEnable      = false;
TongWen.textZoomPercent     = 100;
TongWen.textZoomValue       = TongWen.textZoomPercent / 100;
TongWen.textZoomAutoDefault = false;
TongWen.textZoomStandalone  = false;

TongWen.filterEnable        = false;
TongWen.filterMap           = {};
TongWen.inFilter            = false; // only for text zoom

TongWen.ZHENCODINGONLY      = true;
TongWen.OPPCHARSETONLY      = true;
TongWen.enableUTF8AutoConvert = true;

TongWen.loadSettingFrom     = "script";
TongWen.isLoadedRedefineTable = false;

TongWen.isInitialized = false;
TongWen.observerIsAdded = false;

TongWen.hotKey_PageTra = "";
TongWen.hotKey_PageSim = "";
TongWen.hotKey_PageAuto = "";

TongWen.isInitTool = false;

TongWen.enforceFont_enable = false;
TongWen.enforceFont_trad = "PMingLiU,MingLiU";		//PMingLiU,MingLiU,新細明體,細明體
TongWen.enforceFont_simp = "MS Song, SimSun";		//MS Song; 宋体; SimSun

TongWen.s_2_t_PreCount = {};
TongWen.t_2_s_PreCount = {};

TongWen.disableTransInputTextarea = true;

/**
 * Set the tongwen flag of a Doc.
 * @param object curDoc : current Doc
 * @return void
 **/
TongWen.setZhFlag = function (curDoc, zhflag) {
	curDoc.documentElement.setAttribute("zhtongwen", zhflag);
};

/**
 * Get the tongwen flag of a root node.
 * @param object curDoc : current Doc
 * @return string zhflag
 **/
TongWen.getZhFlag = function (curDoc) {
	var zhflag = null;
	try {
		// Attach a zhongwen attribute to the root so we can switch zh styles.
		zhflag = curDoc.documentElement.getAttribute("zhtongwen");
	} catch(ex) {
		TongWen.dump("getZhFlag " + ex + ": " + "curDoc");
	}
	return zhflag;
};

/**
 * Guess the tongwen flag of a Doc.
 * @param object curDoc : current Doc
 * @return string zhflag
 **/
TongWen.guessZhFlag = function (curDoc) {
	var zhflag = TongWen.getZhFlag(curDoc);
	
	if (!zhflag){
		zhflag = TongWen.getHtmlLang(curDoc);
	}
	
	if (!zhflag){
		var charset = curDoc.characterSet.toLowerCase();
		
		var unicode_charset = {"utf-8":1, "utf-7":1};
		
		if ((charset in unicode_charset)) {
			zhflag = TongWen.guessZhFlagByHtmlElement(curDoc);
		} else {
			zhflag = (charset in TongWen.zh_encodes["tw"] || charset in TongWen.zh_encodes["hk"]) ? TongWen.TRAFLAG : TongWen.SIMFLAG;	
		}
		
		// reset to default text zoom
		//if (TongWen.textZoomAutoDefault)
		//	curDoc.defaultView.addEventListener("unload", tongwen.textZoomDefValue, false);
	}
	return zhflag;
};

/**
get html lang attribute, if not set, return null;
 return string zhflag
 **/
 
TongWen.getHtmlLang = function (curDoc){	
	var lang = curDoc.documentElement.getAttribute("lang");
	
	if (typeof lang == "string"){
		lang = lang.toLowerCase();
	}
	
	var zhflag = null;
	
	switch (lang){
		case "zh-tw":
			zhflag = TongWen.TRAFLAG;
			break;
		case "zh-hk":
			zhflag = TongWen.TRAFLAG;
			break;
		case "zh-cn":
			zhflag = TongWen.SIMFLAG;
			break;
		case "zh":
			zhflag = null;		//default lang;
			break;
		//case null:
		//	zhflag = null;
		//	break;
		default:
	}
	
	return zhflag;
};

TongWen.isStringContainSimpChar = function (str){	
	var isSimp = false;
	var simpZhmap = TongWen.s_2_t;
	
	for(var i=0;i< str.length;i++){
		//if (str[i] in simpZhmap){
		if (str.charAt(i) in simpZhmap){
			isSimp = true;
			break;
		}		
	}	
	return isSimp;
};

TongWen.isDocTitleContainSimpChar = function (curDoc){	
	return TongWen.isStringContainSimpChar(curDoc.title);
};

TongWen.isDocMetaDescContainSimpChar = function (curDoc){
	var xpathExp = '//META[@name="description"]';
	var allElements = curDoc.evaluate(xpathExp, curDoc,	null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,	null);
		
	var allElements_snapshotLength = allElements.snapshotLength;
	var thisElement=null;

	if (allElements_snapshotLength >0){
		thisElement = allElements.snapshotItem(0);		// test first META tag description only		
		return TongWen.isStringContainSimpChar(thisElement.content);
	}
	
	return false;
}

TongWen.guessZhFlagByHtmlElement = function (curDoc){
	//if doc.title or html meta description contain simplified character
	if (TongWen.isDocTitleContainSimpChar(curDoc) || TongWen.isDocMetaDescContainSimpChar(curDoc)){
		return TongWen.SIMFLAG;
	}	
	return TongWen.TRAFLAG;
};

TongWen.getMarkupDocViewer = function (){
	return getBrowser().selectedBrowser.markupDocumentViewer;
	//return getBrowser().mCurrentBrowser.markupDocumentViewer;
};

/* Yes, get the currently focused document. */
TongWen.getFocusedDoc = function (doc) {
	return getMarkupDocumentViewer().DOMDocument;
};

TongWen.string_to_map = function(strPhrase){
	var tmpAry = strPhrase.split("\n");
	var val = [];
	var tmpObj = {};
	
	if (strPhrase.length==0){return tmpObj;}
		
	for(var i=0;i < tmpAry.length;i++){
		val = tmpAry[i].split("\t");
		tmpObj[val[0]]=val[1];
	}
	return tmpObj;
};

TongWen.loadRedefineTable = function (){
	if  (!TongWen.useRedefineTable) {return;}	
	TongWen.dump("loadRedefineTable: Enter");
	
	try {
		var pref_s2t = TongWen.redefine_phrase_s2t;
		var pref_t2s = TongWen.redefine_phrase_t2s;
		
		var newPhrase_s2t = TongWen.string_to_map(pref_s2t);
		TongWen.updateOrginalPhraseTable(newPhrase_s2t, TongWen.TRAFLAG);
		
		var newPhrase_t2s = TongWen.string_to_map(pref_t2s);
		TongWen.updateOrginalPhraseTable(newPhrase_t2s, TongWen.SIMFLAG);
		
		if (pref_s2t.length==0){TongWen.dump("loadRedefineTable: S2T table is empty.");}
		if (pref_t2s.length==0){TongWen.dump("loadRedefineTable: T2S table is empty.");}
				
		//TongWen.dump("loadDedefineTable: S2T table  \n" +pref_s2t);	// for debug use only
		//TongWen.dump("loadDedefineTable: T2S table  \n" + pref_t2s);	// for debug use only
	} catch(ex) {
		TongWen.dump("loadRedefineTable: ex" + "\n" + ex);
	}
}

TongWen.updateOrginalPhraseTable = function (map_new_phrase, zhflag){
	var zhmap = null; // chinese simplified<->traditional character map.
	var zhtab = null;
	var zhnew = map_new_phrase;

	if (zhflag == TongWen.SIMFLAG) {
		zhmap = TongWen.t_2_s;
		zhtab = TongWen.t_2_s_phrase;
	} else if (zhflag == TongWen.TRAFLAG) {
		zhmap = TongWen.s_2_t;
		zhtab = TongWen.s_2_t_phrase;
	}
	
	for(var key in zhnew){
		if (key.length == 1){
			zhmap[key] = zhnew[key];
		} else if(key.length == 2){
			zhtab[key] = zhnew[key];
		} else if(key.length > 2){
			var prefix = key.substr(0,2);
			
			if (!(prefix in zhnew)){
				zhtab[prefix] = prefix;
			}
			
			zhtab[key] = zhnew[key];
		}
	}
};

TongWen.loadJSfile = function(filepath){
	// ref example1: http://blog.hyperstruct.net/index.php?entry=entry060228-142706
	// ref example2: http://weblogs.mozillazine.org/weirdal/archives/008101.html
	
	// loadSubScript first argument for load js file path, for secuity reason must be local file path
	// loadSubScript second argument for load in specific js object, otherwise scope is global
	var start_time = null;
	var count_time = null;
	
	// first  restore original table by loading script from local file
	const subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
	TongWen.dump("loadJSfile filepath:" + filepath);
	
	start_time = new Date().getTime();	
	//try {
		subScriptLoader.loadSubScript(filepath);
	//} catch(ex) {
	//	TongWen.dump("loadJSfile error: \t" + ex);
	//}
	
	count_time = parseInt(new Date().getTime()- start_time) / 1000;
	TongWen.dump("loadJSfile:\t " + count_time);
};

TongWen.restoreOrginalTable = function (){
	TongWen.dump("restoreOrginalTable: Enter");
	TongWen.loadJSfile("chrome://tongwen/content/s2t.js");
	TongWen.loadJSfile("chrome://tongwen/content/s2t_phrase.js");
	
	// debug test for developer only
	//TongWen.dump("updateOrginalPhraseTable: \u6770 =>" + TongWen.s_2_t['\u6770']);
};

//TongWen.restoreOrginalTable2 = function (){
	// passerby note
	//another method  record the change propertire and restore it  <--- complex method, for lazy man use a method above
	
	// some method i try
	//record original variable use js variable	
	//var  TongWen.s_2_t_old  = eval(TongWen.s_2_t.toSource());	// use a lot of memory, but very fast , 0.01 sec for load original table
	//var  TongWen.t_2_s_old  = eval(TongWen.t_2_s.toSource());	
	
	// another method:
	// not directly modifty object, clone an object	
	
	//function cloneObj(obj_old){
	//	var obj_new = new object();
		
	//	for(var key in obj_old){
	//		obj_new[key] = obj_old[key];
	//	}
	//	return obj_new;
	//}	
//};

TongWen.initPreCount = function(flag){
	var zhtab = null;
	
	if (flag == TongWen.TRAFLAG){
		zhtab = TongWen.s_2_t_phrase;
	} else {
		zhtab = TongWen.t_2_s_phrase;
	}
	
	var newMap = {};

	for(var key in zhtab){
		var p = key.substr(0,2);
		newMap[p] = 2;
	}

	for(var key in zhtab){
		var p = key.substr(0,2);
		newMap[p] = Math.max(key.length, newMap[p]);
	}

	return newMap;
};

TongWen.makePreCount = function(){
	TongWen.s_2_t_PreCount = TongWen.initPreCount(TongWen.TRAFLAG);
	TongWen.t_2_s_PreCount = TongWen.initPreCount(TongWen.SIMFLAG);
};

/*
TongWen.map_to_string = function(objMap){
	var tmpAry = new Array();
	var val = new Array();	
	var i=0;
	
	for (var key in objMap)
	{
		val[0] = key;
		val[1] = objMap[key];
		tmpAry[i] = val.join("\t");
		++i;
	}
	
	return tmpAry.join("\n");	
};
*/

/*
TongWen.loadExtraTransTable = function (xmlDocs, isConv) {
	if ((typeof xmlDocs != "object") || (xmlDocs == null)) {
		TongWen.dump("loadExtraTransTable: xmlDocs is not object");
		return;
	}
	try {
		var flag = new Array(TongWen.SIMFLAG, TongWen.TRAFLAG);
		var s = r = null;
		var st = rt = "";
		TongWen.out_t2s_phrase = new Object();
		TongWen.out_s2t_phrase = new Object();
		TongWen.UConv.charset = "UTF-8";
		for (var k = 0; k < flag.length; k++) {
			var nodes = xmlDocs.selectNodes("//" + flag[k] + "/phrase");
			TongWen.dump("LoadTransTable: //" + flag[k] + "/phrase [" + nodes.length + "]");
			if ((nodes == null) || (nodes.length <= 0)) continue;
			for (var i = 0; i < nodes.length; i++) {
				s = nodes[i].getElementsByTagName("s");
				r = nodes[i].getElementsByTagName("r");
				if ((s == null) || (r == null) || (s.length <= 0)) continue;
				if (!s[0].hasChildNodes()) continue;
				st = TongWen.trim(s[0].firstChild.nodeValue);
				if (st == "") continue;
				if (isConv) st = TongWen.UConv.ConvertToUnicode(st);

				if ((r == null) || (r.length <= 0)) {
					rt = "";
				} else if (!r[0].hasChildNodes()) {
					rt = "";
				} else {
					rt = TongWen.trim(r[0].firstChild.nodeValue);
					if ((rt != "") && isConv) rt = TongWen.UConv.ConvertToUnicode(rt);
				}

				switch (flag[k]) {
					case TongWen.SIMFLAG : TongWen.out_t2s_phrase[st] = rt; break;
					case TongWen.TRAFLAG : TongWen.out_s2t_phrase[st] = rt; break;
					default:
				}
				TongWen.zhMaxPhraseLength = Math.max(TongWen.zhMaxPhraseLength, st.length);
			}
		}
		
		//passerby add		
		TongWen.updateOrginalPhraseTable(TongWen.out_t2s_phrase, TongWen.SIMFLAG);		
		TongWen.updateOrginalPhraseTable(TongWen.out_s2t_phrase, TongWen.TRAFLAG);		
		
		// debug only
		//TongWen.dump("OutSide Table: t2s \n" + TongWen.map_to_string(TongWen.out_t2s_phrase));
		//TongWen.dump("OutSide Table: s2t \n " + TongWen.map_to_string(TongWen.out_s2t_phrase));
		
		// end of passerby add
	} catch(ex) {
		TongWen.dump("LoadTransTable: " + ex);
	}
};
*/


// ==========================================================================
/* Do a single document, then set flags. */
TongWen.doADoc = function (curDoc, zhflag) {
	try {
		var curChar = curDoc.characterSet.toLowerCase();
		var curflag = TongWen.getZhFlag(curDoc);
		var curtitle = curDoc.title;
		//var curbodylang = curDoc.body.lang;

		/* already converted. */
		var msg = "In doADoc(), current state: ";
		msg += '\ncurDoc: ' + curDoc;
		msg += '\ncurDoc title: ' + curtitle;
		msg += '\ncurflag: ' + curflag + ', zflag: ' + zhflag;
		//msg += '\nbody.lang: ' + curbodylang;
		TongWen.dump(msg);
		
		//if (curflag && curflag == zhflag) {return;}	//hide  this code, force to translate

		/*
		// No chinese. OK, don't think we need this either.
		if (!(curflag || (curChar in TongWen.zh_all))) {
			// Should just return but some shitty pages don't set proper encoding
			// and use &#nnnnn; to represent Chinese, duh!

			if (!curbodylang){
				curDoc.body.lang = "zh-cn";
				curbodylang = "zh-cn";
			}			
			if (curbodylang == "zh-cn") {
				curflag = TongWen.SIMFLAG;
			} else {
				curflag = TongWen.TRAFLAG;
			}
		}

		// Set lang attr. This is needed to force proper fonts.
		// Will not handle subnodes lang, but hey...
		if (zhflag == TongWen.TRAFLAG) {
			// For tradition charsets, single out hk language in case
			// mozilla add hk font option in the future and I don't
			// want to update anything. Yes, hk has special glyphs. 
			curDoc.body.lang = (curChar in TongWen.zh_encodes["hk"]) ? "zh-hk" : "zh-tw";
		} else {
			curDoc.body.lang = "zh-cn";
		}
		*/

		TongWen.convertTree(curDoc, zhflag);
		//TongWen.setZhFlag(curDoc, zhflag);
	} catch(ex) {
		TongWen.dump("doADoc " + ex + curDoc + " name: " + curDoc.nodeName);
	}
};

TongWen.applyFont = function (fontFlag) {		
	TongWen.dump("applyFont: " + fontFlag);

	var fontFamily = "";
	
	if (fontFlag == "trad") {
		fontFamily = TongWen.enforceFont_trad;		//"PMingLiU,MingLiU,\u65b0\u7d30\u660e\u9ad4,\u7d30\u660e\u9ad4";		//PMingLiU,MingLiU,新細明體,細明體
	} else if (fontFlag == "sim"){
		fontFamily = TongWen.enforceFont_simp;		//"MS Song, \u5b8b\u4f53, SimSun";			//MS Song; 宋体; SimSun
	}

	var curDoc = TongWen.getFocusedDoc();
	//remove css if exist
	var obj = curDoc.getElementById("tongwen_font");
	if (obj != null){
		obj.parentNode.removeChild(obj);
	}
	
	if (fontFlag == "none"){ return;}
	
	var newSS= curDoc.createElement("link");
	newSS.id = "tongwen_font";
	newSS.rel="stylesheet"; 
	
	var newStyles='* {  font-family: ' + fontFamily + ' !important ;} ';		
	newSS.href='data:text/css;charset=utf-8,' + (newStyles);
	
	var nodes = curDoc.documentElement.getElementsByTagName("head");
	
	if (nodes.length > 0){
		nodes[0].appendChild(newSS);
	}
};
// ==========================================================================
TongWen.textZoomSetting = function (val) {
	try
	{
		if (val != "disabled")
		{
			val = parseInt(val);
			// add this because mozilla suit can not save option
			if (val == 0) { val = 100; }
			// end of add this because mozilla suit can not save option

			TongWen.dump("textZoomSetting: value: " + val);
			TongWen.textZoomEnable  = ((val == 100) ? false : true);
			TongWen.textZoomEnable  = true;
			TongWen.textZoomPercent = val;
			TongWen.textZoomValue   = TongWen.textZoomPercent / 100;

			TongWen.setOptions("tongwentang.textZoom.enable", true);
			TongWen.setOptions("tongwentang.textZoom.percent", val);
			if (TongWen.textZoomStandalone) TongWen.textZoom(TongWen.getFocusedDoc());
		}
		else
		{
			TongWen.textZoomPercent = 100;
			TongWen.textZoomValue   = TongWen.textZoomPercent / 100;

			TongWen.textZoomEnable = false;
			TongWen.setOptions("tongwentang.textZoom.enable", false);
			TongWen.setOptions("tongwentang.textZoom.percent", 100);
		}
	} catch (ex) {
		TongWen.dump("textZoomSetting: " + ex);
	}
	return false;
};

TongWen.textZoom = function (curDoc, percent)
{
	if (!TongWen.inFilter && TongWen.textZoomEnable) {
		TongWen.doTextZoom(null, TongWen.textZoomValue);
	}
};

TongWen.doTextZoom = function (curDoc, zoomVal)
{
	try
	{
		var obj = (curDoc == null) ? getMarkupDocumentViewer(): curDoc;
		
		//for apply textzoom
		//var currZoom = obj.textZoom;
		//if (currZoom != zoomVal) {obj.textZoom = zoomVal;}
		
		//for apply fullzoom or textzoom
		TongWen.setTextZoomValue(zoomVal);
	}
	catch(ex)
	{
		TongWen.dump("doTextZoom: " + ex);
	}
};

/**
 * show or hidden menu icons
 **/
TongWen.chgIconStatus = function () {
	var isShowIcon = TongWen.menuIcon;
	var obj = null, nodes = null;
	var ids = ["contentAreaContextMenu", "tongwen-button"];
	var menuID = [
		[
		//"tongwen-context-menu",
		"tongwen-context-text-sim-item",
		"tongwen-context-text-tra-item",
		"tongwen-context-simplified-item",
		"tongwen-context-traditional-item",
		"tongwen-context-autoconvert-menu",
		"tongwen-context-clip-simplified-item",
		"tongwen-context-clip-traditional-item",
		"tongwen-context-textzoom-menu",
		"tongwen-context-settings-item"]
		,
		["tongwen-simplified-item",
		"tongwen-traditional-item",		
		"tongwen-autoconvert-menu",
		"tongwen-clip-simplified-item",
		"tongwen-clip-traditional-item",		
		"tongwen-textzoom-menu",
		"tongwen-settings-item",	
		"tongwen-applyfont-sim",
		"tongwen-applyfont-trad",
		"tongwen-applyfont-none",
		"tongwen-bug-report-item"
		]
	];
	
	var menuIconClassName = '';

	for (var i = 0; i < ids.length; i++) {
			for (var j = 0; j < menuID[i].length; j++) {
				nodes = document.getElementById(menuID[i][j]);
				if (nodes){
						menuIconClassName = isShowIcon?nodes.getAttribute("iconic"):"";
						nodes.setAttribute("class", menuIconClassName);
				}
			}
	}
	
	obj = document.getElementById("tongwen-context-menu");
	if (obj){		
		//code for firefox
		//menuIconClassName = isShowIcon?nodes.getAttribute("iconic"):"menu-iconic tongwen-blank";
		//obj.setAttribute("class", menuIconClassName);
		
		//code for mozilla suit
		menuIconClassName = isShowIcon?"false":"true";
		obj.setAttribute("noicon", menuIconClassName);
	}
};
// ==========================================================================

TongWen.loadPrefTextZoom = function() {
	// text zoom
	TongWen.textZoomAutoDefault = TongWen.getOptions("tongwentang.textZoom.autoDefault", TongWen.textZoomAutoDefault);
	TongWen.textZoomEnable      = TongWen.getOptions("tongwentang.textZoom.enable", TongWen.textZoomEnable);
	TongWen.textZoomPercent     = TongWen.getOptions("tongwentang.textZoom.percent", TongWen.textZoomPercent);
	TongWen.textZoomValue       = 1;
	TongWen.textZoomStandalone  = TongWen.getOptions("tongwentang.textZoom.standalone", TongWen.textZoomStandalone);
	TongWen.textZoomSetting(TongWen.textZoomEnable ? TongWen.textZoomPercent : "disabled");
};

TongWen.loadPrefFilter = function() {
	TongWen.filterEnable = TongWen.getOptions("tongwentang.filter.enable", TongWen.filterEnable);
	if (TongWen.filterEnable) {
		TongWen.loadFilter();
	}
};

/*
TongWen.loadGeneralPref = function() {	
	var tongWenGlobalSettingArray = [
		["useInsideTable",        "tongwentang.phrase.useInsideTable", null],
		["autoConvert",           "tongwentang.autoconvert.chineseCharset", null],
		["ZHENCODINGONLY",        "tongwentang.autoconvert.chineseEncodingOnly", null],
		["OPPCHARSETONLY",        "tongwentang.autoconvert.oppositeCharsetOnly", null],
		["enableUTF8AutoConvert", "tongwentang.autoconvert.enableUtf8Trans", null],
		
		["hotKey_PageSim", "tongwentang.hotKey.PageSim", null],
		["hotKey_PageTra", "tongwentang.hotKey.PageTra", null],		
		["hotKey_PageAuto", "tongwentang.hotKey.PageAuto", null]
	];
	
	for (var i = 0; i < tongWenGlobalSettingArray.length; i++) {
		var item = tongWenGlobalSettingArray[i];
		TongWen[item[0]]  = TongWen.getOptions(TongWen[item[1]] , TongWen[item[0]]);
	}
};
*/

TongWen.loadPrefEncoding = function() {
	// use TongWen Convert
	TongWen.useInsideTable      = TongWen.getOptions("tongwentang.phrase.useInsideTable" , TongWen.useInsideTable);

	// TongWen auto convert
	TongWen.autoConvert         = TongWen.getOptions("tongwentang.autoconvert.chineseCharset" , TongWen.autoConvert);
		
	//auto-convert setting
	TongWen.ZHENCODINGONLY = TongWen.getOptions("tongwentang.autoconvert.chineseEncodingOnly", TongWen.ZHENCODINGONLY);
	TongWen.OPPCHARSETONLY = TongWen.getOptions("tongwentang.autoconvert.oppositeCharsetOnly", TongWen.OPPCHARSETONLY);
	TongWen.enableUTF8AutoConvert = TongWen.getOptions("tongwentang.autoconvert.enableUtf8Trans", TongWen.enableUTF8AutoConvert);
};

TongWen.loadPrefEnforceFont = function() {
	//load enforce setting
	TongWen.enforceFont_enable = TongWen.getOptions("tongwen.enforcefont.enable" , TongWen.enforceFont_enable);	
	TongWen.enforceFont_trad = TongWen.getUnicodePref("tongwen.enforcefont.trad", TongWen.enforceFont_trad);
	TongWen.enforceFont_simp = TongWen.getUnicodePref("tongwen.enforcefont.simp", TongWen.enforceFont_simp);
};

TongWen.loadPrefHotkey = function() {
	//load custom hotkey
	TongWen.hotKey_PageSim = TongWen.getOptions("tongwentang.hotKey.PageSim", TongWen.hotKey_PageSim);		
	TongWen.hotKey_PageTra = TongWen.getOptions("tongwentang.hotKey.PageTra", TongWen.hotKey_PageTra);
	TongWen.hotKey_PageAuto = TongWen.getOptions("tongwentang.hotKey.PageAuto", TongWen.hotKey_PageAuto);
};

TongWen.loadPrefDisableTransInputTextarea  = function() {
	TongWen.disableTransInputTextarea = TongWen.getOptions("tongwentang.disableTransInputTextarea", TongWen.disableTransInputTextarea);
};

TongWen.loadPrefMenuIcon = function() {
	// change Icon status
	var pref_menuIcon = TongWen.getOptions("tongwentang.contextMenuIcon", TongWen.menuIcon);
		
	//only update when status is change		
	if (TongWen.menuIcon != pref_menuIcon) {
		TongWen.menuIcon = pref_menuIcon;
		TongWen.chgIconStatus();
	}
};

TongWen.loadPrefRedefinePhrase = function() {
		//****  Restore orginal table checking, if redefine keyword is changed just reload orginal table ***
		var isRedefinePhraseChanged = false;
		var pref_useRedefineTable = TongWen.getOptions("tongwentang.redefinephrase.enable", TongWen.useRedefineTable);
		
		if (TongWen.useRedefineTable != pref_useRedefineTable){
			TongWen.useRedefineTable = pref_useRedefineTable;
			isRedefinePhraseChanged = true;
		}
		
		//tongwentang.redefinephrase2.s2t default value = "";
		var pref_customphrase_s2t  = TongWen.getUnicodePref("tongwentang.redefinephrase2.s2t", "");
		var pref_customphrase_t2s  = TongWen.getUnicodePref("tongwentang.redefinephrase2.t2s", "");
				
		if (TongWen.redefine_phrase_s2t != pref_customphrase_s2t){
			TongWen.redefine_phrase_s2t = pref_customphrase_s2t;
			isRedefinePhraseChanged = true;
		}		
		if (TongWen.redefine_phrase_t2s != pref_customphrase_t2s){
			TongWen.redefine_phrase_t2s = pref_customphrase_t2s;
			isRedefinePhraseChanged = true;
		}
		
		if (isRedefinePhraseChanged && TongWen.loadSettingFrom == 'dialog') {
			// restore orginal table
			TongWen.restoreOrginalTable();
			TongWen.loadSettingFrom = 'script';
		}
		
		//*************************************************************************************			
		if (pref_useRedefineTable && !TongWen.isLoadedRedefineTable){
			//load custom phrase table
			TongWen.loadRedefineTable();
			TongWen.isLoadedRedefineTable = true;
		}
		
		//make preCount table
		TongWen.makePreCount();
};

TongWen.loadSettings = function (bol) {
	TongWen.dump("loadSettings: Enter");	
	if (!bol) return false;
	
	var txt  = "";
	var obj = null;
	try {
		//TongWen.out_t2s_phrase = new Object();
		//TongWen.out_s2t_phrase = new Object();
		
		TongWen.zhMaxPhraseLength = 15;
		TongWen.DEBUG = TongWen.getOptions("tongwentang.debug", TongWen.DEBUG);
		
		TongWen.loadPrefTextZoom();	
		TongWen.loadPrefEncoding();
		TongWen.loadPrefFilter();
		
		TongWen.loadPrefRedefinePhrase();
				
		//TongWen.restoreOrginalTable();
		// TongWen.loadInsideTable();
		// load outside table not use since 0.2.9.8
		//TongWen.loadOutsideTable();		

		TongWen.loadPrefMenuIcon();
		TongWen.loadPrefEnforceFont();
		TongWen.loadPrefHotkey();
		TongWen.loadPrefDisableTransInputTextarea();
	} catch (ex) {
		TongWen.dump("loadSettings: " + ex);
	} finally {
		TongWen.setOptions("tongwentang.reloadSetting", false);		
	}
};
// ==========================================================================
TongWen.initTools = function (ids) {
	if ((typeof ids == "undefined") || (typeof ids != "object")) {
		ids = {
			"auto_simp" : "tongwen-auto-simplified-item",
			"auto_trad" : "tongwen-auto-traditional-item",
			"auto_off"  : "tongwen-auto-off-item",
			"zoom_user" : "tongwen-textzoom-user-item",
			"zoom_off"  : "tongwen-textzoom-off-item",
			"zoom_home" : "tongwen-textzoom-",
			"zoom_end"  : "-item"
		};
	}
	
	var acstat  = TongWen.autoConvert;
	try {
		var widgetS = document.getElementById(ids.auto_simp);
		var widgetT = document.getElementById(ids.auto_trad);
		var widgetO = document.getElementById(ids.auto_off);
		
		var widgetS_val=null, widgetT_val=null, widgetO_val=null;
		if (widgetS){
			widgetS_val = widgetS.getAttribute("checked");
			if (widgetS_val!=false) widgetS.setAttribute("checked", false);
		}
		if (widgetT){ 
			widgetT_val = widgetS.getAttribute("checked");
			if (widgetT_val!=false) widgetT.setAttribute("checked", false);
		}
		if (widgetO) {
			widgetO_val = widgetS.getAttribute("checked");
			if (widgetO_val!=false) widgetO.setAttribute("checked", false);
		}
		
		switch (acstat) {
			case TongWen.SIMFLAG:
				if (widgetS != null) {
					if (widgetS_val!=true) widgetS.setAttribute("checked", true);
				}
				// tongwen_auto.add(acstat);
				break;
			case TongWen.TRAFLAG:
				if (widgetT != null) {
					if (widgetT_val!=true) widgetT.setAttribute("checked", true);
				}
				// tongwen_auto.add(acstat);
				break;
			default:
				if (widgetO != null) {
					if (widgetO_val!=true) widgetO.setAttribute("checked", true);
				}
				break;
		}

	} catch(ex) {
		TongWen.dump("initTools: autoTrans: " + ex);
	}

	var percent = TongWen.textZoomPercent;
	var val = 100;
	try {
		var obj = null;
		var ary = ["150", "110", "100", "90", "50"];
		for (var i = 0; i < ary.length; i++) {
			obj = document.getElementById(ids.zoom_home + ary[i] + ids.zoom_end);
			if (obj) obj.setAttribute("checked", false);
		}
		obj = document.getElementById(ids.zoom_user);
		if (obj) obj.setAttribute("checked", false);
		
		obj = document.getElementById(ids.zoom_off);
		if (obj) obj.setAttribute("checked", false);

		percent = parseInt(percent);

		obj = document.getElementById(ids.zoom_user);
		if (obj) {
			val = TongWen.getOptions("tongwentang.textZoom.percent", val);
			obj.setAttribute("label", (obj.getAttribute("mylabel")) + " (" + val + "%)");
			obj.value = val;
		}

		if (TongWen.textZoomEnable) {
			obj = document.getElementById(ids.zoom_home + percent + ids.zoom_end);
			if (obj == null) obj = document.getElementById(ids.zoom_user);
			if (obj) obj.setAttribute("checked", true);
		} else {
			obj = document.getElementById(ids.zoom_off);
			if (obj) obj.setAttribute("checked", true);
		}
	} catch (ex) {
		TongWen.dump("initTools: textZoomPercent: " + ex);
	}
};
// ==========================================================================
TongWen.showMenu = function () {
	/* The context menu was controlled by dynamic flipping hidden property. */
	// document.getElementById('tongwen-context-text-menu').hidden = document.getElementById('context-sep-paste').hidden;
	var ids = {
		"auto_simp" : "tongwen-context-auto-simplified-item",
		"auto_trad" : "tongwen-context-auto-traditional-item",
		"auto_off"  : "tongwen-context-auto-off-item",
		"zoom_user" : "tongwen-context-textzoom-user-item",
		"zoom_off"  : "tongwen-context-textzoom-off-item",
		"zoom_home" : "tongwen-context-textzoom-",
		"zoom_end"  : "-item"
	};
	TongWen.initTools(ids);

	var ary = [
		"tongwen-context-menu",
		"tongwen-context-text-sim-item", "tongwen-context-text-tra-item",
		"tongwen-context-simplified-item", "tongwen-context-traditional-item", "tongwen-context-autoconvert-menu",
		"tongwen-context-clip-simplified-item", "tongwen-context-clip-traditional-item",
		"tongwen-context-textzoom-menu",
		"tongwen-context-settings-item"
	];
	var sor = ["tongwen-text-page", "tongwen-page-clip", "tongwen-clip-zoom", "tongwen-zoom-setting"];
	var hid = [true, true, true, true, true];
	var isHid = false;
	
	var obj = null;
	obj = document.getElementById('context-sep-paste');
	
	isHid = ((obj == null) || obj.hidden);
	for (var i = 0; i < ary.length; i++) {
		obj = document.getElementById(ary[i]);
		obj.hidden = !TongWen.getOptions(obj.getAttribute("prefstring"), true);
		
		switch (i) {
			case 0 :
				if (obj.hidden) return;
				break;

			case 1 : case 2 :
				obj.hidden = obj.hidden || isHid;
				hid[0] = hid[0] && obj.hidden;
				break;

			case 3 : case 4 : case 5 :
				hid[1] = hid[1] && obj.hidden;
				break;

			case 6 : case 7 :
				hid[2] = hid[2] && obj.hidden;
				break;

			case 8 :
				hid[3] = hid[3] && obj.hidden;
				break;

			case 9 :
				hid[4] = hid[4] && obj.hidden;
				break;
			default:
		}
	}

	var thid = [];
	thid[0] = hid[0] ? true : (hid[1] && hid[2] && hid[3] && hid[4]);
	thid[1] = hid[1] ? true : (hid[2] && hid[3] && hid[4]);
	thid[2] = hid[2] ? true : (hid[3] && hid[4]);
	thid[3] = hid[3] ? true : (hid[4]);
	
	for (var i = 0; i < sor.length; i++) {
		obj = document.getElementById(sor[i]);
		if (obj.hidden != thid[i]){
			obj.hidden = thid[i];
		}
	}
	
	obj = document.getElementById(ary[0]);
	var hiddenVal = (hid[0] && hid[1] && hid[2] && hid[3] && hid[4]);
	if (obj.hidden != hiddenVal){
		obj.hidden = hiddenVal;
	};
	//obj.hidden = (hid[1] && hid[2] && hid[3] && hid[4]);
};


TongWen.getLocalString = function (strName) {
	var src = "chrome://tongwen/locale/tongwen.properties";
	var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]
		.getService(Components.interfaces.nsIStringBundleService);
	var bundle = stringBundleService.createBundle(src);
	return bundle.GetStringFromName(strName);
};

TongWen.getCurrentBaseURL = function (){
	return TongWen.getBaseURL(window.content.document.documentURI)  + "\/";
};

TongWen.getBaseURL = function (inURL) {
	var isfileURL = (inURL.indexOf("file:\/\/\/") != -1);		
	if (!isfileURL){
		var strURL = inURL.split("\/");
			
		if (strURL.length >= 2){
			inURL = strURL[0] + "\/" + strURL[1] +"\/" + strURL[2];
		}
	}	
	return inURL;
};

TongWen.getParentFolder = function (filepath){
	var tmpAry = filepath.split("\/");
	tmpAry.pop();	
	return (tmpAry.join("\/")) + "\/";
};

TongWen.addFilterSilence = function(flag) {
	TongWen.dump("addFilterSilence: Enter");
	
	//TongWen.loadFilter();		
	
		var filterZhFlag = '';
		var filterZoomPercent = '';
		
		var titleStr = '';
		if (flag == TongWen.TRAFLAG){
			titleStr = TongWen.getLocalString('msg_addFilter_trad_title');
			filterZhFlag = 'trad';
		} else {
			titleStr = TongWen.getLocalString('msg_addFilter_sim_title');
			filterZhFlag = 'simp';
		}
		
		var curURL = TongWen.getCurrentBaseURL();
		
		if (curURL in TongWen.filterMap){
			filterZoomPercent = TongWen.filterMap[curURL][2];			
		}
				
		TongWen.addFilter(curURL, filterZhFlag, filterZoomPercent);
		
		var aletTitle = titleStr;
		var alertContent = curURL;
		var alertIconURL = "chrome://tongwen/skin/images/tongwen-new-24.png";
		
		TongWen.showAlertMsg(aletTitle, alertContent, alertIconURL);
};

TongWen.showAlertMsg = function (aletTitle, alertContent, alertIconURL){
	if ('@mozilla.org/alerts-service;1' in Components.classes){	
		const alertsService = Components.classes["@mozilla.org/alerts-service;1"]
	                        .getService(Components.interfaces.nsIAlertsService);
			alertsService.showAlertNotification(alertIconURL, aletTitle, alertContent, false, "", null);
	}
};

TongWen.addFilter = function(filterURL, filterZhFlag, filterZoomPercent){
	if (filterURL.length == 0){ return; }
	var filterMap = TongWen.filterMap;
	
	//set global variable	
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
};

TongWen.removeFilter = function(){
	var filterURL = TongWen.getCurrentBaseURL();
	if (filterURL.length == 0){ return; }
	
	var filterMap = TongWen.filterMap;
	
	if (filterURL in filterMap){
		delete filterMap[filterURL];
	}
	
	var filterAry = [];	
	//alert('filterMap:\n' + filterMap.toSource());
	
	for(var key in filterMap){
		var ary = [];
		ary = filterMap[key];		
		filterAry[filterAry.length] = ary.join("\t");
	}
	
	TongWen.setOptions("tongwentang.filter.list", filterAry.join('\n'));

	var aletTitle = TongWen.getLocalString('msg_removeFilter_title');
	var alertContent = TongWen.getCurrentBaseURL();
	var alertIconURL = "chrome://tongwen/skin/images/tongwen-remove-24.png";
		
	TongWen.showAlertMsg(aletTitle, alertContent, alertIconURL);
};

TongWen.showAddFilterDialog = function () {
	TongWen.dump("showSettingDialog: Enter");
	
	try {
		var dialogURL = "chrome://tongwen/content/dialog_addfilter.xul";
		var txtzoom =  Math.round(TongWen.getTextZoomValue() * 100);
		
		var res = window.openDialog(dialogURL, "TongWen_addFilter", "chrome,modal,centerscreen,close, width=560,height=200,resizable=yes", txtzoom);
		
		TongWen.loadFilter();
	} catch (ex) {
		TongWen.dump("showAddFilterDialog: " + ex);
	}
};

TongWen.showSettingDialog = function () {
	TongWen.dump("showSettingDialog: Enter");
	try {
		var stat = false;
		var dialogURL = "chrome://tongwen/content/settings/settings.xul";
		//var res = window.openDialog(dialogURL, "TongWen", "chrome,modal,close, centerscreen,width=540,height=450, resizable=yes");
		var res = window.openDialog(dialogURL, "TongWen", "chrome,modal,close, width=600,height=500,resizable=yes");
		stat = TongWen.getOptions("tongwentang.reloadSetting", true);
		
		if (stat){
			TongWen.loadSettingFrom = 'dialog';
			TongWen.isLoadedRedefineTable = false;
		}
		
		TongWen.loadSettings(stat);
	} catch (ex) {
		TongWen.dump("showSettingDialog: " + ex);
	}
};

TongWen.openNewTab = function(defaultURL){
	//window.open(defaultURL, 'win-report-bug');
	
	var obj = document.getElementById('content');
	if (obj){
		obj.addTab(defaultURL);
	}
};

TongWen.reportbug = function(){
	//report bug to default web sites
	
	var defaultURL = 'http:\/\/of.openfoundry.org/projects/333/rt';
	
	var lcoalLangURL ={
		"en-US": "http://of.openfoundry.org/projects/333/rt?lang=en",
		"zh-TW": "http://tongwen.openfoundry.org/#report",
		"zh-CN": "http://tongwen.openfoundry.org/#report",
		"zh-HK": defaultURL
	};
	
	var obj = document.getElementById("tongwen-bug-report-item");

	if (obj){
		var y= obj.getAttribute("local-lang");
		
		//for localize report link
		if (y in lcoalLangURL) {
			defaultURL = lcoalLangURL[y];
		}
	}
	
	TongWen.openNewTab(defaultURL);
};

TongWen.isInValidDoc = function (){
	var curDoc = TongWen.getFocusedDoc();
	if (!curDoc || curDoc instanceof XULDocument) {return true};
	var strCurrentURI = curDoc.documentURI;
	if (strCurrentURI == 'about:blank') {return true;}
	
	return false;
};

// ==========================================================================
// tongwen preference Observer
TongWen.WatchOption = {	
	observe : function (aSubject, aTopic, aPrefPath) {
		if (aTopic != "nsPref:changed") return;
		switch (aPrefPath) {
			case "tongwentang.debug":
				TongWen.DEBUG = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.autoconvert.chineseEncodingOnly":
				TongWen.ZHENCODINGONLY = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.autoconvert.oppositeCharsetOnly":
				TongWen.OPPCHARSETONLY = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.autoconvert.enableUtf8Trans":
				TongWen.enableUTF8AutoConvert = TongWen.getOptions(aPrefPath);
	
				//var curDoc = window.content.document;
				//var curURL = curDoc.location.href;
				
				//TongWen.dump('TongWen.enableUTF8AutoConvert is changed:' + TongWen.enableUTF8AutoConvert + '\n' + curURL);				
				//var curDoc = null;
				break;
			case "tongwentang.textZoom.autoDefault":
				TongWen.textZoomAutoDefault = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.textZoom.standalone":
				TongWen.textZoomStandalone = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.filter.enable":
				TongWen.filterEnable = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.hotKey.PageSim":
				TongWen.hotKey_PageSim = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.hotKey.PageTra":
				TongWen.hotKey_PageTra = TongWen.getOptions(aPrefPath);
				break;
			case "tongwentang.hotKey.PageAuto":
				TongWen.hotKey_PageAuto = TongWen.getOptions(aPrefPath);
				break;				
			case "tongwen.enforcefont.enable":
				TongWen.enforceFont_enable = TongWen.getOptions("tongwen.enforcefont.enable" , TongWen.enforceFont_enable);
				break;
			case "tongwen.enforcefont.trad":
				TongWen.enforceFont_trad = TongWen.getUnicodePref("tongwen.enforcefont.trad", TongWen.enforceFont_trad);
				break;
			case "tongwen.enforcefont.simp":
				TongWen.enforceFont_simp = TongWen.getUnicodePref("tongwen.enforcefont.simp", TongWen.enforceFont_simp);
				break;
			case "tongwentang.disableTransInputTextarea":
				TongWen.loadPrefDisableTransInputTextarea();
				break;	
			default:
		}
	}
};
// ==========================================================================

TongWen.onkeyDown = function(event){
	if ((TongWen.hotKey_PageSim == "") && 
	(TongWen.hotKey_PageTra == "") &&
	(TongWen.hotKey_PageAuto == "")
	) {return;}

	var keytext = "";
	var akeycode = event.keyCode;
	
	//akeycode is a integer, convert it to string
	//akeycode = akeycode.toString().toUpperCase();		
	//alert(akeycode);

	if (akeycode in TongWen.keyCodeMapper){
		keytext = TongWen.keyCodeMapper[akeycode];
	}	

	var modifiers = [];
	if(event.ctrlKey) modifiers.push("CONTROL");	
	if(event.altKey) modifiers.push("ALT");	
	if(event.shiftKey) modifiers.push("SHIFT");
	//if(event.metaKey) modifiers.push("META");
	

	if (modifiers.length > 0){
		if (keytext != ""){
			keytext = modifiers.join("+") +  "+" + TongWen.keyCodeMapper[akeycode];
		} else {
			keytext = modifiers.join("+");
		}
	}
	
	//quit function if keytext is empty
	if (keytext == "") {
		return;
	}
		
	if (keytext == TongWen.hotKey_PageSim){	
		TongWen.trans(TongWen.SIMFLAG);
	} else if (keytext == TongWen.hotKey_PageTra){
		TongWen.trans(TongWen.TRAFLAG);		
	} else if (keytext == TongWen.hotKey_PageAuto){
		TongWen.trans();
	}	
	//TongWen.dump("onkeyDown: " + keytext);
};

/* Do a list of frames, have to be recursive someohow, whatever.. */
TongWen.doFrames = function (curDoc, zhflag, deep) {
	//var start_time = null;
	//var count_time = null;

	var TongWen_FRAMEDEEP = TongWen.FRAMEDEEP;			// FRAMEDEEP : 18
	
	try {
		//start_time = new Date().getTime();
		
		// At least do current doc once.
		TongWen.doADoc(curDoc, zhflag);
		++deep;
		
		var frameDocAry =[];
		
		//old method
		/*
		function addFrameCollection(curDoc, deep){		
			var my_frames = curDoc.getElementsByTagName("FRAME");		
			var my_frames_len = my_frames.length;

			if ((my_frames_len > 0) && (deep < TongWen_FRAMEDEEP)) {
				
				TongWen.dump("doFrames: Frame: url: " + curDoc.URL);
				for (var i = 0; i < my_frames_len; i++) {
					var frameDoc = my_frames[i].contentDocument;
					frameDocAry.push(frameDoc);
					addFrameCollection(frameDoc, ++deep);
				}
			}
			
			var iFrames = curDoc.getElementsByTagName("IFRAME");
			var iFrames_len = iFrames.length;

			if ((iFrames_len > 0) && (deep < TongWen_FRAMEDEEP)) {
				TongWen.dump("doFrames: iFrame: Url: " + curDoc.URL);
				
				for (var i = 0; i < iFrames_len; i++) {
					var iframeDoc = iFrames[i].contentDocument;
					frameDocAry.push(iframeDoc);
					addFrameCollection(iframeDoc, ++deep);
				}
			}
		}
		*/
		
		// new method		
		function addFrameCollection(curDoc, deep){
			if (deep > TongWen.FRAMEDEEP) {	return;}
			
			if (curDoc.defaultView!=null && curDoc.defaultView.frames!=null && curDoc.defaultView.frames.length >0){
				TongWen.dump("doFrames: defaultView method to walk thought frame or iframe: \n" + curDoc.URL);
			
				var my_frames = curDoc.defaultView.frames;
				var my_frames_len = my_frames.length;

				for (var i = 0; i < my_frames_len; i++) {
					var frameDoc = my_frames[i].document;
					
					//frameDocument contain frame or iframe
					if (frameDoc.defaultView!=null && frameDoc.defaultView.frames!=null && frameDoc.defaultView.frames.length >0){
						// At least do frameset/iframe top document once
						frameDocAry.push(frameDoc);
						addFrameCollection(frameDoc, ++deep);
					} else {
						frameDocAry.push(frameDoc);
					}
				}
			}
		}
		
		addFrameCollection(curDoc, deep);
		
		for (var i = 0; i < frameDocAry.length; i++) {
			TongWen.doADoc(frameDocAry[i], zhflag);
		}

		/*
		if (deep <= 1) {
			count_time = parseInt(new Date().getTime()- start_time) / 1000;
			TongWen.dump("doFrames:Total convertion time in sec: " + count_time);
		}
		*/
	} catch(ex) {
		TongWen.dump("doFrames: " + ex);
	}
};
// ==========================================================================
/* Make a doc to switch language or force it to one language. */
TongWen.trans = function (forcezh) {
	try {
		var curDoc = TongWen.getFocusedDoc();
		var zhflag = null;
		// If no HTMLDocument, we just stop.
		if (!curDoc || curDoc instanceof XULDocument) {return;}

		var cs = curDoc.characterSet.toLowerCase();		
		
		//hide this, enable enforce translate
		//if (TongWen.ZHENCODINGONLY && !(cs in TongWen.zh_all)) {return false;}
		
		if (forcezh) {
			zhflag = forcezh;
		} else {
			var oldflag = TongWen.guessZhFlag(curDoc);			
			zhflag = (oldflag != TongWen.SIMFLAG) ? TongWen.SIMFLAG : TongWen.TRAFLAG;
		}
		
		var start_time = new Date().getTime();
		var count_time = null;

		if (curDoc.contentType == "application/xhtml+xml"){
			TongWen.processXpath(curDoc, zhflag);
			TongWen.setZhFlag(curDoc, zhflag);
		} else {
			TongWen.doFrames(curDoc, zhflag, 0);
			TongWen.setZhFlag(curDoc, zhflag);
		}

		count_time = parseInt(new Date().getTime()- start_time) / 1000;
		
		TongWen.dump("trans: flag = " + zhflag + '\n' + ": Convertion time in sec: " + count_time);	
		
	} catch(ex) {
		TongWen.dump("trans " + ex + ": " + curDoc);
	}
};

// ==========================================================================
TongWen.isOppCharset = function (cs, zhflag) {
	//only not opposite charset false, other case return true
	var ret = true;
		
	try {
		if (cs in TongWen.zh_all) {
			if ((zhflag == TongWen.SIMFLAG) && (cs in TongWen.zh_encodes["cn"])){
				ret = false;
			} else if ((zhflag == TongWen.TRAFLAG) && (cs in TongWen.zh_encodes["tw"] || cs in TongWen.zh_encodes["hk"])) {
				ret = false;
			}
		}
	} catch(ex) {
		TongWen.dump("isoppcharset: " + ex + cs + zhflag);
	}
	return ret;
};

//if is utf-8 encodeing return true
TongWen.isUTFchartSet = function (cs) {
	var unicode_charset = {"utf-8":1, "utf-7":1};

	if ((cs in unicode_charset)) {
		return true;
	}	
	
	return false;
};

TongWen.isIgnoreCharset = function (chartset) {		
	// Ignore non Chinese page if asked. 
	if (TongWen.ZHENCODINGONLY && !(chartset in TongWen.zh_all)) {
		TongWen.dump("AutoTrans: stop,  zh-chartset only enable,  flag: " + TongWen.autoConvert);
		return true;
	}
	
	//Ignore autoTrans  if  opposite chatset only asked
	if (TongWen.OPPCHARSETONLY && !TongWen.isOppCharset(chartset, TongWen.autoConvert)){
		TongWen.dump("AutoTrans: stop,  opposite-chartset only enable,  flag: " + TongWen.autoConvert);
		return true;
	}
				
	//Ignore UTF-8 chatset is asked
	if (!TongWen.enableUTF8AutoConvert){
		if (TongWen.isUTFchartSet(chartset)){
			TongWen.dump("AutoTrans: stop,  ignore- utf-8 chartset  enable,  flag: " + TongWen.autoConvert);
			return true;
		}
	}
	return false;
};

TongWen.isWestHtmlLang = function (curDoc){	
	var lang = curDoc.documentElement.getAttribute('lang');
	
	if (typeof lang == "string"){
		lang = lang.toLowerCase();
				
		var westHtmlLangSet = {
			"en-us":1, 
			"en":1
		};

		if (lang in westHtmlLangSet) {
			return true;
		}
	}
	return false;
}

TongWen.autoTrans = function (event) {
	// filter
	var res = TongWen.doFilter(event);
	if (res) return;
	// auto convert
	if (TongWen.autoConvert == "off"){ return;}
	
	try {
		//var curDoc = (event.originalTarget.document)? event.originalTarget.document: event.originalTarget;
		var curDoc = event.originalTarget;
			
		if (curDoc instanceof HTMLDocument) {
			if (curDoc.baseURI && curDoc.baseURI == "about:blank") {return;}
			
			var cs = curDoc.characterSet.toLowerCase();
			
			//if charset is ignore just quit function
			if (TongWen.isIgnoreCharset(cs)){ return;}
			
			//if charset is utf and html lang tag is en-us just quit function
			if (TongWen.isUTFchartSet(cs) && 
				TongWen.ZHENCODINGONLY && 
				(curDoc.contentType != "application/xhtml+xml") &&
				TongWen.isWestHtmlLang(curDoc)
			){return;}

				
			if (curDoc.contentType == "application/xhtml+xml"){			
				TongWen.processXpath(curDoc, TongWen.autoConvert);
				TongWen.setZhFlag(curDoc, TongWen.autoConvert);
			} else {
				//don't handle frames or iframe, just handle top document only.
				
				if (curDoc.ownerDocument!= null) {return;}
				TongWen.doFrames(curDoc, TongWen.autoConvert, 0);
				TongWen.setZhFlag(curDoc, TongWen.autoConvert);
				//alert(curDoc.URL);
				//TongWen.doADoc(curDoc, TongWen.autoConvert);
			}			
			TongWen.dump("AutoTrans: \nauto-flag: " + TongWen.autoConvert + ", url: \n" + curDoc.URL);
		}
	} catch (ex) {
		TongWen.dump("AutoTrans: " + ex);
	}
};

TongWen.addAutoTrans = function (zhflag) {
	TongWen.autoConvert = zhflag;
	TongWen.setOptions("tongwentang.autoconvert.chineseCharset", zhflag);
	if (zhflag != "off") TongWen.trans(zhflag);
};
// ==========================================================================

TongWen.showMenuCallBackFunctionRef = null;

TongWen.backwordFix = function (){
	TongWen.s_2_t['\u91cc'] = '\u88e1';
};

TongWen.init = function (event) {	
	if (!TongWen.isInitTool){
	
		TongWen.backwordFix();
		
		try {
			var tongwenCMenu = document.getElementById("contentAreaContextMenu");
			if (tongwenCMenu) {
				tongwenCMenu.addEventListener("popupshowing", TongWen.showMenuCallBackFunctionRef = function (e){TongWen.showMenu();}, false);
			}

			var tongwenCMenu2 = document.getElementById("messagePaneContext");
			if (tongwenCMenu2){
				tongwenCMenu2.addEventListener("popupshowing", TongWen.showMenuCallBackFunctionRef = function (e){TongWen.showMenu();}, false);
			}
		}		
		 catch (ex) {
			TongWen.dump("init: " + ex);
		}
		
		TongWen.loadSettings(true);
		TongWen.initTools();
		
		//TongWen.prefAddObserver(TongWen.WatchOption);			<---- remove this code because avoid adding more than one observer in same windows
		if (!TongWen.observerIsAdded){
			TongWen.addPrefObserver(TongWen.WatchOption);
			TongWen.observerIsAdded = true;
		}
		
		TongWen.isInitTool = true;
		TongWen.dump("init: Enter");
	}

	try {
		//TongWen.textZoomDefValue = getMarkupDocumentViewer().textZoom;
	} catch (ex) {
		TongWen.dump("init2: " + ex);
	}
};


TongWen.unload = function(event){
	TongWen.s_2_t = null;
	TongWen.t_2_s = null;
	TongWen.s_2_t_phrase = null;
	TongWen.t_2_s_phrase = null;
		
	var tongwenCMenu = document.getElementById("contentAreaContextMenu");
	if (tongwenCMenu){
		// i think this code is unnecessary !, because while anonymous function  it not used in  addEventListener, 
		// the variables in its enclosing environment will not reference to any global variable , 		
		// js garbage collector will reclaimed the variable memory which used by anonymous function 
		tongwenCMenu.removeEventListener("popupshowing", TongWen.showMenuCallBackFunctionRef, false);
	}

	var tongwenCMenu2 = document.getElementById("messagePaneContext");
	if (tongwenCMenu2){
		// i think this code is unnecessary !,  because garbage collector can automate stop circular reference  and variable counting
		tongwenCMenu2.removeEventListener("popupshowing", TongWen.showMenuCallBackFunctionRef, false);
	}	
	//document.removeEventListener("DOMContentLoaded", function (e){TongWen.autoTrans;}, true);	

	TongWen.removePrefObserver(TongWen.WatchOption);
	TongWen.dump("Closing a window");
};