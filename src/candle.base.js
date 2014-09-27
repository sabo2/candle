// candle.base.js
/* global Candle:false, _doc:false, _2PI:false */
 
/* ------------------- */
/*  WrapperBaseクラス  */
/* ------------------- */
Candle.addWrapper('wrapperbase',{
	initialize : function(parent){
		// canvasに存在するプロパティ＆デフォルト値
		this.fillStyle    = 'black';
		this.strokeStyle  = 'black';
		this.lineWidth    = 1;
		this.font         = '14px system';
		this.textAlign    = 'center';
		this.textBaseline = 'middle';
		this.canvas = parent;	// 親エレメントとなるdivエレメント

		// variables for internal
		this.canvasid = Candle.getcanvasid();
		this.child    = null;	// 親エレメントの直下にあるエレメント

		// Layer additional
		this.currentLayerId = '_empty';
		this.isedgearray    = {_empty:false};
		this.isedge         = false;

		this.setParent();
		this.initElement();
		this.initFunction();
		this.initLayer();

		var self = this;
		this.canvas.getContext = function(type){ return self;};
		this.canvas.candleEnable = true;
	},

	/* Initialize functions */
	setParent : function(){
		this.canvas.style.overflow = 'hidden';
	},
	initElement : function(){},
	initFunction : function(){
		/* 未サポート用 */
		this.canvas.toDataURL = function(type)   { return null;};
		this.canvas.toBlob    = function(f, type){ return null;};
	},
	initLayer : function(){
		this.setLayer();
	},

	/* layer functions */
	setLayer : function(layerid, option){
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		this.setLayerEdge();
		this.setEdgeStyle();
		
		option = option || {};
		if(option.rendering){ this.setRendering(option.rendering);}
	},
	setLayerEdge : function(){
		if(this.isedgearray[this.currentLayerId] !== void 0)
			{ this.isedge = this.isedgearray[this.currentLayerId];}
		else
			{ this.isedge = this.isedgearray['_empty'];}
	},
	setEdgeStyle : function(){},

	/* property functions */
	setRendering : function(render){
		this.isedge = this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.setEdgeStyle();
	},

	/* Canvas API functions (rect) */
	fillRectCenter   : function(cx,cy,bw,bh){ this.fillRect  (cx-bw,cy-bh,2*bw,2*bh);},
	strokeRectCenter : function(cx,cy,bw,bh){ this.strokeRect(cx-bw,cy-bh,2*bw,2*bh);},
	shapeRectCenter  : function(cx,cy,bw,bh){ this.shapeRect (cx-bw,cy-bh,2*bw,2*bh);},

	/* VectorID Functions */
	vshow : function(){},
	vhide : function(){},
	vdel  : function(){}
});

