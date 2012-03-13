var isDebug = true;

function debug(msg) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
						.getService(Components.interfaces.nsIConsoleService);	
	if 	(isDebug){
		consoleService.logStringMessage("TongWen redim: " + msg);
	}
}

/*
function showConsole() {
  window.open("chrome://global/content/console.xul", "_blank",
  "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
}
*/

var redim_Data = {
	flag: 's2t',
	
	treeData: {
		's2t': new TreeData(),
		't2s': new TreeData()		
	},

	gMap: {
		's2t': new MapData(),
		't2s': new MapData()
	},
	
	setTreeDataCols: function(cols){
		this.treeData['s2t'].setColumns(cols);
		this.treeData['t2s'].setColumns(cols);
	},
	
	getFlag: function(){
		return this.flag;
	},
	
	setFlag: function(iflag){
		this.flag = (iflag == 's2t') ? 's2t': 't2s';
	},
	
	getTreeData: function(){
		return this.treeData[this.flag];
	},
	
	getTreeAry: function(iflag){
		var aflag = (iflag == 's2t') ? 's2t': 't2s';
		return this.treeData[aflag].datatable;
	},
	
	add: function(key, val){
		var ary = [key, val];
		
		this.treeData[this.flag].add(ary);		
		this.gMap[this.flag].add(key, val);
	},		

	removeFromIdx:function(idx){	
		var key1 = this.treeData[this.flag].getKey(idx);

		//remove gMap properties
		this.gMap[this.flag].remove(key1);
		
		//remove treeData array
		this.treeData[this.flag].remove(idx);
		
	},
	
	update: function(idx, ary){
		this.treeData[this.flag].update(idx, ary);

		var key = ary[0];
		var val = ary[1];
		this.gMap[this.flag].update(key,val);
	},
	
	exists:function(key){
		return (this.gMap[this.flag].exists(key));
	},	
	
	addMapItem:function(key, val){
		this.gMap[this.flag].add(key, val);
	},
	
	removeMapItem:function(key){
		this.gMap[this.flag].remove(key);
	},
	
	getMapItem:function(iflag){
		var aflag = (iflag == 's2t') ? 's2t': 't2s';
		return this.gMap[aflag].obj;
	},
	
	reset:function(){
		this.treeData['s2t'] = new TreeData();
		this.treeData['t2s'] = new TreeData();
		this.gMap['s2t'] = new MapData();
		this.gMap['t2s'] = new MapData();
	},
	
	clear:function(){
		this.treeData[this.flag] = new TreeData();
		this.gMap[this.flag] = new MapData();
	}
};

function disableOption(flag){
	document.getElementById('rdRedimPhrase-s2t').disabled = (flag == 's2t') ? true: false;
	document.getElementById('rdRedimPhrase-t2s').disabled = (flag == 't2s') ? true: false;
}

function redim_loadTable(str){		
	if (str.length==0){return false;}
	var start_time = new Date().getTime();
	
	var tmpAry = str.split("\n");
		
	for(var i=0;i < tmpAry.length;i++){
		var val = tmpAry[i].split("\t");
		
		redim_Data.add(val[0], val[1]);
	}
		
	var count_time = parseInt(new Date().getTime() - start_time) / 1000;
	debug('redim_loadTable sec :'  + count_time);	
}

function redim_loadTableFromObj(obj){
	var start_time = new Date().getTime();
	
	for(var key in obj){
		redim_Data.add(key, obj[key]);
	}
	
	var count_time = parseInt(new Date().getTime() - start_time) / 1000;
	debug('redim_loadTableFromObj sec :'  + count_time);
}

function enableRedimPhrase(bol){
	// enable/disable txtbox
	var ary = ["rdRedimPhraseMode", "treeRedimPhrase", "txtRedimPhrase_keyphrase", "txtRedimPhrase_mapphrase", 
				"btnRedimPhraseAdd", "btnRedimPhraseEdit", "btnRedimPhraseDel", "btnRedimphraseSetting"];

	for (var i = 0; i < ary.length; i++)
	{
		var obj = document.getElementById(ary[i]);
		if (obj){
			obj.disabled = !bol;
		}
	}
	
	//update status of check box	
	document.getElementById("chkRedimPhrase").checked = bol;	
}

