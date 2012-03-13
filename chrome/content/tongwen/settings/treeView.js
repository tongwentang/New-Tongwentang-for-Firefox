function TreeData(){
	// datatable is a 2D array, datatable[row][col], row start from zero, col is 'column id'
	this.datatable = [];
	this.datacols = {"cols0": 0, "cols1": 1};
	
	this.setColumns = function(obj_cols){
		this.datacols = obj_cols;
	};
	
	this.remove = function(idx){
		if((idx < 0) || isNaN(idx) || (idx > this.datatable.length)){
			return false;
		}
		
		this.datatable.splice(idx, 1);
		
		//debug code
		//var oary = this.datatable.splice(idx, 1);
		//debug('oary:\t' + this.datatable.toString());
	};
	
	this.getKey = function(idx){
		if((idx < 0) || isNaN(idx) || (idx > this.datatable.length)){
			return "";
		}
		
		return this.datatable[idx][0];
	};
	
	this.add = function(newitem){
		this.datatable.push(newitem);
	};
	
	this.update = function(idx, newitem){
		if((idx < 0) || isNaN(idx) || (idx > this.datatable.length)){
			return false;
		}
		this.datatable[idx] = newitem;
	};
	
	this.clear = function(){
		this.datatable = [];
		this.datacols = {};
	};
	
	this.moveUp = function(idx){
		if((idx < 1 ) || isNaN(idx) || (idx > this.datatable.length)){
			return false;
		}
		//swap item idx-1, item idx
		var temp = this.datatable[idx - 1];
		this.datatable[idx - 1] = this.datatable[idx];
		this.datatable[idx] = temp;
	};
	
	this.moveDown = function(idx){
		if((idx <0 ) || isNaN(idx) || (idx >= this.datatable.length)){
			return false;
		}
		
		//swap item  item idx, idx+1
		var temp = this.datatable[idx + 1];
		this.datatable[idx + 1] = this.datatable[idx];
		this.datatable[idx] = temp;
	};	
}

function MapData(){
	this.obj = {};
	
	this.add  = function (key, val){
		this.obj[key] = val;
	};
	
	this.remove  = function (key){
		delete this.obj[key];
	};
	
	this.update  = function (key, val){
		if (!(key in this.obj)){ return false;}
		
		this.obj[key] = val;
	};
	
	this.exists = function(key){
		return (key in this.obj);
	};
	
	this.clear = function(key){
		this.obj = {};
	};
}


// This is our custom view, based on the treeview interface
function treeView(table)
{
    this.table               = table.datatable;    // our table
    this.rowCount            = table.datatable.length; // our counter
	this.columns			 = table.datacols;

    this.getCellText         = function(row,column){
		//var mycolumn = (column.id)?column.id:column;
		var mycolumn = (typeof column == "string")?column:column.id;
		return this.table[row][this.columns[mycolumn]];
	};
	
    this.setTree             = function(treebox){ this.treebox = treebox; };
    this.isContainer         = function(row){ return false; };
    this.isSeparator         = function(row){ return false; };
    this.isSorted            = function(row){ return false; };
    this.getLevel            = function(row){ return 0; };
    this.getImageSrc         = function(row,col){ return null; };
    this.getRowProperties    = function(row,props){};
    this.getCellProperties   = function(row,col,props){};
    this.getColumnProperties = function(colid,col,props){};
	this.cycleHeader = function(col, elem){};
	
	function QueryInterface(aIID)
	{
		if (Components.interfaces.nsIClassInfo.equals(aIID) ||
			Components.interfaces.nsITreeView.equals(aIID) ||
			Components.interfaces.nsISupportsWeakReference.equals(aIID) ||
			Components.interfaces.nsISupports.equals(aIID))
		{
			return this;
		}
		throw 0x80004002; // Components.results.NS_NOINTERFACE;
	}
	
	this.getHelperForLanguage = function(language) { return null; };
	this.flags = function(){ return Components.interfaces.nsIClassInfo.DOM_OBJECT; };	
	this.getInterfaces = function (count) {
		count.value = 4;
		return [Components.interfaces.nsITreeView,
				Components.interfaces.nsIClassInfo, 
				Components.interfaces.nsISupportsWeakReference, 
				Components.interfaces.nsISupports];
	};
	
	/*
		this.invalidate = function() {
        this.tree.invalidate();		
    };	
	*/

	/*
	this.insertItem = function(newItem) {
        try {
            this.table.push(newItem);
			this.rowCount = this.table.length;
			
            // 1 means add (> 0)
            this.treebox.rowCountChanged(this.rowCount, 1);			
			this.treebox.invalidate();
        } catch (err) {
            debug('insertItem error: ' + err);
        }
    };	
	*/
	
	/*
	this.invalidate = function(){
		this.treebox.invalidate();
	};
		
    this.invalidateRow = function(row){
		this.treebox.invalidateRow(row);
	};
	*/
}