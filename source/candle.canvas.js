// candle.canvas.js
 
(function(){

// Candleオブジェクトがない場合は何もしない
if(!window.Candle){ return;}

/* ------------- */
/*  const value  */
/* ------------- */
var Candle = window.Candle,
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
		var _doc = document;
		var parent = _doc.getElementById(this.idname);
		var canvas = _doc.getElementById(this.canvasid);

		if(!canvas){
			canvas = _doc.createElement('canvas');
			canvas.id = this.canvasid;
			parent.appendChild(canvas);
		}

		var rect = Candle.getRectSize(parent);
		canvas.width  = rect.width;
		canvas.height = rect.height;
		canvas.style.position = 'relative';
		canvas.style.width  = rect.width + 'px';
		canvas.style.height = rect.height + 'px';

		this.child = canvas;

		var self = this;
		//parent.className = "canvas";
		parent.style.display  = 'block';
		parent.style.position = 'relative';
		parent.style.overflow = 'hidden';
		if(Candle.debugmode){
			parent.style.backgroundColor = "#efefef";
			parent.style.border = "solid 1px silver";
		}
		parent.getContext = function(type){
			self.context = canvas.getContext(type);
			return self;
		};
		parent.toDataURL = function(type){ 
			return (!!type ? canvas.toDataURL(type) : canvas.toDataURL());
		};

		this.canvas = parent;
		this.context = canvas.getContext('2d');
		Candle._initializing--;
		Candle.readyflag[this.idname] = true;
	},
	setLayer : function(layerid){
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		if(this.isedgearray[this.currentLayerId] === void 0){
			this.isedgearray[this.currentLayerId] = false;
		}
		this.isedge = this.isedgearray[this.currentLayerId];
	},
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
	clear : function(){
		if(!!this.canvas.style.backgroundColor){
			this.setProperties();
			this.context.setTransform(1,0,0,1,0,0); // 変形をリセット
			this.context.fillStyle = Candle.parsecolorrev(this.canvas.style.backgroundColor);
			var rect = Candle.getRectSize(this.canvas);
			this.context.fillRect(0,0,rect.width,rect.height);
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
	moveTo : function(x,y){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		this.context.moveTo(x,y);
	},
	lineTo : function(x,y){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		this.context.lineTo(x,y);
	},
	rect : function(x,y,w,h){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		this.context.rect(x,y,w,h);
	},
	arc  : function(cx,cy,r,startRad,endRad,antiClockWise){
		cx = (this.isedge ? (cx+0.5)|0 : cx);
		cy = (this.isedge ? (cy+0.5)|0 : cy);
		this.context.arc(px,py,r,startRad,endRad,antiClockWise);
	},

	/* Canvas API functions (for drawing) */
	fill       : function(){ this.setProperties(); this.context.fill();},
	stroke     : function(){ this.setProperties(); this.context.stroke();},
	fillRect   : function(x,y,w,h){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		this.setProperties();
		this.context.fillRect(x,y,w,h);
	},
	strokeRect : function(x,y,w,h){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		this.setProperties();
		this.context.strokeRect(x,y,w,h);
	},
	fillText : function(text,x,y){
		this.setProperties();
		this.context.fillText(text,x,y);
	},
	drawImage : function(image,sx,sy,sw,sh,dx,dy,dw,dh){
		this.context.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		this.context.translate(left, top);
	},

	/* extended functions */
	shape : function(){
		this.setProperties();
		this.context.fill();
		this.context.stroke();
	},
	shapeRect : function(x,y,w,h){
		x = (this.isedge ? (x+0.5)|0 : x);
		y = (this.isedge ? (y+0.5)|0 : y);
		w = (this.isedge ? (w+0.5)|0 : w);
		h = (this.isedge ? (h+0.5)|0 : h);

		this.setProperties();
		this.context.fillRect(x,y,w,h);
		this.context.strokeRect(x,y,w,h);
	},

	setLinePath : function(){
		var _args = arguments, _len = _args.length;
		this.context.beginPath();
		for(var i=0,len=_len-((_len|1)?1:2);i<len;i+=2){
			var a1 = (this.isedge ? (_args[i]  +0.5)|0 : _args[i]  );
				a2 = (this.isedge ? (_args[i+1]+0.5)|0 : _args[i+1]);
			if(i==0){ this.context.moveTo(a1,a2);}
			else    { this.context.lineTo(a1,a2);}
		}
		if(_args[_len-1]){ this.context.closePath();}
	},
	setOffsetLinePath : function(){
		var _args = arguments, _len = _args.length, m=[_args[0],_args[1]];
		this.context.beginPath();
		for(var i=2,len=_len-((_len|1)?1:2);i<len;i+=2){
			m[i]   = _args[i]   + m[0];
			m[i+1] = _args[i+1] + m[1];
		}
		for(var i=2,len=_len-((_len|1)?1:2);i<len;i+=2){
			var a1 = (this.isedge ? (m[i]  +0.5)|0 : m[i]);
				a2 = (this.isedge ? (m[i+1]+0.5)|0 : m[i+1]);
			if(i===2){ this.context.moveTo(a1,a2);}
			else     { this.context.lineTo(a1,a2);}
		}
		if(_args[_len-1]){ this.context.closePath();}
	},
	setDashSize : function(size){ },

	strokeLine : function(x1,y1,x2,y2){
		x1 = (this.isedge ? (x1+0.5)|0 : x1);
		y1 = (this.isedge ? (y1+0.5)|0 : y1);
		x2 = (this.isedge ? (x2+0.5)|0 : x2);
		y2 = (this.isedge ? (y2+0.5)|0 : y2);

		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(x1,y1);
		this.context.lineTo(x2,y2);
		this.context.stroke();
	},
	strokeCross : function(cx,cy,l){
		var x1 = (this.isedge ? (cx-l+0.5)|0 : cx-l),
			y1 = (this.isedge ? (cy-l+0.5)|0 : cy-l),
			x2 = (this.isedge ? (cx+l+0.5)|0 : cx+l),
			y2 = (this.isedge ? (cy+l+0.5)|0 : cy+l);

		this.setProperties();
		this.context.beginPath();
		this.context.moveTo(x1,y1);
		this.context.lineTo(x2,y2);
		this.context.moveTo(x1,y2);
		this.context.lineTo(x2,y1);
		this.context.stroke();
	},
	fillCircle : function(cx,cy,r){
		cx = (this.isedge ? (cx+0.5)|0 : cx);
		cy = (this.isedge ? (cy+0.5)|0 : cy);
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.fill();
	},
	strokeCircle : function(cx,cy,r){
		cx = (this.isedge ? (cx+0.5)|0 : cx);
		cy = (this.isedge ? (cy+0.5)|0 : cy);
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.stroke();
	},
	shapeCircle : function(cx,cy,r){
		cx = (this.isedge ? (cx+0.5)|0 : cx);
		cy = (this.isedge ? (cy+0.5)|0 : cy);
		this.setProperties();
		this.context.beginPath();
		this.context.arc(cx,cy,r,0,_2PI,false);
		this.context.fill();
		this.context.stroke();
	}

});

})();
