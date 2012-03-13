function enableFilter(bol)
{
	var ary = ["listFilter", "filterURL", "filterZhFlag", "filterZoomPercent", "btnFilterAdd", "btnFilterEdit", "btnFilterDel", "btnFilterSetting"];
	var obj = null;
	for (var i = 0; i < ary.length; i++)
	{
		obj = document.getElementById(ary[i]);
		if (obj) obj.disabled = !bol;
	}
	
	document.getElementById("popFilterSetting").hidden = !bol;
	
	
	//set disable for popup menuitem
	var ary2  = ["contentFilter_import", "contentFilter_export", "contentFilter_export2"];
	for (var i = 0; i < ary2.length; i++)
	{
		obj = document.getElementById(ary2[i]);
		if (obj) {
			obj.setAttribute("disabled", !bol);
		}
	}	
}

function setEditFilter()
{
	var obj  = document.getElementById('listFilter');
	var ary  = ["filterURL", "filterZhFlag", "filterZoomPercent"];
	var nodes = null;
	
	var isSelectedItem = (obj.selectedCount > 0);
	
	if (isSelectedItem){
		nodes = obj.selectedItem.childNodes;
		
		var val = "";
		for (var i = 0; i < nodes.length; i++)
		{
			val = nodes[i].getAttribute("value");
			obj = document.getElementById(ary[i]);
			obj.value = val;
		}
	}
}

function loadFilter()
{	
	var obj  = document.getElementById('listFilter');
	var filter = TongWen.getOptions(obj.getAttribute("prefstring"), "");	
	
	//passerby add
	// prevent undefined listitem display in first installation, 	
	//alert('filter: \n' + filter + '\n typeof: \n' + typeof(filter));
	
	if (typeof(filter) != "string") {return;}
	if (filter.length == 0){return;}	
	// end passerby add		
	
	var ary = [
		["", "", false, false],
		["", "", false, false],
		["", "", false, false]
	];
		
	var msg_filter_conv_off = tongwenStrRes.getString("msg_filter_conv_off");
	var msg_filter_conv_simp = tongwenStrRes.getString("msg_filter_conv_simp");
	var msg_filter_conv_trad = tongwenStrRes.getString("msg_filter_conv_trad");
			
	var msg_filter_conv = {
		'msg_filter_conv_off': msg_filter_conv_off,
		'msg_filter_conv_simp': msg_filter_conv_simp,
		'msg_filter_conv_trad': msg_filter_conv_trad
	};
	
	var val = null, item = null;
	var nodes = filter.split("\n");
	
	//debug(nodes.length);
	
	var msg_filter_textzoom_off = tongwenStrRes.getString("msg_filter_textzoom_off");
	var msg_percent = tongwenStrRes.getString("msg_percent");
		
	for (var i = 0; i < nodes.length; i++)
	{
		val = nodes[i].split("\t");
		ary[0][0] = ary[0][1] = val[0];
		
		ary[1][0] = (val[1] == "")? msg_filter_conv_off : msg_filter_conv["msg_filter_conv_" + val[1]];
		ary[1][1] = val[1];
		
		ary[2][0] = (val[2] == "")? msg_filter_textzoom_off: val[2] + " " + msg_percent;
		ary[2][1] = val[2];
		
		item = createItem(ary);
		obj.appendChild(item);
		//obj.appendChild(createItem(ary));
	}
}

function saveFilter()
{
	var obj  = document.getElementById('listFilter');
	var nodes = obj.getElementsByTagName("listitem");
	var filter = [], val = [];
	
	for (var i = 0; i < nodes.length; i++)
	{
		val[0] = nodes[i].childNodes[0].getAttribute("value");
		val[1] = nodes[i].childNodes[1].getAttribute("value");
		val[2] = nodes[i].childNodes[2].getAttribute("value");
		filter[filter.length] = val.join("\t");
	}
	val = obj.getAttribute("prefstring");
	TongWen.setOptions(val, filter.join("\n"));
}

/**
 * Create cell
 **/

function createCell(label, value, isCheckbox, checked)
{
	const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	var cell = document.createElementNS(XULNS, "listcell");
	cell.setAttribute("label", label);
	cell.setAttribute("value", value);
	if (isCheckbox)
	{
		cell.setAttribute("type", "checkbox");
		cell.setAttribute("checked", checked ? "true" : "false");
	}
	return cell;
}

function createItem(ary)
{
	const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	var item  = document.createElementNS(XULNS, "listitem");
	var cell  = null;
	for (var i = 0; i < ary.length; i++)
	{
		cell = createCell(ary[i][0], ary[i][1], ary[i][2], ary[i][3]);
		item.appendChild(cell);
	}
	return item;
}

