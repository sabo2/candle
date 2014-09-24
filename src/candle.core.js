// candle.core.js
/* exported Candle, _doc, _2PI */

/* ------------- */
/*   variables   */
/* ------------- */
var _doc = document,
	_2PI = 2*Math.PI,
	_color = [],
	_css = [];

/* ---------- */
/*   arrays   */
/* ---------- */
var _hex = (function(){
	var tbl = [];
	for(var r=256;r<512;r++){ tbl[r-256]=r.toString(16).substr(1);}
	return tbl;
})();

/* ---------------------- */
/*   Candleオブジェクト   */
/* ---------------------- */
var Candle = {
	version : '<%= pkg.version %>',
	
	/* wrapper classes */
	wrapper : {},
	addWrapper : function(classname, proto){
		classname = classname.replace(/\s+/g,'');
		var colon = classname.indexOf(':'), basename = '';
		if(colon>=0){
			basename  = classname.substr(colon+1);
			classname = classname.substr(0,colon);
		}

		var NewClass = function(){ if(!!this.initialize){ this.initialize.apply(this,arguments);}};
		var name;
		if(!!basename && !!this.wrapper[basename]){
			var BaseClass = this.wrapper[basename];
			for(name in BaseClass.prototype){ NewClass.prototype[name] = BaseClass.prototype[name];}
		}
		for(name in proto){ NewClass.prototype[name] = proto[name];}
		NewClass.prototype.constructor = NewClass;
		var rel = {body:NewClass, name:classname, base:basename};
		this.wrapper[rel.name] = rel.body;
	},

	/* TypeList class */
	_order : [],
	enable : {},
	addTypes : function(type){
		this._order.push(type);
		this.enable[type] = true;
		if(!this.current){ this.current=type;}
	},

	TypeList : function(type){
		for(var i=0;i<Candle._order.length;i++){
			this[Candle._order[i]]=(Candle._order[i]===type);
		}
	},

	/* Selected & Enable types */
	current : '',
	select : function(type){
		if(!this.enable[type]){ return false;}
		this.current = type;
		return true;
	},

	/* externs */
	ME     : null,
	initME : function(){
		var me = _doc.createElement('div');
		me.style.display  = 'inline';
		me.style.position = 'absolute';
		me.style.left     = '-9000px';
		me.innerHTML = '';
		_doc.body.appendChild(me);

		this.ME = me;
	},

	/* color parser */
	color : _color,
	parse : function(rgbstr){
		if(!_color[rgbstr]){
			if(rgbstr.substr(0,4)==='rgb('){
				var m = rgbstr.match(/\d+/g);
				_color[rgbstr] = ["#",_hex[m[0]],_hex[m[1]],_hex[m[2]]].join('');
			}
			else{ _color[rgbstr] = rgbstr;}
		}
		return _color[rgbstr];
	},

	/* DOM datas */
	getRectSize : function(el){
		return { width :(el.offsetWidth  || el.clientWidth),
				 height:(el.offsetHeight || el.clientHeight)};
	},

	/* functions */
	_counter : -1,
	getcanvasid : function(){
		this._counter++;
		return "_candle_"+this._counter;
	},

	initAllElements : function(){
		var elements = _doc.getElementsByTagName('candle');
		for(var i=0;i<elements.length;i++){ this.start(elements[i]);}
	},
	start : function(element, type, initCallBack){
		initCallBack = initCallBack || function(){};
		if(!this.ME){ this.initME();}

		if(typeof element === "string"){ element = document.getElementById(element);}
		var context;
		if(!element.candleEnable){
			var choice = type;
			if(!this.enable[choice]){ choice=this.current;}
			if(!this.enable[choice]){ return;}

			context = new this.wrapper[choice](element);
		}
		else{
			context = element.parentNode.getContext('2d');
		}

		initCallBack(context);
	},

	/* initialize functions */
	onload : function(){
		this.createCSS();
		this.initAllElements();
	},

	sheet : null,
	createCSS : function(){
		if(!!this.sheet){ return;}
		var _head = _doc.getElementsByTagName('head')[0];
		if(!!_head){
			var style = _doc.createElement('style');
			style.setAttribute('type', "text/css");
			_head.appendChild(style);
		}
		else{ _doc.write("<style></style>");}
		this.sheet = _doc.styleSheets[_doc.styleSheets.length - 1];
		for(var i=0;i<_css.length;i++){ this.addCSS(_css[i][0],_css[i][1]);}
		_css=[];
	},
	addCSS : function(sel,rule){
		if(!!this.sheet){
			var s = this.sheet;
			if(!!s.insertRule){ s.insertRule(sel+'{'+rule+'}',s.cssRules.length);}
			else if(!!s.addRule){ s.addRule(sel,rule,-1);}
		}
		else{ _css.push(sel,rule);}
	}
};

// 初期化関数設定 
if(!!window.addEventListener){ window.addEventListener("load",function(){ Candle.onload();},false);}
else if(!!window.attachEvent){ window.attachEvent("onload",function(){ Candle.onload();});}

// IE用ハック
_doc.createElement('candle');

// CSS設定 
Candle.createCSS();

// extern
window.Candle = Candle;