function reloadRedimPhrase_check(flag){		
	if (flag == redim_Data.getFlag()) {return;}	
	redim_Data.setFlag(flag);
	//disableOption(flag);	
	//alert(flag);
	
	var tree  = document.getElementById('treeRedimPhrase');
	tree.view = new treeView(redim_Data.getTreeData());
	
	updateRedimPhraseBtnStatus();
}

function redimphrase_setSelectTreeItem(){
	try {
		var tree  = document.getElementById('treeRedimPhrase');
		var nSelectIndex = tree.currentIndex;
		
		if(nSelectIndex == -1) {return;}
		
		var txt1 = document.getElementById('txtRedimPhrase_keyphrase');
		var txt2 = document.getElementById('txtRedimPhrase_mapphrase');
		
		//for single selection
		var cols0 = tree.columns ? tree.columns['cols0'] : 'cols0';
		var cols1 = tree.columns ? tree.columns['cols1'] : 'cols1';
		
		var val = new Array();
		
		val[0] = tree.view.getCellText(nSelectIndex, cols0);
		val[1] = tree.view.getCellText(nSelectIndex, cols1);	
		//for single selection

		//var text = val.join(" ");
		//tree.view.selection.select(0);
		
		txt1.value = val[0];
		txt2.value = val[1];
	} catch (ex){
		debug("redimphrase_setSelectTreeItem error:" + ex);
	}
}

function redimphrase_keyEvent(aEvent){
	var keytext = "";
	var akeycode = aEvent.keyCode;
	
	// pressed Delete
	if (akeycode == aEvent.DOM_VK_DELETE){
		//debug('delete key is pressed');
		delRedimPhrase();
	}
	
	// pressed Ctrl +A
	if ((akeycode == aEvent.DOM_VK_A) && (aEvent.ctrlKey)) {
		selectAllRedimPhrase();
	}
}

function selectAllRedimPhrase(){
	var tree  = document.getElementById('treeRedimPhrase');
	
	var selectSingle = tree.view.selection.single;
		
	if(!selectSingle){
		tree.focus();		//unknow bug???, need to set focus before selectall treeitem
		tree.view.selection.selectAll();
	}else {
		debug("tree.view.selection.single " + selectSingle);
	}
}

function getSelectItemIdx(tree) {
	var aSeletedItems = new Array();
	var selection = tree.view.selection;
		
	var rc = selection.getRangeCount();
		
	for (var i=0; i < rc; ++i) {
		var min = {};
		var max = {};
	    selection.getRangeAt(i, min, max);
		
	    for (var j = min.value; j <= max.value; ++j) {
			aSeletedItems.push(j);
	    }
	}

	//debug code only
	//debug('selectitem: ' + aSeletedItems.toString());
	
	return aSeletedItems;
}

function str_escape(str){
	str = str.replace(/[\n\r\t\x20]/g, "");
	str = str.replace(/^\s+|\s+$/g, "");	//trim string
	//str = str.replace(/=>/g, '\uff1d\uff1e');
	return str;
}

function addRedimPhrase(){		
	var tree  = document.getElementById('treeRedimPhrase');
	var txt1 = document.getElementById('txtRedimPhrase_keyphrase').value;
	var txt2 = document.getElementById('txtRedimPhrase_mapphrase').value;
		
	txt1 = str_escape(txt1);
	txt2 = str_escape(txt2);
	
	if (txt1.length == 0 || txt2.length == 0) {return;}
		
	//format check
	/*
	var is_non_ascii_phrase = /[^\n\r\t\x20]{0,1}[^\x00-\xFF\uFF0C]{1,}/g;
	var regtest = is_non_ascii_phrase.test(txt1);		
		
	if (!regtest){
		debug('add fail: (key, val) = '  + txt1 + '=>' + txt2);
		return;
	}
	*/
	
	if (redim_Data.exists(txt1))  {return;}	
	
	redim_Data.add(txt1, txt2);	
	tree.view = new treeView(redim_Data.getTreeData());  // current flag = 's2t'
	
	updateRedimPhraseBtnStatus();
}

