/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// Paper.js can't extend subclasses!
// See: https://github.com/paperjs/paper.js/issues/1335
  // pixi.js: https://pixijs.com/
  // Typescript: https://www.typescriptlang.org/

const MAX_PARAM = 16;

var hitOptions = {
  "stroke": true,
  "fill": true,
  "tolerance": 5
};

/////////// TOUCHPAD Factory
function touchpadFactory(event) {
  var topPos = 0;
  var bottPos = 0;
  var rightPos = 0;
  var leftPos = 0;
  var selectedItem = null;
  var selectedtPath = null;
  var selectedtPathName = null;
  var selectedSegment = null;
  var touchpadHitOptions = {
    "stroke": true,
    "segment": true,
    "fill": true,
    "tolerance": 5
  };

  var touchpad = new paper.Group({
    data: {
      "name": "Touchpad",
      "width": 400,
      "height": 400,
      "x": Math.round(event.point.x),
      "y": Math.round(event.point.y),
      "min": 0,
      "max": 127,
      "blobs": 3
    },
    onCreate: function () {
      touchpad.addChild(pad);
      for (var i = 0; i < this.data.blobs; i++) {
        var item = touch.clone({ insert: false, deep: true });
        item.data.name = ("Touch-" + i);
        item.data.Xval = getRandomInt(touchpad.data.x - (touchpad.data.width / 2), touchpad.data.x + (touchpad.data.width / 2));
        item.data.Yval = getRandomInt(touchpad.data.y - (touchpad.data.height / 2), touchpad.data.y + (touchpad.data.height / 2));
        item.children[0].data.name = ("LineX-" + i);
        item.children[0].segments[0].point = new paper.Point(touchpad.data.x - (touchpad.data.width / 2), item.data.Yval);
        item.children[0].segments[1].point = new paper.Point(touchpad.data.x + (touchpad.data.width / 2), item.data.Yval);
        item.children[1].data.name = ("LineY-" + i);
        item.children[1].segments[0].point = new paper.Point(item.data.Xval, touchpad.data.y - (touchpad.data.height / 2));
        item.children[1].segments[1].point = new paper.Point(item.data.Xval, touchpad.data.y + (touchpad.data.height / 2));
        item.children[2].data.name = ("Circle-" + i);
        item.children[2].position.x = item.data.Xval;
        item.children[2].position.y = item.data.Yval;
        //console.log(item.data);
        //console.log(item.children[0].data);
        //console.log(item.children[1].data);
        //console.log(item.children[2].data);
        touchpad.addChild(item);
      }
    },
    onMouseDown: function (event) {
      var hitResult = this.hitTest(event.point, touchpadHitOptions);
      selectedtPath = hitResult.type;
      if (currentMode === EDIT_MODE) {
        if (selectedtPath != null) {
          switch (selectedtPath) {
            case "fill":
              selectedtPathName = hitResult.item.name;
              selectedItem = hitResult.item.parent;
              setMenuParams(selectedItem);
              break;
            case "stroke":
              selectedtPathName = hitResult.item.name;
              selectedSegment = hitResult.location.index;
              break;
            default:
              // NA
              break;
          }
        }
        else {
          // DEBUG
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedtPath != null) {
          switch (selectedtPath) {
            case "fill":
              selectedtPathName = hitResult.item.name;
              selectedItem = hitResult.item.parent;
              setMenuParams(selectedItem);
              break;
            case "stroke":
              // NA
              break;
          }
        }
      }
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedtPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            if (selectedtPathName === "Pad") {
              switch (selectedSegment) {
                case 0: // Update left segment
                  this.children["Pad"].segments[0].point.x = event.point.x;
                  this.children["Pad"].segments[1].point.x = event.point.x;
                  var lastWidth = touchpad.data.width;
                  touchpad.data.x = Math.round(rightPos - ((rightPos - event.point.x) / 2));
                  touchpad.data.width = Math.round((rightPos - touchpad.data.x) * 2);
                  for (var i = 1; i < this.data.blobs + 1; i++) {
                    var item = touchpad.children[i];
                    item.children[0].segments[0].point.x = event.point.x;
                    var newWidth = ((rightPos - item.children[1].segments[0].point.x) * touchpad.data.width) / lastWidth;
                    item.children[1].segments[0].point.x = rightPos - newWidth;
                    item.children[1].segments[1].point.x = rightPos - newWidth;
                    item.children[2].position.x = rightPos - newWidth;
                  }
                  break;
                case 1: // Update top segment
                  this.children["Pad"].segments[1].point.y = event.point.y;
                  this.children["Pad"].segments[2].point.y = event.point.y;
                  var lastHeight = touchpad.data.height;
                  touchpad.data.y = Math.round(bottPos - ((bottPos - event.point.y) / 2));
                  touchpad.data.height = Math.round((bottPos - touchpad.data.y) * 2);
                  for (var i = 1; i < this.data.blobs + 1; i++) {
                    var item = touchpad.children[i];
                    item.children[1].segments[0].point.y = event.point.y;
                    var newHeight = ((bottPos - item.children[0].segments[0].point.y) * touchpad.data.height) / lastHeight;
                    item.children[0].segments[0].point.y = bottPos - newHeight;
                    item.children[0].segments[1].point.y = bottPos - newHeight;
                    item.children[2].position.y = bottPos - newHeight;
                  }
                  break;
                case 2: // Update right segment
                  this.children["Pad"].segments[2].point.x = event.point.x;
                  this.children["Pad"].segments[3].point.x = event.point.x;
                  var lastWidth = touchpad.data.width;
                  touchpad.data.x = Math.round(leftPos + ((event.point.x - leftPos) / 2));
                  touchpad.data.width = Math.round((touchpad.data.x - leftPos) * 2);
                  for (var i = 1; i < this.data.blobs + 1; i++) {
                    var item = touchpad.children[i];
                    item.children[0].segments[1].point.x = event.point.x;
                    var newWidth = ((item.children[1].segments[0].point.x - leftPos) * touchpad.data.width) / lastWidth;
                    item.children[1].segments[0].point.x = leftPos + newWidth;
                    item.children[1].segments[1].point.x = leftPos + newWidth;
                    item.children[2].position.x = leftPos + newWidth;
                  }
                  break;
                case 3: // Update bottom segment
                  this.children["Pad"].segments[3].point.y = event.point.y;
                  this.children["Pad"].segments[0].point.y = event.point.y;
                  var lastHeight = touchpad.data.height;
                  touchpad.data.y = Math.round(topPos + ((event.point.y - topPos) / 2));
                  touchpad.data.height = Math.round((touchpad.data.y - topPos) * 2);
                  for (var i = 1; i < this.data.blobs + 1; i++) {
                    var item = touchpad.children[i];
                    item.children[1].segments[1].point.y = event.point.y;
                    var newHeight = ((item.children[0].segments[0].point.y - topPos) * touchpad.data.height) / lastHeight;
                    item.children[0].segments[0].point.y = topPos + newHeight;
                    item.children[0].segments[1].point.y = topPos + newHeight;
                    item.children[2].position.y = topPos + newHeight;
                  }
                  break;
              }
              break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedtPathName === "Pad") {
          // NA
        } else {
          if (event.point.y > topPos && event.point.y < bottPos) {
            if (event.point.x > leftPos && event.point.x < rightPos) {

              selectedItem.data.Xval = Math.round(mapp(event.point.x - leftPos, 0, touchpad.data.width, touchpad.data.min, touchpad.data.max));
              selectedItem.data.Yval = Math.round(mapp(event.point.y - topPos, 0, touchpad.data.height, touchpad.data.min, touchpad.data.max));
              // SEND MIDI CONTROL_CHANGE
              //controlChange(selectedItem.data.Xcc, selectedItem.data.Xval, selectedItem.data.Xchan - 1);
              //controlChange(selectedItem.data.Ycc, selectedItem.data.Yval, selectedItem.data.Ychan - 1);
              selectedItem.children[0].segments[0].point.y = event.point.y;
              selectedItem.children[0].segments[1].point.y = event.point.y;
              selectedItem.children[1].segments[0].point.x = event.point.x;
              selectedItem.children[1].segments[1].point.x = event.point.x;
              selectedItem.children[2].position = event.point;
              setMenuParams(selectedItem);
            }
          }
        }
      }
    },
    onMouseUp: function () {
      if (currentMode === EDIT_MODE) {
        leftPos = touchpad.data.x - (touchpad.data.width / 2);
        rightPos = touchpad.data.x + (touchpad.data.width / 2);
        topPos = touchpad.data.y - (touchpad.data.height / 2);
        bottPos = touchpad.data.y + (touchpad.data.height / 2);
        //setMenuParams(this);
      }
      else if (currentMode === PLAY_MODE) {
        //setMenuParams(this);
      }
    },
    onKeyDown: function (event) {
      if (currentMode === EDIT_MODE) {
        if (event.modifiers.shift) {
          if (Key.isDown("backspace")) {
            selectedItem.remove();
          }
        }
      }
    }
  });

  var pad = new paper.Path.Rectangle({
    name: "Pad",
    strokeColor: "lightblue",
    fillColor: "purple",
    strokeWidth: 8,
    fillColor: "white",
    from: new paper.Point(touchpad.data.x - (touchpad.data.width / 2), touchpad.data.y - (touchpad.data.height / 2)),
    to: new paper.Point(touchpad.data.x + (touchpad.data.width / 2), touchpad.data.y + (touchpad.data.height / 2))
  });

  var touch = new paper.Group({
    data: {
      "name": null,
      "Xchan": 1,
      "Xcc": 32,
      "Xval": 0,
      "Ychan": 2,
      "Ycc": 33,
      "Yval": 0
    }
  });

  lineX = new paper.Path.Line({
    name: null,
    strokeColor: "black",
    strokeWidth: 1,
    from: null,
    to: null
  });
  lineY = new paper.Path.Line({
    name: null,
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 1,
    from: null,
    to: null
  });
  circle = new paper.Path.Circle({
    name: null,
    fillColor: "red",
    center: null,
    radius: 10
  });
  touch.addChild(lineX);
  touch.addChild(lineY);
  touch.addChild(circle);

  return touchpad;
}

