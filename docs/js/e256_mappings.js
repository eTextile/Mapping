/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const MAX_PARAM = 16;

/////////// GRID Factory -> IN PROCESS!
function gridFactory() {

  const defaultWidth = 400;
  const defaultHeight = 400;
  const defaultMode = 400;

  let newWidth = defaultWidth;
  let newHeight = defaultHeight;
  let lastWidth = newWidth;
  let lastHeight = newHeight;
  let margin = 35;

  var _Grid = new paper.Group({
    data: {
      type: "grid",
      from: [null, null],
      to: [null, null],
      cols: 16,
      rows: 16,
      gap: 1,
      mode: 1
    },
  /*
  TODO: define the grid as it is encoded in the firmware !
  Firmware grid definition 
  typedef struct grid grid_t;
    struct grid {
    rect_t rect;
    uint8_t cols;
    uint8_t rows;
    uint8_t gap;
    keysroke_t gridKeys[MAX_GRID_KEYS];
    float scaleFactorX;
    float scaleFactorY;
  };
  */
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (defaultWidth / 2)), Math.round(mouseEvent.point.y - (defaultHeight / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (defaultWidth / 2)), Math.round(mouseEvent.point.y + (defaultHeight / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.gap = params.gap;
      this.data.mode = params.mode;
    },
  });
return _Grid;
}

/////////// TOUCHPAD Factory
function touchpadFactory() {
  const defaultWidth = 400;
  const defaultHeight = 400;
  let newWidth = defaultWidth;
  let newHeight = defaultHeight;
  let lastWidth = newWidth;
  let lastHeight = newHeight;
  let margin = 35;

  var _Touchpad = new paper.Group({
    data: {
      type: "touchpad",
      from: [null, null],
      to: [null, null],
      touchs: 3,
      min: 0,
      max: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (defaultWidth / 2)), Math.round(mouseEvent.point.y - (defaultHeight / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (defaultWidth / 2)), Math.round(mouseEvent.point.y + (defaultHeight / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.touchs = params.touchs;
      this.data.min = params.min;
      this.data.max = params.max;
    },
    create: function () {
      var _pad = new paper.Path.Rectangle({
        name: "pad", // name -> type !?
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 1,
        strokeColor: new paper.Color("DeepPink"),
        fillColor: new paper.Color("DeepPink")
      });
      this.addChild(_pad);
      for (let i = 0; i < this.data.touchs; i++) {
        this.addChild(this.newTouch(i));
      }
    },
    updateFromParams: function () {
      this.removeChildren(1);
      console.log("from: " + this.data.from + " " + "to: " + this.data.to);
      for (let i = 0; i < this.data.touchs; i++) {
        this.addChild(this.newTouch(i));
      }
    },
    newTouch: function (index) {
      var _touch = new paper.Group({
        name: "touch",
        data: {
          name: "touch-" + index,
          value: [
            getRandomInt(this.data.from[0] + margin, this.data.to[0] - margin),
            getRandomInt(this.data.from[1] + margin, this.data.to[1] - margin)
          ],
          x_chan: null,
          x_cc: null,
          y_chan: null,
          y_cc: null,
          z_chan: null,
          z_cc: null
        }
      });
      var _line_x = new paper.Path.Line({
        name: "line-x",
        from: new paper.Point(this.data.from[0], _touch.data.value[1]),
        to: new paper.Point(this.data.to[0], _touch.data.value[1]),
        strokeColor: "black",
        strokeWidth: 1
      });
      var _line_y = new paper.Path.Line({
        name: "line-y",
        from: new paper.Point(_touch.data.value[0], this.data.from[1]),
        to: new paper.Point(_touch.data.value[0], this.data.to[1]),
        strokeColor: "black",
        strokeWidth: 1
      });
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(_touch.data.value[0], _touch.data.value[1]),
        radius: 10,
        fillColor: "green"
      });
      _touch.addChild(_line_x);
      _touch.addChild(_line_y);
      _touch.addChild(_circle);
      return _touch;
    },
    activate: function (mouseEvent) {
      console.log("NAN");
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            this.translate(mouseEvent.delta);
            this.data.from[0] += Math.round(mouseEvent.delta.x);
            this.data.from[1] += Math.round(mouseEvent.delta.y);
            this.data.to[0] += Math.round(mouseEvent.delta.x);
            this.data.to[1] += Math.round(mouseEvent.delta.y);
            break;
          case "stroke":
            if (selectedItem.name === "pad") {
              switch (selectedSegment) {
                case 0: // Update left segment
                  this.children["pad"].segments[0].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[1].point.x = mouseEvent.point.x;
                  this.data.from[0] = Math.round(mouseEvent.point.x);
                  lastWidth = newWidth;
                  newWidth = this.bounds.right - mouseEvent.point.x;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[0].point.x = mouseEvent.point.x;
                    let newSize_x = ((this.bounds.right - this.children[i].children["line-y"].segments[0].point.x) * newWidth) / lastWidth;
                    this.children[i].children["line-y"].position.x = this.bounds.right - newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.right - newSize_x;
                  }
                  break;
                case 1: // Update top segment
                  this.children["pad"].segments[1].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[2].point.y = mouseEvent.point.y;
                  this.data.from[1] = Math.round(mouseEvent.point.y);
                  lastHeight = newHeight;
                  newHeight = this.bounds.bottom - mouseEvent.point.y;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[0].point.y = mouseEvent.point.y;
                    let newSize_y = ((this.bounds.bottom - this.children[i].children["line-x"].segments[0].point.y) * newHeight) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.bottom - newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.bottom - newSize_y;
                  }
                  break;
                case 2: // Update right segment
                  this.children["pad"].segments[2].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[3].point.x = mouseEvent.point.x;
                  this.data.to[0] = Math.round(mouseEvent.point.x);
                  lastWidth = newWidth;
                  newWidth = mouseEvent.point.x - this.bounds.left;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[1].point.x = mouseEvent.point.x;
                    let newSize_x = ((this.children[i].children["line-y"].segments[0].point.x - this.bounds.left) * newWidth) / lastWidth;
                    this.children[i].children["line-y"].position.x = this.bounds.left + newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.left + newSize_x;
                  }
                  break;
                case 3: // Update bottom segment
                  this.children["pad"].segments[3].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[0].point.y = mouseEvent.point.y;
                  this.data.to[1] = Math.round(mouseEvent.point.y);
                  lastHeight = newHeight;
                  newHeight = mouseEvent.point.y - this.bounds.top;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[1].point.y = mouseEvent.point.y;
                    let newSize_y = ((this.children[i].children["line-x"].segments[0].point.y - this.bounds.top) * newHeight) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.top + newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.top + newSize_y;
                  }
                  break;
              }
              break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedItem.name === "circle") {
          if (mouseEvent.point.x > this.children["pad"].bounds.left &&
            mouseEvent.point.x < this.children["pad"].bounds.right &&
            mouseEvent.point.y > this.children["pad"].bounds.top &&
            mouseEvent.point.y < this.children["pad"].bounds.bottom) {
            selectedItem.parent.children["line-x"].position.y = mouseEvent.point.y;
            selectedItem.parent.children["line-y"].position.x = mouseEvent.point.x;
            selectedItem.parent.children["circle"].position = mouseEvent.point;
            selectedItem.parent.data.value[0] = Math.round(mapp(mouseEvent.point.x, this.data.from[0], this.data.to[0], this.data.min, this.data.max));
            //if (connected) sendControlChange(selectedItem.parent.data.Xcc, selectedItem.parent.data.value[0], selectedItem.parent.data.x_chan);
            selectedItem.parent.data.value[1] = Math.round(mapp(mouseEvent.point.y, this.data.from[1], this.data.to[1], this.data.max, this.data.min));
            //if (connected) sendControlChange(selectedItem.parent.data.Ycc, selectedItem.parent.data.value[1], selectedItem.parent.data.y_chan);
            //updateMenuParams(selectedItem.parent);
          }
        }
      }
    }
  });
  return _Touchpad;
};

