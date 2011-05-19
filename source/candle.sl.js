// candle.sl.js
 
(function(){

// Candleオブジェクトがない場合は何もしない
if(!window.Candle){ return;}

// Silverlight描画条件
try{ if(!(new ActiveXObject("AgControl.AgControl")).IsVersionSupported("1.0")){ return;} }
catch(e){ return;}

/* ------------- */
/*   variables   */
/* ------------- */
var Candle = window.Candle,
	_doc = document,
	_2PI = 2*Math.PI;

/* ------------------------------------------ */
/*   VectorContext(SL)クラス用const文字列集   */
/* ------------------------------------------ */
var SL_PATH_MOVE   = ' M',
	SL_PATH_LINE   = ' L',
	SL_PATH_ARCTO  = ' A',
	SL_PATH_CLOSE  = ' z',

	SL_WIDTH = { left:0, center:0.5, right:1 },
	SL_HEIGHT = { top:0.2, hanging:0.2, middle:0.5, alphabetic:0.7, bottom:0.8 };

/* ----------------------- */
/*   VectorContextクラス   */
/* ----------------------- */
Candle.addTypes('sl');

Candle.addWrapper('sl:vector',{

	initialize : function(idname){
		Candle.wrapper.vector.prototype.initialize.call(this, idname);

		// changeOrigin用(Sinverlight用)
		this.x0 = 0;
		this.y0 = 0;

		// Silverlight用
		this.content = null;

		this.use = new Candle.TypeList('sl');

		// define const
		this.PATH_MOVE  = SL_PATH_MOVE;
		this.PATH_LINE  = SL_PATH_LINE;
		this.PATH_CLOSE = SL_PATH_CLOSE;
		this.PATH_ARCTO = SL_PATH_ARCTO;

		this.initElement();
	},

	/* additional functions (for initialize) */
	initElement : function(){
		this.canvas = _doc.getElementById(this.idname);

		var self = this, funcname = "_function_" + this.canvasid + "_onload";
		window[funcname] = function(sender, context, source){
			self.content = document.getElementById([self.canvasid,'object'].join('_')).content;
			self.child = self.content.findName(self.canvasid);
			self.afterInit.call(self);
		};

		this.canvas.innerHTML = [
			'<object type="application/x-silverlight" width="100%" height="100%" id="',this.canvasid,'_object">',
			'<param name="windowless" value="true" />',
			'<param name="background" value="#00000000" />',	// アルファ値0 = 透明
			'<param name="source" value="#',this.canvasid,'_script" />',
			'<param name="onLoad" value="',funcname,'" />',	// 前は100%,100%設定が必要だったみたい
			'</object>',
			'<script type="text/xaml" id="',this.canvasid,'_script">',
			'<Canvas xmlns="http://schemas.microsoft.com/client/2007" Name="',this.canvasid,'" />',
			'</script>'
		].join('');
	},

	initTarget : function(){
		this.target = (!!this.content ? this.content.findName(this.canvasid) : null);
	},
	clear : function(){
		this.content.findName(this.canvasid).children.clear();

		this.resetElement();
	},

	/* layer functions */
	createLayer : function(lid){
		var layer = this.content.createFromXaml(['<Canvas Name="',lid,'"/>'].join(''));
		this.target.children.add(layer);
		return layer;
	},
	getLayerById : function(id){
		return this.content.findName(id);
	},

	/* property functions */
	setRendering : function(render){
		this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.isedge = this.isedgearray[this.currentLayerId];
	},
	setUnselectable : function(unsel){
		if(unsel===(void 0)){ unsel = true;}else{ unsel = !!unsel;}
		this.canvas.unselectable = (unsel ? 'on' : '');
	},

	changeChildSize : function(child,width,height){
		// 描画されないことがあるため、サイズを2度設定するおまじない
		child.height = (height+1)+'px';

		child.width  = width + 'px';
		child.height = height + 'px';
	},

	/* Canvas API functions (for path) */
	moveTo : function(x,y){
		this.cpath.push(this.PATH_MOVE,this.ePos(x),this.ePos(y));
		this.lastpath = this.PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==this.PATH_LINE){ this.cpath.push(this.PATH_LINE);}
		this.cpath.push(this.ePos(x),this.ePos(y));
		this.lastpath = this.PATH_LINE;
	},
	rect : function(x,y,w,h){
		x=this.ePos(x); y=this.ePos(y); w=this.eLen(w); h=this.eLen(h);
		this.cpath.push(this.PATH_MOVE,x,y,this.PATH_LINE,(x+w),y,(x+w),(y+h),x,(y+h),this.PATH_CLOSE);
	},
	arc : function(cx,cy,r,startRad,endRad,antiClockWise){
		cx=this.ePos(cx); cy=this.ePos(cy);
		Candle.wrapper.vector.prototype.arc.call(this,cx,cy,r,startRad,endRad,antiClockWise);
	},

	/* Canvas API functions (for text) */
	fillText : function(text,x,y){
		var already = (!!this.vid && !!this.elements[this.vid]);
		var ME = Candle.ME;

		ME.style.font = this.font;
		var xaml;
		if(!already){
			var wid = parseInt(this.canvas.offsetWidth);
			var left = x + this.x0 - wid * SL_WIDTH[this.textAlign.toLowerCase()];
			var ar = [
				'<TextBlock Canvas.Left="', left, '" Canvas.Top="',(y+this.y0),
				'" Width="', wid, '" TextAlignment="', this.textAlign,
				'" Foreground="black" />'
			];
			xaml = this.content.createFromXaml(ar.join(''));
		}
		else{ xaml = this.elements[this.vid];}

		xaml["Foreground"] = Candle.parse(this.fillStyle);
		xaml["FontFamily"] = ME.style.fontFamily.replace(/\"/g,'\'');
		xaml["FontSize"]   = parseInt(ME.style.fontSize);
		xaml["Text"] = text;
		var offset = xaml.ActualHeight * SL_HEIGHT[this.textBaseline.toLowerCase()];
		xaml["Canvas.Top"] = y+this.y0 - (!isNaN(offset)?offset:0);

		if(!already){
			this.target.children.add(xaml);
			this.lastElement = xaml;
		}

		if(!already && !!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	},

	/* Canvas API functions (for image) */
	drawImage : function(image,sx,sy,sw,sh,dx,dy,dw,dh){
		if(sw===(void 0)){ sw=image.width; sh=image.height;}
		if(dx===(void 0)){ dx=sx; sx=0; dy=sy; sy=0; dw=sw; dh=sh;}
		var already = (!!this.vid && !!this.elements[this.vid]);

		var xaml;
		if(!already){
			var ar = ['<Image Source="', image.src, '" />'];
			xaml = this.content.createFromXaml(ar.join(''));
		}
		else{
			xaml = this.elements[this.vid];
			xaml["Source"] = image.src;
		}

		xaml["Canvas.Left"] = dx-sx*(dw/sw)+this.x0;
		xaml["Canvas.Top"]  = dy-sy*(dh/sh)+this.y0;
		xaml["Width"]  = image.width*(dw/sw);
		xaml["Height"] = image.height*(dh/sh);
		xaml.Clip = this.content.createFromXaml(
			['<RectangleGeometry Rect="',sx*(dw/sw),',',sy*(dh/sh),',',dw,',',dh,'" />'].join(''));

		if(!already){
			this.target.children.add(xaml);
			this.lastElement = xaml;
		}

		if(!already && !!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		var child = this.canvas.firstChild;
		this.x0 = left;//(left<0?-left:0);
		this.y0 = top;//(top<0?-top:0);
	},

	/* extended functions */
	setDashSize : function(size){
		if(!this.lastElement){ return;}
		this.lastElement.StrokeDashArray = ''+size;
	},

	strokeLine : function(x1,y1,x2,y2){
		x1=this.ePos(x1); y1=this.ePos(y1); x2=this.ePos(x2); y2=this.ePos(y2);
		Candle.wrapper.vector.prototype.strokeLine.call(this,x1,y1,x2,y2);
	},
	strokeCross : function(cx,cy,l){
		cx=this.ePos(cx); cy=this.ePos(cy); l=this.eLen(l);
		Candle.wrapper.vector.prototype.strokeCross.call(this,cx,cy,l);
	},

	/* internal functions */
	ePos : function(num){ return (this.isedge ? (num+this.x0+0.5)|0 : num+this.x0);},
	eLen : function(num){ return (this.isedge ? (num+0.5)|0 : num);},
	addVectorElement : function(isfill,isstroke){
		var path = this.cpath.join(' ');

		var ar = ['<Path Data="', path ,'"'];
		if(isfill)  { ar.push(' Fill="', Candle.parse(this.fillStyle), '"');}
		if(isstroke){ ar.push(' Stroke="', Candle.parse(this.strokeStyle), '" StrokeThickness="', this.lineWidth, '"');}
		ar.push(' />');

		var xaml = this.content.createFromXaml(ar.join(''));
		this.lastElement = xaml;
		this.target.children.add(xaml);

		if(!!this.vid){ this.elements[this.vid] = this.lastElement; this.vid='';}
	}
});

})();