/////////// TRIGGER Factory
function triggerFactory(event) {
  var selectedtPath = null;
  var selectedtPathName = null;
  var state = false;
  var timer = 0;
  var trigger = new paper.Group({
    data: {
      "name": "Trigger",
      "size": 40,
      "x": Math.round(event.point.x),
      "y": Math.round(event.point.y),
      "chan": 1,
      "note": 33,
      "velocity": 127
    },
    onMouseDown: function (event) {
      setMenuParams(this);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedtPath = hitResult.type;
        selectedtPathName = hitResult.item.name;
        //hitResult.sendToFront()
      }
      else if (currentMode === PLAY_MODE) {
        this.children[1].fillColor = "red";
        // SEND MIDI NOTE_ON
        if (connected) noteOn(trigger.data.note, trigger.data.velocity, trigger.data.chan - 1);
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
    onFrame: function () {
      if (state) {
        timer++;
      }
      if (state && timer > 10) {
        state = false;
        this.children[1].fillColor = "green";
        // SEND MIDI NOTE_OFF
        if (connected) noteOff(trigger.data.note, 0, trigger.data.chan - 1);
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

  var square = new paper.Path.Rectangle({
    name: "square",
    strokeWidth: 8,
    strokeColor: "lightblue",
    fillColor: "lightblue",
    from: new paper.Point(trigger.data.x - (trigger.data.size / 2), trigger.data.y - (trigger.data.size / 2)),
    to: new paper.Point(trigger.data.x + (trigger.data.size / 2), trigger.data.y + (trigger.data.size / 2))
  });
  trigger.addChild(square);
  var circle = new paper.Path.Circle({
    name: "circle",
    fillColor: "green",
    center: new paper.Point(trigger.data.x, trigger.data.y),
    radius: trigger.data.size / 2.2
  });
  trigger.addChild(circle);
  return trigger;
}

/////////// SWITCH Factory
function switchFactory(event) {
  var selectedtPath = null;
  var selectedtPathName = null;
  var state = false;
  var e256_switch = new paper.Group({
    data: {
      "name": "Switch",
      "size": 40,
      "x": Math.round(event.point.x),
      "y": Math.round(event.point.y),
      "chan": 1,
      "note": 64,
      "velocity": 127
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
          // SEND MIDI NOTE_ON
          if (connected) noteOn(e256_switch.data.note, e256_switch.data.velocity, e256_switch.data.chan - 1);
        } else {
          this.children[1].visible = false;
          // SEND MIDI NOTE_OFF
          if (connected) noteOff(e256_switch.data.note, 0, e256_switch.data.chan - 1);
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
            } else if (selectedtPathName === "lineX" || selectedtPathName === "lineY" ) {
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

  var square = new paper.Path.Rectangle({
    name: "square",
    strokeWidth: 8,
    strokeColor: "lightblue",
    fillColor: "white",
    //opacity: 0.5,
    from: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 2), e256_switch.data.y - (e256_switch.data.size / 2)),
    to: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 2), e256_switch.data.y + (e256_switch.data.size / 2))
  });
  e256_switch.addChild(square);

  var cross = new paper.Group(
    lineX = new paper.Path.Line({
      name: "lineX",
      strokeWidth: 7,
      strokeColor: "black",
      strokeCap: "round",
      from: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 3), e256_switch.data.y - (e256_switch.data.size / 3)),
      to: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 3), e256_switch.data.y + (e256_switch.data.size / 3))
    }),
    lineY = new paper.Path.Line({
      name: "lineY",
      strokeCap: "round",
      strokeColor: "black",
      strokeWidth: 7,
      from: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 3), e256_switch.data.y - (e256_switch.data.size / 3)),
      to: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 3), e256_switch.data.y + (e256_switch.data.size / 3))
    })
  );
  e256_switch.addChild(cross);

  return e256_switch;
}

