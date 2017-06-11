# Abort pzpr-canvas

This is a spin-off project from [[https://bitbucket.org/sabo2/pzprjs|pzprjs]] and  [[https://bitbucket.org/sabo2/pzprv3|pzprv3]] about drawing routine.

This script enables drawing SVG, canvas by common canvas-like API.

# Usage

## Installation

### Browser environment

`<script src='path/to/dist/candle.js'></src>`

By default, this script is exported as `Candle` to global.

### Node.js environment (via npm)

`require('pzpr-canvas')`

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

## APIs from CanvasRenderingContext2D

### APIs for canvas element

* `element.getContext('2d')`
* `element.toDataURL([type[, quiality]])`
* `element.toBlob(callback[, type[, quiality]])`
    * `type` and `quality` have no effect for SVG.

### APIs for fill and stroke

* `ctx.fillStyle, ctx.strokeStyle, ctx.lineWidth, ctx.canvas`
* `ctx.beginPath(), ctx.closePath(), ctx.moveTo(), ctx.lineTo(), ctx.rect(), ctx.arc()`
* `ctx.fill(), ctx.stroke()`
* `ctx.fillRect(x,y,w,h), ctx.strokeRect(x,y,w,h)`
* `ctx.strokeLine(x1,y1,x2,y2)`

### APIs for text

* `ctx.font, ctx.textAlign, ctx.textBaseline`
* `ctx.fillText(text,x,y,maxLength)`

### APIs for images

* `ctx.drawImage(image,dx,dy)`
* `ctx.drawImage(image,dx,dy,dw,dh)`
* `ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh)`

### APIs with limited support

* `ctx.translate(left,top)`

## Additional APIs

### APIs for paths, fill and stroke

* `ctx.setLinePath(x,y[,x,y[,...]][,isClosePath])`
    * Add polygon path.
* `ctx.setOffsetLinePath(offsetx,offsety,x,y[,x,y[,...]][,isClosePath])`
    * Add polygon path that the offset is (offsetx, offsety).
* `ctx.shape(), ctx.shapeRect(x,y,w,h)`
    * Draw a figure with both fill and stroke at once.
* `ctx.rectcenter(cx,cy,bw,bh), ctx.fill/stroke/shapeRectCenter(cx,cy,bw,bh)`
    * Draw a rectangle with center coordinate (cx, cy) and the size bw, bh to the edge.
* `ctx.fill/stroke/shapeCircle(cx,cy,r)`
    * Draw a circle with center coordinate (cx, cy) and the size r to the edge.
* `ctx.strokeDashedLine(x1,y1,x2,y2,sizes)`
    * Draw a dashed line from (x1, y1) to (x2, y2) with the dashed size array sizes.
* `ctx.strokeCross(cx,cy,l)`
    * Draw a cross mark with center coordinate (cx, cy) and the size l to the edge.

### APIs for managing canvas

* `element.toBuffer([type[, quiality]])`
    * Output raw data which can be used for node.js fs.write instead of data URL.
* `ctx.clear()`
    * Clear the whole canvas.
* `ctx.setLayer(name[, option])`
    * Create a layer usually used for drawing order for SVG.
* `ctx.setRendering(render)`
    * Set rendering method. Available values are: `auto` or `crispEdges`.
* `ctx.changeSize(width, height)`
    * Change the canvas size.

### APIs for managing vector element (Only effective for SVG)

* `ctx.vid`
    * Set an id for a figure. The id is set to a figure which is drawn after the id is given, then `ctx.vid` will be cleared. If the figure with the id already exists, it modifies the previous figure.
* `ctx.vhide(id)`
    * Hide the figure with the id.

### APIs for workaround

* `ctx.enableTextLengthWA`
    * A bool value for fixing illegal SVG text rendering position with textLength and textAlign (center or right) for IE and Edge.

# Releases

* 2017/06/11 v0.8.2
* 2017/04/21 v0.8.1
* 2017/03/20 v0.8.0

# LICENCE

MIT
