/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// Paper.js cant extend subclasses!
// See: https://github.com/paperjs/paper.js/issues/1335

var hitOptions = {
  "stroke": true,
  "fill": true,
  "tolerance": 5
};

/////////// TRIGGER Factory
function triggerFactory(event) {
  var selectedtPath = "";
  var selectedtPathName = "";
  var state = false;
  var timer = 0;
  var trigger = new Group({
    data: {
      "name": "Trigger",
      "size": 40,
      "x": event.point.x,
      "y": event.point.y,
      "chan": 1,
      "note": 33
    },
    onMouseDown: function (event) {
      setMenuParams(this);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        this.children[1].fillColor = "red";
        console.log("Trigger: " + trigger.data.note + " bang");
        timer = 0;
        state = true;
      }
    },
    onMouseUp: function () {
      setMenuParams(this);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        //console.log(selectedtPath);
        switch (selectedtPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke" || "segment":
            if (selectedtPathName === "square") {
              scale2d(this, event);
            } else if (selectedtPathName === "trigg") {
              moveItem(this, event);
            }
            break;
        }
      } else if (currentMode === PLAY_MODE) {
        // TODO
      }
    },
    onFrame: function (event) {
      if (state) {
        timer++;
      }
      if (state && timer > 10) {
        state = false;
        this.children[1].fillColor = "green";
      }
    },
    onKeyDown: function (event) {
      if (currentMode === EDIT_MODE) {
        if (event.modifiers.shift) {
          if (Key.isDown("backspace")) {
            this.remove();
          }
        }
      }
    }
  });

  var square = new Path.Rectangle({
    name: "square",
    strokeWidth: 8,
    strokeColor: "lightblue",
    fillColor: "lightblue",
    from: new Point(trigger.data.x - (trigger.data.size / 2), trigger.data.y - (trigger.data.size / 2)),
    to: new Point(trigger.data.x + (trigger.data.size / 2), trigger.data.y + (trigger.data.size / 2))
  });
  trigger.addChild(square);
  var circle = new Path.Circle({
    name: "circle",
    fillColor: "green",
    center: new Point(trigger.data.x, trigger.data.y),
    radius: trigger.data.size / 2.2
  });
  trigger.addChild(circle);
  return trigger;
}

/////////// TOGGLE Factory
function toggleFactory(event) {
  var selectedtPath = "";
  var selectedtPathName = "";
  var state = false;
  var toggle = new Group({
    data: {
      "name": "Toggle",
      "size": 40,
      "x": event.point.x,
      "y": event.point.y,
      "chan": 1,
      "note": 64
    },
    onMouseDown: function (event) {
      setMenuParams(this);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        this.state = !this.state;
        if (this.state) {
          this.children[1].visible = true;
          console.log("Toggle: " + toggle.data.note + "  on");
        } else {
          this.children[1].visible = false;
          console.log("Toggle: " + toggle.data.note + "  off");
        }
      }
    },
    onMouseUp: function (event) {
      setMenuParams(this);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedtPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            if (selectedtPathName === "square") {
              scale2d(this, event);
            } else if (selectedtPathName === "cross") {
              moveItem(this, event);
            }
            break;
        }
      }
      else if (currentMode === PLAY_MODE) {
        // NA
      }
    }
  });
  var square = new Path.Rectangle({
    name: "square",
    strokeWidth: 8,
    strokeColor: "lightblue",
    fillColor: "white",
    //opacity: 0.5,
    from: new Point(toggle.data.x - (toggle.data.size / 2), toggle.data.y - (toggle.data.size / 2)),
    to: new Point(toggle.data.x + (toggle.data.size / 2), toggle.data.y + (toggle.data.size / 2))
  });
  toggle.addChild(square);
  var cross = new Group();
  var lineA = new Path.Line({
    name: "cross",
    strokeWidth: 7,
    strokeColor: "black",
    strokeCap: "round",
    from: new Point(toggle.data.x - (toggle.data.size / 3), toggle.data.y - (toggle.data.size / 3)),
    to: new Point(toggle.data.x + (toggle.data.size / 3), toggle.data.y + (toggle.data.size / 3))
  });
  cross.addChild(lineA);
  var lineB = new Path.Line({
    name: "cross",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 7,
    from: new Point(toggle.data.x + (toggle.data.size / 3), toggle.data.y - (toggle.data.size / 3)),
    to: new Point(toggle.data.x - (toggle.data.size / 3), toggle.data.y + (toggle.data.size / 3))
  });
  cross.addChild(lineB);
  toggle.addChild(cross);
  return toggle;
}