/////////// SLIDER Factory
function sliderFactory(event) {
  var topPos = 0;
  var bottPos = 0;
  var rightPos = 0;
  var leftPos = 0;
  var last_val = 0;
  var sliderHitOptions = {
    "stroke": true,
    "segment": true,
    "fill": true,
    "tolerance": 5
  };
  var selectedtPath = "";
  var selectedtPathName = "";
  var selectedSegment = "";
  var slider = new paper.Group({
    data: {
      "name": "Slider",
      "width": 40,
      "height": 200,
      "x": Math.round(event.point.x),
      "y": Math.round(event.point.y),
      "chan": 1,
      "cc": 0,
      "min": 2,
      "max": 50,
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
        slider.data.val = Math.round(mapp(bottPos - event.point.y, 0, slider.data.height, slider.data.min, slider.data.max));
        last_val = slider.data.val;
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
                    slider.data.x = Math.round(rightPos - ((rightPos - event.point.x) / 2));
                    slider.data.width = Math.round((rightPos - slider.data.x) * 2);
                    this.children[0].segments[0].point.x = event.point.x;
                    this.children[0].segments[1].point.x = event.point.x;
                    this.children[1].segments[0].point.x = event.point.x;
                    break;
                  case 1: // Update top segment
                    slider.data.y = Math.round(bottPos - ((bottPos - event.point.y) / 2));
                    slider.data.height = Math.round((bottPos - slider.data.y) * 2);
                    this.children[0].segments[1].point.y = event.point.y;
                    this.children[0].segments[2].point.y = event.point.y;
                    this.children[1].segments[0].point.y = slider.data.y;
                    this.children[1].segments[1].point.y = slider.data.y;

                    break;
                  case 2: // Update right segment
                    slider.data.x = Math.round(leftPos + ((event.point.x - leftPos) / 2));
                    slider.data.width = Math.round((slider.data.x - leftPos) * 2);
                    this.children[0].segments[2].point.x = event.point.x;
                    this.children[0].segments[3].point.x = event.point.x;
                    this.children[1].segments[1].point.x = event.point.x;
                    break;
                  case 3: // Update bottom segment
                    slider.data.y = Math.round(topPos + ((event.point.y - topPos) / 2));
                    slider.data.height = Math.round((slider.data.y - topPos) * 2);
                    this.children[0].segments[3].point.y = event.point.y;
                    this.children[0].segments[0].point.y = event.point.y;
                    this.children[1].segments[0].point.y = slider.data.y;
                    this.children[1].segments[1].point.y = slider.data.y;
                    break;
                }
                break;
              case "Handle":
                moveItem(this, event);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (event.point.y > topPos && event.point.y < bottPos) {
          last_val = slider.data.val;
          slider.data.val = Math.round(mapp(bottPos - event.point.y, 0, slider.data.height, slider.data.min, slider.data.max));
          // SEND MIDI CONTROL_CHANGE
          if (slider.data.val != last_val) {
            if (connected) controlChange(slider.data.cc, slider.data.val, slider.data.chan - 1);
            setMenuParams(this);
          }
          this.children[1].segments[0].point.y = event.point.y;
          this.children[1].segments[1].point.y = event.point.y;
        }
      }
    },
    onMouseUp: function (event) {
      if (currentMode === EDIT_MODE) {
        topPos = slider.data.y - (slider.data.height / 2);
        bottPos = slider.data.y + (slider.data.height / 2);
        leftPos = slider.data.x - (slider.data.width / 2);
        rightPos = slider.data.x + (slider.data.width / 2);
        setMenuParams(this);
      }
      else if (currentMode === PLAY_MODE) {
        setMenuParams(this);
      }
    }
  });
  var rect = new paper.Path.Rectangle({
    name: "rect",
    strokeColor: "lightblue",
    fillColor: "yellow",
    strokeWidth: 8,
    fillColor: "white",
    from: new paper.Point(slider.data.x - (slider.data.width / 2), slider.data.y - (slider.data.height / 2)),
    to: new paper.Point(slider.data.x + (slider.data.width / 2), slider.data.y + (slider.data.height / 2))
  });
  slider.addChild(rect);
  var handle = new paper.Path.Line({
    name: "Handle",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 10,
    from: new paper.Point(slider.data.x - (slider.data.width / 2) - 2, slider.data.y),
    to: new paper.Point(slider.data.x + (slider.data.width / 2) + 2, slider.data.y)
  });
  slider.addChild(handle);
  return slider;
}

