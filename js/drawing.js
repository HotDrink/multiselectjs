var Rect = require("./rectangle");

function createBaseCanvas (parent) {
  var canvas = document.createElement("canvas");
  var rect = parent.getBoundingClientRect();
  canvas.style.position = 'absolute';
  canvas.width=Rect.width(rect);
  canvas.height=Rect.height(rect);
  canvas.style.zIndex = 0;
  canvas.style.overflow = 'hidden';
  parent.insertBefore(canvas, parent.firstChild);
  return canvas;
}

// Create n canvases on top of the baseCanvas, insert them into
// the DOM, and push them into layerArray, and return layerArray.
// The zIndex
// is consequtive, up from baseCanvas's zIndex.  New canvases have
// no border or background.
function createLayers (baseCanvas, n, layers) {
  var z = baseCanvas.style.zIndex || 0;
  layers = layers || [];
  for (var i = 0; i < n; ++i) {
    var canvas = baseCanvas.cloneNode(true);
    canvas.style.position = 'absolute';
    canvas.style.top = baseCanvas.style.top;
    canvas.style.left = baseCanvas.style.left;
    canvas.style.zIndex = z + 1 + i;
    canvas.style.background = null;
    layers.push(canvas);
    baseCanvas.parentNode.insertBefore(canvas, baseCanvas);            
  }
  return layers;
};

//////////////////////
// Cursor    canvas //
//////////////////////

exports.CursorCanvas = function (parent) {
  
  this.baseCanvas = createBaseCanvas(parent);
  this.layers = createLayers(this.baseCanvas, 3, []);
  // construct 3 layers, one each for activeEnd, anchor, rubber

//  this.eventCanvas = this.layers[this.layers.length-1];
  // last layer captures mouse events

  this.rubberCtx = this.layers[0].getContext('2d'); 
  this.anchorCtx = this.layers[1].getContext('2d'); 
  this.cursorCtx = this.layers[2].getContext('2d');
  
  this.anchorCtx.strokeStyle = 'blue';
  this.anchorCtx.lineWidth = 1;
  
  this.cursorCtx.strokeStyle = 'deeppink';
  this.cursorCtx.lineWidth = 1;
  
  this.rubberCtx.strokeStyle = 'darkgreen';
  this.rubberCtx.lineWidth = 2;
  if (this.rubberCtx.setLineDash) 
    this.rubberCtx.setLineDash([6,3]); // Not in all browsers
}

exports.CursorCanvas.prototype.resize = function (w, h) {        
  for (var i = 0; i < this.layers.length; ++i) {
    this.layers[i].width = w;
    this.layers[i].height = h;          
  }
};

exports.CursorCanvas.prototype.clear = function (ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


//////////////////////////////////////////////////////
// Helper functions for drawing shapes on a context //
//////////////////////////////////////////////////////

// pre: objects in path have members x and y
exports.drawPath = function (ctx, path) {    
  if (path.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (var i=1; i<path.length; ++i) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
}

// pre: r is a rect
exports.drawBox = function (ctx, r) {
  ctx.strokeRect(r.left, r.top, Rect.width(r), Rect.height(r));

}

exports.drawLine = function (ctx, p1, p2) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

exports.drawCircle = function (ctx, point) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, Math.PI*2, true); 
  ctx.stroke();
}

exports.drawSmallCircle = function (ctx, point) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, 2, 0, Math.PI*2, true); 
  ctx.stroke();
}