/////////// TRIGGER Factory
function triggerFactory() {
  var defaulSize = 80;
  var _Trigger = new paper.Group({
    data: {
      "type": "trigger",
      "from": [null, null],
      "to": [null, null],
      "value": null,
      "chan": null,
      "note": null,
      "velocity": null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = defaulSize / 2;
      this.data.from = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velocity = params.velocity;
    },
    create: function () {
      var sizeX = this.data.to[0] - this.data.from[0];
      var sizeY = this.data.to[1] - this.data.from[1];
      var circleCenterX = this.data.to[0] - (sizeX / 2);
      var circleCenterY = this.data.to[1] - (sizeY / 2);
      var _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 10,
        strokeColor: "SkyBlue",
        fillColor: "SkyBlue",
      });
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(circleCenterX, circleCenterY),
        radius: sizeX / 2.2,
        fillColor: "Yellow"
      });
      this.addChild(_square);
      this.addChild(_circle);
    },
    activate: function (mouseEvent) {
      if (selectedItem.name === "circle") {
        //console.log("activate");
        this.children["circle"].fillColor = "LawnGreen";
        this.data.value = this.data.note;
        if (connected) sendNoteOn(this.data.note, this.data.velocity, this.data.chan);
        updateMenuParams(this);
        setTimeout(this.triggerOff, 200, this);
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            this.translate(mouseEvent.delta);
            this.data.from[0] = Math.round(this.data.from[0] += mouseEvent.delta.x);
            this.data.from[1] = Math.round(this.data.from[1] += mouseEvent.delta.y);
            this.data.to[0] = Math.round(this.data.to[0] += mouseEvent.delta.x);
            this.data.to[1] = Math.round(this.data.to[1] += mouseEvent.delta.y);
            updateMenuParams(this);
            break;
          case "stroke":
            if (selectedItem.name === "square") {
              var triggRadius_x = (this.bounds.right - this.bounds.left) / 2;
              var triggRadius_y = (this.bounds.bottom - this.bounds.top) / 2;
              var triggRadius = triggRadius_x;

              var triggCenter_x = this.bounds.left + triggRadius_x;
              var triggCenter_y = this.bounds.top + triggRadius_y;
              var x = mouseEvent.point.x - triggCenter_x;
              var y = mouseEvent.point.y - triggCenter_y;
              var lastTriggRadius = triggRadius;
              var triggRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(triggRadius / lastTriggRadius);

              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
              updateMenuParams(this);
            } else if (selectedItem.name === "circle") {
              this.moveItem(mouseEvent);
            }
            break;
        }
      }
    },
    triggerOff: function (item) {
      item.children["circle"].fillColor = "Yellow";
      item.data.value = 0;
      if (connected) sendNoteOff(item.data.note, 0, item.data.chan);
      updateMenuParams(item);
    }
  });
  return _Trigger;
}

