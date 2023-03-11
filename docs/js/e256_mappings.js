/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var grid_uid = 0;
var touchpad_uid = 0;
var trigger_uid = 0;
var switch_uid = 0;
var slider_uid = 0;
var knob_uid = 0;
var path_uid = 0;

/////////// GRID Factory
function gridFactory() {

  const grid_default_width = 400;
  const grid_default_height = 400;
  var frame_width  = grid_default_width;
  var frame_height = grid_default_height;
  var frame_offset = 5; // TODO!

  var key_width = 0;
  var key_height = 0;
  var half_key_width = 0;
  var half_key_height = 0; 
  
  var menu_locker = false;
  
  const grid_menu_style = {
    grid: "form-control",
    from: "form-control",
    to: "form-control",
    cols: "form-select",
    rows: "form-select",
    mode: "form-select",
    aftertouch: "btn btn-secondary btn-sm dropdown-toggle",
    velocity: "btn btn-secondary btn-sm dropdown-toggle"
    //gap: 1
  };

  const key_menu_style = {
    key: "form-control",
    value: "form-control",
    chan: "form-select",
    note: "form-select",
    velo: "form-select"
  };

  var _Grid = new paper.Group({
    name: "Grid",
    data: {
      grid: grid_uid,
      from: [null, null],
      to: [null, null],
      cols: 16,
      rows: 16,
      mode: "trigger",
      aftertouch: true,
      velocity: false
      //gap: 1
    },
    
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (grid_default_width / 2)), Math.round(mouseEvent.point.y - (grid_default_height / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (grid_default_width / 2)), Math.round(mouseEvent.point.y + (grid_default_height / 2))];
      key_width = (this.data.to[0] - this.data.from[0]) / this.data.cols;
      key_height = (this.data.to[1] - this.data.from[1]) / this.data.rows;
    },

    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.mode = params.mode;
      key_width = (this.data.to[0] - this.data.from[0]) / this.data.cols;
      key_height = (this.data.to[1] - this.data.from[1]) / this.data.rows;
      //this.data.gap = params.gap;
      // TODO: keys setup!
    },

    updateFromParams: function () {
      console.log("UPDATE_ITEM: " + selected_item.name);
      switch (selected_item.name) {
        case "Grid":

          for (const param in this.data) {
            switch (param) {
              case "grid":
                // Read-only : nothing to do
                break;
              case "from":
                this.data.from = $("#param_value-" + param).val().split(",");
                //console.log("FROM_Y: " + this.data.from[1]);
                break;
              case "to":
                this.data.to = $("#param_value-" + param).val().split(",");
                //console.log("TO_X: " + this.data.to[0]);
                break;
              default:
                // rows / cols
                let input_value = $("#param_value-" + param).val();
                if (input_value) {
                  $("#param_value-" + param).removeClass("bg-danger text-white");
                  this.data[param] = input_value;
                } else {
                  $("#param_value-" + param).addClass("bg-danger text-white");
                }
                break;
            }
          }
          /*
          last_keys_count = keys_count;
          keys_count = this.data.cols * this.data.rows;
          if (keys_count != last_keys_count){...}
          */
          this.removeChildren();
          this.create();
          break;
        case "Key":
          for (const param in this.data) {
            switch (param) {
              case "key":
                // Read-only : nothing to do
                break;
              case "value":
                // Nothing to do
                break;
              default:
                let input_value = $("#param_value-" + param).val();
                if (input_value) {
                  $("#param_value-" + param).removeClass("bg-danger text-white");
                  this.data[param] = input_value;
                } else {
                  $("#param_value-" + param).addClass("bg-danger text-white");
                }
                break;
            }
          }
          break;
      }
      switch (selected_item.name) {
        case "Grid":
          this.children["grid-frame"].strokeColor = "lightGreen";
          break;
        case "Key":
          this.children["key-rect"].fillColor = "lightGreen";
          this.children["key-txt"].content = this.data.note;
          break;
        default:
          break;
      }
      menu_locker = false;
    },
    /*
    unction updateMenuParams(item) {
      for (const param in item.data) {
        $("#param_atribute-" + param).html(param);
        $("#param_value-" + param).val(item.data[param]);
      }
    }
    */
    newKey: function (y_index, x_index) {
      var key_uid = y_index * this.data.cols + x_index;
      var _Key = new paper.Group({
        name: "Key",
        data: {
          key: key_uid,
          value: false,
          chan: 1,      // TODO: Dropdown menu!
          note: null,   // TODO: Dropdown menu!
          velo: 127     // TODO: Dropdown menu!
        }
      });
      var _rect = new paper.Path.Rectangle({
        name: "key-rect",
        from: [this.data.from[0] + x_index * key_width, this.data.from[1] + y_index * key_height],
        to: [this.data.from[0] + (x_index * key_width) + key_width, this.data.from[1] + (y_index * key_height) + key_height],
        fillColor: "pink",
        strokeColor: "black",
        strokeWidth: 0.2
      });
      _Key.addChild(_rect);
      var _txt = new paper.PointText({
        name: "key-txt",
        point: new paper.Point(_Key.children["key-rect"].position),
        content: _Key.data.note,
        fillColor: "black"
      });
      _Key.addChild(_txt);
      return _Key;
    },

    create: function () {
      var _frame = new paper.Path.Rectangle({
        name: "grid-frame",
        from: [this.data.from[0], this.data.from[1]],
        to: [this.data.to[0], this.data.to[1]],
        strokeColor: "lightGreen",
        strokeWidth: 10,
        fillColor: "white"
      });
      this.addChild(_frame);
      key_width = (this.data.to[0] - this.data.from[0]) / this.data.cols;
      key_height = (this.data.to[1] - this.data.from[1]) / this.data.rows;
      for (let pos_y = 0; pos_y < this.data.rows; pos_y++) {
        for (let pos_x = 0; pos_x < this.data.cols; pos_x++) {
          this.addChild(this.newKey(pos_y, pos_x));
        }
      }
      grid_uid++;
    },

    createMenuParams: function () {
      //////// Grid-params ////////
      create_params(this, grid_menu_style);
      console.log(this.name );
      $("#" + this.name + "-params").collapse("hide");

      //////// Key-params ////////
      create_params(this.lastChild, key_menu_style);
      console.log(this.lastChild.name);
      $("#" + this.lastChild.name + "-params").collapse("hide");
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        stroke: true,
        bounds: true,
        fill: false,
        tolerance: 5
      }
      tmp_selector = paper.project.hitTest(mouseEvent.point, mouse_enter_options);
      if (tmp_selector) {
        if (tmp_selector.item.name === "key-txt" || tmp_selector.item.name === "key-rect" || tmp_selector.item.name  === "grid-frame") {
          highlight_item = tmp_selector.item.parent;
        } 
        else {
          highlight_item = tmp_selector.item;
        }
      } 
      //console.log("H_ITEM: " + highlight_item);
      switch (e256_current_mode) {
        case EDIT_MODE:
          switch (highlight_item.name) {
            case "Grid":
              highlight_item.children["grid-frame"].selected = true;
              break;
            case "Key":
              highlight_item.children["key-rect"].selected = true;
              break;
          }
          break;
        case PLAY_MODE:
          console.log("NOT_IMPLEMENTED"); // TODO
          break;
        default:
          break;
      }
    },

    onMouseLeave: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          switch (highlight_item.name) {
            case "Grid":
              highlight_item.children["grid-frame"].selected = false;
              break;
            case "Key":
              highlight_item.children["key-rect"].selected = false;
              break;
          }
          break;
        case PLAY_MODE:
          console.log("NOT_IMPLEMENTED"); // TODO
          break;
        default:
          break;
      }
    },

    onMouseDown: function (mouseEvent) {
       var mouse_down_options = {
        stroke: false,
        bounds: true,
        fill: true,
        tolerance: 6
      }
      tmp_selector = paper.project.hitTest(mouseEvent.point, mouse_down_options);
      if (tmp_selector) {
        last_selected_item = selected_item;
        if (tmp_selector.item.name === "key-txt" || tmp_selector.item.name === "key-rect" || tmp_selector.item.name  === "grid-frame") {
          selected_item = tmp_selector.item.parent;
          selected_part = tmp_selector.item;
        }
        else {
          selected_item = tmp_selector.item
          selected_part = tmp_selector;
        }
      }
      //console.log("ITEM: " + selected_item);
      //console.log("L_ITEM: " + last_selected_item);
      //console.log("PART: " + selected_part);

      switch (e256_current_mode) {
        case EDIT_MODE:
          if (!last_selected_item) return;
          switch (selected_item.name) {
            case "Grid":
              switch (last_selected_item.name) {
                case "Grid":
                  updateMenuParams(selected_item);
                  break;
                case "Key":
                  hideMenuParams(last_selected_item);
                  showMenuParams(selected_item);
                  selected_item.children["grid-frame"].strokeColor = "orange";
                  last_selected_item.children["key-rect"].fillColor = "pink";
                  updateMenuParams(selected_item);
                  break;
                default:
                  break;
              }
              break;
            case "Key":
              switch (last_selected_item.name) {
                case "Grid":
                  hideMenuParams(last_selected_item);
                  showMenuParams(selected_item);
                  last_selected_item.children["grid-frame"].strokeColor = "lightGreen";
                  selected_item.children["key-rect"].fillColor = "orange";
                  updateMenuParams(selected_item);
                  break;
                case "Key":
                  last_selected_item.children["key-rect"].fillColor = "pink";
                  selected_item.children["key-rect"].fillColor = "orange";
                  updateMenuParams(selected_item);
                  break;
                default:
                  break;
              }
              break;
            default:
              break;
          }
          //menu_locker = true;
          break;
        case PLAY_MODE:
          // TODO
          break;
      }
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          switch (selected_part.type) {
            case "fill":
              //moveItem(this, mouseEvent);
              break;
            case "bounds":
              switch (selected_item.name) {
                case "Grid":
                  switch (selected_part.name) {
                    case "top-left":
                      this.children["grid-frame"].segments[0].point.x = mouseEvent.point.x;
                      this.children["grid-frame"].segments[1].point = mouseEvent.point;
                      this.children["grid-frame"].segments[2].point.y = mouseEvent.point.y;
                      frame_width = this.bounds.right - mouseEvent.point.x;
                      key_width = frame_width / this.data.cols;
                      frame_height = this.bounds.bottom - mouseEvent.point.y;
                      key_height = frame_height / this.data.rows;
                      half_key_width = key_width / 2;
                      half_key_height = key_height / 2;
                      for (let pos_y = 0; pos_y < this.data.rows; pos_y++) {
                        let row_index = pos_y * this.data.cols;
                        let newPos_y = this.children["grid-frame"].bounds.bottom - (this.data.rows - pos_y) * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.data.cols; pos_x++) {
                          let index = row_index + pos_x + 1; // +1 for grid-frame in the background
                          let newPos_x = this.children["grid-frame"].bounds.right - (this.data.cols - pos_x) * key_width + half_key_width;
                          this.children[index].children["key-rect"].position.x = newPos_x;
                          this.children[index].children["key-rect"].position.y = newPos_y;
                          this.children[index].children["key-txt"].position.x = newPos_x;
                          this.children[index].children["key-txt"].position.y = newPos_y;
                          this.children[index].children["key-rect"].bounds.width = key_width;
                          this.children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.data.from[0] = Math.round(mouseEvent.point.x);
                      this.data.from[1] = Math.round(mouseEvent.point.y);
                      break;
                    case "top-right":
                      this.children["grid-frame"].segments[1].point.y = mouseEvent.point.y;
                      this.children["grid-frame"].segments[2].point = mouseEvent.point;
                      this.children["grid-frame"].segments[3].point.x = mouseEvent.point.x;
                      frame_width = mouseEvent.point.x - this.bounds.left;
                      key_width = frame_width / this.data.cols;
                      frame_height = this.bounds.bottom - mouseEvent.point.y;
                      key_height = frame_height / this.data.rows;
                      half_key_width = key_width / 2;
                      half_key_height = key_height / 2;
                      for (let pos_y = 0; pos_y < this.data.rows; pos_y++) {
                        let row_index = pos_y * this.data.cols;
                        let newPos_y = this.children["grid-frame"].bounds.bottom - (this.data.rows - pos_y) * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.data.cols; pos_x++) {
                          let index = row_index + pos_x + 1; // +1 for frame background
                          let newPos_x = this.children["grid-frame"].bounds.left + pos_x * key_width + half_key_width;
                          this.children[index].children["key-rect"].position.x = newPos_x;
                          this.children[index].children["key-rect"].position.y = newPos_y;
                          this.children[index].children["key-txt"].position.x = newPos_x;
                          this.children[index].children["key-txt"].position.y = newPos_y;
                          this.children[index].children["key-rect"].bounds.width = key_width;
                          this.children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.data.from[1] = Math.round(mouseEvent.point.y);
                      this.data.to[0] = Math.round(mouseEvent.point.x);
                      break;
                    case "bottom-right":
                      this.children["grid-frame"].segments[2].point.x = mouseEvent.point.x;
                      this.children["grid-frame"].segments[3].point = mouseEvent.point;
                      this.children["grid-frame"].segments[0].point.y = mouseEvent.point.y;
                      frame_width = mouseEvent.point.x - this.bounds.left;
                      key_width = frame_width / this.data.cols;
                      frame_height = mouseEvent.point.y - this.bounds.top;
                      key_height = frame_height / this.data.rows;
                      half_key_width = key_width / 2;
                      half_key_height = key_height / 2;
                      for (let pos_y = 0; pos_y < this.data.rows; pos_y++) {
                        let row_index = pos_y * this.data.cols;
                        let newPos_y = this.children["grid-frame"].bounds.top + pos_y * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.data.cols; pos_x++) {
                          let index = row_index + pos_x + 1; // +1 for frame background
                          let newPos_x = this.children["grid-frame"].bounds.left + pos_x * key_width + half_key_width;
                          this.children[index].children["key-rect"].position.x = newPos_x;
                          this.children[index].children["key-rect"].position.y = newPos_y;
                          this.children[index].children["key-txt"].position.x = newPos_x;
                          this.children[index].children["key-txt"].position.y = newPos_y;
                          this.children[index].children["key-rect"].bounds.width = key_width;
                          this.children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.data.to[0] = Math.round(mouseEvent.point.x);
                      this.data.to[1] = Math.round(mouseEvent.point.y);
                      break;
                    case "bottom-left":
                      this.children["grid-frame"].segments[3].point.y = mouseEvent.point.y;
                      this.children["grid-frame"].segments[0].point = mouseEvent.point;
                      this.children["grid-frame"].segments[1].point.x = mouseEvent.point.x;
                      frame_width = this.bounds.right - mouseEvent.point.x;
                      key_width = frame_width / this.data.cols;
                      frame_height = mouseEvent.point.y - this.bounds.top;
                      key_height = frame_height / this.data.rows;
                      half_key_width = key_width / 2;
                      half_key_height = key_height / 2;
                      for (let pos_y = 0; pos_y < this.data.rows; pos_y++) {
                        let row_index = pos_y * this.data.cols;
                        let newPos_y = this.children["grid-frame"].bounds.top + pos_y * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.data.cols; pos_x++) {
                          let index = row_index + pos_x + 1; // +1 for frame background
                          let newPos_x = this.children["grid-frame"].bounds.right - (this.data.cols - pos_x) * key_width + half_key_width;
                          this.children[index].children["key-rect"].position.x = newPos_x;
                          this.children[index].children["key-rect"].position.y = newPos_y;
                          this.children[index].children["key-txt"].position.x = newPos_x;
                          this.children[index].children["key-txt"].position.y = newPos_y;
                          this.children[index].children["key-rect"].bounds.width = key_width;
                          this.children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.data.from[0] = Math.round(mouseEvent.point.x);
                      this.data.to[1] = Math.round(mouseEvent.point.y);
                      break;
                    default:
                      console.log("PART_NOT_USE: " + selected_part.name);
                      break;
                  }
                case "Key":
                  //moveItem(this, mouseEvent);
                  break;
              }
              updateMenuParams(this);
              break;
            default:
              console.log("TYPE_NOT_USE: " + selected_part.type);
              break;
          }
          break;
        case PLAY_MODE:
          //TODO
          break;
      }
    }

  });

  return _Grid;
};

