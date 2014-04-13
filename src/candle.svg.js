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
	S_HEIGHT = { top:-0.7, hanging:-0.6, middle:-0.25, alphabetic:0, bottom:0.1 };

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
		var parent = this.canvas = _doc.getElementById(this.idname);

		var rect = Candle.getRectSize(this.canvas);
		var root = newEL('svg');
		root.setAttribute('xmlns', SVGNS);
		root.setAttribute('id', this.canvasid);
		root.setAttribute('font-size', "10px");
		root.setAttribute('font-family', "sans-serif");
		root.setAttribute('width', rect.width);
		root.setAttribute('height', rect.height);
		root.setAttribute('viewBox', [0,0,rect.width,rect.height].join(' '));
		parent.appendChild(root);

		this.child = root;
		this.afterInit();

		parent.toDataURL = function(type){
			return "data:image/svg+xml;base64," + window.btoa(root.outerHTML || new XMLSerializer().serializeToString(root));
		};
		parent.toBlob = function(){
			return new Blob([root.outerHTML || new XMLSerializer().serializeToString(root)], {type:'image/svg+xml'});
		};
	},

	initTarget : function(){
		this.target = _doc.getElementById(this.canvasid);
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

	/* Canvas API functions (for text) */
	fillText_main : function(el,text,x,y){
		var newel = !el;
		if(newel){ el = newEL('text');}
		else{ this.show(el);}

		var ME = Candle.ME;
		ME.style.font = this.font;
		ME.innerHTML = text;
		var top = y - ME.offsetHeight * S_HEIGHT[this.textBaseline.toLowerCase()];
		
		el.setAttribute('x', x);
		el.setAttribute('y', top);
		el.setAttribute(S_ATT_FILL, Candle.parse(this.fillStyle));
		el.setAttribute('text-anchor', S_ANCHOR[this.textAlign.toLowerCase()]);

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

		var textnode = _doc.createTextNode(text);
		if(newel){ el.appendChild(textnode);}
		else     { el.replaceChild(textnode, el.firstChild);}

		if(newel){ this.target.appendChild(el);}
		return el;
	},

	/* Canvas API functions (for image) */
	drawImage_main : function(el,image,sx,sy,sw,sh,dx,dy,dw,dh){
		var newel = !el;
		if(newel){
			el = newEL('svg');
			el.appendChild(newEL("image"));
		}
		else{ this.show(el);}

		el.setAttribute("viewBox", [sx,sy,sw,sh].join(" "));
		el.setAttribute("x", dx);
		el.setAttribute("y", dy);
		el.setAttribute("width",  dw);
		el.setAttribute("height", dh);
		var img = el.firstChild;
		img.setAttributeNS(null, "width",  image.width);
		img.setAttributeNS(null, "height", image.height);
		img.setAttributeNS(XLINKNS, "xlink:href", image.src);

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

		var path = this.cpath.join(' '),
			fillcolor   = (isfill   ? Candle.parse(this.fillStyle)   : S_NONE),
			strokecolor = (isstroke ? Candle.parse(this.strokeStyle) : S_NONE);
		el.setAttribute('d', path);
		if(isfill)  { el.setAttribute(S_ATT_FILL,   fillcolor);}
		if(isstroke){ el.setAttribute(S_ATT_STROKE, strokecolor);}
		if(isstroke){ el.setAttribute(S_ATT_STROKEWIDTH, this.lineWidth);}

		if(newel){ this.target.appendChild(el);}
		return el;
	}
});

})();
