// candle.base.js
 
/* ------------------- */
/*  WrapperBaseクラス  */
/* ------------------- */
Candle.addWrapper('wrapperbase',{
	initialize : function(idname){
		// canvasに存在するプロパティ＆デフォルト値
		this.fillStyle    = 'black';
		this.strokeStyle  = 'black';
		this.lineWidth    = 1;
		this.font         = '14px system';
		this.textAlign    = 'center';
		this.textBaseline = 'middle';
		this.canvas = null;		// 親エレメントとなるdivエレメント

		// variables for internal
		this.idname   = idname;
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
	},

	/* Initialize functions */
	setParent : function(){
		var parent = this.canvas = _doc.getElementById(this.idname);
		parent.style.overflow = 'hidden';
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
	setLayer : function(layerid){
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		this.setLayerEdge();
		this.setEdgeStyle();
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

	initialize : function(idname){
		// 外部から変更される追加プロパティ
		this.vid      = '';
		this.elements = [];
		this.lastElement = null;

		// variables for internal
		this.zidx = 1;
		this.zidx_array = {};
		this.target = null;	// エレメントの追加対象となるオブジェクト

		// 描画中path
		this.cpath    = [];
		this.lastpath = '';

		Candle.wrapper.wrapperbase.prototype.initialize.call(this, idname);
	},

	/* additional functions (for initialize) */
	initLayer : function(){
		this.setLayer();

		var rect = Candle.getRectSize(this.canvas);
		this.rect(0,0,rect.width,rect.height);
		this.addVectorElement(false,false);
	},
	clear : function(){
		this.resetElement();
	},
	resetElement : function(){
		this.vid = '';
		this.elements = [];
		this.lastElement = null;
		this.zidx = 1;
		this.zidx_array = {};
		this.setLayer();
	},

	/* layer functions */
	setLayer : function(layerid){
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
		Candle.wrapper.wrapperbase.prototype.setLayer.call(this, layerid);
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
		if(endRad-startRad>=_2PI){ sx=cx+r, sy=cy, ex=cx+r, ey=cy;}
		else{
			sx = cx + r*Math.cos(startRad), sy = cy + r*Math.sin(startRad),
			ex = cx + r*Math.cos(endRad),   ey = cy + r*Math.sin(endRad);
		}
		if(endRad-startRad>=_2PI){ sy+=0.125;}
		var unknownflag = (startRad>endRad)^(Math.abs(endRad-startRad)>Math.PI);
		var islong = ((antiClockWise^unknownflag)?1:0), sweep = ((islong==0^unknownflag)?1:0);
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

	/* Canvas API functions (for text) */
	fillText : function(text,x,y){},

	/* Canvas API functions (for image) */
	drawImage : function(image,sx,sy,sw,sh,dx,dy,dw,dh){},

	/* Canvas API functions (for transform) */
	translate : function(left,top){},

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
	setDashSize : function(sizes){},

	strokeLine : function(x1,y1,x2,y2){
		var stack = this.cpath;
		this.cpath = [this.PATH_MOVE,x1,y1,this.PATH_LINE,x2,y2];
		this.addVectorElement(false,true);
		this.cpath = stack;
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		var stack = this.cpath;
		this.cpath = [this.PATH_MOVE,x1,y1,this.PATH_LINE,x2,y2];
		this.addVectorElement(false,true);
		this.setDashSize(sizes);
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

	/* internal functions */
	addVectorElement : function(isfill,isstroke){},

	/* VectorID Functions */
	vshow : function(vids){
		if(typeof vids === 'string'){ vids = [vids];}
		for(var i=0,len=vids.length;i<len;i++){
			if(!!this.elements[vids[i]]){ this.show(vids[i]);}
		}
	},
	vhide : function(vids){
		if(typeof vids === 'string'){ vids = [vids];}
		for(var i=0,len=vids.length;i<len;i++){
			if(!!this.elements[vids[i]]){ this.hide(vids[i]);}
		}
	},
	vdel  : function(vids){
		if(typeof vids === 'string'){ vids = [vids];}
		for(var i=0;i<vids.length;i++){
			if(!!this.elements[vids[i]]){
				this.target.removeChild(this.elements[vids[i]]);
				delete this.elements[vids[i]];
			}
		}
	},
	show : function(vid){},
	hide : function(vid){}
});
