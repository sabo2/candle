// candle.metrics.js

import mocknode from './mocknode.js';

const _doc = (typeof document!=='undefined' ? document : mocknode.document);
let metricsElement = null;

export default {
	document: _doc,
	init(){
		if(!!metricsElement || typeof window==='undefined'){ return;}

		var me = _doc.createElement('div');
		me.style.display  = 'inline';
		me.style.position = 'absolute';
		me.style.top      = "0px";
		me.style.left     = '-9000px';
		me.innerHTML = '';
		_doc.body.appendChild(me);

		if(me.offsetHeight!==void 0){
			metricsElement = me;
		}
		else{
			_doc.body.removeChild(me);
		}
	},
	getoffsetHeight(text, font){
		var top;
		if(font.match(/(.+\s)?([0-9]+)px (.+)$/)){
			top = +RegExp.$2;
		}
		else if(!!metricsElement){
			var ME = metricsElement;
			ME.style.font = font;
			ME.style.lineHeight = '100%';
			ME.innerHTML = text;
			top = ME.offsetHeight;
		}
		return top;
	},
	getRectSize(el){
		return { width :(el.offsetWidth  || el.clientWidth || 0),
				 height:(el.offsetHeight || el.clientHeight || 0)};
	}
};
