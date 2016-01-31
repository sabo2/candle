/* jshint node:true */

exports.files = [
	"candle.core",
	"candle.base",
	"candle.svg",
	"candle.canvas"
].map(function(mod){ return "src/"+mod+".js";});
