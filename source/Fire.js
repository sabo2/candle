// Fire.js rev53

(function(){

// Camp���Ȃ��ƒǉ��ł��܂���
if(!window.Camp){ return;}

// ���d��`�h�~
if(!!window.Camp.Fire){ return;}

var _win = this,
	_doc = document,
	_mf = Math.floor,
	_ms = Math.sin,
	_mc = Math.cos,
	_2PI = 2*Math.PI,
	Camp = _win.Camp,
	textContent = {};

/* ------------ */
/*   ���ʊ֐�   */
/* ------------ */
function _extend(obj, ads){
	for(var name in ads){ obj[name] = ads[name];}
}

/* ------------------------ */
/*   CampFire�I�u�W�F�N�g   */
/* ------------------------ */
Camp.Fire = function(idname){
	Camp.Fire.dance(idname);
};

/* ------------------ */
/*   �O���t�����֐�   */
/* ------------------ */
_extend( Camp.Fire, {

	JSON : {},

	/* -------------------- */
	/*   �O���t�𐶐�����   */
	/* -------------------- */
	dance : function(idname, type){
		if(typeof idname === 'string'){
			this.generate(idname,type);
		}
		else if((typeof idname === 'object') && (idname instanceof Array)){
			for(var i=0;i<idname.length;i++){
				this.generate(idname[i],type);
			}
		}
	},
	generate : function(idname, type){
		var el = document.getElementById(idname);
		if(!el){ return;}

		/* �e�L�X�g�̒��g���擾���A��������������� */
		var text = textContent[idname];
		if(!text){
			text = (!!el.textContent ? el.textContent : el.innerText);
			textContent[idname] = text;
		}
		el.innerHTML = '';

		/* JSON�I�u�W�F�N�g�̐��� */
		var json = {};
		try     { json = JSON.parse(text);}
		catch(e){ json = eval("("+text+")");}

		if(!json.data){ json.data = {};}
		/* data-templete����f�[�^���R�s�[���� */
		if(!!json['data-templete']){
			var el2 = document.getElementById(json['data-templete']);
			if(!!el2){
				var text2 = (!!el2.textContent ? el2.textContent : el2.innerText);
				var json2 = {};
				try     { json2 = JSON.parse(text2);}
				catch(e){ json2 = eval("("+text2+")");}
				json.data = json2;
			}
		}
		/* data-xxx�̃f�[�^��json.data�Ɉڂ��ւ��� */
		for(var origkey in json){
			if(origkey.match(/data\-(\w+)/) && RegExp.$1!=='templete'){
				var key = RegExp.$1;
				for(var i=0;i<json.data.length;i++){
					if(json[origkey][i]!=null){ json.data[i][key] = json[origkey][i];}
				}
			}
		}

		/* ��̌n���display:none��ݒ� */
		for(var i=0;i<json.data.length;i++){
			if(!json.data[i].value){ json.data[i].display='none';}
		}

		if(!!type){ json.main.type = type;}
		this.JSON[idname] = json;

		/* �O���t��`�悷�� */
		this.redraw(idname);
	},
	redraw : function(idname){
		var json = this.JSON[idname];

		if(!json.data){ return;}
		switch(json.main.type.toLowerCase()){
			case 'point':         drawPointGraph(idname,json, false); break;
			case 'pointratio':    drawPointGraph(idname,json, true ); break;
			case 'line':          drawLineGraph(idname, json, false); break;
			case 'lineratio':     drawLineGraph(idname, json, true ); break;
			case 'bar':           drawBarGraph (idname, json, false); break;
			case 'barstack':      drawBarGraph (idname, json, false); break;
			case 'barstackratio': drawBarGraph (idname, json, true ); break;
			case 'area':          drawAreaGraph(idname, json, false); break;
			case 'arearatio':     drawAreaGraph(idname, json, true ); break;
			case 'dot': case 'dotchart': drawDotChart (idname, json); break;
		}
	}
});

/* --------------------------------- */
/*   �ȉ��͕`��֌W�֐��B            */
/*     ���O�������call�ł��܂���B  */
/* --------------------------------- */

/* ------------------------------ */
/*   ���ڂ��Ƃ̐��K���̒l���擾   */
/* ------------------------------ */
/* stack:�ςݏd�˃O���t���ǂ��� ratio:�����O���t���ǂ���     */
function normalizeData(json, stack, ratio){
	var space = json.graph['top-space'];
	if(json.main.type.toLowerCase()==='arearatio'){ space=0;}
	else if(json.graph['top-space'] === void 0){ space=0.06;}

	var total = [], max = 0;	// �e���t�ʂ̍��v
	if(!stack && !ratio){
		for(var t=0;t<json.xlabel.length;t++){
			for(var i=0;i<json.data.length;i++){
				if(json.data[i].display==='none'){ continue;}
				var val = json.data[i].value[t];
				if(val>max){ max=val;}
			}
		}
	}
	else{
		for(var t=0;t<json.xlabel.length;t++){
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
		/* �O���t��ōł���ɕ`�悳�����̂��擾���� */
		var max_ratio=0.01, max_total=0;
		for(var t=0;t<json.xlabel.length;t++){
			for(var i=0;i<json.data.length;i++){
				if(json.data[i].display==='none'){ continue;}
				var val = json.data[i].value[t];
				val = (!isNaN(val) ? val : 0);
				if(val/total[t]>max_ratio){ max_ratio=val/total[t];};
			}
		}
		for(var t=0;t<json.xlabel.length;t++){ normalize[t]=total[t]*max_ratio*(1+space);}
	}
	else if(!ratio){
		max = _mf(max*(1+space));
		for(var t=0;t<json.xlabel.length;t++){ normalize[t]=max;}
	}
	else{
		for(var t=0;t<json.xlabel.length;t++){ normalize[t]=total[t];}
	}

	return normalize;
}

/* ------------------ */
/*   �`��̈�̐ݒ�   */
/* ------------------ */
function settingCanvas(idname, json){
	// canvas�`�敔
	Camp(idname);
	var ctx = document.getElementById(idname).getContext("2d");
	ctx.changeSize(json.main.size[0], json.main.size[1]);
	ctx.clear();
	ctx.changeOrigin(0, 0);

	// ���C���[�ݒ�
	ctx.lineWidth = '1';
	ctx.setLayer('graph');
	var size = [json.graph.origin[0], json.graph.origin[1], json.graph.size[0], json.graph.size[1]];
	if(!json.graph.bgcolor){
		ctx.strokeRect.apply(ctx,size);
	}
	else{
		// ����addVectorElement�֐��g���͔̂���...
		ctx.fillStyle = json.graph.bgcolor;
		ctx.addVectorElement(true,true,true,size);
	}

	return ctx;
}

/* ------------------ */
/*   �|�C���g�O���t   */
/* ------------------ */
function drawPointGraph(idname, json, ratio){
	json.graph.line = 'none';
	drawLineGraph(idname, json, ratio);
}

/* ---------------- */
/*   �܂���O���t   */
/* ---------------- */
function drawLineGraph(idname, json, ratio){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		xlabel = json.xlabel,
		ctx    = settingCanvas(idname, json),
		normalize = normalizeData(json,false,ratio);

	var mkpos = [], mwidth = WIDTH/xlabel.length, moffset = mwidth/2;
	for(var t=0;t<xlabel.length;t++){ mkpos[t] = [(LEFT+t*mwidth+moffset)|0];}

	// �f�[�^�`�敔
	for(var i=0;i<json.data.length;i++){
		var info = json.data[i], vals = info.value;
		if(!vals || vals.length===0 || info.display==='none'){ continue;}

		// �`�悷����W�̏���
		for(var t=0;t<xlabel.length;t++){
			if(!vals[t]){ vals[t]=0;}
			if(normalize[t]>0){ mkpos[t][1] = TOP+_mf(HEIGHT*(1-vals[t]/normalize[t]));}
			else              { mkpos[t][1] = (t>0 ? ypos[t-1] : TOP+HEIGHT);}
		}

		// �n��̐F�̐ݒ�
		var color = (!!info.color ? info.color : '');
		ctx.fillStyle   = (!!color ? color : 'black');
		ctx.strokeStyle = (!!color ? color : 'none');

		// �n��̕`��
		if((!info.line || info.line!=='none') && (!json.graph.line || !json.graph.line==='none')){
			ctx.lineWidth = '2';
			ctx.beginPath();
			ctx.moveTo(mkpos[0][0], mkpos[0][1]);
			for(var t=1;t<xlabel.length;t++){ ctx.lineTo(mkpos[t][0], mkpos[t][1]);}
			ctx.stroke();
		}

		// �}�[�J�[�̕`��
		var mk = ((info.marker!==void 0) ? info.marker : json.graph.marker);
		if(mk.indexOf("-shape")>=0){ ctx.strokeStyle = (!!info['edge-color'] ? info['edge-color'] : 'black');}
		drawMarker(mk, ctx, mkpos);
	}
}

/* ------------ */
/*   �_�O���t   */
/* ------------ */
function drawBarGraph(idname, json, ratio){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		xlabel = json.xlabel,
		ctx    = settingCanvas(idname, json),
		normalize = normalizeData(json,(json.main.type.toLowerCase()!=='bar'),ratio);

	var currentBase = [], xpos = [], mwidth = WIDTH/xlabel.length, moffset = mwidth/2;
	for(var t=0;t<xlabel.length;t++){
		currentBase[t]=0;
		xpos[t] = _mf(LEFT+t*mwidth+moffset);
	}
	var bwidth = mwidth*0.7/2;
	var type = json.main.type.toLowerCase();

	// �f�[�^�`�敔
	for(var i=0;i<json.data.length;i++){
		var info = json.data[i], vals = info.value, ypos=[], ypos_b=[];
		if(!vals || vals.length===0 || info.display==='none'){ continue;}

		// �`�悷����W�̏���
		if(type==='bar'){
			for(var t=0;t<xlabel.length;t++){
				if(!vals[t]){ vals[t]=0;}
				ypos_b[t] = TOP+HEIGHT;
				if(normalize[t]>0){ ypos[t] = TOP+_mf(HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]));}
				else              { ypos[t] = (t>0 ? ypos[t-1]   : TOP+HEIGHT);}
			}
		}
		else{
			for(var t=0;t<xlabel.length;t++){
				if(!vals[t]){ vals[t]=0;}
				if(normalize[t]>0){
					ypos_b[t] = TOP+_mf(HEIGHT*(1- currentBase[t]         /normalize[t]));
					ypos[t]   = TOP+_mf(HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]));
				}
				else{
					ypos_b[t] = (t>0 ? ypos_b[t-1] : TOP+HEIGHT);
					ypos[t]   = (t>0 ? ypos[t-1]   : TOP+HEIGHT);
				}
				currentBase[t] += vals[t];
			}
		}

		// �n��̐F�̐ݒ�
		var color = (!!info.color ? info.color : '');
		ctx.fillStyle = (!!color ? color : 'none');
		ctx.lineWidth = '1';
		ctx.strokeStyle   = 'black';

		// �n��̕`��
		for(var t=0;t<xlabel.length;t++){
			var x1=_mf(xpos[t]-bwidth), y1=_mf(ypos[t]), x2=_mf(xpos[t]+bwidth), y2=_mf(ypos_b[t]);
			ctx.setLinePath(x1,y1, x2,y1, x2,y2, x1,y2, true);
			ctx.shape();
		}
	}
}

