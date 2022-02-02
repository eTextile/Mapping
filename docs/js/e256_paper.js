window.onload = function () {
    // Get a reference to the canvas object
    var canvas = document.getElementById('myScene');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([10, 10]));
    // Draw the view now:
    paper.view.draw();

    var e256_draw = function() {
        for (var i = 0; i < e256_blobs.size(); i++) {
            let myBlob = e256_blobs.get(i);
            //console.log("BLOB: " + myBlob.id);
            //myBlob.print();
        }
    }

    e256_blobs.move = e256_draw;
}