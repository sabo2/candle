// Fire.js rev74

(function(){

// Campがないと追加できません
if(!window.Camp){ return;}

// 多重定義防止
if(!!window.Camp.Fire){ return;}

var _win = this,
	_doc = document,
	_ms = Math.sin,
	_mc = Math.cos,
	_2PI = 2*Math.PI,

	Camp = _win.Camp,
	textContent = {};

/* ------------ */
/*   共通関数   */
/* ------------ */
function _extend(obj, ads){
	for(var name in ads){ obj[name] = ads[name];}
}
function _extend_rc(obj, ads){
	/* xx.['aa-bb']をxx.[aa][bb]に切り分ける */
	for(var key in ads){
		var keys = key.split(/\-/), key0 = keys.shift(), key1 = keys.join('');
		if(key1 === ''){ continue;}

		if(key0!=='data'){
			if(ads[key]!=null){
				if(ads[key0]===void 0){ ads[key0] = {};}
				ads[key0][key1] = ads[key];
			}
		}
		else{
			for(var i=0;i<ads[key].length;i++){
				if(ads[key][i]!=null){
					if(ads[key0]   ===void 0){ ads[key0]    = [];}
					if(ads[key0][i]===void 0){ ads[key0][i] = {};}
					ads[key0][i][key1] = ads[key][i];
				}
			}
		}
	}

	for(var key in ads){
		if(typeof ads[key] === 'object'){
			if(!obj[key]){ obj[key] = (!(ads[key] instanceof Array) ? {} : []);}
			_extend_rc(obj[key], ads[key]);
		}
		else{ obj[key] = ads[key];}
	}
}

/* ------------------------ */
/*   CampFireオブジェクト   */
/* ------------------------ */
Camp.Fire = function(idname){
	Camp.Fire.dance(idname);
};

/* ------------------ */
/*   グラフ生成関数   */
/* ------------------ */
_extend( Camp.Fire, {

	JSON : {},

	/* -------------------- */
	/*   グラフを生成する   */
	/* -------------------- */
	danceAll : function(){
		var elements = _doc.getElementsByTagName('campfire');
		for(var i=0;i<elements.length;i++){ this.dance(elements[i].id, type);}
	},
	dance : function(idname, type){
		if(typeof idname === 'string'){
			this.draw(idname,type);
		}
		else if((typeof idname === 'object') && (idname instanceof Array)){
			for(var i=0;i<idname.length;i++){
				this.draw(idname[i],type);
			}
		}
	},
	/* alias */
	all             : function(){ this.danceAll();},
	initAllElements : function(){ this.danceAll();},
	init        : function(idname){ this.dance(idname);},
	initElement : function(idname){ this.dance(idname);},

	/* -------------------- */
	/*   グラフを描画する   */
	/* -------------------- */
	draw : function(idname, type){
		var json = this.JSON[idname];
		if(!json || !json.data){
			this.parseData(idname);
			json = this.JSON[idname];
		}
		if(!!type){ json.graph.type = type;}

		this.drawGraph(idname);
	},

	/* 入力されたデータを解析する */
	parseData : function(idname){
		var el = _doc.getElementById(idname);
		if(!el){ return;}

		/* テキストの中身を取得し、文字列を消去する */
		var text = textContent[idname];
		if(!text){
			text = (!!el.textContent ? el.textContent : el.innerText);
			textContent[idname] = text;
		}
		el.innerHTML = '';

		/* JSONオブジェクトを取得 */
		this.parseJSON(idname, el.getAttribute('include'));
	},

	/* テキストからJSONオブジェクトを取得する */
	parseJSON : function(idname, include){
		var text = textContent[idname];

		/* JSONオブジェクトの初期化 */
		var json = { main:{},graph:{},legend:{},xaxis:{},yaxis:{},data:[]};

		/* JSONオブジェクトの生成 */
		var jsonp = {};
		try     { jsonp = JSON.parse(text);}
		catch(e){ jsonp = eval("("+text+")");}

		/* includeファイルからデータをコピーする */
		if(!!include){
			var incs = include.split(/\s\,\s/);
			for(var i=0;i<incs.length;i++){
				var eli = _doc.getElementById(incs[i]);
				if(!eli){ continue;}

				var texti = (!!eli.textContent ? eli.textContent : eli.innerText);
				var jsoni = {};
				try     { jsoni = JSON.parse(texti);}
				catch(e){ jsoni = eval("("+texti+")");}
				_extend_rc(json, jsoni);
			}
		}

		_extend_rc(json, jsonp);

		/* json.idnameをセット */
		if(!json.idname){ json.idname = idname;}

		/* this.JSONオブジェクトに内容を登録 */
		this.JSON[idname] = json;
	},

	/* グラフを描画する */
	drawGraph : function(idname){
		var json = this.JSON[idname];

		if(!json || !json.data){ return;}
		json.graph.type = json.graph.type.toLowerCase();
		var fts = feature[json.graph.type];
		if(fts!==void 0){
			switch(fts[0]){
				case 'POINT': drawPointGraph(json); break;
				case 'LINE':  drawLineGraph(json);  break;
				case 'BAR':   drawBarGraph(json);   break;
				case 'AREA':  drawAreaGraph(json);  break;
				case 'DOT':   drawDotChart(json);   break;
			}
			drawLegend(json,fts);
		}
	}
});
// ratio, stack
var feature = {
	point         : ['POINT', false, false],
	pointratio    : ['POINT', true,  false],
	line          : ['LINE',  false, false],
	lineratio     : ['LINE',  true,  false],
	bar           : ['BAR',   false, false],
	barstack      : ['BAR',   false, true ],
	barstackratio : ['BAR',   true,  true ],
	area          : ['AREA',  false, true ],
	arearatio     : ['AREA',  true,  true ],
	dot           : ['DOT',   false, false],
	dotchart      : ['DOT',   false, false]
};

/* --------------------------------- */
/*   以下は描画関係関数。            */
/*     ※外部からはcallできません。  */
/* --------------------------------- */

/* ------------------------------ */
/*   項目ごとの正規化の値を取得   */
/* ------------------------------ */
/* stack:積み重ねグラフかどうか ratio:割合グラフかどうか     */
function normalizeData(json){
	var ratio = feature[json.graph.type][1];
	var stack = feature[json.graph.type][2];
	var space = json.graph.topspace;
	if(json.graph.type==='arearatio'){ space=0;}
	else if(json.graph.topspace === void 0){ space=0.06;}

	var xcount = json.xaxis.count;

	var total = [], max = 0;	// 各日付別の合計
	if(!stack && !ratio){
		for(var t=0;t<xcount;t++){
			for(var i=0;i<json.data.length;i++){
				if(json.data[i].display==='none'){ continue;}
				var val = json.data[i].value[t];
				if(val>max){ max=val;}
			}
		}
	}
	else{
		for(var t=0;t<xcount;t++){
			total[t] = 0;
			for(var i=0;i<json.data.length;i++){
				if(json.data[i].display==='none'){ continue;}
				var val = json.data[i].value[t];
				total[t] += (!isNaN(val) ? val : 0);
				if(!stack && val>max){ max=val;}
			}
			if(stack && total[t]>max){ max=total[t];}
		}
	}

	var normalize = [];
	if(!stack && ratio){
		/* グラフ上で最も上に描画されるものを取得する */
		var max_ratio=0.01, max_total=0;
		for(var t=0;t<xcount;t++){
			for(var i=0;i<json.data.length;i++){
				if(json.data[i].display==='none'){ continue;}
				var val = json.data[i].value[t];
				val = (!isNaN(val) ? val : 0);
				if(val/total[t]>max_ratio){ max_ratio=val/total[t];};
			}
		}
		for(var t=0;t<xcount;t++){ normalize[t]=total[t]*max_ratio*(1+space);}
	}
	else if(!ratio){
		for(var t=0;t<xcount;t++){ normalize[t]=max*(1+space);}
	}
	else{
		for(var t=0;t<xcount;t++){ normalize[t]=total[t];}
	}

	return normalize;
}

/* ---------------------- */
/*   有効な項目のみ取得   */
/* ---------------------- */
function parseInfo(json){
	var info = [], cnt = 0;
	var setValue = function(info1,key){
		if(info1[key]!==void 0){ return;}
		/* jsonはparseInfo関数のプロパティ(参照できる) */
		info1[key] = ((json.graph[key]!==void 0) ? json.graph[key] : '');
	};

	json.xaxis.count = 0;
	for(var i=0;i<json.data.length;i++){
		var vals = json.data[i].value;

		/* 空の系列は取得しない */
		if(!vals || vals.length===0 || json.data[i].display==='none'){ continue;}

		info[cnt] = json.data[i];
		setValue(info[cnt],'color');

		/* 折れ線グラフ用プロパティ */
		setValue(info[cnt],'line');
		/* マーカー表示用プロパティ */
		setValue(info[cnt],'marker');
		setValue(info[cnt],'edgecolor');

		/* 横軸のデータの数をカウントする */
		if(json.xaxis.count<vals.length){ json.xaxis.count=vals.length;}

		cnt++;
	}

	return info;
}

/* ------------------ */
/*   描画領域の設定   */
/* ------------------ */
function settingCanvas(json){
	// canvas描画部
	Camp(json.idname);
	var ctx = document.getElementById(json.idname).getContext("2d");
	ctx.changeSize(json.main.size[0], json.main.size[1]);
	ctx.clear();
	ctx.changeOrigin(0, 0);

	// レイヤー設定
	ctx.lineWidth = '1';
	ctx.setLayer('graph');
	var size = [json.graph.origin[0], json.graph.origin[1], json.graph.size[0], json.graph.size[1]];
	if(!json.graph.bgcolor){
		ctx.strokeRect.apply(ctx,size);
	}
	else{
		ctx.fillStyle = json.graph.bgcolor;
		ctx.shapeRect.apply(ctx,size);
	}

	return ctx;
}

/* ------------------ */
/*   ポイントグラフ   */
/* ------------------ */
function drawPointGraph(json){
	json.graph.line = 'none';
	drawLineGraph(json);
}

/* ---------------- */
/*   折れ線グラフ   */
/* ---------------- */
function drawLineGraph(json){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		ctx    = settingCanvas(json),
		info   = parseInfo(json),
		normalize = normalizeData(json);

	var xcount = json.xaxis.count;
	var mkpos = [], mwidth = WIDTH/xcount, moffset = mwidth/2;
	for(var t=0;t<xcount;t++){ mkpos[t] = [(LEFT+t*mwidth+moffset)|0];}

	// データ描画部
	for(var i=0;i<info.length;i++){
		var vals = info[i].value;

		// 描画する座標の所得
		for(var t=0;t<xcount;t++){
			if(!vals[t]){ vals[t]=0;}
			if(normalize[t]>0){ mkpos[t][1] = TOP + HEIGHT*(1-vals[t]/normalize[t]);}
			else              { mkpos[t][1] = (t>0 ? ypos[t-1] : TOP+HEIGHT);}
		}

		// 系列の色の設定
		var color = info[i].color;
		ctx.fillStyle   = (!!color ? color : 'black');
		ctx.strokeStyle = (!!color ? color : 'none');

		// 系列の描画
		if(info[i].line!=='none'){
			ctx.lineWidth = '2';
			ctx.beginPath();
			ctx.moveTo(mkpos[0][0], mkpos[0][1]);
			for(var t=1;t<xcount;t++){ ctx.lineTo(mkpos[t][0], mkpos[t][1]);}
			ctx.stroke();
		}

		// マーカーの描画
		var mk = info[i].marker;
		if(mk.indexOf("-shape")>=0){ ctx.strokeStyle = (!!info[i].edgecolor ? info[i].edgecolor : 'black');}
		drawMarker(mk, ctx, mkpos);
	}
}

/* ------------ */
/*   棒グラフ   */
/* ------------ */
function drawBarGraph(json){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		ctx    = settingCanvas(json),
		info   = parseInfo(json),
		normalize = normalizeData(json);

	var xcount = json.xaxis.count;
	var currentBase = [], xpos = [], mwidth = WIDTH/xcount, moffset = mwidth/2;
	for(var t=0;t<xcount;t++){
		currentBase[t]=0;
		xpos[t] = LEFT+t*mwidth+moffset;
	}
	var bwidth = mwidth*0.7/2;

	// データ描画部
	for(var i=0;i<info.length;i++){
		var vals = info[i].value, ypos=[], ypos_b=[];

		// 描画する座標の所得
		if(json.graph.type==='bar'){
			for(var t=0;t<xcount;t++){
				if(!vals[t]){ vals[t]=0;}
				ypos_b[t] = TOP+HEIGHT;
				if(normalize[t]>0){ ypos[t] = TOP + HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]);}
				else              { ypos[t] = (t>0 ? ypos[t-1]   : TOP+HEIGHT);}
			}
		}
		else{
			for(var t=0;t<xcount;t++){
				if(!vals[t]){ vals[t]=0;}
				if(normalize[t]>0){
					ypos_b[t] = TOP + HEIGHT*(1- currentBase[t]         /normalize[t]);
					ypos[t]   = TOP + HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]);
				}
				else{
					ypos_b[t] = (t>0 ? ypos_b[t-1] : TOP+HEIGHT);
					ypos[t]   = (t>0 ? ypos[t-1]   : TOP+HEIGHT);
				}
				currentBase[t] += vals[t];
			}
		}

		// 系列の色の設定
		var color = info[i].color;
		ctx.fillStyle = (!!color ? color : 'none');
		ctx.lineWidth = '1';
		ctx.strokeStyle   = 'black';

		// 系列の描画
		for(var t=0;t<xcount;t++){
			var x1=xpos[t]-bwidth, y1=ypos[t], x2=xpos[t]+bwidth, y2=ypos_b[t];
			ctx.setLinePath(x1,y1, x2,y1, x2,y2, x1,y2, true);
			ctx.shape();
		}
	}
}

