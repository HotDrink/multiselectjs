var test = QUnit.test;

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
  // generate a property map that maps the labels given as arguments to true
  function dom(args) {
    var d = multiselect.detail.makeEmptyMap();
    for (var i in arguments) { d.set(arguments[i], true); }
    return d;
  }

  // shallow equality of arrays
  // precondition: a and b are arrays
  function arrayEquals(a, b) {
    if (a === b) return true;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  test("Utilities tests", function (t) {

    var s = makeEmptySet();
    var m = makeEmptyMap();

    t.ok(isEmpty(s), "isEmpty 1");
    t.ok(isEmpty(m), "isEmpty 2");

    t.ok(!isSingleton(s), "isSingleton 1");
    t.ok(!isSingleton(m), "isSingleton 2");

    t.equal(firstKey(s), undefined, "firstKey 1");
    t.equal(firstKey(m), undefined, "firstKey 2");

    t.ok(equalKeys(s, m), "equalKeys 1");

    // add 1st elem to both
    s.add(1); m.set(1, true);

    t.ok(isSingleton(s), "isSingleton 3");
    t.ok(isSingleton(m), "isSingleton 4");

    t.ok(!isEmpty(s));
    t.ok(!isEmpty(m));

    t.equal(firstKey(s), 1, "firstKey 3");
    t.equal(firstKey(m), 1, "firstKey 4");

    // add 2nd elem to both
    s.add(2); m.set(2, true);
    t.ok(!isSingleton(s)), "not singleton 1";
    t.ok(!isSingleton(m)), "not singleton 2";

    t.equal(firstKey(s), 1, "firstKey 5");
    t.equal(firstKey(m), 1, "firstKey 6");
        
    t.ok(equalKeys(s, m), "equalKeys 2");

    // add 3rd to s
    s.add(3);
    t.ok(!equalKeys(s, m), "not equalKeys");
  });
  test("Baking tests", function (t) {

    var M = multiselect;

    var D = M.detail;
    var s = D.makeSelectionMapping();
    var F = false, T = true;
    
    s.bake(D.makeOp(D.tt, dom())); // select no elements
    t.ok(arrayEquals([0, 1, 2, 3, 4].map(s),
                     [F, F, F, F, F]), "bake empty domain");
    
    s.bake(D.makeOp(D.tt, dom(1, 3))); // select 1 and 3
    t.ok(arrayEquals([0, 1, 2, 3, 4].map(s), 
                     [F, T, F, T, F]), "bake 1 and 3 true");
    
    s.bake(D.makeOp(D.ff, dom(1, 2))); // deselect 1 and 2
    t.ok(arrayEquals([0, 1, 2, 3, 4].map(s), 
                     [F, F, F, T, F]), "bake 1 and 2 false");
    
    s.bake(D.makeOp(D.not, dom(1, 3))); // flip 1 and 3
    t.ok(arrayEquals([0, 1, 2, 3, 4].map(s), 
                     [F, T, F, F, F]), "negate 1 and 3");
  });
  test ("Primitive selection operation tests", function (t) {

    var M = multiselect;
    var D = M.detail;
    var F = false, T = true;
 
    var s = D.makeOp(D.tt, makeEmptyMap())(D.makeSelectionMapping());
    t.ok(arrayEquals([0, 1, 2, 3].map(s), 
                     [F, F, F, F]), "empty domain");

    s = D.makeOp(D.tt, dom(1, 3))(s);
    t.ok(arrayEquals([0, 1, 2, 3].map(s), 
                     [F, T, F, T]), "true function");

    s = D.makeOp(D.ff, dom(1, 3))(s);
    t.ok(arrayEquals([0, 1, 2, 3].map(s), 
                     [F, F, F, F]), "false function");

    s = D.makeOp(D.not, dom(1, 3))(s);
    t.ok(arrayEquals([0, 1, 2, 3].map(s), 
                     [F, T, F, T]), "negation function");

  });
  test ("Op composition tests", function (t) {

    var D = multiselect.detail;
    var s = D.makeSelectionMapping();
    var comp = D.makeOpComposition();
    var F = false, T = true;
    var sel = comp(s); 

    t.ok(arrayEquals([0, 1, 2].map(sel), [F, F, F]), "empty");
   
    comp.push(D.makeOp(D.tt, dom(1)));
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, T, F]), "add 1");

    comp.push(D.makeOp(D.not, dom(0, 1, 2)));
    t.ok(arrayEquals([0, 1, 2].map(sel), [T, F, T]), "add 2");

    comp.push(D.makeOp(D.ff, dom(0, 1)));
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, F, T]), "add 3");

    comp.pop();
    t.ok(arrayEquals([0, 1, 2].map(sel), [T, F, T]), "pop 1");

    comp.pop();
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, T, F]), "pop 2");

    comp.pop();
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, F, F]), "empty");

    // push three ops
    comp.push(D.makeOp(D.not, dom(0, 2)));
    comp.push(D.makeOp(D.tt,  dom(1, 2)));
    comp.push(D.makeOp(D.not, dom(0, 1)));
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, F, T]), "add 3 again");

    comp.shift(); 
    t.ok(arrayEquals([0, 1, 2].map(sel), [T, F, T]), "shift 1");

    comp.shift(); 
    t.ok(arrayEquals([0, 1, 2].map(sel), [T, T, F]), "shift 2");

    comp.shift(); 
    t.ok(arrayEquals([0, 1, 2].map(sel), [F, F, F]), "shift 3");
   
  });
  test ("Op composition removeIndex tests", function (t) {

    var D = multiselect.detail;
    var comp = D.makeOpComposition();
    var s = D.makeSelectionMapping();
    var selection = comp(s); 

    comp.push(D.makeOp(D.tt, dom(0)));
    comp.push(D.makeOp(D.tt, dom(1)));
    comp.push(D.makeOp(D.ff, dom(0)));
    comp.push(D.makeOp(D.tt, dom(0, 1)));
    t.ok(arrayEquals([0, 1].map(selection), [true, true]), "removeIndex 1");
    comp.removeIndex(1);
    t.ok(arrayEquals([0, 1].map(selection), [true, false]), "removeIndex 2");
    comp.removeIndex(0);
    t.ok(arrayEquals([0, 1].map(selection), [false, false]), "removeIndex 3");
  });
  test ("Selection state tests click", function (t) {

    var M = multiselect; 

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function () {}, false, 10);
    function cur(i) { return s.isSelected(i); }
    s.click(1);
    t.ok(s.isSelected(1), "click 0");
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, true, false]), "click 1");
    s.click(2);
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, false, true]), "click 2");
    s.click(1);
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, true, false]), "click 3");    
  });

  test ("Selection state tests shiftClick", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20));
    function cur(i) { return s.isSelected(i); }

    s.shiftClick(1); s._flush();
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, true, false]), "shiftClick 1");
    s.shiftClick(2); s._flush();
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, true, true]), "shiftClick 2");
    s.shiftClick(1); s._flush();
    t.ok(arrayEquals([0, 1, 2].map(cur), [false, true, false]), "shiftClick 3");
    s.shiftClick(0); s._flush();
    t.ok(arrayEquals([0, 1, 2].map(cur), [true, true, false]), "shiftClick 4");

    s.click(null);
    s.shiftClick(1);
    s.shiftClick(2);
    s.shiftClick(1);
    s.shiftClick(0);
    s._flush();
    t.ok(arrayEquals([0, 1, 2].map(cur), [true, true, false]), "shiftClick 5");     
  });

  test ("Selection state tests cmdClick", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20));
    function cur(i) { return s.isSelected(i); }

    s.cmdClick(1);
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "cmdClick 1");
    s.cmdClick(2);
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "cmdClick 2");
    s.cmdClick(1);
    t.deepEqual([0, 1, 2].map(cur), [false, false, true], "cmdClick 3");
    s.cmdClick(0);
    t.deepEqual([0, 1, 2].map(cur), [true, false, true], "cmdClick 4");
  });

  test ("Repeat click tests", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 20);
    function cur(i) { return s.isSelected(i); }

    t.equal(s._ops.size(), 0, "repeat cmdClick 0"); 
    s.cmdClick(1); // mode after is tt
    t.equal(s._ops.size(), 2, "repeat cmdClick 1"); 
    t.ok(cur(1));
    s.cmdClick(1); // mode after is ff
    t.equal(s._ops.size(), 4, "repeat cmdClick 2"); 
    t.ok(!cur(1));
    // clicks on negative coordinates give an empty J
    s.cmdClick(-1); // mode after is tt, since mode was ff, should push
    t.equal(s._ops.size(), 6, "repeat cmdClick 3");
    s.cmdClick(-1); // this now should not push
    t.equal(s._ops.size(), 6, "repeat cmdClick 4");
    s.cmdClick(-2); // nor this
    t.equal(s._ops.size(), 6, "repeat cmdClick 5");
    s.shiftClick([1]); 
    t.ok(s.isSelected(1), "repeat cmdClick is 1 selected");
    t.equal(s._ops.size(), 6, "repeat cmdClick 5b");
    s.cmdClick(-1);
    t.equal(s._ops.size(), 8, "repeat cmdClick 6a");
    t.equal(s._ops.top().f, M.detail.tt, "repeat cmdClick 6b");
    s.shiftClick([10, -1]); 
    s.cmdClick(-1); // should not push
    t.equal(s._ops.size(), 8, "repeat cmdClick 7");

    // reset s
    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 20);
    s.cmdClick(1); 
    t.equal(s._ops.size(), 2, "repeat cmdClick 2 1");
    s.cmdClick(1); 
    t.equal(s._ops.size(), 4, "repeat cmdClick 2 2");
    s.cmdClick(-1); 
    t.equal(s._ops.size(), 6, "repeat cmdClick 2 3");

    // reset s
    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 20);

    s.click(1); 
    t.equal(s._ops.size(), 2, "repeat click 1");
    s.click(1); 
    t.equal(s._ops.size(), 2, "repeat click 2");

    s.click(2); 
    t.equal(s._ops.size(), 4, "repeat click 3");
    s.click(-1); 
    t.equal(s._ops.size(), 6, "repeat click 4");
    s.click(-2); 
    t.equal(s._ops.size(), 6, "repeat click 5");

    s.cmdClick(1); 
    t.equal(s._ops.size(), 8, "repeat click 8");
    s.click(1); 
    t.equal(s._ops.size(), 10, "repeat click 9");
    s.cmdClick(1); 
    t.equal(s._ops.size(), 12, "repeat click 10");
    s.click(-1); 
    t.equal(s._ops.size(), 14, "repeat click 11");

    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 20);

    t.equal(s._ops.size(), 0, "shift-click size 0");
    s.shiftClick([1]); s._flush();
    t.equal(s._ops.size(), 2, "shift-click size 1");
    s.shiftClick([2]); s._flush();
    t.equal(s._ops.size(), 2, "shift-click size 2");
  });


  test ("Selection state tests onSelected", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function () {}, false, 10);
    function cur(i) { return s.isSelected(i); }
    s.click(1);
    t.ok(s.onSelected(1), "onSelected 1");
    t.ok(!s.onSelected(0), "onSelected 2");
  });

  test ("Undo tests", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20));
    function cur(i) { return s.isSelected(i); }

    s.cmdClick(1);
    t.equal(s._ops.size(), 2);
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "undoable action 1");
    s.cmdClick(2);
    t.equal(s._ops.size(), 4);
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "undoable action 2");
    s.cmdClick(1);
    t.equal(s._ops.size(), 6);
    t.deepEqual([0, 1, 2].map(cur), [false, false, true], "undoable action 3");
    s.cmdClick(0);
    t.equal(s._ops.size(), 8);
    t.deepEqual([0, 1, 2].map(cur), [true, false, true], "undoable action 2");
    s.click(0);
    t.equal(s._ops.size(), 10);
    t.deepEqual([0, 1, 2].map(cur), [true, false, false], "undo 0");
    s.undo();
    t.equal(s._ops.size(), 8);
    t.deepEqual([0, 1, 2].map(cur), [true, false, true], "undo 1");
    s.undo();
    t.equal(s._ops.size(), 6);
    t.deepEqual([0, 1, 2].map(cur), [false, false, true], "undo 2");
    s.undo();
    t.equal(s._ops.size(), 4);
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "undo 3");
    s.undo();
    t.equal(s._ops.size(), 2);
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "undo 4");
    s.undo();
    t.equal(s._ops.size(), 0);
    t.deepEqual([0, 1, 2].map(cur), [false, false, false], "undo 5");
    s.undo();
    t.equal(s._ops.size(), 0);
    t.deepEqual([0, 1, 2].map(cur), [false, false, false], "undo 5 again");
    s.undo();
    t.equal(s._ops.size(), 0);

    function m2a(m) {
      var a = [false, false, false]; 
      for (var i = 0; i<3; ++i) if (m.get(i) === true) a[i] = true;
      return a;
    }
    var changed = null;
    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20),
                             function (smap) { changed = m2a(smap); }, true);
    s.cmdClick(1);
    t.deepEqual(changed, [false, true, false], "undoable action 1");
    // s.cmdClick(2);
    // t.equal(s._ops.size(), 4);
    // t.deepEqual([0, 1, 2].map(cur), [false, true, true], "undoable action 2");
    // s.cmdClick(1);
    // t.equal(s._ops.size(), 6);
    // t.deepEqual([0, 1, 2].map(cur), [false, false, true], "undoable action 3");
    // s.cmdClick(0);
    // t.equal(s._ops.size(), 8);
    // t.deepEqual([0, 1, 2].map(cur), [true, false, true], "undoable action 2");
    // s.click(0);
    // t.equal(s._ops.size(), 10);
    // t.deepEqual([0, 1, 2].map(cur), [true, false, false], "undo 0");
    // s.undo();
    // t.equal(s._ops.size(), 10);
    // t.equal(s._numberOfOps(), 8);
    // t.deepEqual([0, 1, 2].map(cur), [true, false, true], "undo 1");
    // s.undo();
    // t.equal(s._ops.size(), 8);
    // t.equal(s._numberOfOps(), 6);
    // t.deepEqual([0, 1, 2].map(cur), [false, false, true], "undo 2");
    // s.undo();
    // t.equal(s._ops.size(),  6);
    // t.equal(s._numberOfOps(), 4);
    // t.deepEqual([0, 1, 2].map(cur), [false, true, true], "undo 3");
    // s.undo();
    // t.equal(s._ops.size(), 4);
    // t.equal(s._numberOfOps(), 2);
    // t.deepEqual([0, 1, 2].map(cur), [false, true, false], "undo 4");
    // s.undo();
    // t.equal(s._ops.size(), 2);
    // t.equal(s._numberOfOps(), 0);
    // t.deepEqual([0, 1, 2].map(cur), [false, false, false], "undo 5");
    // s.undo();
    // t.equal(s._ops.size(), 2);
    // t.equal(s._numberOfOps(), 0);
    // t.deepEqual([0, 1, 2].map(cur), [false, false, false], "undo 5 again");
    // s.undo();
    // t.equal(s._ops.size(), 2);
  });

  test ("Redo tests", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20));
    function cur(i) { return s.isSelected(i); }

    s.cmdClick(1);
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "redo-init 1");    
    s.cmdClick(2);
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "redo-init 2");
    s.cmdClick(1);
    t.deepEqual([0, 1, 2].map(cur), [false, false, true], "redo-init 3");
    s.cmdClick(0);
    t.deepEqual([0, 1, 2].map(cur), [true, false, true], "redo-init 4");
    s.click(0);
    t.deepEqual([0, 1, 2].map(cur), [true, false, false], "redo-init 5");

    s.undo(); s.undo(); s.undo(); s.undo(); s.undo(); s.undo(); s.undo(); 
    // more undos the commands; last one(s) should have no effect
    t.deepEqual([0, 1, 2].map(cur), [false, false, false], "redo 0");
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "redo 1");
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "redo 2");
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [false, false, true], "redo 3");
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [true, false, true], "redo 4");
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [true, false, false], "redo 5");
    // redo stack should be empty
    s.redo();
    t.deepEqual([0, 1, 2].map(cur), [true, false, false], "redo 5 again");

    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20));
    s.shiftClick([1]);
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "redo A1");
    s.cmdClick(2);
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "redo A2");
    s.undo();
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "redo A3");
    s.undo();
    t.deepEqual([0, 1, 2].map(cur), [false, false, false], "redo A4");
  });

  test ("Redo stack limit test", function (t) {

    var M = multiselect;

    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 1);
    function cur(i) { return s.isSelected(i); }
    s.redo();
    t.equal(s._ops.size(), 0, "");
    s.undo();
    t.equal(s._ops.size(), 0, "");
    s.redo();
    t.equal(s._ops.size(), 0, "");
    s.redo();
    t.equal(s._ops.size(), 0, "");
    s.cmdClick(1); 
    t.equal(s._ops.size(), 2, "min undo 0");
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "");
    s.undo();
    t.equal(s._ops.size(), 0, "min undo 1");
    t.deepEqual([0, 1, 2].map(cur), [false, false, false], "");
    s.redo();
    t.equal(s._ops.size(), 2, "min undo 2");
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "");
    s.redo();
    t.equal(s._ops.size(), 2, "min undo 2b");
    s.cmdClick(2); 
    t.equal(s._ops.size(), 2, "min undo 3");
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "");
    s.undo();
    t.equal(s._ops.size(), 0, "min undo 4");
    t.deepEqual([0, 1, 2].map(cur), [false, true, false], "");
    s.redo();
    t.equal(s._ops.size(), 2, "min undo 5");
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "");
    s.redo();
    t.equal(s._ops.size(), 2, "min undo 6");
    t.deepEqual([0, 1, 2].map(cur), [false, true, true], "");

    s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function(){}, false, 3);
    s.cmdClick(1); 
    t.equal(s._ops.size(), 2, "redostack 1a");
    t.equal(s._redoStack.length, 0, "redostack 1b");
    s.undo();
    t.equal(s._ops.size(), 0, "redostack 2a");
    t.equal(s._redoStack.length, 2, "redostack 2b");
    s.cmdClick(2); 
    t.equal(s._ops.size(), 2, "redostack 3a");
    t.equal(s._redoStack.length, 2, "redostack 3b");
    s.undo(); 
    t.equal(s._ops.size(), 0, "redostack 4a");
    t.equal(s._redoStack.length, 4, "redostack 4b");
    s.cmdClick(3); 
    t.equal(s._ops.size(), 2, "redostack 5a"); 
    t.equal(s._redoStack.length, 4, "redostack 5b");
    s.cmdClick(4); 
    t.equal(s._ops.size(), 4, "redostack 6a");
    t.equal(s._redoStack.length, 4, "redostack 6b");
    s.cmdClick(5);     
    s.cmdClick(6); 
    t.equal(s._ops.size(), 6, "redostack 7a"); // should be 8, but we are at limit
    t.equal(s._redoStack.length, 4, "redostack 7b");
    s.undo();
    t.equal(s._ops.size(), 4, "redostack 8a"); 
    t.equal(s._redoStack.length, 6, "redostack 8b"); 
    s.undo();
    t.equal(s._ops.size(), 2, "redostack 9a");
    t.equal(s._redoStack.length, 6, "redostack 9b"); // at limit
    s.click(1);
    t.equal(s._ops.size(), 4, "redostack 10a"); 
    t.equal(s._redoStack.length, 6, "redostack 10b"); 
    s.redo();
    t.equal(s._ops.size(), 6, "redostack 11a"); 
    t.equal(s._redoStack.length, 4, "redostack 11b"); 
  });

  test ("Changed tracking tests", function (t) {

    var changed;
    var M = multiselect;
    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), 
                                 function(c) { changed = c; }, true);

    s.click(1);
    t.ok(equalKeys(changed, dom(1)), "tracking 1");
    t.equal(changed.get(1), true, "tracking 1b");
    changed = null;
    s.click(1); // should be a nop, so refresh not called
    t.equal(changed, null, "tracking 2");
    s.cmdClick(1);
    t.ok(equalKeys(changed, dom(1)), "tracking 3");
    t.equal(changed.get(1), false);
    s.click(2);
    t.ok(equalKeys(changed, dom(2)), "tracking 4");
    t.equal(changed.get(2), true);
    s.shiftClick(4); s._flush();
    t.ok(equalKeys(changed, dom(3, 4)), "tracking 5");
    t.equal(changed.get(3), true);
    t.equal(changed.get(4), true);
  });

  test ("Predicate selection tests", function (t) {

    var M = multiselect, D = M.detail;
    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), function() {});
    function cur(i) { return s.isSelected(i); }

    s.filter(function (i) { return i === 1 || i === 3; });
    t.deepEqual([0, 1, 2, 3].map(cur), [false, true, false, true], "");
    s.filter(function (i) { return i === 1 || i === 2; });
    t.deepEqual([0, 1, 2, 3].map(cur), [false, true, true, false], "");
    s.filter(function (i) { return true; });
    t.deepEqual([0, 1, 2, 3].map(cur), [true, true, true, true], "");
    s.filter(function (i) { return i === 1 || i === 2; });
    s.commit();
    s.filter(function (i) { return i === 0; });
    t.deepEqual([0, 1, 2, 3].map(cur), [true, true, true, false], "");

    var changed;
    var s = new M.SelectionState(new M.Geometries.OrderedGeometry(20), 
                                 function(c) { changed = c; }, true);
    s.filter(function (i) { return i === 1 || i === 3; }, true); // [1, 3] selected
    t.equal(changed.size, 2, "filter with change tracking 1");
    t.ok(changed.get(1) === true && changed.get(3) === true);
    t.equal(cur(0), false, "a");
    t.equal(cur(1), true, "b");
    t.equal(cur(2), false, "c");
    t.equal(cur(3), true, "d");
    s.filter(function (i) { return i === 1 || i === 2; }, false); // [3] selected
    // this commits, since selection mode changes
    t.equal(cur(0), false, "a");
    t.equal(cur(1), false, "b");
    t.equal(cur(2), false, "c");
    t.equal(cur(3), true, "d");

    t.equal(changed.size, 1, "filter with change tracking 2");
    t.equal(changed.get(0), undefined);
    t.equal(changed.get(1), false);
    t.equal(changed.get(2), undefined);
    t.equal(changed.get(3), undefined);
    s.filter(function (i) { return true; }, false); // [] selected
    t.equal(changed.size, 1); 
    t.equal(changed.get(3), false);
    // test commit:
    s.filter(function (i) { return i === 1 || i === 3; }, true); // [1, 3] selected
    t.equal(changed.size, 2, "commit tests");
    t.ok(changed.get(1) === true && changed.get(3) === true);    
    s.commit();
    s.filter(function (i) { return i === 1 || i === 2; }, true); // [1, 2, 3] selected
    t.equal(changed.size, 1);
    t.ok(changed.get(2) === true);    
  });
