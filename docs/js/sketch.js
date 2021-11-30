/*
This is simple code to control and read from the Arduino in P5
*/

function setup() {
  createCanvas(400, 400);
}

var i = 0;

function draw() {
  i++;
  background(100*ledStatus);
  rect(val1 / 2, val2/2, 10, 10);
  fill(255, 255, 255);
  textSize(30);
  text(val1, 60, 60)
}

var ledStatus = false;

function mouseClicked() {
  if (ledStatus === true) {
    writeToStream('B.')
    ledStatus = false;
  } else {
    writeToStream('A.')
    ledStatus = true;
  }
}

function keyPressed() {
  select('#serialControls').hide();
}