/* ---------------------------------- */
/*   領域積み重ねグラフ描画ルーチン   */
/* ---------------------------------- */
function drawAreaGraph(json){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		ctx    = settingCanvas(json),
		info   = parseInfo(json),
		normalize = normalizeData(json);

	var xcount = json.xaxis.count;
	var currentBase = [], xpos = [], mwidth = WIDTH/(xcount-1);
	for(var t=0;t<xcount;t++){
		currentBase[t]=0;
		xpos[t] = LEFT + t*mwidth;
	}

	// データ描画部
	for(var i=0;i<info.length;i++){
		var vals = info[i].value, ypos_b=[], ypos=[];

		// 描画する座標の所得
		for(var t=0;t<xcount;t++){
			if(!vals[t]){ vals[t]=0;}
			if(normalize[t]>0){
				ypos_b[t] = TOP + HEIGHT*(1- currentBase[t]         /normalize[t]);
				ypos[t]   = TOP + HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]);
			}
			else{
				ypos_b[t] = (t>0 ? ypos_b[t-1] : TOP+HEIGHT);
				ypos[t]   = (t>0 ? ypos[t-1]   : TOP+HEIGHT);
			}
			currentBase[t] += vals[t];
		}

		// 系列の色の設定
		var color = info[i].color;
		ctx.strokeStyle = "black";
		ctx.fillStyle = (!!color ? color : 'none');

		// 系列の描画
		ctx.beginPath();
		ctx.moveTo(xpos[0], ypos_b[0]);
		for(var t=1;t<xcount   ;t++){ ctx.lineTo(xpos[t], ypos_b[t]);}
		for(var t=xcount-1;t>=1;t--){ ctx.lineTo(xpos[t], ypos[t]);}
		ctx.lineTo(xpos[0], ypos[0]);
		ctx.closePath();
		ctx.shape();
	}
}

