// candle.env.js

export default {
	node : (typeof module==='object' && typeof process==='object'),
	browser : (typeof document==='object' && typeof window==='object' && typeof location==='object')
};