/////////// TOUCHPAD Factory
function touchpadFactory() {
  const pad_default_width = 400;
  const pad_default_height = 400;
  let pad_width  = pad_default_width;
  let pad_height = pad_default_height;
  let last_pad_width  = pad_width ;
  let lastHeight = pad_height;
  let margin = 35;
  
  var select = false;

  var _Touchpad = new paper.Group({
    name: "touchpad",
    data: {
      type: "touchpad",
      from: [null, null],
      to: [null, null],
      touchs: 3,
      min: 0,
      max: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (pad_default_width / 2)), Math.round(mouseEvent.point.y - (pad_default_height / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (pad_default_width / 2)), Math.round(mouseEvent.point.y + (pad_default_height / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.to = params.touchs;
      this.data.min = params.min;
      this.data.max = params.max;
    },
    updateFromParams: function () {
      //if (this.data.touchs != last_touchs_count){}
      this.removeChildren(0);
      this.create();
    },
    create: function () {
      var _Pad = new paper.Path.Rectangle({
        name: "pad",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "pink"
      });
      this.addChild(_Pad);
      for (let i = 0; i < this.data.touchs; i++) {
        this.addChild(this.newTouch(i));
      }
    },
    newTouch: function (index) {
      var _Touch = new paper.Group({
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
        from: new paper.Point(this.data.from[0], _Touch.data.value[1]),
        to: new paper.Point(this.data.to[0], _Touch.data.value[1]),
        strokeColor: "black",
        strokeWidth: 1
      });
      var _line_y = new paper.Path.Line({
        name: "line-y",
        from: new paper.Point(_Touch.data.value[0], this.data.from[1]),
        to: new paper.Point(_Touch.data.value[0], this.data.to[1]),
        strokeColor: "black",
        strokeWidth: 1
      });
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(_Touch.data.value[0], _Touch.data.value[1]),
        radius: 15,
        fillColor: "green"
      });
      _Touch.addChild(_line_x);
      _Touch.addChild(_line_y);
      _Touch.addChild(_circle);
      return _Touch;
    },
    activate: function () {
      updateMenuParams(this);
    },
    /*
    select: function () {
      if (this.select){
        //this.children["pad"].strokeColor = "chartreuse";
        //select = false;
        e256_selector(this.children["pad"], OVER_ON);
      }
      else {
        //this.children["pad"].strokeColor = "red";
        //select = true;
        e256_selector(this.children["pad"], OVER_ON);
     }
     //return select;
    },
    */
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        if (this.select) {
          // Nothing to do!
        } else {
          e256_selector(this.children["frame"], OVER_ON);
          //updateMenuParams(this);
          //showMenuParams(this);
        }
      }
    },

    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        if (!select){
          //this.children["pad"].strokeWidth = OVER_OFF;
          e256_selector(this.children["pad"], OVER_OFF);
        }
        else {
          // Nothing to do!
        }
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            if (selectedPart.name === "pad") {
              switch (selectedSegment) {
                case 0: // Update left segment
                  this.children["pad"].segments[0].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[1].point.x = mouseEvent.point.x;
                  this.data.from[0] = Math.round(mouseEvent.point.x);
                  last_pad_width  = pad_width ;
                  pad_width  = this.bounds.right - mouseEvent.point.x;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[0].point.x = mouseEvent.point.x;
                    let newSize_x = ((this.bounds.right - this.children[i].children["line-y"].segments[0].point.x) * pad_width ) / last_pad_width ;
                    this.children[i].children["line-y"].position.x = this.bounds.right - newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.right - newSize_x;
                  }
                  break;
                case 1: // Update top segment
                  this.children["pad"].segments[1].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[2].point.y = mouseEvent.point.y;
                  this.data.from[1] = Math.round(mouseEvent.point.y);
                  lastHeight = pad_height;
                  pad_height = this.bounds.bottom - mouseEvent.point.y;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[0].point.y = mouseEvent.point.y;
                    let newSize_y = ((this.bounds.bottom - this.children[i].children["line-x"].segments[0].point.y) * pad_height) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.bottom - newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.bottom - newSize_y;
                  }
                  break;
                case 2: // Update right segment
                  this.children["pad"].segments[2].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[3].point.x = mouseEvent.point.x;
                  this.data.to[0] = Math.round(mouseEvent.point.x);
                  last_pad_width  = pad_width ;
                  pad_width  = mouseEvent.point.x - this.bounds.left;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[1].point.x = mouseEvent.point.x;
                    let newSize_x = ((this.children[i].children["line-y"].segments[0].point.x - this.bounds.left) * pad_width ) / last_pad_width ;
                    this.children[i].children["line-y"].position.x = this.bounds.left + newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.left + newSize_x;
                  }
                  break;
                case 3: // Update bottom segment
                  this.children["pad"].segments[3].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[0].point.y = mouseEvent.point.y;
                  this.data.to[1] = Math.round(mouseEvent.point.y);
                  lastHeight = pad_height;
                  pad_height = mouseEvent.point.y - this.bounds.top;
                  for (let i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[1].point.y = mouseEvent.point.y;
                    let newSize_y = ((this.children[i].children["line-x"].segments[0].point.y - this.bounds.top) * pad_height) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.top + newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.top + newSize_y;
                  }
                  break;
              }
              break;
            }
        }
        updateMenuParams(this);
      }
      else if (e256_current_mode === PLAY_MODE) {
        if (selectedPart.name === "circle") {
          if (mouseEvent.point.x > this.children["pad"].bounds.left &&
            mouseEvent.point.x < this.children["pad"].bounds.right &&
            mouseEvent.point.y > this.children["pad"].bounds.top &&
            mouseEvent.point.y < this.children["pad"].bounds.bottom) {
            selected_item.children["line-x"].position.y = mouseEvent.point.y;
            selected_item.children["line-y"].position.x = mouseEvent.point.x;
            selected_item.children["circle"].position = mouseEvent.point;
            selected_item.data.value[0] = Math.round(mapp(mouseEvent.point.x, this.data.from[0], this.data.to[0], this.data.min, this.data.max));
            //if (MIDI_device_connected) sendControlChange(selected_item.data.Xcc, selected_item.data.value[0], selected_item.data.x_chan);
            selected_item.data.value[1] = Math.round(mapp(mouseEvent.point.y, this.data.from[1], this.data.to[1], this.data.max, this.data.min));
            //if (MIDI_device_connected) sendControlChange(selected_item.data.Ycc, selected_item.data.value[1], selected_item.data.y_chan);
            updateMenuParams(selected_item);
          }
        }
      }
    }
  });
  return _Touchpad;
};

