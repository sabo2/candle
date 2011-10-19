// candle.canvas.js
 
(function(){

// Candleオブジェクトがない場合は何もしない
if(!window.Candle){ return;}

// canvas描画可能条件
if(!document.createElement('canvas').getContext){ return;}

/* ------------- */
/*  const value  */
/* ------------- */
var Candle = window.Candle,
	_doc = document,
	_2PI = 2*Math.PI;

/* -------------------- */
/*   Canvas用ラッパー   */
/* -------------------- */
Candle.addTypes('canvas');

Candle.addWrapper('canvas',{

	initialize : function(idname){
		Candle.wrapper.wrapperbase.prototype.initialize.call(this, idname);

		// variables for internal
		this.context  = null;	// 本来のCanvasRenderingContext2Dオブジェクト

		this.use = new Candle.TypeList('canvas');

		this.initElement();
	},

	/* extend functions (initialize) */
	initElement : function(){
		this.canvas = _doc.getElementById(this.idname);

		var rect = Candle.getRectSize(this.canvas);
		var top = _doc.createElement('canvas');
		top.id = this.canvasid;

		top.width  = rect.width;
		top.height = rect.height;
		top.style.position = 'relative';
		top.style.width  = rect.width + 'px';
		top.style.height = rect.height + 'px';
		this.canvas.appendChild(top);

		this.child = top;
		this.afterInit();
	},
	afterInit : function(){
		var parent = this.canvas;
		var child  = this.child;

		var self = this;
		parent.style.display  = 'block';
		parent.style.position = 'relative';
		parent.style.overflow = 'hidden';
		if(Candle.debugmode){
			parent.style.backgroundColor = "#efefef";
			parent.style.border = "solid 1px silver";
		}
		parent.getContext = function(type){ return self;};
		parent.toDataURL = function(type){ return (!!type?child.toDataURL(type):child.toDataURL());};

		this.context = this.child.getContext('2d');

		Candle._initializing--;
		Candle.readyflag[this.idname] = true;
	},

	clear : function(){
		this.setProperties();
		this.context.setTransform(1,0,0,1,0,0); // 変形をリセット
		var rect = Candle.getRectSize(this.canvas);
		this.context.clearRect(0,0,rect.width,rect.height);
	},

	/* layer functions */
	setLayer : function(layerid){
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		if(this.isedgearray[this.currentLayerId] === void 0){
			this.isedgearray[this.currentLayerId] = false;
		}
		this.isedge = this.isedgearray[this.currentLayerId];
	},

	/* property functions */
	setRendering : function(render){
		this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.isedge = this.isedgearray[this.currentLayerId];
	},
	setUnselectable : function(unsel){
		if(unsel===(void 0)){ unsel = true;}else{ unsel = !!unsel;}
		this.canvas.style.MozUserSelect    = (unsel ? 'none' : 'text');
		this.canvas.style.WebkitUserSelect = (unsel ? 'none' : 'text');
		this.canvas.style.userSelect       = (unsel ? 'none' : 'text');
	},

	getContextElement : function(){ return this.child;},
	getLayerElement   : function(){ return this.child;},

	changeSize : function(width,height){
		this.canvas.style.width  = width + 'px';
		this.canvas.style.height = height + 'px';

		var canvas = this.canvas.firstChild;
		var left = parseInt(canvas.style.left), top = parseInt(canvas.style.top);
		width += (left<0?-left:0); height += (top<0?-top:0);
		canvas.style.width  = width + 'px';
		canvas.style.height = height + 'px';
		canvas.width  = width;
		canvas.height = height;
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

	moveTo : function(x,y){
		this.context.moveTo(this.ePos(x),this.ePos(y));
	},
	lineTo : function(x,y){
		this.context.lineTo(this.ePos(x),this.ePos(y));
	},
	rect : function(x,y,w,h){
		this.context.rect(this.ePos(x),this.ePos(y),w,h);
	},
	arc  : function(cx,cy,r,startRad,endRad,antiClockWise){
		this.context.arc(this.ePos(cx),this.ePos(cy),r,startRad,endRad,antiClockWise);
	},

	/* Canvas API functions (for drawing) */
	fill       : function(){ this.setProperties(); this.context.fill();},
	stroke     : function(){ this.setProperties(); this.context.stroke();},
	shape : function(){
		this.setProperties();
		this.context.fill();
		this.context.stroke();
	},

	/* Canvas API functions (rect) */
	fillRect   : function(x,y,w,h){
		this.setProperties();
		this.context.fillRect(this.ePos(x),this.ePos(y),w,h);
	},
	strokeRect : function(x,y,w,h){
		this.setProperties();
		this.context.strokeRect(this.ePos(x),this.ePos(y),w,h);
	},
	shapeRect : function(x,y,w,h){
		x=this.ePos(x); y=this.ePos(y); w=this.eLen(w); h=this.eLen(h);
		this.setProperties();
		this.context.fillRect(x,y,w,h);
		this.context.strokeRect(x,y,w,h);
	},

	/* Canvas API functions (for text) */
	fillText : function(text,x,y){
		this.setProperties();
		this.context.fillText(text,x,y);
	},

	/* Canvas API functions (for image) */
	drawImage : function(){
		this.context.drawImage.apply(this.context, arguments);
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		this.context.translate(left, top);
	},

	/* extended functions */
	setLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2), a=[];
		for(var i=0;i<len;i+=2){ a[i>>1] = [_args[i],_args[i+1]];}
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.context.closePath();}
	},
	setOffsetLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2)-2, a=[];
		for(var i=0;i<len;i+=2){ a[i>>1] = [_args[i+2]+_args[0], _args[i+3]+_args[1]];}
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.context.closePath();}
	},
	setLinePath_com : function(array){
		for(var i=0,len=array.length;i<len;i++){
			var a1=this.ePos(array[i][0]), a2=this.ePos(array[i][1]);
			if(i===0){ this.context.moveTo(a1,a2);}
			else     { this.context.lineTo(a1,a2);}
		}
	},
	setDashSize : function(size){ },

	strokeLine : function(x1,y1,x2,y2){
		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(this.ePos(x1),this.ePos(y1));
		this.context.lineTo(this.ePos(x2),this.ePos(y2));
		this.context.stroke();
	},
	strokeCross : function(cx,cy,l){
		var x1=this.ePos(cx-l), y1=this.ePos(cy-l),
			x2=this.ePos(cx+l), y2=this.ePos(cy+l);

		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(x1,y1);
		this.context.lineTo(x2,y2);
		this.context.moveTo(x1,y2);
		this.context.lineTo(x2,y1);
		this.context.stroke();
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(this.ePos(cx),this.ePos(cy),r,0,_2PI,false);
		this.context.fill();
	},
	strokeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(this.ePos(cx),this.ePos(cy),r,0,_2PI,false);
		this.context.stroke();
	},
	shapeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(this.ePos(cx),this.ePos(cy),r,0,_2PI,false);
		this.context.fill();
		this.context.stroke();
	},

	/* internal functions */
	ePos : function(num){ return (this.isedge ? (num+0.5)|0 : num);},
	eLen : function(num){ return (this.isedge ? num|0 : num);}
});

})();