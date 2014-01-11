(function(){
	var dir="", srcs=document.getElementsByTagName('script');
	for(var i=0;i<srcs.length;i++){
		var result = srcs[i].src.match(/^(.*\/)candle\.js$/);
		if(result){
			if(result[1].match(/\/$/)){ dir = result[1];}
			else{ dir = result[1]+'/';}
			break;
		}
	}

	var _doc = document;
	_doc.write('<script type="text/javascript" src="'+dir+'candle.core.js"></script>');
	_doc.write('<script type="text/javascript" src="'+dir+'candle.base.js"></script>');

	_doc.write('<script type="text/javascript" src="'+dir+'candle.svg.js"></script>');
	_doc.write('<script type="text/javascript" src="'+dir+'candle.canvas.js"></script>');
	_doc.write('<script type="text/javascript" src="'+dir+'candle.sl.js"></script>');
	_doc.write('<script type="text/javascript" src="'+dir+'candle.vml.js"></script>');
})();