function editRedimPhrase(){	
	var tree  = document.getElementById('treeRedimPhrase');
	var nSelectIndex = tree.currentIndex;
	var numOfRows = tree.view.rowCount;
	var selectionCount = tree.view.selection.count;
	
	if (numOfRows == 0) {return;}
	if (selectionCount <= 0){return;}
		
	var txt1 = document.getElementById('txtRedimPhrase_keyphrase').value;
	var txt2 = document.getElementById('txtRedimPhrase_mapphrase').value;
	
	txt1 = str_escape(txt1);
	txt2 = str_escape(txt2);
	
	if (txt1.length == 0 || txt2.length == 0) {return;}

	/*
	var reg_phrase_test = /[^\x00-\xFF\uFF0C]{1,}/g;

	if (!reg_phrase_test.test(txt1)){
		debug('edit fail: (key, val) = '  + txt1 + '=>' + txt2);
		return;
	}
	*/	
	
	if (txt1.length == 1){
		if (txt1.charCodeAt(0) <= 255){			
			debug('edit fail2: (key, val) = '  + txt1 + '=>' + txt2);
			return;
		}
	}
	
	//for single selection
	var cols_key = tree.columns ? tree.columns['cols0'] : 'cols0';
	var cols_map = tree.columns ? tree.columns['cols1'] : 'cols1';
		
	var val = new Array();

	val[0] = tree.view.getCellText(nSelectIndex, cols_key);
	val[1] = tree.view.getCellText(nSelectIndex, cols_map);	
	//for single selection

	//if key phrase is complete change, delete old map item ref, & add current item ref
	if(txt1 != val[0]){		
		redim_Data.removeMapItem(val[0]);		
		redim_Data.addMapItem(val[0], val[1]);
		//redim_Data.add(txt1, txt2);
	}
	
	var ary = [txt1, txt2];
	
	redim_Data.update(nSelectIndex, ary);	
	
	tree.view.selection.tree.invalidateRow(nSelectIndex);
}

function delRedimPhrase(){	
	var tree  = document.getElementById('treeRedimPhrase');
	
	var numOfRows = tree.view.rowCount;
	var selectionCount = tree.view.selection.count;
	
	//debug('numOfRows: ' + numOfRows);
	//debug('selectionCount: ' + selectionCount);
	
	if (numOfRows == 0) {return;}
	if (selectionCount <= 0){return;}
	
	var ary = getSelectItemIdx(tree);
	
	//debug('ary: ' + ary.toString());
		
	//because ary length decrease while delete ary item, so must descending delete to get right position.
	for(var i=ary.length-1; i >=0 ; i--){
		redim_Data.removeFromIdx(ary[i]);		
	}
		
	tree.view = new treeView(redim_Data.getTreeData());  // bind to tree
	//debug('delete item: ' + txt1 + "=>" +txt2);

	updateRedimPhraseBtnStatus();
}

function readAsDOM(strURL){
	var xmlhttp = new XMLHttpRequest();	
	xmlhttp.open("GET", strURL, false);	
	xmlhttp.send(null);
		
	var xmldoc = xmlhttp.responseXML;

	var nodes = xmldoc.documentElement.childNodes;		
	
	var s=null, r=null;

	var importPhrase_s2t = {};
	var importPhrase_t2s = {}; 

	for(var i=0;i < nodes.length;i++){
		var langNodename = nodes[i].nodeName;
	
		if ( (langNodename == "traditional") || (langNodename == "simplified") ){
			var phraseNode = nodes[i].getElementsByTagName("phrase");
			//debugprint(listMember(phraseNode));

			for(var j=0; j < phraseNode.length; j++){
				//print(listMember(phraseNode[j]));
				
				var subnode = phraseNode[j].childNodes;
				
				var aMap ={"s": "",	"r": ""};
				
				for(var k=0; k < subnode.length; k++){
					// debugprint(subnode[k].nodeName);
					// debugprint(subnode[k].textContent);									
					aMap[subnode[k].nodeName] = subnode[k].textContent;
				}
				
				if (langNodename == "traditional") { importPhrase_s2t[aMap["s"]] = aMap["r"]; }
				if (langNodename == "simplified") { importPhrase_t2s[aMap["s"]] = aMap["r"]; }
			}
		}
	}
		
	//debug only!
	//alert('importPhrase_s2t: \n\n' + listMember(importPhrase_s2t));	
	//alert('importPhrase_t2s: \n\n' + listMember(importPhrase_t2s));
	//alert('debugtxt: \n' + debugtxt);
	
	//append a  item to  tree

	//store currFlag
	var curFlag = redim_Data.getFlag();
	
	redim_Data.setFlag('s2t');
	redim_loadTableFromObj(importPhrase_s2t);
	
	redim_Data.setFlag('t2s');
	redim_loadTableFromObj(importPhrase_t2s);
	
	//restore currFlag
	redim_Data.setFlag(curFlag);
	
	//redraw tree
	var tree  = document.getElementById('treeRedimPhrase');
	tree.view = new treeView(redim_Data.getTreeData());
	
	updateRedimPhraseBtnStatus();
}

