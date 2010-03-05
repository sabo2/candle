// Fire.js rev80

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
	textContent = {},
	basefont = '12px "MS PGothic",Arial,sans-serif';

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
Camp.Fire = function(idname, forceDrawing){
	Camp.Fire.dance(idname, forceDrawing);
};

/* ------------------ */
/*   グラフ生成関数   */
/* ------------------ */
_extend( Camp.Fire, {

	JSON : {},

	/* -------------------- */
	/*   グラフを生成する   */
	/* -------------------- */
	danceAll : function(forceDrawing){
		var elements = _doc.getElementsByTagName('campfire');
		for(var i=0;i<elements.length;i++){ this.dance(elements[i].id, forceDrawing);}
	},
	dance : function(idname, forceDrawing){
		if(typeof idname === 'string'){
			this.draw(idname, forceDrawing);
		}
		else if((typeof idname === 'object') && (idname instanceof Array)){
			for(var i=0;i<idname.length;i++){
				this.draw(idname[i], forceDrawing);
			}
		}
	},
	/* alias */
	all             : function(){ this.danceAll(false);},
	initAllElements : function(){ this.danceAll(true); },
	init        : function(idname){ this.dance(idname, true);},
	initElement : function(idname){ this.dance(idname, true);},

	/* -------------------- */
	/*   グラフを描画する   */
	/* -------------------- */
	draw : function(idname, forceDrawing){
		var json = this.JSON[idname];
		if(!json || !json.data){
			this.parseData(idname);
			json = this.JSON[idname];
		}
		else if(!forceDrawing){ return;}

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
		switch(json.graph.type){
			case 'line':  drawLineGraph(json);  break;
			case 'bar':   drawBarGraph(json);   break;
			case 'area':  drawAreaGraph(json);  break;
			case 'dotchart':
			case 'dot':   drawDotChart(json);   break;
			default: return;
		}
		drawLegend(json);
	}
});

/* --------------------------------- */
/*   以下は描画関係関数。            */
/*     ※外部からはcallできません。  */
/* --------------------------------- */

/* ------------------------------ */
/*   項目ごとの正規化の値を取得   */
/* ------------------------------ */
/* stack:積み重ねグラフかどうか ratio:割合グラフかどうか     */
function normalizeData(json, info){
	var stack = !!json.graph.stacked;
	var space = (((json.graph.padding     !== void 0) &&
				  (json.graph.padding.top !== void 0)) ? json.graph.padding.top : 0.06);
	var xcount = json.xaxis.count;
	var HEIGHT = json.graph.size[1];
	var TOP    = json.graph.origin[1];
	var topval = 1;
	for(var i=0;i<info.length;i++){
		info[i].ypos  = [];
		info[i].yposb = [];
	}

	/* グラフの上限になる値の設定 */
	if(!!json.yaxis && !!json.yaxis.range){
		topval = json.yaxis.range[1];
	}
	else if(stack && (json.yaxis.scale === 'ratio')){
		topval=1; space=0;
	}
	else if(stack){
		/* 全データ中最大の合計値を取得 */
		var max = 0;
		for(var t=0;t<xcount;t++){
			var total=0;
			for(var i=0;i<info.length;i++){ if(!isNaN(info[i].value[t])){ total+=info[i].value[t];} }
			if(total>max){ max = total;}
		}
		topval=max*(1+space);
	}
	else{
		/* 全データ中最大の値を取得 */
		var max = 0;
		for(var t=0;t<xcount;t++){ for(var i=0;i<info.length;i++){
			if(!isNaN(info[i].value[t]) && info[i].value[t]>max){ max=info[i].value[t];}
		}}
		topval=max*(1+space);
	}

	for(var t=0;t<xcount;t++){
		var currentBase = 0;
		for(var i=0;i<info.length;i++){
			var val = (!isNaN(info[i].value[t]) ? info[i].value[t] : 0);
			if(topval>0){
				info[i].yposb[t] = TOP+HEIGHT*(1- currentBase     /topval);
				info[i].ypos[t]  = TOP+HEIGHT*(1-(currentBase+val)/topval);
			}
			else{
				info[i].yposb[t] = (t>0 ? info[i].yposb[t-1] : TOP+HEIGHT);
				info[i].ypos[t]  = (t>0 ? info[i].ypos[t-1]  : TOP+HEIGHT);
			}
			if(stack){ currentBase += val;}
		}
	}

	json.yaxis.range = [0, topval];
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

		/* 元データのindex位置を記憶しておく */
		info[cnt].source = i;

		cnt++;
	}

	/* yaxis.scaleをmanageする */
	json.yaxis.scale = ((json.yaxis.scale !== void 0) ? json.yaxis.scale.toLowerCase() : '');
	if     (json.yaxis.scale==='logarithm') { json.yaxis.scale = 'log';}
	else if(json.yaxis.scale==='percent')   { json.yaxis.scale = 'ratio';}
	else if(json.yaxis.scale==='percentage'){ json.yaxis.scale = 'ratio';}

	/* 割合グラフの場合は割合に変換 */
	if(json.yaxis.scale === 'ratio'){
		for(var t=0;t<json.xaxis.count;t++){
			var total=0;
			for(var i=0;i<info.length;i++){ total += (!isNaN(info[i].value[t]) ? info[i].value[t] : 0);}
			for(var i=0;i<info.length;i++){ info[i].value[t] = (!isNaN(info[i].value[t]) ? info[i].value[t]/total : null); }
		}
	}
	/* 対数グラフの場合は対数に変換 */
	else if(json.yaxis.scale === 'log'){
		for(var t=0;t<json.xaxis.count;t++){
			for(var i=0;i<info.length;i++){
				var val = info[i].value[t];
				info[i].value[t] = ((!isNaN(val) && val>0) ? Math.log(val)*Math.LOG10E : 0);
			}
		}
	}

	return info;
}

