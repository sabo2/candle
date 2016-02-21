
var Candle = require('../dist/candle.js');

function drawing(g){
	g.changeSize(200,200);
	g.translate(-5,-5);
	g.setRendering('crispEdges');

	g.fillStyle = 'silver';
	g.fillRect(0,0,200,200);

	g.setLayer("baseline");

	g.strokeStyle = "gray";
	g.lineWidth = 4;
	g.strokeLine(-40,0,40,0);
	g.strokeLine(0,-40,0,40);

	g.setLayer("back");

	g.setLayer("top");
	g.strokeStyle = "blue";
	g.strokeRect(10,10,180,180);

	g.strokeStyle = 'red';
	g.strokeRect(30,20,30,200);
	g.strokeRect(20,30,200,30);

	g.setLayer("rect");
	g.fillStyle = 'black';
	g.fillText("TextTextTextTextTextTextText",20,120);

	g.strokeStyle = 'green';
	g.beginPath();
	g.arc(150,150,25,0,Math.PI/2,false);
	g.stroke();

	require('fs').writeFile((g.use.canvas ? './test.png' : './test.svg'), g.canvas.toBuffer());
}

Candle.start({}, 'canvas', drawing);
Candle.start({}, 'svg', drawing);
