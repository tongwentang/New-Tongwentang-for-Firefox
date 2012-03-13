var isInit = false;
var tongwenStrRes = null;

var tongwenCheckboxObj = {
	"chkInsideTable":true, 
	"chkTextZoomEnable":false, 
	"chkTextZoomStandalone":false, 
	"chkMenu":true, 
	"chkMenuAuto":true, 
	"chkMenuInputSim":true, 
	"chkMenuInputTra":true, 
	"chkMenuPageSim":true, 
	"chkMenuPageTra":true, 
	"chkMenuClipSim":true, 
	"chkMenuClipTra":true, 
	"chkMenuTextZoom":true, 
	"chkMenuSetting":true, 
	"chkFilter":false, 
	"chkMenuIcon":true, 
	"chkRedimPhrase":false, 
	"chkEnableChineseEncodingOnly":true, 
	"chkEnableOppositeCharsetOnly":true, 
	"chkEnableUTF8AutoConvert":true, 
	"chkEnableEnforceFont":false, 
	"chkDisableTransInputTextarea":true
};

var tongwenTextbox = ["zoomPercent", "txtHotkeyPageTra", "txtHotkeyPageSim","txtHotkeyPageAuto"];
var tongwenTextval = ["100", "", "", ""];

var tongwenUnicodeTextbox = ["txtEnforceFont_trad", "txtEnforceFont_simp"];
var tongwenUnicodeTextval = ["", ""];


function enableEnforceFont(bol) {
	var obj = document.getElementById("txtEnforceFont_trad");
	if (obj){
		obj.disabled = !bol;
	}
	
	obj = document.getElementById("txtEnforceFont_simp");
	if (obj){
		obj.disabled = !bol;
	}
}

// ---------------  utility function  ---------------  
function findDirFromFilepath(filepath){
	var tmpAry = filepath.split("\\");	
	tmpAry.pop();	
	return tmpAry.join("\\");
}

function isMSwindows(){
	var platform = Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler).oscpu;
	
	platform = platform.toLowerCase();

	if (platform.indexOf("win")!= -1) {
		return true;
	} else {
		return false;
	}				
}

function makeNsLocalFile(directoryPath){
	var aLocalFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	aLocalFile.initWithPath(directoryPath);	
	return aLocalFile;
}
// ---------------  utility function  ---------------  

function enableToolbarButton(bol){	
	TongWen.setOptions("tongwentang.toolbar.enable", bol);
}

function enableTextZoom(bol) {
	var obj = document.getElementById("zoomPercent");
	if (obj) obj.disabled = !bol;

	obj = document.getElementById("chkTextZoomStandalone");
	if (obj) obj.disabled = !bol;
}
// ----------------------------------------------------------------------------
function enableContextMenu(bol) {
	var obj = document.getElementById("contextMenuItem");
	if (obj) {
		var nodes = obj.getElementsByTagName("checkbox");
		if (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				nodes[i].disabled = !bol;
			}
		}
	}
}

function checkContextMenu(tgo) {
	var obj = document.getElementById("contextMenuItem");
	var bol = false
	if (obj) {
		var nodes = obj.getElementsByTagName("checkbox");
		if (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				bol = nodes[i].checked || bol;
			}
		}
	}
	if (!bol) {
		tgo.checked = true;
		document.getElementById("chkMenu").checked = false;
		enableContextMenu(false);
	}
}

function setHotkeyNullText(){
	var ary = ["txtHotkeyPageTra", "txtHotkeyPageSim", "txtHotkeyPageAuto"];
	var val = "", prefValue = "";
	var obj = null;
	
	for (var i = 0; i < ary.length; i++) {
		obj = document.getElementById(ary[i]);
		if (obj) {
			val = obj.getAttribute("prefstring");
			prefValue = TongWen.getOptions(val, "");
			
			if (prefValue == ""){
				obj.value = obj.getAttribute("defaultNullvalue");
			}
		}
	}	
}

function setHotkey(event, txtbox){
	var keytext = "";
	var akeycode = event.keyCode;
	var txtKeypress = txtbox;
	
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
	
	//if (keytext == 'BACK_SPACE') {
	//	keytext = "";
	//}
	
	txtbox.value = keytext;
}

// ----------------------------------------------------------------------------

