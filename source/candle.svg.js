// candle.svg.js

(function(){

/* ------------------- */
/*   SVG描画可能条件   */
/* ------------------- */
var SVGNS   = "http://www.w3.org/2000/svg",
	XLINKNS = "http://www.w3.org/1999/xlink";
if(!document.createElementNS || !document.createElementNS(SVGNS, 'svg').suspendRedraw){ return;}

function newEL(tag){ return _doc.createElementNS(SVGNS, tag);}

/* ------------------------------------------- */
/*   VectorContext(SVG)クラス用const文字列集   */
/* ------------------------------------------- */
var S_PATH_MOVE   = ' M',
	S_PATH_LINE   = ' L',
	S_PATH_ARCTO  = ' A',
	S_PATH_CLOSE  = ' z',

	S_ATT_ID          = 'id',
	S_ATT_FILL        = 'fill',
	S_ATT_STROKE      = 'stroke',
	S_ATT_STROKEWIDTH = 'stroke-width',
	S_ATT_RENDERING   = 'shape-rendering',

	S_NONE = 'none',

	S_ANCHOR = { left:'start', center:'middle', right:'end'},
	S_HEIGHT = { top:-0.7, hanging:-0.66, middle:-0.3, alphabetic:0, bottom:0.1 };

/* ----------------- */
/*   SVG用ラッパー   */
/* ----------------- */
Candle.addTypes('svg');

Candle.addWrapper('svg:vector',{

	initialize : function(idname){
		Candle.wrapper.vector.prototype.initialize.call(this, idname);

		this.use = new Candle.TypeList('svg');

		// define const
		this.PATH_MOVE  = S_PATH_MOVE;
		this.PATH_LINE  = S_PATH_LINE;
		this.PATH_CLOSE = S_PATH_CLOSE;
		this.PATH_ARCTO = S_PATH_ARCTO;

		this.initElement();
	},

	/* additional functions (for initialize) */
	initElement : function(){
		this.canvas = _doc.getElementById(this.idname);

		var rect = Candle.getRectSize(this.canvas);
		var top = newEL('svg');
		top.setAttribute('id', this.canvasid);
		top.setAttribute('font-size', "10px");
		top.setAttribute('font-family', "sans-serif");
		top.setAttribute('width', rect.width);
		top.setAttribute('height', rect.height);
		top.setAttribute('viewBox', [0,0,rect.width,rect.height].join(' '));
		this.canvas.appendChild(top);

		this.child = top;
		this.afterInit();
	},

	initTarget : function(){
		this.target = _doc.getElementById(this.canvasid);
	},
	clear : function(){
		var top = this.canvas.firstChild, el = top.firstChild;
		while(!!el){ top.removeChild(el); el=top.firstChild;}

		this.resetElement();
	},

	/* layer functions */
	setLayerEdge : function(){ /* nop */ },
	createLayer : function(lid){
		var layer = newEL('g');
		layer.setAttribute('id', lid);
		this.target.appendChild(layer);
		return layer;
	},
	getLayerById : function(id){
		return _doc.getElementById(id);
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

	/* Canvas API functions (for text) */
	fillText_main : function(text,x,y){
		var already = (!!this.vid && !!this.elements[this.vid]);
		var ME = Candle.ME;
		ME.style.font = this.font; ME.innerHTML = text;
		var top = y - (ME.offsetHeight * S_HEIGHT[this.textBaseline.toLowerCase()]);

		if(!already){ el = newEL('text');}
		else{
			el = this.elements[this.vid];
			el.removeAttribute('opacity');
		}
		el.setAttribute('x', x);
		el.setAttribute('y', top);
		el.setAttribute(S_ATT_FILL, Candle.parse(this.fillStyle));
		el.setAttribute('text-anchor', S_ANCHOR[this.textAlign.toLowerCase()]);
		el.style.font = this.font;
		if(!already){
			el.appendChild(_doc.createTextNode(text));
			this.target.appendChild(el);
		}
		else{
			el.replaceChild(_doc.createTextNode(text), el.firstChild);
		}
		return el;
	},

	/* Canvas API functions (for image) */
	drawImage_main : function(image,sx,sy,sw,sh,dx,dy,dw,dh){
		var el, img, already = (!!this.vid && !!this.elements[this.vid]);
		if(!already){
			el = newEL('svg');
			img = newEL("image");
			el.appendChild(img);
		}
		else{
			el = this.elements[this.vid];
			el.removeAttribute('opacity');
			img = el.firstChild;
		}
		el.setAttribute("viewBox", [sx,sy,sw,sh].join(" "));
		el.setAttribute("x", dx);
		el.setAttribute("y", dy);
		el.setAttribute("width",  dw);
		el.setAttribute("height", dh);

		img.setAttributeNS(null, "width",  image.width);
		img.setAttributeNS(null, "height", image.height);
		img.setAttributeNS(XLINKNS, "xlink:href", image.src);

		if(!already){ this.target.appendChild(el);}
		return el;
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		var child = this.canvas.firstChild;
		var m = child.getAttribute('viewBox').split(/ /);
		m[0]=-left, m[1]=-top;
		child.setAttribute('viewBox', m.join(' '));
	},

	/* extended functions */
	setDashSize : function(obj, sizes){
		obj.setAttribute('stroke-dasharray', sizes.join(" "));
	},

	/* internal functions */
	addVectorElement_main : function(isfill,isstroke){
		var el, already = (!!this.vid && !!this.elements[this.vid]);
		var fillcolor = Candle.parse(this.fillStyle), strokecolor = Candle.parse(this.strokeStyle);
		if(!already){
			el = newEL('path');
			el.setAttribute('d', this.cpath.join(' '));
			el.setAttribute(S_ATT_FILL,   (isfill ? fillcolor : S_NONE));
			el.setAttribute(S_ATT_STROKE, (isstroke ? strokecolor : S_NONE));
			if(isstroke){ el.setAttribute(S_ATT_STROKEWIDTH, this.lineWidth, 'px');}
			
			this.target.appendChild(el);
		}
		else{
			el = this.elements[this.vid];
			el.removeAttribute('opacity');
			el.setAttribute(S_ATT_FILL,   (isfill ? fillcolor : S_NONE));
			el.setAttribute(S_ATT_STROKE, (isstroke ? strokecolor : S_NONE));
		}
		return el;
	}
});

})();
