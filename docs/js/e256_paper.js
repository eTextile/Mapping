//let e256_blobs = new blobs();

// Only executed our code once the DOM is ready.
window.onload = function() {

  // Get a reference to the canvas object
  var canvas = document.getElementById('myScene');
  // Create an empty project and a view for the canvas:
  paper.setup(canvas);
  // Create a Paper.js Path to draw a line into it:
  var path = new paper.Path();
  // Give the stroke a color
  path.strokeColor = 'black';
  var start = new paper.Point(100, 100);

  /*
  for (var i = 0; i<e256_blobs.size; i++){
    console.log("BLOB_ID: " + e256_blobs.all[i].id);
    var start = new paper.Point(
      e256_blobs.all[i].x,
      e256_blobs.all[i].y
    );
  };
*/
  // Move to start and draw a line from there
  path.moveTo(start);
  // Note that the plus operator on Point objects does not work
  // in JavaScript. Instead, we need to call the add() function:
  path.lineTo(start.add([ 200, -50 ]));
  // Draw the view now:
  paper.view.draw();
}
