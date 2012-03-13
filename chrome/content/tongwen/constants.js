var TongWen = {
	version : "0.4.0.9.2",
	SIMFLAG : "simplified",
	TRAFLAG : "traditional",
	ZHENCODINGONLY : false,
	OPPCHARSETONLY : false,
	DEBUG : "off",

	FRAMEDEEP : 18, // Recursive frame/iframe deep.
	/* Chinese encoding. */
	zh_encodes : {
		"cn": {
			"gb2312"     : 1,
			"gbk"      	 : 1,
			"x-gbk"      : 1,
			"gb18030"    : 1,
			"hz-gb-2312" : 1,
			"iso-2022-cn": 1
		},
		"tw": {
			"big5"       : 1,
			"x-euc-tw"   : 1
		},
		"hk": {
			"big5-hkscs" : 1
		}
	},
	/* Possible encoding that has Chinese content. */
	zh_all : {
		"gb2312"        : 1,
		"gbk"           : 1,
		"x-gbk"         : 1,
		"gb18030"       : 1,
		"hz-gb-2312"    : 1,
		"iso-2022-cn"   : 1,
		"big5"          : 1,
		"x-euc-tw"      : 1,
		"big5-hkscs"    : 1,
		"utf-7"         : 1,
		"utf-8"         : 1,
		"utf-16le"      : 1,
		"x-user-defined": 1
	},

	UConv : Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter),
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	aConsoleService : Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
	// FileUtils : new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath"),
	FileUtils : {
		localfileCID  : '@mozilla.org/file/local;1',
		localfileIID  : Components.interfaces.nsILocalFile,

		finstreamCID  : '@mozilla.org/network/file-input-stream;1',
		finstreamIID  : Components.interfaces.nsIFileInputStream,

		foutstreamCID : '@mozilla.org/network/file-output-stream;1',
		foutstreamIID : Components.interfaces.nsIFileOutputStream,

		sinstreamCID  : '@mozilla.org/scriptableinputstream;1',
		sinstreamIID  : Components.interfaces.nsIScriptableInputStream,

		suniconvCID   : '@mozilla.org/intl/scriptableunicodeconverter',
		suniconvIID   : Components.interfaces.nsIScriptableUnicodeConverter,

		open   : function(path) {
			try {
				var file = Components.classes[this.localfileCID].createInstance(this.localfileIID);
				file.initWithPath(path);
				return file;
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		read   : function(file, charset) {
			try {
				var data     = new String();
				var fiStream = Components.classes[this.finstreamCID].createInstance(this.finstreamIID);
				var siStream = Components.classes[this.sinstreamCID].createInstance(this.sinstreamIID);
				fiStream.init(file, 1, 0, false);
				siStream.init(fiStream);
				data += siStream.read(-1);
				siStream.close();
				fiStream.close();
				if (charset) {
					data = this.toUnicode(charset, data);
				}
				return data;
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		write  : function(file, data, mode, charset) {
			try {
				var foStream = Components.classes[this.foutstreamCID].createInstance(this.foutstreamIID);
				if (charset) {
					data = this.fromUnicode(charset, data);
				}
				var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
				if (mode == 'a') {
					flags = 0x02 | 0x10; // wronly | append
				}
				foStream.init(file, flags, 0664, 0);
				foStream.write(data, data.length);
				// foStream.flush();
				foStream.close();
				return true;
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		create : function(file) {
			try {
				file.create(0x00, 0664);
				return true;
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		unlink : function(file) {
			try {
				file.remove(false);
				return true;
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		path   : function(file) {
			try {
				return 'file:///' + file.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20');
			} catch(ex) {
				TongWen.dump(ex);
				return false;
			}
		},

		toUnicode   : function(charset, data) {
			try{
				var uniConv = Components.classes[this.suniconvCID].createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertToUnicode(data);
			} catch(ex) {
				// foobar!
				TongWen.dump(ex);
			}
			return data;
		},

		fromUnicode : function(charset, data) {
			try {
				var uniConv = Components.classes[this.suniconvCID].createInstance(this.suniconvIID);
				uniConv.charset = charset;
				data = uniConv.ConvertFromUnicode(data);
				// data += uniConv.Finish();
			}
			catch(e) {
				// foobar!
				TongWen.dump(ex);
			}
			return data;
		},

		exists : function (aPath) {
			var rv = false;
			if (!aPath) return rv;
			try {
				const TongWenFilePath = new Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath");
				rv = (new TongWenFilePath(aPath)).exists();
			} catch(ex) {
				// TongWen.dump("FileUtils: " + aPath + "\n" + ex);
				rv = false;
			}
			return rv;
		}
	},

	// ---------------------------------------------
	// ----------------- Nota Bene -----------------
	// ---------------------------------------------
	// Some possible types for get are:
	//    'ProfD'        = profile
	//    'DefProfRt'    = user (e.g., /root/.mozilla)
	//    'UChrm'        = %profile%/chrome
	//    'DefRt'        = installation
	//    'PrfDef'       = %installation%/defaults/pref
	//    'ProfDefNoLoc' = %installation%/defaults/profile
	//    'APlugns'      = %installation%/plugins
	//    'AChrom'       = %installation%/chrome
	//    'ComsD'        = %installation%/components
	//    'CurProcD'     = installation (usually)
	//    'Home'         = OS root (e.g., /root)
	//    'TmpD'         = OS tmp (e.g., /tmp)
	// ---------------------------------------------
	getDir : function (type) {
		try {
			// var dir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
			var dir = Components.classes["@mozilla.org/file/directory_service;1"].createInstance(Components.interfaces.nsIProperties);
			return dir.get(type, Components.interfaces.nsIFile).path;
		} catch (ex) {
			this.dump("getDir" + ex);
		}
	},

	dump : function (aMsg) {
		if (this.DEBUG != "off") {
			this.aConsoleService.logStringMessage('TongWen: ' +aMsg);
		}
	},

	getOptions : function (ppath) {
		var ret;
		try {
			var ptype = this.prefs.getPrefType(ppath);
			switch (ptype) {
				case this.prefs.PREF_STRING:
					ret = this.prefs.getCharPref(ppath);
					break;
				case this.prefs.PREF_INT:
					ret = this.prefs.getIntPref(ppath);
					break;
				case this.prefs.PREF_BOOL:
					ret = this.prefs.getBoolPref(ppath);
					break;
				case this.prefs.PREF_INVALID:
					if (arguments.length == 1) {
						ret = null;
					} else if (arguments.length == 2) {
						this.setOptions(ppath, arguments[1]);
						ret = arguments[1];
					}
					break;
			}
		} catch(ex) {
			if (arguments.length == 1) {
				ret = null;
			} else if (arguments.length == 2) {
				this.setOptions(ppath, arguments[1]);
				ret = arguments[1];
			}
		}
		return ret;
	},

	setOptions : function (ppath, value) {
		try {
			var vtype = typeof value;
			switch (vtype) {
				case "string":
					this.prefs.setCharPref(ppath, value);
					break;
				case "number":
					this.prefs.setIntPref(ppath, value);
					break;
				case "boolean":
					this.prefs.setBoolPref(ppath, value);
					break;
			}
		} catch(ex) {
			this.dump("setOptions:" + ex);
		}
	},

	getUnicodePref: function(prefName, defaultValue) {
		try {
			return this.prefs.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
		}
		catch(e) {
			if (arguments.length == 1) {
				return null;
			} else if (arguments.length == 2) {
				this.setUnicodePref(prefName, arguments[1]);
				return arguments[1];
			}
			return null;
		}
	},

	setUnicodePref: function (prefName,prefValue) {
		var sString = Components.classes["@mozilla.org/supports-string;1"].
		createInstance(Components.interfaces.nsISupportsString);
		try {
			sString.data = prefValue;
			this.prefs.setComplexValue(prefName, Components.interfaces.nsISupportsString, sString);
		} catch(e) {
			this.dump("setUnicodePref: ex " + e);
		}
	},
	

   // deletes the named preference or subtree
	deletePref: function (prefName) {
		try {
			this.prefs.deleteBranch(prefName);
		}
		catch(e) {
			this.dump("deletePref: ex " + e);
		}
	},
	
	addPrefObserver : function (listener) {
		try {
			var pbi = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranchInternal);
			//var pbi = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.addObserver("tongwentang", listener, false);
			pbi = null;
		} catch(ex) {
			this.dump("prefs-Observer failed to attach: " + ex);
		}
	},
	
	removePrefObserver : function (listener) {
		try {
			var pbi = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranchInternal);
			//var pbi = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.removeObserver("tongwentang", listener);
			//pbi = null;
			listener = null;
		} catch(ex) {
			this.dump("prefRemoveObserver failed to attach: " + ex);
		}
	},
	
	trim : function (val) {
		var re = /[\r\n\t ]+/g;		//enter (cr, LF), tab is cae insensitive in nature
		return val.replace(re, "");
	},
	
	getClipboardContents: function (){
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].
				 getService(Components.interfaces.nsIClipboard);
		if (!clip) return false;

		var trans = Components.classes["@mozilla.org/widget/transferable;1"].
				  createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;
			trans.addDataFlavor("text/unicode");

		clip.getData(trans,clip.kGlobalClipboard);

		var str = new Object();
		var strLength = new Object();

		try{
			trans.getTransferData("text/unicode",str,strLength);
		}
		catch(e){	
			return false;
		}
		if (str) str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if (str) pastetext = str.data.substring(0,strLength.value / 2);
		
		return pastetext;
	},
	
	setClipboardContents: function (copytext){
		try{
			var str = Components.classes["@mozilla.org/supports-string;1"].
				createInstance(Components.interfaces.nsISupportsString);
			if (!str) return false;
			str.data = copytext;

			var trans = Components.classes["@mozilla.org/widget/transferable;1"].
				  createInstance(Components.interfaces.nsITransferable);
			if (!trans) return false;


			trans.addDataFlavor("text/unicode");
			trans.setTransferData("text/unicode",str,copytext.length * 2);

			var clipid = Components.interfaces.nsIClipboard;
			var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
			if (!clip) return false;

			clip.setData(trans,null,clipid.kGlobalClipboard);
			return true;
		}
		catch(e)
		{
			return false;
		}
	}	
};
/*
TongWen.MyTest = function () {
	try {
		var res = (new this.FilePath("C:\\dbcs.log")).exists();
		if (res) {
			alert("file exists");

			var xmlHttp = XmlHttp.create();
			xmlHttp.open("GET", "file://C:/dbcs.log", false);
			xmlHttp.send(null);
			alert(xmlHttp.responseText, false);

		} else {
			alert("no file");
		}
	} catch(ex) {
		alert(ex);
		this.dump("MyTest: " + ex);
	}
};
*/