/////////// TRIGGER Factory
function triggerFactory() {
  var trigger_default_size = 80;
  var trigger_min_size = 40;
  var trigger_radius = trigger_default_size;
  
  var select = false;

  var _Trigger = new paper.Group({
    data: {
      type: "trigger",
      from: [null, null],
      to: [null, null],
      value: null,
      chan: null,
      note: null,
      velocity: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = trigger_default_size / 2;
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
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "skyblue",
      });
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(circleCenterX, circleCenterY),
        radius: sizeX / 2.5,
        fillColor: "yellow"
      });
      this.addChild(_square);
      this.addChild(_circle);
    },
    activate: function () {
      if (selectedPart.name === "circle") {
        this.children["circle"].fillColor = "lawngreen";
        this.data.value = this.data.note;
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velocity, this.data.chan);
        updateMenuParams(this);
        setTimeout(this.triggerOff, 300, this);
      }
    },

    onMouseEnter: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (!select) {
          e256_selector(this.children["square"], MOUSE_OVER);
          showMenuParams(this);
          console.log("EVENT_ID: " + mouseEvent.currentTarget.index);
          console.log("EVENT_NAME: " + mouseEvent);
        } else {
          // NA
        }
      }
    },

    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        if (!select) {
          e256_selector(this.children["square"], MOUSE_LEAVE);
        } else {
        }
      }
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            if (selectedPart.name === "square") {
              let trigger_radius_x = (this.bounds.right - this.bounds.left) / 2;
              let trigger_radius_y = (this.bounds.bottom - this.bounds.top) / 2;
              trigger_radius = trigger_radius_x;
              let trigger_center_x = this.bounds.left + trigger_radius_x;
              let trigger_center_y = this.bounds.top + trigger_radius_y;
              let x = mouseEvent.point.x - trigger_center_x;
              let y = mouseEvent.point.y - trigger_center_y;
              let last_trigger_radius = trigger_radius;
              trigger_radius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              if (trigger_radius > trigger_min_size){ 
                this.scale(trigger_radius / last_trigger_radius);
                this.data.from[0] = Math.round(this.children["square"].bounds.left);
                this.data.from[1] = Math.round(this.children["square"].bounds.top);
                this.data.to[0] = Math.round(this.children["square"].bounds.right);
                this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
              }
            }
            else if (selectedPart.name === "circle") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        updateMenuParams(this);
      }
    },
    triggerOff: function (item) {
      item.children["circle"].fillColor = "yellow";
      item.data.value = 0;
      if (MIDI_device_connected) sendNoteOff(item.data.note, 0, item.data.chan);
      updateMenuParams(item);
    }
  });
  return _Trigger;
};

