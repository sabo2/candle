// candle.core.js
 
(function(){

// Candleオブジェクトがない場合は何もしない
if(!window.Candle){ return;}

/* ------------- */
/*  const value  */
/* ------------- */
var Candle = window.Candle,
	_doc = document,
	SVGNS   = "http://www.w3.org/2000/svg";

/* ---------------------- */
/*   Candleオブジェクト   */
/* ---------------------- */
Candle.init_func = function(){
	/* Candle.enable 設定 */
	this.enable  = new this.TypeList();
	this.enable.canvas = (!!_doc.createElement('canvas').getContext);
	this.enable.svg    = (!!_doc.createElementNS && !!_doc.createElementNS(SVGNS, 'svg').suspendRedraw);
	this.enable.sl     = (function(){ try{ return (new ActiveXObject("AgControl.AgControl")).IsVersionSupported("1.0");}catch(e){} return false;})();
	this.enable.flash  = false;
	this.enable.vml    = (window.attachEvent && !window.opera);

	/* Candle.current設定 */
	this.current = '';
	for(var i=0;i<this._types.length;i++){
		if(this.enable[this._types[i]]){ this.current = this._types[i]; break;}
	}

	this.writeCSS();
};

Candle.writeCSS = function(){
	var text = [];

	/* 初期設定 for VML */
	if(this.enable.vml){
		/* addNameSpace for VML */
		_doc.namespaces.add("v", "urn:schemas-microsoft-com:vml");

		/* addStyleSheet for VML */
		text.push("v\\:shape, v\\:group, v\\:polyline, v\\:image { behavior: url(#default#VML); position:absolute; width:10px; height:10px; }");
		text.push("v\\:path, v\\:textpath, v\\:stroke { behavior: url(#default#VML); }");
	}
	/* 初期設定 for Candleタグ */
	text.push("candle { display: block; }\n");

	_doc.write('<style type="text/css" rel="stylesheet">');
	_doc.write(text.join(''));
	_doc.write('</style>');
};

// 初期化関数(1)call
Candle.init_func();

// 初期化関数(2)設定 
var func = function(){ Candle.initAllElements();};
if(!!window.addEventListener){ window.addEventListener("load",func,false);}
else if(!!window.attachEvent){ window.attachEvent("onload",func);}

// IE用ハック
if(Candle.enable.vml){ _doc.createElement('candle');}

})();
