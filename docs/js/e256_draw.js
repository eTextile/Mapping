
function Matrix(width, height) {
  this.matrix = [width * height];
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = 0;
  }
}
Matrix.prototype.update = function (sysExMsg) {
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = sysExMsg[i + 1] / 10;
  }
}
Matrix.prototype.getZ = function (index) {
  var val = this.matrix[index];
  if (val != null) {
    return val;
  }
  else {
    return 0;
  }
}

//export { Blob };
function Blob(id, x, y, z, w, h) {
  this.uid = id;
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  this.h = h;
}

Blob.prototype.update = function (sysExMsg) {
  this.x = sysExMsg[2];
  this.y = sysExMsg[3];
  this.z = sysExMsg[4];
  this.w = sysExMsg[5];
  this.h = sysExMsg[6];
}

Blob.prototype.print = function () {
  console.log(
    `ID:` + this.uid +
    ` X:` + this.x +
    ` Y:` + this.y +
    ` Z:` + this.z +
    ` W:` + this.w +
    ` H:` + this.h
  );
}

// Blobs array management
function Blobs() {
  this.blobs = [];
}

Blobs.prototype.add = function (noteOn, callback) {
  if (this.blobs.findIndex(blob => blob.uid == noteOn[1]) == -1) {
    var blob = new Blob(noteOn[1], 0, 0, 0, 0, 0);
    this.blobs.push(blob);
    callback();
  } else {
    //console.log("BLOB_EXIST: " + noteOn[1]);
    return;
  }
}

Blobs.prototype.remove = function (noteOff, callback) {
  let index = this.blobs.findIndex(blob => blob.uid == noteOff[1]);
  if (index !== -1) {
    this.blobs.splice(index, 1);
    callback(index);
  } else {
    //console.log("BLOB_NOT_FOUND: " + noteOff[1]);
    return;
  }
}

Blobs.prototype.update = function (sysExMsg, callback) {
  let index = this.blobs.findIndex(blob => blob.uid == sysExMsg[1]);
  if (index != -1) {
    this.blobs[index].update(sysExMsg);
    callback(index);
  } else {
    //console.log("BLOB_NOT_FOUND: " + sysExMsg[1]);
    return;
  }
}

Blobs.prototype.get = function (index) {
  return this.blobs[index];
}

Blobs.prototype.size = function () {
  return this.blobs.length;
}

// Paper.js cant extend subclasses!
// See: https://github.com/paperjs/paper.js/issues/1335

/////////// TRIGGER Factory
var triggerWidth = 50;
var triggerHeight = 50;
function triggerFactory(pos) {
  var trigger = new Path.Rectangle({
    from: new Point(pos.x - (triggerWidth/2), pos.y - (triggerHeight/2)),
    to: new Point(pos.x + (triggerWidth/2), pos.y + (triggerHeight/2)),
    data: {
      "name": "Trigger",
      "chan": 1,
      "note": 10
    },
    darw: function () {
      //this.onMouseEnter = mouseEnter;
      //this.onMouseLeave = mouseLeave;
      this.strokeColor = "lightblue";
      this.fillColor = "lightgreen";
      this.strokeWidth = 10;
    },
    setPos: function (event) {
      this.translate(event.delta);
    },
    resize: function (event) {
      rectResize(event);
    }
  });
  return trigger;
}

/////////// TOGGLE Factory
var toggleWidth = 50;
var toggleHeight = 50;
var toggleFactory = function (pos) {
  var toggle = new Path.Rectangle({
    from: new Point(pos.x - (toggleWidth/2), pos.y - (toggleHeight/2)),
    to: new Point(pos.x + (toggleWidth/2), pos.y + (toggleHeight/2)),
    data: {
      "name": "Toggle",
      "chan": 1,
      "note": 10
    },
    darw: function () {
      //this.onMouseEnter = mouseEnter;
      //this.onMouseLeave = mouseLeave;
      this.strokeColor = "lightblue";
      this.fillColor = "pink";
      this.strokeWidth = 10;
    },
    setPos: function (event) {
      this.translate(event.delta);
    },
    resize: function (event) {
      rectResize(event);
    }
  });
  return toggle;
};

/////////// SLIDER Factory
var sliderWidth = 50;
var sliderHeight = 150;
function sliderFactory(pos) {
  var slider = new Path.Rectangle({
    from: new Point(pos.x - (sliderWidth/2), pos.y - (sliderHeight/2)),
    to: new Point(pos.x + (sliderWidth/2), pos.y + (sliderHeight/2)),
    data: {
      "name": "Slider",
      "chan": 1,
      "note": 10,
      "cChange": 0,
      "min": 0,
      "max": 127
    },
    darw: function () {
      //this.onMouseEnter = mouseEnter;
      //this.onMouseLeave = mouseLeave;
      this.strokeColor = "lightblue";
      this.fillColor = "yellow";
      this.strokeWidth = 10;
    },
    setPos: function (event) {
      this.translate(event.delta);
    },
    resize: function (event) {
      rectResize(event);
    }
  });
  return slider;
}
/////////// KNOB Factory
function knobFactory(pos) {
  var knob = new Path.Circle({
    center: new Point(pos.x, pos.y),
    radius: 40,
    data: {
      "name": "Knob",
      "chan": 1,
      "ccTeta": 1,
      "tMin": 0,
      "tMax": 127,
      "ccRad": 2,
      "rMin": 0,
      "rMax": 127
    },
    darw: function () {
      //this.onMouseEnter = mouseEnter;
      //this.onMouseLeave = mouseLeave;
      this.strokeColor = "lightblue";
      this.fillColor = "blue";
      this.opacity = 0.5;
      this.strokeWidth = 10;
    },
    setPos: function (event) {
      this.translate(event.delta);
    },
    resize: function (event) {
      var x = event.point.x - selectedItem.position.x;
      var y = event.point.y - selectedItem.position.y;
      var radius = Math.sqrt((x * x) + (y * y));
      var newRadius = radius - this.strokeWidth / 2;
      var oldRadius = this.bounds.width / 2;
      this.scale(newRadius / oldRadius);
    }
  });
  return knob;
}

function rectResize(event) {
  switch (selectSegment) {
    case 0:
      selectedItem.segments[0].point.x = event.point.x;
      selectedItem.segments[1].point.x = event.point.x;
      break;
    case 1:
      selectedItem.segments[1].point.y = event.point.y;
      selectedItem.segments[2].point.y = event.point.y;
      break;
    case 2:
      selectedItem.segments[2].point.x = event.point.x;
      selectedItem.segments[3].point.x = event.point.x;
      break;
    case 3:
      selectedItem.segments[3].point.y = event.point.y;
      selectedItem.segments[0].point.y = event.point.y;
      break;
  }
}