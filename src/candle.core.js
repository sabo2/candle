// candle.core.js
/* jshint node:true */
/* exported Candle, _doc, _2PI */

/* ------------- */
/*   variables   */
/* ------------- */
var _doc = (typeof document!=='undefined' ? document : null),
	_judgefuncs = {},
	_2PI = 2*Math.PI,
	_color = [];

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
	addTypeIf : function(type, judgefunc){
		if(!!_doc || (_judgefuncs[type]===judgefunc)){
			if(!judgefunc()){ return false;}
			
			this._order.push(type);
			this.enable[type] = true;
			if(!this.current){ this.current=type;}
		}
		else{
			_judgefuncs[type] = judgefunc;
		}
		return true;
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
		me.style.top      = "0px";
		me.style.left     = '-9000px';
		me.innerHTML = '';
		_doc.body.appendChild(me);

		if(me.offsetHeight!==void 0){
			this.ME = me;
		}
		else{
			_doc.body.removeChild(me);
		}
	},
	getoffsetHeight : function(text, font){
		var top;
		if(font.match(/(.+\s)?([0-9]+)px (.+)$/)){
			top = +RegExp.$2;
		}
		else if(!!this.ME){
			var ME = this.ME;
			ME.style.font = font;
			ME.style.lineHeight = '100%';
			ME.innerHTML = text;
			top = ME.offsetHeight;
		}
		return top;
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

	init : function(){
		if(!_doc){
			if(typeof document!=='undefined'){ _doc = document;}
 			for(var i in _judgefuncs){ this.addTypeIf(i, _judgefuncs[i]);}
		}
		if(!this.ME && !!_doc){ this.initME();}
	},
	start : function(element, type, initCallBack){
		this.init();

		var context;
		if(!element.candleEnable){
			var choice = type;
			if(!this.enable[choice]){ choice=this.current;}
			if(!choice || !this.enable[choice]){ throw 'No canvas environment is installed';}

			context = new this.wrapper[choice](element);
		}
		else{
			context = element.getContext('2d');
		}

		if(!!initCallBack){ initCallBack(context);}
	}
};

// extern
if(typeof module==='object'&&typeof exports==='object'){ module.exports = Candle;}
else{ this.Candle = Candle;}