/* ------------------------------ */
/*   ドットチャート描画ルーチン   */
/* ------------------------------ */
function drawDotChart(json){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		ctx    = settingCanvas(json),
		info   = parseInfo(json);

	var xcount = json.xaxis.count;
	var xpos = [], mwidth = WIDTH/xcount, moffset = mwidth/2;
	for(var t=0;t<xcount;t++){ xpos[t] = LEFT + t*mwidth + moffset;}

	var max_rsize = Math.min(mwidth, HEIGHT/info.length)*0.66;
	var max_val = 0;
	for(var i=0;i<info.length;i++){
		for(var t=0;t<xcount;t++){
			var val = Math.pow(info[i].value[t],0.5);
			if(val>max_val){ max_val = val;}
		}
	}

	// データ描画部
	for(var i=0;i<info.length;i++){
		var vals = info[i].value, rsize=[];
		var ypos = TOP+HEIGHT*((i+0.5)/info.length);

		// 描画する座標の所得
		for(var t=0;t<xcount;t++){
			if(!vals[t]){ vals[t]=0;}
			rsize[t] = max_rsize*(Math.pow(vals[t],0.5)/max_val);
		}

		// 系列の色の設定
		var color = info[i].color;
		ctx.fillStyle = (!!color ? color : 'none');
		ctx.strokeStyle = "black";
		ctx.lineWidth =1;

		// 系列の描画
		if(ctx.fillStyle!=='none'&&ctx.fillStyle!=='white'&&Camp.parse(ctx.fillStyle)!=='#ffffff'){
			for(var t=0;t<xcount;t++){ ctx.fillCircle(xpos[t], ypos, rsize[t]);}
		}
		else{
			for(var t=0;t<xcount;t++){ ctx.strokeCircle(xpos[t], ypos, rsize[t]);}
		}
	}
}

