// ==========================================================================
TongWen.doTextInput = function(zhflag) {

	try {
		var theTextBox = document.commandDispatcher.focusedElement;
		if (theTextBox && theTextBox.value != undefined && theTextBox.value != "") {
			var ss = theTextBox.selectionStart;
			var se = theTextBox.selectionEnd;
			
			if (ss != se) {
				var tmpvalue = theTextBox.value;
				svalue = tmpvalue.slice(ss, se);
				theTextBox.value = tmpvalue.slice(0, ss) + TongWen.convZh(svalue, zhflag) + tmpvalue.slice(se);				
			} else {
				theTextBox.value = TongWen.convZh(theTextBox.value, zhflag);
				
				var curChar = document.characterSet.toLowerCase();
				if (zhflag == TongWen.TRAFLAG) {
					/* For tradition charsets, single out hk language in case
					   mozilla add hk font option in the future and I don't
					   want to update anything. Yes, hk has special glyphs. */					   
					 /* remove locate hk in v0.4.0.9.2 or later */
					 
					if (curChar in TongWen.zh_encodes["hk"])
						theTextBox.lang = "zh-hk";
					else
						theTextBox.lang = "zh-tw";
				} else {
					theTextBox.lang = "en-US";
				}
			}
		}
	} catch(ex) {
		TongWen.dump("doTextInput: " + ex);
	}
};
// ==========================================================================
TongWen.transClip = function (zhflag)
{
	try {		
		var cliptxt = TongWen.getClipboardContents();		
		cliptxt = TongWen.convZh(cliptxt, zhflag);
		
		var platform = Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler).oscpu;
		platform = platform.toLowerCase();
		
		if (platform.indexOf("win") != -1) {
			cliptxt = cliptxt.replace(/\n/g, "\r\n");
		} else if (platform.indexOf("mac") != -1) {
			cliptxt = cliptxt.replace(/\r\n/g, "\r");
			cliptxt = cliptxt.replace(/\n/g, "\r");
		} else if (platform.indexOf("linux") != -1) {
			cliptxt = cliptxt.replace(/\r\n/g, "\n");
			cliptxt = cliptxt.replace(/\r/g, "\n");
		} else if (platform.indexOf("unix") != -1) {
			cliptxt = cliptxt.replace(/\r\n/g, "\n");
			cliptxt = cliptxt.replace(/\r/g, "\n");
		} else {
			cliptxt = cliptxt.replace(/\r\n/g, "\n");
			cliptxt = cliptxt.replace(/\r/g, "\n");
		}
	
		TongWen.setClipboardContents(cliptxt);
	} catch (ex) {
		TongWen.dump("transClip: " + ex);
	}
};

// ==========================================================================
/*
 * Walk over a Dom Node and do translations.
 */
TongWen.convertTree = function (curDoc, zhflag)
{
	var start_time = null;
	var count_time = null;

	try
	{
		// Convert Title
		curDoc.title = TongWen.convZh(curDoc.title, zhflag);
		
		// Mozilla Thunderbird (Begin)
		if ((typeof currentHeaderData == "object") && (currentHeaderData != null))
		{
			currentHeaderData["subject"].headerValue = curDoc.title;

			var obj = null;
			if (gCollapsedHeaderViewMode)
			{
				obj = document.getElementById("collapsedsubjectValue");
				if (obj) obj.value = curDoc.title;
			}
			else
			{
				obj = document.getElementById("expandedsubjectBox");
				if (obj) obj.headerValue = curDoc.title;
			}
		}
		// Mozilla Thunderbird (End)
	}
	catch(ex)
	{
		TongWen.dump("convertTree: " + ex);
	}
	
	start_time = new Date().getTime();
		
	TongWen.processXpath(curDoc, zhflag);	
	count_time = parseInt(new Date().getTime()- start_time) / 1000;
	
	//apply enforce CSS
	TongWen.enforceCSS(curDoc, zhflag);
		
	//TongWen.dump("convertTree: use inside convert function (XPath).");
	TongWen.dump("convertTree: Convertion time in sec: " + count_time);
	
	// Change text size
	TongWen.textZoom(curDoc);
};