/////////// SWITCH Factory
function switchFactory() {
  var defaulSize = 80;
  var _Switch = new paper.Group({
    data: {
      type: "switch",
      from: [null, null],
      to: [null, null],
      value: true,
      chan: null,
      note: null,
      velocity: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = defaulSize / 2
      this.data.from[1] = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to[1] = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setupFromConfig: function (params) {
      this.data.from[1] = params.from;
      this.data.to[1] = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velocity = params.velocity;
    },
    create: function () {
      let _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from[1],
        to: this.data.to[1],
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "yellow"
      });
      let _line_a = new paper.Path.Line({
        name: "cross_line_x",
        from: new paper.Point(this.data.from[0], this.data.from[1]),
        to: new paper.Point(this.data.to[0], this.data.to[1]),
        strokeWidth: 1,
        strokeColor: "black"
      });
      let _line_b = new paper.Path.Line({
        name: "cross_line_y",
        from: new paper.Point(this.data.from[0], this.data.to[1]),
        to: new paper.Point(this.data.to[0], this.data.from[1]),
        strokeWidth: 1,
        strokeColor: "black"
      });
      this.addChild(_square);
      this.addChild(_line_a);
      this.addChild(_line_b);
    },
    activate: function () {
      this.data.value = !this.data.value;
      if (this.data.value) {
        this.children["cross_line_x"].visible = true;
        this.children["cross_line_y"].visible = true;
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velocity, this.data.chan);
      } else {
        this.children["cross_line_x"].visible = false;
        this.children["cross_line_y"].visible = false;
        if (MIDI_device_connected) sendNoteOff(this.data.note, 0, this.data.chan);
      }
      updateMenuParams(this);
    },
    select: function () {
      this.children["square"].opacity = 1;
      updateMenuParams(this);
    },
    free: function () {
      this.children["square"].opacity = 0;
    },
    onMouseEnter: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          this.select();
          break;
        case PLAY_MODE:
          //
          break;
      }
      showMenuParams(this);
      updateMenuParams(this);
    },
    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            if (selectedPart.name === "square") {
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
            else if (selectedPart.name === "line") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        updateMenuParams(this);
      }
    }
  });
  return _Switch;
};

