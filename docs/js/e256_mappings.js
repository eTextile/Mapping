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
  stroke: true,
  fill: true,
  tolerance: 8
};

/////////// TOUCHPAD Factory
function touchpadFactory(event) {
  var topPos = 0;
  var bottPos = 0;
  var rightPos = 0;
  var leftPos = 0;
  var selectedItem = null;
  var selectedPath = null;
  var selectedPathName = null;
  var selectedSegment = null;
  var touchpadHitOptions = {
    stroke: true,
    segment: true,
    fill: true,
    tolerance: 5
  };
  var _touch = new paper.Group({
    data: {
      name: null,
      x: null,
      y: null,
      Xchan: 1,
      Xcc: 32,
      Ychan: 2,
      Ycc: 33
    }
  });
  var _circle = new paper.Path.Circle({
    fillColor: "green",
    center: [null, null],
    radius: 10
  });
  var _lineX = new paper.Path.Line({
    strokeColor: "black",
    strokeWidth: 1,
    from: [null, null],
    to: [null, null]
  });
  var _lineY = new paper.Path.Line({
    strokeColor: "black",
    strokeWidth: 1,
    from: [null, null],
    to: [null, null]
  });
  var _pad = new paper.Path.Rectangle({
    strokeColor: "lightblue",
    fillColor: "white",
    strokeWidth: 8,
    fillColor: "white",
    from: [null, null],
    to: [null, null]
  });

  var e256_touchpad = new paper.Group({
    data: {
      name: "touchpad",
      touchs: 3,
      x: null,
      y: null,
      width: 400,
      height: 400,
      min: 0,
      max: 127
    },
    init: function (event) {
      for (var i = 0; i < this.data.touchs; i++) {
        var e256_touch = _touch.clone({ insert: true, deep: false });
        e256_touch.data.name = ("touch-" + i);
        e256_touch.data.x = getRandomInt(this.data.x - (this.data.width / 2), this.data.x + (this.data.width / 2));
        e256_touch.data.y = getRandomInt(this.data.y - (this.data.height / 2), this.data.y + (this.data.height / 2));
        var e256_lineX = _lineX.clone({ insert: false, deep: false });
        e256_lineX.name = "line-x";
        e256_lineX.segments[0].point = new paper.Point(this.data.x - (this.data.width / 2), e256_touch.data.y);
        e256_lineX.segments[1].point = new paper.Point(this.data.x + (this.data.width / 2), e256_touch.data.y);
        e256_touch.addChild(e256_lineX);
        var e256_lineY = _lineY.clone({ insert: true, deep: false });
        e256_lineY.name = "line-y";
        e256_lineY.segments[0].point = new paper.Point(e256_touch.data.x, this.data.y - (this.data.height / 2));
        e256_lineY.segments[1].point = new paper.Point(e256_touch.data.x, this.data.y + (this.data.height / 2));
        e256_touch.addChild(e256_lineY);
        var e256_circle = _circle.clone({ insert: true, deep: false });
        e256_circle.name = "circle";
        e256_circle.position.x = e256_touch.data.x;
        e256_circle.position.y = e256_touch.data.y;
        e256_touch.addChild(e256_circle);
        e256_touchpad.addChild(e256_touch);
      };
      var e256_pad = _pad.clone({ insert: true, deep: true });
      e256_pad.name = "pad";
      e256_pad.position.x = this.data.x = Math.round(event.point.x);
      e256_pad.position.y = this.data.y = Math.round(event.point.y);
      e256_pad.width = this.data.width;
      e256_pad.height = this.data.height;
      e256_touchpad.addChild(e256_pad);
    },
    onMouseDown: function (event) {
      var hitResult = this.hitTest(event.point, touchpadHitOptions);
      selectedPath = hitResult.type;
      if (currentMode === EDIT_MODE) {
        if (selectedPath != null) {
          switch (selectedPath) {
            case "fill":
              selectedPathName = hitResult.item.name;
              selectedItem = hitResult.item.parent;
              setMenuParams(selectedItem.data);
              break;
            case "stroke":
              selectedPathName = hitResult.item.name;
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
        if (selectedPath != null) {
          switch (selectedPath) {
            case "fill":
              selectedPathName = hitResult.item.name;
              selectedItem = hitResult.item.parent;
              setMenuParams(selectedItem.data);
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
        switch (selectedPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            if (selectedPathName === "pad") {
              switch (selectedSegment) {
                case 0: // Update left segment
                  this.children["pad"].segments[0].point.x = event.point.x;
                  this.children["pad"].segments[1].point.x = event.point.x;
                  var lastWidth = this.data.width;
                  this.data.x = Math.round(rightPos - ((rightPos - event.point.x) / 2));
                  this.data.width = Math.round((rightPos - this.data.x) * 2);
                  for (var i = 0; i < this.data.touchs; i++) {
                    var item = this.children[i];
                    item.children[0].segments[0].point.x = event.point.x;
                    var newWidth = ((rightPos - item.children[1].segments[0].point.x) * this.data.width) / lastWidth;
                    item.children["line-y"].segments[0].point.x = rightPos - newWidth;
                    item.children["line-y"].segments[1].point.x = rightPos - newWidth;
                    item.children[2].position.x = rightPos - newWidth;
                  }
                  break;
                case 1: // Update top segment
                  this.children["pad"].segments[1].point.y = event.point.y;
                  this.children["pad"].segments[2].point.y = event.point.y;
                  var lastHeight = this.data.height;
                  this.data.y = Math.round(bottPos - ((bottPos - event.point.y) / 2));
                  this.data.height = Math.round((bottPos - this.data.y) * 2);
                  for (var i = 0; i < this.data.touchs; i++) {
                    var item = this.children[i];
                    item.children[1].segments[0].point.y = event.point.y;
                    var newHeight = ((bottPos - item.children[0].segments[0].point.y) * this.data.height) / lastHeight;
                    item.children["line-x"].segments[0].point.y = bottPos - newHeight;
                    item.children["line-x"].segments[1].point.y = bottPos - newHeight;
                    item.children[2].position.y = bottPos - newHeight;
                  }
                  break;
                case 2: // Update right segment
                  this.children["pad"].segments[2].point.x = event.point.x;
                  this.children["pad"].segments[3].point.x = event.point.x;
                  var lastWidth = this.data.width;
                  this.data.x = Math.round(leftPos + ((event.point.x - leftPos) / 2));
                  this.data.width = Math.round((this.data.x - leftPos) * 2);
                  for (var i = 0; i < this.data.touchs; i++) {
                    var item = this.children[i];
                    item.children[0].segments[1].point.x = event.point.x;
                    var newWidth = ((item.children[1].segments[0].point.x - leftPos) * this.data.width) / lastWidth;
                    item.children["line-y"].segments[0].point.x = leftPos + newWidth;
                    item.children["line-y"].segments[1].point.x = leftPos + newWidth;
                    item.children["circle"].position.x = leftPos + newWidth;
                  }
                  break;
                case 3: // Update bottom segment
                  this.children["pad"].segments[3].point.y = event.point.y;
                  this.children["pad"].segments[0].point.y = event.point.y;
                  var lastHeight = this.data.height;
                  this.data.y = Math.round(topPos + ((event.point.y - topPos) / 2));
                  this.data.height = Math.round((this.data.y - topPos) * 2);
                  for (var i = 0; i < this.data.touchs; i++) {
                    var item = this.children[i];
                    var newHeight = ((item.children[0].segments[0].point.y - topPos) * this.data.height) / lastHeight;
                    item.children["line-x"].segments[0].point.y = topPos + newHeight;
                    item.children["line-x"].segments[1].point.y = topPos + newHeight;
                    item.children["line-y"].segments[1].point.y = event.point.y;
                    item.children["circle"].position.y = topPos + newHeight;
                  }
                  break;
              }
              break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedPathName === "pad") {
          // NA
        } else {
          if (event.point.y > topPos && event.point.y < bottPos) {
            if (event.point.x > leftPos && event.point.x < rightPos) {
              selectedItem.data.x = Math.round(mapp(event.point.x - leftPos, 0, this.data.width, this.data.min, this.data.max));
              selectedItem.data.y = Math.round(mapp(event.point.y - topPos, 0, this.data.height, this.data.min, this.data.max));
              // SEND MIDI CONTROL_CHANGE
              //controlChange(selectedItem.data.Xcc, selectedItem.data.x, selectedItem.data.Xchan - 1);
              //controlChange(selectedItem.data.Ycc, selectedItem.data.y, selectedItem.data.Ychan - 1);
              selectedItem.children["line-x"].segments[0].point.y = event.point.y;
              selectedItem.children["line-x"].segments[1].point.y = event.point.y;
              selectedItem.children["line-y"].segments[0].point.x = event.point.x;
              selectedItem.children["line-y"].segments[1].point.x = event.point.x;
              selectedItem.children["circle"].position = event.point;
              setMenuParams(selectedItem.data);
            }
          }
        }
      }
    },
    onMouseUp: function () {
      if (currentMode === EDIT_MODE) {
        leftPos = this.data.x - (this.data.width / 2);
        rightPos = this.data.x + (this.data.width / 2);
        topPos = this.data.y - (this.data.height / 2);
        bottPos = this.data.y + (this.data.height / 2);
        setMenuParams(this.data);
      }
      else if (currentMode === PLAY_MODE) {
        //setMenuParams(this.data);
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
  return e256_touchpad;
};

/////////// TRIGGER Factory
function triggerFactory() {
  var selectedPath = null;
  var selectedPathName = null;
  function sendNoteOff(item) {
    if (connected) noteOff(item.data.note, 0, item.data.chan - 1);
    item.data.value = 0;
    item.children["circle"].fillColor = "green";
    setMenuParams(item.data);
  }
  var e256_trigger = new paper.Group({
    data: {
      name: "trigger",
      value: 0,
      x: null,
      y: null,
      size: 50,
      chan: 1,
      note: 33,
      velocity: 127
    },
    init: function (event) {
      this.data.x = Math.round(event.point.x)
      this.data.y = Math.round(event.point.y)
    },
    onMouseDown: function (event) {
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedPath = hitResult.type;
        selectedPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        this.children["circle"].fillColor = "red";
        this.data.value = this.data.note;
        setTimeout(sendNoteOff, 200, this);
        if (connected) noteOn(this.data.note, this.data.velocity, this.data.chan - 1);
      }
      setMenuParams(this.data);
    },
    onMouseUp: function () {
      setMenuParams(this.data);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            if (selectedPathName === "square") {
              scale2d(this, event);
            } else if (selectedPathName === "circle") {
              moveItem(this, event);
            }
            break;
        }
      } else if (currentMode === PLAY_MODE) {
        // TODO
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

  var Square = new paper.Path.Rectangle({
    name: "square",
    strokeWidth: 10,
    strokeColor: "lightblue",
    fillColor: "lightblue",
    from: new paper.Point(e256_trigger.data.x - (e256_trigger.data.size / 2), e256_trigger.data.y - (e256_trigger.data.size / 2)),
    to: new paper.Point(e256_trigger.data.x + (e256_trigger.data.size / 2), e256_trigger.data.y + (e256_trigger.data.size / 2))
  });
  e256_trigger.addChild(Square);
  var Circle = new paper.Path.Circle({
    name: "circle",
    fillColor: "green",
    center: new paper.Point(e256_trigger.data.x, e256_trigger.data.y),
    radius: e256_trigger.data.size / 2.2
  });
  e256_trigger.addChild(Circle);
  return e256_trigger;
}

/////////// SWITCH Factory
function switchFactory(event) {
  var selectedPath = null;
  var selectedPathName = null;
  var e256_switch = new paper.Group({
    data: {
      name: "switch",
      value: false,
      x: Math.round(event.point.x),
      y: Math.round(event.point.y),
      size: 50,
      chan: 1,
      note: 64,
      velocity: 127
    },
    onMouseDown: function (event) {
      setMenuParams(this.data);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedPath = hitResult.type;
        selectedPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        this.data.value = !this.data.value;
        if (this.data.value) {
          this.children["cross"].visible = true;
          // SEND MIDI NOTE_ON
          if (connected) noteOn(this.data.note, this.data.velocity, this.data.chan - 1);
        } else {
          this.children["cross"].visible = false;
          // SEND MIDI NOTE_OFF
          if (connected) noteOff(this.data.note, 0, this.data.chan - 1);
        }
      }
    },
    onMouseUp: function (event) {
      setMenuParams(this.data);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            if (selectedPathName === "square") {
              scale2d(this, event);
            } else if (selectedPathName === "cross") {
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

  var Square = new paper.Path.Rectangle({
    name: "square",
    strokeWidth: 10,
    strokeColor: "lightblue",
    fillColor: "white",
    from: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 2), e256_switch.data.y - (e256_switch.data.size / 2)),
    to: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 2), e256_switch.data.y + (e256_switch.data.size / 2))
  });
  e256_switch.addChild(Square);

  var Cross = new paper.Group({});
  Cross.name = "cross";
  var Line_A = new paper.Path.Line({
    name: "cross",
    strokeWidth: 8,
    strokeColor: "black",
    strokeCap: "round",
    from: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 3), e256_switch.data.y - (e256_switch.data.size / 3)),
    to: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 3), e256_switch.data.y + (e256_switch.data.size / 3))
  });
  Cross.addChild(Line_A);
  var Line_B = new paper.Path.Line({
    name: "cross",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 7,
    from: new paper.Point(e256_switch.data.x + (e256_switch.data.size / 3), e256_switch.data.y - (e256_switch.data.size / 3)),
    to: new paper.Point(e256_switch.data.x - (e256_switch.data.size / 3), e256_switch.data.y + (e256_switch.data.size / 3))
  });
  Cross.addChild(Line_B);

  e256_switch.addChild(Cross);
  return e256_switch;
}

/////////// SLIDER Factory
function sliderFactory(event) {
  var sliderHitOptions = {
    stroke: true,
    segment: true,
    fill: true,
    tolerance: 5
  };
  var selectedPath = null;
  var selectedPathName = null;
  var selectedSegment = null;
  var last_val = 0;
  var topPos = 0;
  var bottPos = 0;
  var rightPos = 0;
  var leftPos = 0;

  var e256_slider = new paper.Group({
    data: {
      name: "slider",
      value: 0,
      x: Math.round(event.point.x),
      y: Math.round(event.point.y),
      width: 40,
      height: 200,
      chan: 1,
      cc: 0,
      min: 2,
      max: 50
    },
    onMouseDown: function (event) {
      setMenuParams(this.data);
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, sliderHitOptions);
        selectedPathName = hitResult.item.name;
        selectedPath = hitResult.type;
        if (selectedPath === "stroke") selectedSegment = hitResult.location.index;
        else if (currentMode === PLAY_MODE) {
          last_val = this.data.val;
          this.data.val = Math.round(mapp(bottPos - event.point.y, 0, this.data.height, this.data.min, this.data.max));
          this.children["handle"].segments[0].point.y = event.point.y;
          this.children["handle"].segments[1].point.y = event.point.y;
        }
      }
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, event);
            break;
          case "stroke":
            switch (selectedPathName) {
              case "rect":
                switch (selectedSegment) {
                  case 0: // Update left segment
                    this.data.x = Math.round(rightPos - ((rightPos - event.point.x) / 2));
                    this.data.width = Math.round((rightPos - this.data.x) * 2);
                    this.children["rect"].segments[0].point.x = event.point.x;
                    this.children["rect"].segments[1].point.x = event.point.x;
                    this.children["handle"].segments[0].point.x = event.point.x;
                    break;
                  case 1: // Update top segment
                    this.data.y = Math.round(bottPos - ((bottPos - event.point.y) / 2));
                    this.data.height = Math.round((bottPos - this.data.y) * 2);
                    this.children["rect"].segments[1].point.y = event.point.y;
                    this.children["rect"].segments[2].point.y = event.point.y;
                    this.children["handle"].segments[0].point.y = this.data.y;
                    this.children["handle"].segments[1].point.y = this.data.y;
                    break;
                  case 2: // Update right segment
                    this.data.x = Math.round(leftPos + ((event.point.x - leftPos) / 2));
                    this.data.width = Math.round((this.data.x - leftPos) * 2);
                    this.children["rect"].segments[2].point.x = event.point.x;
                    this.children["rect"].segments[3].point.x = event.point.x;
                    this.children["handle"].segments[1].point.x = event.point.x;
                    break;
                  case 3: // Update bottom segment
                    this.data.y = Math.round(topPos + ((event.point.y - topPos) / 2));
                    this.data.height = Math.round((this.data.y - topPos) * 2);
                    this.children["rect"].segments[3].point.y = event.point.y;
                    this.children["rect"].segments[0].point.y = event.point.y;
                    this.children["handle"].segments[0].point.y = this.data.y;
                    this.children["handle"].segments[1].point.y = this.data.y;
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
        if (event.point.y > topPos && event.point.y < bottPos) {
          last_val = this.data.val;
          this.data.val = Math.round(mapp(bottPos - event.point.y, 0, this.data.height, this.data.min, this.data.max));
          // SEND MIDI CONTROL_CHANGE
          if (this.data.val != last_val) {
            if (connected) controlChange(this.data.cc, this.data.val, this.data.chan - 1);
            setMenuParams(this.data);
          }
          this.children["handle"].segments[0].point.y = event.point.y;
          this.children["handle"].segments[1].point.y = event.point.y;
        }
      }
    },
    onMouseUp: function (event) {
      if (currentMode === EDIT_MODE) {
        topPos = this.data.y - (this.data.height / 2);
        bottPos = this.data.y + (this.data.height / 2);
        leftPos = this.data.x - (this.data.width / 2);
        rightPos = this.data.x + (this.data.width / 2);
        setMenuParams(this.data);
      }
      else if (currentMode === PLAY_MODE) {
        setMenuParams(this.data);
      }
    }
  });

  var Rect = new paper.Path.Rectangle({
    name: "rect",
    strokeColor: "lightblue",
    fillColor: "yellow",
    strokeWidth: 8,
    fillColor: "white",
    from: new paper.Point(e256_slider.data.x - (e256_slider.data.width / 2), e256_slider.data.y - (e256_slider.data.height / 2)),
    to: new paper.Point(e256_slider.data.x + (e256_slider.data.width / 2), e256_slider.data.y + (e256_slider.data.height / 2))
  });
  e256_slider.addChild(Rect);

  var Handle = new paper.Path.Line({
    name: "handle",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 10,
    from: new paper.Point(e256_slider.data.x - (e256_slider.data.width / 2) - 2, e256_slider.data.y),
    to: new paper.Point(e256_slider.data.x + (e256_slider.data.width / 2) + 2, e256_slider.data.y)
  });
  e256_slider.addChild(Handle);

  return e256_slider;
}

/////////// KNOB Factory
function knobFactory(event) {
  var selectedPath = null;
  var selectedPathName = null;
  var last_offset = 0;
  var last_rVal = 0;
  var last_tVal = 0;

  var e256_knob = new paper.Group({
    data: {
      name: "knob",
      rVal: 0,
      tVal: 0,
      x: Math.round(event.point.x),
      y: Math.round(event.point.y),
      radius: 50,
      offset: 60,
      tChan: 1,
      tCc: 1,
      tMin: 0,
      tMax: 127,
      rChan: 1,
      rCc: 2,
      rMin: 0,
      rMax: 127
    },
    onMouseDown: function (event) {
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(event.point, hitOptions);
        selectedPath = hitResult.type;
        selectedPathName = hitResult.item.name;
      }
      else if (currentMode === PLAY_MODE) {
        var x = event.point.x - this.data.x; // Place the x origin to the circle center
        var y = event.point.y - this.data.y; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        headPos = pol_to_cart(polar.radius, polar.theta);
        footPos = pol_to_cart(polar.radius, polar.theta);
        this.children["needle"].children["head"].position = new paper.Point(this.data.x + headPos.x, this.data.y + headPos.y);
        this.children["needle"].children["foot"].segments[1].point = new paper.Point(this.data.x + footPos.x, this.data.y + footPos.y);

        last_rVal = this.data.rVal;
        this.data.rVal = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
        if (connected && this.data.rVal != last_rVal) {
          controlChange(this.data.rCc, this.data.rVal, this.data.rChan - 1);
        }

        last_tVal = this.data.tVal;
        var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
        this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
        if (connected && this.data.tVal != last_tVal) {
          controlChange(this.data.tCc, this.data.tVal, this.data.tChan - 1);
        }
        setMenuParams(this.data);
      }
    },
    onMouseUp: function (event) {
      //last_offset = this.data.offset;
      setMenuParams(this.data);
    },
    onMouseDrag: function (event) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            if (selectedPathName === "handle") {
              var x = event.point.x - this.data.x; // Place the x origin to the circle center
              var y = event.point.y - this.data.y; // Place the y origin to the circle center
              last_offset = this.data.offset;
              this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              var delta = this.data.offset - last_offset;
              this.children["handle"].rotate(delta, new paper.Point(this.data.x, this.data.y));
              setMenuParams(this.data);
            } else {
              moveItem(this, event);
            }
            break;
          case "stroke":
            switch (selectedPathName) {
              case "circle":
                var x = event.point.x - this.data.x;
                var y = event.point.y - this.data.y;
                var polar = cart_to_pol(x, y);
                this.scale(polar.radius / this.data.radius);
                this.data.radius = Math.round(polar.radius);
                break;
              case "needle":
                moveItem(this, event);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        var x = event.point.x - this.data.x; // Place the x origin to the circle center
        var y = event.point.y - this.data.y; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        var headPos;
        var footPos;
        if (polar.radius > this.data.radius) {
          var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(this.data.radius, polar.theta);
          footPos = pol_to_cart(this.data.radius, polar.theta);
        } else {
          last_rVal = this.data.rVal;
          this.data.rVal = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
          var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          last_tVal = this.data.tVal;
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(polar.radius, polar.theta);
          footPos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["needle"].children["head"].position = new paper.Point(this.data.x + headPos.x, this.data.y + headPos.y);
        this.children["needle"].children["foot"].segments[1].point = new paper.Point(this.data.x + footPos.x, this.data.y + footPos.y);

        setMenuParams(this.data);

        // SEND MIDI CONTROL_CHANGE
        if (connected && this.data.tVal != last_tVal) {
          controlChange(this.data.tCc, this.data.tVal, this.data.tChan - 1);
        }
        if (connected && this.data.rVal != last_rVal) {
          controlChange(this.data.rCc, this.data.rVal, this.data.rChan - 1);
        }
      }
    }
  });

  var Circle = new paper.Path.Circle({
    name: "circle",
    strokeColor: "lightblue",
    fillColor: "blue",
    strokeWidth: 10,
    center: new paper.Point(e256_knob.data.x, e256_knob.data.y),
    radius: e256_knob.data.radius
  });
  e256_knob.addChild(Circle);

  var headPos = pol_to_cart(e256_knob.data.radius - Circle.strokeWidth, deg_to_rad(e256_knob.data.offset));
  var footPos = pol_to_cart(e256_knob.data.radius - Circle.strokeWidth * 2, deg_to_rad(e256_knob.data.offset));
  var handlePos = pol_to_cart(e256_knob.data.radius + Circle.strokeWidth, deg_to_rad(e256_knob.data.offset));

  var Needle = new paper.Group({});
  Needle.name = "needle";
  var Head = paper.Path.Circle({
    name: "head",
    strokeColor: "black",
    strokeWidth: 5,
    center: new paper.Point(e256_knob.data.x + headPos.x, e256_knob.data.y + headPos.y),
    radius: 6
  });
  Needle.addChild(Head);
  var Foot = paper.Path.Line({
    name: "foot",
    strokeCap: "round",
    strokeColor: "black",
    strokeWidth: 5,
    from: new paper.Point(e256_knob.data.x, e256_knob.data.y),
    to: new paper.Point((e256_knob.data.x + footPos.x), e256_knob.data.y + footPos.y),
  });
  Needle.addChild(Foot);
  var Handle = new paper.Path.RegularPolygon({
    name: "handle",
    fillColor: "red",
    center: new paper.Point(e256_knob.data.x + handlePos.x, e256_knob.data.y + handlePos.y),
    sides: 3,
    radius: 10
  });
  Handle.rotate(-30);
  e256_knob.addChild(Needle);
  e256_knob.addChild(Handle);
  return e256_knob;
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

function rotatePolar(degree, offset) {
  // return (Math.abs(degree - 380) + offset) % 380; // Anti-clockwise direction
  return (Math.abs(degree + 380) - offset) % 380;    // Clockwise direction
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

function setMenuParams(data) {
  var paramsIndex = 0;
  $('#summaryContent').html("Parameters");
  for (const param in data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(data[param]);
    $("#param-" + paramsIndex).collapse("show");
    paramsIndex++;
  }
  for (var i = MAX_PARAM; i >= paramsIndex; i--) {
    $("#param-" + i).collapse("hide");
  }
}