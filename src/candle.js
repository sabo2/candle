(function(){
	var component = [
		"candle.core",
		"candle.base",
		"candle.svg",
		"candle.canvas",
		"candle.vml"
	];

	var isbrowser = true;
	try{ isbrowser = !exports;}
	catch(e){}

	if(isbrowser){
		var dir = (function getpath(){
			var srcs=document.getElementsByTagName('script');
			for(var i=0;i<srcs.length;i++){
				var result = srcs[i].src.match(/^(.*\/)candle\.js$/);
				if(result){ return result[1] + (!result[1].match(/\/$/) ? '/' : '');}
			}
			return "";
		})();
		
		component.map(function(mod){ return dir+mod+".js";}).forEach(function(file){
			document.write('<script type="text/javascript" src="'+file+'"></script>');
		});
	}
	else{
		component.unshift("common/intro");
		component.push   ("common/outro");

		var dir = "src/";
		exports.files = component.map(function(mod){ return dir+mod+".js";});
	}
})();