function init() {
	//passerby add	
	/*
	if (isInit){
		TongWen.dump("Init is already call");
		return;	
	} else {
		TongWen.dump("Init first call");
		isInit = true;
	}
	*/
	
	TongWen.dump("Settings init: Enter");
	tongwenStrRes = document.getElementById("strRes");

	// var prefs = new Prefs();
	var bol = false;
	var tmp = "";
	
	try {
		var val = "";
		var obj = null;

		obj = document.getElementById("header");
		if (obj) {
			val = obj.getAttribute("description");
			val = val.replace(/%s/g, TongWen.version);
			obj.setAttribute("description", val);
		}
				
		// checkbox		
		for(var checkboxID in tongwenCheckboxObj){
			obj = document.getElementById(checkboxID);			
			if (obj) {
				val = obj.getAttribute("prefstring");
				obj.checked = TongWen.getOptions(val, tongwenCheckboxObj[checkboxID]);
				tongwenCheckboxObj[checkboxID] = obj.checked;
			}		
		}

		// textbox
		for (var i = 0; i < tongwenTextbox.length; i++) {
			obj = document.getElementById(tongwenTextbox[i]);
			if (obj) {
				val = obj.getAttribute("prefstring");
				obj.value = TongWen.getOptions(val, tongwenTextval[i]);
				tongwenTextval[i] = obj.value;
			}
		}

		//for unicode content textbox
		for (var i = 0; i < tongwenUnicodeTextbox.length; i++) {
			obj = document.getElementById(tongwenUnicodeTextbox[i]);
			if (obj) {
				val = obj.getAttribute("prefstring");				
				tongwenUnicodeTextval[i] = TongWen.getUnicodePref(val, tongwenUnicodeTextval[i]);
				obj.value = tongwenUnicodeTextval[i];
			}
		}		
		
		enableTextZoom(tongwenCheckboxObj["chkTextZoomEnable"]);
		enableContextMenu(tongwenCheckboxObj["chkMenu"]);
		enableFilter(tongwenCheckboxObj["chkFilter"]);
		
		//set enable enforce font
		enableEnforceFont(tongwenCheckboxObj["chkEnableEnforceFont"]);
		
		setHotkeyNullText();
		
		//passerby add
		// loading Redefine phrase setting
		// i don't know what wrong for loading problem, if this code is behind loadFilter function, then sometime redimphrase can't load ????
		redimPhraseMain_init();
		
		loadFilter();
		
	} catch(ex) {
		TongWen.dump("settings init:   error " + ex);
	}
}

function accept() {
	TongWen.dump("Settings accept: Enter");
	var isOT = false, isUET = false;
	var val = "";
	var obj = null;
	
	try {
		// checkbox
		for(var checkboxID in tongwenCheckboxObj){
			obj = document.getElementById(checkboxID);
			if (obj) {
				val = obj.getAttribute("prefstring");
				TongWen.setOptions(val, obj.checked);
				tongwenCheckboxObj[checkboxID] = obj.checked;
			}
		}	

		// textbox
		for (var i = 0; i < tongwenTextbox.length; i++) {
			obj = document.getElementById(tongwenTextbox[i]);
			if (obj) {			
				val = obj.getAttribute("prefstring");
				tongwenTextval[i] = obj.value;

				switch(tongwenTextbox[i]){
					case 'zoomPercent':
						tongwenTextval[i] = parseInt(obj.value);
						break;
					case 'txtHotkeyPageTra':					
					case 'txtHotkeyPageSim':
					case 'txtHotkeyPageAuto':
						var nulltext = 	obj.getAttribute("defaultNullvalue");						
						//alert('obj.value = ' + obj.value + '\n' + 'nulltext = ' + nulltext);
						
						if (obj.value == nulltext){
							tongwenTextval[i] = "";
						}
						break;
					default:
				}
				
				TongWen.setOptions(val, tongwenTextval[i]);				
			}
		}

		// unicode textbox
		for (var i = 0; i < tongwenUnicodeTextbox.length; i++) {
			obj = document.getElementById(tongwenUnicodeTextbox[i]);
			if (obj) {
				val = obj.getAttribute("prefstring");
				tongwenUnicodeTextval[i] = obj.value;
				//TongWen.setUnicodePref(val, tongwenUnicodeTextval[i]);
				TongWen.setUnicodePref(val, obj.value);
			}
		}		

		//passerby add
		// save Redefine phrase setting
		saveRedimPhrase();		
		saveFilter();		
		
		TongWen.setOptions("tongwentang.reloadSetting", true);

		
		return true;
	} catch(ex) {
		TongWen.dump("settings accept:  " + ex);
		return true;
	}
}

function ondialog_cancel(){

}

function resetHotkey(objID){
	var obj = document.getElementById(objID);
	//obj.value = "";
	obj.value = obj.getAttribute("defaultNullvalue");
}

//passerby add
//if (!isInit){init();}