/* ---------------- */
/*   マーカー描画   */
/* ---------------- */
function drawMarker(markerInfo, ctx, mkpos){
	if(!markerInfo){ return;}
	var marker = markerInfo.split(/\s+/g).join('').split(/,/);
	var markerType = marker[0];
	var markerDraw = 'fill';
	var markerSize = (!!marker[1] ? parseInt(marker[1]) : 4);
	ctx.lineWidth  = (!!marker[2] ? parseInt(marker[2]) : 1);

	if(markerType==='none'){ return;}

	var markerTypeArray = markerType.split('-');
	if(markerTypeArray.length>1){
		markerType = markerTypeArray[0];
		markerDraw = markerTypeArray[1];
	}

	var generalShape = false;
	for(var t=0;t<mkpos.length;t++){
		var px=mkpos[t][0], py=mkpos[t][1];

		switch(markerType){
		case 'cross':
			ctx.strokeCross(px, py, markerSize);
			break;
		case 'plus':
			ctx.beginPath();
			ctx.moveTo(px-markerSize, py);
			ctx.lineTo(px+markerSize, py);
			ctx.moveTo(px, py-markerSize);
			ctx.lineTo(px, py+markerSize);
			ctx.stroke();
			break;
		case 'triangle':
			ctx.beginPath();
			ctx.moveTo(px+markerSize*_ms(0/3*Math.PI), py-markerSize*_mc(0/3*Math.PI));
			ctx.lineTo(px+markerSize*_ms(2/3*Math.PI), py-markerSize*_mc(2/3*Math.PI));
			ctx.lineTo(px+markerSize*_ms(4/3*Math.PI), py-markerSize*_mc(4/3*Math.PI));
			ctx.closePath();
			generalShape = true;
			break;
		case 'invtriangle':
			ctx.beginPath();
			ctx.moveTo(px+markerSize*_ms(0/3*Math.PI), py+markerSize*_mc(0/3*Math.PI));
			ctx.lineTo(px+markerSize*_ms(2/3*Math.PI), py+markerSize*_mc(2/3*Math.PI));
			ctx.lineTo(px+markerSize*_ms(4/3*Math.PI), py+markerSize*_mc(4/3*Math.PI));
			ctx.closePath();
			generalShape = true;
			break;
		case 'star':
			ctx.beginPath();
			ctx.moveTo(px, py-markerSize);
			for(var i=1;i<10;i++){
				var size = (!(i&1) ? markerSize : markerSize/2.2);
				ctx.lineTo(px+size*_ms((i/10)*_2PI), py-size*_mc((i/10)*_2PI));
			}
			ctx.closePath();
			generalShape = true;
			break;
		case 'diamond':
			ctx.setOffsetLinePath(px,py, 0,-markerSize, markerSize,0, 0,markerSize, -markerSize,0, true);
			generalShape = true;
			break;
		case 'square':
			switch(markerDraw){
				case 'fill'  : ctx.fillRect  (px-markerSize,py-markerSize, 2*markerSize,2*markerSize); break;
				case 'stroke': ctx.strokeRect(px-markerSize,py-markerSize, 2*markerSize,2*markerSize); break;
				case 'shape' : ctx.shapeRect (px-markerSize,py-markerSize, 2*markerSize,2*markerSize); break;
			}
			break;
		case 'oval':
			switch(markerDraw){
				case 'fill'  : ctx.fillCircle  (px, py, markerSize); break;
				case 'stroke': ctx.strokeCircle(px, py, markerSize); break;
				case 'shape' : ctx.shapeCircle (px, py, markerSize); break;
			}
			break;

		default:
			markerType = 'oval';
			markerDraw = 'fill';
			t--;
			continue;
			break;
		}

		if(generalShape){
			switch(markerDraw){
				case 'fill'  : ctx.fill  (); break;
				case 'stroke': ctx.stroke(); break;
				case 'shape' : ctx.shape (); break;
			}
		}
	}
}