/////////// SWITCH Factory
function switchFactory() {
  var defaulSize = 80;
  var _Switch = new paper.Group({
    data: {
      type: "switch",
      from: [null, null],
      to: [null, null],
      value: null,
      chan: null,
      note: null,
      velocity: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = defaulSize / 2
      this.data.from = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velocity = params.velocity;
    },
    create: function () {
      let _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 1,
        strokeColor: "Yellow",
        fillColor: "Yellow"
      });
      let _line_a = new paper.Path.Line({
        name: "line",
        from: new paper.Point(this.data.from[0], this.data.from[1]),
        to: new paper.Point(this.data.to[0], this.data.to[1]),
        strokeWidth: 1,
        strokeColor: "black"
      });
      let _line_b = new paper.Path.Line({
        name: "line",
        from: new paper.Point(this.data.from[0], this.data.to[1]),
        to: new paper.Point(this.data.to[0], this.data.from[1]),
        strokeWidth: 1,
        strokeColor: "black",
      });
      this.addChild(_square);
      this.addChild(_line_a);
      this.addChild(_line_b);
    },
    activate: function (mouseEvent) {
      this.data.value = !this.data.value;
      if (this.data.value) {
        this.children[1].visible = true;
        this.children[2].visible = true;
        if (connected) sendNoteOn(this.data.note, this.data.velocity, this.data.chan);
        updateMenuParams(this);
      } else {
        this.children[1].visible = false;
        this.children[2].visible = false;
        if (connected) sendNoteOff(this.data.note, 0, this.data.chan);
        updateMenuParams(this);
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            //moveItem(this, mouseEvent);
            this.translate(mouseEvent.delta);
            this.data.from[0] = Math.round(this.children["square"].bounds.left);
            this.data.from[1] = Math.round(this.children["square"].bounds.top);
            this.data.to[0] = Math.round(this.children["square"].bounds.right);
            this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            updateMenuParams(this);
            break;
          case "stroke":
            if (selectedItem.name === "square") {
              var switchRadius_x = (this.bounds.right - this.bounds.left) / 2;
              var switchRadius_y = (this.bounds.bottom - this.bounds.top) / 2;
              var switchRadius = switchRadius_x;
              var switchCenter_x = this.bounds.left + switchRadius_x;
              var switchCenter_y = this.bounds.top + switchRadius_y;
              var x = mouseEvent.point.x - switchCenter_x;
              var y = mouseEvent.point.y - switchCenter_y;
              var lastSwitchRadius = switchRadius;
              var switchRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(switchRadius / lastSwitchRadius);
              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            }
            else if (selectedItem.name === "line") {
              //moveItem(this, mouseEvent);
              this.translate(mouseEvent.delta);
              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            }
            updateMenuParams(this);
            break;
        }
      }
    }
  });
  return _Switch;
}

