// candle.svg.js
/* global Candle:false, _doc:false */

(function(){

/* ------------------- */
/*   SVG描画可能条件   */
/* ------------------- */
var SVGNS   = Candle.SVGNS   = "http://www.w3.org/2000/svg",
	XLINKNS = Candle.XLINKNS = "http://www.w3.org/1999/xlink";
if(!document.createElementNS || !document.createElementNS(SVGNS, 'svg').suspendRedraw){ return;}

function newEL(tag){ return _doc.createElementNS(SVGNS, tag);}

/* ------------------------------------------- */
/*   VectorContext(SVG)クラス用const文字列集   */
/* ------------------------------------------- */
var S_PATH_MOVE   = ' M',
	S_PATH_LINE   = ' L',
	S_PATH_ARCTO  = ' A',
	S_PATH_CLOSE  = ' z',

//	S_ATT_ID          = 'id',
	S_ATT_PATH        = 'd',
	S_ATT_FILL        = 'fill',
	S_ATT_STROKE      = 'stroke',
	S_ATT_STROKEWIDTH = 'stroke-width',
	S_ATT_RENDERING   = 'shape-rendering',

	S_NONE = 'none',

	S_ANCHOR = { left:'start', center:'middle', right:'end'},
	S_HEIGHT;

var UA = navigator.userAgent;
if(UA.match(/Chrome/)){
	S_HEIGHT = { 'candle-top':-0.52, top:-0.58, hanging:-0.45, middle:-0.25, alphabetic:0, bottom:0.08 };
}
else if(UA.match(/AppleWebKit/)){
	S_HEIGHT = { 'candle-top':-0.6,  top:-0.82, hanging:-0.82, middle:-0.25, alphabetic:0, bottom:0.18 };
}
else if(UA.match(/Trident/)){
	S_HEIGHT = { 'candle-top':-0.5,  top:-0.72, hanging:-0.72, middle:-0.25, alphabetic:0, bottom:0.25 };
}
else /* if(UA.match(/Gecko/)) */{
	if(UA.match(/Win/)){
		S_HEIGHT = { 'candle-top':-0.65, top:-0.8,  hanging:-0.8,  middle:-0.3,  alphabetic:0, bottom:0.2  };
	}
	else{
		S_HEIGHT = { 'candle-top':-0.5,  top:-0.6,  hanging:-0.6,  middle:-0.25, alphabetic:0, bottom:0.08 };
	}
}

/* ----------------- */
/*   SVG用ラッパー   */
/* ----------------- */
Candle.addTypes('svg');

Candle.addWrapper('svg:vector',{

	initialize : function(parent){
		this.use = new Candle.TypeList('svg');

		// define const
		this.PATH_MOVE  = S_PATH_MOVE;
		this.PATH_LINE  = S_PATH_LINE;
		this.PATH_CLOSE = S_PATH_CLOSE;
		this.PATH_ARCTO = S_PATH_ARCTO;

		Candle.wrapper.vector.prototype.initialize.call(this, parent);
	},

	/* additional functions (for initialize) */
	initElement : function(){
		var rect = Candle.getRectSize(this.canvas);
		var root = this.child = _doc.createElementNS(SVGNS,'svg');
		root.setAttribute('xmlns', SVGNS);
		root.setAttribute('xmlns:xlink', XLINKNS);
		root.setAttribute('id', this.canvasid);
		root.setAttribute('font-size', "10px");
		root.setAttribute('font-family', "sans-serif");
		root.setAttribute('width', rect.width);
		root.setAttribute('height', rect.height);
		root.setAttribute('viewBox', [0,0,rect.width,rect.height].join(' '));
		this.canvas.appendChild(root);
	},
	initFunction : function(){
		function getOuterHTML(el){ return el.outerHTML || new XMLSerializer().serializeToString(el);}
		
		var root = this.child;
		this.canvas.toDataURL = function(type){
			return "data:image/svg+xml;base64," + window.btoa(getOuterHTML(root));
		};
		this.canvas.toBlob = function(f, type){
			var blob = new Blob([getOuterHTML(root)], {type:'image/svg+xml'});
			if(!!f){ f(blob);}
			return blob;
		};
	},

	clear : function(){
		var root = this.canvas.firstChild, el = root.firstChild;
		while(!!el){ root.removeChild(el); el = root.firstChild;}

		this.resetElement();
	},

	/* layer functions */
	setLayerEdge : function(){ /* nop */ },
	createLayer : function(lid){
		var layer = newEL('g');
		layer.setAttribute('id', lid);
		this.child.appendChild(layer);
		return layer;
	},

	/* property functions */
	setRendering : function(render){
		this.target.setAttribute(S_ATT_RENDERING, render);
	},
	setUnselectable : function(unsel){
		unsel = ((unsel===(void 0)) ? true : !!unsel);
		this.canvas.style.MozUserSelect    = (unsel ? 'none' : 'text');
		this.canvas.style.WebkitUserSelect = (unsel ? 'none' : 'text');
		this.canvas.style.userSelect       = (unsel ? 'none' : 'text');
	},

	changeChildSize : function(child,width,height){
		child.setAttribute('width', width);
		child.setAttribute('height', height);
		var m = child.getAttribute('viewBox').split(/ /);
		child.setAttribute('viewBox', [m[0],m[1],width,height].join(' '));
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		var m = this.child.getAttribute('viewBox').split(/ /);
		m[0]=-left; m[1]=-top;
		this.child.setAttribute('viewBox', m.join(' '));
	},

	/* extended functions */
	setDashSize : function(obj, sizes){
		obj.setAttribute('stroke-dasharray', sizes.join(" "));
	},

	/* SVG Special functions */
	getDefsElement : function(){
		// defs要素がなかったら作成する
		var defs = document.querySelector('defs');
		if(!defs){
			defs = document.createElementNS(SVGNS, 'defs');
			this.child.insertBefore(defs, (this.child.firstChild || null));
		}
		return defs;
	},
	getImageElement : function(image){
		/* defsにimage要素がある場合はそれを参照する */
		var defs = this.getDefsElement();
		var imgel = null, imgs = defs.querySelectorAll("image");
		for(var i=0;i<imgs.length;i++){
			if(imgs[i].getAttributeNS(XLINKNS, "href")===image.src){ imgel = imgs[i]; break;}
		}
		/* defsにimage要素がない場合はdefsにimage要素を追加して返す */
		if(!imgel){
			imgel = newEL('image');
			imgel.setAttribute('id', [this.canvasid, "img", imgs.length].join('_'));
			imgel.setAttribute("width",  image.width);
			imgel.setAttribute("height", image.height);
			imgel.setAttributeNS(XLINKNS, "xlink:href", image.src);
			
			defs.appendChild(imgel);
		}
		return imgel;
	},
	getImageSymbol : function(image,sx,sy,sw,sh){
		/* defsにimage・viewBoxが共通のsymbol要素がある場合はそれを参照する */
		var defs = this.getDefsElement();
		var viewbox = [sx,sy,sw,sh].join(" ");
		var symbol = null, syms = defs.querySelectorAll("symbol");
		for(var i=0;i<syms.length;i++){
			if(syms[i].getAttribute("viewBox")===viewbox){ symbol = syms[i]; break;}
		}
		/* defsにimage・viewBoxが共通のsymbol要素がない場合はdefsにsymbol要素を追加して返す */
		if(!symbol){
			symbol = document.createElementNS(SVGNS, 'symbol');
			symbol.setAttribute("id", [this.canvasid, "symimg", syms.length].join('_'));
			symbol.setAttribute("viewBox", viewbox);
			
			var use = document.createElementNS(SVGNS, 'use');
			use.setAttributeNS(XLINKNS, "xlink:href", "#"+this.getImageElement(image).getAttribute("id"));
			symbol.appendChild(use);
			
			defs.appendChild(symbol);
		}
		return symbol;
	},

	/* Canvas API functions (for text) */
	fillText_main : function(el,text,x,y){
		var newel = !el, _cache = (!!this.vid ? this._textcache[this.vid] || {} : {});
		if(newel){ el = newEL('text');}
		else{ this.show(el);}

		if(el.getAttribute(S_ATT_FILL)!==this.fillStyle){ el.setAttribute(S_ATT_FILL, this.fillStyle);}

		if(_cache.x!==x || _cache.y!==y || _cache.ta!==this.textAlign || _cache.tb!==this.textBaseline || _cache.font!==this.font){
			var ME = Candle.ME;
			ME.style.font = this.font;
			ME.innerHTML = text;
			var top = y - ME.offsetHeight * S_HEIGHT[this.textBaseline.toLowerCase()];
			var anchor = S_ANCHOR[this.textAlign.toLowerCase()];
			 
			if(el.getAttribute('x')!==x)  { el.setAttribute('x', x);}
			if(el.getAttribute('y')!==top){ el.setAttribute('y', top);}
			if(el.getAttribute('text-anchor')!==anchor){ el.setAttribute('text-anchor', anchor);}
			
			_cache.x = x;
			_cache.y = y;
			_cache.ta = this.textAlign;
			_cache.tb = this.textBaseline;
		}

		if(_cache.font!==this.font){
			if(this.font.match(/(.+\s)?([0-9]+)px (.+)$/)){
				var style = RegExp.$1, size = RegExp.$2, family = RegExp.$3;
				el.setAttribute('font-size', size);
				
				if(!family.match(/^sans\-serif$/i)){ el.setAttribute('font-family', family);}
				else{ el.removeAttribute('font-family');}
				
				if(style.match(/(italic|oblique)/)){ el.setAttribute('font-style', RegExp.$1);}
				else{ el.removeAttribute('font-style');}
				
				if(style.match(/(bold|bolder|lighter|[1-9]00)/)){ el.setAttribute('font-weight', RegExp.$1);}
				else{ el.removeAttribute('font-weight');}
			}
			else{
				el.setAttribute('font', this.font);
			}
			
			_cache.font = this.font;
		}

		if(el.textContent!==text){ el.textContent = text;}

		if(!!this.vid){ this._textcache[this.vid] = _cache;}

		if(newel){ this.target.appendChild(el);}
		return el;
	},

	/* Canvas API functions (for image) */
	drawImage_main : function(el,image,sx,sy,sw,sh,dx,dy,dw,dh){
		var newel = !el;
		if(newel){ el = newEL('use');}
		else{ this.show(el);}
		var refid = this.getImageSymbol(image,sx,sy,sw,sh).getAttribute("id");

		/* viewBoxはgetImageSymbol()で設定済み */
		if(el.getAttribute('x')!==dx){ el.setAttribute('x', dx);}
		if(el.getAttribute('y')!==dy){ el.setAttribute('y', dy);}
		if(el.getAttribute('width') !==dw){ el.setAttribute('width',  dw);}
		if(el.getAttribute('height')!==dh){ el.setAttribute('height', dh);}
		if(el.getAttributeNS("xlink:href")!=="#"+refid){
			el.setAttributeNS(XLINKNS, "xlink:href", "#"+refid);
		}

		if(newel){ this.target.appendChild(el);}
		return el;
	},

	/* internal functions */
	addVectorElement_main : function(el,isfill,isstroke){
		var newel = !el;
		if(newel){
			el = newEL('path');
			el.setAttribute(S_ATT_FILL,   S_NONE);
			el.setAttribute(S_ATT_STROKE, S_NONE);
		}
		else{ this.show(el);}

		if(!this.freezepath || newel){
			var path = this.cpath.join(' ');
			var linewidth = (isstroke ? this.lineWidth : null);
			if(el.getAttribute(S_ATT_PATH)       !==path)     { el.setAttribute(S_ATT_PATH, path);}
			if(el.getAttribute(S_ATT_STROKEWIDTH)!==linewidth){ el.setAttribute(S_ATT_STROKEWIDTH, linewidth);}
		}
		
		var fillcolor   = (isfill   ? this.fillStyle   : S_NONE);
		var strokecolor = (isstroke ? this.strokeStyle : S_NONE);
		if(el.getAttribute(S_ATT_FILL)  !==fillcolor)  { el.setAttribute(S_ATT_FILL,   fillcolor);}
		if(el.getAttribute(S_ATT_STROKE)!==strokecolor){ el.setAttribute(S_ATT_STROKE, strokecolor);}

		if(newel){ this.target.appendChild(el);}
		return el;
	}
});

})();
