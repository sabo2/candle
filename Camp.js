// Camp.js rev45
 
(function(){

// 多重定義防止
if(!!window.Camp){ return;}

/* ------------- */
/*   variables   */
/* ------------- */
var _win = this,
	_doc = document,
	_ms = Math.sin,
	_mc = Math.cos,
	_2PI = 2*Math.PI,

	_IE = !!(window.attachEvent && !window.opera),

	Z  = 10,
	Z2 = Z/2,

	_color = [],
	flags = { debugmode:false },
	_types = ['svg','canvas','sl','flash','vml'],

	VML    = 0,
	SVG    = 1,
	CANVAS = 2,
	SL     = 3,
	FLASH  = 4,

	BEFOREEND = 'BeforeEnd';

/* ---------- */
/*   arrays   */
/* ---------- */
var _hex = (function(){
	var tbl = [];
	for(var r=256;r<512;r++){ tbl[r-256]=r.toString(16).substr(1);}
	return tbl;
})();

/* ------------ */
/*   共通関数   */
/* ------------ */
function getRectSize(el){
	return { width :(el.offsetWidth  || el.clientWidth),
			 height:(el.offsetHeight || el.clientHeight)};
}
function parsecolor(rgbstr){
	if(!_color[rgbstr]){
		if(rgbstr.substr(0,4)==='rgb('){
			var m = rgbstr.match(/\d+/g);
			_color[rgbstr] = ["#",_hex[m[0]],_hex[m[1]],_hex[m[2]]].join('');
		}
		else{ _color[rgbstr] = rgbstr;}
	}
	return _color[rgbstr];
}
function parsecolorrev(colorstr){
	if(colorstr.match(/\#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/)){
		var m0 = parseInt(RegExp.$1,16).toString();
		var m1 = parseInt(RegExp.$2,16).toString();
		var m2 = parseInt(RegExp.$3,16).toString();
		return ["rgb(",m0,',',m1,',',m2,")"].join('');
	}
	return colorstr;
}
function _extend(obj, ads){
	for(var name in ads){ obj[name] = ads[name];}
}

/* ------------------ */
/*   TypeListクラス   */
/* ------------------ */
var TypeList = function(){
	this.canvas = false;
	this.vml    = false;
	this.svg    = false;
	this.sl     = false;
	this.flash  = false;
};

/* ------------------------------------------- */
/*   VectorContext(VML)クラス用const文字列集   */
/* ------------------------------------------- */
var V_TAG_SHAPE    = '<v:shape',
	V_TAG_GROUP    = '<v:group',
	V_TAG_TEXTPATH = '<v:textpath',
	V_TAG_POLYLINE = '<v:polyline',
	V_TAG_PATH_FOR_TEXTPATH = '<v:path textpathok="t" />';
	V_EL_UNSELECTABLE = '', // デフォルトはunselectableでない
//	V_EL_UNSELECTABLE = ' unselectable="on"',
	V_TAGEND      = '>',
	V_TAGEND_NULL = ' />',
	V_CLOSETAG_SHAPE    = '</v:shape>',
	V_CLOSETAG_GROUP    = '</v:group>',
	V_CLOSETAG_TEXTPATH = '</v:textpath>',
	V_CLOSETAG_POLYLINE = '</v:polyline>',

	V_ATT_ID     = ' id="',
	V_ATT_PATH   = ' path="',
	V_ATT_POINTS = ' points="'
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
	V_PATH_NOSTROKE = ' ns',
	V_PATH_NOFILL   = ' nf';

/* ------------------------------------------- */
/*   VectorContext(SVG)クラス用const文字列集   */
/* ------------------------------------------- */
var SVGNS = "http://www.w3.org/2000/svg",
	S_PATH_MOVE   = ' M',
	S_PATH_LINE   = ' L',
	S_PATH_ARCTO  = ' A',
	S_PATH_CLOSE  = ' z',

	S_ATT_ID          = 'id';
	S_ATT_FILL        = 'fill';
	S_ATT_STROKE      = 'stroke';
	S_ATT_STROKEWIDTH = 'stroke-width',
	S_ATT_RENDERING   = 'shape-rendering',

	SVG_ANCHOR = {
		left   : 'start',
		center : 'middle',
		right  : 'end'
	},

	S_NONE = 'none';

/* --------------------------------- */
/*   VectorContextクラス用変数など   */
/* --------------------------------- */
var EL_ID_HEADER = "canvas_o_",
	EMPTY = '';

/* ----------------------- */
/*   VectorContextクラス   */
/* ----------------------- */
var VectorContext = function(type, idname){
	// canvasに存在するプロパティ＆デフォルト値
	this.fillStyle    = 'black';
	this.strokeStyle  = 'black';
	this.lineWidth    = 1;
	this.font         = '14px system';
	this.textAlign    = 'center';
	this.textBaseline = 'middle';

	// changeOrigin用(Sinverlight用)
	this.OFFSETX = 0;
	this.OFFSETY = 0;

	// 外部から変更される追加プロパティ
	this.vid      = '';
	this.elements = [];

	// variables for internal
	this.type   = type;
	this.target = null;	// エレメントの追加対象となるオブジェクト
	this.parent = null;	// 親エレメントとなるdivエレメント
	this.canvas = null;	// this.parentの直下にあるエレメント
	this.idname = idname;
	this.canvasid = EL_ID_HEADER+idname;
	this.currentpath = [];
	this.lastpath    = '';
	this.isAA = false;

	// Silverlight用
	this.content = null;

	this.use = new TypeList();

	// define const
	if(this.type===SVG || this.type===SL){
		this.PATH_MOVE  = S_PATH_MOVE;
		this.PATH_LINE  = S_PATH_LINE;
		this.PATH_CLOSE = S_PATH_CLOSE;
		if(this.type===SVG){ this.use.svg = true;}
		if(this.type===SL) { this.use.sl  = true;}
	}
	else if(this.type===VML){
		this.PATH_MOVE  = V_PATH_MOVE;
		this.PATH_LINE  = V_PATH_LINE;
		this.PATH_CLOSE = V_PATH_CLOSE;
		this.use.vml = true;
	}

	this.initElement(idname);
};
VectorContext.prototype = {
	/* additional functions (for initialize) */
	initElement : function(idname){
		var child = null;
		if(this.type!==SL){ child = _doc.getElementById(this.canvasid)}
		else if(!!this.content){ child = this.content.findName(this.canvasid);}

		if(!child){
			var parent = _doc.getElementById(idname);
			var rect = getRectSize(parent);
			if     (this.type===SVG){ this.appendSVG(parent,rect.width,rect.height);}
			else if(this.type===SL) { this.appendSL (parent,rect.width,rect.height);}
			else if(this.type===VML){ this.appendVML(parent,rect.width,rect.height);}
			child = this.canvas;

			var self = this;
			//parent.className = "canvas";
			parent.style.display  = 'block';
			parent.style.position = 'relative';
			parent.style.overflow = 'hidden';
			if(flags.debugmode){
				parent.style.backgroundColor = "#efefef";
				parent.style.border = "solid 1px silver";
			}
			parent.getContext = function(type){
				if(!self.canvas){ self.initElement(self.idname);}
				return self;
			};
			parent.toDataURL = function(type){ return null; /* 未サポート */ };
			this.parent = parent;

			this.target = this.canvas;
			if(!!this.target){ this.addVectorElement(true,false,false,[0,0,rect.width,rect.height]);}
		}
		this.target = child;
	},
	appendSVG : function(parent, width, height){
		var svgtop = _doc.createElementNS(SVGNS,'svg');
		svgtop.setAttribute('id', this.canvasid);
		svgtop.setAttribute('font-size', "10px");
		svgtop.setAttribute('font-family', "sans-serif");
		svgtop.setAttribute('width', width);
		svgtop.setAttribute('height', height);
		svgtop.setAttribute('viewBox', [0,0,width,height].join(' '));

		parent.appendChild(svgtop);
		this.canvas = svgtop;
	},
	appendVML : function(parent, width, height){
		var vmltop = _doc.createElement('div');
		vmltop.id = this.canvasid;

		vmltop.style.position = 'absolute';
		vmltop.style.left   = '-2px';
		vmltop.style.top    = '-2px';
		vmltop.style.width  = width + 'px';
		vmltop.style.height = height + 'px';

		parent.appendChild(vmltop);
		this.canvas = vmltop;
	},
	appendSL : function(parent, width, height){
		parent.innerHTML = [
			'<object type="application/x-silverlight" width="100%" height="100%" id="',this.canvasid,'_object" />',
			'<param name="windowless" value="true" />',
			'<param name="background" value="#00000000" />',	// アルファ値0 = 透明
			'<param name="source" value="#',this.canvasid,'_script" />',
		//	'<param name="onLoad" value="onSLload" />',	// 前は100%,100%設定が必要だったみたい
			'</object>',
			'<script type="text/xaml" id="',this.canvasid,'_script">',
			'<Canvas xmlns="http://schemas.microsoft.com/client/2007" Name="',this.canvasid,'" />',
			'</script>'
		].join('');

		// ここでLoadされてない状態になることがあるみたい..
		if(document.getElementById([this.canvasid,'object'].join('_')).IsLoaded){
			this.content = document.getElementById([this.canvasid,'object'].join('_')).content;
			this.canvas = this.content.findName(this.canvasid);
		}
	},
	setLayer : function(layerid){
		this.initElement(this.idname);
		if(!!layerid){
			var lid = [this.canvasid,"layer",layerid].join('_');
			var layer = (this.type!==SL ? _doc.getElementById(lid) : this.content.findName(lid));
			if(!layer){
				if(this.type===SVG){
					layer = _doc.createElementNS(SVGNS,'g');
					layer.setAttribute('id', lid);
					this.target.appendChild(layer);
				}
				else if(this.type===SL){
					layer = this.content.createFromXaml(['<Canvas Name="',lid,'"/>'].join(''));
					this.target.children.add(layer);
				}
				else{
					layer = _doc.createElement('div');
					layer.id = lid;
					layer.unselectable = (!!V_EL_UNSELECTABLE ? 'on' : '');
					layer.style.position = 'absolute';
					layer.style.left   = '0px';
					layer.style.top    = '0px';
					this.target.appendChild(layer);
				}
			}
			this.target = layer;
		}
	},
	setRendering : function(render){
		if(this.type===SVG){
			this.canvas.setAttribute(S_ATT_RENDERING, render);
		}
	},
	setUnselectable : function(unsel){
		if(unsel===(void 0)){ unsel = true;}else{ unsel = !!unsel;}
		if(this.type===VML){
			V_EL_UNSELECTABLE = (unsel ? ' unselectable="on"' : '');
			this.parent.unselectable = (unsel ? 'on' : '');
			this.canvas.unselectable = (unsel ? 'on' : '');
		}
		else if(this.type===SL){
			this.parent.unselectable = (unsel ? 'on' : '');
		}
		else if(this.type===SVG){
			this.parent.style.MozUserSelect    = (unsel ? 'none' : 'text');
			this.parent.style.WebkitUserSelect = (unsel ? 'none' : 'text');
			this.parent.style.userSelect       = (unsel ? 'none' : 'text');
		}
	},
	getContextElement : function(){
		if(this.type===SL && !this.canvas){ this.initElement(this.idname);}
		return this.canvas;
	},
	getLayerElement   : function(){ return this.target;},

	changeSize : function(width,height){
		this.parent.style.width  = width + 'px';
		this.parent.style.height = height + 'px';

		var child = this.parent.firstChild;
		if(this.type===SVG){
			child.setAttribute('width', width);
			child.setAttribute('height', height);
			child.setAttribute('viewBox', [0,0,width,height].join(' '));
		}
		else if(this.type==SL){
			// 描画されないことがあるため、サイズを2度設定するおまじない
			child.height = (height+1)+'px';

			child.width  = width + 'px';
			child.height = height + 'px';
		}
		else if(this.type==VML){
			child.style.width  = width + 'px';
			child.style.height = height + 'px';
		}
	},
	changeOrigin : function(left,top){
		var child = this.parent.firstChild;
		if(this.type===SVG){
			var m = child.getAttribute('viewBox').split(/ /);
			m[0]=left, m[1]=top;
			child.setAttribute('viewBox', m.join(' '));
		}
		else if(this.type===VML){
			child.style.position = 'absolute';
			child.style.left = (-left-2)+'px';
			child.style.top  = (-top -2)+'px';
		}
		else if(this.type===SL){
			this.OFFSETX = -left;//(left<0?-left:0);
			this.OFFSETY = -top;//(top<0?-top:0);
		}
	},
	clear : function(){
		if(this.type!==SL){ _doc.getElementById(this.idname).innerHTML = '';}

		this.elements = [];
		this.initElement(this.idname);

		if(this.type===SL){ this.target.children.clear();}
	},

	/* Canvas API functions (for path) */
	beginPath : function(){
		this.currentpath = [];
		this.lastpath = '';
	},
	closePath : function(){
		this.currentpath.push(this.PATH_CLOSE);
		this.lastpath = this.PATH_CLOSE;
	},
	moveTo : function(x,y){
		if     (this.type===SVG){ this.currentpath.push(this.PATH_MOVE,x,y);}
		else if(this.type===VML){ this.currentpath.push(this.PATH_MOVE,(x*Z-Z2)|0,(y*Z-Z2)|0);}
		else if(this.type===SL) { this.currentpath.push(this.PATH_MOVE,x+this.OFFSETX,y+this.OFFSETY);}
		this.lastpath = this.PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==this.PATH_LINE){ this.currentpath.push(this.PATH_LINE);}
		if     (this.type===SVG){ this.currentpath.push(x,y);}
		else if(this.type===VML){ this.currentpath.push((x*Z-Z2)|0,(y*Z-Z2)|0);}
		else if(this.type===SL) { this.currentpath.push(x+this.OFFSETX,y+this.OFFSETY);}
		this.lastpath = this.PATH_LINE;
	},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		if     (this.type===VML){ cx=(cx*Z-Z2)|0, cy=(cy*Z-Z2)|0, r=(r*Z)|0;}
		else if(this.type===SL) { cx+=this.OFFSETX, cy+=this.OFFSETY;}
		var sx = (cx + r*_mc(startRad))|0, sy = (cy + r*_ms(startRad))|0,
			ex = (cx + r*_mc(endRad))|0,   ey = (cy + r*_ms(endRad))|0;
		if(this.type===VML){
			var com = (antiClockWise ? 'at' : 'wa');
			if(endRad-startRad>=2*Math.PI){ sx+=1;}
			this.currentpath.push(com,(cx-r),(cy-r),(cx+r),(cy+r),sx,sy,ex,ey);
			this.lastpath = com;
		}
		else{
			if(sy==ey){ sy+=0.125;}
			var unknownflag = (startRad>endRad)^(Math.abs(endRad-startRad)>Math.PI);
			var islong = ((antiClockWise^unknownflag)?1:0), sweep = ((islong==0^unknownflag)?1:0);
			this.currentpath.push(this.PATH_MOVE,sx,sy,S_PATH_ARCTO,r,r,0,islong,sweep,ex,ey);
			this.lastpath = S_PATH_ARCTO;
			this.isAA = true;
		}
	},

	/* Canvas API functions (for drawing) */
	fill       : function(){ this.addVectorElement(false,true,false,[]);},
	stroke     : function(){ this.addVectorElement(false,false,true,[]);},
	fillRect   : function(x,y,w,h){ this.addVectorElement(true,true,false,[x,y,w,h]);},
	strokeRect : function(x,y,w,h){ this.addVectorElement(true,false,true,[x,y,w,h]);},
	shapeRect  : function(x,y,w,h){ this.addVectorElement(true,true,true, [x,y,w,h]);},

	fillText : function(text,x,y){
		switch(this.type){
		case SVG:
			var el = _doc.createElementNS(SVGNS,'text');
			if(!!this.vid){ this.elements[this.vid] = el;}
			el.setAttribute('x', x);
			el.setAttribute('y', y+14*1.0);
			el.setAttribute(S_ATT_FILL, parsecolor(this.fillStyle));
			el.setAttribute('text-anchor', SVG_ANCHOR[this.textAlign.toLowerCase()]);
			el.style.font = this.font;
			el.appendChild(_doc.createTextNode(text));
			this.target.appendChild(el);
			break;

		case SL:
			var ar = ['<TextBlock Canvas.Left="',(x+this.OFFSETX-60),'" Canvas.Top="',(y+this.OFFSETY-15*0.7),
					  'Width="', (60*2), '" TextAlignment="', this.textAlign,'"',
					  'FontFamily="', 'Sans-Serif', '" FontSize="', 16,'"',
					  '" text="',text,'" />'];

			var xaml = this.content.createFromXaml(ar.join(''));
			if(!!this.vid){ this.elements[this.vid] = xaml;}
			this.target.children.add(xaml);
			break;

		case VML:
			if(this.type===VML){ x=(x*Z-Z2)|0, y=(y*Z-Z2)|0;}
			var ar = [V_TAG_GROUP, V_ATT_COORDSIZE, V_TAGEND];
			ar.push(V_TAG_POLYLINE, V_ATT_POINTS, [x-600,y,x+600,y].join(','), V_ATT_END,
					V_DEF_ATT_POLYLINE, V_ATT_FILLCOLOR, parsecolor(this.fillStyle), V_ATT_END, V_TAGEND);
			ar.push(V_TAG_PATH_FOR_TEXTPATH, V_TAG_TEXTPATH);
			if(!!this.vid){ ar.push(V_ATT_ID, this.vid, V_ATT_END); }
			ar.push(V_DEF_ATT_TEXTPATH, V_ATT_STRING, text, V_ATT_END,
					V_ATT_STYLE, V_STYLE_FONT, this.font, V_STYLE_END,
					V_STYLE_ALIGN, this.textAlign, V_STYLE_END, V_ATT_END, V_TAGEND_NULL,
					V_CLOSETAG_POLYLINE, V_CLOSETAG_GROUP);

			this.target.insertAdjacentHTML(BEFOREEND, ar.join(''));
			if(!!this.vid){ this.elements[this.vid] = _doc.getElementById(this.vid);}
			break;
		}
	},

	/* extended functions */
	shape : function(){ this.addVectorElement(false,true,true,[]);},

	pathRect : function(size){
		var x=size[0], y=size[1], w=size[2], h=size[3];
		if     (this.type===VML){ x=(x*Z-Z2)|0,y=(y*Z-Z2)|0, w=(w*Z)|0, h=(h*Z)|0;}
		else if(this.type===SL) { x+=this.OFFSETX,y+=this.OFFSETY;}
		return [this.PATH_MOVE,x,y,this.PATH_LINE,(x+w),y,(x+w),(y+h),x,(y+h),this.PATH_CLOSE].join(' ');
	},

	setLinePath : function(){
		var _args = arguments, _len = _args.length, svg=(this.type!==VML);
		this.currentpath = [];
		for(var i=0,len=_len-((_len|1)?1:2);i<len;i+=2){
			if     (i==0){ this.currentpath.push(this.PATH_MOVE);}
			else if(i==2){ this.currentpath.push(this.PATH_LINE);}

			if     (this.type===SVG){ this.currentpath.push(_args[i],_args[i+1]);}
			else if(this.type===VML){ this.currentpath.push((_args[i]*Z-Z2)|0,(_args[i+1]*Z-Z2)|0);}
			else if(this.type===SL) { this.currentpath.push(_args[i]+this.OFFSETX,_args[i+1]+this.OFFSETY);}
		}
		if(_args[_len-1]){ this.currentpath.push(this.PATH_CLOSE);}
	},
	setOffsetLinePath : function(){
		var _args = arguments, _len = _args.length, svg=(this.type!==VML), m=[_args[0],_args[1]];
		this.currentpath = [];
		for(var i=2,len=_len-((_len|1)?1:2);i<len;i+=2){
			m[i] = _args[i] + m[0];
			m[i+1] = _args[i+1] + m[1];

			if     (this.type===VML){ m[i]=(m[i]*Z-Z2)|0, m[i+1]=(m[i+1]*Z-Z2)|0;}
			else if(this.type===SL) { m[i]+=this.OFFSETX, m[i+1]+=this.OFFSETY;}
		}
		for(var i=2,len=_len-((_len|1)?1:2);i<len;i+=2){
			if     (i==2){ this.currentpath.push(this.PATH_MOVE);}
			else if(i==4){ this.currentpath.push(this.PATH_LINE);}
			this.currentpath.push(m[i], m[i+1]);
		}
		if(_args[_len-1]){ this.currentpath.push(this.PATH_CLOSE);}
	},
	setDashSize : function(size){
		if(this.type===SVG){
			this.elements[this.vid].setAttribute('stroke-dasharray', size);
		}
		else if(this.type===SL){
			this.elements[this.vid].StrokeDashArray = size;
		}
		else if(this.type===VML){
			var el = _doc.createElement('v:stroke');
			if     (size<=2){ el.dashstyle = 'ShortDash';}
			else if(size<=5){ el.dashstyle = 'Dash';}
			else            { el.dashstyle = 'LongDash';}
			this.elements[this.vid].appendChild(el);
		}
	},

	strokeLine : function(x1,y1,x2,y2){
		if     (this.type===VML){ x1=x1*Z, y1=y1*Z, x2=x2*Z, y2=y2*Z;}
		else if(this.type===SL) { x1+=this.OFFSETX, y1+=this.OFFSETY, x2+=this.OFFSETX, y2+=this.OFFSETY;}
		var stack = this.currentpath;
		this.currentpath = [this.PATH_MOVE,x1,y1,this.PATH_LINE,x2,y2];
		this.addVectorElement(false,false,true,[]);
		this.currentpath = stack;
	},
	strokeCross : function(cx,cy,l){
		if     (this.type===VML){ cx=(cx*Z-Z2)|0, cy=(cy*Z-Z2)|0, l=(l*Z)|0;}
		else if(this.type===SL) { cx+=this.OFFSETX, cy+=this.OFFSETY;}
		var stack = this.currentpath;
		this.currentpath = [];
		this.currentpath.push(this.PATH_MOVE,(cx-l),(cy-l),this.PATH_LINE,(cx+l),(cy+l));
		this.currentpath.push(this.PATH_MOVE,(cx-l),(cy+l),this.PATH_LINE,(cx+l),(cy-l));
		this.addVectorElement(false,false,true,[]);
		this.currentpath = stack;
	},
	fillCircle : function(cx,cy,r){
		var stack = this.currentpath;
		this.currentpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.currentpath.push(this.PATH_CLOSE);
		this.addVectorElement(false,true,false,[]);
		this.currentpath = stack;
	},
	strokeCircle : function(cx,cy,r){
		var stack = this.currentpath;
		this.currentpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.currentpath.push(this.PATH_CLOSE);
		this.addVectorElement(false,false,true,[]);
		this.currentpath = stack;
	},
	shapeCircle : function(cx,cy,r){
		var stack = this.currentpath;
		this.currentpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.currentpath.push(this.PATH_CLOSE);
		this.addVectorElement(false,true,true,[]);
		this.currentpath = stack;
	},

	addVectorElement : function(isrect,isfill,isstroke,size){
	var path = (isrect ? this.pathRect(size) : this.currentpath.join(' '));
	switch(this.type){
	case SVG:
		var el = _doc.createElementNS(SVGNS,'path');
		if(!!this.vid){ this.elements[this.vid] = el;}
		el.setAttribute('d', path);
		el.setAttribute(S_ATT_FILL,   (isfill ? parsecolor(this.fillStyle) : S_NONE));
		el.setAttribute(S_ATT_STROKE, (isstroke ? parsecolor(this.strokeStyle) : S_NONE));
		if(isstroke) { el.setAttribute(S_ATT_STROKEWIDTH, this.lineWidth, 'px');}
		if(this.isAA){ el.setAttribute(S_ATT_RENDERING, 'auto'); this.isAA = false;}

		this.target.appendChild(el);
		break;

	case SL:
		var ar = ['<Path Data="', path ,'"'];
		if(isfill)  { ar.push(' Fill="', parsecolor(this.fillStyle), '"');}
		if(isstroke){ ar.push(' Stroke="', parsecolor(this.strokeStyle), '" StrokeThickness="', this.lineWidth, '"');}
		ar.push(' />');

		var xaml = this.content.createFromXaml(ar.join(''));
		if(!!this.vid){ this.elements[this.vid] = xaml;}
		this.target.children.add(xaml);
		break;

	case VML:
		path = [path, (!isfill ? V_PATH_NOFILL : EMPTY), (!isstroke ? V_PATH_NOSTROKE : EMPTY)].join('');
		var ar = [V_TAG_SHAPE, V_EL_UNSELECTABLE];
		if(!!this.vid){ ar = [V_TAG_SHAPE, V_EL_UNSELECTABLE, V_ATT_ID, this.vid, V_ATT_END]; }
		ar.push(V_ATT_COORDSIZE, V_ATT_PATH, path, V_ATT_END);
		if(isfill)  { ar.push(V_ATT_FILLCOLOR, parsecolor(this.fillStyle), V_ATT_END);}
		if(isstroke){ ar.push(V_ATT_STROKECOLOR, parsecolor(this.strokeStyle), V_ATT_END, V_ATT_STROKEWEIGHT, this.lineWidth, 'px', V_ATT_END);}
		ar.push(V_TAGEND_NULL);

		this.target.insertAdjacentHTML(BEFOREEND, ar.join(''));
		if(!!this.vid){ this.elements[this.vid] = _doc.getElementById(this.vid);}
		break;
	}}
};

/* -------------------- */
/*   Canvas追加関数群   */
/* -------------------- */
CanvasRenderingContext2D_wrapper = function(type, idname){
	// canvasに存在するプロパティ＆デフォルト値
	this.fillStyle    = 'black';
	this.strokeStyle  = 'black';
	this.lineWidth    = 1;
	this.font         = '14px system';
	this.textAlign    = 'center';
	this.textBaseline = 'middle';

	// changeOrigin用
	this.OFFSETX = 0;
	this.OFFSETY = 0;

	// variables for internal
	this.canvasid = '';
	this.parent = null;		// 親エレメントとなるdivエレメント
	this.canvas = null;		// this.parentの直下にあるエレメント
	this.context  = null;	// 本来のCanvasRenderingContext2Dオブジェクト

	this.use = new TypeList();
	this.use.vml    = (type===VML);
	this.use.svg    = false;
	this.use.canvas = (type===CANVAS);
	this.use.sl     = (type===SL);
	this.use.flash  = (type===FLASH);

	this.initElement(idname);
};

//function addCanvasFunctions(){ _extend(CanvasRenderingContext2D.prototype, {
CanvasRenderingContext2D_wrapper.prototype = {
	/* extend functions (initialize) */
	initElement : function(idname){
		this.canvasid = EL_ID_HEADER+idname;

		var parent = _doc.getElementById(idname);
		var canvas = _doc.getElementById(this.canvasid);

		if(!canvas){
			canvas = _doc.createElement('canvas');
			canvas.id = this.canvasid;
			parent.appendChild(canvas);
		}

		var rect = getRectSize(parent);
		canvas.width  = rect.width;
		canvas.height = rect.height;
		canvas.style.position = 'relative';
		canvas.style.width  = rect.width + 'px';
		canvas.style.height = rect.height + 'px';

		this.canvas = canvas;

		var self = this;
		//parent.className = "canvas";
		parent.style.display  = 'block';
		parent.style.position = 'relative';
		parent.style.overflow = 'hidden';
		if(flags.debugmode){
			parent.style.backgroundColor = "#efefef";
			parent.style.border = "solid 1px silver";
		}
		//parent.getContext = function(type){ return canvas.getContext(type);}
		parent.getContext = function(type){
			self.context = canvas.getContext(type);
			return self;
		}
		parent.toDataURL = function(type){ 
			return (!!type ? canvas.toDataURL(type) : canvas.toDataURL());
		}

		this.parent = parent;
	},
	setLayer          : function(layerid){ },
	setRendering      : function(render) { },
	setUnselectable : function(unsel){
		if(unsel===(void 0)){ unsel = true;}else{ unsel = !!unsel;}
		this.parent.style.MozUserSelect    = (unsel ? 'none' : 'text');
		this.parent.style.WebkitUserSelect = (unsel ? 'none' : 'text');
		this.parent.style.userSelect       = (unsel ? 'none' : 'text');
	},
	getContextElement : function(){ return this.canvas;},
	getLayerElement   : function(){ return this.canvas;},

	changeSize : function(width,height){
		this.parent.style.width  = width + 'px';
		this.parent.style.height = height + 'px';

		var canvas = this.parent.firstChild;
		var left = parseInt(canvas.style.left), top = parseInt(canvas.style.top);
		width += (left<0?-left:0); height += (top<0?-top:0);
		canvas.style.width  = width + 'px';
		canvas.style.height = height + 'px';
		canvas.width  = width;
		canvas.height = height;
	},
	changeOrigin : function(left,top){
//		var canvas = this.parent.firstChild;
//		canvas.style.position = 'relative';
//		canvas.style.left = (parseInt(canvas.style.left) - left) + 'px';
//		canvas.style.top  = (parseInt(canvas.style.top ) - top)  + 'px';

		this.OFFSETX = -left;//(left<0?-left:0);
		this.OFFSETY = -top;//(top<0?-top:0);
	},
	clear : function(){
		if(!!this.parent.style.backgroundColor){
			this.setProperties();
			this.context.fillStyle = parsecolorrev(this.parent.style.backgroundColor);
			var rect = getRectSize(this.parent);
			this.context.fillRect(this.OFFSETX,this.OFFSETY,rect.width,rect.height);
		}
	},

	/* 内部用関数 */
	setProperties : function(){
		this.context.fillStyle    = this.fillStyle;
		this.context.strokeStyle  = this.strokeStyle;
		this.context.lineWidth    = this.lineWidth;
		this.context.font         = this.font;
		this.context.textAlign    = this.textAlign;
		this.context.textBaseline = this.textBaseline;
	},

	/* Canvas API functions (for path) */
	beginPath : function(){ this.context.beginPath();},
	closePath : function(){ this.context.closePath();},
	moveTo : function(x,y){ this.context.moveTo(x+this.OFFSETX,y+this.OFFSETY);},
	lineTo : function(x,y){ this.context.lineTo(x+this.OFFSETX,y+this.OFFSETY);},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		this.context.arc(cx+this.OFFSETX,cy+this.OFFSETY,r,startRad,endRad,antiClockWise);
	},

	/* Canvas API functions (for drawing) */
	fill       : function(){ this.setProperties(); this.context.fill();},
	stroke     : function(){ this.setProperties(); this.context.stroke();},
	fillRect   : function(x,y,w,h){ this.setProperties(); this.context.fillRect(x+this.OFFSETX,y+this.OFFSETY,w,h);},
	strokeRect : function(x,y,w,h){ this.setProperties(); this.context.strokeRect(x+this.OFFSETX,y+this.OFFSETY,w,h);},
	fillText   : function(text,x,y){ this.setProperties(); this.context.fillText(text,x+this.OFFSETX,y+this.OFFSETY);},

	/* extended functions */
	shape : function(){
		this.setProperties();
		this.context.fill();
		this.context.stroke();
	},
	shapeRect : function(x,y,w,h){
		this.setProperties();
		this.context.fillRect(x+this.OFFSETX,y+this.OFFSETY,w,h);
		this.context.strokeRect(x+this.OFFSETX,y+this.OFFSETY,w,h);
	},

	setLinePath : function(){
		var _args = arguments, _len = _args.length;
		for(var i=0,len=_len-((_len|1)?1:2);i<len;i+=2){
			if(i==0){ this.context.moveTo(_args[i],_args[i+1]);}
			else    { this.context.lineTo(_args[i],_args[i+1]);}
		}
		if(_args[_len-1]){ this.context.closePath();}
	},
	setOffsetLinePath : function(){
		var _args = arguments, _len = _args.length, m=[];
		for(var i=2,len=_len-((_len|1)?1:2);i<len;i+=2){
			m[i] = _args[i] + m[0];
			m[i+1] = _args[i+1] + m[1];
		}
		for(var i=0,len=_len-((_len|1)?1:2);i<len;i+=2){
			if(i==0){ this.context.moveTo(_args[i],_args[i+1]);}
			else    { this.context.lineTo(_args[i],_args[i+1]);}
		}
		if(_args[_len-1]){ this.context.closePath();}
	},
	setDashSize : function(size){ },

	strokeLine : function(x1,y1,x2,y2){
		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(x1+this.OFFSETX,y1+this.OFFSETY);
		this.context.lineTo(x2+this.OFFSETX,y2+this.OFFSETY);
		this.context.stroke();
	},
	strokeCross : function(cx,cy,l){
		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(cx-l+this.OFFSETX,cy-l+this.OFFSETY);
		this.context.lineTo(cx+l+this.OFFSETX,cy+l+this.OFFSETY);
		this.context.moveTo(cx-l+this.OFFSETX,cy+l+this.OFFSETY);
		this.context.lineTo(cx+l+this.OFFSETX,cy-l+this.OFFSETY);
		this.context.stroke();
	},
	fillCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx+this.OFFSETX,cy+this.OFFSETY,r,0,_2PI,false);
		this.context.fill();
	},
	strokeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx+this.OFFSETX,cy+this.OFFSETY,r,0,_2PI,false);
		this.context.stroke();
	},
	shapeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx+this.OFFSETX,cy+this.OFFSETY,r,0,_2PI,false);
		this.context.fill();
		this.context.stroke();
	}

};

