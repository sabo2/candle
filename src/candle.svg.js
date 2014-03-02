// candle.svg.js

(function(){

/* ------------------- */
/*   SVG描画可能条件   */
/* ------------------- */
var SVGNS   = "http://www.w3.org/2000/svg",
	XLINKNS = "http://www.w3.org/1999/xlink";
if(!document.createElementNS || !document.createElementNS(SVGNS, 'svg').suspendRedraw){ return;}

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
		var top = _doc.createElementNS(SVGNS,'svg');
		top.setAttribute('xmlns', SVGNS);
		top.setAttribute('xmlns:xlink', XLINKNS);
		top.setAttribute('id', this.canvasid);
		top.setAttribute('font-size', "10");
		top.setAttribute('font-family', "sans-serif");
		top.setAttribute('width', rect.width);
		top.setAttribute('height', rect.height);
		top.setAttribute('viewBox', [0,0,rect.width,rect.height].join(' '));
		this.canvas.appendChild(top);

		this.child = top;
		this.afterInit();

		this.canvas.toDataURL = function(type){
			return "data:image/svg+xml;base64," + window.btoa(top.innerHTML);
		};
		this.canvas.toBlob = function(){
			return new Blob([top.innerHTML], {type:'image/svg+xml'});
		};
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
		var layer = _doc.createElementNS(SVGNS,'g');
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
	fillText : function(text,x,y){
		var already = (!!this.vid && !!this.elements[this.vid]);
		var ME = Candle.ME;

		ME.style.font = this.font; ME.innerHTML = text;
		var top = y - (ME.offsetHeight * S_HEIGHT[this.textBaseline.toLowerCase()]);

		var el = (already ? this.elements[this.vid] : _doc.createElementNS(SVGNS,'text'));
		el.setAttribute('x', x);
		el.setAttribute('y', top);
		el.setAttribute(S_ATT_FILL, Candle.parse(this.fillStyle));
		el.setAttribute('text-anchor', S_ANCHOR[this.textAlign.toLowerCase()]);
		el.setAttribute('font', this.font.replace(/([0-9]+)px/, RegExp.$1));
		if(!already){
			el.appendChild(_doc.createTextNode(text));
			this.target.appendChild(el);
			this.lastElement = el;
		}
		else{
			el.replaceChild(_doc.createTextNode(text), el.firstChild);
		}

		if(!already && !!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	},

	/* Canvas API functions (for image) */
	drawImage : function(image,sx,sy,sw,sh,dx,dy,dw,dh){
		if(sw===(void 0)){ sw=image.width; sh=image.height;}
		if(dx===(void 0)){ dx=sx; sx=0; dy=sy; sy=0; dw=sw; dh=sh;}
		var already = (!!this.vid && !!this.elements[this.vid]);

		var el = (already ? this.elements[this.vid] : _doc.createElementNS(SVGNS, "svg"));
		el.setAttribute("viewBox", [sx,sy,sw,sh].join(" "));
		el.setAttribute("x", dx);
		el.setAttribute("y", dy);
		el.setAttribute("width",  dw);
		el.setAttribute("height", dh);

		var img = (already ? el.firstChild : _doc.createElementNS(SVGNS, "image"));
		img.setAttributeNS(null, "width",  image.width);
		img.setAttributeNS(null, "height", image.height);
		img.setAttributeNS(XLINKNS, "xlink:href", image.src);
		if(!already){
			el.appendChild(img);
			this.target.appendChild(el);
			this.lastElement = el;
		}

		if(!already && !!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		var child = this.canvas.firstChild;
		var m = child.getAttribute('viewBox').split(/ /);
		m[0]=-left, m[1]=-top;
		child.setAttribute('viewBox', m.join(' '));
	},

	/* extended functions */
	setDashSize : function(sizes){
		if(!this.lastElement){ return;}
		this.lastElement.setAttribute('stroke-dasharray', sizes.join(" "));
	},

	/* internal functions */
	addVectorElement : function(isfill,isstroke){
		var path = this.cpath.join(' ');

		var el = _doc.createElementNS(SVGNS,'path');
		el.setAttribute('d', path);
		el.setAttribute(S_ATT_FILL,   (isfill ? Candle.parse(this.fillStyle) : S_NONE));
		el.setAttribute(S_ATT_STROKE, (isstroke ? Candle.parse(this.strokeStyle) : S_NONE));
		if(isstroke) { el.setAttribute(S_ATT_STROKEWIDTH, this.lineWidth);}

		this.target.appendChild(el);
		this.lastElement = el;

		if(!!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	}
});

})();
