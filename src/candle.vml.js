// candle.vml.js
 
(function(){

/* ------------------- */
/*   VML描画可能条件   */
/* ------------------- */
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
	V_EL_UNSELECTABLE = '', // デフォルトはunselectableでない
//	V_EL_UNSELECTABLE = ' unselectable="on"',
	V_TAGEND      = '>',
	V_TAGEND_NULL = ' />',
	V_CLOSETAG_SHAPE    = '</v:shape>',
	V_CLOSETAG_GROUP    = '</v:group>',
	V_CLOSETAG_IMAGE    = '</v:image>',
	V_CLOSETAG_TEXTPATH = '</v:textpath>',
	V_CLOSETAG_POLYLINE = '</v:polyline>',

	V_ATT_ID     = ' id="',
	V_ATT_PATH   = ' path="',
	V_ATT_POINTS = ' points="',
	V_ATT_STYLE  = ' style="',
	V_ATT_STRING = ' string="',
	V_ATT_COORDSIZE    = ' coordsize="100,100"',
	V_ATT_FILLCOLOR    = ' fillcolor="',
	V_ATT_STROKECOLOR  = ' strokecolor="',
	V_ATT_STROKEWEIGHT = ' strokeweight="',
	V_ATT_END = '"',
	V_ATT_STYLE_TEXTBOX = ' style="white-space:nowrap;cursor:default;font:10px sans-serif;"',
	V_DEF_ATT_POLYLINE  = ' stroked="f" filled="t"',
	V_DEF_ATT_TEXTPATH  = ' on="t" xscale="t"',

	V_STYLE_LEFT  = 'left:',
	V_STYLE_TOP   = 'top:',
	V_STYLE_FONT  = 'font:',
	V_STYLE_ALIGN = 'v-text-align:',
	V_STYLE_END   = ';',

	V_PATH_MOVE   = ' m',
	V_PATH_LINE   = ' l',
	V_PATH_CLOSE  = ' x',
	V_PATH_ARCTO  = ' ?', /* 'at'か'wa'どちらか */
	V_PATH_NOSTROKE = ' ns',
	V_PATH_NOFILL   = ' nf',

	V_WIDTH = { left:0, center:0.5, right:1 },
	V_HEIGHT = { top:-0.7, hanging:-0.66, middle:-0.3, alphabetic:0, bottom:0.1 },

	Z  = 10,
	Z2 = Z/2;

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

	initialize : function(idname){
		Candle.wrapper.vector.prototype.initialize.call(this, idname);

		this.use = new Candle.TypeList('vml');

		// define const
		this.PATH_MOVE  = V_PATH_MOVE;
		this.PATH_LINE  = V_PATH_LINE;
		this.PATH_CLOSE = V_PATH_CLOSE;
		this.PATH_ARCTO = V_PATH_ARCTO;

		this.initElement();
	},
	show : function(el){ el.style.display = 'inline';},
	hide : function(el){ el.style.display = 'none';},

	/* additional functions (for initialize) */
	initElement : function(){
		this.canvas = _doc.getElementById(this.idname);

		var rect = Candle.getRectSize(this.canvas);
		var top = _doc.createElement('div');
		top.id = this.canvasid;

		top.style.position = 'absolute';
		top.style.left   = '-2px';
		top.style.top    = '-2px';
		top.style.width  = rect.width + 'px';
		top.style.height = rect.height + 'px';
		this.canvas.appendChild(top);

		this.child = top;
		this.afterInit();
	},

	/* layer functions */
	createLayer : function(lid){
		var layer = _doc.createElement('div');
		layer.id = lid;
		layer.unselectable = (!!V_EL_UNSELECTABLE ? 'on' : '');
		layer.style.position = 'absolute';
		layer.style.left   = '0px';
		layer.style.top    = '0px';
		this.target.appendChild(layer);
		return layer;
	},
	getLayerById : function(id){
		return _doc.getElementById(id);
	},

	/* property functions */
	setRendering : function(render){
		this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.isedge = this.isedgearray[this.currentLayerId];
	},
	setUnselectable : function(unsel){
		if(unsel===(void 0)){ unsel = true;}else{ unsel = !!unsel;}
		V_EL_UNSELECTABLE = (unsel ? ' unselectable="on"' : '');
		this.canvas.unselectable = (unsel ? 'on' : '');
		this.child.unselectable  = (unsel ? 'on' : '');
	},

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
		this.cpath.push(this.PATH_MOVE,this.ePos(x,true),this.ePos(y,true));
		this.lastpath = this.PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==this.PATH_LINE){ this.cpath.push(this.PATH_LINE);}
		this.cpath.push(this.ePos(x,true),this.ePos(y,true));
		this.lastpath = this.PATH_LINE;
	},
	rect : function(x,y,w,h){
		x=this.ePos(x,true); y=this.ePos(y,true); w=this.eLen(w); h=this.eLen(h);
		this.cpath.push(this.PATH_MOVE,x,y,this.PATH_LINE,(x+w),y,(x+w),(y+h),x,(y+h),this.PATH_CLOSE);
		this.lastpath = this.PATH_CLOSE;
	},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		var sx,sy,ex,ey;
		if(endRad-startRad>=_2PI){ sx=cx+r, sy=cy, ex=cx+r, ey=cy;}
		else{
			sx = cx + r*Math.cos(startRad), sy = cy + r*Math.sin(startRad),
			ex = cx + r*Math.cos(endRad),   ey = cy + r*Math.sin(endRad);
		}
		cx=(cx*Z-Z2)|0, cy=(cy*Z-Z2)|0, r=(r*Z)|0;
		sx=(sx*Z-Z2)|0, sy=(sy*Z-Z2)|0, ex=(ex*Z-Z2)|0, ey=(ey*Z-Z2)|0;
		var com = (antiClockWise ? 'at' : 'wa');
		if(endRad-startRad>=_2PI){ sx+=1;}
		this.cpath.push(com,(cx-r),(cy-r),(cx+r),(cy+r),sx,sy,ex,ey);
		this.lastpath = com;
	},

	/* extended functions */
	setLinePath_com : function(array){
		this.cpath = [];
		for(var i=0,len=array.length;i<len;i++){
			this.cpath.push(i===0 ? this.PATH_MOVE : this.PATH_LINE);
			this.cpath.push(this.ePos(array[i][0],true),this.ePos(array[i][1],true));
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
		x1=this.ePos(x1,true); y1=this.ePos(y1,true); x2=this.ePos(x2,true); y2=this.ePos(y2,true);
		Candle.wrapper.vector.prototype.strokeLine.call(this,x1,y1,x2,y2);
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		x1=this.ePos(x1,true); y1=this.ePos(y1,true); x2=this.ePos(x2,true); y2=this.ePos(y2,true);
		Candle.wrapper.vector.prototype.strokeDashedLine.call(this,x1,y1,x2,y2,sizes);
	},
	strokeCross : function(cx,cy,l){
		cx=this.ePos(cx,true); cy=this.ePos(cy,true); l=this.eLen(l);
		Candle.wrapper.vector.prototype.strokeCross.call(this,cx,cy,l);
	},

	/* internal functions */
	ePos : function(num,stroke){
		if(!stroke){ num = (num+(num>0?0.5:-0.5))|0;}
		else       { num = ((num+(num>0?0.5:-0.5) - (this.lineWidth%2===1?0.5:0))|0);}
		return (num*Z-Z2)|0;
	},
	eLen : function(num){
		return (num*Z)|0;
	},

	/* Canvas API functions (for text) */
	fillText_main : function(el,text,x,y){
		var newel = !el;
		if(!newel){ this.deleteElement(el);}

		var ME = Candle.ME;
		ME.style.font = this.font;
		ME.innerHTML = text;
		var wid = (ME.offsetWidth*Z-Z2)|0;
		var left = ((x - ME.offsetWidth  * V_WIDTH [this.textAlign.toLowerCase()]   )*Z-Z2)|0;
		var top  = ((y - ME.offsetHeight * V_HEIGHT[this.textBaseline.toLowerCase()])*Z-Z2)|0;
		
		var ar = [
			V_TAG_GROUP, V_ATT_COORDSIZE, V_TAGEND,
				V_TAG_POLYLINE, V_ATT_POINTS, [left,top,left+wid,top].join(','), V_ATT_END,
				V_DEF_ATT_POLYLINE, V_ATT_FILLCOLOR, Candle.parse(this.fillStyle), V_ATT_END, V_TAGEND,
					V_TAG_PATH_FOR_TEXTPATH,
					
					V_TAG_TEXTPATH, V_DEF_ATT_TEXTPATH, V_ATT_STRING, text, V_ATT_END,
					V_ATT_STYLE, V_STYLE_FONT, this.font, V_STYLE_END,
					V_STYLE_ALIGN, this.textAlign, V_STYLE_END, V_ATT_END, V_TAGEND_NULL,
				V_CLOSETAG_POLYLINE,
			V_CLOSETAG_GROUP
		];
		this.target.insertAdjacentHTML('BeforeEnd', ar.join(''));
		el = this.target.lastChild;

		return el;
	},

	/* Canvas API functions (for image) */
	drawImage_main : function(el,image,sx,sy,sw,sh,dx,dy,dw,dh){
		var newel = !el;
		if(newel){
			var ar = [V_TAG_IMAGE, V_ATT_COORDSIZE, V_TAGEND_NULL];
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

		var path = [this.cpath.join(' '), (!isfill ? V_PATH_NOFILL : ''), (!isstroke ? V_PATH_NOSTROKE : '')].join(''),
			fillcolor   = (isfill   ? Candle.parse(this.fillStyle)   : ''),
			strokecolor = (isstroke ? Candle.parse(this.strokeStyle) : '');
		el.path = path;
		if(isfill)  { el.fillcolor   = fillcolor;}
		if(isstroke){ el.strokecolor = strokecolor;}
		if(isstroke){ el.strokeweight = ''+this.lineWidth+'px';}

		return el;
	}
});

})();
