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

/////////// SLIDER Factory
function touchpadFactory(event) {
  var maxTop = 0;
  var maxBott = 0;
  var maxRight = 0;
  var maxLeft = 0;
  var touchpadHitOptions = {
    "stroke": true,
    "segment": true,
    "fill": true,
    "tolerance": 5
  };
  var selectedtPath = "";
  var selectedtPathName = "";
  var selectedSegment = "";
  var touchpad = new Group({
    data: {
      "name": "Touchpad",
      "width": 300,
      "height": 300,
      "x": event.point.x,
      "y": event.point.y,
      "chan": 1,
      "cChange": [0, 1, 2, 3, 4, 5, 6, 7],
      "min": 0,
      "max": 127,
      "val": [0, 0, 0, 0, 0, 0, 0, 0]
    },
    onMouseDown: function (event) {
      setMenuParams(this);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, touchpadHitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
        if (selectedtPath === "stroke") selectedSegment = hitResult.location.index;
      }
      else if (currentMode === PLAY_MODE) {
        //var maxBott = touchpad.data.y + (touchpad.data.height / 2);
        //touchpad.data.val = mapp(maxBott - event.point.y, 0, touchpad.data.height, 0, 127);

        this.children[1].children[0].segments[0].point.y = event.point.y;
        this.children[1].children[0].segments[1].point.y = event.point.y;
        this.children[1].children[1].segments[0].point.x = event.point.x;
        this.children[1].children[1].segments[1].point.x = event.point.x;
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
                    this.children[0].segments[0].point.x = event.point.x;
                    this.children[0].segments[1].point.x = event.point.x;
                    this.children[1].children[0].segments[0].point.x = event.point.x;

                    touchpad.data.x = maxRight - ((maxRight - event.point.x) / 2);
                    touchpad.data.width = (maxRight - touchpad.data.x) * 2;
                    this.children[1].children[1].segments[0].point.x = touchpad.data.x;
                    this.children[1].children[1].segments[1].point.x = touchpad.data.x;
                    break;

                  case 1: // Update top segment
                    this.children[0].segments[1].point.y = event.point.y;
                    this.children[0].segments[2].point.y = event.point.y;
                    this.children[1].children[1].segments[0].point.y = event.point.y;

                    touchpad.data.y = maxBott - ((maxBott - event.point.y) / 2);
                    touchpad.data.height = (maxBott - touchpad.data.y) * 2;
                    this.children[1].children[0].segments[0].point.y = touchpad.data.y;
                    this.children[1].children[0].segments[1].point.y = touchpad.data.y;
                    break;

                  case 2: // Update right segment
                    this.children[0].segments[2].point.x = event.point.x;
                    this.children[0].segments[3].point.x = event.point.x;
                    this.children[1].children[0].segments[1].point.x = event.point.x;

                    touchpad.data.x = maxLeft + ((event.point.x - maxLeft) / 2);
                    touchpad.data.width = (touchpad.data.x - maxLeft) * 2;
                    this.children[1].children[1].segments[0].point.x = touchpad.data.x ;
                    this.children[1].children[1].segments[1].point.x = touchpad.data.x ;
                    break;

                  case 3: // Update bottom segment
                    this.children[0].segments[3].point.y = event.point.y;
                    this.children[0].segments[0].point.y = event.point.y;
                    this.children[1].children[1].segments[1].point.y = event.point.y;

                    touchpad.data.y = maxTop + ((event.point.y - maxTop) / 2);
                    touchpad.data.height = (touchpad.data.y - maxTop) * 2;
                    this.children[1].children[0].segments[0].point.y = touchpad.data.y;
                    this.children[1].children[0].segments[1].point.y = touchpad.data.y;
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
        if (event.point.y > maxTop && event.point.y < maxBott) {
          if (event.point.x > maxLeft && event.point.x < maxRight) {
            //touchpad.data.val = mapp(maxBott - event.point.y, 0, touchpad.data.height, 0, 127);
            this.children[1].children[0].segments[0].point.y = event.point.y;
            this.children[1].children[0].segments[1].point.y = event.point.y;
            this.children[1].children[1].segments[0].point.x = event.point.x;
            this.children[1].children[1].segments[1].point.x = event.point.x;
            setMenuParams(this);
          }
        }
      }
    },
    onMouseUp: function (event) {
      if (currentMode === EDIT_MODE) {
        maxTop = touchpad.data.y - (touchpad.data.height / 2);
        maxBott = touchpad.data.y + (touchpad.data.height / 2);
        maxLeft = touchpad.data.x - (touchpad.data.width / 2);
        maxRight = touchpad.data.x + (touchpad.data.width / 2);
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
    fillColor: "purple",
    strokeWidth: 8,
    fillColor: "white",
    from: new Point(touchpad.data.x - (touchpad.data.width / 2), touchpad.data.y - (touchpad.data.height / 2)),
    to: new Point(touchpad.data.x + (touchpad.data.width / 2), touchpad.data.y + (touchpad.data.height / 2))
  });
  touchpad.addChild(rect);

  var coord = new Group(
    axis_x = Path.Line({
      name: "axis_x",
      strokeColor: "black",
      strokeWidth: 3,
      from: new Point(touchpad.data.x - (touchpad.data.width / 2), touchpad.data.y),
      to: new Point(touchpad.data.x + (touchpad.data.width / 2), touchpad.data.y),
    }),
    axis_y = Path.Line({
      name: "axis_y",
      strokeCap: "round",
      strokeColor: "black",
      strokeWidth: 3,
      from: new Point(touchpad.data.x, touchpad.data.y - (touchpad.data.height / 2)),
      to: new Point(touchpad.data.x, touchpad.data.y + (touchpad.data.height / 2)),
    })
  );
  touchpad.addChild(coord);

  return touchpad;
}

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
  var maxTop = 0;
  var maxBott = 0;
  var maxRight = 0;
  var maxLeft = 0;
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
        var maxBott = slider.data.y + (slider.data.height / 2);
        slider.data.val = mapp(maxBott - event.point.y, 0, slider.data.height, 0, 127);
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
                    slider.data.x = maxRight - ((maxRight - event.point.x) / 2);
                    slider.data.width = (maxRight - slider.data.x) * 2;
                    this.children[0].segments[0].point.x = event.point.x;
                    this.children[0].segments[1].point.x = event.point.x;
                    this.children[1].segments[0].point.x = event.point.x;
                    break;
                  case 1: // Update top segment
                    slider.data.y = maxBott - ((maxBott - event.point.y) / 2);
                    slider.data.height = (maxBott - slider.data.y) * 2;
                    this.children[0].segments[1].point.y = event.point.y;
                    this.children[0].segments[2].point.y = event.point.y;
                    this.children[1].segments[0].point.y = slider.data.y;
                    this.children[1].segments[1].point.y = slider.data.y;

                    break;
                  case 2: // Update right segment
                    slider.data.x = maxLeft + ((event.point.x - maxLeft) / 2);
                    slider.data.width = (slider.data.x - maxLeft) * 2;
                    this.children[0].segments[2].point.x = event.point.x;
                    this.children[0].segments[3].point.x = event.point.x;
                    this.children[1].segments[1].point.x = event.point.x;
                    break;
                  case 3: // Update bottom segment
                    slider.data.y = maxTop + ((event.point.y - maxTop) / 2);
                    slider.data.height = (slider.data.y - maxTop) * 2;
                    this.children[0].segments[3].point.y = event.point.y;
                    this.children[0].segments[0].point.y = event.point.y;
                    this.children[1].segments[0].point.y = slider.data.y;
                    this.children[1].segments[1].point.y = slider.data.y;
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
        if (event.point.y > maxTop && event.point.y < maxBott) {
          slider.data.val = mapp(maxBott - event.point.y, 0, slider.data.height, 0, 127);
          this.children[1].segments[0].point.y = event.point.y;
          this.children[1].segments[1].point.y = event.point.y;
          setMenuParams(this);
        }
      }
    },
    onMouseUp: function (event) {
      if (currentMode === EDIT_MODE) {
        maxTop = slider.data.y - (slider.data.height / 2);
        maxBott = slider.data.y + (slider.data.height / 2);
        maxLeft = slider.data.x - (slider.data.width / 2);
        maxRight = slider.data.x + (slider.data.width / 2);
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
  var offset = 0;
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
      "offset": 60,
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
        var x = event.point.x - knob.data.x; // Place the x origin to the circle center
        var y = event.point.y - knob.data.y; // Place the x origin to the circle center
        var polar = cart_to_pol(x, y);

        var headPos = pol_to_cart(polar.radius - 10, polar.theta);
        var footPos = pol_to_cart(polar.radius - this.children[1].children[0].bounds.width - 1, polar.theta);

        this.children[1].children[0].position = new Point(knob.data.x + headPos.x, knob.data.y + headPos.y);
        this.children[1].children[1].segments[1].point = new Point(knob.data.x + footPos.x, knob.data.y + footPos.y);

        knob.data.rVal = mapp(polar.radius, 0, knob.data.radius, knob.data.rMin, knob.data.rMax);
        var newPolar = rotatePolar(this, rad_to_deg(polar.theta));
        knob.data.tVal = mapp(newPolar, 0, 380, knob.data.tMin, knob.data.tMax);
        setMenuParams(this);
      }
    },
    onMouseUp: function (event) {
      offset = knob.data.offset;
      setMenuParams(this);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedtPath) {
          case "fill":
            if (selectedtPathName === "offset") {
              var x = event.point.x - knob.data.x; // Place the x origin to the circle center
              var y = event.point.y - knob.data.y; // Place the x origin to the circle center
              knob.data.offset = offset;
              offset = rad_to_deg(cart_to_pol(x, y).theta);
              var delta = offset - knob.data.offset;
              this.children[2].rotate(delta, new Point(knob.data.x, knob.data.y));
              setMenuParams(this);
            } else {
              moveItem(this, event);
            }
            break;
          case "stroke":
            switch (selectedtPathName) {
              case "knob":
                var x = event.point.x - knob.data.x;
                var y = event.point.y - knob.data.y;
                var polar = cart_to_pol(x, y);
                knob.scale(polar.radius / knob.data.radius);
                knob.data.radius = polar.radius;
                break;
              case "needle" || "head":
                moveItem(this, event);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        var x = event.point.x - knob.data.x; // Place the x origin to the circle center
        var y = event.point.y - knob.data.y; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);

        var headPos;
        var footPos;
        if (polar.radius > knob.data.radius) {
          headPos = pol_to_cart(knob.data.radius - 10, polar.theta);
          footPos = pol_to_cart(knob.data.radius - this.children[1].children[0].bounds.width - 1, polar.theta);
          knob.data.rVal = mapp(knob.data.radius, 0, knob.data.radius, knob.data.rMin, knob.data.rMax);
        } else {
          headPos = pol_to_cart(polar.radius - 10, polar.theta);
          footPos = pol_to_cart(polar.radius - this.children[1].children[0].bounds.width - 1, polar.theta);
          knob.data.rVal = mapp(polar.radius, 0, knob.data.radius, knob.data.rMin, knob.data.rMax);
        }
        var newPolar = rotatePolar(this, rad_to_deg(polar.theta));
        knob.data.tVal = mapp(newPolar, 0, 380, knob.data.tMin, knob.data.tMax);

        this.children[1].children[0].position = new Point(knob.data.x + headPos.x, knob.data.y + headPos.y);
        this.children[1].children[1].segments[1].point = new Point(knob.data.x + footPos.x, knob.data.y + footPos.y);

        setMenuParams(this);
      }
    }
  });
  var circle = new Path.Circle({
    name: "knob",
    strokeColor: "lightblue",
    fillColor: "blue",
    //opacity: 0.5,
    strokeWidth: 10,
    center: new Point(knob.data.x, knob.data.y),
    radius: knob.data.radius
  });
  knob.addChild(circle);

  var headPos = pol_to_cart(knob.data.radius - 10, deg_to_rad(knob.data.offset));
  var footPos = pol_to_cart(knob.data.radius - 20, deg_to_rad(knob.data.offset));
  var offsetPos = pol_to_cart(knob.data.radius + 15, deg_to_rad(knob.data.offset));

  var needle = new Group(
    head = Path.Circle({
      name: "head",
      strokeColor: "black",
      strokeWidth: 5,
      center: new Point(knob.data.x + headPos.x, knob.data.y + headPos.y),
      radius: 6
    }),
    foot = Path.Line({
      name: "foot",
      strokeCap: "round",
      strokeColor: "black",
      strokeWidth: 5,
      from: new Point(knob.data.x, knob.data.y),
      to: new Point((knob.data.x + footPos.x), knob.data.y + footPos.y),
    })
  );
  knob.addChild(needle);

  var offset = new Path.RegularPolygon({
    name: "offset",
    fillColor: "red",
    center: new Point(knob.data.x + offsetPos.x, knob.data.y + offsetPos.y),
    sides: 3,
    radius: 10
  });
  offset.rotate(-30);
  knob.addChild(offset);

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

function deg_to_rad(degree) {
  return degree * (Math.PI / 180);
}

function rad_to_deg(radian) {
  return radian * (180 / Math.PI);
}

function cart_to_pol(x, y) {
  // Returning radian
  var radius = Math.sqrt((x * x) + (y * y));
  //var theta = Math.atan2(y, x); // NOT_WORKING
  var theta = 0;
  if (x == 0 && 0 < y) {
    theta = (Math.PI / 2);
  } else if (x == 0 && y < 0) {
    theta = (3 * Math.PI) / 2;
  } else if (x < 0) {
    theta = Math.atan(y / x) + Math.PI;
  } else if (y < 0) {
    theta = Math.atan(y / x) + (2 * Math.PI);
  } else {
    theta = Math.atan(y / x);
  }
  return {
    "radius": radius,
    "theta": theta
  }
}

function pol_to_cart(radius, theta) {
  var x = radius * Math.cos(theta);
  var y = radius * Math.sin(theta);
  return {
    "x": x,
    "y": y
  }
}

function rotatePolar(item, degree) {
  // return (Math.abs(degree - 380) + item.data.offset) % 380; // anti-clockwise direction
  return (Math.abs(degree + 380) - item.data.offset) % 380; // clockwise direction
}

function mapp(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
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