/////////// SLIDER Factory
function sliderFactory(event) {
  var topPos = 0;
  var bottomPos = 0;
  var rightPos = 0;
  var leftPos = 0;
  var sliderHitOptions = {
    "stroke": true,
    "segment": true,
    "fill": true,
    "tolerance": 5
  };
  var selectedtPath = "";
  var selectedtPathName = "";
  var selectedSegment = "";
  var slider = new Group({
    data: {
      "name": "Slider",
      "width": 30,
      "height": 150,
      "x": event.point.x,
      "y": event.point.y,
      "chan": 1,
      "cChange": 0,
      "min": 0,
      "max": 127,
      "val": 0
    },
    onMouseDown: function (event) {
      setMenuParams(this);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, sliderHitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
        if (selectedtPath === "stroke") selectedSegment = hitResult.location.index;
      }
      else if (currentMode === PLAY_MODE) {
        var bottomPos = slider.data.y + (slider.data.height / 2);
        slider.data.val = mapp(bottomPos - event.point.y, 0, slider.data.height, 0, 127);
        this.children[1].segments[0].point.y = event.point.y;
        this.children[1].segments[1].point.y = event.point.y;
      }
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedtPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            switch (selectedtPathName) {
              case "rect":
                switch (selectedSegment) {
                  case 0: // Update left segment
                    slider.data.x = rightPos - ((rightPos - event.point.x) / 2);
                    slider.data.width = (rightPos - slider.data.x) * 2;
                    this.children[0].segments[0].point.x = event.point.x;
                    this.children[0].segments[1].point.x = event.point.x;
                    this.children[1].segments[0].point.x = event.point.x;
                    break;
                  case 1: // Update top segment
                    slider.data.y = bottomPos - ((bottomPos - event.point.y) / 2);
                    slider.data.height = (bottomPos - slider.data.y) * 2;
                    this.children[0].segments[1].point.y = event.point.y;
                    this.children[0].segments[2].point.y = event.point.y;
                    break;
                  case 2: // Update right segment
                    slider.data.x = leftPos + ((event.point.x - leftPos) / 2);
                    slider.data.width = (slider.data.x - leftPos) * 2;
                    this.children[0].segments[2].point.x = event.point.x;
                    this.children[0].segments[3].point.x = event.point.x;
                    this.children[1].segments[1].point.x = event.point.x;
                    break;
                  case 3: // Update bottom segment
                    slider.data.y = topPos + ((event.point.y - topPos) / 2);
                    slider.data.height = (slider.data.y - topPos) * 2;
                    this.children[0].segments[3].point.y = event.point.y;
                    this.children[0].segments[0].point.y = event.point.y;
                    break;
                }
                break;
              case "handle":
                moveItem(this, event);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (event.point.y > topPos && event.point.y < bottomPos) {
          slider.data.val = mapp(bottomPos - event.point.y, 0, slider.data.height, 0, 127);
          this.children[1].segments[0].point.y = event.point.y;
          this.children[1].segments[1].point.y = event.point.y;
          setMenuParams(this);
        }
      }
    },
    onMouseUp: function (event) {
      if (currentMode === EDIT_MODE) {
        topPos = slider.data.y - (slider.data.height / 2);
        bottomPos = slider.data.y + (slider.data.height / 2);
        leftPos = slider.data.x - (slider.data.width / 2);
        rightPos = slider.data.x + (slider.data.width / 2);
        setMenuParams(this);
      }
      else if (currentMode === PLAY_MODE) {
        setMenuParams(this);
      }
    }
  });
  var rect = new Path.Rectangle({
    name: "rect",
    strokeColor: "lightblue",
    fillColor: "yellow",
    strokeWidth: 8,
    fillColor: "white",
    from: new Point(slider.data.x - (slider.data.width / 2), slider.data.y - (slider.data.height / 2)),
    to: new Point(slider.data.x + (slider.data.width / 2), slider.data.y + (slider.data.height / 2))
  });
  slider.addChild(rect);
  var handle = new Path.Line({
    name: "handle",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 10,
    from: new Point(slider.data.x - (slider.data.width / 2) - 2, slider.data.y),
    to: new Point(slider.data.x + (slider.data.width / 2) + 2, slider.data.y)
  });
  slider.addChild(handle);
  return slider;
}

