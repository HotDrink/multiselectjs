var M = require("./multiselect");
var Rect = require("./rectangle");

var makeEmptyMap = M.detail.makeEmptyMap;
var OrderedGeometry = function (size) {
  M.DefaultGeometry.call(this);
  this._size = size;
};

OrderedGeometry.prototype = Object.create(M.DefaultGeometry.prototype);
OrderedGeometry.prototype.constructor = OrderedGeometry;

OrderedGeometry.prototype.selectionDomain = function (spath) {
  var J = makeEmptyMap();
  if (spath.length === 0) return J;

  var b = Math.max(0, Math.min(M.anchor(spath), M.activeEnd(spath)));
  var e = Math.min(this._size-1, Math.max(M.anchor(spath), M.activeEnd(spath)));
  for (var i = b; i<=e; ++i) J.set(i, true);
  return J; 
};
OrderedGeometry.prototype.filter = function (predicate) {
  var J = makeEmptyMap();
  for (var i = 0; i < this._size; ++i) if (predicate(i)) J.set(i, true);
  return J;
};

OrderedGeometry.prototype.size = function () { return this._size; };

exports.OrderedGeometry = OrderedGeometry;
var VerticalGeometry = function (size) {
  OrderedGeometry.call(this, size);
};

VerticalGeometry.prototype = Object.create(OrderedGeometry.prototype);
VerticalGeometry.prototype.constructor = VerticalGeometry;

VerticalGeometry.prototype.step = function (dir, vpoint) {
  switch (dir) {
    case M.UP: return Math.max(0, vpoint-1);
    case M.DOWN: return Math.min(this._size-1, vpoint+1);
    default: return vpoint;
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
    case M.LEFT: return Math.max(0, vpoint-1);
    case M.RIGHT: return Math.min(this._size-1, vpoint+1);
    default: return vpoint;
  }
};

exports.HorizontalGeometry = HorizontalGeometry;
var DomGeometry = function (parent, elements) {
  OrderedGeometry.call(this, elements.length);
  
  this._parent = parent;
  this._elements = elements;
};
DomGeometry.prototype = Object.create(OrderedGeometry.prototype);
DomGeometry.constructor = DomGeometry;

DomGeometry.prototype.m2v = function (mpoint) {
  for (var i=0; i<this._elements.length; ++i) {
    if (Rect.pointInRects(mpoint, 
                          Rect.getOffsetRects(
                            this._parent, this._elements[i])))
      return i;
  }
  return null;
};

DomGeometry.prototype.step = function (dir, vpoint) {
  switch (dir) {
  case M.LEFT: return Math.max(0, vpoint - 1);
  case M.RIGHT: return Math.min(this._size - 1, vpoint + 1);
  default: return vpoint;
  }
};

DomGeometry.prototype.defaultCursor = function (dir) {
  switch (dir) {
  case M.LEFT: return this._size-1;
  case M.RIGHT: return 0; 
  case M.NO_DIRECTION: return 0;
  default: return null;
  }
};
  
exports.DomGeometry = DomGeometry;
var IPhotoDomGeometry = function (parent, elements) {
  return DomGeometry.call(this, parent, elements);
};
IPhotoDomGeometry.prototype = Object.create(DomGeometry.prototype);
IPhotoDomGeometry.constructor = IPhotoDomGeometry;

IPhotoDomGeometry.prototype.m2v = function (mpoint) {
  for (var i=0; i<this._elements.length; ++i) {
    if (Rect.pointInRects(mpoint, 
                            Rect.getOffsetRects(
                              this._parent, this._elements[i])))
      return { index: i, location: mpoint }
  }
  return { index: undefined, location: mpoint };
};
IPhotoDomGeometry.prototype.v2m = function (mpoint) {
  if (mpoint === undefined) return mpoint;
  if (mpoint.location !== undefined) return mpoint.location;
  return Rect.midPoint(Rect.getOffsetRects(this._parent, this._elements[mpoint.index])[0]);
}
IPhotoDomGeometry.prototype.vpath2mpath = function (vpath) {
  return vpath.map(function (mp) { return mp.location; });
}

IPhotoDomGeometry.prototype.defaultCursor = function (dir) {
  switch (dir) {
    case M.RIGHT: return { index: -1 };
    case M.LEFT: return { index: this._size };
    default: return undefined;
  }
};
IPhotoDomGeometry.prototype.step = function (dir, vpoint) {
  if (vpoint.index === undefined) return vpoint;
  switch (dir) {
    case M.LEFT: return { index: Math.max(0, vpoint.index-1) };
    case M.RIGHT: return { index: Math.min(this._size-1, vpoint.index+1) };
    default: return vpoint;
  }
};

IPhotoDomGeometry.prototype.boundToElement = function (vpoint) {
  return vpoint.index !== undefined;
};
IPhotoDomGeometry.prototype.extendPath = function (spath, vpoint) {
  if (spath.length === 0) return [];
  if (this.boundToElement(anchor(spath))) {
    if (!this.boundToElement(vpoint)) return spath;
  } else {
    vpoint.index = undefined; // set vpoint not be bound to element
  }
  spath.push(vpoint); 
  return spath;
//  return DomGeometry.prototype.extendPath.call(this, spath, vpoint);
};

IPhotoDomGeometry.prototype.selectionDomain = function (spath) {
  var J = makeEmptyMap();
  if (spath.length === 0) return J;
  if (this.boundToElement(anchor(spath))) {
    return DomGeometry.prototype.selectionDomain.call(
      this, spath.map(function (v) { return v.index; }));
  }
  else
  {
    var bbox = Rect.rect(anchor(spath).location, M.activeEnd(spath).location);
    for (var i=0; i<this._elements.length; ++i) {
      if (Rect.intersectWithAny(bbox,
                                Rect.getOffsetRects(
                                  this._parent, this._elements[i])))
        J.set(i, true);
    }
  }
  return J;
}; 
  
exports.IPhotoDomGeometry = IPhotoDomGeometry;