function getUserInput() {
	var ary = [
		['', '', false, false],
		['', '', false, false],
		['', '', false, false]
	];
	var obj = document.getElementById("filterURL");
	if (obj)
	{
		if (obj.value == "")
		{
			alert(tongwenStrRes.getString("msg_filter_input_url"));
			obj.focus();
			return;
		}
		ary[0][0] = obj.value;
		ary[0][1] = obj.value;
	}

	var obj2 = document.getElementById("filterZhFlag");
	if (obj2)
	{
		ary[1][0] = obj2.label;
		ary[1][1] = obj2.value;
	}

	var obj3 = document.getElementById("filterZoomPercent");
	if (obj3){
		ary[2][0] = (obj3.value == "") ? tongwenStrRes.getString("msg_filter_textzoom_off") : obj3.value + " %";
		ary[2][1] = obj3.value;
	}
	return ary;
}

function addFilter()
{
	var obj  = document.getElementById('listFilter');
	var ary  = getUserInput();
	var strFilterURL = document.getElementById("filterURL").value;
	
	if (strFilterURL.length > 0){
		var item = createItem(ary);
		obj.appendChild(item);
	}
}

function editFilter()
{
	var obj  = document.getElementById('listFilter');
	var strFilterURL = document.getElementById("filterURL").value;
	var ary  = getUserInput();
	
	var isSelectedItem = (obj.selectedCount > 0);
	
	if (isSelectedItem && (strFilterURL.length > 0)){
		var item = createItem(ary);
		obj.replaceChild(item, obj.selectedItem);
	}
}

function delFilter()
{
	var obj  = document.getElementById('listFilter');
	
	var isSelectedItem = (obj.selectedCount > 0);
	if (isSelectedItem){
		var items = obj.selectedItems;
		for (var i = items.length - 1; i >= 0; --i) {
			obj.removeChild(items[i]);
		}
	}
}

function colneItem(item)
{
	var nodes = item.childNodes;
	var ary = [
		['', '', false, false],
		['', '', false, false],
		['', '', false, false]
	];
	for (var i = 0; i < nodes.length; i++)
	{
		ary[i][0] = nodes[i].getAttribute("label");
		ary[i][1] = nodes[i].getAttribute("value");
	}
	return createItem(ary);
}

function upFilter()
{
	var obj  = document.getElementById('listFilter');
	var items = obj.getElementsByTagName("listitem");
	var item = null;

	try
	{
		if ((items.length > 0) && items[0].selected)
		{
			//alert(tongwenStrRes.getString("msg_filter_move_up"));	//redundant alert messsage
			return;
		}
		for (var i = 0; i < items.length; ++i) {
			if (items[i].selected) {
				item = colneItem(items[i]);
				obj.removeChild(items[i]);
				obj.insertBefore(item, items[i - 1]);
				obj.addItemToSelection(item);
			}
		}
	}
	catch (ex)
	{
		// alert(ex);
	}
}

function downFilter()
{
	var obj  = document.getElementById('listFilter');
	var items = obj.getElementsByTagName("listitem");
	var item = null;
	try
	{
		if ((items.length > 0) && items[items.length - 1].selected)
		{
			//alert(tongwenStrRes.getString("msg_filter_move_down"));		//redundant alert messsage
			return;
		}
		for (var i = items.length - 1; i >= 0; --i) {
			if (items[i].selected) {
				item = colneItem(items[i + 1]);
				obj.removeChild(items[i + 1]);
				obj.insertBefore(item, items[i]);
				obj.addItemToSelection(items[i + 1]);
			}
		}
	}
	catch (ex)
	{
		// alert(ex);
	}
}

function getAllFilter()
{
	var obj  = document.getElementById('listFilter');
	var nodes = obj.getElementsByTagName("listitem");
	var filter = [], val = [];
	
	for (var i = 0; i < nodes.length; i++)
	{
		val[0] = nodes[i].childNodes[0].getAttribute("value");
		val[1] = nodes[i].childNodes[1].getAttribute("value");
		val[2] = nodes[i].childNodes[2].getAttribute("value");
		filter[filter.length] = val.join("\t");
	}
	
	return filter.join("\n");
}

function delAllFilter(){	
	var lstBox  = document.getElementById('listFilter');
	var numOfRows = lstBox.getRowCount();
	
	while (numOfRows > 0) {
		var removeItem = lstBox.getItemAtIndex(0);
		if (removeItem){
			lstBox.removeChild(removeItem);
		}
		--numOfRows;
	}
}