/////////// SLIDER Factory
function sliderFactory() {
  var slider_default_width = 50;
  var slider_default_height = 400;
  var slider_min_width = 45;
  var slider_min_height = 100;
  var slider_last_val = null; // Is it Global !?
  var slider_dir = V_SLIDER;

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
      this.data.from = [Math.round(mouseEvent.point.x - (slider_default_width / 2)), Math.round(mouseEvent.point.y - (slider_default_height / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (slider_default_width / 2)), Math.round(mouseEvent.point.y + (slider_default_height / 2))];
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
        from: this.data.from,
        to: this.data.to,
        //selected: true,
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "azure"
      });
      this.addChild(_rect);
      var _handle = new paper.Path.Line({
        name: "handle",
        from: new paper.Point(this.data.from[0], this.data.from[1] + (slider_default_height / 2)),
        to: new paper.Point(this.data.to[0], this.data.from[1] + (slider_default_height / 2)),
        strokeWidth: 30,
        strokeCap: "round",
        strokeColor: "lightslategray"
      });
      this.addChild(_handle);
    },
    activate: function (mouseEvent) {
      // tis is call only when cliking on TUI! -> MOVE IT TO onMouseDown!!
      console.log("SLIDER_ACTIVATE");
      /*
      switch (slider_dir) {
        case H_SLIDER:
          this.data.value = Math.round(mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.max, this.data.min));
          this.children["handle"].position.x = mouseEvent.point.x;
          break;
        case V_SLIDER:
          this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
          this.children["handle"].position.y = mouseEvent.point.y;
        break;
      }
      updateMenuParams(this);
      */
    },
    select: function () {
      this.children["rect"].opacity = 1;
      updateMenuParams(this);
    },
    free: function () {
      this.children["rect"].opacity = 0;
    },
    onMouseEnter: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          this.select();
          this.children["rect"].selected = true;
          break;
        case PLAY_MODE:
          //
          break;
      }
      showMenuParams(this);
      updateMenuParams(this);
    },
    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        //this.free();
        this.selected = false;
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            switch (selectedPart.name) {
              case "rect":
                if (this.bounds.width > this.bounds.height) {
                  slider_dir = H_SLIDER;
                } else {
                  slider_dir = V_SLIDER;
                }
                switch (selectedSegment) {
                  case 0: // Update left segment
                    if ( mouseEvent.point.x > this.bounds.right - slider_min_width) {
                    }
                    else {
                      this.data.from[0] = Math.round(this.bounds.left);
                      this.children["rect"].segments[0].point.x = mouseEvent.point.x;
                      this.children["rect"].segments[1].point.x = mouseEvent.point.x;
                      switch (slider_dir) {
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
                    if (mouseEvent.point.y > this.bounds.bottom - slider_min_height) {
                    }
                    else {
                      this.data.from[1] = Math.round(this.bounds.top);
                      this.children["rect"].segments[1].point.y = mouseEvent.point.y;
                      this.children["rect"].segments[2].point.y = mouseEvent.point.y;
                      switch (slider_dir) {
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
                    if ( mouseEvent.point.x < this.bounds.left + slider_min_width) {
                    }
                    else {
                      this.data.to[0] = Math.round(this.bounds.right);
                      this.children["rect"].segments[2].point.x = mouseEvent.point.x;
                      this.children["rect"].segments[3].point.x = mouseEvent.point.x;
                      switch (slider_dir) {
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
                    if ( mouseEvent.point.y < this.bounds.top + slider_min_height) {
                    }
                    else {
                      this.data.to[1] = Math.round(this.bounds.bottom);
                      this.children["rect"].segments[0].point.y = mouseEvent.point.y;
                      this.children["rect"].segments[3].point.y = mouseEvent.point.y;
                      switch (slider_dir) {
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
                  default:
                    console.log("REST : " + selectedPath);
                    break;

                }
                updateMenuParams(this);
                break;
              case "handle":
                console.log("PINGGGGGG");
                moveItem(this, mouseEvent);
                break;
            }
        }
        updateMenuParams(this);
      }
    },
    onMouseMove: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          break;
        case PLAY_MODE:
          switch (slider_dir) {
            case V_SLIDER:
              if (mouseEvent.point.y > this.bounds.top && mouseEvent.point.y < this.bounds.bottom) {
                this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min));
                this.children["handle"].position.y = mouseEvent.point.y;
              }
              break;
            case H_SLIDER:
              if (mouseEvent.point.x > this.bounds.left && mouseEvent.point.x < this.bounds.right) {
                this.data.value = Math.round(mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.min, this.data.max));
                this.children["handle"].position.x = mouseEvent.point.x;
              }
              break;
          }
          if (this.data.value != slider_last_val) {
            slider_last_val = this.data.value;
            if (MIDI_device_connected) sendControlChange(this.data.cc, this.data.value, this.data.chan);
            updateMenuParams(this);
          }
          break;
      }
    },
    onMouseUp: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          break;
        case PLAY_MODE:
          break;
      }
    }
  });
  return _Slider;
};

