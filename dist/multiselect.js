(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.multiselect = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  /////////////////////////////////////////
  // This file is generated, do not edit //
  /////////////////////////////////////////

  // -------------------------------------------------------------------
  // utilities
  // -------------------------------------------------------------------
      function makeEmptySet() { return new Set(); }
      function makeEmptyMap() { return new Map(); }
    
      function isEmpty(collection) { return collection.size === 0; }
      function isSingleton(collection) { return collection.size === 1; }
    
      function firstKey(collection) {
        return collection.keys().next().value; 
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
      function equalKeys(a, b) { 
        if (a.size !== b.size) return false;
        for (var i of a.keys()) if (!b.has(i)) return false;
        return true;
      }
      function setUnion () {
        var s = makeEmptySet();
        for (var i=0; i<arguments.length; ++i) {
           for (var j of arguments[i].keys()) s.add(j);
        }
        return s;
      }
      function mapSymmetricDifference (left, right, leftValue, rightValue) {
        var s = makeEmptyMap();
        for (var i of left.keys()) if (!right.has(i)) s.set(i, leftValue);
        for (var i of right.keys()) if (!left.has(i)) s.set(i, rightValue);
        return s; 
      }
    const M_NONE = 1, 
          M_SHIFT = 2, 
          M_CMD = 3, 
          M_SHIFT_CMD = 4, 
          M_OPT = 5, 
          M_SHIFT_OPT = 6;
    
    function modifierKeys (evt) {
      
      if (evt.shiftKey && isCmdKey(evt)) return M_SHIFT_CMD;
      if (isCmdKey(evt)) return M_CMD;
      if (evt.shiftKey && evt.altKey) return M_SHIFT_OPT;
      if (evt.altKey) return M_OPT;
      if (evt.shiftKey) return M_SHIFT;
      return M_NONE;
      
      function isCmdKey (evt) { return evt.metaKey || evt.ctrlKey; }
    }

  // -------------------------------------------------------------------
  // selection functions 
  // -------------------------------------------------------------------
    function tt(_)  { return true; };  tt.constant  = true;
    function ff(_)  { return false; }; ff.constant  = true;
    function id(b)  { return b; };     id.constant  = false;
    function not(b) { return !b; };    not.constant = false;

  // -------------------------------------------------------------------
  // mapping from indices to truth values
  // -------------------------------------------------------------------
    function makeSelectionMapping () {
  
      var s = makeEmptySet();
  
      var func = function (i) { return s.has(i); };
  
      func.set = function (i, v) {
        if (v === true) s.add(i); else s.delete(i); 
      }
  
      func.selected = function() { return s.keys(); } 
  
      func.bake = function (op) {
        var s2 = op(func);
        op.domain.forEach(function(_, i) { func.set(i, s2(i)); });
      }
  
      return func;
    }

  // -------------------------------------------------------------------
  // primitive selection operations
  // -------------------------------------------------------------------
    function makeOp (f, domain) {
  
      var func;
      if (f.constant) {
        func = function (s) {
          return function (i) {
            return (domain.has(i)) ? f() : s(i);
          }
        }
      } else {
        func = function (s) {
          return function (i) {
            return (domain.has(i)) ? f(s(i)) : s(i);
          }
        }
      }
      
      func.f = f;
      func.domain = domain;
  
      return func;
    }

  // -------------------------------------------------------------------
  // composition of primitive selection operations
  // -------------------------------------------------------------------
      function makeOpComposition () {
  
        var ops = [];                
        var domain = makeEmptyMap(); 
        var gen = 0;                                                    
  
        var func = function (s) {
            return function (i) {
              return evaluate(domain.has(i) ? (ops.length-1) - (gen-domain.get(i)) : -1, i)(i);
            }
          
            // determine selection state of i but only access the elements 
            // of ops (staring from ind) that have i in their domain
            function evaluate(ind, i) {
              if (ind < 0) return s; // i defined in the base selection mapping s
              else {
                var op = ops[ind];
                return op(function (j) { return evaluate(ind - op.domain.get(i), j)(i); });
                // the call to evaluate is wrapped to a lambda to make the call lazy.
                // op will only call the lambda if op.f.constant is false
              }
            }
        }
       
        func.domain = domain;
        
        // member functions of func
                func.push = function (op) {
                  ops.push(op);
                  ++gen
                  op.domain.forEach(function(_, i) {
                    op.domain.set(i, domain.has(i) ? gen - domain.get(i) : ops.length);
                    domain.set(i, gen); 
                  });
                }
                func.pop = function () {
                  var n = ops.length;
                  var op = ops.pop();
                  --gen;
                  // domain updated for those elements that are in op.domain
                  op.domain.forEach(function (_, i) {
                    if (op.domain.get(i) >= n) domain.delete(i); // no op defines i
                    else domain.set(i, domain.get(i) - op.domain.get(i)); 
                  });
                  return op;
                }
                func.top = function () { return ops[ops.length - 1]; }
                func.top2 = function () { return ops[ops.length - 2]; }
                func.shift = function (bmap) {
                  var op = ops.shift();
                  op.domain.forEach(function(_, i) {
                    if (domain.get(i) - gen === ops.length) { domain.delete(i); }
                    // if lastOp the only op that defines i, remove i from domain
                  });
                  return op;
                }
                func.size = function () { return ops.length; }
                func.removeIndex = function (i) {
                  if (!domain.has(i)) return;
        
                  // find the first op in ops that defines i
                  var j = (ops.length - 1) - (gen - domain.get(i));
        
                  while (j >= 0) {
                    var d = ops[j].domain.get(i);
                    ops[j].domain.delete(i);
                    j -= d;
                  }
                  domain.delete(i);
                }
        
        return func;
      }

  // -------------------------------------------------------------------
  // selection state
  // -------------------------------------------------------------------
    function SelectionState (geometry, refresh, tracking, maxUndo) {
  
      if (refresh === undefined) refresh = function () {};
      if (tracking === undefined) tracking = false;
      if (maxUndo === undefined) maxUndo = 10;
  
      this._geometry = geometry;
      this._tracking = tracking;
      this._refresh = refresh;
      this._maxOps = Math.max(2, 2 * maxUndo);
      this.reset();
    }
    SelectionState.prototype.reset = function () {
  
      this._s = makeSelectionMapping();
      this._ops = makeOpComposition();
      this._spath = [];
      this._cursor = undefined;
  
      this._redoStack = [];
      this._current = this._ops(this._s); // current selection
      
      this._opsStatus = ACTIVE_NONE;        
      this._queuedCommand = function () {};
    };
  
    const ACTIVE_NONE = 0, ACTIVE_FILTER = 1, ACTIVE_SHIFT_CLICK_OR_SET_PATH = 2;
    const C_SHIFT_CLICK = 0, C_SET_PATH = 1;
    SelectionState.prototype.isSelected = function (i) { 
      this._flush();
      return this._current(i); 
    }
    SelectionState.prototype.selected = function () {
      this._flush();
      var J = makeEmptySet();
      for (var i of this._s.selected()) if (this._current(i)) J.add(i);
      for (var i of this._ops.domain.keys()) if (this._current(i)) J.add(i);
      return J;
    }
  
    SelectionState.prototype.click = function(vp) {
      this._flush();
      this._spath = []; 
      if (this._geometry.extendPath(this._spath, vp) !== null) this._cursor = vp;
  
      var J1 = this._callSelectionDomain(this._spath);
  
      if (clickIsNop.call(this, J1)) return this;
  
      var J0 = makeEmptyMap();
      for (var i of this._s.selected()) if (this._current(i)) J0.set(i, true);
      for (var i of this._ops.domain.keys()) if (this._current(i)) J0.set(i, true);
  
      this._ops.push(makeOp(ff, J0));
      this._ops.push(makeOp(tt, J1));
      this._bake();
  
      this._opsStatus = ACTIVE_SHIFT_CLICK_OR_SET_PATH;
  
      if (this._tracking) this._refresh(mapSymmetricDifference(J0, J1, false, true));
      else this._refresh(this._current);
      return this;
    };
    function clickIsNop(J) {      
      return this._ops.size() >= 2 &&
        this._ops.top2().f === ff && this._ops.top().f === tt && 
        equalKeys(J, this._ops.top().domain);
    }  
    SelectionState.prototype.cmdClick = function (vp, selmode) {
      this._flush();
      this._spath = []; 
      if (this._geometry.extendPath(this._spath, vp) !== null) this._cursor = vp;
  
      var J = this._callSelectionDomain(this._spath);
      var mode;
      if (selmode === undefined) mode = this._onSelectedIndex(J) ? ff : tt;
      else mode = selmode ? tt : ff;
  
      if (cmdClickIsNop.call(this, J, mode)) return this;
  
      var changed = makeEmptyMap();
      if (this._tracking) {
        for (var i of J.keys()) {
          var state = this._current(i);
          if (state !== mode(state)) changed.set(i, mode(state));
        }
      }
      this._ops.push(makeOp(id, makeEmptyMap()));
      this._ops.push(makeOp(mode, J));
      this._bake();
  
      this._opsStatus = ACTIVE_SHIFT_CLICK_OR_SET_PATH;
  
      this._refresh(this._tracking ? changed : this._current);
      return this;
    }
    function cmdClickIsNop(J, mode) {      
      return this._ops.size() >= 2 &&
        this._ops.top2().f === id && this._ops.top().f === mode &&
        isEmpty(J) && isEmpty(this._ops.top().domain);
    }  
    SelectionState.prototype.shiftClick = function (vp) {
  
      if (this._geometry.extendPath(this._spath, vp) === null) return this;
      this._cursor = this._spath[this._spath.length-1];
  
      if (this._queuedCommand.pending && 
          this._queuedCommand.type === C_SHIFT_CLICK) return this;
      else this._flush();
  
      this._queuedCommand = mkDelayedCommand(this, C_SHIFT_CLICK);
      setTimeout(this._queuedCommand, 0);
      return this;
    }
    function mkDelayedCommand(sel, cmdType) {
      var cmd = function () {
        if (cmd.pending === false) return null;
        cmd.pending = false;
  
        if (sel._opsStatus !== ACTIVE_SHIFT_CLICK_OR_SET_PATH) { 
          sel._opsStatus = ACTIVE_SHIFT_CLICK_OR_SET_PATH; 
          sel._addEmptyPair(); 
        }
  
        var changed = makeEmptyMap();
        var op = sel._ops.pop();
        var mode = op.f;
  
        var oldJ = sel._tracking ? copyMap(op.domain) : op.domain;
  
        var J = sel._callSelectionDomain(sel._spath, cmdType, oldJ);
  
        if (sel._tracking) {
          mapSymmetricDifference(J, op.domain, true, false).forEach((function(value, i) {
            var tmp = sel._current(i);
            if (mode(tmp) === tmp) return;
            if (value) changed.set(i, mode(tmp)); else changed.set(i, tmp);
          }).bind(sel));
        }
  
        sel._ops.push(makeOp(mode, J));
        sel._refresh(sel._tracking ? changed : sel._current);
      };
  
      cmd.pending = true;
      cmd.type = cmdType;
      return cmd;
    }
    SelectionState.prototype._callSelectionDomain = function (path, cmdType, J) {
      if (cmdType === undefined || cmdType !== this._previousCmdType) {
        this._previousCmdType = cmdType;
        if (path.length === 0) return makeEmptyMap();
        return this._geometry.selectionDomain(path);
      } else {
        if (path.length === 0) return makeEmptyMap();
        return this._geometry.selectionDomain(path, cmdType, J);
      }
    }
    SelectionState.prototype.setPath = function (path) {
      this._spath = path;
      this._cursor = activeEnd(path);
  
      if (this._queuedCommand.pending &&
          this._queuedCommand.type === C_SET_PATH) return this;
      else this._flush();
  
      this._queuedCommand = mkDelayedCommand(this, C_SET_PATH); 
      setTimeout(this._queuedCommand, 0);
      return this;
    }
    SelectionState.prototype._flush = function () { 
      this._queuedCommand();
    }
    SelectionState.prototype.onSelected = function (vp) {
      this._flush();
      var path = [];
      if (this._geometry.extendPath(path, vp) === null) return false;
      var J = this._callSelectionDomain(path);
      return this._onSelectedIndex(J);
    };
  
    SelectionState.prototype._onSelectedIndex = function (J) {
      return isSingleton(J) && this.isSelected(firstKey(J)); // isSelected calls _flush
    };
    SelectionState.prototype._addEmptyPair = function () {
      this._ops.push(makeOp(id, makeEmptyMap()));
      this._ops.push(makeOp(tt, makeEmptyMap()));
    }
    SelectionState.prototype._bake = function () {
      if (this._ops.size() > this._maxOps) {
        this._s.bake(this._ops.shift());
        this._s.bake(this._ops.shift());
      }
    }
    SelectionState.prototype.undo = function () {
      this._flush();
      this._spath = [];
  
      var changed = makeEmptyMap();
      if (this._ops.size() >= 2) {
        if (this._tracking) {
          for (var i of this._ops.top().domain.keys()) changed.set(i, this._current(i));
          for (var i of this._ops.top2().domain.keys()) changed.set(i, this._current(i));
        }
        this._redoStack.push(this._ops.pop());
        this._redoStack.push(this._ops.pop());
      }
      if (this._tracking) {
        for (var i of changed.keys()) {
          if (changed.get(i) === this._current(i)) changed.delete(i);
          else changed.set(i, this._current(i));
        }
      }
  
      // redoStack is not cleared ever,
      // so we limit its size (to same as undo stack's)
      if (this._redoStack.length > this._maxOps) {
        this._redoStack.shift();
        this._redoStack.shift();
      }
      this._opsStatus = ACTIVE_NONE;
      this._refresh(this._tracking ? changed : this._current);
      return this;
    }
  
    SelectionState.prototype.redo = function () {
      this._flush();
      this._spath = [];
  
      var changed = makeEmptyMap();
      if (this._redoStack.length >= 2) {
        var op = this._redoStack.pop();
        if (this._tracking) for (var i of op.domain.keys()) changed.set(i, this._current(i));
        this._ops.push(op);
        op = this._redoStack.pop();
        if (this._tracking) for (var i of op.domain.keys()) changed.set(i, this._current(i));
        this._ops.push(op);
      }
      if (this._tracking) {
        for (var i of changed.keys()) {
          if (changed.get(i) === this._current(i)) changed.delete(i);
          else changed.set(i, this._current(i));
        }
      }
      this._opsStatus = ACTIVE_NONE;
      this._refresh(this._tracking ? changed : this._current);
      return this;
    }
    SelectionState.prototype.setPath = function (path) {
      this._spath = path;
      this._cursor = activeEnd(path);
  
      if (this._queuedCommand.pending &&
          this._queuedCommand.type === C_SET_PATH) return this;
      else this._flush();
  
      this._queuedCommand = mkDelayedCommand(this, C_SET_PATH); 
      setTimeout(this._queuedCommand, 0);
      return this;
    }
  SelectionState.prototype.filter = function (predicate, state) {
    if (state !== false) mode = tt; else mode = ff;
  
    this._flush();
    this._spath = [];
    if (this._opsStatus !== ACTIVE_FILTER || 
        this._ops.size() >= 2 && this._ops.top().f !== mode) { // filter mode changed
      this._opsStatus = ACTIVE_FILTER; 
      this._addEmptyPair(); 
    }
  
    var changed = makeEmptyMap();
    var J = this._geometry.filter(predicate);
    var op = this._ops.pop();
  
    var self = this;
    if (this._tracking) {
      mapSymmetricDifference(J, op.domain, true, false).forEach((function(value, i) {
        var tmp = self._current(i);
        if (mode(tmp) === tmp) return;
        if (value) changed.set(i, mode(tmp)); else changed.set(i, tmp);
      }).bind(self));
    }
  
    this._ops.push(makeOp(mode, J));
  
    this._refresh(this._tracking ? changed : this._current);
    return this;
  }
  SelectionState.prototype.commit = function () {
    this._flush();
    this._opsStatus = ACTIVE_NONE;
  }
    SelectionState.prototype.setGeometry = function (geometry) {
      this._flush(); 
      this._spath = []; this._cursor = undefined;
      this.commit();
      this._geometry = geometry;
      return this;
    }
  SelectionState.prototype.geometry = function () { return this._geometry; }
  SelectionState.prototype.cursor = function () { return this._cursor; }
  SelectionState.prototype.selectionPath = function () { return this._spath; }
  function valueOrDefault(a, def) { return a === undefined ? def : a; }
  
  SelectionState.prototype.space = function () {
    if (!this._acquireCursor(NO_DIRECTION)) return this;
    return this.click(this._cursor);
  };
  SelectionState.prototype.cmdSpace = function (dir) {
    if (!this._acquireCursor(valueOrDefault(dir, NO_DIRECTION))) return this;
    return this.cmdClick(this._cursor);
  };
  SelectionState.prototype.shiftSpace = function (dir) {
    if (!this._acquireCursor(valueOrDefault(dir, NO_DIRECTION))) return this; 
    return this.shiftClick(this._cursor);
  };
  SelectionState.prototype.arrow = function (dir) {
    if (this._noCursor()) { this._acquireCursor(dir); return this; }
    this._cursor = this._geometry.step(dir, this._cursor);
    return this;
  }
  SelectionState.prototype.cmdArrow = function (dir) {
    if (this._noCursor()) return this.cmdSpace(dir);
    else return this.cmdSpace(dir).arrow(dir);
  };
  SelectionState.prototype.shiftArrow = function (dir) {
    if (this._noCursor()) return this.shiftSpace(dir);
    else return this.arrow(dir).shiftSpace(dir);
  }
    SelectionState.prototype._acquireCursor = function (dir) {
      this._cursor = valueOrDefault(this._cursor, this._geometry.defaultCursor(dir));
      return !(this._noCursor());
    }
    SelectionState.prototype._noCursor = function () { return this._cursor === undefined; }

//  
//  
//  
//  

  // -------------------------------------------------------------------
  // selection geometries
  // -------------------------------------------------------------------

  var DefaultGeometry = function () {};
  
  DefaultGeometry.prototype = {
    m2v : function (mp) { return mp; },
    extendPath : function (spath, vp) { 
      if (vp === null) return null;
      if (spath.length == 2) spath[1] = vp; else spath.push(vp); 
    }, 
    step : function (dir, vp) { return undefined; },
    selectionDomain : function(spath, source, J) { 
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

  // -------------------------------------------------------------------
  // exports
  // -------------------------------------------------------------------
    exports.SelectionState = SelectionState;
    exports.Selection = Selection;
  
    exports.UP = UP; 
    exports.DOWN = DOWN; 
    exports.LEFT = LEFT; 
    exports.RIGHT = RIGHT;
  
    exports.C_SHIFT_CLICK = C_SHIFT_CLICK;
    exports.C_SET_PATH = C_SET_PATH;
  
    exports.anchor = anchor;
    exports.activeEnd = activeEnd;
  
    exports.makeEmptyMap = makeEmptyMap;
  
    exports.DefaultGeometry = DefaultGeometry;
  
    // The following are helpers for defining event handlers
    exports.NONE = M_NONE;
    exports.SHIFT = M_SHIFT;
    exports.CMD = M_CMD;
    exports.SHIFT_CMD = M_SHIFT_CMD;
    exports.OPT = M_OPT;
    exports.SHIFT_OPT = M_SHIFT_OPT;
  
    exports.modifierKeys = modifierKeys;
    exports.detail = {};
    exports.detail.tt = tt;
    exports.detail.ff = ff;
    exports.detail.not = not;
    exports.detail.id = id;
  
    exports.detail.makeOp = makeOp;
    exports.detail.makeEmptySet = makeEmptySet;
    exports.detail.makeEmptyMap = makeEmptyMap;
  
    exports.detail.makeSelectionMapping = makeSelectionMapping;
    exports.detail.makeOpComposition = makeOpComposition;
  
    exports.detail.equalKeys = equalKeys;
    exports.detail.isEmpty = isEmpty;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tdWx0aXNlbGVjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBUaGlzIGZpbGUgaXMgZ2VuZXJhdGVkLCBkbyBub3QgZWRpdCAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gdXRpbGl0aWVzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGZ1bmN0aW9uIG1ha2VFbXB0eVNldCgpIHsgcmV0dXJuIG5ldyBTZXQoKTsgfVxuICAgICAgZnVuY3Rpb24gbWFrZUVtcHR5TWFwKCkgeyByZXR1cm4gbmV3IE1hcCgpOyB9XG4gICAgXG4gICAgICBmdW5jdGlvbiBpc0VtcHR5KGNvbGxlY3Rpb24pIHsgcmV0dXJuIGNvbGxlY3Rpb24uc2l6ZSA9PT0gMDsgfVxuICAgICAgZnVuY3Rpb24gaXNTaW5nbGV0b24oY29sbGVjdGlvbikgeyByZXR1cm4gY29sbGVjdGlvbi5zaXplID09PSAxOyB9XG4gICAgXG4gICAgICBmdW5jdGlvbiBmaXJzdEtleShjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uLmtleXMoKS5uZXh0KCkudmFsdWU7IFxuICAgICAgfVxuICAgIFxuICAgICAgZnVuY3Rpb24gY29weVNldCAocykgeyBcbiAgICAgICAgdmFyIHMyID0gbWFrZUVtcHR5U2V0KCk7XG4gICAgICAgIHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IHMyLmFkZChrZXkpOyB9KTtcbiAgICAgICAgcmV0dXJuIHMyO1xuICAgICAgfVxuICAgIFxuICAgICAgZnVuY3Rpb24gY29weU1hcCAocykgeyBcbiAgICAgICAgdmFyIHMyID0gbWFrZUVtcHR5TWFwKCk7XG4gICAgICAgIHMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkgeyBzMi5zZXQoa2V5LCB2YWx1ZSk7IH0pO1xuICAgICAgICByZXR1cm4gczI7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBlcXVhbEtleXMoYSwgYikgeyBcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgb2YgYS5rZXlzKCkpIGlmICghYi5oYXMoaSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBzZXRVbmlvbiAoKSB7XG4gICAgICAgIHZhciBzID0gbWFrZUVtcHR5U2V0KCk7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgZm9yICh2YXIgaiBvZiBhcmd1bWVudHNbaV0ua2V5cygpKSBzLmFkZChqKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIG1hcFN5bW1ldHJpY0RpZmZlcmVuY2UgKGxlZnQsIHJpZ2h0LCBsZWZ0VmFsdWUsIHJpZ2h0VmFsdWUpIHtcbiAgICAgICAgdmFyIHMgPSBtYWtlRW1wdHlNYXAoKTtcbiAgICAgICAgZm9yICh2YXIgaSBvZiBsZWZ0LmtleXMoKSkgaWYgKCFyaWdodC5oYXMoaSkpIHMuc2V0KGksIGxlZnRWYWx1ZSk7XG4gICAgICAgIGZvciAodmFyIGkgb2YgcmlnaHQua2V5cygpKSBpZiAoIWxlZnQuaGFzKGkpKSBzLnNldChpLCByaWdodFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHM7IFxuICAgICAgfVxuICAgIGNvbnN0IE1fTk9ORSA9IDEsIFxuICAgICAgICAgIE1fU0hJRlQgPSAyLCBcbiAgICAgICAgICBNX0NNRCA9IDMsIFxuICAgICAgICAgIE1fU0hJRlRfQ01EID0gNCwgXG4gICAgICAgICAgTV9PUFQgPSA1LCBcbiAgICAgICAgICBNX1NISUZUX09QVCA9IDY7XG4gICAgXG4gICAgZnVuY3Rpb24gbW9kaWZpZXJLZXlzIChldnQpIHtcbiAgICAgIFxuICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiBpc0NtZEtleShldnQpKSByZXR1cm4gTV9TSElGVF9DTUQ7XG4gICAgICBpZiAoaXNDbWRLZXkoZXZ0KSkgcmV0dXJuIE1fQ01EO1xuICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiBldnQuYWx0S2V5KSByZXR1cm4gTV9TSElGVF9PUFQ7XG4gICAgICBpZiAoZXZ0LmFsdEtleSkgcmV0dXJuIE1fT1BUO1xuICAgICAgaWYgKGV2dC5zaGlmdEtleSkgcmV0dXJuIE1fU0hJRlQ7XG4gICAgICByZXR1cm4gTV9OT05FO1xuICAgICAgXG4gICAgICBmdW5jdGlvbiBpc0NtZEtleSAoZXZ0KSB7IHJldHVybiBldnQubWV0YUtleSB8fCBldnQuY3RybEtleTsgfVxuICAgIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIHNlbGVjdGlvbiBmdW5jdGlvbnMgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbiB0dChfKSAgeyByZXR1cm4gdHJ1ZTsgfTsgIHR0LmNvbnN0YW50ICA9IHRydWU7XG4gICAgZnVuY3Rpb24gZmYoXykgIHsgcmV0dXJuIGZhbHNlOyB9OyBmZi5jb25zdGFudCAgPSB0cnVlO1xuICAgIGZ1bmN0aW9uIGlkKGIpICB7IHJldHVybiBiOyB9OyAgICAgaWQuY29uc3RhbnQgID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gbm90KGIpIHsgcmV0dXJuICFiOyB9OyAgICBub3QuY29uc3RhbnQgPSBmYWxzZTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIG1hcHBpbmcgZnJvbSBpbmRpY2VzIHRvIHRydXRoIHZhbHVlc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb24gbWFrZVNlbGVjdGlvbk1hcHBpbmcgKCkge1xuICBcbiAgICAgIHZhciBzID0gbWFrZUVtcHR5U2V0KCk7XG4gIFxuICAgICAgdmFyIGZ1bmMgPSBmdW5jdGlvbiAoaSkgeyByZXR1cm4gcy5oYXMoaSk7IH07XG4gIFxuICAgICAgZnVuYy5zZXQgPSBmdW5jdGlvbiAoaSwgdikge1xuICAgICAgICBpZiAodiA9PT0gdHJ1ZSkgcy5hZGQoaSk7IGVsc2Ugcy5kZWxldGUoaSk7IFxuICAgICAgfVxuICBcbiAgICAgIGZ1bmMuc2VsZWN0ZWQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHMua2V5cygpOyB9IFxuICBcbiAgICAgIGZ1bmMuYmFrZSA9IGZ1bmN0aW9uIChvcCkge1xuICAgICAgICB2YXIgczIgPSBvcChmdW5jKTtcbiAgICAgICAgb3AuZG9tYWluLmZvckVhY2goZnVuY3Rpb24oXywgaSkgeyBmdW5jLnNldChpLCBzMihpKSk7IH0pO1xuICAgICAgfVxuICBcbiAgICAgIHJldHVybiBmdW5jO1xuICAgIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIHByaW1pdGl2ZSBzZWxlY3Rpb24gb3BlcmF0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb24gbWFrZU9wIChmLCBkb21haW4pIHtcbiAgXG4gICAgICB2YXIgZnVuYztcbiAgICAgIGlmIChmLmNvbnN0YW50KSB7XG4gICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAocykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuIChkb21haW4uaGFzKGkpKSA/IGYoKSA6IHMoaSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmdW5jID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiAoZG9tYWluLmhhcyhpKSkgPyBmKHMoaSkpIDogcyhpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgZnVuYy5mID0gZjtcbiAgICAgIGZ1bmMuZG9tYWluID0gZG9tYWluO1xuICBcbiAgICAgIHJldHVybiBmdW5jO1xuICAgIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIGNvbXBvc2l0aW9uIG9mIHByaW1pdGl2ZSBzZWxlY3Rpb24gb3BlcmF0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBmdW5jdGlvbiBtYWtlT3BDb21wb3NpdGlvbiAoKSB7XG4gIFxuICAgICAgICB2YXIgb3BzID0gW107ICAgICAgICAgICAgICAgIFxuICAgICAgICB2YXIgZG9tYWluID0gbWFrZUVtcHR5TWFwKCk7IFxuICAgICAgICB2YXIgZ2VuID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIFxuICAgICAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGRvbWFpbi5oYXMoaSkgPyAob3BzLmxlbmd0aC0xKSAtIChnZW4tZG9tYWluLmdldChpKSkgOiAtMSwgaSkoaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgICAvLyBkZXRlcm1pbmUgc2VsZWN0aW9uIHN0YXRlIG9mIGkgYnV0IG9ubHkgYWNjZXNzIHRoZSBlbGVtZW50cyBcbiAgICAgICAgICAgIC8vIG9mIG9wcyAoc3RhcmluZyBmcm9tIGluZCkgdGhhdCBoYXZlIGkgaW4gdGhlaXIgZG9tYWluXG4gICAgICAgICAgICBmdW5jdGlvbiBldmFsdWF0ZShpbmQsIGkpIHtcbiAgICAgICAgICAgICAgaWYgKGluZCA8IDApIHJldHVybiBzOyAvLyBpIGRlZmluZWQgaW4gdGhlIGJhc2Ugc2VsZWN0aW9uIG1hcHBpbmcgc1xuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHNbaW5kXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AoZnVuY3Rpb24gKGopIHsgcmV0dXJuIGV2YWx1YXRlKGluZCAtIG9wLmRvbWFpbi5nZXQoaSksIGopKGkpOyB9KTtcbiAgICAgICAgICAgICAgICAvLyB0aGUgY2FsbCB0byBldmFsdWF0ZSBpcyB3cmFwcGVkIHRvIGEgbGFtYmRhIHRvIG1ha2UgdGhlIGNhbGwgbGF6eS5cbiAgICAgICAgICAgICAgICAvLyBvcCB3aWxsIG9ubHkgY2FsbCB0aGUgbGFtYmRhIGlmIG9wLmYuY29uc3RhbnQgaXMgZmFsc2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgXG4gICAgICAgIGZ1bmMuZG9tYWluID0gZG9tYWluO1xuICAgICAgICBcbiAgICAgICAgLy8gbWVtYmVyIGZ1bmN0aW9ucyBvZiBmdW5jXG4gICAgICAgICAgICAgICAgZnVuYy5wdXNoID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICAgICAgICBvcHMucHVzaChvcCk7XG4gICAgICAgICAgICAgICAgICArK2dlblxuICAgICAgICAgICAgICAgICAgb3AuZG9tYWluLmZvckVhY2goZnVuY3Rpb24oXywgaSkge1xuICAgICAgICAgICAgICAgICAgICBvcC5kb21haW4uc2V0KGksIGRvbWFpbi5oYXMoaSkgPyBnZW4gLSBkb21haW4uZ2V0KGkpIDogb3BzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5zZXQoaSwgZ2VuKTsgXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuYy5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgbiA9IG9wcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAtLWdlbjtcbiAgICAgICAgICAgICAgICAgIC8vIGRvbWFpbiB1cGRhdGVkIGZvciB0aG9zZSBlbGVtZW50cyB0aGF0IGFyZSBpbiBvcC5kb21haW5cbiAgICAgICAgICAgICAgICAgIG9wLmRvbWFpbi5mb3JFYWNoKGZ1bmN0aW9uIChfLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcC5kb21haW4uZ2V0KGkpID49IG4pIGRvbWFpbi5kZWxldGUoaSk7IC8vIG5vIG9wIGRlZmluZXMgaVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGRvbWFpbi5zZXQoaSwgZG9tYWluLmdldChpKSAtIG9wLmRvbWFpbi5nZXQoaSkpOyBcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmdW5jLnRvcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9wc1tvcHMubGVuZ3RoIC0gMV07IH1cbiAgICAgICAgICAgICAgICBmdW5jLnRvcDIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBvcHNbb3BzLmxlbmd0aCAtIDJdOyB9XG4gICAgICAgICAgICAgICAgZnVuYy5zaGlmdCA9IGZ1bmN0aW9uIChibWFwKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgIG9wLmRvbWFpbi5mb3JFYWNoKGZ1bmN0aW9uKF8sIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbWFpbi5nZXQoaSkgLSBnZW4gPT09IG9wcy5sZW5ndGgpIHsgZG9tYWluLmRlbGV0ZShpKTsgfVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBsYXN0T3AgdGhlIG9ubHkgb3AgdGhhdCBkZWZpbmVzIGksIHJlbW92ZSBpIGZyb20gZG9tYWluXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnVuYy5zaXplID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gb3BzLmxlbmd0aDsgfVxuICAgICAgICAgICAgICAgIGZ1bmMucmVtb3ZlSW5kZXggPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgICAgaWYgKCFkb21haW4uaGFzKGkpKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgZmlyc3Qgb3AgaW4gb3BzIHRoYXQgZGVmaW5lcyBpXG4gICAgICAgICAgICAgICAgICB2YXIgaiA9IChvcHMubGVuZ3RoIC0gMSkgLSAoZ2VuIC0gZG9tYWluLmdldChpKSk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgICAgd2hpbGUgKGogPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IG9wc1tqXS5kb21haW4uZ2V0KGkpO1xuICAgICAgICAgICAgICAgICAgICBvcHNbal0uZG9tYWluLmRlbGV0ZShpKTtcbiAgICAgICAgICAgICAgICAgICAgaiAtPSBkO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZG9tYWluLmRlbGV0ZShpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZnVuYztcbiAgICAgIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIHNlbGVjdGlvbiBzdGF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb24gU2VsZWN0aW9uU3RhdGUgKGdlb21ldHJ5LCByZWZyZXNoLCB0cmFja2luZywgbWF4VW5kbykge1xuICBcbiAgICAgIGlmIChyZWZyZXNoID09PSB1bmRlZmluZWQpIHJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgIGlmICh0cmFja2luZyA9PT0gdW5kZWZpbmVkKSB0cmFja2luZyA9IGZhbHNlO1xuICAgICAgaWYgKG1heFVuZG8gPT09IHVuZGVmaW5lZCkgbWF4VW5kbyA9IDEwO1xuICBcbiAgICAgIHRoaXMuX2dlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgICB0aGlzLl90cmFja2luZyA9IHRyYWNraW5nO1xuICAgICAgdGhpcy5fcmVmcmVzaCA9IHJlZnJlc2g7XG4gICAgICB0aGlzLl9tYXhPcHMgPSBNYXRoLm1heCgyLCAyICogbWF4VW5kbyk7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgfVxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgXG4gICAgICB0aGlzLl9zID0gbWFrZVNlbGVjdGlvbk1hcHBpbmcoKTtcbiAgICAgIHRoaXMuX29wcyA9IG1ha2VPcENvbXBvc2l0aW9uKCk7XG4gICAgICB0aGlzLl9zcGF0aCA9IFtdO1xuICAgICAgdGhpcy5fY3Vyc29yID0gdW5kZWZpbmVkO1xuICBcbiAgICAgIHRoaXMuX3JlZG9TdGFjayA9IFtdO1xuICAgICAgdGhpcy5fY3VycmVudCA9IHRoaXMuX29wcyh0aGlzLl9zKTsgLy8gY3VycmVudCBzZWxlY3Rpb25cbiAgICAgIFxuICAgICAgdGhpcy5fb3BzU3RhdHVzID0gQUNUSVZFX05PTkU7ICAgICAgICBcbiAgICAgIHRoaXMuX3F1ZXVlZENvbW1hbmQgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICB9O1xuICBcbiAgICBjb25zdCBBQ1RJVkVfTk9ORSA9IDAsIEFDVElWRV9GSUxURVIgPSAxLCBBQ1RJVkVfU0hJRlRfQ0xJQ0tfT1JfU0VUX1BBVEggPSAyO1xuICAgIGNvbnN0IENfU0hJRlRfQ0xJQ0sgPSAwLCBDX1NFVF9QQVRIID0gMTtcbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChpKSB7IFxuICAgICAgdGhpcy5fZmx1c2goKTtcbiAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50KGkpOyBcbiAgICB9XG4gICAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLnNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fZmx1c2goKTtcbiAgICAgIHZhciBKID0gbWFrZUVtcHR5U2V0KCk7XG4gICAgICBmb3IgKHZhciBpIG9mIHRoaXMuX3Muc2VsZWN0ZWQoKSkgaWYgKHRoaXMuX2N1cnJlbnQoaSkpIEouYWRkKGkpO1xuICAgICAgZm9yICh2YXIgaSBvZiB0aGlzLl9vcHMuZG9tYWluLmtleXMoKSkgaWYgKHRoaXMuX2N1cnJlbnQoaSkpIEouYWRkKGkpO1xuICAgICAgcmV0dXJuIEo7XG4gICAgfVxuICBcbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuY2xpY2sgPSBmdW5jdGlvbih2cCkge1xuICAgICAgdGhpcy5fZmx1c2goKTtcbiAgICAgIHRoaXMuX3NwYXRoID0gW107IFxuICAgICAgaWYgKHRoaXMuX2dlb21ldHJ5LmV4dGVuZFBhdGgodGhpcy5fc3BhdGgsIHZwKSAhPT0gbnVsbCkgdGhpcy5fY3Vyc29yID0gdnA7XG4gIFxuICAgICAgdmFyIEoxID0gdGhpcy5fY2FsbFNlbGVjdGlvbkRvbWFpbih0aGlzLl9zcGF0aCk7XG4gIFxuICAgICAgaWYgKGNsaWNrSXNOb3AuY2FsbCh0aGlzLCBKMSkpIHJldHVybiB0aGlzO1xuICBcbiAgICAgIHZhciBKMCA9IG1ha2VFbXB0eU1hcCgpO1xuICAgICAgZm9yICh2YXIgaSBvZiB0aGlzLl9zLnNlbGVjdGVkKCkpIGlmICh0aGlzLl9jdXJyZW50KGkpKSBKMC5zZXQoaSwgdHJ1ZSk7XG4gICAgICBmb3IgKHZhciBpIG9mIHRoaXMuX29wcy5kb21haW4ua2V5cygpKSBpZiAodGhpcy5fY3VycmVudChpKSkgSjAuc2V0KGksIHRydWUpO1xuICBcbiAgICAgIHRoaXMuX29wcy5wdXNoKG1ha2VPcChmZiwgSjApKTtcbiAgICAgIHRoaXMuX29wcy5wdXNoKG1ha2VPcCh0dCwgSjEpKTtcbiAgICAgIHRoaXMuX2Jha2UoKTtcbiAgXG4gICAgICB0aGlzLl9vcHNTdGF0dXMgPSBBQ1RJVkVfU0hJRlRfQ0xJQ0tfT1JfU0VUX1BBVEg7XG4gIFxuICAgICAgaWYgKHRoaXMuX3RyYWNraW5nKSB0aGlzLl9yZWZyZXNoKG1hcFN5bW1ldHJpY0RpZmZlcmVuY2UoSjAsIEoxLCBmYWxzZSwgdHJ1ZSkpO1xuICAgICAgZWxzZSB0aGlzLl9yZWZyZXNoKHRoaXMuX2N1cnJlbnQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBjbGlja0lzTm9wKEopIHsgICAgICBcbiAgICAgIHJldHVybiB0aGlzLl9vcHMuc2l6ZSgpID49IDIgJiZcbiAgICAgICAgdGhpcy5fb3BzLnRvcDIoKS5mID09PSBmZiAmJiB0aGlzLl9vcHMudG9wKCkuZiA9PT0gdHQgJiYgXG4gICAgICAgIGVxdWFsS2V5cyhKLCB0aGlzLl9vcHMudG9wKCkuZG9tYWluKTtcbiAgICB9ICBcbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuY21kQ2xpY2sgPSBmdW5jdGlvbiAodnAsIHNlbG1vZGUpIHtcbiAgICAgIHRoaXMuX2ZsdXNoKCk7XG4gICAgICB0aGlzLl9zcGF0aCA9IFtdOyBcbiAgICAgIGlmICh0aGlzLl9nZW9tZXRyeS5leHRlbmRQYXRoKHRoaXMuX3NwYXRoLCB2cCkgIT09IG51bGwpIHRoaXMuX2N1cnNvciA9IHZwO1xuICBcbiAgICAgIHZhciBKID0gdGhpcy5fY2FsbFNlbGVjdGlvbkRvbWFpbih0aGlzLl9zcGF0aCk7XG4gICAgICB2YXIgbW9kZTtcbiAgICAgIGlmIChzZWxtb2RlID09PSB1bmRlZmluZWQpIG1vZGUgPSB0aGlzLl9vblNlbGVjdGVkSW5kZXgoSikgPyBmZiA6IHR0O1xuICAgICAgZWxzZSBtb2RlID0gc2VsbW9kZSA/IHR0IDogZmY7XG4gIFxuICAgICAgaWYgKGNtZENsaWNrSXNOb3AuY2FsbCh0aGlzLCBKLCBtb2RlKSkgcmV0dXJuIHRoaXM7XG4gIFxuICAgICAgdmFyIGNoYW5nZWQgPSBtYWtlRW1wdHlNYXAoKTtcbiAgICAgIGlmICh0aGlzLl90cmFja2luZykge1xuICAgICAgICBmb3IgKHZhciBpIG9mIEoua2V5cygpKSB7XG4gICAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5fY3VycmVudChpKTtcbiAgICAgICAgICBpZiAoc3RhdGUgIT09IG1vZGUoc3RhdGUpKSBjaGFuZ2VkLnNldChpLCBtb2RlKHN0YXRlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX29wcy5wdXNoKG1ha2VPcChpZCwgbWFrZUVtcHR5TWFwKCkpKTtcbiAgICAgIHRoaXMuX29wcy5wdXNoKG1ha2VPcChtb2RlLCBKKSk7XG4gICAgICB0aGlzLl9iYWtlKCk7XG4gIFxuICAgICAgdGhpcy5fb3BzU3RhdHVzID0gQUNUSVZFX1NISUZUX0NMSUNLX09SX1NFVF9QQVRIO1xuICBcbiAgICAgIHRoaXMuX3JlZnJlc2godGhpcy5fdHJhY2tpbmcgPyBjaGFuZ2VkIDogdGhpcy5fY3VycmVudCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZnVuY3Rpb24gY21kQ2xpY2tJc05vcChKLCBtb2RlKSB7ICAgICAgXG4gICAgICByZXR1cm4gdGhpcy5fb3BzLnNpemUoKSA+PSAyICYmXG4gICAgICAgIHRoaXMuX29wcy50b3AyKCkuZiA9PT0gaWQgJiYgdGhpcy5fb3BzLnRvcCgpLmYgPT09IG1vZGUgJiZcbiAgICAgICAgaXNFbXB0eShKKSAmJiBpc0VtcHR5KHRoaXMuX29wcy50b3AoKS5kb21haW4pO1xuICAgIH0gIFxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5zaGlmdENsaWNrID0gZnVuY3Rpb24gKHZwKSB7XG4gIFxuICAgICAgaWYgKHRoaXMuX2dlb21ldHJ5LmV4dGVuZFBhdGgodGhpcy5fc3BhdGgsIHZwKSA9PT0gbnVsbCkgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9zcGF0aFt0aGlzLl9zcGF0aC5sZW5ndGgtMV07XG4gIFxuICAgICAgaWYgKHRoaXMuX3F1ZXVlZENvbW1hbmQucGVuZGluZyAmJiBcbiAgICAgICAgICB0aGlzLl9xdWV1ZWRDb21tYW5kLnR5cGUgPT09IENfU0hJRlRfQ0xJQ0spIHJldHVybiB0aGlzO1xuICAgICAgZWxzZSB0aGlzLl9mbHVzaCgpO1xuICBcbiAgICAgIHRoaXMuX3F1ZXVlZENvbW1hbmQgPSBta0RlbGF5ZWRDb21tYW5kKHRoaXMsIENfU0hJRlRfQ0xJQ0spO1xuICAgICAgc2V0VGltZW91dCh0aGlzLl9xdWV1ZWRDb21tYW5kLCAwKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBta0RlbGF5ZWRDb21tYW5kKHNlbCwgY21kVHlwZSkge1xuICAgICAgdmFyIGNtZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGNtZC5wZW5kaW5nID09PSBmYWxzZSkgcmV0dXJuIG51bGw7XG4gICAgICAgIGNtZC5wZW5kaW5nID0gZmFsc2U7XG4gIFxuICAgICAgICBpZiAoc2VsLl9vcHNTdGF0dXMgIT09IEFDVElWRV9TSElGVF9DTElDS19PUl9TRVRfUEFUSCkgeyBcbiAgICAgICAgICBzZWwuX29wc1N0YXR1cyA9IEFDVElWRV9TSElGVF9DTElDS19PUl9TRVRfUEFUSDsgXG4gICAgICAgICAgc2VsLl9hZGRFbXB0eVBhaXIoKTsgXG4gICAgICAgIH1cbiAgXG4gICAgICAgIHZhciBjaGFuZ2VkID0gbWFrZUVtcHR5TWFwKCk7XG4gICAgICAgIHZhciBvcCA9IHNlbC5fb3BzLnBvcCgpO1xuICAgICAgICB2YXIgbW9kZSA9IG9wLmY7XG4gIFxuICAgICAgICB2YXIgb2xkSiA9IHNlbC5fdHJhY2tpbmcgPyBjb3B5TWFwKG9wLmRvbWFpbikgOiBvcC5kb21haW47XG4gIFxuICAgICAgICB2YXIgSiA9IHNlbC5fY2FsbFNlbGVjdGlvbkRvbWFpbihzZWwuX3NwYXRoLCBjbWRUeXBlLCBvbGRKKTtcbiAgXG4gICAgICAgIGlmIChzZWwuX3RyYWNraW5nKSB7XG4gICAgICAgICAgbWFwU3ltbWV0cmljRGlmZmVyZW5jZShKLCBvcC5kb21haW4sIHRydWUsIGZhbHNlKS5mb3JFYWNoKChmdW5jdGlvbih2YWx1ZSwgaSkge1xuICAgICAgICAgICAgdmFyIHRtcCA9IHNlbC5fY3VycmVudChpKTtcbiAgICAgICAgICAgIGlmIChtb2RlKHRtcCkgPT09IHRtcCkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSBjaGFuZ2VkLnNldChpLCBtb2RlKHRtcCkpOyBlbHNlIGNoYW5nZWQuc2V0KGksIHRtcCk7XG4gICAgICAgICAgfSkuYmluZChzZWwpKTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgc2VsLl9vcHMucHVzaChtYWtlT3AobW9kZSwgSikpO1xuICAgICAgICBzZWwuX3JlZnJlc2goc2VsLl90cmFja2luZyA/IGNoYW5nZWQgOiBzZWwuX2N1cnJlbnQpO1xuICAgICAgfTtcbiAgXG4gICAgICBjbWQucGVuZGluZyA9IHRydWU7XG4gICAgICBjbWQudHlwZSA9IGNtZFR5cGU7XG4gICAgICByZXR1cm4gY21kO1xuICAgIH1cbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuX2NhbGxTZWxlY3Rpb25Eb21haW4gPSBmdW5jdGlvbiAocGF0aCwgY21kVHlwZSwgSikge1xuICAgICAgaWYgKGNtZFR5cGUgPT09IHVuZGVmaW5lZCB8fCBjbWRUeXBlICE9PSB0aGlzLl9wcmV2aW91c0NtZFR5cGUpIHtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNDbWRUeXBlID0gY21kVHlwZTtcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gbWFrZUVtcHR5TWFwKCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZW9tZXRyeS5zZWxlY3Rpb25Eb21haW4ocGF0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiBtYWtlRW1wdHlNYXAoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dlb21ldHJ5LnNlbGVjdGlvbkRvbWFpbihwYXRoLCBjbWRUeXBlLCBKKTtcbiAgICAgIH1cbiAgICB9XG4gICAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLnNldFBhdGggPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgdGhpcy5fc3BhdGggPSBwYXRoO1xuICAgICAgdGhpcy5fY3Vyc29yID0gYWN0aXZlRW5kKHBhdGgpO1xuICBcbiAgICAgIGlmICh0aGlzLl9xdWV1ZWRDb21tYW5kLnBlbmRpbmcgJiZcbiAgICAgICAgICB0aGlzLl9xdWV1ZWRDb21tYW5kLnR5cGUgPT09IENfU0VUX1BBVEgpIHJldHVybiB0aGlzO1xuICAgICAgZWxzZSB0aGlzLl9mbHVzaCgpO1xuICBcbiAgICAgIHRoaXMuX3F1ZXVlZENvbW1hbmQgPSBta0RlbGF5ZWRDb21tYW5kKHRoaXMsIENfU0VUX1BBVEgpOyBcbiAgICAgIHNldFRpbWVvdXQodGhpcy5fcXVldWVkQ29tbWFuZCwgMCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLl9mbHVzaCA9IGZ1bmN0aW9uICgpIHsgXG4gICAgICB0aGlzLl9xdWV1ZWRDb21tYW5kKCk7XG4gICAgfVxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5vblNlbGVjdGVkID0gZnVuY3Rpb24gKHZwKSB7XG4gICAgICB0aGlzLl9mbHVzaCgpO1xuICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgIGlmICh0aGlzLl9nZW9tZXRyeS5leHRlbmRQYXRoKHBhdGgsIHZwKSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIEogPSB0aGlzLl9jYWxsU2VsZWN0aW9uRG9tYWluKHBhdGgpO1xuICAgICAgcmV0dXJuIHRoaXMuX29uU2VsZWN0ZWRJbmRleChKKTtcbiAgICB9O1xuICBcbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuX29uU2VsZWN0ZWRJbmRleCA9IGZ1bmN0aW9uIChKKSB7XG4gICAgICByZXR1cm4gaXNTaW5nbGV0b24oSikgJiYgdGhpcy5pc1NlbGVjdGVkKGZpcnN0S2V5KEopKTsgLy8gaXNTZWxlY3RlZCBjYWxscyBfZmx1c2hcbiAgICB9O1xuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5fYWRkRW1wdHlQYWlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fb3BzLnB1c2gobWFrZU9wKGlkLCBtYWtlRW1wdHlNYXAoKSkpO1xuICAgICAgdGhpcy5fb3BzLnB1c2gobWFrZU9wKHR0LCBtYWtlRW1wdHlNYXAoKSkpO1xuICAgIH1cbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuX2Jha2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5fb3BzLnNpemUoKSA+IHRoaXMuX21heE9wcykge1xuICAgICAgICB0aGlzLl9zLmJha2UodGhpcy5fb3BzLnNoaWZ0KCkpO1xuICAgICAgICB0aGlzLl9zLmJha2UodGhpcy5fb3BzLnNoaWZ0KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuX2ZsdXNoKCk7XG4gICAgICB0aGlzLl9zcGF0aCA9IFtdO1xuICBcbiAgICAgIHZhciBjaGFuZ2VkID0gbWFrZUVtcHR5TWFwKCk7XG4gICAgICBpZiAodGhpcy5fb3BzLnNpemUoKSA+PSAyKSB7XG4gICAgICAgIGlmICh0aGlzLl90cmFja2luZykge1xuICAgICAgICAgIGZvciAodmFyIGkgb2YgdGhpcy5fb3BzLnRvcCgpLmRvbWFpbi5rZXlzKCkpIGNoYW5nZWQuc2V0KGksIHRoaXMuX2N1cnJlbnQoaSkpO1xuICAgICAgICAgIGZvciAodmFyIGkgb2YgdGhpcy5fb3BzLnRvcDIoKS5kb21haW4ua2V5cygpKSBjaGFuZ2VkLnNldChpLCB0aGlzLl9jdXJyZW50KGkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWRvU3RhY2sucHVzaCh0aGlzLl9vcHMucG9wKCkpO1xuICAgICAgICB0aGlzLl9yZWRvU3RhY2sucHVzaCh0aGlzLl9vcHMucG9wKCkpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3RyYWNraW5nKSB7XG4gICAgICAgIGZvciAodmFyIGkgb2YgY2hhbmdlZC5rZXlzKCkpIHtcbiAgICAgICAgICBpZiAoY2hhbmdlZC5nZXQoaSkgPT09IHRoaXMuX2N1cnJlbnQoaSkpIGNoYW5nZWQuZGVsZXRlKGkpO1xuICAgICAgICAgIGVsc2UgY2hhbmdlZC5zZXQoaSwgdGhpcy5fY3VycmVudChpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICAvLyByZWRvU3RhY2sgaXMgbm90IGNsZWFyZWQgZXZlcixcbiAgICAgIC8vIHNvIHdlIGxpbWl0IGl0cyBzaXplICh0byBzYW1lIGFzIHVuZG8gc3RhY2sncylcbiAgICAgIGlmICh0aGlzLl9yZWRvU3RhY2subGVuZ3RoID4gdGhpcy5fbWF4T3BzKSB7XG4gICAgICAgIHRoaXMuX3JlZG9TdGFjay5zaGlmdCgpO1xuICAgICAgICB0aGlzLl9yZWRvU3RhY2suc2hpZnQoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29wc1N0YXR1cyA9IEFDVElWRV9OT05FO1xuICAgICAgdGhpcy5fcmVmcmVzaCh0aGlzLl90cmFja2luZyA/IGNoYW5nZWQgOiB0aGlzLl9jdXJyZW50KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgXG4gICAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLnJlZG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl9mbHVzaCgpO1xuICAgICAgdGhpcy5fc3BhdGggPSBbXTtcbiAgXG4gICAgICB2YXIgY2hhbmdlZCA9IG1ha2VFbXB0eU1hcCgpO1xuICAgICAgaWYgKHRoaXMuX3JlZG9TdGFjay5sZW5ndGggPj0gMikge1xuICAgICAgICB2YXIgb3AgPSB0aGlzLl9yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICh0aGlzLl90cmFja2luZykgZm9yICh2YXIgaSBvZiBvcC5kb21haW4ua2V5cygpKSBjaGFuZ2VkLnNldChpLCB0aGlzLl9jdXJyZW50KGkpKTtcbiAgICAgICAgdGhpcy5fb3BzLnB1c2gob3ApO1xuICAgICAgICBvcCA9IHRoaXMuX3JlZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKHRoaXMuX3RyYWNraW5nKSBmb3IgKHZhciBpIG9mIG9wLmRvbWFpbi5rZXlzKCkpIGNoYW5nZWQuc2V0KGksIHRoaXMuX2N1cnJlbnQoaSkpO1xuICAgICAgICB0aGlzLl9vcHMucHVzaChvcCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fdHJhY2tpbmcpIHtcbiAgICAgICAgZm9yICh2YXIgaSBvZiBjaGFuZ2VkLmtleXMoKSkge1xuICAgICAgICAgIGlmIChjaGFuZ2VkLmdldChpKSA9PT0gdGhpcy5fY3VycmVudChpKSkgY2hhbmdlZC5kZWxldGUoaSk7XG4gICAgICAgICAgZWxzZSBjaGFuZ2VkLnNldChpLCB0aGlzLl9jdXJyZW50KGkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fb3BzU3RhdHVzID0gQUNUSVZFX05PTkU7XG4gICAgICB0aGlzLl9yZWZyZXNoKHRoaXMuX3RyYWNraW5nID8gY2hhbmdlZCA6IHRoaXMuX2N1cnJlbnQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5zZXRQYXRoID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgIHRoaXMuX3NwYXRoID0gcGF0aDtcbiAgICAgIHRoaXMuX2N1cnNvciA9IGFjdGl2ZUVuZChwYXRoKTtcbiAgXG4gICAgICBpZiAodGhpcy5fcXVldWVkQ29tbWFuZC5wZW5kaW5nICYmXG4gICAgICAgICAgdGhpcy5fcXVldWVkQ29tbWFuZC50eXBlID09PSBDX1NFVF9QQVRIKSByZXR1cm4gdGhpcztcbiAgICAgIGVsc2UgdGhpcy5fZmx1c2goKTtcbiAgXG4gICAgICB0aGlzLl9xdWV1ZWRDb21tYW5kID0gbWtEZWxheWVkQ29tbWFuZCh0aGlzLCBDX1NFVF9QQVRIKTsgXG4gICAgICBzZXRUaW1lb3V0KHRoaXMuX3F1ZXVlZENvbW1hbmQsIDApO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKHByZWRpY2F0ZSwgc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgIT09IGZhbHNlKSBtb2RlID0gdHQ7IGVsc2UgbW9kZSA9IGZmO1xuICBcbiAgICB0aGlzLl9mbHVzaCgpO1xuICAgIHRoaXMuX3NwYXRoID0gW107XG4gICAgaWYgKHRoaXMuX29wc1N0YXR1cyAhPT0gQUNUSVZFX0ZJTFRFUiB8fCBcbiAgICAgICAgdGhpcy5fb3BzLnNpemUoKSA+PSAyICYmIHRoaXMuX29wcy50b3AoKS5mICE9PSBtb2RlKSB7IC8vIGZpbHRlciBtb2RlIGNoYW5nZWRcbiAgICAgIHRoaXMuX29wc1N0YXR1cyA9IEFDVElWRV9GSUxURVI7IFxuICAgICAgdGhpcy5fYWRkRW1wdHlQYWlyKCk7IFxuICAgIH1cbiAgXG4gICAgdmFyIGNoYW5nZWQgPSBtYWtlRW1wdHlNYXAoKTtcbiAgICB2YXIgSiA9IHRoaXMuX2dlb21ldHJ5LmZpbHRlcihwcmVkaWNhdGUpO1xuICAgIHZhciBvcCA9IHRoaXMuX29wcy5wb3AoKTtcbiAgXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICh0aGlzLl90cmFja2luZykge1xuICAgICAgbWFwU3ltbWV0cmljRGlmZmVyZW5jZShKLCBvcC5kb21haW4sIHRydWUsIGZhbHNlKS5mb3JFYWNoKChmdW5jdGlvbih2YWx1ZSwgaSkge1xuICAgICAgICB2YXIgdG1wID0gc2VsZi5fY3VycmVudChpKTtcbiAgICAgICAgaWYgKG1vZGUodG1wKSA9PT0gdG1wKSByZXR1cm47XG4gICAgICAgIGlmICh2YWx1ZSkgY2hhbmdlZC5zZXQoaSwgbW9kZSh0bXApKTsgZWxzZSBjaGFuZ2VkLnNldChpLCB0bXApO1xuICAgICAgfSkuYmluZChzZWxmKSk7XG4gICAgfVxuICBcbiAgICB0aGlzLl9vcHMucHVzaChtYWtlT3AobW9kZSwgSikpO1xuICBcbiAgICB0aGlzLl9yZWZyZXNoKHRoaXMuX3RyYWNraW5nID8gY2hhbmdlZCA6IHRoaXMuX2N1cnJlbnQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5jb21taXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZmx1c2goKTtcbiAgICB0aGlzLl9vcHNTdGF0dXMgPSBBQ1RJVkVfTk9ORTtcbiAgfVxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5zZXRHZW9tZXRyeSA9IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuICAgICAgdGhpcy5fZmx1c2goKTsgXG4gICAgICB0aGlzLl9zcGF0aCA9IFtdOyB0aGlzLl9jdXJzb3IgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmNvbW1pdCgpO1xuICAgICAgdGhpcy5fZ2VvbWV0cnkgPSBnZW9tZXRyeTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLmdlb21ldHJ5ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fZ2VvbWV0cnk7IH1cbiAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLmN1cnNvciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2N1cnNvcjsgfVxuICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuc2VsZWN0aW9uUGF0aCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX3NwYXRoOyB9XG4gIGZ1bmN0aW9uIHZhbHVlT3JEZWZhdWx0KGEsIGRlZikgeyByZXR1cm4gYSA9PT0gdW5kZWZpbmVkID8gZGVmIDogYTsgfVxuICBcbiAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLnNwYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5fYWNxdWlyZUN1cnNvcihOT19ESVJFQ1RJT04pKSByZXR1cm4gdGhpcztcbiAgICByZXR1cm4gdGhpcy5jbGljayh0aGlzLl9jdXJzb3IpO1xuICB9O1xuICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuY21kU3BhY2UgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgaWYgKCF0aGlzLl9hY3F1aXJlQ3Vyc29yKHZhbHVlT3JEZWZhdWx0KGRpciwgTk9fRElSRUNUSU9OKSkpIHJldHVybiB0aGlzO1xuICAgIHJldHVybiB0aGlzLmNtZENsaWNrKHRoaXMuX2N1cnNvcik7XG4gIH07XG4gIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5zaGlmdFNwYWNlID0gZnVuY3Rpb24gKGRpcikge1xuICAgIGlmICghdGhpcy5fYWNxdWlyZUN1cnNvcih2YWx1ZU9yRGVmYXVsdChkaXIsIE5PX0RJUkVDVElPTikpKSByZXR1cm4gdGhpczsgXG4gICAgcmV0dXJuIHRoaXMuc2hpZnRDbGljayh0aGlzLl9jdXJzb3IpO1xuICB9O1xuICBTZWxlY3Rpb25TdGF0ZS5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgaWYgKHRoaXMuX25vQ3Vyc29yKCkpIHsgdGhpcy5fYWNxdWlyZUN1cnNvcihkaXIpOyByZXR1cm4gdGhpczsgfVxuICAgIHRoaXMuX2N1cnNvciA9IHRoaXMuX2dlb21ldHJ5LnN0ZXAoZGlyLCB0aGlzLl9jdXJzb3IpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5jbWRBcnJvdyA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICBpZiAodGhpcy5fbm9DdXJzb3IoKSkgcmV0dXJuIHRoaXMuY21kU3BhY2UoZGlyKTtcbiAgICBlbHNlIHJldHVybiB0aGlzLmNtZFNwYWNlKGRpcikuYXJyb3coZGlyKTtcbiAgfTtcbiAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLnNoaWZ0QXJyb3cgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgaWYgKHRoaXMuX25vQ3Vyc29yKCkpIHJldHVybiB0aGlzLnNoaWZ0U3BhY2UoZGlyKTtcbiAgICBlbHNlIHJldHVybiB0aGlzLmFycm93KGRpcikuc2hpZnRTcGFjZShkaXIpO1xuICB9XG4gICAgU2VsZWN0aW9uU3RhdGUucHJvdG90eXBlLl9hY3F1aXJlQ3Vyc29yID0gZnVuY3Rpb24gKGRpcikge1xuICAgICAgdGhpcy5fY3Vyc29yID0gdmFsdWVPckRlZmF1bHQodGhpcy5fY3Vyc29yLCB0aGlzLl9nZW9tZXRyeS5kZWZhdWx0Q3Vyc29yKGRpcikpO1xuICAgICAgcmV0dXJuICEodGhpcy5fbm9DdXJzb3IoKSk7XG4gICAgfVxuICAgIFNlbGVjdGlvblN0YXRlLnByb3RvdHlwZS5fbm9DdXJzb3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9jdXJzb3IgPT09IHVuZGVmaW5lZDsgfVxuXG4vLyAgXG4vLyAgXG4vLyAgXG4vLyAgXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBzZWxlY3Rpb24gZ2VvbWV0cmllc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdmFyIERlZmF1bHRHZW9tZXRyeSA9IGZ1bmN0aW9uICgpIHt9O1xuICBcbiAgRGVmYXVsdEdlb21ldHJ5LnByb3RvdHlwZSA9IHtcbiAgICBtMnYgOiBmdW5jdGlvbiAobXApIHsgcmV0dXJuIG1wOyB9LFxuICAgIGV4dGVuZFBhdGggOiBmdW5jdGlvbiAoc3BhdGgsIHZwKSB7IFxuICAgICAgaWYgKHZwID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIGlmIChzcGF0aC5sZW5ndGggPT0gMikgc3BhdGhbMV0gPSB2cDsgZWxzZSBzcGF0aC5wdXNoKHZwKTsgXG4gICAgfSwgXG4gICAgc3RlcCA6IGZ1bmN0aW9uIChkaXIsIHZwKSB7IHJldHVybiB1bmRlZmluZWQ7IH0sXG4gICAgc2VsZWN0aW9uRG9tYWluIDogZnVuY3Rpb24oc3BhdGgsIHNvdXJjZSwgSikgeyBcbiAgICAgIHZhciBtID0gbWFrZUVtcHR5TWFwKCk7XG4gICAgICBmb3IgKHZhciBpIG9mIHNwYXRoKSBtLnNldChpLCB0cnVlKTsgXG4gICAgICByZXR1cm4gbTtcbiAgICB9LFxuICAgIGRlZmF1bHRDdXJzb3IgOiBmdW5jdGlvbihkaXIpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSxcbiAgICBmaWx0ZXIgOiB1bmRlZmluZWRcbiAgfTtcbiAgICAgICAgICB2YXIgVVAgPSAxLCBET1dOID0gMiwgTEVGVCA9IDMsIFJJR0hUID0gNCwgTk9fRElSRUNUSU9OID0gMDtcbiAgICAgICAgICBmdW5jdGlvbiBhbmNob3IocGF0aCkgeyBcbiAgICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWQ7IFxuICAgICAgICAgICAgIHJldHVybiBwYXRoWzBdOyBcbiAgICAgICAgICB9O1xuICAgICAgICAgIGZ1bmN0aW9uIGFjdGl2ZUVuZChwYXRoKSB7IFxuICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDsgXG4gICAgICAgICAgICAgcmV0dXJuIHBhdGhbcGF0aC5sZW5ndGggLSAxXTsgXG4gICAgICAgICAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIGV4cG9ydHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGV4cG9ydHMuU2VsZWN0aW9uU3RhdGUgPSBTZWxlY3Rpb25TdGF0ZTtcbiAgICBleHBvcnRzLlNlbGVjdGlvbiA9IFNlbGVjdGlvbjtcbiAgXG4gICAgZXhwb3J0cy5VUCA9IFVQOyBcbiAgICBleHBvcnRzLkRPV04gPSBET1dOOyBcbiAgICBleHBvcnRzLkxFRlQgPSBMRUZUOyBcbiAgICBleHBvcnRzLlJJR0hUID0gUklHSFQ7XG4gIFxuICAgIGV4cG9ydHMuQ19TSElGVF9DTElDSyA9IENfU0hJRlRfQ0xJQ0s7XG4gICAgZXhwb3J0cy5DX1NFVF9QQVRIID0gQ19TRVRfUEFUSDtcbiAgXG4gICAgZXhwb3J0cy5hbmNob3IgPSBhbmNob3I7XG4gICAgZXhwb3J0cy5hY3RpdmVFbmQgPSBhY3RpdmVFbmQ7XG4gIFxuICAgIGV4cG9ydHMubWFrZUVtcHR5TWFwID0gbWFrZUVtcHR5TWFwO1xuICBcbiAgICBleHBvcnRzLkRlZmF1bHRHZW9tZXRyeSA9IERlZmF1bHRHZW9tZXRyeTtcbiAgXG4gICAgLy8gVGhlIGZvbGxvd2luZyBhcmUgaGVscGVycyBmb3IgZGVmaW5pbmcgZXZlbnQgaGFuZGxlcnNcbiAgICBleHBvcnRzLk5PTkUgPSBNX05PTkU7XG4gICAgZXhwb3J0cy5TSElGVCA9IE1fU0hJRlQ7XG4gICAgZXhwb3J0cy5DTUQgPSBNX0NNRDtcbiAgICBleHBvcnRzLlNISUZUX0NNRCA9IE1fU0hJRlRfQ01EO1xuICAgIGV4cG9ydHMuT1BUID0gTV9PUFQ7XG4gICAgZXhwb3J0cy5TSElGVF9PUFQgPSBNX1NISUZUX09QVDtcbiAgXG4gICAgZXhwb3J0cy5tb2RpZmllcktleXMgPSBtb2RpZmllcktleXM7XG4gICAgZXhwb3J0cy5kZXRhaWwgPSB7fTtcbiAgICBleHBvcnRzLmRldGFpbC50dCA9IHR0O1xuICAgIGV4cG9ydHMuZGV0YWlsLmZmID0gZmY7XG4gICAgZXhwb3J0cy5kZXRhaWwubm90ID0gbm90O1xuICAgIGV4cG9ydHMuZGV0YWlsLmlkID0gaWQ7XG4gIFxuICAgIGV4cG9ydHMuZGV0YWlsLm1ha2VPcCA9IG1ha2VPcDtcbiAgICBleHBvcnRzLmRldGFpbC5tYWtlRW1wdHlTZXQgPSBtYWtlRW1wdHlTZXQ7XG4gICAgZXhwb3J0cy5kZXRhaWwubWFrZUVtcHR5TWFwID0gbWFrZUVtcHR5TWFwO1xuICBcbiAgICBleHBvcnRzLmRldGFpbC5tYWtlU2VsZWN0aW9uTWFwcGluZyA9IG1ha2VTZWxlY3Rpb25NYXBwaW5nO1xuICAgIGV4cG9ydHMuZGV0YWlsLm1ha2VPcENvbXBvc2l0aW9uID0gbWFrZU9wQ29tcG9zaXRpb247XG4gIFxuICAgIGV4cG9ydHMuZGV0YWlsLmVxdWFsS2V5cyA9IGVxdWFsS2V5cztcbiAgICBleHBvcnRzLmRldGFpbC5pc0VtcHR5ID0gaXNFbXB0eTtcbiJdfQ==
