(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ordered_geometries = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  /////////////////////////////////////////
  // This file is generated, do not edit //
  /////////////////////////////////////////

  // -------------------------------------------------------------------
  // selection geometries
  // -------------------------------------------------------------------

    function makeEmptySet() { return new Set(); }
    function makeEmptyMap() { return new Map(); }
  
    function isEmpty(collection) { return collection.size === 0; }
    function isSingleton(collection) { return collection.size === 1; }
  
    function firstKey(collection) {  
      // The body should be:
      //   return collection.keys().next().value; 
      // but Safari 8 does not support .next, therefore the workarounds below
  
      if (typeof collection.keys().next === 'function') {
        return collection.keys().next().value;
      } else {
        var it = collection.keys();
        for (var v of it) return v;
        return undefined;
      }
    }
  
    function copySet (s) { 
      var s2 = makeEmptySet();
      s.forEach(function (key) { s2.add(key); });
      return s2;
    }
  
    function copyMap (s) { 
      var s2 = makeEmptyMap();
      s.forEach(function (value, key) { s2.set(key, value); });
      return s2;
    }
  
  var DefaultGeometry = function () {};
  
  DefaultGeometry.prototype = {
    m2v : function (mp) { return mp; },
    extendPath : function (spath, vp) { spath.push(vp); },
    step : function (dir, vp) { return undefined; },
    selectionDomain : function(spath, J) { 
      var m = makeEmptyMap();
      for (var i of spath) m.set(i, true); 
      return m;
    },
    defaultCursor : function(dir) { return undefined; },
    filter : undefined
  };

          var UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4, NO_DIRECTION = 0;

          function anchor(path) { 
             if (path.length === 0) return undefined; 
             return path[0]; 
          };
          function activeEnd(path) { 
             if (path.length === 0) return undefined; 
             return path[path.length - 1]; 
          };

  exports.DefaultGeometry = DefaultGeometry;
  exports.anchor = anchor;
  exports.activeEnd = activeEnd;

  exports.makeEmptyMap = makeEmptyMap;
  exports.makeEmptySet = makeEmptySet;

  exports.isEmpty = isEmpty;
  exports.isSingleton = isSingleton;
  exports.firstKey = firstKey;
  exports.copySet = copySet;
  exports.copyMap = copyMap;

  exports.UP = UP; 
  exports.DOWN = DOWN; 
  exports.LEFT = LEFT; 
  exports.RIGHT = RIGHT;
  exports.NO_DIRECTION = NO_DIRECTION;

},{}],2:[function(require,module,exports){
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

},{"./default_geometry":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9kZWZhdWx0X2dlb21ldHJ5LmpzIiwianMvb3JkZXJlZF9nZW9tZXRyaWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vIFRoaXMgZmlsZSBpcyBnZW5lcmF0ZWQsIGRvIG5vdCBlZGl0IC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBzZWxlY3Rpb24gZ2VvbWV0cmllc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBmdW5jdGlvbiBtYWtlRW1wdHlTZXQoKSB7IHJldHVybiBuZXcgU2V0KCk7IH1cbiAgICBmdW5jdGlvbiBtYWtlRW1wdHlNYXAoKSB7IHJldHVybiBuZXcgTWFwKCk7IH1cbiAgXG4gICAgZnVuY3Rpb24gaXNFbXB0eShjb2xsZWN0aW9uKSB7IHJldHVybiBjb2xsZWN0aW9uLnNpemUgPT09IDA7IH1cbiAgICBmdW5jdGlvbiBpc1NpbmdsZXRvbihjb2xsZWN0aW9uKSB7IHJldHVybiBjb2xsZWN0aW9uLnNpemUgPT09IDE7IH1cbiAgXG4gICAgZnVuY3Rpb24gZmlyc3RLZXkoY29sbGVjdGlvbikgeyAgXG4gICAgICAvLyBUaGUgYm9keSBzaG91bGQgYmU6XG4gICAgICAvLyAgIHJldHVybiBjb2xsZWN0aW9uLmtleXMoKS5uZXh0KCkudmFsdWU7IFxuICAgICAgLy8gYnV0IFNhZmFyaSA4IGRvZXMgbm90IHN1cHBvcnQgLm5leHQsIHRoZXJlZm9yZSB0aGUgd29ya2Fyb3VuZHMgYmVsb3dcbiAgXG4gICAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb24ua2V5cygpLm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24ua2V5cygpLm5leHQoKS52YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpdCA9IGNvbGxlY3Rpb24ua2V5cygpO1xuICAgICAgICBmb3IgKHZhciB2IG9mIGl0KSByZXR1cm4gdjtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIFxuICAgIGZ1bmN0aW9uIGNvcHlTZXQgKHMpIHsgXG4gICAgICB2YXIgczIgPSBtYWtlRW1wdHlTZXQoKTtcbiAgICAgIHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IHMyLmFkZChrZXkpOyB9KTtcbiAgICAgIHJldHVybiBzMjtcbiAgICB9XG4gIFxuICAgIGZ1bmN0aW9uIGNvcHlNYXAgKHMpIHsgXG4gICAgICB2YXIgczIgPSBtYWtlRW1wdHlNYXAoKTtcbiAgICAgIHMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkgeyBzMi5zZXQoa2V5LCB2YWx1ZSk7IH0pO1xuICAgICAgcmV0dXJuIHMyO1xuICAgIH1cbiAgXG4gIHZhciBEZWZhdWx0R2VvbWV0cnkgPSBmdW5jdGlvbiAoKSB7fTtcbiAgXG4gIERlZmF1bHRHZW9tZXRyeS5wcm90b3R5cGUgPSB7XG4gICAgbTJ2IDogZnVuY3Rpb24gKG1wKSB7IHJldHVybiBtcDsgfSxcbiAgICBleHRlbmRQYXRoIDogZnVuY3Rpb24gKHNwYXRoLCB2cCkgeyBzcGF0aC5wdXNoKHZwKTsgfSxcbiAgICBzdGVwIDogZnVuY3Rpb24gKGRpciwgdnApIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSxcbiAgICBzZWxlY3Rpb25Eb21haW4gOiBmdW5jdGlvbihzcGF0aCwgSikgeyBcbiAgICAgIHZhciBtID0gbWFrZUVtcHR5TWFwKCk7XG4gICAgICBmb3IgKHZhciBpIG9mIHNwYXRoKSBtLnNldChpLCB0cnVlKTsgXG4gICAgICByZXR1cm4gbTtcbiAgICB9LFxuICAgIGRlZmF1bHRDdXJzb3IgOiBmdW5jdGlvbihkaXIpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSxcbiAgICBmaWx0ZXIgOiB1bmRlZmluZWRcbiAgfTtcblxuICAgICAgICAgIHZhciBVUCA9IDEsIERPV04gPSAyLCBMRUZUID0gMywgUklHSFQgPSA0LCBOT19ESVJFQ1RJT04gPSAwO1xuXG4gICAgICAgICAgZnVuY3Rpb24gYW5jaG9yKHBhdGgpIHsgXG4gICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gdW5kZWZpbmVkOyBcbiAgICAgICAgICAgICByZXR1cm4gcGF0aFswXTsgXG4gICAgICAgICAgfTtcbiAgICAgICAgICBmdW5jdGlvbiBhY3RpdmVFbmQocGF0aCkgeyBcbiAgICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWQ7IFxuICAgICAgICAgICAgIHJldHVybiBwYXRoW3BhdGgubGVuZ3RoIC0gMV07IFxuICAgICAgICAgIH07XG5cbiAgZXhwb3J0cy5EZWZhdWx0R2VvbWV0cnkgPSBEZWZhdWx0R2VvbWV0cnk7XG4gIGV4cG9ydHMuYW5jaG9yID0gYW5jaG9yO1xuICBleHBvcnRzLmFjdGl2ZUVuZCA9IGFjdGl2ZUVuZDtcblxuICBleHBvcnRzLm1ha2VFbXB0eU1hcCA9IG1ha2VFbXB0eU1hcDtcbiAgZXhwb3J0cy5tYWtlRW1wdHlTZXQgPSBtYWtlRW1wdHlTZXQ7XG5cbiAgZXhwb3J0cy5pc0VtcHR5ID0gaXNFbXB0eTtcbiAgZXhwb3J0cy5pc1NpbmdsZXRvbiA9IGlzU2luZ2xldG9uO1xuICBleHBvcnRzLmZpcnN0S2V5ID0gZmlyc3RLZXk7XG4gIGV4cG9ydHMuY29weVNldCA9IGNvcHlTZXQ7XG4gIGV4cG9ydHMuY29weU1hcCA9IGNvcHlNYXA7XG5cbiAgZXhwb3J0cy5VUCA9IFVQOyBcbiAgZXhwb3J0cy5ET1dOID0gRE9XTjsgXG4gIGV4cG9ydHMuTEVGVCA9IExFRlQ7IFxuICBleHBvcnRzLlJJR0hUID0gUklHSFQ7XG4gIGV4cG9ydHMuTk9fRElSRUNUSU9OID0gTk9fRElSRUNUSU9OO1xuIiwidmFyIGRnID0gcmVxdWlyZShcIi4vZGVmYXVsdF9nZW9tZXRyeVwiKTtcbi8vIHNpemUgaXMgdGhlIG51bWJlciBvZiBlbGVtZW50c1xudmFyIE9yZGVyZWRHZW9tZXRyeSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIGRnLkRlZmF1bHRHZW9tZXRyeS5jYWxsKHRoaXMpO1xuICB0aGlzLl9zaXplID0gc2l6ZTtcbn07XG5cbk9yZGVyZWRHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGRnLkRlZmF1bHRHZW9tZXRyeS5wcm90b3R5cGUpO1xuT3JkZXJlZEdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE9yZGVyZWRHZW9tZXRyeTtcblxuT3JkZXJlZEdlb21ldHJ5LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9zaXplOyB9XG5cbi8vIHJldGFpbiBvbmx5IHRoZSBhbmNob3IgYW5kIHRoZSBhY3RpdmUgZW5kLCBpZ25vcmUgbnVsbCBwb2ludHNcbk9yZGVyZWRHZW9tZXRyeS5wcm90b3R5cGUuZXh0ZW5kUGF0aCA9IGZ1bmN0aW9uKHNwYXRoLCB2cG9pbnQpIHtcbiAgaWYgKHZwb2ludCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmIChzcGF0aC5sZW5ndGggPT09IDIpIHNwYXRoLnBvcCgpO1xuICBzcGF0aC5wdXNoKHZwb2ludCk7XG59O1xuXG4vLyBzZWxlY3Rpb24gZG9tYWluIGlzIHRoZSByYW5nZSBiZXR3ZWVuIGFuY2hvciBhbmQgYWN0aXZlIGVuZCBcbk9yZGVyZWRHZW9tZXRyeS5wcm90b3R5cGUuc2VsZWN0aW9uRG9tYWluID0gZnVuY3Rpb24gKHNwYXRoKSB7XG4gIHZhciBKID0gZGcubWFrZUVtcHR5TWFwKCk7XG4gIGlmIChzcGF0aC5sZW5ndGggPT09IDApIHJldHVybiBKO1xuXG4gIHZhciBiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZGcuYW5jaG9yKHNwYXRoKSwgZGcuYWN0aXZlRW5kKHNwYXRoKSkpO1xuICB2YXIgZSA9IE1hdGgubWluKHRoaXMuc2l6ZSgpLTEsIE1hdGgubWF4KGRnLmFuY2hvcihzcGF0aCksIGRnLmFjdGl2ZUVuZChzcGF0aCkpKTtcbiAgZm9yICh2YXIgaSA9IGI7IGk8PWU7ICsraSkgSi5zZXQoaSwgdHJ1ZSk7XG4gIHJldHVybiBKOyBcbn07XG5cbi8vIGl0ZXJhdGUgZnJvbSAwIHRvIHNpemUtMVxuT3JkZXJlZEdlb21ldHJ5LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gIHZhciBKID0gZGcubWFrZUVtcHR5TWFwKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplKCk7ICsraSkgaWYgKHByZWRpY2F0ZShpKSkgSi5zZXQoaSwgdHJ1ZSk7XG4gIHJldHVybiBKO1xufTtcblxuZXhwb3J0cy5PcmRlcmVkR2VvbWV0cnkgPSBPcmRlcmVkR2VvbWV0cnk7XG52YXIgVmVydGljYWxHZW9tZXRyeSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIE9yZGVyZWRHZW9tZXRyeS5jYWxsKHRoaXMsIHNpemUpO1xufTtcblxuVmVydGljYWxHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE9yZGVyZWRHZW9tZXRyeS5wcm90b3R5cGUpO1xuVmVydGljYWxHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBWZXJ0aWNhbEdlb21ldHJ5O1xuXG5WZXJ0aWNhbEdlb21ldHJ5LnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gKGRpciwgdnBvaW50KSB7XG4gIHN3aXRjaCAoZGlyKSB7XG4gICAgY2FzZSBkZy5VUDogcmV0dXJuIE1hdGgubWF4KDAsIHZwb2ludC0xKTtcbiAgICBjYXNlIGRnLkRPV046IHJldHVybiBNYXRoLm1pbih0aGlzLnNpemUoKS0xLCB2cG9pbnQrMSk7XG4gICAgZGVmYXVsdDogcmV0dXJuIHZwb2ludDtcbiAgfVxufTtcblxuVmVydGljYWxHZW9tZXRyeS5wcm90b3R5cGUuZGVmYXVsdEN1cnNvciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgc3dpdGNoIChkaXIpIHtcbiAgY2FzZSBkZy5VUDogcmV0dXJuIHRoaXMuc2l6ZSgpLTE7XG4gIGNhc2UgZGcuRE9XTjogcmV0dXJuIDA7IFxuICBkZWZhdWx0OiByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59O1xuXG5leHBvcnRzLlZlcnRpY2FsR2VvbWV0cnkgPSBWZXJ0aWNhbEdlb21ldHJ5O1xudmFyIEhvcml6b250YWxHZW9tZXRyeSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIE9yZGVyZWRHZW9tZXRyeS5jYWxsKHRoaXMsIHNpemUpO1xufTtcblxuSG9yaXpvbnRhbEdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoT3JkZXJlZEdlb21ldHJ5LnByb3RvdHlwZSk7XG5Ib3Jpem9udGFsR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSG9yaXpvbnRhbEdlb21ldHJ5O1xuXG5Ib3Jpem9udGFsR2VvbWV0cnkucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiAoZGlyLCB2cG9pbnQpIHtcbiAgc3dpdGNoIChkaXIpIHtcbiAgICBjYXNlIGRnLkxFRlQ6IHJldHVybiBNYXRoLm1heCgwLCB2cG9pbnQtMSk7XG4gICAgY2FzZSBkZy5SSUdIVDogcmV0dXJuIE1hdGgubWluKHRoaXMuc2l6ZSgpLTEsIHZwb2ludCsxKTtcbiAgICBkZWZhdWx0OiByZXR1cm4gdnBvaW50O1xuICB9XG59O1xuXG5Ib3Jpem9udGFsR2VvbWV0cnkucHJvdG90eXBlLmRlZmF1bHRDdXJzb3IgPSBmdW5jdGlvbiAoZGlyKSB7XG4gIHN3aXRjaCAoZGlyKSB7XG4gIGNhc2UgZGcuTEVGVDogcmV0dXJuIDA7IFxuICBjYXNlIGRnLlJJR0hUOiByZXR1cm4gdGhpcy5zaXplKCktMTtcbiAgZGVmYXVsdDogcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufTtcblxuZXhwb3J0cy5Ib3Jpem9udGFsR2VvbWV0cnkgPSBIb3Jpem9udGFsR2VvbWV0cnk7XG4iXX0=
