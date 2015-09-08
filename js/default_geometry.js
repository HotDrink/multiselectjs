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
