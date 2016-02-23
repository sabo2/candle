// candle.svg.js
/* global Candle:false, _doc:false, _2PI:false, Buffer:false */

(function(){

/* ------------------- */
/*   SVG描画可能条件   */
/* ------------------- */
if(typeof document==='undefined' || !document.createElementNS || (typeof window!=='undefined' && !!window.opera)){ return;}

var canvas_mode = (typeof process==='undefined' ? 'html' : 'node');

var SVGNS   = Candle.SVGNS   = "http://www.w3.org/2000/svg",
	XLINKNS = Candle.XLINKNS = "http://www.w3.org/1999/xlink";

function newEL(tag){ return _doc.createElementNS(SVGNS, tag);}

/* ------------------------------------------- */
/*   VectorContext(SVG)クラス用const文字列集   */
/* ------------------------------------------- */
var S_PATH_MOVE   = 'M',
	S_PATH_LINE   = 'L',
	S_PATH_ARCTO  = 'A',
	S_PATH_CLOSE  = 'z',

//	S_ATT_ID          = 'id',
	S_ATT_PATH        = 'd',
	S_ATT_FILL        = 'fill',
	S_ATT_STROKE      = 'stroke',
	S_ATT_STROKEWIDTH = 'stroke-width',
	S_ATT_RENDERING   = 'shape-rendering',

	S_NONE = 'none',

	S_ANCHOR = { left:'start', center:'middle', right:'end'},
	S_HEIGHT;

function setheight(){
	var UA = (typeof navigator!=='undefined' ? (navigator.userAgent||'') : '');
	if(UA.match(/Chrome/)){
		S_HEIGHT = { 'candle-top':-0.72, top:-0.95, hanging:-0.72, middle:-0.35, alphabetic:0, bottom:0.25 };
	}
	else if(UA.match(/AppleWebKit/)){
		S_HEIGHT = { 'candle-top':-0.7,  top:-0.9,  hanging:-0.9,  middle:-0.35, alphabetic:0, bottom:0.25 };
	}
	else if(UA.match(/Trident/)){
		S_HEIGHT = { 'candle-top':-0.74, top:-1.02, hanging:-1.02, middle:-0.32, alphabetic:0, bottom:0.45 };
	}
	else /* if(UA.match(/Gecko/)) */{
		if(UA.match(/Win/)){
			S_HEIGHT = { 'candle-top':-0.7,  top:-0.85, hanging:-0.85, middle:-0.34, alphabetic:0, bottom:0.15 };
		}
		else{
			S_HEIGHT = { 'candle-top':-0.76, top:-0.9,  hanging:-0.9,  middle:-0.38, alphabetic:0, bottom:0.08 };
		}
	}
}

/* ----------------- */
/*   SVG用ラッパー   */
/* ----------------- */
Candle.addType('svg');

Candle.addWrapper('svg:wrapperbase',{

	initialize : function(parent){
		this.use = new Candle.TypeList('svg');

		// define const
		if(!S_HEIGHT){ setheight();}

		// 外部から変更される追加プロパティ
		this.vid      = '';
		this.elements = {};
		this._textcache = {};

		// variables for internal
		this.target = null;	// エレメントの追加対象となるオブジェクト
		this.layers = {};

		// 描画中path
		this.cpath    = [];
		this.lastpath = '';
		this.freezepath = false;

		Candle.wrapper.wrapperbase.prototype.initialize.call(this, parent);
	},

	/* additional functions (for initialize) */
	initElement : function(){
		if(canvas_mode==='html'){
			this.canvas.style.overflow = 'hidden';
		}
		var rect = Candle.getRectSize(this.canvas);
		var root = this.child = _doc.createElementNS(SVGNS,'svg');
		root.setAttribute('xmlns', SVGNS);
		root.setAttribute('xmlns:xlink', XLINKNS);
		root.setAttribute('font-size', "10px");
		root.setAttribute('font-family', "sans-serif");
		root.setAttribute('width', rect.width);
		root.setAttribute('height', rect.height);
		root.setAttribute('viewBox', [0,0,rect.width,rect.height].join(' '));
		if(!!this.canvas.appendChild){
			this.canvas.appendChild(root);
		}
	},
	initFunction : function(){
		function btoa(bin){
			if(canvas_mode==='html'){ return window.btoa(bin);}
			else if(Buffer.isBuffer(bin)){ return bin.toString('base64');}
			else{ return new Buffer(bin.toString(), 'binary').toString('base64');}
		}
		var xmldeclare = '<?xml version="1.0" encoding="UTF-8"?>\n';
		function getOuterHTML(el){ return (el.outerHTML || new XMLSerializer().serializeToString(el)).replace(/^<\?xml.+?\?>[\r\n]*/,'');}
		
		var root = this.child;
		this.canvas.toDataURL = function(type, quality){
			return "data:image/svg+xml;base64," + btoa(getOuterHTML(root));
		};
		this.canvas.toBlob = function(callback, type, quality){
			callback(new Blob([xmldeclare + getOuterHTML(root)], {type:'image/svg+xml'}));
		};
		this.canvas.toBuffer = function(type, quality){
			return xmldeclare + getOuterHTML(root);
		};
	},
	initLayer : function(){
		this.setLayer();

		var rect = Candle.getRectSize(this.canvas);
		this.rect(0,0,rect.width,rect.height);
		this.addVectorElement(false,false);
	},

	clear : function(){
		var root = this.child, el = root.firstChild;
		while(!!el){ root.removeChild(el); el = root.firstChild;}

		/* resetElement */
		this.vid = '';
		this.elements = {};
		this.layers = {};
		this.target = this.child;
		this.setLayer();
		this._textcache = {};
	},

	/* layer functions */
	setLayer : function(layerid, option){
		option = option || {};
		this.vid = '';
		if(!!layerid){
			var layer = this.layers[layerid];
			if(!layer){
				layer = this.layers[layerid] = newEL('g');
				this.child.appendChild(layer);
			}
			this.target = layer;
		}
		else{
			this.target = this.child;
		}
		
		if(option.rendering){ this.setRendering(option.rendering);}
		
		this.freezepath = (!!option && option.freeze);
	},

	/* property functions */
	setRendering : function(render){
		this.target.setAttribute(S_ATT_RENDERING, render);
	},

	changeSize : function(width,height){
		if(canvas_mode==='html'){
			this.canvas.style.width  = width + 'px';
			this.canvas.style.height = height + 'px';
		}
		var child = this.child;
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

	/* Canvas API functions (for path) */
	beginPath : function(){
		this.cpath = [];
		this.lastpath = '';
	},
	closePath : function(){
		this.cpath.push(S_PATH_CLOSE);
		this.lastpath = S_PATH_CLOSE;
	},

	moveTo : function(x,y){
		this.cpath.push(S_PATH_MOVE,x,y);
		this.lastpath = S_PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==S_PATH_LINE){ this.cpath.push(S_PATH_LINE);}
		this.cpath.push(x,y);
		this.lastpath = S_PATH_LINE;
	},
	rect : function(x,y,w,h){
		this.cpath.push(S_PATH_MOVE,x,y,S_PATH_LINE,(x+w),y,(x+w),(y+h),x,(y+h),S_PATH_CLOSE);
		this.lastpath = S_PATH_CLOSE;
	},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		var sx,sy,ex,ey;
		if(endRad-startRad>=_2PI){ sx=cx+r; sy=cy; ex=cx+r; ey=cy;}
		else{
			sx = cx + r*Math.cos(startRad); sy = cy + r*Math.sin(startRad);
			ex = cx + r*Math.cos(endRad);   ey = cy + r*Math.sin(endRad);
		}
		if(endRad-startRad>=_2PI){ sy+=0.125;}
		var unknownflag = (startRad>endRad)!==(Math.abs(endRad-startRad)>Math.PI);
		var islong = ((antiClockWise^unknownflag)?1:0), sweep = ((islong===0^unknownflag)?1:0);
		this.cpath.push(S_PATH_MOVE,sx,sy,S_PATH_ARCTO,r,r,0,islong,sweep,ex,ey);
		this.lastpath = S_PATH_ARCTO;
	},

	/* Canvas API functions (for drawing) */
	fill   : function(){ this.addVectorElement(true,false);},
	stroke : function(){ this.addVectorElement(false,true);},
	shape  : function(){ this.addVectorElement(true,true);}, /* extension */

	/* Canvas API functions (rect) */
	fillRect   : function(x,y,w,h){
		var stack = this.cpath;
		this.cpath = [];
		this.rect(x,y,w,h);
		this.addVectorElement(true,false);
		this.cpath = stack;
	},
	strokeRect : function(x,y,w,h){
		var stack = this.cpath;
		this.cpath = [];
		this.rect(x,y,w,h);
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	shapeRect  : function(x,y,w,h){
		var stack = this.cpath;
		this.cpath = [];
		this.rect(x,y,w,h);
		this.addVectorElement(true,true);
		this.cpath = stack;
	},

	/* extended functions */
	setLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2), a=[];
		for(var i=0;i<len;i+=2){ a[i>>1] = [_args[i],_args[i+1]];}
		this.beginPath();
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.cpath.push(S_PATH_CLOSE);}
	},
	setOffsetLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2), a=[];
		for(var i=0;i<len-2;i+=2){ a[i>>1] = [_args[i+2]+_args[0], _args[i+3]+_args[1]];}
		this.beginPath();
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.cpath.push(S_PATH_CLOSE);}
	},
	setLinePath_com : function(array){
		for(var i=0,len=array.length;i<len;i++){
			this.cpath.push(i===0 ? S_PATH_MOVE : S_PATH_LINE);
			this.cpath.push(array[i][0],array[i][1]);
		}
	},

	strokeLine : function(x1,y1,x2,y2){
		var stack = this.cpath;
		this.cpath = [S_PATH_MOVE,x1,y1,S_PATH_LINE,x2,y2];
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		var stack = this.cpath;
		this.cpath = [S_PATH_MOVE,x1,y1,S_PATH_LINE,x2,y2];
		var obj = this.addVectorElement(false,true);
		obj.setAttribute('stroke-dasharray', sizes.join(" "));
		this.cpath = stack;
	},
	strokeCross : function(cx,cy,l){
		var stack = this.cpath;
		this.cpath = [S_PATH_MOVE,(cx-l),(cy-l),S_PATH_LINE,(cx+l),(cy+l),
					  S_PATH_MOVE,(cx-l),(cy+l),S_PATH_LINE,(cx+l),(cy-l)];
		this.addVectorElement(false,true);
		this.cpath = stack;
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(true,false);
		this.cpath = stack;
	},
	strokeCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	shapeCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(true,true);
		this.cpath = stack;
	},

	/* SVG Special functions */
	getDefsElement : function(){
		// defs要素がなかったら作成する
		var defs = this.child.querySelector('defs');
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
			imgel.setAttribute('id', (!!imgel.ownerDocument?this.canvasid+'_':'')+"img"+(imgs.length));
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
			symbol.setAttribute("id", (!!symbol.ownerDocument?this.canvasid+'_':'')+"symimg"+syms.length);
			symbol.setAttribute("viewBox", viewbox);
			
			var use = document.createElementNS(SVGNS, 'use');
			use.setAttributeNS(XLINKNS, "xlink:href", "#"+this.getImageElement(image).getAttribute("id"));
			symbol.appendChild(use);
			
			defs.appendChild(symbol);
		}
		return symbol;
	},

	/* Canvas API functions (for text) */
	fillText : function(text,x,y){
		var el = (!!this.vid ? this.elements[this.vid] : null);
		if(!!text && !!this.fillStyle && this.fillStyle!=="none"){
			var el2 = this.fillText_main(el,text,x,y);
			if(!el && !!this.vid){ this.elements[this.vid] = el2;}
		}
		else if(!!el){ this.hide(el);}
		this.vid = '';
	},
	fillText_main : function(el,text,x,y){
		var newel = !el, _cache = (!!this.vid ? this._textcache[this.vid] || {} : {});
		if(newel){ el = newEL('text');}
		else{ this.show(el);}

		if(el.getAttribute(S_ATT_FILL)!==this.fillStyle){ el.setAttribute(S_ATT_FILL, this.fillStyle);}

		if(_cache.x!==x || _cache.y!==y || _cache.ta!==this.textAlign || _cache.tb!==this.textBaseline || _cache.font!==this.font){
			var top = y - Candle.getoffsetHeight(text, this.font) * S_HEIGHT[this.textBaseline.toLowerCase()];
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
	drawImage : function(image,sx,sy,sw,sh,dx,dy,dw,dh){
		var el = (!!this.vid ? this.elements[this.vid] : null);
		if(!!image){
			if(sw===(void 0)){ sw=image.width; sh=image.height;}
			if(dx===(void 0)){ dx=sx; sx=0; dy=sy; sy=0; dw=sw; dh=sh;}
			
			var el2 = this.drawImage_main(el,image,sx,sy,sw,sh,dx,dy,dw,dh);
			if(!el && !!this.vid){ this.elements[this.vid] = el2;}
		}
		else if(!!el){ this.hide(el);}
		this.vid = '';
	},
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
		if(el.getAttributeNS(XLINKNS, "xlink:href")!=="#"+refid){
			el.setAttributeNS(XLINKNS, "xlink:href", "#"+refid);
		}

		if(newel){ this.target.appendChild(el);}
		return el;
	},

	/* internal functions */
	addVectorElement : function(isfill,isstroke){
		isfill   = isfill   && !!this.fillStyle   && (this.fillStyle  !=="none");
		isstroke = isstroke && !!this.strokeStyle && (this.strokeStyle!=="none");
		var el = (!!this.vid ? this.elements[this.vid] : null), el2 = null;
		if(isfill || isstroke){
			el2 = this.addVectorElement_main(el,isfill,isstroke);
			if(!el && !!this.vid){ this.elements[this.vid] = el2;}
		}
		else if(!!el){ this.hide(el);}
		this.vid = '';
		return el2;
	},
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
	},

	/* VectorID Functions */
	vhide : function(vids){
		var el = this.elements[this.vid];
		if(!!el){ this.hide(el);}
	},
	
	show : function(el){ el.removeAttribute('display');},
	hide : function(el){ el.setAttribute('display', 'none');}
});

})();
