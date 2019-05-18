
# APIs

## APIs for exported object

* `Candle` is an object below.
* `Candle.start(element|obj[, type]) : context`
    * Add getContext function below to given element or object.
      `type` is `'canvas'` or `'svg'`. If they are disabled, it has no effect.
* `Candle.env : {browser:boolean, env:boolean}`
* `Candle.enable : {svg:boolean, candle:boolean}`
* `Candle.current : string` `'svg'` or `'canvas'`. It is used for `Candle.start` default second argument.
* `Candle.select(type)` sets Candle.current value.
* `Candle.parse(color:string) : string` converts the string e.g. from `'rgb(255,255,255)'` to `'#ffffff'`.
* `Candle.document`, `Candle.DOMParser` and `Candle.XMLSerializer` are used for `SVG.toDataURL` etc. under node env.
* `Candle.version : string` contains module version.

## APIs from CanvasRenderingContext2D

### APIs for canvas element

* `element.getContext('2d') : context`
* `element.toDataURL([type[, quiality]]) : URL`
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