/* -------------------- */
/*   Campオブジェクト   */
/* -------------------- */
var Camp = function(idname, type){
	Camp.initElementById.apply(Camp, [idname, type]);
};
_extend( Camp, {
	/* externs */
	color : _color,
	parse : parsecolor,

	/* Selected & Enable types */
	enable  : new TypeList(),
	current : new TypeList(),

	/* functions */
	initAllElements : function(){
		this.initElementsByClassName('canvas');
	},
	initElementsByClassName : function(classname, type){
		var elements = _doc.getElementsByTagName('div');
		for(var i=0;i<elements.length;i++){
			if(elements[i].className.match(classname)){ this.initElementById(elements[i].id, type);}
		}
	},
	initElementsById : function(idlist, type){
		for(var i=0;i<idlist.length;i++){ this.initElementById(idlist[i], type);}
	},
	initElementById : function(idname, type){
		if(!!_doc.getElementById(EL_ID_HEADER + idname)){ return;}

		var choice = new TypeList();
		if((type===void 0)||(this.enable[type]!==true)){ choice = this.current;}
		else{ choice[type] = true;}

		if     (choice.svg){ new VectorContext(SVG, idname);}
		else if(choice.sl) { new VectorContext(SL,  idname);}
		else if(choice.vml){ new VectorContext(VML, idname);}
		else if(choice.canvas){
			new CanvasRenderingContext2D_wrapper(CANVAS, idname);
		}
	},
	select : function(type){
		if(this.enable[type]!==true){ return false;}
		for(var i=0;i<_types.length;i++){ this.current[_types[i]]=false;}
		this.current[type] = true;
		return true;
	}
});

