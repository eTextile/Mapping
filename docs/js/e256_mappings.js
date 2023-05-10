/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/


/////////// GRID Factory
function gridFactory() {

  const DEFAULT_MODE = "trigger";
  const DEFAULT_GRID_WIDTH = 400;
  const DEFAULT_GRID_HEIGHT = 400;
  const DEFAULT_GRID_COLS = 16;
  const DEFAULT_GRID_ROWS = 16;
  const GRID_MIN_SIZE = 300;

  var frame_width  = null;
  var frame_height = null;
  var half_frame_width = null;
  var half_frame_height = null;
  var key_width = null;
  var key_height = null;
  var half_key_width = null;
  var half_key_height = null;
  var current_mode = null; 

  var highlight_item = null;

  //var frame_offset = 5;

  var _Grid = new paper.Group({
    name: "Grid",
    uid: null,
    from: null,
    to: null,
    cols: null,
    rows: null,
    mode: null,

    setup_from_mouse_event: function (mouseEvent) {
      frame_width = DEFAULT_GRID_WIDTH;
      frame_height = DEFAULT_GRID_HEIGHT;
      key_width = frame_width / DEFAULT_GRID_COLS;
      key_height = frame_height / DEFAULT_GRID_ROWS;
      half_frame_width = frame_width / 2;
      half_frame_height = frame_height / 2;
      half_key_width = key_width / 2;
      half_key_height = key_height / 2;

      this.mode = DEFAULT_MODE;
      this.cols = DEFAULT_GRID_COLS;
      this.rows = DEFAULT_GRID_ROWS;
      this.from = new paper.Point(Math.round(mouseEvent.point.x - (half_frame_width)), Math.round(mouseEvent.point.y - (half_frame_height)));
      this.to = new paper.Point(Math.round(mouseEvent.point.x + (half_frame_width)), Math.round(mouseEvent.point.y + (half_frame_height)));
    },

    setup_from_config: function (params) {
      this.mode = params.mode;
      this.cols = params.cols;
      this.rows = params.rows;
      this.from = new paper.Point(params.from);
      this.to = new paper.Point(params.to);
      
      frame_width = this.to.x - this.from.x;
      frame_height = this.to.y - this.from.y;
      key_width = frame_width / this.cols;
      key_height = frame_height / this.rows;
      half_frame_width = frame_width / 2;
      half_frame_height = frame_height / 2;
      half_key_width = key_width / 2;
      half_key_height = key_height / 2;

      // TODO: keys setup!

    },

    new_key: function (index_y, index_x) {
      var _Key = new paper.Group({
        name: "Key",
        uid: index_y * this.cols + index_x,
        data: {
          chan: 1,
          note: 0,
          velo: 127,
          form_style: {
            chan: "form-select",
            note: "form-select",
            velo: "form-select"
          }
        }
      });
      var _rect = new paper.Path.Rectangle({
        name: "key-rect",
        from: new paper.Point(this.from.x + index_x * key_width, this.from.y + index_y * key_height),
        to: new paper.Point(this.from.x + index_x * key_width + key_width, this.from.y + (index_y * key_height) + key_height)
      });
      _rect.style = {
        fillColor: "pink",
        strokeColor: "black",
        strokeWidth: 0.2
      };
      _Key.addChild(_rect);
      var _txt = new paper.PointText({
        name: "key-txt",
        point: new paper.Point(_Key.children["key-rect"].position), 
        content: _Key.data.note,
        locked: true
      });
      _txt.style = {
        fillColor: "black"
      };
      _Key.addChild(_txt);
      return _Key;
    },

    create: function () {
      var _frame = new paper.Path.Rectangle({
        name: "grid-frame",
        from: new paper.Point(this.from),
        to: new paper.Point(this.to),
      });
      _frame.style = {
        strokeColor: "lightGreen",
        strokeWidth: 15,
        fillColor: "white"
      };
      _frame.data = {
        mode: this.mode,
        from: this.from,
        to: this.to,
        cols: this.cols,
        rows: this.rows,
        aftertouch: "OFF",
        velocity: "OFF",
        form_style: {
          from: "form-control",
          to: "form-control",
          cols: "form-select",
          rows: "form-select",
          mode: "form-select",
          aftertouch: "form-toggle",
          velocity: "form-toggle"
        }
      };
      this.addChild(_frame);
      var _keys = new paper.Group({
        name: "grid-keys",
      });
      for (let index_y = 0; index_y < this.rows; index_y++) {
        for (let index_x = 0; index_x < this.cols; index_x++) {
          _keys.addChild(this.new_key(index_y, index_x));
        }
      }
      this.addChild(_keys);
      last_select = this;
      select = this;
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        stroke: true,
        bounds: true,
        fill: false,
        tolerance: 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);
      
      if (tmp_select) {
        if (tmp_select.item.name  === "grid-frame" || tmp_select.item.name === "key-rect") {
          highlight_item = tmp_select.item.parent;
        }
        else {
          highlight_item = tmp_select.item;
        }
      }
      else {
        return;
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
      if (highlight_item) {
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
      }
    },

    onMouseDown: function (mouseEvent) {
  
      this.bringToFront(this);

      var mouse_down_options = {
        stroke: false,
        bounds: true,
        fill: true,
        tolerance: 8
      }
      
      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      if (tmp_select){
        last_item = current_item;
        last_part = current_part;
        if (tmp_select.item.name  === "grid-frame" || tmp_select.item.name === "key-rect") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select.item;
        }
        else {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        last_controleur = current_controleur;
        current_controleur = this;
      }

      switch (e256_current_mode) {
        case EDIT_MODE:
         if (!last_part) return;
          switch (current_item.name) {
            case "Grid":
              switch (last_item.name) {
                case "Grid":
                  // NA
                  break;
                case "Key":
                  last_item.children["key-rect"].style.fillColor = "pink";
                  this.children["grid-frame"].style.strokeColor = "orange";
                  break;
                default:
                  break;
              }
              break;
            case "Key":
              switch (last_item.name) {
                case "Grid":
                  this.children["grid-frame"].style.strokeColor = "lightGreen";
                  current_item.children["key-rect"].style.fillColor = "orange";
                  break;
                case "Key":
                  last_item.children["key-rect"].style.fillColor = "pink";
                  current_item.children["key-rect"].style.fillColor = "orange";
                  break;
                default:
                  break;
              }
              break;
            default:
              console.log("TYPE_NOT_USE: " + current_item.name);
              break;
          }
          break;
        case PLAY_MODE:
          // TODO
          break;
      }
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          switch (current_part.type) {
            case "fill":
              //moveItem(this, mouseEvent);
              break;
            case "bounds":
              switch (current_item.name) {
                case "Grid":
                  switch (current_part.name) {
                    case "top-left":
                      frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                      if (frame_width > GRID_MIN_SIZE){ // TODO: Point.min(point1, point2) to avoid limits
                        key_width = frame_width / this.cols;
                        half_key_width = key_width / 2;
                        this.children["grid-frame"].segments[0].point.x = mouseEvent.point.x;
                        this.children["grid-frame"].segments[1].point.x = mouseEvent.point.x;
                      }
                      frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                      if (frame_height > GRID_MIN_SIZE){
                        key_height = frame_height / this.rows;
                        half_key_height = key_height / 2;
                        this.children["grid-frame"].segments[1].point.y = mouseEvent.point.y;
                        this.children["grid-frame"].segments[2].point.y = mouseEvent.point.y;
                      }
                      for (let pos_y = 0; pos_y < this.rows; pos_y++) {
                        let row_index = pos_y * this.cols;
                        let newPos_y = this.children["grid-frame"].bounds.bottom - (this.rows - pos_y) * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.cols; pos_x++) {
                          let index = row_index + pos_x;
                          let newPos_x = this.children["grid-frame"].bounds.right - (this.cols - pos_x) * key_width + half_key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-rect"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-txt"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-txt"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.width = key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.children["grid-frame"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                      break;

                    case "top-right":
                      frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                      if (frame_width > GRID_MIN_SIZE){
                        key_width = frame_width / this.cols;
                        half_key_width = key_width / 2;
                        this.children["grid-frame"].segments[2].point.x = mouseEvent.point.x;
                        this.children["grid-frame"].segments[3].point.x = mouseEvent.point.x;
                      }
                      frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                      if (frame_height > GRID_MIN_SIZE){
                        key_height = frame_height / this.rows;
                        half_key_height = key_height / 2;
                        this.children["grid-frame"].segments[1].point.y = mouseEvent.point.y;
                        this.children["grid-frame"].segments[2].point.y = mouseEvent.point.y;
                      }
                      for (let pos_y = 0; pos_y < this.rows; pos_y++) {
                        let row_index = pos_y * this.cols;
                        let newPos_y = this.children["grid-frame"].bounds.bottom - (this.rows - pos_y) * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.cols; pos_x++) {
                          let index = row_index + pos_x;
                          let newPos_x = this.children["grid-frame"].bounds.left + pos_x * key_width + half_key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-rect"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-txt"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-txt"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.width = key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.children["grid-frame"].data.from.y = Math.round(mouseEvent.point.y);
                      this.children["grid-frame"].data.to.x = Math.round(mouseEvent.point.x);
                      break;

                    case "bottom-right":
                      frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                      if (frame_width > GRID_MIN_SIZE){
                        key_width = frame_width / this.cols;
                        half_key_width = key_width / 2;
                        this.children["grid-frame"].segments[2].point.x = mouseEvent.point.x;
                        this.children["grid-frame"].segments[3].point.x = mouseEvent.point.x;
                      }
                      frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                      if (frame_height > GRID_MIN_SIZE){
                        key_height = frame_height / this.rows;
                        half_key_height = key_height / 2;
                        this.children["grid-frame"].segments[3].point.y = mouseEvent.point.y;
                        this.children["grid-frame"].segments[0].point.y = mouseEvent.point.y;
                      }
                      for (let pos_y = 0; pos_y < this.rows; pos_y++) {
                        let row_index = pos_y * this.cols;
                        let newPos_y = this.children["grid-frame"].bounds.top + pos_y * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.cols; pos_x++) {
                          let index = row_index + pos_x;
                          let newPos_x = this.children["grid-frame"].bounds.left + pos_x * key_width + half_key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-rect"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-txt"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-txt"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.width = key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.children["grid-frame"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                      break;

                    case "bottom-left":
                      frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                      if (frame_width > GRID_MIN_SIZE){
                        key_width = frame_width / this.cols;
                        half_key_width = key_width / 2;
                        this.children["grid-frame"].segments[0].point.x = mouseEvent.point.x;
                        this.children["grid-frame"].segments[1].point.x = mouseEvent.point.x;
                      }
                      frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                      if (frame_height > GRID_MIN_SIZE){
                        key_height = frame_height / this.rows;
                        half_key_height = key_height / 2;
                        this.children["grid-frame"].segments[3].point.y = mouseEvent.point.y;
                        this.children["grid-frame"].segments[0].point.y = mouseEvent.point.y;
                      }
                      for (let pos_y = 0; pos_y < this.rows; pos_y++) {
                        let row_index = pos_y * this.cols;
                        let newPos_y = this.children["grid-frame"].bounds.top + pos_y * key_height + half_key_height;
                        for (let pos_x = 0; pos_x < this.cols; pos_x++) {
                          let index = row_index + pos_x;
                          let newPos_x = this.children["grid-frame"].bounds.right - (this.cols - pos_x) * key_width + half_key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-rect"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-txt"].position.x = newPos_x;
                          this.children["grid-keys"].children[index].children["key-txt"].position.y = newPos_y;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.width = key_width;
                          this.children["grid-keys"].children[index].children["key-rect"].bounds.height = key_height;
                        }
                      }
                      this.children["grid-frame"].data.from.x = Math.round(mouseEvent.point.x);
                      this.children["grid-frame"].data.to.y = Math.round(mouseEvent.point.y);
                      break;
                    default:
                      console.log("PART_NOT_USE: " + current_part.name);
                      break;
                  }
                case "Key":
                  //moveItem(this, mouseEvent);
                  break;
              }
              break;
            default:
              console.log("TYPE_NOT_USE: " + current_part.type);
              break;
          }
          break;
        case PLAY_MODE:
          //TODO
          break;
      }
      update_menu_params(this);
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
      from: Point(null, null),
      to: Point(null, null),
      touchs: 3,
      min: 0,
      max: 127
    },
    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = Point(Math.round(mouseEvent.point.x - (pad_default_width / 2)), Math.round(mouseEvent.point.y - (pad_default_height / 2)));
      this.data.to = Point(Math.round(mouseEvent.point.x + (pad_default_width / 2)), Math.round(mouseEvent.point.y + (pad_default_height / 2)));
    },
    setup_from_config: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.to = params.touchs;
      this.data.min = params.min;
      this.data.max = params.max;
    },
    
    update_from_params: function () {
      //if (this.data.touchs != last_touchs_count){}
      this.removeChildren(0);
      this.create_item();
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
            getRandomInt(this.data.from.x + margin, this.data.to.x - margin),
            getRandomInt(this.data.from.y + margin, this.data.to.y - margin)
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
        from: new paper.Point(this.data.from.x, _Touch.data.value[1]),
        to: new paper.Point(this.data.to.x, _Touch.data.value[1]),
        strokeColor: "black",
        strokeWidth: 1
      });
      var _line_y = new paper.Path.Line({
        name: "line-y",
        from: new paper.Point(_Touch.data.value[0], this.data.from.y),
        to: new paper.Point(_Touch.data.value[0], this.data.to.y),
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
      update_menu_params(this);
    },
    /*
    select: function () {
      if (this.select){
        //this.children["pad"].strokeColor = "chartreuse";
        //select = false;
        e256_select(this.children["pad"], OVER_ON);
      }
      else {
        //this.children["pad"].strokeColor = "red";
        //select = true;
        e256_select(this.children["pad"], OVER_ON);
     }
     //return select;
    },
    */
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        if (this.select) {
          // Nothing to do!
        } else {
          e256_select(this.children["frame"], OVER_ON);
          //update_menu_params(this);
          //show_item_menu_params(this);
        }
      }
    },

    onMouseLeave: function(){
      if (e256_current_mode === EDIT_MODE) {
        if (!select){
          //this.children["pad"].strokeWidth = OVER_OFF;
          e256_select(this.children["pad"], OVER_OFF);
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
                  this.data.from.x = Math.round(mouseEvent.point.x);
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
                  this.data.from.y = Math.round(mouseEvent.point.y);
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
                  this.data.to.x = Math.round(mouseEvent.point.x);
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
                  this.data.to.y = Math.round(mouseEvent.point.y);
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
        update_menu_params(this);
      }
      else if (e256_current_mode === PLAY_MODE) {
        if (selectedPart.name === "circle") {
          if (mouseEvent.point.x > this.children["pad"].bounds.left &&
            mouseEvent.point.x < this.children["pad"].bounds.right &&
            mouseEvent.point.y > this.children["pad"].bounds.top &&
            mouseEvent.point.y < this.children["pad"].bounds.bottom) {
            select.children["line-x"].position.y = mouseEvent.point.y;
            select.children["line-y"].position.x = mouseEvent.point.x;
            select.children["circle"].position = mouseEvent.point;
            select.data.value[0] = Math.round(mapp(mouseEvent.point.x, this.data.from.x, this.data.to.x, this.data.min, this.data.max));
            //if (MIDI_device_connected) sendControlChange(select.data.Xcc, select.data.value[0], select.data.x_chan);
            select.data.value[1] = Math.round(mapp(mouseEvent.point.y, this.data.from.y, this.data.to.y, this.data.max, this.data.min));
            //if (MIDI_device_connected) sendControlChange(select.data.Ycc, select.data.value[1], select.data.y_chan);
            update_menu_params(select);
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
      velo: null
    },
    setup_from_mouse_event: function (mouseEvent) {
      let halfSize = trigger_default_size / 2;
      this.data.from = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setup_from_config: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velo = params.velo;
    },
    create: function () {
      var sizeX = this.data.to.x - this.data.from.x;
      var sizeY = this.data.to.y - this.data.from.y;
      var circleCenterX = this.data.to.x - (sizeX / 2);
      var circleCenterY = this.data.to.y - (sizeY / 2);
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
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velo, this.data.chan);
        update_menu_params(this);
        setTimeout(this.triggerOff, 300, this);
      }
    },

    onMouseEnter: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (!select) {
          e256_select(this.children["square"], MOUSE_OVER);
          show_item_menu_params(this);
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
          e256_select(this.children["square"], MOUSE_LEAVE);
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
                this.data.from.x = Math.round(this.children["square"].bounds.left);
                this.data.from.y = Math.round(this.children["square"].bounds.top);
                this.data.to.x = Math.round(this.children["square"].bounds.right);
                this.data.to.y = Math.round(this.children["square"].bounds.bottom);
              }
            }
            else if (selectedPart.name === "circle") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        update_menu_params(this);
      }
    },
    triggerOff: function (item) {
      item.children["circle"].fillColor = "yellow";
      item.data.value = 0;
      if (MIDI_device_connected) sendNoteOff(item.data.note, 0, item.data.chan);
      update_menu_params(item);
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
      velo: null
    },
    setup_from_mouse_event: function (mouseEvent) {
      let halfSize = defaulSize / 2
      this.data.from.y = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to.y = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setup_from_config: function (params) {
      this.data.from.y = params.from;
      this.data.to.y = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velo = params.velo;
    },
    create: function () {
      let _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from.y,
        to: this.data.to.y,
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "yellow"
      });
      let _line_a = new paper.Path.Line({
        name: "cross_line_x",
        from: new paper.Point(this.data.from.x, this.data.from.y),
        to: new paper.Point(this.data.to.x, this.data.to.y),
        strokeWidth: 1,
        strokeColor: "black"
      });
      let _line_b = new paper.Path.Line({
        name: "cross_line_y",
        from: new paper.Point(this.data.from.x, this.data.to.y),
        to: new paper.Point(this.data.to.x, this.data.from.y),
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
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velo, this.data.chan);
      } else {
        this.children["cross_line_x"].visible = false;
        this.children["cross_line_y"].visible = false;
        if (MIDI_device_connected) sendNoteOff(this.data.note, 0, this.data.chan);
      }
      update_menu_params(this);
    },
    select: function () {
      this.children["square"].opacity = 1;
      update_menu_params(this);
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
      show_item_menu_params(this);
      update_menu_params(this);
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
              this.data.from.x = Math.round(this.children["square"].bounds.left);
              this.data.from.y = Math.round(this.children["square"].bounds.top);
              this.data.to.x = Math.round(this.children["square"].bounds.right);
              this.data.to.y = Math.round(this.children["square"].bounds.bottom);
            }
            else if (selectedPart.name === "line") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        update_menu_params(this);
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
    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (slider_default_width / 2)), Math.round(mouseEvent.point.y - (slider_default_height / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (slider_default_width / 2)), Math.round(mouseEvent.point.y + (slider_default_height / 2))];
    },

    setup_from_config: function (params) {
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
        from: new paper.Point(this.data.from.x, this.data.from.y + (slider_default_height / 2)),
        to: new paper.Point(this.data.to.x, this.data.from.y + (slider_default_height / 2)),
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
      update_menu_params(this);
      */
    },
    select: function () {
      this.children["rect"].opacity = 1;
      update_menu_params(this);
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
      show_item_menu_params(this);
      update_menu_params(this);
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
                      this.data.from.x = Math.round(this.bounds.left);
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
                      this.data.from.y = Math.round(this.bounds.top);
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
                      this.data.to.x = Math.round(this.bounds.right);
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
                      this.data.to.y = Math.round(this.bounds.bottom);
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
                update_menu_params(this);
                break;
              case "handle":
                moveItem(this, mouseEvent);
                break;
            }
        }
        update_menu_params(this);
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
            update_menu_params(this);
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
    setup_from_mouse_event: function (mouseEvent) {
      this.data.center[0] = Math.round(mouseEvent.point.x);
      this.data.center[1] = Math.round(mouseEvent.point.y);
      this.data.radius = knob_default_radius;
    },
    setup_from_config: function (params) {
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
      update_menu_params(this);
    },
    free: function () {
      this.children["circle"].opacity = 0;
    },
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.select();
      }
      show_item_menu_params(this);
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
        update_menu_params(this);
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

        update_menu_params(this);

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
    setup_from_mouse_event: function (mouseEvent) {
      this.data.segments.push([Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)]);
      //this.path.closed = true;
    },
    setup_from_config: function (params) {
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
      update_menu_params(this);
    },
    free: function () {
      this.children["rect"].opacity = 0;
    },
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.select();
      }
      show_item_menu_params(this);
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
          update_menu_params(this);
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
