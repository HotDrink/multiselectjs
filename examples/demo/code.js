////////////////////////////////////
// MultiselectJS demo application //
//                                //
// Author:                        //
////////////////////////////////////


//////////////////////////
// HTMLElementsGeometry //
//////////////////////////

// The selectable elements in are HTML elements, and all geometries need
// access to their location and extents information. The HTMLElementsGeometry
// provides this. All other geometries derive from HTMLElementsGeometry.

function HTMLElementsGeometry(parent, elements) {
  this.parent = parent;
  this.elements = elements;
}
HTMLElementsGeometry.prototype = Object.create(multiselect.DefaultGeometry.prototype);

// HTMLElementGeometry's filter function can be reused by other geometries. Iterating
// over all elements is the same for all geometries in this application.
HTMLElementsGeometry.prototype.filter = function(p) {   
  var J = new Map();
  for (var i = 0; i < this.elements.length; ++i) if (p(i)) J.set(i, true);
  return J;
}
// For convenience, we assume drawIndicators is defined for all geometries.
// Geometries that do not draw indicator derive this default definition.
HTMLElementsGeometry.prototype.drawIndicators = function() {};

/////////////////////////
// RectangularGeometry //
/////////////////////////

function RectangularGeometry(parent, elements) {
  HTMLElementsGeometry.call(this, parent, elements);
}
RectangularGeometry.prototype = Object.create(HTMLElementsGeometry.prototype);

// Selection domain is those elements that intersect with the rectangle whose
// corners are the anchor and active end (the first and last elements of the path).
RectangularGeometry.prototype.selectionDomain = function(path) {
  var J = new Map();
  if (path.length === 0) return J;
  var r1 = mkRectangle(multiselect.anchor(path),
                       multiselect.activeEnd(path));
  for (var i=0; i<this.elements.length; ++i) {
    var r2 = getOffsetRectangle(this.parent, this.elements[i]);
    // all coordinates are in relation to the parent element that contains the
    // selectable elements
    if (rectangleIntersect(r1, r2)) J.set(i, true);
  }
  return J;
}

/////////////////
// RowGeometry //
/////////////////

// Elements are totally ordered. Selection space coordinates are the indices 
// of the elements array
var RowGeometry = function (parent, elements) {
  HTMLElementsGeometry.call(this, parent, elements);
};
RowGeometry.prototype = Object.create(HTMLElementsGeometry.prototype);

// Selection domain is the range of elements between the anchor and active end.
RowGeometry.prototype.selectionDomain = function(path) {
  var J = new Map();
  if (path.length === 0) return J;
  var a = multiselect.anchor(path);
  var b = multiselect.activeEnd(path);
  for (var i=Math.min(a, b); i<=Math.max(a, b); ++i) J.set(i, true);
  return J;
}

// Transforming the mouse coordinate to selection space involves finding
// the element whose extents include the mouse point. This coordinate system
// indicates that the point falls outside of any elements with the value null.
RowGeometry.prototype.m2v = function(mp) {
  for (var i=0; i<this.elements.length; ++i) {
    var r = getOffsetRectangle(this.parent, this.elements[i]);
    if (pointInRectangle(mp, r)) return i;        
  }
  return null;
}

// In this geometry, null coordinate has no effect on the path
RowGeometry.prototype.extendPath = function(path, p) {
  if (p === null) return null;
  return HTMLElementsGeometry.prototype.extendPath.call(this, path, p);
}

// Defining the step method enables keyboard selection.
// Moving the cursor to left and right is just incrementing and decrementing.
// Up and down requires finding the element above or below the current element.
RowGeometry.prototype.step = function (dir, p) {
  switch (dir) {
  case multiselect.LEFT:  return Math.max(p - 1, 0);
  case multiselect.RIGHT: return Math.min(p + 1, this.elements.length-1);
  case multiselect.UP: 
    return findClosestP.call(this, this.parent, this.elements, p, isAbove); 
  case multiselect.DOWN: 
    return findClosestP.call(this, this.parent, this.elements, p, 
                             function (a, b) { return isAbove(b, a); });     
  default: return p;
  }
}

// When no keyboard cursor is selected, the default depends on which arrow key
// is pressed. Right and down start from the first element (top left corner),
// left and up from the last (bottorm right).
RowGeometry.prototype.defaultCursor = function (dir) {
  switch (dir) {
  case multiselect.RIGHT: 
  case multiselect.DOWN: return 0;
  case multiselect.LEFT: 
  case multiselect.UP: return this.elements.length - 1; 
  default: return undefined;
  }
}

///////////////////
// SnakeGeometry //
///////////////////

