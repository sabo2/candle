// candle.canvas.js
 
(function(){

// Candleオブジェクトがない場合は何もしない
if(!window.Candle){ return;}

// canvas描画可能条件
if(!document.createElement('canvas').getContext){ return;}

var p = CanvasRenderingContext2D.prototype;
if(!p.setLineDash){
	if     ('mozDash' in p)       { p.setLineDash = function(sizes){ this.mozDash=sizes;};}
	else if('webkitLineDash' in p){ p.setLineDash = function(sizes){ this.webkitLineDash=sizes;};}
}

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

Candle.addWrapper('canvas:wrapperbase',{

	initialize : function(idname){
		Candle.wrapper.wrapperbase.prototype.initialize.call(this, idname);

		// variables for internal
		this.context  = null;	// 本来のCanvasRenderingContext2Dオブジェクト

		this.use = new Candle.TypeList('canvas');

		this.x0 = 0;
		this.y0 = 0;

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
		parent.toBlob = function(){ return child.toBlob(); };
		child.toBlob = child.toBlob || child.msToBlob;

		this.setLayer();
		this.context = this.child.getContext('2d');

		Candle._initializing--;
		Candle.readyflag[this.idname] = true;
	},

	clear : function(){
		this.setProperties();
		this.context.setTransform(1,0,0,1,0,0); // 変形をリセット
		this.context.translate(this.x0, this.y0);
		var rect = Candle.getRectSize(this.canvas);
		this.context.clearRect(0,0,rect.width,rect.height);
	},

	/* layer functions */
	setLayer : function(layerid){
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		if(this.isedgearray[this.currentLayerId] !== void 0)
			{ this.isedge = this.isedgearray[this.currentLayerId];}
		else
			{ this.isedge = this.isedgearray['_empty'];}
		this.setEdgeStyle(layerid);
	},
	setEdgeStyle : function(layerid){
		var s = this.canvas.style;
		if('imageRendering' in s){
			s.imageRendering = '';
			if(this.isedge){
				s.imageRendering = 'pixelated';
				if(!s.imageRendering){ s.imageRendering = '-webkit-optimize-contrast';}
				if(!s.imageRendering){ s.imageRendering = '-moz-crisp-edges';}
				if(!s.imageRendering){ s.imageRendering = '-o-crisp-edges';}
			}
		}
	},

	/* property functions */
	setRendering : function(render){
		this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.isedge = this.isedgearray[this.currentLayerId];
		this.setEdgeStyle(this.currentLayerId);
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
		this.context.moveTo(x,y);
	},
	lineTo : function(x,y){
		this.context.lineTo(x,y);
	},
	rect : function(x,y,w,h){
		this.context.rect(x,y,w,h);
	},
	arc  : function(cx,cy,r,startRad,endRad,antiClockWise){
		this.context.arc(cx,cy,r,startRad,endRad,antiClockWise);
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
		this.context.fillRect(x,y,w,h);
	},
	strokeRect : function(x,y,w,h){
		this.setProperties();
		this.context.strokeRect(x,y,w,h);
	},
	shapeRect : function(x,y,w,h){
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
		this.x0 = left;
		this.y0 = top;
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
		this.context.beginPath();
		this.setLinePath_com.call(this,a);
		if(_args[_len-1]){ this.context.closePath();}
	},
	setLinePath_com : function(array){
		for(var i=0,len=array.length;i<len;i++){
			var ar=array[i];
			if(i===0){ this.context.moveTo(ar[0],ar[1]);}
			else     { this.context.lineTo(ar[0],ar[1]);}
		}
	},
	setDashSize : function(size){ },

	strokeLine : function(x1,y1,x2,y2){
		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(x1,y1);
		this.context.lineTo(x2,y2);
		this.context.stroke();
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		var self = this, c = this.context;
		this.strokeDashedLine = ((!!c.setLineDash) ?
			function(x1,y1,x2,y2,sizes){
				self.setProperties();
				c.beginPath();
				c.moveTo(x1,y1);
				c.lineTo(x2,y2);
				c.setLineDash(sizes);
				c.stroke();
				c.setLineDash([]);
			}
		:
			function(x1,y1,x2,y2,sizes){
				if((sizes.length%2)===1){ sizes = sizes.concat(sizes);}
				var fillStyle_sv = self.fillStyle;
				self.fillStyle = self.strokeStyle;
				self.setProperties();
				self.beginPath();
				self.moveTo(x1, y1);
				var length = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
				var distance=0, phase=0;
				var tilt=(y2-y1)/(x2-x1), tilts=tilt*tilt+1;
				while(distance<length){
					var a = Math.sqrt(distance*distance/tilts);
					var px = x1+a, py = y1+tilt*a;
					if((phase&1)===0){ self.moveTo(px, py);}
					else             { self.lineTo(px, py);}
					distance += sizes[phase];
					phase++;
					if(phase>=sizes.length){ phase=0;}
				}
				self.stroke();
				self.fillStyle = fillStyle_sv;
			}
		);
		this.strokeDashedLine(x1,y1,x2,y2,sizes);
	},
	strokeCross : function(cx,cy,l){
		var x1=cx-l, y1=cy-l, x2=cx+l, y2=cy+l;

		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(cx-l,cy-l);
		this.context.lineTo(cx+l,cy+l);
		this.context.moveTo(cx-l,cy+l);
		this.context.lineTo(cx+l,cy-l);
		this.context.stroke();
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.fill();
	},
	strokeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.stroke();
	},
	shapeCircle : function(cx,cy,r){
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.fill();
		this.context.stroke();
	}
});

})();