function importFilter(){
	var dialogTitle = tongwenStrRes.getString("msg_import_window_title");	
	var dialogFileTypeText = tongwenStrRes.getString("msg_plain_txt_file") + " ( *.txt)";
	var diaglogFileEntension = "*.txt";
	var diaglogDefaultFilename = "tongwen_filter";
	var diaglogDefaultExtension = "txt";
		
	var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	fpicker.init(window, dialogTitle, fpicker.modeOpen);
	fpicker.defaultExtension = diaglogDefaultExtension;	
	fpicker.appendFilter(dialogFileTypeText , diaglogFileEntension);
	fpicker.appendFilters(fpicker.filterAll);
	fpicker.defaultString = diaglogDefaultFilename;
	
	var showResult = fpicker.show();
	if (showResult == fpicker.returnOK) {
		var filepath = fpicker.file.path;
		
		//debug code only!, print file path
		TongWen.dump(filepath);

		try {
			var f = TongWen.FileUtils.open(filepath);
			//var readtxt = TongWen.FileUtils.read(f, "UTF-8");
			var readtxt = TongWen.FileUtils.read(f);
			if (typeof(readtxt) != "string"){return;}
		
			if (readtxt !== false){			
				//debug only!
				//alert(readtxt);
				
				//delete all old filter list
				//delAllFilter();
				
				// set option
				TongWen.setOptions("tongwentang.filter.list", readtxt);
				
				// reload filter
				loadFilter();
			}
		}catch (ex) {
			TongWen.dump("importFilter: \n" + ex);
		}		
	}	
}

function exportFilter(){
	var dialogTitle = tongwenStrRes.getString("msg_export_window_title");	
	var dialogFileTypeText = tongwenStrRes.getString("msg_plain_txt_file") + " ( *.txt)";
	var diaglogFileEntension = "*.txt";
	var diaglogDefaultFilename = "tongwen_filter";
	var diaglogDefaultFileExtension = "txt";
	
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
		TongWen.dump(filepath + '\n' + fpicker.fileURL.spec);
		
		/*
		use this only enforce in  *.txt
		
		if (filepath.toLowerCase().indexOf(".txt") == -1) {
			filepath += ".txt";
		}
		*/
		
		try {
			var savetxt = getAllFilter();
			
			/*
			var f = TongWen.FileUtils.open(filepath);
			// if file exist, delete it.
			if (f) {
				TongWen.FileUtils.unlink(f);
			}
			*/
			
			/*
			if (fpicker.file.exists()){
				fpicker.file.remove(true);
			}
			*/
			
			f = TongWen.FileUtils.open(filepath);
			//var saveOK = TongWen.FileUtils.write(f, savetxt, "w", "UTF-8");
			var saveOK = TongWen.FileUtils.write(f, savetxt);
		
			if (saveOK !== false){
				//debug only!
				//alert(savetxt);
			}
		}catch (ex) {
			TongWen.dump("exportFilter: \n" + ex);
		}
	}
}

function selectAllFilter(){
	var lstBox  = document.getElementById('listFilter');
	var numOfRows = lstBox.getRowCount();	
	if (numOfRows == 0) {
		return;
	} else {
		lstBox.selectAll();
	}
}

function getTopWin(){
   var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
                       .getService(Components.interfaces.nsIWindowMediator);
   return windowManager.getMostRecentWindow("navigator:browser"); 
}

