// candle.core.js
/* jshint node:true */
/* exported Candle, _doc, _2PI */

/* ------------- */
/*   variables   */
/* ------------- */
var _doc = (typeof document!=='undefined' ? document : void 0),
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
	
	env : {
		node : (typeof module==='object' && typeof exports==='object' && typeof require==='function'),
		browser : (typeof document==='object' && typeof window==='object' && typeof location==='object')
	},
	
	/* wrapper classes */
	wrapper : {},
	addWrapper : function(classname, proto){
		var name;
		var NewClass = function(){ if(!!this.initialize){ this.initialize.apply(this,arguments);}};
		for(name in this.wrapperbase){ NewClass.prototype[name] = this.wrapperbase[name];}
		for(name in proto){ NewClass.prototype[name] = proto[name];}
		this.wrapper[classname] = NewClass.prototype.constructor = NewClass;
		this.addType(classname);
	},

	/* TypeList class */
	_order : [],
	enable : {},
	addType : function(type){
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
		return { width :(el.offsetWidth  || el.clientWidth || 0),
				 height:(el.offsetHeight || el.clientHeight || 0)};
	},

	/* functions */
	_counter : -1,
	getcanvasid : function(){
		this._counter++;
		return "_candle_"+this._counter;
	},

	start : function(element, type, initCallBack){
		if(!this.ME && typeof window!=='undefined'){ this.initME();}

		var context;
		if(!element.getContext){
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