// A drag in SnakeGeometry appends points to the path ("snake"). The active set is all elements
// whose bounding boxes touch the snake. The methods are a bit complex because
// the selectionDomain is optimized to only compute the effect of new points added to the
// snake, and because by ragging the mouse "backwards" on the snake, the user can remove points
// at the end of the path (in general, extendPath can be defined to modify the path in arbitrary ways).

var SnakeGeometry = function (parent, elements) {
  HTMLElementsGeometry.call(this, parent, elements);
  this.removing = false; // flag for indicating when shift-clicks are removing points
  this.prevp = undefined; // previous attempted point to extend with
  this.rcount = undefined; // refcounts of how many line segments select an index
  this.pqueue = []; // queue of add and rem commands that extendPath generates and
  // selectionDomain executes
};
SnakeGeometry.prototype = Object.create(HTMLElementsGeometry.prototype);

// The basic functionality of extendPath is to append p to the end of the path.
// The geometry goes to "removing-mode" if the path turns more than 135 degrees. It then
// removes nearby points (within 20 pixels), and remains in removing-mode until a new point
// again moves further away from the current last point. This is a crude heuristic, but it
// works sufficiently well for this demo, to show the flexibility of parameterization
// via selection geometries. 
SnakeGeometry.prototype.extendPath = function(path, p) {

  if (path.length == 0) this.removing = false;
  var self = this;
  if (this.removing) {
    if (distance(p, path[path.length-1]) > distance(this.prevp, path[path.length-1])) this.removing = false;
  } else {
    if (path.length >= 2 && angle(path[path.length-2], path[path.length-1], p) < Math.PI/4) this.removing = true;
  }

  if (this.removing) {
    // remove points that are close
    this.prevp = p;
    while (path.length >= 2 && distance(p, path[path.length-1]) < 20) {
      this.pqueue.push({cmd: "rem", p1: path[path.length-2], p2: path[path.length-1]});
      path.pop();
    } 
  } else {
    var prev = path.length === 0 ? p : path[path.length-1];
    this.pqueue.push({cmd: "add", p1: prev, p2: p});
    path.push(p);
  }
}

SnakeGeometry.prototype._forEachAffectedByLine = function (p1, p2, f) {
  for (var j = 0; j < this.elements.length; ++j) {
    if (lineRectIntersect(p1, p2, getOffsetRectangle(this.parent, this.elements[j]))) f(j);
  }
}
                                   
// Find the elements that intersect with the snake. J may contain the previous
// selection domain; path is not used, since we just apply commands
// that extendPath has queued
SnakeGeometry.prototype.selectionDomain = function(path, J) {
  if (J === undefined) {
    J = new Map();
    this.rcount = new Map();
  }
  var self = this;
  for (var i=0; i<this.pqueue.length; ++i) {
    var p = this.pqueue[i];
    if (p.cmd === "add") {
      this._forEachAffectedByLine(p.p1, p.p2, function (j) {
          J.set(j, true);
          self.rcount.set(j, or_default(self.rcount.get(j), 0) + 1);
      });
    }
    if (p.cmd === "rem") {
      this._forEachAffectedByLine(p.p1, p.p2, function (j) {
        self.rcount.set(j, self.rcount.get(j) - 1);
        if (self.rcount.get(j) === 0) J.delete(j);
      });
    }
  }
  this.pqueue = [];
  return J;
}

///////////////////
// PointGeometry //
///////////////////

var PointGeometry = function (parent, elements) {
  HTMLElementsGeometry.call(this, parent, elements);
  this.k = 0;
};
PointGeometry.prototype = Object.create(HTMLElementsGeometry.prototype);

PointGeometry.prototype.extendPath = function(path, p) { path.push(p); }

// If J contains the previous selection domain, it suffices to compute from k onwards
PointGeometry.prototype.selectionDomain = function(path, J) {  
  if (J === undefined) {
    J = new Map();
    this.k = 0;
  }
  for (var i = this.k; i < path.length; ++i) {
    for (var j = 0; j < this.elements.length; ++j) {
      var r = getOffsetRectangle(this.parent, this.elements[j]);
      if (pointInRectangle(path[i], r)) J.set(j, true);
    }
  }
  this.k = path.length;
  return J;
}

///////////////////
// MixedGeometry //
///////////////////

// This geometry gives selection functionality where one can select elements rowise
// but also by specifying a rectangular region. If the click that establishes the
// anchor is on an element, selection is row-wise, otherwise rectangular.
// To achieve this, selection coordinates are structs that contain two fields:
// index for the index, and point for the mouse coordinate.
// This geometry specifies a selection feature very simlar to that in iPhoto.

