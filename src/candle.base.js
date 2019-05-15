// candle.base.js

let _counter = -1;

/* ------------------- */
/*  WrapperBaseクラス  */
/* ------------------- */
export default class WrapperBase {
	constructor(parent){
		// canvasに存在するプロパティ＆デフォルト値
		this.fillStyle    = 'black';
		this.strokeStyle  = 'black';
		this.lineWidth    = 1;
		this.font         = '14px system';
		this.textAlign    = 'center';
		this.textBaseline = 'middle';
		this.canvas = parent;	// 親エレメントとなるdivエレメント

		// variables for internal
		this.canvasid = "_candle_"+(++_counter);
		this.child    = null;	// 親エレメントの直下にあるエレメント

		this.enableTextLengthWA = false;

		this.canvas.getContext = (type) => this;

		this.use = {};
	}
	init(){
		this.initElement();
		this.initFunction();
		this.initLayer();
	}

	/* Initialize functions */
	/* initElement : function(){}, (virtual) */
	/* initFunction : function(){}, (virtual) */
	/* initLayer : function(){}, (virtual) */

	/* layer functions */
	/* setLayer : function(){}, (virtual) */

	/* property functions */
	/* setRendering : function(){}, (virtual) */

	/* Canvas API functions (rect) */
	rectcenter      (cx,cy,bw,bh){ this.rect      (cx-bw,cy-bh,2*bw,2*bh);}
	fillRectCenter  (cx,cy,bw,bh){ this.fillRect  (cx-bw,cy-bh,2*bw,2*bh);}
	strokeRectCenter(cx,cy,bw,bh){ this.strokeRect(cx-bw,cy-bh,2*bw,2*bh);}
	shapeRectCenter (cx,cy,bw,bh){ this.shapeRect (cx-bw,cy-bh,2*bw,2*bh);}

	/* VectorID Functions */
	vhide(){}
}