/////////// SLIDER Factory
function sliderFactory() {
  var defaultWidth = 50;
  var defaultHeight = 400;
  var minWidth = 45;
  var minHeight = 100;
  var lastValue = null; // Is it Global !?
  var sliderDir = 0;

  var _Slider = new paper.Group({
    data: {
      type: "slider",
      from: [null, null],
      to: [null, null],
      value: 0,
      chan: null,
      cc: null,
      min: 0,
      max: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (defaultWidth / 2)), Math.round(mouseEvent.point.y - (defaultHeight / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (defaultWidth / 2)), Math.round(mouseEvent.point.y + (defaultHeight / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.chan;
      this.data.cc = params.cc;
      this.data.min = params.min;
      this.data.max = params.max;
    },
    create: function () {
      var _rect = new paper.Path.Rectangle({
        name: "rect",
        value: 0,
        from: new paper.Point(this.data.from[0], this.data.from[1]),
        to: new paper.Point(this.data.to[0], this.data.to[1]),
        selected: true,
        strokeWidth: 3,
        strokeColor: "Green",
        fillColor: "SkyBlue"
      });
      var _handle = new paper.Path.Line({
        name: "handle",
        from: new paper.Point(this.data.from[0], this.data.from[1] + (defaultHeight / 2)),
        to: new paper.Point(this.data.to[0], this.data.from[1] + (defaultHeight / 2)),
        strokeWidth: 10,
        strokeCap: "round",
        strokeColor: "black"
      });
      this.addChild(_rect);
      this.addChild(_handle);
    },
    activate: function (mouseEvent) {
      this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
      this.children["handle"].position.y = mouseEvent.point.y;
      //sliderWidth = this.bounds.right - this.bounds.left;
      //sliderHeight = this.bounds.bottom - this.bounds.top;
      updateMenuParams(this);
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            //moveItem(this, mouseEvent);
            this.translate(mouseEvent.delta);
            this.data.from[0] = Math.round(this.bounds.left);
            this.data.from[1] = Math.round(this.bounds.top);
            this.data.to[0] = Math.round(this.bounds.right);
            this.data.to[1] = Math.round(this.bounds.bottom);
            updateMenuParams(this);
            break;
          case "stroke":
            switch (selectedItem.name) {
              case "rect":
                if (this.bounds.width > this.bounds.height) {
                  sliderDir = H_SLIDER;
                } else {
                  sliderDir = V_SLIDER;
                }
                switch (selectedSegment) {
                  case 0: // Update left segment
                    if ( mouseEvent.point.x < this.bounds.right - minWidth) {
                    }
                    else {
                      this.data.from[0] = Math.round(this.bounds.left);
                      this.children["rect"].segments[0].point.x = mouseEvent.point.x;
                      this.children["rect"].segments[1].point.x = mouseEvent.point.x;
                      switch (sliderDir) {
                        case H_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.right - (this.bounds.width / 2);
                          this.children["handle"].segments[0].point.y = this.bounds.top;
                          this.children["handle"].segments[1].point.x = this.bounds.right - (this.bounds.width / 2);
                          this.children["handle"].segments[1].point.y = this.bounds.bottom;
                          break;
                        case V_SLIDER:
                          this.children["handle"].segments[0].point.x = mouseEvent.point.x;
                          this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
                          this.children["handle"].segments[1].point.x = this.bounds.right;
                          this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
                          break;
                      }
                    }
                    break;
                  case 1: // Update top segment
                    if (mouseEvent.point.y > this.bounds.bottom - minHeight) {
                    }
                    else {
                      this.data.from[1] = Math.round(this.bounds.top);
                      this.children["rect"].segments[1].point.y = mouseEvent.point.y;
                      this.children["rect"].segments[2].point.y = mouseEvent.point.y;
                      switch (sliderDir) {
                        case H_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[0].point.y = mouseEvent.point.y;
                          this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[1].point.y = this.bounds.bottom;
                          break;
                        case V_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left;
                          this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
                          this.children["handle"].segments[1].point.x = this.bounds.right;
                          this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
                          break;
                      }
                    }
                    break;
                  case 2: // Update right segment
                    if ( mouseEvent.point.x < this.bounds.left + minWidth) {
                    }
                    else {
                      this.data.to[0] = Math.round(this.bounds.right);
                      this.children["rect"].segments[2].point.x = mouseEvent.point.x;
                      this.children["rect"].segments[3].point.x = mouseEvent.point.x;
                      switch (sliderDir) {
                        case H_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[0].point.y = this.bounds.top;
                          this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[1].point.y = this.bounds.bottom;
                          break;
                        case V_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left;
                          this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
                          this.children["handle"].segments[1].point.x = mouseEvent.point.x
                          this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
                          break;
                      }
                    }
                    break;
                  case 3: // Update bottom segment
                    if ( mouseEvent.point.y < this.bounds.top + minHeight) {
                    }
                    else {
                      this.data.to[1] = Math.round(this.bounds.bottom);
                      this.children["rect"].segments[0].point.y = mouseEvent.point.y;
                      this.children["rect"].segments[3].point.y = mouseEvent.point.y;
                      switch (sliderDir) {
                        case H_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[0].point.y = this.bounds.top;
                          this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                          this.children["handle"].segments[1].point.y = mouseEvent.point.y;
                          break;
                        case V_SLIDER:
                          this.children["handle"].segments[0].point.x = this.bounds.left;
                          this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
                          this.children["handle"].segments[1].point.x = this.bounds.right;
                          this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
                          break;
                      }
                    }
                    break;
                }
                updateMenuParams(this);
                break;
              case "handle":
                //moveItem(this, mouseEvent);
                this.translate(mouseEvent.delta);
                this.data.from[0] = Math.round(this.bounds.left);
                this.data.from[1] = Math.round(this.bounds.top);
                this.data.to[0] = Math.round(this.bounds.right);
                this.data.to[1] = Math.round(this.bounds.bottom);
                updateMenuParams(this);
                break;
            }
        }
      }
    },
    onMouseMove: function (mouseEvent) {
      if (currentMode === PLAY_MODE) {
        switch (sliderDir) {
          case H_SLIDER:
            if (mouseEvent.point.x > this.bounds.left && mouseEvent.point.x < this.bounds.right) {
              this.data.value = Math.round(mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.min, this.data.max));
              //this.children["handle"].position.x = mouseEvent.point.x;
              this.children["handle"].segments[0].point.y = this.bounds.top;
              this.children["handle"].segments[0].point.x = mouseEvent.point.x;
              this.children["handle"].segments[1].point.y = this.bounds.bottom;
              this.children["handle"].segments[1].point.x  = mouseEvent.point.x;
            }
            break;
          case V_SLIDER:
            if (mouseEvent.point.y > this.bounds.top && mouseEvent.point.y < this.bounds.bottom) {
              this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
              //this.children["handle"].position.y = mouseEvent.point.y;
              this.children["handle"].segments[0].point.x = this.bounds.left;
              this.children["handle"].segments[0].point.y = mouseEvent.point.y;
              this.children["handle"].segments[1].point.x = this.bounds.right;
              this.children["handle"].segments[1].point.y  = mouseEvent.point.y;
            }
            break;
        }
        if (this.data.value != lastValue) {
          lastValue = this.data.value;
          if (connected) sendControlChange(this.data.cc, this.data.value, this.data.chan);
          updateMenuParams(this);
        }
      }
    },
    onMouseUp: function (mouseEvent) {
      switch (currentMode) {
        case EDIT_MODE:
          break;
        case PLAY_MODE:
          break;
      }
    }
  });
  return _Slider;
}