var MixedGeometry = function (parent, elements) {
  HTMLElementsGeometry.call(this, parent, elements);
}
MixedGeometry.prototype = Object.create(HTMLElementsGeometry.prototype);

// If anchor has an index field that is not undefined, row-wise selection
// is applied, othewrise rectangular
MixedGeometry.prototype.selectionDomain = function(path, J) {
  var J = new Map();
  if (path.length === 0) return J;
  var a = multiselect.anchor(path);
  var b = multiselect.activeEnd(path);
  if (a.index !== undefined) {
    for (var i=Math.min(a.index, b.index); i<=Math.max(a.index, b.index); ++i) J.set(i, true);    
  } else {
    var r1 = mkRectangle(a.point, b.point);
    for (var i=0; i<this.elements.length; ++i) {
      var r2 = getOffsetRectangle(this.parent, this.elements[i]);
      if (rectangleIntersect(r1, r2)) J.set(i, true);
    }    
  }  
  return J;
}

// The selection space coordinate has no index field if the mouse point lands on
// no element; it always has teh point field.
MixedGeometry.prototype.m2v = function (mp) {
  for (var i=0; i<this.elements.length; ++i) {
    var r = getOffsetRectangle(this.parent, this.elements[i]);
    if (pointInRectangle(mp, r)) return { index: i, point: mp};        
  }
  return { point: mp };
}

// In row-wise seleciton, points that are outside any elements are ignored
MixedGeometry.prototype.extendPath = function (path, p) {
  var a = multiselect.anchor(path);
  if (a !== undefined && a.index !== undefined && p.index === undefined) return null;
  return HTMLElementsGeometry.prototype.extendPath.call(this, path, p);
}

// stepping is only possible in row-wise selection. After a step to some element i,
// the point member is set to the center point of the element i
MixedGeometry.prototype.step = function (dir, p) {
  if (p.index === undefined) return p;
  var ind = p.index;
  switch (dir) {
  case multiselect.LEFT:  ind = Math.max(ind - 1, 0); break;
  case multiselect.RIGHT: ind = Math.min(ind + 1, this.elements.length-1); break;
  case multiselect.UP: ind = findClosestP.call(this, this.parent, this.elements, ind, isAbove); break;
  case multiselect.DOWN: ind = findClosestP.call(this, this.parent, this.elements, ind, isBelow); break;
  }
  if (ind === p.index) return p;
  return { index: ind, point: centerPoint(getOffsetRectangle(this.parent, this.elements[ind])) };
}

// Cursor defaults are as with row-wise geometry
MixedGeometry.prototype.defaultCursor = function (dir) {
  var ind;
  switch (dir) {
  case multiselect.RIGHT: 
  case multiselect.DOWN: ind = 0; break;
  case multiselect.LEFT: 
  case multiselect.UP: ind = this.elements.length - 1; break;
  default: return undefined;
  }
  return { index: ind, point: centerPoint(getOffsetRectangle(this.parent, this.elements[ind])) };
}

//////////////////////////
// Setup mouse handlers //
//////////////////////////

// MultiselectJS does not dictate how to recognize mouse events. Below is one example.
// Handler for mouse down registers handlers for mouse move and mouse up events,
// mouse up unregisters them. Each handlers invokes the current geometry's
// m2v function to translate the mouse coordinate to selection space, and then
// invokes the appropriate click function.

// The handlers also call the drawIndicators function to draw the anchor, rubber band,
// and the keyboard cursor indicators, according to what the geometry specifies.
// Mouse move and shift click may schedule their work for later, but the indicators
// are drawn immediately.

// Some applications support dragging the selected elements, which requires a bit more
// complex event handling logic. That feature is not implemented here.

function setupMouseEvents (parent, canvas, selection) {
  
  function mousedownHandler(evt) {
    
    var mousePos = selection.geometry().m2v(offsetMousePos(parent, evt));
    switch (multiselect.modifierKeys(evt)) {
    case multiselect.NONE: selection.click(mousePos); break;
    case multiselect.CMD: selection.cmdClick(mousePos); break;
    case multiselect.SHIFT: selection.shiftClick(mousePos); break;
    default: return;
    }    

    selection.geometry().drawIndicators(selection, canvas, true, true, false);

    document.addEventListener('mousemove', mousemoveHandler, false);
    document.addEventListener('mouseup', mouseupHandler, false);
    evt.preventDefault();
    evt.stopPropagation();
  };
  
  function mousemoveHandler (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var mousePos = selection.geometry().m2v(offsetMousePos(parent, evt));
    selection.shiftClick(mousePos);
    selection.geometry().drawIndicators(selection, canvas, true, true, true);
  };
  
  function mouseupHandler (evt) {
    document.removeEventListener('mousemove', mousemoveHandler, false);
    document.removeEventListener('mouseup', mouseupHandler, false);
    selection.geometry().drawIndicators(selection, canvas, true, true, false);
  };
  
  parent.addEventListener('mousedown', mousedownHandler, false);
}