function importOldRedimPhrase(){
	var dialogTitle = tongwenStrRes.getString("msg_import_window_title");
	var dialogFileTypeText = tongwenStrRes.getString("msg_xml_filetypetext");	
	//var dialogTitle = "Import ...";
	//var dialogFileTypeText = "UTF-8 encoding XML file ( *.xml)";
	var diaglogFileEntension = "*.xml";
	var diaglogDefaultFilename = "tongwen";
	var diaglogDefaultFileExtension = "xml";
	
	var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	fpicker.init(window, dialogTitle, fpicker.modeOpen);
	fpicker.defaultExtension = diaglogDefaultFileExtension;	
	fpicker.appendFilter(dialogFileTypeText , diaglogFileEntension);
	fpicker.appendFilters(fpicker.filterAll);
	fpicker.defaultString = diaglogDefaultFilename;
	
	var showResult = fpicker.show();
	if (showResult == fpicker.returnOK) {
		var filepath = fpicker.file.path;		//C:\xxx.abc
		//var filepath = fpicker.fileURL.spec;				//file:///C:/xxx.abc
		
		//debug code only!, print file path
		debug(filepath);

		// old tongwen extra-phrase table format
		//read xml file
		readAsDOM(fpicker.fileURL.spec);
	}
}

function getPlatLinebreak(){
	var platform = Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler).oscpu;
	platform = platform.toLowerCase();
	
	var linebreak = "\n";
	
	if (platform.indexOf("win") != -1) {
		linebreak ="\r\n"; 
	} else if (platform.indexOf("mac") != -1) {
		linebreak ="\r";
	} else if (platform.indexOf("linux") != -1) {
		linebreak ="\n";
	} else if (platform.indexOf("unix") != -1) {
		linebreak ="\n";
	} else {
		linebreak ="\n";
	}
	
	return linebreak;
}

function getAllRedimPhrase(){
	var redimPhrase_s2t = redim_Data.getMapItem('s2t');
	var redimPhrase_t2s = redim_Data.getMapItem('t2s');
	
	var s2t_content = [];
	var t2s_content = [];
		
	for (var key in redimPhrase_s2t){
		s2t_content[s2t_content.length] = "<phrase><s>" + key + "</s><r>" + redimPhrase_s2t[key] + "</r></phrase>" ;
	}
	
	for (var key in redimPhrase_t2s){
		t2s_content[t2s_content.length] = "<phrase><s>" + key + "</s><r>" + redimPhrase_t2s[key] + "</r></phrase>" ;
	}
	
	var linebreak = getPlatLinebreak();	
	var otxt = '<?xml version="1.0" encoding="UTF-8"?>' + linebreak + 
				'<manifest>' + linebreak +
						'<traditional>' + linebreak + 
							s2t_content.join(linebreak)  + linebreak + 
						'</traditional>' + linebreak +
						'<simplified>' + linebreak + 
							t2s_content.join(linebreak)  + linebreak + 
						'</simplified>' + linebreak + 
				'</manifest>';
	
	return otxt;
}

function exportOldRedimPhrase(){
	var dialogTitle = tongwenStrRes.getString("msg_export_window_title");	
	var dialogFileTypeText = tongwenStrRes.getString("msg_xml_filetypetext");	
	//var dialogTitle = "Export ...";
	//var dialogFileTypeText = "UTF-8 encoding XML file ( *.xml)";
	var diaglogFileEntension = "*.xml";
	var diaglogDefaultFilename = "tongwen";
	var diaglogDefaultFileExtension = "xml";
	
	var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	fpicker.init(window, dialogTitle, fpicker.modeSave);
	fpicker.defaultExtension = diaglogDefaultFileExtension;
	fpicker.appendFilter(dialogFileTypeText , diaglogFileEntension);
	fpicker.appendFilters(fpicker.filterAll);
	fpicker.defaultString = diaglogDefaultFilename;
	
	var showResult = fpicker.show();	
	if ((showResult == fpicker.returnOK) || (showResult == fpicker.returnReplace)){
		var filepath = fpicker.file.path;
		
		//debug code only!, print file path
		debug("export old file path: \n"+ filepath);
		
		try {
			var savetxt = getAllRedimPhrase();
			
			f = TongWen.FileUtils.open(filepath);
			var saveOK = TongWen.FileUtils.write(f, savetxt, "w", "UTF-8");
		
			if (saveOK != false){
				//debug only!
				//alert(savetxt);
			}
		}catch (ex) {
			debug("exportOldRedimPhrase: \n" + ex);
		}
	}
}

