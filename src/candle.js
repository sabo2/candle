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
				if(result){
					if(result[1].match(/\/$/)){ return result[1];}
					else{ return result[1]+'/';}
				}
			}
			return "";
		})();
		
		for(var i=0; i<component.length; i++){
			var file = dir+component[i]+".js";
			document.write('<script type="text/javascript" src="'+file+'"></script>');
		}
	}
	else{
		component.unshift("common/intro");
		component.push   ("common/outro");

		var dir = "src/";
		exports.files = component.map(function(mod){ return dir+mod+".js";});
	}
})();