/* ------------------ */
/*   描画領域の設定   */
/* ------------------ */
function settingCanvas(json,info){
	/* canvas描画部 */
	Camp(json.idname);
	var ctx = document.getElementById(json.idname).getContext("2d");
	ctx.changeSize(json.main.size[0], json.main.size[1]);
	ctx.clear();
	ctx.changeOrigin(0, 0);
	ctx.lineWidth = '1';
	
	/* レイヤーの順番を設定 */
	ctx.setLayer('graphbase');
	ctx.setLayer('xaxis');
	ctx.setLayer('yaxis');
	ctx.setLayer('graph');

	/* graphbaseレイヤー設定 */
	ctx.setLayer('graphbase');
	ctx.setRendering('crispEdges');
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

/* ---------------- */
/*   折れ線グラフ   */
/* ---------------- */
function drawLineGraph(json){
	var WIDTH  = json.graph.size[0],
		LEFT   = json.graph.origin[0],
		info   = parseInfo(json),
		ctx    = settingCanvas(json,info);

	normalizeData(json,info);

	var xcount = json.xaxis.count;
	var xpos = [], mkpos = [], mwidth = WIDTH/xcount, moffset = mwidth/2;
	for(var t=0;t<xcount;t++){
		xpos[t]  = (LEFT+t*mwidth+moffset)|0;
		mkpos[t] = [xpos[t]];
	}

	// 軸の描画
	drawXaxis(json,info,ctx,xpos);
	drawYaxis(json,info,ctx);

	// データ描画部
	ctx.setLayer('graph');
	for(var i=0;i<info.length;i++){
		var ypos = info[i].ypos;

		// 描画する座標の所得
		for(var t=0;t<xcount;t++){ mkpos[t][1] = ypos[t];}

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
		LEFT   = json.graph.origin[0],
		info   = parseInfo(json),
		ctx    = settingCanvas(json,info);

	normalizeData(json,info);

	var xcount = json.xaxis.count;
	var xpos = [], mwidth = WIDTH/xcount, moffset = mwidth/2;
	for(var t=0;t<xcount;t++){ xpos[t] = LEFT+t*mwidth+moffset;}
	var bwidth = mwidth*0.7/2;

	// 軸の描画
	drawXaxis(json,info,ctx,xpos);
	drawYaxis(json,info,ctx);

	// データ描画部
	ctx.setLayer('graph');
	for(var i=0;i<info.length;i++){
		var ypos = info[i].ypos, ypos_b = info[i].yposb;

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
		LEFT   = json.graph.origin[0],
		info   = parseInfo(json),
		ctx    = settingCanvas(json,info);

	normalizeData(json,info);

	var xcount = json.xaxis.count;
	var xpos = [], mwidth = WIDTH/(xcount-1);
	for(var t=0;t<xcount;t++){ xpos[t] = LEFT + t*mwidth;}

	// 軸の描画
	drawXaxis(json,info,ctx,xpos);
	drawYaxis(json,info,ctx);

	// データ描画部
	ctx.setLayer('graph');
	for(var i=0;i<info.length;i++){
		var ypos = info[i].ypos, ypos_b = info[i].yposb;

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
		info   = parseInfo(json),
		ctx    = settingCanvas(json,info);

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
	ctx.setLayer('graph');
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

/* ----------- */
/*   X軸描画   */
/* ----------- */
function drawXaxis(json, info, ctx, xpos){
	if(!json.xaxis){ return;}

	ctx.setLayer('xaxis');
	ctx.setRendering('crispEdges');

	var TOP = json.graph.origin[1], BOTTOM = TOP + json.graph.size[1],
		LEFT = json.graph.origin[0], RIGHT = LEFT + json.graph.size[0];

	/* X軸の補助線の描画 */
	if((json.xaxis.line !== void 0) && (json.xaxis.line !== 'none')){
		ctx.strokeStyle = ((json.xaxis.linecolor !== void 0) ? json.xaxis.linecolor : 'silver');
		for(var t=0;t<json.xaxis.count;t++){
			if(RIGHT-xpos[t]<2 || xpos[t]-LEFT<2){ continue;} /* 外枠に近すぎ */
			ctx.strokeLine(xpos[t], TOP, xpos[t], BOTTOM);
			if(json.xaxis.line === 'dashed'){ ctx.setDashSize(4);}
		}
	}

	/* X軸の目盛りマークの描画 */
	if((json.xaxis.tick === void 0) && (json.xaxis.tick !== 'none')){
		ctx.strokeStyle = ((json.xaxis.tickcolor !== void 0) ? json.xaxis.tickcolor : 'black');
		for(var t=0;t<json.xaxis.count;t++){
			ctx.strokeLine(xpos[t], BOTTOM-5, xpos[t], BOTTOM+5);
		}
	}

	/* X軸の目盛りの値の描画 */
	if(!!json.xaxis.item){
		ctx.fillStyle = 'black';
		ctx.textAlign    = 'center';
		ctx.textBaseline = 'top';
		ctx.font         = basefont;
		for(var t=0;t<json.xaxis.count;t++){
			var label = ((!!json.xaxis.item[t]) ? json.xaxis.item[t] : '');
			if(label){ ctx.fillText(label, xpos[t], BOTTOM+10);}
		}
	}
}

/* ----------- */
/*   Y軸描画   */
/* ----------- */
function drawYaxis(json, info, ctx){
	if(!json.yaxis){ return;}

	ctx.setLayer('yaxis');
	ctx.setRendering('crispEdges');

	var LEFT = json.graph.origin[0], RIGHT = LEFT + json.graph.size[0],
		TOP = json.graph.origin[1], HEIGHT = json.graph.size[1];

	/* Y補助線の間隔を計算する */
	var ylabel = estimateAuxLine(json);

	/* Y軸の補助線の描画 */
	if((json.yaxis.line === void 0) && (json.yaxis.line !== 'none')){
		ctx.strokeStyle = ((json.yaxis.linecolor !== void 0) ? json.yaxis.linecolor : 'silver');
		for(var i=0;i<ylabel.length;i++){
			if(TOP+HEIGHT-ylabel[i].ypos<2 || ylabel[i].ypos-TOP<2){ continue;} /* 外枠に近すぎ */
			ctx.strokeLine(LEFT, ylabel[i].ypos, RIGHT, ylabel[i].ypos);
			if(json.yaxis.line === 'dashed'){ ctx.setDashSize(4);}
		}
	}

	/* Y軸の目盛りマークの描画 */
	if((json.yaxis.tick === void 0) && (json.yaxis.tick !== 'none')){
		ctx.strokeStyle = ((json.yaxis.tickcolor !== void 0) ? json.yaxis.tickcolor : 'black');
		for(var i=0;i<ylabel.length;i++){
			if(TOP+HEIGHT-ylabel[i].ypos<-1 || ylabel[i].ypos-TOP<-1){ continue;} /* 外枠オーバー */
			ctx.strokeLine(LEFT-5,  ylabel[i].ypos, LEFT+5,  ylabel[i].ypos);
			if(json.yaxis.scale != 'log'){ ctx.strokeLine(RIGHT-5, ylabel[i].ypos, RIGHT+5, ylabel[i].ypos);}
		}
	}

	/* Y軸の目盛りの値の描画 */
	if(true){
		ctx.fillStyle = 'black';
		ctx.textAlign    = 'right';
		ctx.textBaseline = 'middle';
		ctx.font         = basefont;
		for(var i=0;i<ylabel.length;i++){
			if(TOP+HEIGHT-ylabel[i].ypos<-1 || ylabel[i].ypos-TOP<-1){ continue;} /* 外枠オーバー */
			var label = ylabel[i].item;
			if(label){ ctx.fillText(label, LEFT-10, ylabel[i].ypos);}
		}
	}
}

function estimateAuxLine(json){
	var LEFT = json.graph.origin[0], RIGHT = LEFT + json.graph.size[0],
		TOP = json.graph.origin[1], HEIGHT = json.graph.size[1],
		minval = json.yaxis.range[0], topval = json.yaxis.range[1], dist = topval;

	var ylabel= [], i=0, pf=[1,2,5], digit=Math.ceil(Math.log(topval-minval)*Math.LOG10E+1);
	var ydata = [];
	if(json.yaxis.scale != 'log'){
		if(json.yaxis.scale === 'ratio' && topval>0.98){ dist = 0.1;}
		else if(!json.yaxis.dist){
			while(dist>0.01){
				dist = (pf[i] * Math.pow(10,digit))|0;
				if(((topval-minval)/dist)>5){ break;}
				i--; if(i<0){ i=2; digit--;}
			}
		}
		else{ dist = json.yaxis.dist;}

		i=0;
		for(var n=0;n<topval;n+=dist){ ydata[i]=n; i++;}

		/* Y補助線を描画する場所を推測する */
		for(var i=0;i<ydata.length;i++){
			ylabel[i] = {item:ydata[i]};
			if(json.yaxis.scale === 'ratio'){ ylabel[i] = {item:''+(Math.ceil(99.9*ydata[i])|0)+'%'};}
			else{ ylabel[i] = {item:(ydata[i]|0)};}
			ylabel[i].ypos = (TOP+HEIGHT*(1-(ydata[i]-minval)/(topval-minval)));
		}
	}
	else{
		digit = Math.ceil(topval); pf=[1,2,3,4,5,6,7,8,9];
		while(dist>0.99){
			dist = Math.ceil((pf[i] * Math.pow(10,digit))-0.1)|0;
			ydata[digit*pf.length+i] = dist;
			i--; if(i<0){ i=pf.length-1; digit--;}
		}

		/* Y補助線を描画する場所を推測する */
		for(var i=0;i<ydata.length;i++){
			var col = i%pf.length;
			ylabel[i] = {item:((col==0||col==1||col==4) ? ydata[i]|0 : '')};
			ylabel[i].ypos = (TOP+HEIGHT*(1-(Math.log(ydata[i])*Math.LOG10E-minval)/(topval-minval)));
		}
	}

	return ylabel;
}

/* ------------ */
/*   凡例描画   */
/* ------------ */
function drawLegend(json){
	var LEFT   = json.graph.origin[0] + json.graph.size[0] + 10,
		TOP    = json.graph.origin[1],
		ctx = document.getElementById(json.idname).getContext("2d"),
		info = parseInfo(json);

	if(!!json.graph.stacked){ info = info.reverse();}

	ctx.lineWidth = '1';
	ctx.setLayer('legend');
	ctx.setRendering('crispEdges');

	var textwidth = 0;
	for(var i=0;i<info.length;i++){
		Camp.ME.style.font = basefont;
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
	ctx.font         = basefont;
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