/* ---------------------------------- */
/*   �̈�ςݏd�˃O���t�`�惋�[�`��   */
/* ---------------------------------- */
function drawAreaGraph(idname, json, ratio){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		xlabel = json.xlabel,
		ctx    = settingCanvas(idname, json),
		normalize = normalizeData(json,true,ratio);

	var currentBase = [], xpos = [], mwidth = WIDTH/(xlabel.length-1);
	for(var t=0;t<xlabel.length;t++){
		currentBase[t]=0;
		xpos[t] = _mf(LEFT+t*mwidth);
	}

	// �f�[�^�`�敔
	for(var i=0;i<json.data.length;i++){
		var info = json.data[i], vals = info.value, ypos_b=[], ypos=[];
		if(!vals || vals.length===0 || info.display==='none'){ continue;}

		// �`�悷����W�̏���
		for(var t=0;t<xlabel.length;t++){
			if(!vals[t]){ vals[t]=0;}
			if(normalize[t]>0){
				ypos_b[t] = TOP+_mf(HEIGHT*(1- currentBase[t]         /normalize[t]));
				ypos[t]   = TOP+_mf(HEIGHT*(1-(currentBase[t]+vals[t])/normalize[t]));
			}
			else{
				ypos_b[t] = (t>0 ? ypos_b[t-1] : TOP+HEIGHT);
				ypos[t]   = (t>0 ? ypos[t-1]   : TOP+HEIGHT);
			}
			currentBase[t] += vals[t];
		}

		// �n��̐F�̐ݒ�
		var color = (!!info.color ? info.color : '');
		ctx.strokeStyle = "black";
		ctx.fillStyle = (!!color ? color : 'none');

		// �n��̕`��
		ctx.beginPath();
		ctx.moveTo(xpos[0], ypos_b[0]);
		for(var t=1;t<xlabel.length   ;t++){ ctx.lineTo(xpos[t], ypos_b[t]);}
		for(var t=xlabel.length-1;t>=1;t--){ ctx.lineTo(xpos[t], ypos[t]);}
		ctx.lineTo(xpos[0], ypos[0]);
		ctx.closePath();
		ctx.shape();
	}
}

