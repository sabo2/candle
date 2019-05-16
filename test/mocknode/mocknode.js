/* eslint-env node, mocha */

var assert = require('assert');

var Candle = require('../../dist/candle.js');

describe('General Usage', function(){
	it('Basic',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('puzzle');
		doc.appendChild(el);
		assert.equal(doc.innerHTML, '<puzzle/>');
		
		assert.equal(el.outerHTML, '<puzzle/>');
		assert.equal(el.innerHTML, '');
	});
	it('Attributes',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('puzzle');
		el.setAttribute('type', 'nurikabe');
		assert.equal(el.outerHTML, '<puzzle type="nurikabe"/>');
		el.setAttribute('type', '');
		assert.equal(el.outerHTML, '<puzzle type=""/>');
		el.removeAttribute('type');
		assert.equal(el.outerHTML, '<puzzle/>');
	});
});
describe('Serializing', function(){
	it('Basic',function(){
		var doc = new Candle.DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?><puzzle/>');
		assert.equal(doc.nodeType, 9);
		assert.equal(doc.childNodes.length, 1);
		assert.equal(doc.firstChild.tagName, 'puzzle');
		assert.equal(doc.firstChild.nodeType, 1);
	});
	it('Mixed 1',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		el.setAttribute('id','mock');
		el.setAttribute('d','123');

		var el2 = doc.createElementNS('', 'g');
		el.appendChild(el2);
		el2.style.height = 100;

		var el3 = doc.createElement('path');
		el2.appendChild(el3);

		assert.equal(el.outerHTML, '<svg id="mock" d="123"><g style="height:100;"><path/></g></svg>');
	});
	it('Mixed 2',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		el.setAttribute('id','mock');
		el.setAttribute('d','123');

		var el2 = doc.createElementNS('', 'g');
		el.appendChild(el2);
		el2.style.height = 100;

		var el3 = doc.createElement('path');
		el2.appendChild(el3);

		var el4 = doc.createTextNode('TEST');
		el3.appendChild(el4);

		assert.equal(el4.nodeType, 3);
		assert.equal(el.outerHTML, '<svg id="mock" d="123"><g style="height:100;"><path>TEST</path></g></svg>');
	});
	it('serializer', function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		doc.appendChild(el);
		el.setAttribute('id','mock');
		el.setAttribute('d','123');

		var el2 = doc.createElementNS('', 'g');
		el.appendChild(el2);
		el2.style.height = 100;

		assert.equal(new Candle.XMLSerializer().serializeToString(doc), '<svg id="mock" d="123"><g style="height:100;"/></svg>');
	});
});
describe('Parsing', function(){
	it('Basic',function(){
		var doc = new Candle.DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?><puzzle/>');
		assert.equal(doc.querySelector('puzzle'), doc.firstChild);
		assert.equal(doc.querySelectorAll('puzzle')[0], doc.firstChild);
	});
});
describe('Searching', function(){
	it('Basic',function(){
		var doc = new Candle.DOMParser().parseFromString('<?xml version="1.0" encoding="UTF-8"?><puzzle/>');
		assert.equal(doc.querySelector('puzzle'), doc.firstChild);
		assert.equal(doc.querySelectorAll('puzzle')[0], doc.firstChild);
	});
	it('Empty node',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		assert.doesNotThrow(function(){ el.querySelector('g')});
		assert.equal(el.querySelector('g'), null);
	});
	it('Deep descendant 1',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		doc.appendChild(el);
		el.setAttribute('id','mock');
		el.setAttribute('d','123');

		var el2 = doc.createElementNS('', 'g');
		el.appendChild(el2);
		el2.style.height = 100;

		var el3 = doc.createElement('path');
		el2.appendChild(el3);

		assert.equal(doc.querySelector('svg path'), el3);
		assert.equal(doc.querySelectorAll('svg path').length, 1);
	});
	it('All',function(){
		var doc = new Candle.document.constructor();
		var el = doc.createElement('svg');
		doc.appendChild(el);
		el.setAttribute('id','mock');
		el.setAttribute('d','123');

		var el2 = doc.createElementNS('', 'g');
		el.appendChild(el2);
		el2.style.height = 100;

		var el3 = doc.createElement('path');
		el2.appendChild(el3);

		assert.equal(doc.querySelectorAll('*').length, 3);
		assert.equal(doc.querySelectorAll('* *').length, 2);
		assert.equal(doc.querySelectorAll('* * *').length, 1);
	});
});