/////////// KNOB Factory
function knobFactory(event) {
  var selectedtPath = "";
  var selectedtPathName = "";
  var knob = new Group({
    data: {
      "name": "Knob",
      "x": event.point.x,
      "y": event.point.y,
      "radius": 50,
      "rVal": 0,
      "tVal": 0,
      "offset": 0,
      "chan": 1,
      "ccTeta": 1,
      "tMin": 0,
      "tMax": 127,
      "ccRad": 2,
      "rMin": 0,
      "rMax": 127
    },
    onMouseDown: function (event) {
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        var p = getPolar(this, event);
        this.children[1].segments[1].point = radians_to_cartesian(this, p.radius, p.theta);

        knob.data.rVal = mapp(p.radius, 0, knob.data.radius, 0, 127);
        knob.data.tVal = mapp(radian_to_degree(this, event), 0, 380, 0, 127);

        setMenuParams(this);
      }
    },
    onMouseUp: function (event) {
      setMenuParams(this);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedtPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            switch (selectedtPathName) {
              case "knob":
                var x = event.point.x - knob.data.x;
                var y = event.point.y - knob.data.y;
                var radius = Math.sqrt((x * x) + (y * y));
                knob.scale(radius / knob.data.radius);
                knob.data.radius = radius;
                break;
              case "needle":
                moveItem(this, event);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        var p = getPolar(this, event);
        if (p.radius < knob.data.radius) {
          this.children[1].segments[1].point = radians_to_cartesian(this, p.radius, p.theta);
  
          knob.data.rVal = mapp(p.radius, 0, knob.data.radius, 0, 127);
          knob.data.tVal = mapp(radian_to_degree(this, event), 0, 380, 0, 127);
  
          setMenuParams(this);
        }
      }
    }
  });
  var circle = new Path.Circle({
    name: "knob",
    strokeColor: "lightblue",
    fillColor: "blue",
    opacity: 0.5,
    strokeWidth: 10,
    center: new Point(knob.data.x, knob.data.y),
    radius: knob.data.radius
  });
  knob.addChild(circle);
  var needle = new Path.Line({
    name: "needle",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 5,
    from: new Point(knob.data.x, knob.data.y),
    to: new Point(knob.data.x + knob.data.rVal, knob.data.y)
  });
  knob.addChild(needle);
  return knob;
}

function moveItem(item, event) {
  item.translate(event.delta);
  item.data.x += event.delta.x;
  item.data.y += event.delta.y;
}

function scale2d(item, event) {
  var x = event.point.x - item.data.x;
  var y = event.point.y - item.data.y;
  var radius = Math.sqrt((x * x) + (y * y));
  var newRadius = radius - (item.children[0].strokeWidth / 2);
  var oldRadius = item.data.size / 2;
  item.scale(newRadius / oldRadius);
  item.data.size = item.children[0].bounds.width;
}

function setMenuParams(item) {
  selectedItem = item;
  $('#summaryContent').html("Parameters");
  var paramsIndex = 0;
  for (const param in item.data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(item.data[param]);
    $("#param-" + paramsIndex).collapse("show");
    paramsIndex++;
  }
  for (var i = 15; i >= paramsIndex; i--) {
    $("#param-" + i).collapse("hide");
  }
}

function getPolar(item, event) {
  var x = event.point.x - item.data.x; // Place the x origin to the circle center
  var y = event.point.y - item.data.y; // Place the y origin to the circle center
  var radius = Math.sqrt(x * x + y * y);
  var theta = Math.atan2(y, x);
  return {
    "radius": radius,
    "theta": theta
  }
}

function radian_to_degree(item, event) {
  var degree = 0;

  var posX = event.point.x - item.data.x; // Place the x origin to the circle center
  var posY = event.point.y - item.data.y; // Place the y origin to the circle center
  // Rotation of Axes through an angle without shifting Origin 
  //var posX = x * Math.cos(item.data.offset) + y * Math.sin(item.data.offset);
  //var posY = -x * Math.sin(item.data.offset) + y * Math.cos(item.data.offset);

  if (posX == 0 && 0 < posY) {
    degree = (Math.PI / 2);
  } else if (posX == 0 && posY < 0) {
    degree = (3 * Math.PI) / 2;
  } else if (posX < 0) {
    degree = Math.atan(posY / posX) + Math.PI;
  } else if (posY < 0) {
    degree = Math.atan(posY / posX) + (2 * Math.PI);
  } else {
    degree = Math.atan(posY / posX);
  }
  return degree * 180 / Math.PI;
}

function radians_to_cartesian(item, radius, theta) {
  var x = radius * Math.cos(theta);
  var y = radius * Math.sin(theta);
  return new Point(x + item.data.x, y + item.data.y);
}

function mapp(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}