/////////// KNOB Factory
function knobFactory(event) {
  var offset = 0;
  var selectedtPath = "";
  var selectedtPathName = "";
  var last_rVal = 0;
  var last_tVal = 0;
  var knob = new paper.Group({
    data: {
      "name": "Knob",
      "x": Math.round(event.point.x),
      "y": Math.round(event.point.y),
      "radius": 50,
      "rVal": 0,
      "tVal": 0,
      "offset": 60,
      "tChan": 1,
      "tCc": 1,
      "tMin": 0,
      "tMax": 127,
      "rChan": 1,
      "rCc": 2,
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
        this.children[1].children[0].position = new paper.Point(knob.data.x + headPos.x, knob.data.y + headPos.y);
        this.children[1].children[1].segments[1].point = new paper.Point(knob.data.x + footPos.x, knob.data.y + footPos.y);

        last_rVal = knob.data.rVal;
        knob.data.rVal = Math.round(mapp(polar.radius, 0, knob.data.radius, knob.data.rMin, knob.data.rMax));
        if (connected && knob.data.rVal != last_rVal) {
          controlChange(knob.data.rCc, knob.data.rVal, knob.data.rChan - 1);
        }

        last_tVal = knob.data.tVal;
        var newPolar = rotatePolar(this, rad_to_deg(polar.theta));
        knob.data.tVal = Math.round(mapp(newPolar, 0, 380, knob.data.tMin, knob.data.tMax));
        if (connected && knob.data.tVal != last_tVal) {
          controlChange(knob.data.tCc, knob.data.tVal, knob.data.tChan - 1);
        }

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
              offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              var delta = offset - knob.data.offset;
              this.children[2].rotate(delta, new paper.Point(knob.data.x, knob.data.y));
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
                knob.data.radius = Math.round(polar.radius);
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
          last_rVal = knob.data.rVal;
          knob.data.rVal = knob.data.rMax;
        } else {
          headPos = pol_to_cart(polar.radius - 10, polar.theta);
          footPos = pol_to_cart(polar.radius - this.children[1].children[0].bounds.width - 1, polar.theta);
          last_rVal = knob.data.rVal;
          knob.data.rVal = Math.round(mapp(polar.radius, 0, knob.data.radius, knob.data.rMin, knob.data.rMax));
        }
        var newPolar = rotatePolar(this, rad_to_deg(polar.theta));
        last_tVal = knob.data.tVal;
        knob.data.tVal = Math.round(mapp(newPolar, 0, 380, knob.data.tMin, knob.data.tMax));
        // SEND MIDI CONTROL_CHANGE
        if (connected && knob.data.tVal != last_tVal) {
          controlChange(knob.data.tCc, knob.data.tVal, knob.data.tChan - 1);
        }
        if (connected && knob.data.rVal != last_rVal) {
          controlChange(knob.data.rCc, knob.data.rVal, knob.data.rChan - 1);
        }

        this.children[1].children[0].position = new paper.Point(knob.data.x + headPos.x, knob.data.y + headPos.y);
        this.children[1].children[1].segments[1].point = new paper.Point(knob.data.x + footPos.x, knob.data.y + footPos.y);

        setMenuParams(this);
      }
    }
  });
  var circle = new paper.Path.Circle({
    name: "knob",
    strokeColor: "lightblue",
    fillColor: "blue",
    //opacity: 0.5,
    strokeWidth: 10,
    center: new paper.Point(knob.data.x, knob.data.y),
    radius: knob.data.radius
  });
  knob.addChild(circle);

  var headPos = pol_to_cart(knob.data.radius - 10, deg_to_rad(knob.data.offset));
  var footPos = pol_to_cart(knob.data.radius - 20, deg_to_rad(knob.data.offset));
  var offsetPos = pol_to_cart(knob.data.radius + 15, deg_to_rad(knob.data.offset));

  var needle = new paper.Group(
    head = paper.Path.Circle({
      name: "head",
      strokeColor: "black",
      strokeWidth: 5,
      center: new paper.Point(knob.data.x + headPos.x, knob.data.y + headPos.y),
      radius: 6
    }),
    foot = paper.Path.Line({
      name: "foot",
      strokeCap: "round",
      strokeColor: "black",
      strokeWidth: 5,
      from: new paper.Point(knob.data.x, knob.data.y),
      to: new paper.Point((knob.data.x + footPos.x), knob.data.y + footPos.y),
    })
  );
  knob.addChild(needle);

  var offset = new paper.Path.RegularPolygon({
    name: "offset",
    fillColor: "red",
    center: new paper.Point(knob.data.x + offsetPos.x, knob.data.y + offsetPos.y),
    sides: 3,
    radius: 10
  });
  offset.rotate(-30);
  knob.addChild(offset);

  return knob;
}