/* ----------------------------------------------- */
/* Camp.enable, Camp.currentオブジェクトデータ設定 */
/* ----------------------------------------------- */

	/* Camp.enable設定 */
	Camp.enable.canvas = (!!_doc.createElement('canvas').getContext);
	Camp.enable.svg    = (!!_doc.createElementNS && !!_doc.createElementNS(SVGNS, 'svg').suspendRedraw);
	Camp.enable.sl     = (function(){ try{ return (new ActiveXObject("AgControl.AgControl")).IsVersionSupported("1.0");}catch(e){} return false;})();
	Camp.enable.flash  = false;
	Camp.enable.vml    = _IE;

	/* Camp.current設定 */
	for(var i=0;i<_types.length;i++){ Camp.current[_types[i]]=false;}
	if     (Camp.enable.svg)   { Camp.current.svg    = true;}
	else if(Camp.enable.canvas){ Camp.current.canvas = true;}
	else if(Camp.enable.sl)    { Camp.current.sl     = true;}
	else if(Camp.enable.flash) { Camp.current.flash  = true;}
	else if(Camp.enable.vml)   { Camp.current.vml    = true;}

	/* 初期設定 for VML */
	if(Camp.enable.vml){
		/* addNameSpace for VML */
		_doc.namespaces.add("v", "urn:schemas-microsoft-com:vml");

		/* addStyleSheet for VML */
		var text = [];
		text.push("v\\:shape, v\\:group, v\\:polyline { behavior: url(#default#VML); position:absolute; width:10px; height:10px; }");
		text.push("v\\:path, v\\:textpath, v\\:stroke { behavior: url(#default#VML); }");
		_doc.createStyleSheet().cssText = text.join('');
	}

	_win.Camp = Camp;

})();
