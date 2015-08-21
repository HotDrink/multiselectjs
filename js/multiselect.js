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
