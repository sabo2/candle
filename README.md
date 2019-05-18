# Abort pzpr-canvas

This is a spin-off project from [[https://github.com/sabo2/pzprjs]] and  [[https://github.com/sabo2/pzprv3]] about drawing routine.

This script enables drawing SVG, canvas by common canvas-like API.

# Usage

## Installation

### Browser environment

`<script src='path/to/dist/candle.js'></src>`

By default, this script is exported as `Candle` to global.

### Node.js common-js environment (via npm)

`const Candle = require('pzpr-canvas')`

### ES6 module environment, planned for 0.9.0

`import Candle from 'path/to/dist/candle.module.js'`

## How to use

Use `Candle.start(element, [type, [callback]])` to enable this script.

It is recommended to use block elements except `<canvas>` HTMLElement.

```js
var Candle = require('pzpr-canvas');
var element = document.getElementById('div');

Candle.start(element, 'svg', function(ctx){
  ctx.fillStyle = 'red';
  ctx.fillRect(100, 100, 10, 10);
});
```

After that, `document.getElementById('div').getContext('2d')` can be used to obtain context.

`element` doesn't have to be an Element. This means, SVG file data can be outputted under node.js environment.

```js
var Candle = require('pzpr-canvas');
var obj = {offsetWidth:200, offsetHeight:200}; // Set default canvas size (optional)

Candle.start(obj);
var ctx = obj.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(100, 100, 10, 10);
console.log(obj.toBuffer()); // <-- output svg data to console buffer
```

# APIs

## Documents
* [Canvas context APIs](https://github.com/sabo2/candle/blob/master/doc/CanvasAPI.md)

# Releases

* 2019/05/18 v0.9.0-beta1
* 2017/06/11 v0.8.2
* 2017/04/21 v0.8.1
* 2017/03/20 v0.8.0

# LICENCE

MIT