TongWen.tranXpathText = function (curDoc, zhflag) {	
	var strASCII = "";
	for(var i=35;i<256;i++){
		strASCII += String.fromCharCode(i);	
	}
	strASCII = strASCII + ' !\t\n\r';

	// include textarae text()
	//var xpr = '//text()[normalize-space(.)][string-length(translate(., "' + strASCII + '", ""))>0][name(..)!="SCRIPT"][name(..)!="STYLE"]';
	
	//not include textarae text()
	var xpr = '//text()[normalize-space(.)][string-length(translate(., "' + strASCII + '", ""))>0][not(ancestor::script)][not(ancestor::style)][not(ancestor::textarea)]';
	
	var textnodes = curDoc.evaluate(xpr, curDoc,  null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,  null);
	
	/*
	Refs:  pseudo-threading
	
	http://www.nczonline.net/blog/2009/01/13/speed-up-your-javascript-part-1/
	http://cuimingda.com/2009/01/speed-up-your-javascript-part-1.html
	http://ajaxpatterns.org/Scheduling
	http://www.web-articles.info/e/a/title/Multithreading-in--JavaScript/
	http://www.nczonline.net/blog/2009/01/05/what-determines-that-a-script-is-long-running/

	not relate with pseudo-threading, but just for reference,	
	
	Worker threading in JavaScript applies to Firefox 3.5
	https://developer.mozilla.org/En/Using_DOM_workers
	
	Threading
	https://developer.mozilla.org/en/Code_snippets/Threads
	*/
	
	//Begin of external script  
	/*
		Author: MCE
		Significantly rewritten other replacement scripts to noticably improve performance and add pseudo-threading to gradually replace words on larger pages.
		Licensed for unlimited modification and redistribution as long as
		
		this notice is kept intact.		
	*/	
	

	
	/*
	about: setTimeout
	
	https://bugzilla.mozilla.org/show_bug.cgi?id=257454	
	http://ejohn.org/blog/analyzing-timer-performance/
	http://ejohn.org/blog/accuracy-of-javascript-time/
	http://my.opera.com/edvakf/blog/how-to-overcome-a-minimum-time-interval-in-javascript
	http://www.belshe.com/test/timers.html
	*/
	const MillisecondsPauseBetweenBatches = 16;	
	var textnodes_length = textnodes.snapshotLength;
	var gIdx=0;	
	
	function replaceTxtNode(){
		var textnode = null;
		var n=textnodes_length;
		var idx = gIdx;
		var i=0;
		var fn = TongWen.convZh;
		
		while((idx < n) && i <= 100){
			textnode = textnodes.snapshotItem(idx)
			textnode.data = fn(textnode.data, zhflag);
			i++;
			idx++;
		}
		
		if (idx < n){
		//if (textnode != null){
			idx--;
			gIdx = idx;
			GoNow(MillisecondsPauseBetweenBatches);
		}		
	}
	
	function GoNow(WaitUntil){
		window.setTimeout(replaceTxtNode, WaitUntil); 
	}
	GoNow(0);
};

/*
TongWen.tranXpathInput = function (curDoc, zhflag) {
	var curNode2 = null;
	//var elementNodes = curDoc.evaluate("//input[@type='button' or @type='submit' or @type='text' or @type='reset']",
	var elementNodes = curDoc.evaluate('//input',
			    curDoc,
			    null,
			    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
			    null);	
	
	var elementNodes_snapshotLength = elementNodes.snapshotLength;
	for (var i = 0; i <elementNodes_snapshotLength; ++i) {
	    curNode2 = elementNodes.snapshotItem(i);

		if (/[^\x20-\xFF]+/.test(curNode2.value)){
			curNode2.value = TongWen.convZh(curNode2.value, zhflag);
		}	
	}
};
*/

/*
TongWen.tranXpathTextarea = function (curDoc, zhflag) {
	var curNode2 = null;
	var elementNodes = curDoc.evaluate('//textarea',
			    curDoc,
			    null,
			    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
			    null);	
	
	var elementNodes_snapshotLength = elementNodes.snapshotLength;
	for (var i = 0; i <elementNodes_snapshotLength; ++i) {
	    curNode2 = elementNodes.snapshotItem(i);

		if (/[^\x20-\xFF]+/.test(curNode2.value)){
			curNode2.value = TongWen.convZh(curNode2.value, zhflag);
		}	
	}
};
*/

