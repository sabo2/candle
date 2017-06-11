// candle.base.js
/* global Candle:false */
 
/* ------------------- */
/*  WrapperBaseクラス  */
/* ------------------- */
Candle.wrapperbase = {

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

		this.enableTextLengthWA = false;

		this.initElement();
		this.initFunction();
		this.initLayer();

		var self = this;
		this.canvas.getContext = function(type){ return self;};
	},

	/* Initialize functions */
	/* initElement : function(){}, (virtual) */
	/* initFunction : function(){}, (virtual) */
	/* initLayer : function(){}, (virtual) */

	/* layer functions */
	/* setLayer : function(){}, (virtual) */

	/* property functions */
	/* setRendering : function(){}, (virtual) */

	/* Canvas API functions (rect) */
	rectcenter       : function(cx,cy,bw,bh){ this.rect      (cx-bw,cy-bh,2*bw,2*bh);},
	fillRectCenter   : function(cx,cy,bw,bh){ this.fillRect  (cx-bw,cy-bh,2*bw,2*bh);},
	strokeRectCenter : function(cx,cy,bw,bh){ this.strokeRect(cx-bw,cy-bh,2*bw,2*bh);},
	shapeRectCenter  : function(cx,cy,bw,bh){ this.shapeRect (cx-bw,cy-bh,2*bw,2*bh);},

	/* VectorID Functions */
	vhide : function(){}
};