/////////////////////////////
// Setup keyboard handlers //
/////////////////////////////

function setupKeyboardEvents(parent, canvas, selection) {

  parent.addEventListener('keydown', keydownHandler, false);
  parent.addEventListener('mousedown', function() { parent.focus(); }, false);
  
  function keydownHandler(evt) {
    var handled = false; 
    var mk = multiselect.modifierKeys(evt);
    switch (evt.which) {          
    case 37: handled = callArrow(mk, multiselect.LEFT); break;
    case 38: handled = callArrow(mk, multiselect.UP); break;             
    case 39: handled = callArrow(mk, multiselect.RIGHT); break;
    case 40: handled = callArrow(mk, multiselect.DOWN); break;
    case 32: handled = callSpace(mk); break;
    case 90: handled = callUndoRedo(mk); break;
    default: return; // exit this handler for unrecognized keys
    }
    if (!handled) return;
    
    // event is recognized
    selection.geometry().drawIndicators(selection, canvas, true, true, false);
    evt.preventDefault(); 
    evt.stopPropagation();
  }  
  
  function callUndoRedo (mk) {
    switch (mk) {
    case multiselect.OPT: selection.undo(); break;
    case multiselect.SHIFT_OPT: selection.redo(); break;
    default: return false;
    }      
    return true;
  }
  
  function callArrow (mk, dir) {
    switch (mk) {
    case multiselect.NONE: selection.arrow(dir); break;
    case multiselect.CMD: selection.cmdArrow(dir); break;
    case multiselect.SHIFT: selection.shiftArrow(dir); break;
    default: return false;
    }
    return true;
  }
  
  function callSpace (mk) {
    switch (mk) {
    case multiselect.NONE: selection.space(); break;
    case multiselect.CMD: selection.cmdSpace(); break;
    case multiselect.SHIFT: selection.shiftSpace(); break;
    default: return false;      
    }
    return true;
  }
}

////////////////////////////////
// The drawIndicators methods //
////////////////////////////////

// Rectangular geometry shows the anchor as a small circle, and the rubber band as a green rectangle
// during a drag
RectangularGeometry.prototype.drawIndicators = function (selection, canvas, drawAnchor, drawCursor, drawRubber) {
  clearCanvas(canvas);
  var ctx = canvas.getContext('2d');
  var anchor = multiselect.anchor(selection.selectionPath());
  
  if (drawAnchor && anchor !== undefined) { drawSmallCircle(ctx, anchor, 'DarkRed'); }
  if (drawRubber && anchor !== undefined) {
    var activeEnd = multiselect.activeEnd(selection.selectionPath());
    drawRectangle(ctx, mkRectangle(anchor, activeEnd), 'green');
  }
}

// Row geometry indicates the anchor and the cursor by framing elements. No rubber band.
RowGeometry.prototype.drawIndicators = function (selection, canvas, drawAnchor, drawCursor, drawRubber) {
  clearCanvas(canvas);
  var ctx = canvas.getContext('2d');
  var anchor = multiselect.anchor(selection.selectionPath());
  var arect;
  if (anchor !== undefined) arect = getOffsetRectangle(canvas, selection.geometry().elements[anchor]);
  if (drawAnchor && anchor !== undefined) {
    drawRectangle(ctx, arect, 'DarkRed');
  }      
  if (drawCursor && selection.cursor() !== undefined) {
    var r = getOffsetRectangle(canvas, selection.geometry().elements[selection.cursor()]);
    drawRectangle(ctx, r, 'blue');
  }
  if (drawRubber && anchor !== undefined) {
    drawLine(ctx, centerPoint(arect),
             centerPoint(getOffsetRectangle(canvas,
                                            selection.geometry().elements[multiselect.activeEnd(selection.selectionPath())])), 'green');
  }  
}

// Snake geometry shows the path as the rubber band.
SnakeGeometry.prototype.drawIndicators = function (selection, canvas, drawAnchor, drawCursor, drawRubber) {
  clearCanvas(canvas);
  var ctx = canvas.getContext('2d');
  var path = selection.selectionPath();
  if (drawAnchor && path.length > 0) {
    drawSmallCircle(ctx, multiselect.anchor(path), 'DarkRed');
  }
  if (drawRubber) {
    ctx.strokeStyle = 'green';
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var i = 1; i < path.length; ++i) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }
    if (this.removing) { drawSmallCircle(ctx, this.prevp, 'DarkRed', 20); }
  }
}

