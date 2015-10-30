////////////////////////////////////
// MultiselectJS demo application //
//                                //
// Author: Jaakko Järvi           //
//                                //
// Helper and utility functions   //
////////////////////////////////////


///////////////////////////////////////////////////////////////
// determine which modifier keys were held down during event //
///////////////////////////////////////////////////////////////

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

///////////////////////
// general utilities //
///////////////////////

function or_default(v, def) { return v === undefined ? def : v; }

////////////////////////////////////////////////////////////
// helper functions to deal with points, rectangles, etc. //
////////////////////////////////////////////////////////////

function pointInRectangle(p, r) {
  return p.x >= r.left && p.x <= r.right && 
    p.y >= r.top && p.y <= r.bottom;
}

function topLeftCorner(r) { return { x: r.left, y: r.top }; }

function offsetRectangle(p, r) {
  return {
    left: r.left - p.x, top: r.top - p.y, 
    right: r.right - p.x, bottom: r.bottom - p.y 
  };
}

// get elem's bounding rectangle relative to parent's top left corner
function getOffsetRectangle(parent, elem) {
  return offsetRectangle(topLeftCorner(parent.getBoundingClientRect()),
                         elem.getBoundingClientRect());
}

// get event position relative to parent's top left corner
function offsetMousePos(parent, evt) { 
  var p = topLeftCorner(parent.getClientRects()[0]);
  return { x: evt.clientX - p.x, y: evt.clientY - p.y }; 
}


function rectangleIntersect(r1, r2) {
  return r1.left <= r2.right && r1.right >= r2.left && 
         r1.top <= r2.bottom && r1.bottom >= r2.top;
}

function rectangleInclusion(r1, r2) {
  return r1.left <= r2.left && r1.right >= r2.right && 
         r1.top <= r2.top && r1.bottom >= r2.bottom;
}


function centerPoint (r) { return { x: (r.left + r.right)/2, 
                                    y: (r.top + r.bottom)/2 }; }

function isAbove(r1, r2) { return centerPoint(r1).y < r2.top; }
function isBelow(r1, r2) { return centerPoint(r1).y > r2.bottom; }

