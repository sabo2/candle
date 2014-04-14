// candle.canvas.js
 
(function(){

/* ---------------------- */
/*   canvas描画可能条件   */
/* ---------------------- */
if(!document.createElement('canvas').getContext){ return;}

/* -------------------------- */
/*   canvasブラウザ依存対策   */
/* -------------------------- */
if(window.CanvasRenderingContext2D){
	var p = CanvasRenderingContext2D.prototype;
	if(!p.setLineDash){
		if     ('mozDash' in p)       { p.setLineDash = function(sizes){ this.mozDash=sizes;};}
		else if('webkitLineDash' in p){ p.setLineDash = function(sizes){ this.webkitLineDash=sizes;};}
	}
}

var CTOP_OFFSET = 0, UA = navigator.userAgent;
if(UA.match(/Chrome|Trident/)){
	CTOP_OFFSET = -0.5;
}
else if(UA.match(/AppleWebKit/)){
	CTOP_OFFSET = -0.6;
}
else /* if(UA.match(/Gecko/)) */{
	if(UA.match(/Win/)){
		CTOP_OFFSET = -0.65;
	}
	else{
		CTOP_OFFSET = -0.5;
	}
}

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
		var parent = this.canvas = _doc.getElementById(this.idname);

		var rect = Candle.getRectSize(parent);
		var root = _doc.createElement('canvas');
		root.id = this.canvasid;

		root.width  = rect.width;
		root.height = rect.height;
		root.style.width  = rect.width + 'px';
		root.style.height = rect.height + 'px';
		parent.appendChild(root);

		this.child = root;
		this.afterInit();
	},
	afterInit : function(){
		var parent = this.canvas;
		var child  = this.child;

		var self = this;
		parent.style.overflow = 'hidden';
		if(Candle.debugmode){
			parent.style.backgroundColor = "#efefef";
			parent.style.border = "solid 1px silver";
		}
		parent.getContext = function(type){ return self;};
		parent.toDataURL = function(type){
			return (!!type?child.toDataURL(type):child.toDataURL());
		};
		parent.toBlob = function(){
			try{ return child.toBlob();}catch(e){}
			/* Webkit, BlinkにtoBlobがない... */
			child.toDataURL().match(/data:(.*);base64,(.*)/);
			var bin = window.atob(RegExp.$2), len=bin.length;
			var buf = new Uint8Array(len);
			for(var i=0;i<len;i++){ buf[i]=bin.charCodeAt(i);}
			return new Blob([buf.buffer], {type:RegExp.$1});
		};
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
		var s = this.canvas.style;
		s.MozUserSelect = s.WebkitUserSelect = s.userSelect = (unsel ? 'none' : 'text');
	},

	getContextElement : function(){ return this.child;},
	getLayerElement   : function(){ return this.child;},

	changeSize : function(width,height){
		var parent = this.canvas;
		parent.style.width  = width + 'px';
		parent.style.height = height + 'px';

		var child = this.child;
		var left = parseInt(child.style.left), top = parseInt(child.style.top);
		width += (left<0?-left:0);
		height += (top<0?-top:0);
		child.style.width  = width + 'px';
		child.style.height = height + 'px';
		child.width  = width;
		child.height = height;
	},

	/* 内部用関数 */
	setProperties : function(){
		var c = this.context;
		c.fillStyle    = this.fillStyle;
		c.strokeStyle  = this.strokeStyle;
		c.lineWidth    = this.lineWidth;
		c.font         = this.font;
		c.textAlign    = this.textAlign;
		c.textBaseline = this.textBaseline;
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
		if(this.textBaseline==="candle-top"){
			var ME = Candle.ME;
			ME.style.font = this.font;
			ME.innerHTML = text;
			y -= ME.offsetHeight*CTOP_OFFSET;
			this.context.textBaseline = "alphabetic";
		}
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
		var c = this.context;
		this.setProperties();
		c.beginPath();
		c.moveTo(x1,y1);
		c.lineTo(x2,y2);
		c.stroke();
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		var self = this, c = this.context;
		this.strokeDashedLine = ((!!this.context.setLineDash) ?
			function(x1,y1,x2,y2,sizes){
				var c = self.context;
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
				var length = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
				var distance=0, phase=0, tilt=(y2-y1)/(x2-x1), tilts=tilt*tilt+1;
				var c = self.context;
				self.setProperties();
				c.beginPath();
				c.moveTo(x1, y1);
				while(distance<length){
					var a = Math.sqrt(distance*distance/tilts);
					var px = x1+a, py = y1+tilt*a;
					if((phase&1)===0){ c.moveTo(px, py);}
					else             { c.lineTo(px, py);}
					distance += sizes[phase];
					phase++;
					if(phase>=sizes.length){ phase=0;}
				}
				c.stroke();
			}
		);
		this.strokeDashedLine(x1,y1,x2,y2,sizes);
	},
	strokeCross : function(cx,cy,l){
		var c = this.context;
		this.setProperties();
		c.beginPath();
		c.moveTo(cx-l,cy-l);
		c.lineTo(cx+l,cy+l);
		c.moveTo(cx-l,cy+l);
		c.lineTo(cx+l,cy-l);
		c.stroke();
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		var c = this.context;
		this.setProperties();
		c.beginPath();
		c.arc(cx,cy,r,0,_2PI,false);
		c.fill();
	},
	strokeCircle : function(cx,cy,r){
		var c = this.context;
		this.setProperties();
		c.beginPath();
		c.arc(cx,cy,r,0,_2PI,false);
		c.stroke();
	},
	shapeCircle : function(cx,cy,r){
		var c = this.context;
		this.setProperties();
		c.beginPath();
		c.arc(cx,cy,r,0,_2PI,false);
		c.fill();
		c.stroke();
	}
});

})();