TongWen.tranXpathButton = function (curDoc, zhflag) {
	//translate <button type="button|submit|reset">XXXXXX</button>
	
	//translate only <input type="button|submit|reset" />, without translate input text field and other input type
	//input type = text|password|checkbox|radio|submit|reset|file|hidden|image|button	
	
	var curNode2 = null;
	var elementNodes = curDoc.evaluate("//input[@type='checkbox' or @type='radio' or @type='submit' or @type='reset' or @type='button']",
			    curDoc,
			    null,
			    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
			    null);
	
	var elementNodes_snapshotLength = elementNodes.snapshotLength;
	for (var i = 0; i <elementNodes_snapshotLength; ++i) {
	    curNode2 = elementNodes.snapshotItem(i);

		if (/[^\x20-\xFF]+/.test(curNode2.value)){
			curNode2.value = TongWen.convZh(curNode2.value, zhflag);
		}
	}
};


//ref: http://www.w3.org/TR/html4/interact/forms.html#h-17.4
TongWen.tranXpathInput = function (curDoc, zhflag) {
	var inputs = curDoc.getElementsByTagName("INPUT");
	if (inputs && inputs.length) {
		for (var i = 0; i < inputs.length; i++) {
			var input = inputs[i];
			var inputType = input.getAttribute("type");			
			//The default value for this attribute "type" is "text", if is null, then it is an input text field
						
			if ((inputType =="text") || (inputType == null) ) {
				input.value = TongWen.convZh(input.value, zhflag);
			}
		}
	}
};

TongWen.tranXpathTextarea = function (curDoc, zhflag) {
	var textareas = curDoc.getElementsByTagName("TEXTAREA");
	if (textareas && textareas.length) {
		for (var i = 0; i < textareas.length; i++) {
			var textarea = textareas[i];
			if ((textarea.style.display == "none") || (textarea.style.visibility == "hidden")) {
				continue;
			}else {
				textarea.value = TongWen.convZh(textarea.value, zhflag);
			}
		}
	}
};

//test data: http://www.titan24.com/
//refs: <LINK>
// http://atedev.wordpress.com/2007/07/25/html-%E9%80%A3%E7%B5%90%E6%9C%89%E5%B9%BE%E7%A8%AE/?referer=sphere_related_content/

