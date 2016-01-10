// candle.vml.js
/* global Candle:false, _doc:false, _2PI:false */
 
(function(){

/* ------------------- */
/*   VML描画可能条件   */
/* ------------------- */
if(typeof document==='undefined'){ return;}
try{ document.namespaces.add("v", "urn:schemas-microsoft-com:vml");}catch(e){ return;}

/* ------------------------------------------- */
/*   VectorContext(VML)クラス用const文字列集   */
/* ------------------------------------------- */
var V_TAG_SHAPE    = '<v:shape',
	V_TAG_GROUP    = '<v:group',
	V_TAG_IMAGE    = '<v:image',
	V_TAG_TEXTPATH = '<v:textpath',
	V_TAG_POLYLINE = '<v:polyline',
	V_TAG_PATH_FOR_TEXTPATH = '<v:path textpathok="t" />',
	V_EL_UNSELECTABLE = ' unselectable="on"',
	V_TAGEND      = '>',
	V_TAGEND_NULL = ' />',
//	V_CLOSETAG_SHAPE    = '</v:shape>',
	V_CLOSETAG_GROUP    = '</v:group>',
//	V_CLOSETAG_IMAGE    = '</v:image>',
//	V_CLOSETAG_TEXTPATH = '</v:textpath>',
	V_CLOSETAG_POLYLINE = '</v:polyline>',

//	V_ATT_ID     = ' id="',
//	V_ATT_PATH   = ' path="',
	V_ATT_POINTS = ' points="',
	V_ATT_STYLE  = ' style="',
	V_ATT_STRING = ' string="',
	V_ATT_COORDSIZE    = ' coordsize="100,100"',
	V_ATT_FILLCOLOR    = ' fillcolor="',
//	V_ATT_STROKECOLOR  = ' strokecolor="',
//	V_ATT_STROKEWEIGHT = ' strokeweight="',
	V_ATT_END = '"',
//	V_ATT_STYLE_TEXTBOX = ' style="white-space:nowrap;cursor:default;font:10px sans-serif;"',
	V_DEF_ATT_POLYLINE  = ' stroked="f" filled="t"',
	V_DEF_ATT_TEXTPATH  = ' on="t" xscale="t"',

//	V_STYLE_LEFT  = 'left:',
//	V_STYLE_TOP   = 'top:',
	V_STYLE_FONT  = 'font:',
	V_STYLE_ALIGN = 'v-text-align:',
	V_STYLE_END   = ';',

	V_PATH_MOVE   = 'm',
	V_PATH_LINE   = 'l',
	V_PATH_CLOSE  = 'x',
	V_PATH_ARCTO  = '?', /* 'at'か'wa'どちらか */
	V_PATH_NOSTROKE = 'ns',
	V_PATH_NOFILL   = 'nf',

	V_WIDTH = { left:0, center:0.5, right:1 },
	V_HEIGHT = { 'candle-top':-0.25, top:-0.4, hanging:-0.4, middle:0, alphabetic:0.22, bottom:0.4 },

	Z  = 10,
	Z2 = Z/2;

function ePos(num){
	num += (num>0?0.5:-0.5);
	return (num*Z-Z2)|0;
}
function eLen(num){
	return (num*Z)|0;
}

var Super = Candle.wrapper.vector.prototype;

/* ----------------------- */
/*   CSS, NameSpace設定    */
/* ----------------------- */
/* addNameSpace for VML */
/* ネームスペースの追加はVML描画可能条件に移動しました */

/* addStyleSheet for VML */
var V_BH  = "behavior: url(#default#VML);";
var V_BH2 = V_BH + " position:absolute; width:10px; height:10px;";
Candle.addCSS("v\\:shape",    V_BH2);
Candle.addCSS("v\\:group",    V_BH2);
Candle.addCSS("v\\:polyline", V_BH2);
Candle.addCSS("v\\:image",    V_BH2);
Candle.addCSS("v\\:path",     V_BH);
Candle.addCSS("v\\:textpath", V_BH);
Candle.addCSS("v\\:stroke",   V_BH);

/* ----------------------- */
/*   VectorContextクラス   */
/* ----------------------- */
Candle.addTypes('vml');

Candle.addWrapper('vml:vector',{

	initialize : function(parent){
		this.use = new Candle.TypeList('vml');

		// define const
		this.PATH_MOVE  = V_PATH_MOVE;
		this.PATH_LINE  = V_PATH_LINE;
		this.PATH_CLOSE = V_PATH_CLOSE;
		this.PATH_ARCTO = V_PATH_ARCTO;

		Super.initialize.call(this, parent);
	},

	/* additional functions (for initialize) */
	setParent : function(){
		var parent = this.canvas;
		parent.style.overflow = 'hidden';
		parent.style.display  = 'block';
		parent.style.position = 'relative';
		return parent;
	},
	initElement : function(){
		var rect = Candle.getRectSize(this.canvas);
		var root = this.child = _doc.createElement('div');
		root.id = this.canvasid;
		root.style.position = 'absolute';
		root.style.left   = '-2px';
		root.style.top    = '-2px';
		root.style.width  = rect.width + 'px';
		root.style.height = rect.height + 'px';
		this.canvas.appendChild(root);
	},

	/* layer functions */
	createLayer : function(lid){
		var layer = _doc.createElement('div');
		layer.id = lid;
		layer.unselectable = 'on';
		layer.style.position = 'absolute';
		layer.style.left   = '0px';
		layer.style.top    = '0px';
		this.child.appendChild(layer);
		return layer;
	},

	/* property functions */
	changeChildSize : function(child,width,height){
		child.style.width  = width + 'px';
		child.style.height = height + 'px';
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		var child = this.canvas.firstChild;
		child.style.position = 'absolute';
		child.style.left = left+'px';
		child.style.top  = top +'px';
	},

	/* Canvas API functions (for path) */
	moveTo : function(x,y){
		this.cpath.push(this.PATH_MOVE,ePos(x),ePos(y));
		this.lastpath = this.PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==this.PATH_LINE){ this.cpath.push(this.PATH_LINE);}
		this.cpath.push(ePos(x),ePos(y));
		this.lastpath = this.PATH_LINE;
	},
	rect : function(x,y,w,h){
		x=ePos(x); y=ePos(y); w=eLen(w); h=eLen(h);
		this.cpath.push(this.PATH_MOVE,x,y,this.PATH_LINE,(x+w),y,(x+w),(y+h),x,(y+h),this.PATH_CLOSE);
		this.lastpath = this.PATH_CLOSE;
	},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		var sx,sy,ex,ey;
		if(endRad-startRad>=_2PI){ sx=cx+r; sy=cy; ex=cx+r; ey=cy;}
		else{
			sx = cx + r*Math.cos(startRad); sy = cy + r*Math.sin(startRad);
			ex = cx + r*Math.cos(endRad);   ey = cy + r*Math.sin(endRad);
		}
		if(endRad-startRad>=_2PI){ sy+=0.125;}
		var com = (antiClockWise ? 'at' : 'wa');
		this.cpath.push(com,ePos(cx-r),ePos(cy-r),ePos(cx+r),ePos(cy+r),ePos(sx),ePos(sy),ePos(ex),ePos(ey));
		this.lastpath = com;
	},

	/* extended functions */
	setLinePath_com : function(array){
		for(var i=0,len=array.length;i<len;i++){
			this.cpath.push(i===0 ? this.PATH_MOVE : this.PATH_LINE);
			this.cpath.push(ePos(array[i][0]),ePos(array[i][1]));
		}
	},
	setDashSize : function(obj, sizes){
		var el = _doc.createElement('v:stroke');
		if     (sizes[0]<=2){ el.dashstyle = 'ShortDash';}
		else if(sizes[0]<=5){ el.dashstyle = 'Dash';}
		else                { el.dashstyle = 'LongDash';}
		obj.appendChild(el);
	},

	strokeLine : function(x1,y1,x2,y2){
		Super.strokeLine.call(this,ePos(x1),ePos(y1),ePos(x2),ePos(y2));
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		Super.strokeDashedLine.call(this,ePos(x1),ePos(y1),ePos(x2),ePos(y2),sizes);
	},
	strokeCross : function(cx,cy,l){
		Super.strokeCross.call(this,ePos(cx),ePos(cy),eLen(l));
	},

	/* Canvas API functions (for text) */
	fillText_main : function(el,text,x,y){
		var newel = !el, _cache = (!!this.vid ? this._textcache[this.vid] || {} : {});
		var fillcolor = Candle.parse(this.fillStyle);

		if(!newel && (_cache.x!==x || _cache.y!==y || _cache.ta!==this.textAlign || _cache.tb!==this.textBaseline || _cache.font!==this.font)){
			this.target.removeChild(el);
			newel = true;
		}

		if(newel){
			var ME = Candle.ME;
			ME.style.font = this.font;
			ME.innerHTML = text;
			var wid = (ME.offsetWidth*Z-Z2)|0;
			var left = ((x - ME.offsetWidth  * V_WIDTH [this.textAlign.toLowerCase()]   )*Z-Z2)|0;
			var top  = ((y - ME.offsetHeight * V_HEIGHT[this.textBaseline.toLowerCase()])*Z-Z2)|0;
			
			var ar = [
				V_TAG_GROUP, V_EL_UNSELECTABLE, V_ATT_COORDSIZE, V_TAGEND,
					V_TAG_POLYLINE, V_ATT_POINTS, [left,top,left+wid,top].join(','), V_ATT_END,
					V_DEF_ATT_POLYLINE, V_ATT_FILLCOLOR, fillcolor, V_ATT_END, V_TAGEND,
						V_TAG_PATH_FOR_TEXTPATH,
						
						V_TAG_TEXTPATH, V_DEF_ATT_TEXTPATH, V_ATT_STRING, text, V_ATT_END,
						V_ATT_STYLE, V_STYLE_FONT, this.font, V_STYLE_END,
						V_STYLE_ALIGN, this.textAlign, V_STYLE_END, V_ATT_END, V_TAGEND_NULL,
					V_CLOSETAG_POLYLINE,
				V_CLOSETAG_GROUP
			];
			this.target.insertAdjacentHTML('BeforeEnd', ar.join(''));
			el = this.target.lastChild;
			
			if(!!this.vid){
				this._textcache[this.vid] = { x:x, y:y, font:this.font, ta:this.textAlign, tb:this.textBaseline };
				this.elements[this.vid] = el;
			}
		}
		else{
			this.show(el);
			if(""+el.lastChild.fillcolor !== fillcolor){ el.lastChild.fillcolor = fillcolor;}
			if(el.lastChild.lastChild.string!==text){ el.lastChild.lastChild.string = text;}
		}

		return el;
	},

	/* Canvas API functions (for image) */
	drawImage_main : function(el,image,sx,sy,sw,sh,dx,dy,dw,dh){
		var newel = !el;
		if(newel){
			var ar = [V_TAG_IMAGE, V_EL_UNSELECTABLE, V_ATT_COORDSIZE, V_TAGEND_NULL];
			this.target.insertAdjacentHTML('BeforeEnd', ar.join(''));
			el = this.target.lastChild;
		}
		else{ this.show(el);}

		el.src = image.src;
		el.style.left = dx;
		el.style.top  = dy;
		el.style.width  = dw;
		el.style.height = dh;
		el.style.display = 'inline';
		el.cropleft = sx/image.width;
		el.croptop  = sy/image.height;
		el.cropright  = (1-(sx+sw)/image.width);
		el.cropbottom = (1-(sy+sh)/image.height);

		return el;
	},

	/* internal functions */
	addVectorElement_main : function(el,isfill,isstroke){
		var newel = !el;
		if(newel){
			var ar = [V_TAG_SHAPE, V_EL_UNSELECTABLE, V_ATT_COORDSIZE, V_TAGEND_NULL];
			this.target.insertAdjacentHTML('BeforeEnd', ar.join(''));
			el = this.target.lastChild;
		}
		else{ this.show(el);}

		if(!this.freezepath || newel){
			var path = [this.cpath.join(' '), (!isfill ? V_PATH_NOFILL : ''), (!isstroke ? V_PATH_NOSTROKE : '')].join('');
			var linewidth = ''+this.lineWidth+'px';
			if(newel || ""+el.path !== path){ el.path = path;}
			if(isstroke && ""+el.strokeweight !== linewidth){ el.strokeweight = linewidth;}
		}
		
		var fillcolor   = (isfill   ? Candle.parse(this.fillStyle)   : "none");
		var strokecolor = (isstroke ? Candle.parse(this.strokeStyle) : "none");
		if(""+el.fillcolor   !== fillcolor)  { el.fillcolor   = fillcolor;}
		if(""+el.strokecolor !== strokecolor){ el.strokecolor = strokecolor;}

		return el;
	},

	/* VectorID Functions */
	show : function(el){ el.style.display = 'inline';},
	hide : function(el){ el.style.display = 'none';}
});

})();