// Point geometry shows the selection path's points as small dots
PointGeometry.prototype.drawIndicators = function (selection, canvas, drawAnchor, drawCursor, drawRubber) {
  clearCanvas(canvas);
  var ctx = canvas.getContext('2d');
  if (drawRubber) {
    var path = selection.selectionPath();
    for (var i = 0; i < path.length; ++i) drawDot(ctx, path[i], 'green');
  }
}

// mixed geometry shows the anchor as a circle in rectangular selection mode,
// and frames the anchor element in row-wise mode. The cursor is shown as
// a framed element. Rubber band is only shown in rectangular selection mode.
MixedGeometry.prototype.drawIndicators = function (selection, canvas, drawAnchor, drawCursor, drawRubber) {
  clearCanvas(canvas);
  var ctx = canvas.getContext('2d');
  var anchor = multiselect.anchor(selection.selectionPath());    
  if (drawAnchor && anchor !== undefined) {
    if (anchor.index === undefined) drawSmallCircle(ctx, anchor.point, 'DarkRed');
    else drawRectangle(ctx, getOffsetRectangle(canvas, selection.geometry().elements[anchor.index]), 'DarkRed');
  }
  if (drawCursor && selection.cursor() !== undefined && selection.cursor().index !== undefined) {
    drawRectangle(ctx, getOffsetRectangle(canvas, selection.geometry().elements[selection.cursor().index]), 'blue');
  }    
  if (drawRubber && anchor !== undefined && anchor.index === undefined) {
    var activeEnd = multiselect.activeEnd(selection.selectionPath());
    drawRectangle(ctx, mkRectangle(anchor.point, activeEnd.point), 'green');
  }
}

////////////////////////
// Selectable content //
////////////////////////

document.addEventListener("DOMContentLoaded", function() { 

  var selectableArea = document.getElementById("selectable_area");
  for (var i = 0; i<400; ++i) {
    var e = document.createElement("span");
    e.setAttribute("class", "selectable");
    e.textContent = i;
    selectableArea.appendChild(e);
  }

  // The elements that can be selected are objects representing HTML spans.
  var selectables = selectableArea.getElementsByClassName("selectable");

  // The callback function that will show the selection state of the elements
  // is called after every selection command with a map of the changed elements
  var refresh = function (changed) {
    changed.forEach(function (value, i) {
      $(selectables[i]).toggleClass('selected', value);
    });
  };

  // Create five different geometries
  var rectangularGeometry = new RectangularGeometry(selectableArea, selectables);
  var rowGeometry = new RowGeometry(selectableArea, selectables);
  var snakeGeometry = new SnakeGeometry(selectableArea, selectables);
  var pointGeometry = new PointGeometry(selectableArea, selectables);
  var mixedGeometry = new MixedGeometry(selectableArea, selectables);

  // Create a selection object
  var selection = new multiselect.SelectionState(rectangularGeometry, refresh, true);

  // canvas will accept mouse and keyboard events and display the anchor, cursor, and rubber band indicators
  var canvas = createCanvas(selectableArea);

  setupMouseEvents(selectableArea, canvas, selection);
  setupKeyboardEvents(selectableArea, canvas, selection);

  // The logic for changing a geometry based on radio buttons
  $('input[type=radio][name=geometry]').on('change', function(){
    selection.geometry().drawIndicators(selection, canvas, false, false, false); // clear indicators
    switch($(this).val()){
    case 'rectangular': selection.setGeometry(rectangularGeometry); break;
    case 'rowwise': selection.setGeometry(rowGeometry); break;
    case 'snake': selection.setGeometry(snakeGeometry); break;
    case 'pointwise': selection.setGeometry(pointGeometry); break;
    case 'mixed': selection.setGeometry(mixedGeometry); break;
    }
  });

  // Handling filtering and select/deselect all events. All of them are implemented
  // as a call to the selection.filter() function. 
  $('#filter').on('keyup', function() {
    var str = $(this).val(); 
    selection.filter(function(i){ return str !== "" && selection.geometry().elements[i].innerHTML.indexOf(str)>-1; });
  });
  $("#commit_filter").click(function(){ selection.commit(); });
  $("#select_all").click(function(){ selection.filter( function(i) { return true; }); });
  $("#deselect_all").click(function(){ selection.filter( function(i) { return true; }, false); });
  
});
