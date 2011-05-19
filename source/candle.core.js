// candle.core.js
 
(function(){

// 多重定義防止
if(!!window.Candle){ return;}

/* ------------- */
/*   variables   */
/* ------------- */
var _doc = document,
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
	EL_ID_HEADER : "canvas_o_",

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
		if(!!basename && !!this.wrapper[basename]){
			var BaseClass = this.wrapper[basename];
			for(var name in BaseClass.prototype){ NewClass.prototype[name] = BaseClass.prototype[name];}
		}
		for(var name in proto){ NewClass.prototype[name] = proto[name];}
		NewClass.prototype.constructor = NewClass;
		var rel = {body:NewClass, name:classname, base:basename};
		this.wrapper[rel.name] = rel.body;
	},

	/* TypeList class */
	_types : [],
	addTypes : function(type){ this._types.push(type);},

	TypeList : function(type){
		for(var i=0;i<Candle._types.length;i++){
			this[Candle._types[i]]=(Candle._types[i]===type);
		}
	},
	/* Selected & Enable types */
	select : function(type){
		if(this.enable[type]!==true){ return false;}
		this.current = type;
		return true;
	},

	/* externs */
	ME     : null,
	initME : function(){
		ME = _doc.createElement('div');
		ME.style.display  = 'inline';
		ME.style.position = 'absolute';
		ME.style.left     = '-9000px';
		ME.innerHTML = '';
		_doc.body.appendChild(ME);

		this.ME = ME;
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
	parsecolorrev : function(colorstr){
		if(colorstr.match(/\#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/)){
			var m0 = parseInt(RegExp.$1,16).toString();
			var m1 = parseInt(RegExp.$2,16).toString();
			var m2 = parseInt(RegExp.$3,16).toString();
			return ["rgb(",m0,',',m1,',',m2,")"].join('');
		}
		return colorstr;
	},

	/* DOM datas */
	getRectSize : function(el){
		return { width :(el.offsetWidth  || el.clientWidth),
				 height:(el.offsetHeight || el.clientHeight)};
	},

	/* functions */
	_initializing : 0,
	initAllElements : function(){
		var elements = _doc.getElementsByTagName('candle');
		for(var i=0;i<elements.length;i++){ this.start(elements[i].id);}
	},
	start : function(idname, type, initCallBack){
		var el = _doc.getElementById(this.EL_ID_HEADER + idname);
		if(!!el){
			if(this.readyflag[idname]===true){
				initCallBack(el.parentNode.getContext('2d'));
			}
			return;
		}
		if(!this.ME){ this.initME();}

		var choice = type;
		if(!this.enable[choice]){ choice=this.current;}
		if(!this.enable[choice]){ return;}

		this._initializing++;
		this.readyflag[idname] = false;
		var context = new this.wrapper[choice](idname), self = this;

		if(!!context && !!initCallBack){
			if(self.isready(idname)){ initCallBack(context);}
			else{
				setTimeout(function(){
					if(!self.isready(idname)){
						setTimeout(arguments.callee,20);
						return;
					}
					initCallBack(context);
				},20);
			}
		}
	},

	readyflag : {},
	isready : function(idname){ return !!this.readyflag[idname];},
	allready : function(){ return (this._initializing===0);},

	debugmode : false
};

/* ------------- */
/*  WrapperBase  */
/* ------------- */
Candle.addWrapper('wrapperbase',{
	initialize : function(idname){
		// canvasに存在するプロパティ＆デフォルト値
		this.fillStyle    = 'black';
		this.strokeStyle  = 'black';
		this.lineWidth    = 1;
		this.font         = '14px system';
		this.textAlign    = 'center';
		this.textBaseline = 'middle';
		this.canvas = null;		// 親エレメントとなるdivエレメント

		// variables for internal
		this.idname   = idname;
		this.canvasid = Candle.EL_ID_HEADER+idname;
		this.child    = null;	// 親エレメントの直下にあるエレメント

		// Layer additional
		this.currentLayerId = '_empty';
		this.isedgearray    = {_empty:false};
		this.isedge         = false;
	}
});

// extern
window.Candle = Candle;

})();