function moveItem(item, event) {
  item.translate(event.delta);
  item.data.x += Math.round(event.delta.x);
  item.data.y += Math.round(event.delta.y);
}

function scale2d(item, event) {
  var x = event.point.x - item.data.x;
  var y = event.point.y - item.data.y;
  var radius = Math.sqrt((x * x) + (y * y));
  var newRadius = radius - (item.children[0].strokeWidth / 2);
  var oldRadius = item.data.size / 2;
  item.scale(newRadius / oldRadius);
  item.data.size = Math.round(item.children[0].bounds.width);
}

function deg_to_rad(degree) {
  return degree * (Math.PI / 180);
}

function rad_to_deg(radian) {
  return radian * (180 / Math.PI);
}

// Returning radian
function cart_to_pol(x, y) {
  var radius = Math.sqrt((x * x) + (y * y));
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
  // return (Math.abs(degree - 380) + item.data.offset) % 380; // Anti-clockwise direction
  return (Math.abs(degree + 380) - item.data.offset) % 380;    // Clockwise direction
}

function mapp(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Max is exclusive and min is inclusive
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function setMenuParams(item) {
  var paramsIndex = 0;
  $('#summaryContent').html("Parameters");
  for (const param in item.data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(item.data[param]);
    $("#param-" + paramsIndex).collapse("show");
    paramsIndex++;
  }
  for (var i = MAX_PARAM; i >= paramsIndex; i--) {
    $("#param-" + i).collapse("hide");
  }
}