//convert  title attribute
TongWen.tranXpathTitleAtt = function (curDoc, zhflag) {
	//the node with title attribute but without rel attribute equal to "stylesheet"
	var	xpr = '//*[@title][not(@rel="stylesheet")]';
		
	var allElements = curDoc.evaluate(xpr, curDoc,  null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	
	var allElements_snapshotLength = allElements.snapshotLength;
	
	var tranCache ={};
	
	for (var i = 0; i < allElements_snapshotLength; ++i) {
	    var thisElement = allElements.snapshotItem(i);
		//if (/[^\x00-\xFF]+/.test(thisElement.title)){
			//caching strategy
			if (thisElement.title in tranCache){
				thisElement.title = tranCache[thisElement.title];
			} else {
				tranCache[thisElement.title] = TongWen.convZh(thisElement.title, zhflag);
				thisElement.title = tranCache[thisElement.title];
			}
		//}
	}
};

//convert OPTGROUP[@label] attribute
TongWen.tranXpathLabel = function (curDoc, zhflag) {			
	
	var allElements = curDoc.evaluate(
	    '//OPTGROUP[@label]',
	    curDoc,
	    null,
	    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
	    null);
		
	var allElements_snapshotLength = allElements.snapshotLength;
	var thisElement=null;
	
	for (var i = 0; i < allElements_snapshotLength; i++) {
	    thisElement = allElements.snapshotItem(i);
		thisElement.label = TongWen.convZh(thisElement.label, zhflag);
	}	
};

//TongWen.tranXpathScript = function (curDoc, zhflag) {
	//replace Javascript node
	//var allElements, thisElement;
	//var curDoc = window.document;
	
	/*
	allElements = curDoc.evaluate(
	    '//SCRIPT',
	    curDoc,
	    null,
	    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
	    null);
		
	for (var i = 0; i < allElements.snapshotLength; i++) {
	    thisElement = allElements.snapshotItem(i);
		
		if (/%u/.test(escape(thisElement.text))){
			var txt = TongWen.convZh(thisElement.text, zhflag);
			
			var newJS = curDoc.createElement('script')
			newJS.setAttribute("type","text/javascript")
			newJS.text = txt;			
			thisElement.parentNode.replaceChild(newJS, thisElement);			
		}		
	}
	*/
//};

TongWen.processXpath = function (curDoc, zhflag) {
	curDoc.title = TongWen.convZh(curDoc.title, zhflag);
	
	TongWen.tranXpathText(curDoc, zhflag);
	TongWen.tranXpathButton(curDoc, zhflag);
	
	var enableTranInputText= !TongWen.disableTransInputTextarea;		
		
	if(enableTranInputText){
		TongWen.tranXpathInput(curDoc, zhflag);
		TongWen.tranXpathTextarea(curDoc, zhflag);
	}	
	
	TongWen.tranXpathTitleAtt(curDoc, zhflag);
	TongWen.tranXpathLabel(curDoc, zhflag);	
	//TongWen.tranXpathScript (curDoc, zhflag);
};

TongWen.enforceCSS = function (curDoc, zhflag) {
	var pref_enforceFont_enable = TongWen.getOptions("tongwen.enforcefont.enable" , TongWen.enforceFont_enable);	
	if (!pref_enforceFont_enable) {return;}
	
	TongWen.dump('enforceCSS: Enter');

	var fontFamily = '';
	
	if (zhflag == TongWen.TRAFLAG) {
		fontFamily = TongWen.enforceFont_trad;		//"PMingLiU,MingLiU,\u65b0\u7d30\u660e\u9ad4,\u7d30\u660e\u9ad4";		//PMingLiU,MingLiU,新細明體,細明體
	} else if (zhflag == TongWen.SIMFLAG){
		fontFamily = TongWen.enforceFont_simp;		//"MS Song, \u5b8b\u4f53, SimSun";			//MS Song; 宋体; SimSun
	}

	//remove css if exist
	var obj = curDoc.getElementById('tongwen_font');		  
	if (obj != null){
		obj.parentNode.removeChild(obj);
	}
	
	var newStyle= curDoc.createElement('link');
	newStyle.id = 'tongwen_font';
	newStyle.rel='stylesheet'; 
	
	var utf8_to_b64 = function (str){
		return btoa(unescape(encodeURIComponent( str )));
	};	
	
	var newStyles='* {  font-family: ' + fontFamily + ' !important ;} ';
	
	//newStyle.href='data:text/css;base64,' + utf8_to_b64(newStyles);
	newStyle.href='data:text/css;charset=utf-8;base64,' + utf8_to_b64(newStyles);
	
	var nodes = curDoc.documentElement.getElementsByTagName("head");
	
	if (nodes.length > 0){
		nodes[0].appendChild(newStyle);
	}
};

TongWen.convZh = function (itxt, zhflag)
{
	var zhmap = null;
	var zhtab = null;
	var zhmax = null;
	
	if (zhflag == "traditional"){
		zhmap = TongWen.s_2_t;	
		zhtab = TongWen.s_2_t_phrase;
		zhmax =	TongWen.s_2_t_PreCount;
	} else {
		zhmap = TongWen.t_2_s;
		zhtab = TongWen.t_2_s_phrase;
		zhmax =	TongWen.t_2_s_PreCount;
	}
	
	//var s='', p='', q= '';
	
	itxt = itxt.replace(/[^\x00-\xFF]/g,  function(s){
					return (s in zhmap)?zhmap[s]:s;
				});
				
	itxt = itxt.replace(/[^\s][^\x00-\xFF\uFF0C]{1,}/g,  function(s){
					var o = '';
					var n = s.length;

					for (var i=0, N=n, zhPhrase = zhmax, zhTab=zhtab; i < N; ++i) {
							if  (!((s.substr(i, 2)) in zhPhrase)) {
								//o += s.charAt(i);
								o += s[i];
								continue;
							}
							
							var p = s.substr(i, 2);
							var m = zhmax[p];							
							var offset = 1;
							
							for(var j=m; j>2; j--){
								//var q = s.substr(i, j); 
								if (s.substr(i, j) in zhTab){
									p = s.substr(i, j);
									offset= j-1;
									break;
								}
							}
							i += offset;
							o += zhTab[p];
					}
					return o;
				});

	return 	itxt;
};