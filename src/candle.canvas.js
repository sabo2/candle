// candle.canvas.js
/* global Candle:false, _doc:false, _2PI:false */
 
(function(){

/* ---------------------- */
/*   canvas描画可能条件   */
/* ---------------------- */
if(typeof document==='undefined'){ return;}
if(!!document.createElement('canvas').probablySupportsContext && 
	!document.createElement('canvas').probablySupportsContext('2d')){ return;}

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
if(UA.match(/Chrome/)){
	CTOP_OFFSET = -0.72;
}
else if(UA.match(/AppleWebKit/)){
	CTOP_OFFSET = -0.7;
}
else if(UA.match(/Trident/)){
	CTOP_OFFSET = -0.74;
}
else /* if(UA.match(/Gecko/)) */{
	if(UA.match(/Win/)){
		CTOP_OFFSET = -0.7;
	}
	else{
		CTOP_OFFSET = -0.76;
	}
}

/* -------------------- */
/*   Canvas用ラッパー   */
/* -------------------- */
Candle.addTypes('canvas');

Candle.addWrapper('canvas:wrapperbase',{

	initialize : function(parent){
		// variables for internal
		this.context  = null;	// 本来のCanvasRenderingContext2Dオブジェクト

		this.use = new Candle.TypeList('canvas');

		this.x0 = 0;
		this.y0 = 0;

		Candle.wrapper.wrapperbase.prototype.initialize.call(this, parent);
	},
	setkey : function(vid){ return this;},
	hidekey : function(vid){ return this;},
	release : function(vid){ return this;},

	/* extend functions (initialize) */
	initElement : function(){
		var rect = Candle.getRectSize(this.canvas);
		var root = this.child = _doc.createElement('canvas');
		root.id = this.canvasid;
		root.width  = rect.width;
		root.height = rect.height;
		root.style.width  = rect.width + 'px';
		root.style.height = rect.height + 'px';
		this.canvas.appendChild(root);

		this.context = root.getContext('2d');
	},
	initFunction : function(){
		var root = this.child;
		this.canvas.toDataURL = function(type){
			return root.toDataURL(type || void 0);
		};
		this.canvas.toBlob = function(f, type){
			try{ return root.toBlob(f, type);}catch(e){}
			/* Webkit, BlinkにtoBlobがない... */
			root.toDataURL(type || void 0).match(/data:(.*);base64,(.*)/);
			var bin = window.atob(RegExp.$2), len=bin.length;
			var buf = new Uint8Array(len);
			for(var i=0;i<len;i++){ buf[i]=bin.charCodeAt(i);}
			var blob = new Blob([buf.buffer], {type:RegExp.$1});
			if(!!f){ f(blob);}
			return blob;
		};
		root.toBlob = root.toBlob || root.msToBlob;
	},
	initLayer : function(){
		this.setLayer();
	},

	clear : function(){
		this.setProperties(true,true);
		this.context.setTransform(1,0,0,1,0,0); // 変形をリセット
		this.context.translate(this.x0, this.y0);
		var rect = Candle.getRectSize(this.canvas);
		this.context.clearRect(0,0,rect.width,rect.height);
	},

	/* layer functions */
	setLayer : function(layerid, option){
		var layer = this.currentLayerId = (!!layerid ? layerid : '_empty');
		this.isedge = this.isedgearray[(this.isedgearray[layer]!==void 0) ? layer : "_empty"];
		this.setEdgeStyle();
		
		option = option || {};
		if(option.rendering){ this.setRendering(option.rendering);}
	},
	setEdgeStyle : function(){
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
		this.isedge = this.isedgearray[this.currentLayerId] = (render==='crispEdges');
		this.setEdgeStyle();
	},

	changeSize : function(width,height){
		var parent = this.canvas;
		parent.style.width  = width + 'px';
		parent.style.height = height + 'px';

		var child = this.child;
		var left = parseInt(child.style.left), top = parseInt(child.style.top); // jshint ignore:line
		width += (left<0?-left:0);
		height += (top<0?-top:0);
		child.style.width  = width + 'px';
		child.style.height = height + 'px';
		child.width  = width;
		child.height = height;
	},

	/* Canvas API functions (for transform) */
	translate : function(left,top){
		this.x0 = left;
		this.y0 = top;
		this.context.translate(left, top);
	},

	/* 内部用関数 */
	setProperties : function(isfill,isstroke){
		isfill   = isfill   && !!this.fillStyle   && (this.fillStyle  !=="none");
		isstroke = isstroke && !!this.strokeStyle && (this.strokeStyle!=="none");
		var c = this.context;
		if(isfill)  { c.fillStyle   = this.fillStyle;}
		if(isstroke){ c.strokeStyle = this.strokeStyle;}
		c.lineWidth    = this.lineWidth;
		c.font         = this.font;
		c.textAlign    = this.textAlign;
		c.textBaseline = this.textBaseline;
		return (isfill || isstroke);
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
	fill : function(){
		if(this.setProperties(true,false)){
			this.context.fill();
		}
	},
	stroke : function(){
		if(this.setProperties(false,true)){
			this.context.stroke();
		}
	},
	shape : function(){ /* extension */
		if(this.setProperties(true,true)){
			var c = this.context;
			if(!!this.fillStyle   && this.fillStyle  !=="none"){ c.fill();}
			if(!!this.strokeStyle && this.strokeStyle!=="none"){ c.stroke();}
		}
	},

	/* Canvas API functions (rect) */
	fillRect   : function(x,y,w,h){
		if(this.setProperties(true,false)){
			this.context.fillRect(x,y,w,h);
		}
	},
	strokeRect : function(x,y,w,h){
		if(this.setProperties(false,true)){
			this.context.strokeRect(x,y,w,h);
		}
	},
	shapeRect : function(x,y,w,h){
		if(this.setProperties(true,true)){
			var c = this.context;
			if(!!this.fillStyle   && this.fillStyle  !=="none"){ c.fillRect(x,y,w,h);}
			if(!!this.strokeStyle && this.strokeStyle!=="none"){ c.strokeRect(x,y,w,h);}
		}
	},

	/* extended functions */
	setLinePath : function(){
		var _args=arguments, _len=_args.length, len=_len-((_len|1)?1:2), a=[];
		for(var i=0;i<len;i+=2){ a[i>>1] = [_args[i],_args[i+1]];}
		this.context.beginPath();
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

	strokeLine : function(x1,y1,x2,y2){
		if(this.setProperties(false,true)){
			var c = this.context;
			c.beginPath();
			c.moveTo(x1,y1);
			c.lineTo(x2,y2);
			c.stroke();
		}
	},
	strokeDashedLine : function(x1,y1,x2,y2,sizes){
		this.strokeDashedLine = ((!!this.context.setLineDash) ?
			function(x1,y1,x2,y2,sizes){
				var c = this.context;
				if(this.setProperties(false,true)){
					c.beginPath();
					c.moveTo(x1,y1);
					c.lineTo(x2,y2);
					c.setLineDash(sizes);
					c.stroke();
					c.setLineDash([]);
				}
			}
		:
			function(x1,y1,x2,y2,sizes){
				if((sizes.length%2)===1){ sizes = sizes.concat(sizes);}
				var length = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
				var distance=0, phase=0, tilt=null, tilts=null;
				if(x1!==x2){
					tilt  = (y2-y1)/(x2-x1);
					tilts = tilt*tilt+1;
				}
				
				if(this.setProperties(false,true)){
					var c = this.context;
					c.beginPath();
					c.moveTo(x1, y1);
					while(distance<length){
						var px, py;
						if(tilt!==null){
							var a = Math.sqrt(distance*distance/tilts);
							px = x1+a;
							py = y1+tilt*a;
						}
						else{
							px = x1;
							py = y1+distance;
						}
						if((phase&1)===0){ c.moveTo(px, py);}
						else             { c.lineTo(px, py);}
						distance += sizes[phase];
						phase++;
						if(phase>=sizes.length){ phase=0;}
					}
					c.stroke();
				}
			}
		);
		this.strokeDashedLine(x1,y1,x2,y2,sizes);
	},
	strokeCross : function(cx,cy,l){
		if(this.setProperties(false,true)){
			var c = this.context;
			c.beginPath();
			c.moveTo(cx-l,cy-l);
			c.lineTo(cx+l,cy+l);
			c.moveTo(cx-l,cy+l);
			c.lineTo(cx+l,cy-l);
			c.stroke();
		}
	},

	/* extended functions (circle) */
	fillCircle : function(cx,cy,r){
		if(this.setProperties(true,false)){
			var c = this.context;
			c.beginPath();
			c.arc(cx,cy,r,0,_2PI,false);
			c.fill();
		}
	},
	strokeCircle : function(cx,cy,r){
		if(this.setProperties(false,true)){
			var c = this.context;
			c.beginPath();
			c.arc(cx,cy,r,0,_2PI,false);
			c.stroke();
		}
	},
	shapeCircle : function(cx,cy,r){
		if(this.setProperties(true,true)){
			var c = this.context;
			c.beginPath();
			c.arc(cx,cy,r,0,_2PI,false);
			if(!!this.fillStyle   && this.fillStyle  !=="none"){ c.fill();}
			if(!!this.strokeStyle && this.strokeStyle!=="none"){ c.stroke();}
		}
	},

	/* Canvas API functions (for text) */
	fillText : function(text,x,y){
		if(!!text && this.setProperties(true,false)){
			if(this.textBaseline==="candle-top"){
				y -= Candle.getoffsetHeight(text, this.font)*CTOP_OFFSET;
				this.context.textBaseline = "alphabetic";
			}
			this.context.fillText(text,x,y);
		}
	},

	/* Canvas API functions (for image) */
	drawImage : function(){
		if(!arguments[0]){ return;}
		this.context.drawImage.apply(this.context, arguments);
	}
	
});

})();