/* ----------------------- */
/*   VectorContextクラス   */
/* ----------------------- */
Candle.addWrapper('vector:wrapperbase',{

	initialize : function(parent){
		// 外部から変更される追加プロパティ
		this.vid      = '';
		this.elements = {};
		this._textcache = {};

		// variables for internal
		this.zidx = 1;
		this.zidx_array = {};
		this.target = null;	// エレメントの追加対象となるオブジェクト

		// 描画中path
		this.cpath    = [];
		this.lastpath = '';
		this.freezepath = false;

		Candle.wrapper.wrapperbase.prototype.initialize.call(this, parent);
	},

	/* additional functions (for initialize) */
	initLayer : function(){
		this.setLayer();

		var rect = Candle.getRectSize(this.canvas);
		this.rect(0,0,rect.width,rect.height);
		this.addVectorElement(false,false);
	},

	initTarget : function(){
		this.target = _doc.getElementById(this.canvasid);
	},
	clear : function(){
		var top = this.canvas.firstChild, el = top.firstChild;
		while(!!el){ top.removeChild(el); el=top.firstChild;}
		this.resetElement();
	},
	resetElement : function(){
		this.vid = '';
		this.elements = {};
		this.initTarget();
		this.zidx = 1;
		this.zidx_array = {};
		this.setLayer();
		this._textcache = {};
	},

	/* layer functions */
	setLayer : function(layerid, option){
		this.vid = '';
		if(!!layerid){
			var lid = [this.canvasid,"layer",layerid].join('_');
			var layer = _doc.getElementById(lid);
			if(!layer){ layer = this.createLayer(lid);}

			if(!this.zidx_array[layerid]){
				this.zidx++;
				this.zidx_array[layerid] = layer.style.zIndex = this.zidx;
			}
			this.target = layer;
		}
		else{
			this.target = this.child;
		}
		Candle.wrapper.wrapperbase.prototype.setLayer.call(this, layerid, option);
		this.freezepath = (!!option && option.freeze);
	},
	createLayer : function(lid){ return null;},

	/* property functions */
	setUnselectable : function(unsel){},

	changeSize : function(width,height){
		this.canvas.style.width  = width + 'px';
		this.canvas.style.height = height + 'px';

		this.changeChildSize(this.canvas.firstChild,width,height);
	},
	changeChildSize : function(child,width,height){},

	/* Canvas API functions (for transform) */
	translate : function(left,top){},

	/* Canvas API functions (for path) */
	beginPath : function(){
		this.cpath = [];
		this.lastpath = '';
	},
	closePath : function(){
		this.cpath.push(this.PATH_CLOSE);
		this.lastpath = this.PATH_CLOSE;
	},

	moveTo : function(x,y){
		this.cpath.push(this.PATH_MOVE,x,y);
		this.lastpath = this.PATH_MOVE;
	},
	lineTo : function(x,y){
		if(this.lastpath!==this.PATH_LINE){ this.cpath.push(this.PATH_LINE);}
		this.cpath.push(x,y);
		this.lastpath = this.PATH_LINE;
	},
	rect : function(x,y,w,h){
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
		var unknownflag = (startRad>endRad)^(Math.abs(endRad-startRad)>Math.PI);
		var islong = ((antiClockWise^unknownflag)?1:0), sweep = ((islong===0^unknownflag)?1:0);
		this.cpath.push(this.PATH_MOVE,sx,sy,this.PATH_ARCTO,r,r,0,islong,sweep,ex,ey);
		this.lastpath = this.PATH_ARCTO;
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
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.cpath.push(this.PATH_CLOSE);}
	},
	setOffsetLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2), a=[];
		for(var i=0;i<len-2;i+=2){ a[i>>1] = [_args[i+2]+_args[0], _args[i+3]+_args[1]];}
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.cpath.push(this.PATH_CLOSE);}
	},
	setLinePath_com : function(array){
		this.cpath = [];
		for(var i=0,len=array.length;i<len;i++){
			this.cpath.push(i===0 ? this.PATH_MOVE : this.PATH_LINE);
			this.cpath.push(array[i][0],array[i][1]);
		}
	},
	setDashSize : function(obj, sizes){},

	strokeLine : function(x1,y1,x2,y2){
		var stack = this.cpath;
		this.cpath = [this.PATH_MOVE,x1,y1,this.PATH_LINE,x2,y2];
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		var stack = this.cpath;
		this.cpath = [this.PATH_MOVE,x1,y1,this.PATH_LINE,x2,y2];
		var obj = this.addVectorElement(false,true);
		this.setDashSize(obj, sizes);
		this.cpath = stack;
	},
	strokeCross : function(cx,cy,l){
		var stack = this.cpath;
		this.cpath = [this.PATH_MOVE,(cx-l),(cy-l),this.PATH_LINE,(cx+l),(cy+l),
					  this.PATH_MOVE,(cx-l),(cy+l),this.PATH_LINE,(cx+l),(cy-l)];
		this.addVectorElement(false,true);
		this.cpath = stack;
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(this.PATH_CLOSE);
		this.addVectorElement(true,false);
		this.cpath = stack;
	},
	strokeCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(this.PATH_CLOSE);
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	shapeCircle : function(cx,cy,r){
		var stack = this.cpath;
		this.cpath = [];
		this.arc(cx,cy,r,0,_2PI,false);
		this.cpath.push(this.PATH_CLOSE);
		this.addVectorElement(true,true);
		this.cpath = stack;
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
	fillText_main : function(text,x,y){},

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
	drawImage_main : function(el,image,sx,sy,sw,sh,dx,dy,dw,dh){},

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
	addVectorElement_main : function(el,isfill,isstroke){},

	/* VectorID Functions */
	vhide : function(vids){
		var el = this.elements[this.vid];
		if(!!el){ this.hide(el);}
	},
	vdel  : function(vids){
		var el = this.elements[this.vid];
		if(!!el){
			this.target.removeChild(el);
			delete this.elements[this.vid];
		}
	},
	
	show : function(el){ el.removeAttribute('display');},
	hide : function(el){ el.setAttribute('display', 'none');}
});