/////////// KNOB Factory
function knobFactory(mouseEvent) {
  var defaultRadius = 80;
  var defaultOffet = 90;
  var defaultStrokeWidth = 10;
  var last_offset = 0;
  var last_rVal = 0;
  var last_tVal = 0;

  var _Knob = new paper.Group({
    data: {
      type: "knob",
      center: [null, null],
      offset: 60,
      radius: 50,
      theta_val: 0, tChan: 1, tCc: 1, tMin: 0, tMax: 127,
      radius_val: 0, rChan: 1, rCc: 2, rMin: 0, rMax: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.center[0] = Math.round(mouseEvent.point.x);
      this.data.center[1] = Math.round(mouseEvent.point.y);
      this.data.radius = defaultRadius;
    },
    setupFromConfig: function (params) {
      this.data.center = params[i].center;
      this.data.radius = params[i].radius;
      this.data.offset = params[i].offset;
      this.data.tChan = params[i].tChan;
      this.data.tCc = params[i].tCc;
      this.data.tMin = params[i].tMin;
      this.data.tMax = params[i].tMax;
      this.data.rChan = params[i].rChan;
      this.data.rCc = params[i].rCc;
      this.data.rMin = params[i].rMin;
      this.data.rMax = params[i].rMax;
    },
    create: function () {
      var headPos = pol_to_cart(this.data.radius - defaultStrokeWidth, deg_to_rad(defaultOffet));
      var footPos = pol_to_cart(this.data.radius - defaultStrokeWidth * 2, deg_to_rad(defaultOffet));
      var handlePos = pol_to_cart(this.data.radius + defaultStrokeWidth, deg_to_rad(defaultOffet));
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(this.data.center[0], this.data.center[1]),
        radius: this.data.radius,
        strokeWidth: 1,
        strokeColor: "SpringGreen",
        fillColor: "SpringGreen"
      });
      var _head = new paper.Path.Circle({
        name: "needle-head",
        center: new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y),
        radius: 6,
        strokeColor: "black",
        strokeWidth: 5
      });
      var _foot = new paper.Path.Line({
        name: "needle-foot",
        from: new paper.Point(this.data.center[0], this.data.center[1]),
        to: new paper.Point((this.data.center[0] + footPos.x), this.data.center[1] + footPos.y),
        strokeCap: "round",
        strokeColor: "black",
        strokeWidth: 5,
      });
      var _handle = new paper.Path.RegularPolygon({
        name: "handle",
        center: new paper.Point(this.data.center[0] + handlePos.x, this.data.center[1] + handlePos.y),
        radius: 10,
        fillColor: "red",
        sides: 3
      });
      _handle.rotate(-30);

      _Knob.addChild(_circle);
      _Knob.addChild(_head);
      _Knob.addChild(_foot);
      _Knob.addChild(_handle);
    },
    activate: function (mouseEvent) {
      if (currentMode === PLAY_MODE) {
        var x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        var y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        headPos = pol_to_cart(polar.radius, polar.theta);
        footPos = pol_to_cart(polar.radius, polar.theta);
        this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        last_rVal = this.data.radius;
        this.data.radius = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
        if (connected && this.data.radius != last_rVal) {
          sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
        }

        last_tVal = this.data.tVal;
        var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
        this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
        if (connected && this.data.tVal != last_tVal) {
          sendControlChange(this.data.tCc, this.data.tVal, this.data.tChan);
        }
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            if (selectedItem.name === "handle") {
              let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
              let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
              last_offset = this.data.offset;
              this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              let delta = this.data.offset - last_offset;
              this.children["handle"].rotate(delta, new paper.Point(this.data.center[0], this.data.center[1]));
              updateMenuParams(this);
            } else {
              //moveItem(this, mouseEvent);
              this.translate(mouseEvent.delta);
              this.data.center[0] += Math.round(mouseEvent.delta.x);
              this.data.center[1] += Math.round(mouseEvent.delta.y);
            }
            break;
          case "stroke":
            switch (selectedItem.name) {
              case "circle":
                let x = mouseEvent.point.x - this.data.center[0];
                let y = mouseEvent.point.y - this.data.center[1];
                let polar = cart_to_pol(x, y);
                this.scale(polar.radius / this.data.radius);
                this.data.radius = Math.round(polar.radius);
                break;
              case "needle-head" || "needle-foot":
                //moveItem(this, mouseEvent);
                this.translate(mouseEvent.delta);
                this.data.center[0] += Math.round(mouseEvent.delta.x);
                this.data.center[1] += Math.round(mouseEvent.delta.y);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        let polar = cart_to_pol(x, y);
        let headPos;
        let footPos;
        if (polar.radius > this.data.radius) {
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(this.data.radius, polar.theta);
          footPos = pol_to_cart(this.data.radius, polar.theta);
        } else {
          last_rVal = this.data.radius;
          this.data.rVal = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          last_tVal = this.data.tVal;
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(polar.radius, polar.theta);
          footPos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        updateMenuParams(this);

        // SEND MIDI CONTROL_CHANGE
        if (connected && this.data.tVal != last_tVal) {
          sendControlChange(this.data.tCc, this.data.tVal, this.data.tChan);
        }
        if (connected && this.data.rVal != last_rVal) {
          sendControlChange(this.data.rCc, this.data.rVal, this.data.rChan);
        }
      }
    }
  });
  return _Knob;
}