/* ------------ */
/*   凡例描画   */
/* ------------ */
function drawLegend(json){
	var LEFT   = json.graph.origin[0] + json.graph.size[0] + 10,
		TOP    = json.graph.origin[1],
		ctx = document.getElementById(json.idname).getContext("2d"),
		info = parseInfo(json);

	if(feature[json.graph.type][2]){ info = info.reverse();}

	ctx.lineWidth = '1';
	ctx.setLayer('legend');
	ctx.setRendering('crispEdges');

	var textwidth = 0;
	for(var i=0;i<info.length;i++){
		Camp.ME.style.font = '12px sans-serif';
		Camp.ME.innerHTML = info[i].label;
		if(textwidth < Camp.ME.offsetWidth){ textwidth = Camp.ME.offsetWidth;}
	}

	/* 枠線 */
	ctx.fillStyle    = 'white';
	ctx.strokeStyle  = 'black';
	ctx.shapeRect(LEFT, TOP, 36+textwidth, 15*(info.length+1));

	/* 項目の描画 */
	ctx.textAlign    = 'left';
	ctx.textBaseline = 'middle';
	ctx.font         = '12px sans-serif';
	for(var i=0;i<info.length;i++){
		var color = info[i].color;
		ctx.fillStyle = (!!color ? color : 'none');
		// ctx.strokeStyle = 'black';
		ctx.shapeRect(LEFT+10,TOP+15*i+10,12,12);

		ctx.fillStyle = 'black';
		ctx.fillText(info[i].label, LEFT+26, TOP+15*(i+1));
	}
}

	/* ----------------------------- */
	/* CampFire関連DOM/CSSデータ設定 */
	/* ----------------------------- */
	var text = [];
	text.push("campfire { display: block; }\n");
	text.push("cdatalist { display: none; }\n");
	document.write('<style type="text/css" rel="stylesheet">');
	document.write(text.join(''));
	document.write('</style>');

	// IE用ハック
	var _IE = !!(window.attachEvent && !window.opera);
	if(_IE){
		_doc.createElement('campfire');
		_doc.createElement('cdatalist');
	}

})();
