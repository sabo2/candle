/* jshint node:true */

exports.files = [
	"candle.core",
	"mocknode",
	"candle.base",
	"candle.svg",
	"candle.canvas"
].map(function(mod){ return "src/"+mod+".js";});