/* ------------------------------ */
/*   �h�b�g�`���[�g�`�惋�[�`��   */
/* ------------------------------ */
function drawDotChart(idname, json){
	var WIDTH  = json.graph.size[0],
		HEIGHT = json.graph.size[1],
		LEFT   = json.graph.origin[0],
		TOP    = json.graph.origin[1],
		xlabel = json.xlabel,
		ctx    = settingCanvas(idname, json);

	var xpos = [], mwidth = WIDTH/xlabel.length, moffset = mwidth/2;
	for(var t=0;t<xlabel.length;t++){ xpos[t] = _mf(LEFT+t*mwidth+moffset);}

	var max_rsize = Math.min(mwidth, HEIGHT/json.data.length)*0.66;
	var max_val = 0;
	for(var i=0;i<json.data.length;i++){
		for(var t=0;t<xlabel.length;t++){
			var val = Math.pow(json.data[i].value[t],0.5);
			if(val>max_val){ max_val = val;}
		}
	}

	// �f�[�^�`�敔
	for(var i=0;i<json.data.length;i++){
		var info = json.data[i], vals = info.value, rsize=[];
		if(!vals || vals.length===0 || info.display==='none'){ continue;}

		var ypos = _mf(TOP+HEIGHT*((i+0.5)/json.data.length));

		// �`�悷����W�̏���
		for(var t=0;t<xlabel.length;t++){
			if(!vals[t]){ vals[t]=0;}
			rsize[t] = max_rsize*(Math.pow(vals[t],0.5)/max_val);
		}

		// �n��̐F�̐ݒ�
		var color = (!!info.color ? info.color : '');
		ctx.fillStyle = (!!color ? color : 'none');
		ctx.strokeStyle = "black";
		ctx.lineWidth =1;

		// �n��̕`��
		if(ctx.fillStyle!=='none'&&ctx.fillStyle!=='white'&&Camp.parse(ctx.fillStyle)!=='#ffffff'){
			for(var t=0;t<xlabel.length;t++){ ctx.fillCircle(xpos[t], ypos, rsize[t]);}
		}
		else{
			for(var t=0;t<xlabel.length;t++){ ctx.strokeCircle(xpos[t], ypos, rsize[t]);}
		}
	}
}

/* ---------------- */
/*   �}�[�J�[�`��   */
/* ---------------- */
function drawMarker(markerInfo, ctx, mkpos){
	if(!markerInfo){ return;}
	var marker = markerInfo.split(/[ ]+/g).join('').split(/,/);
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

})();