function isShowRedimPhrase(){
	var isShowRedimPhrasePop = document.getElementById("chkRedimPhrase").checked;	
	if (!isShowRedimPhrasePop) { return false;}
	
	redim_setPopup();
	
	return isShowRedimPhrasePop;
}

function redim_setPopup(){
	var tree  = document.getElementById('treeRedimPhrase');	
	var numOfRows = tree.view.rowCount;

	//if isEnable popup filter, then update status of menu item	
	var isNoData = (numOfRows == 0);	
	var objSelectAll, objDelete;
	
	objSelectAll = document.getElementById("contentRedimphrase_selectall");
	objSelectAll.setAttribute("disabled", isNoData);

	objDelete = document.getElementById("contentRedimphrase_delete");
	objDelete.setAttribute("disabled", isNoData);	
}

function ary_to_string(aAry){
	var tmpAry = new Array();
	var val = new Array();	
	
	for(var i=0; i <aAry.length; i++){
		val[0] = aAry[i][0];
		val[1] = aAry[i][1];
		
		tmpAry[i] = val.join("\t");
	}
	
	return tmpAry.join("\n");	
}

/*
function saveToFile(savetxt, filepath, charset){			
	var f = TongWen.FileUtils.open(filepath);
	var saveOK = TongWen.FileUtils.write(f, savetxt, "w", charset);
	
	return saveOK;
}
*/

function saveRedimPhrase(){
	var ary_s2t = redim_Data.getTreeAry('s2t');
	var ary_t2s = redim_Data.getTreeAry('t2s');
	
	var str_s2t = ary_to_string(ary_s2t);
	var str_t2s = ary_to_string(ary_t2s);

	// for develper only, debug code
	//debug('str_s2t:\n' + str_s2t);
	
	// save checkbox option
	var bolEnableRedimphrase = document.getElementById("chkRedimPhrase").checked	
	TongWen.setOptions("tongwentang.redefinephrase.enable", bolEnableRedimphrase);
	
	TongWen.setUnicodePref("tongwentang.redefinephrase.s2t", str_s2t);
	TongWen.setUnicodePref("tongwentang.redefinephrase.t2s", str_t2s);
	
	TongWen.setUnicodePref("tongwentang.redefinephrase2.s2t", convertToInterFormat(ary_s2t, 's2t'));
	TongWen.setUnicodePref("tongwentang.redefinephrase2.t2s", convertToInterFormat(ary_t2s, 't2s'));
	
	// for develper only, debug code
	/*
	var fpath = '';	
	fpath = 'C:\\s2t.txt';	
	saveToFile( convertToInterFormat(ary_s2t, 's2t'), fpath, "UTF-8");
	
	fpath = 'C:\\t2s.txt';
	saveToFile( convertToInterFormat(ary_t2s, 't2s'), fpath, "UTF-8");
	*/
}

function convertToInterFormat(aAry, flag){
	var zhmap = (flag == 's2t') ? TongWen.s_2_t : TongWen.t_2_s;
	var convertZh = function(s){
						return ((s in zhmap)?zhmap[s]:s);
					};	
	var p = '';
	
	var tmpAry = new Array();
	var val = new Array();
	
	for(var i=0; i <aAry.length; i++){
		val[0] = aAry[i][0];
		val[1] = aAry[i][1];
		
		if (val[0].length > 1){
			val[0] = val[0].replace(/[^\x00-\xFF]/g, convertZh);
		}
		
		tmpAry[i] = val.join("\t");
	}
	
	return tmpAry.join("\n");	

	/*
	//testing code only
	var zhmap = TongWen.t_2_s;
	var convertZh = function(s){
						return ((s in zhmap)?zhmap[s]:s);
					};
					
	var itxt = document.form1.txtinput.value;	
	itxt = itxt.replace(/[^\x00-\xFF]/g, convertZh);	
	
	debug(itxt);	
	*/
}

