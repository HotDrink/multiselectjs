var dg = require("./default_geometry");
// size is the number of elements
var OrderedGeometry = function (size) {
  dg.DefaultGeometry.call(this);
  this._size = size;
};

OrderedGeometry.prototype = Object.create(dg.DefaultGeometry.prototype);
OrderedGeometry.prototype.constructor = OrderedGeometry;

OrderedGeometry.prototype.size = function() { return this._size; }

// retain only the anchor and the active end, ignore null points
OrderedGeometry.prototype.extendPath = function(spath, vpoint) {
  if (vpoint === null) return null;
  if (spath.length === 2) spath.pop();
  spath.push(vpoint);
};

// selection domain is the range between anchor and active end 
OrderedGeometry.prototype.selectionDomain = function (spath) {
  var J = dg.makeEmptyMap();
  if (spath.length === 0) return J;

  var b = Math.max(0, Math.min(dg.anchor(spath), dg.activeEnd(spath)));
  var e = Math.min(this.size()-1, Math.max(dg.anchor(spath), dg.activeEnd(spath)));
  for (var i = b; i<=e; ++i) J.set(i, true);
  return J; 
};

// iterate from 0 to size-1
OrderedGeometry.prototype.filter = function (predicate) {
  var J = dg.makeEmptyMap();
  for (var i = 0; i < this.size(); ++i) if (predicate(i)) J.set(i, true);
  return J;
};

exports.OrderedGeometry = OrderedGeometry;
var VerticalGeometry = function (size) {
  OrderedGeometry.call(this, size);
};

VerticalGeometry.prototype = Object.create(OrderedGeometry.prototype);
VerticalGeometry.prototype.constructor = VerticalGeometry;

VerticalGeometry.prototype.step = function (dir, vpoint) {
  switch (dir) {
    case dg.UP: return Math.max(0, vpoint-1);
    case dg.DOWN: return Math.min(this.size()-1, vpoint+1);
    default: return vpoint;
  }
};

VerticalGeometry.prototype.defaultCursor = function (dir) {
  switch (dir) {
  case dg.UP: return this.size()-1;
  case dg.DOWN: return 0; 
  default: return undefined;
  }
};

exports.VerticalGeometry = VerticalGeometry;
var HorizontalGeometry = function (size) {
  OrderedGeometry.call(this, size);
};

HorizontalGeometry.prototype = Object.create(OrderedGeometry.prototype);
HorizontalGeometry.prototype.constructor = HorizontalGeometry;

HorizontalGeometry.prototype.step = function (dir, vpoint) {
  switch (dir) {
    case dg.LEFT: return Math.max(0, vpoint-1);
    case dg.RIGHT: return Math.min(this.size()-1, vpoint+1);
    default: return vpoint;
  }
};

HorizontalGeometry.prototype.defaultCursor = function (dir) {
  switch (dir) {
  case dg.LEFT: return 0; 
  case dg.RIGHT: return this.size()-1;
  default: return undefined;
  }
};

exports.HorizontalGeometry = HorizontalGeometry;