function enableFilterContentMenuItem(){
	var lstBox  = document.getElementById('listFilter');
	var numOfRows = lstBox.getRowCount();
	
	//setEnable for contentmenu
	var ary = ["contentFilter_selectall", "contentFilter_export", "contentFilter_export2"];
	var obj = null;
	
	for (var i = 0; i < ary.length; i++)
	{
		obj = document.getElementById(ary[i]);
		if (obj){
			obj.setAttribute("disabled", (numOfRows < 1));	
		}
	}
	
	// if selected item then setEnable for contentmenu
	var isSelectedItem = (lstBox.selectedCount > 0);
	var ary2 = ["contentFilter_delete", "contentFilter_simp", "contentFilter_trad", "contentFilter_off", "contentFilter_zoom", "contentFilter_goURL"];
	
	for (var i = 0; i < ary2.length; i++)
	{
		obj = document.getElementById(ary2[i]);
		if (obj){
			obj.setAttribute("disabled", !isSelectedItem);	
		}
	}
	
	// if selected url is valid URL without wildcard character *, then enabe goURL contentmenu item
	var curURL = getSelectedURL();
	var isValidURL = (curURL.indexOf("*") == -1);	
	
	obj = document.getElementById("contentFilter_goURL");
	obj.setAttribute("disabled", !isValidURL);
	
	//	remark
	//	%    \x25
	//	&    \x26
	//	-    \x2d
	//	.    \x2e
	//	/    \x2f
	//	:    \x3a
	//	=    \x3d
	//	\    \x5c
		
	var clip_url = TongWen.getClipboardContents();	
	var isValidURL  = /^(?:http:\/\/|https:\/\/|ftp:\/\/|file:\/\/\/){1,1}[A-Za-z0-9\.\x2d\x3a]{1,}[#&A-Za-z0-9\.\?\x2d\x2f\x3d]{0,}/gi;
	
	if (typeof(clip_url) != "string") {	
		obj = document.getElementById("contentFilter_addClipUrl");
		obj.setAttribute("disabled", true);
	} else {
		obj = document.getElementById("contentFilter_addClipUrl");
		obj.setAttribute("disabled", !isValidURL.test(clip_url));
	}	

	
	//if  (!(opener.content.document instanceof HTMLDocument)){
	//	document.getElementById("contentFilter_addUrl").disabled = true;
	//}
	
	var opener = getTopWin();
	
	var openerContentType = "";
	if (opener.content.document.contentType) {
		openerContentType = opener.content.document.contentType;
	}	
	
	if ((openerContentType == "text/plain") || (openerContentType == "text/html") || 
		(openerContentType == "text/xml") || (openerContentType == "application/x-javascript"))
	{
		obj = document.getElementById("contentFilter_addUrl");		
		obj.setAttribute("disabled", false);

		obj = document.getElementById("contentFilter_add_domain");		
		obj.setAttribute("disabled", false);
	}
	else 
	{
		obj = document.getElementById("contentFilter_addUrl");
		obj.setAttribute("disabled", true);
		
		obj = document.getElementById("contentFilter_add_domain");
		obj.setAttribute("disabled", true);
	}
	
	if (opener.content.document.location.href == "about:blank"){
		obj = document.getElementById("contentFilter_addUrl");
		obj.setAttribute("disabled", true);
	}
	
	////setEnable for contentmenu add domain	
	var isInValidDomain = (opener.content.document.domain == "");	
	obj = document.getElementById("contentFilter_add_domain");
	obj.setAttribute("disabled", isInValidDomain);	
}

//isShowPopFilter function is called before contentmenu  showing
function isShowPopFilter(){
	var isShowFilter = document.getElementById("chkFilter").checked;	
	if (!isShowFilter) { return false;}
	
	//if Enable  filter function, then set enable or disable  of contentmenu item
	enableFilterContentMenuItem();
		
	return isShowFilter;
}

function addFilterFromUrl(){
	try {
		//var current_url = window.content.location.href;
		//var current_url = window.top.content.document.location.href;
		//var current_url = opener.gBrowser.currentURI.spec;	
		
		var opener = getTopWin();	
		var current_url = '';
		
		if (opener.content){
			if (opener.content.document.location) {
				if (opener.content.document.location.href) {			
					current_url = opener.content.document.location.href;
				}
			}
		}

		
		var charset = opener.content.document.characterSet.toLowerCase();
		var convflag = "";
			
		if ((charset in TongWen.zh_encodes["tw"] || charset in TongWen.zh_encodes["hk"])) {
			convflag = "simp";
		} else if (charset in TongWen.zh_encodes["cn"]) {
			convflag = "trad";
		}
		
		var current_textZoom = Math.round(opener.getMarkupDocumentViewer().textZoom * 100);
		
		//if current textzoom is not change
		if (current_textZoom == 100){
			current_textZoom = "";
		}		
		
		document.getElementById("filterURL").value = current_url;
		document.getElementById("filterZhFlag").value = convflag;
		document.getElementById("filterZoomPercent").value = current_textZoom;
		addFilter();
		
	} catch(ex) {
		TongWen.dump("settings: addFilterFromUrl:  " + ex);
	}
}

function addFilterFromDomain(){
	//var current_url = window.content.location.href;
	//var current_url = window.top.content.document.location.href;
	
	try {
		var opener = getTopWin();
		var current_url = "";
		if (opener.content.document.domain){
			if (opener.content.document.domain != "") {
				current_url = "http:\/\/" + opener.content.document.domain + "\/";
			}
		}
		
		if (current_url == "") {return;}	

		var charset = opener.content.document.characterSet.toLowerCase();
		var convflag = "";
			
		if ((charset in TongWen.zh_encodes["tw"] || charset in TongWen.zh_encodes["hk"])) {
			convflag = "simp";
		} else if (charset in TongWen.zh_encodes["cn"]) {
			convflag = "trad";
		}
		
		var current_textZoom = Math.round(opener.getMarkupDocumentViewer().textZoom * 100);
		
		//if current textzoom is not change
		if (current_textZoom == 100){
			current_textZoom = "";
		}
		
		document.getElementById("filterURL").value = current_url;
		document.getElementById("filterZhFlag").value = convflag;
		document.getElementById("filterZoomPercent").value = current_textZoom;
		
		addFilter();
	} catch(ex) {
		TongWen.dump("settings: addFilterFromDomain:  " + ex);
	}
}

function addFilterFromClip(){
	var current_url = TongWen.getClipboardContents();

	document.getElementById("filterURL").value = current_url;
	addFilter();
}

function getSelectedURL(){
	var rev_url = ""
	var lstBox  = document.getElementById('listFilter');
	var selectedCount = lstBox.selectedCount;
	
	if (selectedCount > 0){
		var item = lstBox.selectedItem.firstChild;
		rev_url = item.getAttribute("value");
	}
	
	return rev_url;
}

function goFilterURL(){
	var lstBox  = document.getElementById('listFilter');
	var numOfRows = lstBox.getRowCount();
	
	if (numOfRows <=0){
		return;
	}
	
	var curURL = getSelectedURL();
	if (curURL == "") {return;}
	
	//alert(curURL);
	
	var isValidURL = (curURL.indexOf("*") == -1);
	
	var opener = getTopWin();	
	if (opener.content && isValidURL){
		opener.content.window.open(curURL, 'win-filter-url');		
		//opener.content.document.location.href = curURL;
	}	
}

function setSelectedFilter(filterFlag){
	var msg_filter_conv_off = tongwenStrRes.getString("msg_filter_conv_off");
	var msg_filter_conv_simp = tongwenStrRes.getString("msg_filter_conv_simp");
	var msg_filter_conv_trad = tongwenStrRes.getString("msg_filter_conv_trad");
	var msg_filter_textzoom_off = tongwenStrRes.getString("msg_filter_textzoom_off");

	var msg_filter_conv = {
		'off': msg_filter_conv_off,
		'simp': msg_filter_conv_simp,
		'trad': msg_filter_conv_trad
	};
		
	var msg_zoom_percent = {
		'200': '200',		
		'150': '150',
		'120': '120',
		'100': msg_filter_textzoom_off,
		'80': '80',
		'50': '50'
	};	

	var obj  = document.getElementById('listFilter');
	
	var isSelectedItem = (obj.selectedCount > 0);
	if (isSelectedItem){
		var obj_filterZhFlag = document.getElementById('filterZhFlag');
		var obj_filterZoomPercent = document.getElementById('filterZoomPercent');
		
		var val_filter_conv = '';
		var val_zoom_percent = '';
		var label_filter_conv = msg_filter_conv[filterFlag];
		var label_zoom_percent = msg_zoom_percent[filterFlag];
		
		switch (filterFlag){
			case 'simp': case 'trad':
				val_filter_conv = filterFlag;
				obj_filterZhFlag.value = filterFlag;
				break;
			case 'off':
				val_filter_conv = '';
				obj_filterZhFlag.value = '';
				break;
			case '200': case '150': case '120': case '80': case '50': 
				val_zoom_percent = filterFlag;
				obj_filterZoomPercent.value = filterFlag;
				break;
			case '100':
				val_zoom_percent = '';
				obj_filterZoomPercent.value = '';
				break;
			default:
				break;
		}
		
		var items = obj.selectedItems;
	
		for (var i=0; i < items.length;i++) {
			var nodes = items[i].childNodes;
					
			// nodes[0]	//filterURL
			// nodes[1]	//filterZhFlag
			// nodes[2]	//filterZoomPercent
			
			switch (filterFlag){
				case 'simp': case 'trad': case 'off':
					nodes[1].setAttribute("label", label_filter_conv);
					nodes[1].setAttribute("value", val_filter_conv);					
					break;
				case '200': case '150': case '120': case '100': case '80': case '50': 
					nodes[2].setAttribute("label", label_zoom_percent);
					nodes[2].setAttribute("value", val_zoom_percent);
					break;
				default:
					break;
			}
		}
		
	}
}

function filter_keyHandler(aEvent){
	var keytext = "";
	var akeycode = aEvent.keyCode;
	
	// pressed Delete
	if (akeycode == aEvent.DOM_VK_DELETE){
		//debug('delete key is pressed');
		delFilter();
	}
	
	// pressed Ctrl +A
	if ((akeycode == aEvent.DOM_VK_A) && (aEvent.ctrlKey)) {
		selectAllFilter();
	}
}