function updateRedimPhraseBtnStatus(){
	var tree  = document.getElementById('treeRedimPhrase');
	var rowCount = tree.view.rowCount;
	
	var bolEnableRedimphrase = document.getElementById("chkRedimPhrase").checked;
		
	document.getElementById('btnRedimPhraseEdit').disabled = (rowCount == 0) && bolEnableRedimphrase;
	document.getElementById('btnRedimPhraseDel').disabled = (rowCount == 0) && bolEnableRedimphrase;
}

function loadDefaultRedimPhrase(){
	var importPhrase_s2t ={
		"\u6253\u5370\u673a": "\u5370\u8868\u6a5f", 
		"\u6570\u636e\u5e93": "\u8cc7\u6599\u5eab", 
		"\u670d\u52a1\u5668": "\u4f3a\u670d\u5668", 
		"\u5185\u5b58": "\u8a18\u61b6\u9ad4", 
		"\u6253\u5370": "\u5217\u5370", 
		"\u5149\u76d8": "\u5149\u789f", 
		"\u786c\u76d8": "\u786c\u789f", 
		"\u78c1\u76d8": "\u78c1\u789f", 
		"\u8f6f\u76d8": "\u8edf\u789f", 
		"\u8f6f\u4ef6": "\u8edf\u9ad4", 
		"\u786c\u4ef6": "\u786c\u9ad4", 
		"\u7f51\u7edc": "\u7db2\u8def", 
		"\u8d26\u53f7": "\u5e33\u865f" 
	};

	var importPhrase_t2s ={
		"\u5370\u8868\u6a5f": "\u6253\u5370\u673a", 
		"\u8cc7\u6599\u5eab": "\u6570\u636e\u5e93", 
		"\u4f3a\u670d\u5668": "\u670d\u52a1\u5668", 
		"\u8a18\u61b6\u9ad4": "\u5185\u5b58", 
		"\u5217\u5370": "\u6253\u5370", 
		"\u5149\u789f": "\u5149\u76d8", 
		"\u786c\u789f": "\u786c\u76d8", 
		"\u78c1\u789f": "\u78c1\u76d8", 
		"\u8edf\u789f": "\u8f6f\u76d8", 
		"\u8edf\u9ad4": "\u8f6f\u4ef6", 
		"\u786c\u9ad4": "\u786c\u4ef6", 
		"\u7db2\u8def": "\u7f51\u7edc" 
	};

	//redim_loadTableFromObj

	//store currFlag
	var curFlag = redim_Data.getFlag();
	
	redim_Data.setFlag('s2t');
	redim_loadTableFromObj(importPhrase_s2t);
	
	redim_Data.setFlag('t2s');
	redim_loadTableFromObj(importPhrase_t2s);
	
	//restore currFlag
	redim_Data.setFlag(curFlag);
	
	//redraw tree
	var tree  = document.getElementById('treeRedimPhrase');
	tree.view = new treeView(redim_Data.getTreeData());
	
	updateRedimPhraseBtnStatus();
}

// Window OnLoad
function redimPhraseMain_init()
{
	//showConsole();
	var opt_s2t = TongWen.getUnicodePref("tongwentang.redefinephrase.s2t");
	var opt_t2s = TongWen.getUnicodePref("tongwentang.redefinephrase.t2s");
	
	try{	
		redim_Data.setFlag('t2s');
		redim_loadTable(opt_t2s);
		
		redim_Data.setFlag('s2t');
		redim_loadTable(opt_s2t);
	}catch(ex){
		debug('redimPhraseMain_init error:' + ex);
	}
	
	// Assign our custom treeview
    var tree  = document.getElementById('treeRedimPhrase');
	
	// current flag = 's2t'
	//disableOption('s2t');
	
	//redim_Data.treeData['s2t'].datacols = {"cols0": 0, "cols1": 1};	
	
	/*
	var cols = redim_Data.treeData['s2t'].datacols;	
	debug(cols.toSource());
	
	var tempObj = redim_Data.treeData['s2t'];
	debug(tempObj.toSource());
	*/
		
    //tree.view = new treeView(tempObj);
	
	tree.view = new treeView(redim_Data.getTreeData());
	
	var bolEnableRedimphrase = TongWen.getOptions("tongwentang.redefinephrase.enable", false);
	enableRedimPhrase(bolEnableRedimphrase);
}