function distance (p1, p2) {
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function findClosestP(parent, elements, j, pred) {
  var r = getOffsetRectangle(parent, elements[j]);
  var candidateIndex = null; 
  var candidateDistance = Number.MAX_VALUE;

  for (var i=0; i<elements.length; ++i) {
    var rc = getOffsetRectangle(parent, elements[i]);
    if (pred(rc, r) && distance(centerPoint(r), centerPoint(rc)) < candidateDistance) {
      candidateIndex = i; 
      candidateDistance = distance(centerPoint(r), centerPoint(rc));
    }
  }
  if (candidateIndex === null) return j; else return candidateIndex;
}

function lineRectIntersect(p1, p2, r) {
  if (!rectangleIntersect(mkRectangle(p1, p2), r)) return false; // if bounding boxes do not overlap, cannot intersect
  if (pointEquals(p1, p2)) return pointInRectangle(p1, r);
  var p = {};
  if (lineIntersect(p1, p2, { x: r.left, y: r.top }, { x: r.left, y: r.bottom }, p) === 1) return true;
  if (lineIntersect(p1, p2, { x: r.left, y: r.top }, { x: r.right, y: r.top }, p) === 1) return true;
  if (lineIntersect(p1, p2, { x: r.right, y: r.bottom }, { x: r.right, y: r.top }, p) === 1) return true;
  if (lineIntersect(p1, p2, { x: r.right, y: r.bottom }, { x: r.left, y: r.bottom }, p) === 1) return true;
  return pointInRectangle(p1, r) || pointInRectangle(p2, r);
}

function pointEquals(p1, p2) { return p1.x === p2.x && p1.y === p2.y; }

// 3-point angle
function angle(a, b, c) {
  var ab = Math.sqrt(Math.pow(b.x-a.x,2)+ Math.pow(b.y-a.y,2));    
  var bc = Math.sqrt(Math.pow(b.x-c.x,2)+ Math.pow(b.y-c.y,2)); 
  var ac = Math.sqrt(Math.pow(c.x-a.x,2)+ Math.pow(c.y-a.y,2));
  return Math.acos((bc*bc+ab*ab-ac*ac)/(2*bc*ab));
}

/* This is a bit more involved function, 
   adapted from Prasad Mukesh's C-code "Intersection of Line Segments", 
   ACM Transaction of Graphics' Graphics Gems II, p. 7--9, code: p. 473--476, xlines.c.
   
 * lines_intersect:  AUTHOR: Mukesh Prasad
 *
 *   This function computes whether two line segments,
 *   respectively joining the input points (x1,y1) -- (x2,y2)
 *   and the input points (x3,y3) -- (x4,y4) intersect.
 *   If the lines intersect, the output variables x, y are
 *   set to coordinates of the point of intersection.
 *
 *   All values are in integers.  The returned value is rounded
 *   to the nearest integer point.
 *
 *   If non-integral grid points are relevant, the function
 *   can easily be transformed by substituting floating point
 *   calculations instead of integer calculations.
 *
 *   Entry
 *        x1, y1,  x2, y2   Coordinates of endpoints of one segment.
 *        x3, y3,  x4, y4   Coordinates of endpoints of other segment.
 *
 *   Exit
 *        x, y              Coordinates of intersection point.
 *
 *   The value returned by the function is one of:
 *
 *        DONT_INTERSECT    0
 *        DO_INTERSECT      1
 *        COLLINEAR         2
 *
 * Error conditions:
 *
 *     Depending upon the possible ranges, and particularly on 16-bit
 *     computers, care should be taken to protect from overflow.
 *
 *     In the following code, 'long' values have been used for this
 *     purpose, instead of 'int'.
 *
 */

  function sameSigns(a, b) { return a >= 0 && b >= 0 || a < 0 && b < 0; }

  function lineIntersect( p1,   /* First line segment */
                          p2,
                          p3,   /* Second line segment */
                          p4,
                          p5    /* Output value:
                                 * point of intersection */
                        )
  {
    const DONT_INTERSECT = 0;
    const DO_INTERSECT = 1;
    const COLLINEAR = 2;

    var a1, a2, b1, b2, c1, c2; /* Coefficients of line eqns. */
    var r1, r2, r3, r4;         /* 'Sign' values */
    var denom, offset, num;     /* Intermediate values */

    /* Compute a1, b1, c1, where line joining points 1 and 2
     * is "a1 x  +  b1 y  +  c1  =  0".
     */

    a1 = p2.y - p1.y;
    b1 = p1.x - p2.x;
    c1 = p2.x * p1.y - p1.x * p2.y;

    /* Compute r3 and r4.
     */
    r3 = a1 * p3.x + b1 * p3.y + c1;
    r4 = a1 * p4.x + b1 * p4.y + c1;

    /* Check signs of r3 and r4.  If both point 3 and point 4 lie on
     * same side of line 1, the line segments do not intersect.
     */
    if ( r3 != 0 &&
         r4 != 0 &&
         sameSigns( r3, r4 ))
      return ( DONT_INTERSECT );

    /* Compute a2, b2, c2 */
    a2 = p4.y - p3.y;
    b2 = p3.x - p4.x;
    c2 = p4.x * p3.y - p3.x * p4.y;

    /* Compute r1 and r2 */
    r1 = a2 * p1.x + b2 * p1.y + c2;
    r2 = a2 * p2.x + b2 * p2.y + c2;

    /* Check signs of r1 and r2.  If both point 1 and point 2 lie
     * on same side of second line segment, the line segments do
     * not intersect.
     */
    if ( r1 !== 0 &&
         r2 !== 0 &&
         sameSigns( r1, r2 ))
      return ( DONT_INTERSECT );

    /* Line segments intersect: compute intersection point. 
     */

    denom = a1 * b2 - a2 * b1;
    if ( denom === 0 )
      return ( COLLINEAR );
    // offset = denom < 0 ? - denom / 2 : denom / 2;

    // /* The denom/2 is to get rounding instead of truncating.  It
    //  * is added or subtracted to the numerator, depending upon the
    //  * sign of the numerator.
    //  */

    // num = b1 * c2 - b2 * c1;
    // p5.x = ( num < 0 ? num - offset : num + offset ) / denom;

    // num = a2 * c1 - a1 * c2;
    // p5.y = ( num < 0 ? num - offset : num + offset ) / denom;

    return DO_INTERSECT;
  } 

////////////////////////////////////////////
// A canvas for drawing selection cursors //
////////////////////////////////////////////

// create canvas over parent, and track its size
function createCanvas (parent) {
  
  var canvas = document.createElement("canvas");
  canvas.style.position = 'absolute';
  parent.insertBefore(canvas, parent.firstChild);
  
  $(window).resize(resizeCanvas); 
  resizeCanvas();
  
  return canvas;
  
  function resizeCanvas() {
    var rect = parent.getBoundingClientRect();
    canvas.width = rect.right - rect.left;
    canvas.height = rect.bottom - rect.top;    
  }
}

function clearCanvas (canvas) {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function drawSmallCircle(ctx, p, color, r) {
  if (r === undefined) r = 6;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI*2, true); 
  ctx.stroke();
}

function drawDot(ctx, p, color) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2, 0, Math.PI*2, true);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawRectangle(ctx, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.left, r.top, r.right-r.left, r.bottom-r.top);
}

function mkRectangle(p1, p2) {
  return {
    left: Math.min(p1.x, p2.x),
    top: Math.min(p1.y, p2.y),
    right: Math.max(p1.x, p2.x),
    bottom: Math.max(p1.y, p2.y),
  };
}

function drawLine(ctx, p1, p2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

  