/////////// KNOB Factory
function knobFactory() {
  var knob_default_stroke_width = 10;
  var knob_default_radius = 150;
  var knob_default_offet = 90;
  var knob_last_offset = 0;
  var knob_last_radius_val = 0;
  var knob_last_theta_val = 0;

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
      this.data.radius = knob_default_radius;
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
      var headPos = pol_to_cart(this.data.radius - knob_default_stroke_width, deg_to_rad(knob_default_offet));
      var footPos = pol_to_cart(this.data.radius - knob_default_stroke_width * 2, deg_to_rad(knob_default_offet));
      var handlePos = pol_to_cart(this.data.radius + knob_default_stroke_width, deg_to_rad(knob_default_offet));
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(this.data.center[0], this.data.center[1]),
        radius: this.data.radius,
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "springGreen"
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
      if (e256_current_mode === PLAY_MODE) {
        var x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        var y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        headPos = pol_to_cart(polar.radius, polar.theta);
        footPos = pol_to_cart(polar.radius, polar.theta);
        this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);
        knob_last_radius_val = this.data.radius;
        this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
        if (MIDI_device_connected && this.data.radius != knob_last_radius_val) {
          sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
        }
        knob_last_theta_val = this.data.theta_val;
        var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
        this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
        if (MIDI_device_connected && this.data.theta_val != knob_last_theta_val) {
          sendControlChange(this.data.tCc, this.data.theta_val, this.data.tChan);
        }
      }
    },
    select: function () {
      this.children["circle"].opacity = 1;
      updateMenuParams(this);
    },
    free: function () {
      this.children["circle"].opacity = 0;
    },
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.select();
      }
      showMenuParams(this);
    },
    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            if (selectedPart.name === "handle") {
              let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
              let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
              knob_last_offset = this.data.offset;
              this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              let delta = this.data.offset - knob_last_offset;
              this.children["handle"].rotate(delta, new paper.Point(this.data.center[0], this.data.center[1]));
            } else {
              //moveItem(this, mouseEvent);
              this.translate(mouseEvent.delta);
              this.data.center[0] += Math.round(mouseEvent.delta.x);
              this.data.center[1] += Math.round(mouseEvent.delta.y);
            }
            break;
          case "stroke":
            switch (selectedPart.name) {
              case "circle":
                let x = mouseEvent.point.x - this.data.center[0];
                let y = mouseEvent.point.y - this.data.center[1];
                let polar = cart_to_pol(x, y);
                this.scale(polar.radius / this.data.radius);
                this.data.radius = Math.round(polar.radius); // FIXME!
                console.log("RADIUS : " + Math.round(polar.radius));
                break;
              case "needle-head" || "needle-foot":
                //moveItem(this, mouseEvent);
                this.translate(mouseEvent.delta);
                this.data.center[0] += Math.round(mouseEvent.delta.x);
                this.data.center[1] += Math.round(mouseEvent.delta.y);
                break;
            }
        }
        updateMenuParams(this);
      }
      else if (e256_current_mode === PLAY_MODE) {
        let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        let polar = cart_to_pol(x, y);
        let headPos;
        let footPos;
        if (polar.radius > this.data.radius) {
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(this.data.radius, polar.theta);
          footPos = pol_to_cart(this.data.radius, polar.theta);
        } else {
          knob_last_radius_val = this.data.radius;
          this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          knob_last_theta_val = this.data.theta_val;
          this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(polar.radius, polar.theta);
          footPos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        updateMenuParams(this);

        // SEND MIDI CONTROL_CHANGE
        if (MIDI_device_connected && this.data.theta_val != knob_last_theta_val) {
          sendControlChange(this.data.tCc, this.data.theta_val, this.data.tChan);
        }
        if (MIDI_device_connected && this.data.radius_val != knob_last_radius_val) {
          sendControlChange(this.data.rCc, this.data.radius_val, this.data.rChan);
        }
      }
    }
  });
  return _Knob;
};

/////////// PATH Factory
// http://paperjs.org/reference/path/#path
function pathFactory() {
  var path_default_stroke_width = 20;

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
        strokeWidth: path_default_stroke_width,
        strokeColor: new paper.Color(0.7, 0, 0.5),
        //selected: true,
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
    activate: function () {
      this.children[0].selected = true;
    },
    select: function () {
      this.children["rect"].opacity = 1;
      updateMenuParams(this);
    },
    free: function () {
      this.children["rect"].opacity = 0;
    },
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.select();
      }
      showMenuParams(this);
    },
    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (selectedSegment) {
          this.children["path"].segments[selectedSegment].point.x = mouseEvent.point.x;
          this.children["path"].segments[selectedSegment].point.y = mouseEvent.point.y;
          this.data.segments[selectedSegment][0] = Math.round(mouseEvent.point.x);
          this.data.segments[selectedSegment][1] = Math.round(mouseEvent.point.y);
          updateMenuParams(this);
        }
      }
      else if (e256_current_mode === PLAY_MODE) {
        // TODO!
      }
    }
  });
  return _Path;
};

/////////// POLYGON Factory
function polygonFactory() {
  // TODO
};
