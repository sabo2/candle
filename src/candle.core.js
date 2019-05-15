// candle.core.js
/* global VERSION:false */

import mocknode from './mocknode.js';
import env from './candle.env.js';
import SVGWrapper from './candle.svg.js';
import CanvasWrapper from './candle.canvas.js';
import metrics from './candle.metrics.js';

/* ------------- */
/*   variables   */
/* ------------- */
var _color = [],
	_order = [],
	_wrapper = {};

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
	version : ''+(typeof VERSION!=='undefined' ? VERSION : "src"),
	
	env,
	
	document : metrics.document,
	XMLSerializer: (typeof XMLSerializer!=='undefined' ? XMLSerializer : mocknode.XMLSerializer),
	DOMParser: (typeof DOMParser!=='undefined' ? DOMParser : mocknode.DOMParser),

	/* Selected & Enable types */
	enable : {},
	current : '',
	select : function(type){
		if(!this.enable[type]){ return false;}
		this.current = type;
		return true;
	},

	/* color parser */
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

	start : function(element, type, initCallBack){
		metrics.init();

		var context;
		if(!element.getContext){
			var choice = type;
			if(!this.enable[choice]){ choice=this.current;}
			if(!choice || !this.enable[choice]){ throw 'No canvas environment is installed';}
			context = new _wrapper[choice](element);
			context.init();
		}
		else{
			context = element.getContext('2d');
		}

		if(!!initCallBack){ initCallBack(context);}
	}
};

class TypeList{
	constructor(type){
		for(let wrapperType of _order){
			this[wrapperType]=(wrapperType===type);
		}
	}
}

for(let wrapper of [SVGWrapper, CanvasWrapper]){
	if(wrapper.isWrapperEnable){
		let type = wrapper.wrapperType;
		_order.push(type);
		Candle.enable[type] = true;
		if(!Candle.current){ Candle.current=type;}

		_wrapper[type] = wrapper.WrapperClass;
		wrapper.WrapperClass.prototype.getTypeList = () => new TypeList(type); // jshint ignore:line
	}
}

// extern
export default Candle;