/////////// PATH Factory
// http://paperjs.org/reference/path/#path
function pathFactory() {
  var defaultStrokeWidth = 20;

  var _Path = new paper.Group({
    data: {
      type: "path",
      segments: [],
      min: 0,
      max: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.segments.push([Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)]);
      //this.path.closed = true;
    },
    setupFromConfig: function (params) {
      this.data.segments = params.segments; // vertex!?
      this.data.min = params.min;
      this.data.max = params.max;
    },
    create: function () {
      var _path = new paper.Path({
        name: "path",
        segments: this.data.segments, // vertex!?
        strokeWidth: defaultStrokeWidth,
        strokeColor: new paper.Color(0.7, 0, 0.5),
        selected: true,
        strokeCap: "round",
        strokeJoin: "round"
      });
      this.addChild(_path);
    },
    addPoint: function (mouseEvent) {
      var newPoint = [Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)];
      this.data.segments.push(newPoint);
      this.children["path"].add(newPoint);
      this.children["path"].smooth();
    },
    activate: function (mouseEvent) {
      this.children[0].selected = true;
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        if (selectedSegment) {
          this.children["path"].segments[selectedSegment].point.x = mouseEvent.point.x;
          this.children["path"].segments[selectedSegment].point.y = mouseEvent.point.y;
          this.data.segments[selectedSegment][0] = Math.round(mouseEvent.point.x);
          this.data.segments[selectedSegment][1] = Math.round(mouseEvent.point.y);
          updateMenuParams(this);
        }
      }
      else if (currentMode === PLAY_MODE) {
        // TODO!
      }
    }
  });
  return _Path;
};

/////////// POLYGON Factory
// TODO

/////////////////////////////////////////////////////////////////////////////::
function moveItem(mouseEvent) {
  this.translate(mouseEvent.delta);
  this.data.from[0] += Math.round(mouseEvent.delta.x);
  this.data.from[1] += Math.round(mouseEvent.delta.y);
  this.data.to[0] += Math.round(mouseEvent.delta.x);
  this.data.to[1] += Math.round(mouseEvent.delta.y);
}

function updateMenuParams(item) {
  var paramsIndex = 0;
  //console.log("UPDATE_MENU");
  for (const param in item.data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(item.data[param]);
    paramsIndex++;
  }
}

function scale2d(item, mouseEvent) {
  var x = mouseEvent.point.x - item.data.x;
  var y = mouseEvent.point.y - item.data.y;
  var radius = Math.sqrt((x * x) + (y * y));
  var newRadius = radius - (item.children[0].strokeWidth / 2);
  var oldRadius = (item.data.to.x - item.data.from.x) / 2;
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
