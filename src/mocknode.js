// mocknode.js

/*==================*/
/* Common functions */
/*==================*/
/*---------------*/
/* searching DOM */
/*---------------*/
function nextSibling(){
	if(!this.parentNode){ return void 0;}
	var siblings = this.parentNode._children;
	var idx = siblings.indexOf(this);
	return (idx>=0 ? siblings[idx+1] : null);
}
function appendChild(node){
	if(node.parentNode){ node.parentNode.removeChild(node);}
	this._children.push(node);
	node.parentNode = this;
}
function removeChild(node){
	var idx = this._children.indexOf(node);
	if(idx >= 0){
		this._children.splice(idx,1);
		node.parentNode = null;
	}
	return node;
}
function insertBefore(newnode, refnode){
	if(newnode.parentNode){ newnode.parentNode.removeChild(newnode);}
	var idx = -1;
	if(refnode){ idx = this._children.indexOf(refnode);}
	if(idx===-1){ this.appendChild(newnode);}
	else{ this._children.splice(idx,0,newnode);}
}

/*----------------*/
/* querySelectors */
/*----------------*/
function querySearch(query, breakIfFound){ // This only accepts tagName or id only.
	query = query.replace(/\*/g, '[^\/]+');
	query = query.replace(/([\w#]+|\*)/g,"[^\/]*$1[^\/]*");
	query = query.replace(/\s+/g,'\/([^\/]+\/)?');
	query = new RegExp(query+'[^\/]*$');
	var els = (!!this.firstChild ? [this.firstChild] : []), matched = [];
	while(els.length>0){
		var el = els.pop();
		if(getXPath(el,this).match(query)){
			matched.push(el);
			if(breakIfFound){ break;}
		}
		if(!!el.nextSibling){ els.push(el.nextSibling);}
		if(el.childNodes.length>0){ els.push(el.firstChild);}
	}
	return matched;
}
function querySelectorAll(query){
	return querySearch.call(this, query, false);
}
function querySelector(query){
	return querySearch.call(this, query, true)[0] || null;
}
function getXPath(node,base){
	var path = '';
	while(node && node!==base){
		var currentpath = '';
		if(!node.createElement){ currentpath = node.tagName + (node._attr.id ? '#'+node._attr.id : '');}
		path = currentpath + (!!path ? '/' + path : '');
		node = node.parentNode;
	}
	return path;
}

/*-------------*/
/* serializing */
/*-------------*/
function innerHTML(){
	return this._children.reduce(function(prev,el,i,all){ return prev + el.outerHTML;},'');
}
function outerHTML(){
	var tag = this.tagName, property = '', styles = '';
	for(var name in this._attr){ property += ' '+name+'="'+this._attr[name]+'"';}
	for(var style in this.style){ styles += style+':'+this.style[style]+';';}
	if(!!styles){ property += ' style="'+styles+'"';}
	
	if(this._children.length===0)
		{ return '<'+tag+property+'/>';}
	else
		{ return '<'+tag+property+'>' + this.innerHTML + '</'+tag+'>';}
}

/*---------*/
/* parsing */
/*---------*/
function parseStyle(node, text){
	for(;;){
		var smatches = text.match(/^\s*([^:]+?):([^;]+?);?/);
		if(!smatches){ break;}
		node.style[smatches[1]] = smatches[2];
		text = RegExp["$'"];
	}
}
function parseAttributes(node, attrs){
	for(;;){
		var matches = attrs.match(/^\s*([\w\-\:]+)(\=)?(?:['"](.+?)['"]|([^\s]+))?\s*/);
		if(!matches){ break;}
		var attr = matches[1], val = matches[3] || matches[4] || '';
		attrs = RegExp["$'"];
		if(!!attr){
			if(matches[2]==='='){
				if(attr!=='style'){ node.setAttribute(attr, val);}
				else{ node.style = parseStyle(node, val);}
			}
			else{ node.setAttribute(attr,true);}
		}
	}
}
function parseText(parent, str){
	var els = [parent];
	var strs = str.split(/(<.+?>)/g);
	strs.forEach(function(text){
		var parent = els[els.length-1], node = null;
		if(text.match(/^<\?xml/)){ /* XML declaration: do nothing */
			return;
		}
		else if(text.match(/^<\w/)){ /* open tag */
			var info = text.match(/<(\w+)\s*(.*)\/?>/);
			node = new MockNode(info[1]);
			parseAttributes(node, info[2]);
			parent.appendChild(node);
			if(!text.match(/\/>$/)){ els.push(node);} /* push unless empty node */
		}
		else if(text.match(/^<\//)){ /* close tag */
			els.pop();
		}
		else if(!text.match(/^[\s\t\r\n]*$/)){ /* text node */
			parent.appendChild(new MockText(text));
		}
		else{ /* empty text: do nothing */
			return;
		}
	});
	return parent;
}

/*==============================*/
/* Node/Element emulation class */
/*==============================*/
class MockNode{
	constructor(tag){
		this.tagName = tag;
		
		this._attr     = {};
		this.style     = {};
		this._children = [];
		
		this.parentNode = null;
	}

	get nodeType(){ return 1;}
	get nodeName(){ return this.tagName;}

	get firstChild(){ return this._children[0];}
	get lastChild(){ return this._children[this._children.length-1];}
	get childNodes(){ return this._children;}
	get nextSibling(){ return nextSibling.call(this);}

	appendChild(node){ appendChild.call(this, node);}
	removeChild(node){ return removeChild.call(this, node);}
	insertBefore(newnode, refnode){ insertBefore.call(this, newnode, refnode);}

	setAttribute   (attr,val)   { this._attr[attr] = val;}
	setAttributeNS (ns,attr,val){ this._attr[attr] = val;}
	getAttribute   (attr)       { return ((attr in this._attr) ? this._attr[attr] : null);}
	getAttributeNS (ns,attr)    { return ((attr in this._attr) ? this._attr[attr] : null);}
	removeAttribute(attr)       { delete this._attr[attr];}
	get id(){ return this._attr.id || '';}

	get innerHTML(){ return innerHTML.call(this);}
	get outerHTML(){ return outerHTML.call(this);}
	get textContent(){ return this.innerHTML.replace(/<.+?>/g,'');}
	set textContent(text){
		this._children.forEach(el => this.removeChild(el));
		this.appendChild(new MockText(text));
	}
	
	querySelector(query){ return querySelector.call(this, query);}
	querySelectorAll(query){ return querySelectorAll.call(this, query);}
}

/*==========================*/
/* TextNode emulation class */
/*==========================*/
class MockText{
	constructor(text){
		this.data = text;
		
		this._attr     = {};
		
		this.parentNode = null;
	}

	get nodeType(){ return 3;}
	get nodeName(){ return '#text';}
	get firstChild(){ return null;}
	get childNodes(){ return [];}
	get nextSibling(){ return nextSibling.call(this);}
	get outerHTML(){ return this.data;}
}

/*==========================*/
/* Document emulation class */
/*==========================*/
class MockDocument{
	constructor(){
		this._children = [];
	}

	get nodeType(){ return 9;}
	get nodeName(){ return '#document';}

	createElement  (tag)   { return new MockNode(tag);}
	createElementNS(ns,tag){ return new MockNode(tag);}
	createTextNode (text)  { return new MockText(text);}

	get firstChild(){ return this._children[0];}
	get lastChild(){ return this._children[this._children.length-1];}
	get childNodes(){ return this._children;}

	appendChild(node){ appendChild.call(this, node);}
	removeChild(node){ return removeChild.call(this, node);}
	insertBefore(newnode, refnode){ insertBefore.call(this, newnode, refnode);}

	get innerHTML(){ return innerHTML.call(this);}
	get outerHTML(){ return innerHTML.call(this);}

	querySelector(query){ return querySelector.call(this, query);}
	querySelectorAll(query){ return querySelectorAll.call(this, query);}

	getElementById(id){ return this.querySelector('#'+id);}
}

/*=========================================*/
/* XMLSerializer/DOMParser emulation class */
/*=========================================*/
var MockXMLSerializer = function(){};
MockXMLSerializer.prototype.serializeToString = function(node){ return node.outerHTML;};

var MockDOMParser = function(){};
MockDOMParser.prototype.parseFromString = function(str,mimetype){
	var doc = new MockDocument();
	return parseText(doc,str);
};

/*========*/
/* extern */
/*========*/
export default {
	document: (new MockDocument()),
	XMLSerializer: MockXMLSerializer,
	DOMParser: MockDOMParser
};
