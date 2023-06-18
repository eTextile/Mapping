/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// GRID Factory
function gridFactory() {
  const DEFAULT_GRID_WIDTH = 400;
  const DEFAULT_GRID_HEIGHT = 400;
  const DEFAULT_GRID_COLS = 16;
  const DEFAULT_GRID_ROWS = 16;
  const DEFAULT_GRID_VELOCITY = "OFF";
  const DEFAULT_GRID_AFTERTOUCH = "ON";
  const GRID_MIN_SIZE = 30;
  //const FRAME_OFFSET = 300;

  let frame_width = null;
  let frame_height = null;
  let key_width = null;
  let key_height = null;
  let half_key_width = null;
  let half_key_height = null;
  let highlight_item = null;
  let keys_count = null;
  let current_part = null;

  var _Grid = new paper.Group({
    name: "GRID",
    data: {
      from: null,
      to: null,
      cols: null,
      rows: null,
      mode: null,
      velocity: null,
      aftertouch: null,
      keys: [null] // TODO
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        Math.round(mouseEvent.point.x - (DEFAULT_GRID_WIDTH / 2)),
        Math.round(mouseEvent.point.y - (DEFAULT_GRID_HEIGHT / 2))
        );
      this.data.to = new paper.Point(
        Math.round(mouseEvent.point.x + (DEFAULT_GRID_WIDTH / 2)),
        Math.round(mouseEvent.point.y + (DEFAULT_GRID_HEIGHT / 2))
        );
      this.data.cols = DEFAULT_GRID_COLS;
      this.data.rows = DEFAULT_GRID_ROWS;
      this.data.mode = KEY_TRIGGER;
      this.data.velocity = DEFAULT_GRID_VELOCITY;
      this.data.aftertouch = DEFAULT_GRID_AFTERTOUCH;

      keys_count = DEFAULT_GRID_COLS * DEFAULT_GRID_ROWS;
      
      /*
      for (let index = 0; index<keys_count; index++){

        this.data.keys.push(key);
      }
      */
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from); // ["Point",13,22]
      this.data.to = new paper.Point(params.to); // ["Point",141,144]
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.mode = params.mode;
      this.data.velocity = params.velocity;
      this.data.aftertouch = params.aftertouch;
      // TODO: keys setup!
    },

    save_params: function () {
      this.data.from = this.children["grid-frame"].data.from;
      this.data.to = this.children["grid-frame"].data.to;
      this.data.cols = this.children["grid-frame"].data.cols;
      this.data.rows = this.children["grid-frame"].data.rows;
      this.data.mode = this.children["grid-frame"].data.mode;
      this.data.velocity = this.children["grid-frame"].data.velocity;
      this.data.aftertouch = this.children["grid-frame"].data.aftertouch;
      // TODO: save keys PARAMS!
      console.log("ITEM_PARAMS_SAVED: " + this.name);
    },

    new_key: function (index_y, index_x, key_w, key_h) {
      var _key = new paper.Group({
        name: "grid-key",
        index: index_y * this.data.cols + index_x, // FIXME!!
        pos: new paper.Point(index_x, index_y),
        from: new paper.Point(this.data.from.x + index_x * key_w, this.data.from.y + index_y * key_h),
        to: new paper.Point(this.data.from.x + index_x * key_w + key_w, this.data.from.y + (index_y * key_h) + key_h),
        data: {
          midi_note: {
            chan: 1,
            note: 3,
            velo:127
          },
          form_style: {
            chan: "form-select",
            note: "form-select", // "form-control"
            velo: "form-select" // "form-control"
          },
          form_select_params: {
            chan: MIDI_CHANNELS,
            note: MIDI_NOTES,
            velo: MIDI_VELOCITYS
          }
        }
      });
      var _rect = new paper.Path.Rectangle({
        name: "key-rect",
        from: _key.from,
        to: _key.to
      });
      _rect.style = {
        fillColor: "pink",
        strokeColor: "black",
        strokeWidth: 0.2
      };
      _key.addChild(_rect);
      var _txt = new paper.PointText({
        name: "key-text",
        point: new paper.Point(_rect.position),
        content: index_y * this.data.cols + index_x, //_key.index -> Do not work!?
        locked: true
      });
      _txt.style = {
        fillColor: "black"
      };
      _key.addChild(_txt);
      return _key;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;
      key_width = frame_width / this.data.cols;
      key_height = frame_height / this.data.rows;

      var _frame = new paper.Group({
        name: "grid-frame",
        data: {
          from: this.data.from,
          to: this.data.to,
          cols: this.data.cols,
          rows: this.data.rows,
          mode: this.data.mode,
          velocity: this.data.velocity,
          aftertouch: this.data.aftertouch,
          form_style: {
            from: "form-control",
            to: "form-control",
            cols: "form-control",
            rows: "form-control",
            mode: "form-select",
            aftertouch: "form-toggle",
            velocity: "form-toggle"
          },
          form_select_params: {
            mode: KEY_MODES
          }
        }
      });
      var _rect = new paper.Path.Rectangle({
        name: "frame-rect",
        from: new paper.Point(this.data.from),
        to: new paper.Point(this.data.to)
      });
      _rect.style = {
        strokeColor: "lightGreen",
        strokeWidth: 15
      };
      _frame.addChild(_rect);
      this.addChild(_frame);

      var _keys = new paper.Group({
        name: "grid-keys"
      });
      for (let index_y = 0; index_y < this.data.rows; index_y++) {
        for (let index_x = 0; index_x < this.data.cols; index_x++) {
          _keys.addChild(this.new_key(index_y, index_x, key_width, key_height));
        }
      }
      this.addChild(_keys);
      this.bringToFront();
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        stroke: true,
        bounds: true,
        fill: true,
        tolerance: 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);

      if (tmp_select) {
        if (tmp_select.item.name === "GRID") {
          highlight_item = tmp_select.item.firstChild;
        }
        else if (tmp_select.item.name === "grid-frame" || tmp_select.item.name === "grid-key"){
          highlight_item = tmp_select.item.firstChild;
        }
        else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "key-rect"){
          highlight_item = tmp_select.item;
        }
        else {
          console.log("NOT_USED: " + tmp_select.item.name);
          return;
        }
      }

      switch (e256_current_mode) {
        case EDIT_MODE:
          highlight_item.selected = true;
          break;
        case PLAY_MODE:
          console.log("PLAY_MODE: NOT IMPLEMENTED!");
          break;
        default:
          break;
      }
    },

    onMouseLeave: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          highlight_item.selected = false;
          break;
        case PLAY_MODE:
          break;
        default:
          break;
      }
    },

    onMouseDown: function (mouseEvent) {

      this.bringToFront();

      var mouse_down_options = {
        stroke: false,
        bounds: true,
        fill: true,
        tolerance: 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      if (tmp_select) {
        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "GRID") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "grid-frame" || tmp_select.item.name === "grid-key") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "key-rect") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select;
        }
        else {
          //console.log("NOT_USED : " + tmp_select.item.name);
        }
        //console.log("CTL_CUR: " + current_controleur.name);
        //onsole.log("CTL_PEV: " + previous_controleur.name);
        //console.log("ITEM_CUR: " + current_item.name);
        //console.log("ITEM_PEV: " + previous_item.name);
        //console.log("PART_CUR: " + current_part.name);
        //console.log("PART_PEV: " + previous_part.name);
        
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "grid-key" && previous_item.name === "grid-key") {
              previous_item.firstChild.style.fillColor = "pink";
              current_item.firstChild.style.fillColor = "orange";
            }
            else if (current_item.name === "grid-frame" && previous_item.name === "grid-key") {
              previous_item.firstChild.style.fillColor = "pink";
              current_item.firstChild.style.strokeColor = "orange";
            }
            else if (previous_item.name === "grid-frame" && current_item.name === "grid-key") {
              previous_item.firstChild.style.strokeColor = "lightGreen";
              current_item.firstChild.style.fillColor = "orange";
            }
            else {
              //console.log("NOT_USED - CUR: " + current_item.name + "- PREV - " + previous_item.name );
            }
            //update_menu_params(this);
            break;
          case PLAY_MODE:
            // TODO
            break;
        }
      }
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            moveItem(this, mouseEvent);
          }
          else if (current_part.type === "bounds") {
            let newPos = new paper.Point();
            if (current_item.name === "grid-frame") {
              switch (current_part.name) {
                case "top-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-frame"].children["frame-rect"].segments[0].point.x = mouseEvent.point.x;
                  this.children["grid-frame"].children["frame-rect"].segments[1].point = mouseEvent.point;
                  this.children["grid-frame"].children["frame-rect"].segments[2].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-frame"].children["frame-rect"].bounds.right - (this.data.cols - key.pos.x) * key_width + half_key_width;
                    newPos.y = this.children["grid-frame"].children["frame-rect"].bounds.bottom - (this.data.rows - key.pos.y) * key_height + half_key_height;
                    key.children["key-rect"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-rect"].bounds.width = key_width;
                    key.children["key-rect"].bounds.height = key_height;
                  }
                  this.children["grid-frame"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;

                case "top-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-frame"].children["frame-rect"].segments[1].point.y = mouseEvent.point.y;
                  this.children["grid-frame"].children["frame-rect"].segments[2].point = mouseEvent.point;
                  this.children["grid-frame"].children["frame-rect"].segments[3].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;this.children["grid-frame"].children["frame-rect"].segments[2].point.y = mouseEvent.point.y;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-frame"].children["frame-rect"].bounds.left + key.pos.x * key_width + half_key_width;
                    newPos.y = this.children["grid-frame"].children["frame-rect"].bounds.bottom - (this.data.rows - key.pos.y) * key_height + half_key_height;
                    key.children["key-rect"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-rect"].bounds.width = key_width;
                    key.children["key-rect"].bounds.height = key_height;
                  }
                  this.children["grid-frame"].data.from.y = Math.round(mouseEvent.point.y);
                  this.children["grid-frame"].data.to.x = Math.round(mouseEvent.point.x);
                  break;

                case "bottom-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-frame"].children["frame-rect"].segments[2].point.x = mouseEvent.point.x;
                  this.children["grid-frame"].children["frame-rect"].segments[3].point = mouseEvent.point;
                  this.children["grid-frame"].children["frame-rect"].segments[0].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-frame"].children["frame-rect"].bounds.left + key.pos.x * key_width + half_key_width;
                    newPos.y = this.children["grid-frame"].children["frame-rect"].bounds.top + key.pos.y * key_height + half_key_height;
                    key.children["key-rect"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-rect"].bounds.width = key_width;
                    key.children["key-rect"].bounds.height = key_height;
                  }
                  this.children["grid-frame"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;

                case "bottom-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-frame"].children["frame-rect"].segments[3].point.y = mouseEvent.point.y;
                  this.children["grid-frame"].children["frame-rect"].segments[0].point = mouseEvent.point;
                  this.children["grid-frame"].children["frame-rect"].segments[1].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-frame"].children["frame-rect"].bounds.right - (this.data.cols - key.pos.x) * key_width + half_key_width;
                    newPos.y = this.children["grid-frame"].children["frame-rect"].bounds.top + key.pos.y * key_height + half_key_height;
                    key.children["key-rect"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-rect"].bounds.width = key_width;
                    key.children["key-rect"].bounds.height = key_height;
                  }
                  this.children["grid-frame"].data.from.x = Math.round(mouseEvent.point.x);
                  this.children["grid-frame"].data.to.y = Math.round(mouseEvent.point.y);
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
          }
          update_menu_params(this);
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
  const DEFAULT_PAD_WIDTH = 400;
  const DEFAULT_PAD_HEIGHT = 400;
  const DEFAULT_PAD_TOUCHS = 3;
  const DEFAULT_PAD_MIN = 0;
  const DEFAULT_PAD_MAX = 127;
  const DEFAULT_PAD_SIZE_MIN = 30;
  const MARGIN = 35;

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;
  let highlight_item = null;
  let current_part = null;

  var _touchpad = new paper.Group({
    name: "TOUCHPAD",
    data: {
      from: null,
      to: null,
      touchs: null,
      min: null,
      max: null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        Math.round(mouseEvent.point.x - (DEFAULT_PAD_WIDTH / 2)),
        Math.round(mouseEvent.point.y - (DEFAULT_PAD_HEIGHT / 2))
        );
      this.data.to = new paper.Point(
        Math.round(mouseEvent.point.x + (DEFAULT_PAD_WIDTH / 2)),
        Math.round(mouseEvent.point.y + (DEFAULT_PAD_HEIGHT / 2))
        );
      this.data.touchs = DEFAULT_PAD_TOUCHS;
      this.data.min = DEFAULT_PAD_MIN;
      this.data.max = DEFAULT_PAD_MAX;
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.touchs = params.touchs;
      this.data.min = params.min;
      this.data.max = params.max;
    },

    save_params: function () {
      this.data.from = this.children["pad-frame"].data.from;
      this.data.to = this.children["pad-frame"].data.to;
      this.data.touchs = this.children["pad-frame"].data.touchs;
      this.data.min = this.children["pad-frame"].data.min;
      this.data.max = this.children["pad-frame"].data.max;
      // TODO: save touchs
      console.log("ITEM_PARAMS_SAVED: " + this.name);
    },

    newTouch: function (index) {
      var _touch = new paper.Group({
        name: "pad-touch",
        index: index,
        pos: new paper.Point(
          getRandomInt(this.data.from.x + MARGIN, this.data.to.x - MARGIN),
          getRandomInt(this.data.from.y + MARGIN, this.data.to.y - MARGIN)
        ),
        data: {
          midi_params: {
            x_chan: null,
            x_cc: null,
            y_chan: null,
            y_cc: null,
            z_chan: null,
            z_cc: null
          },
          form_style: {
            x_chan: "form-select",
            x_cc: "form-select",
            y_chan: "form-select",
            y_cc: "form-select",
            z_chan: "form-select",
            z_cc: "form-select"
          },
          form_select_params: {
            x_chan: MIDI_CHANNELS,
            x_cc: MIDI_CCHANGE,
            y_chan: MIDI_CHANNELS,
            y_cc: MIDI_CCHANGE,
            z_chan: MIDI_CHANNELS,
            z_cc: MIDI_CCHANGE
          }
        }
      });

      var _circle = new paper.Path.Circle({
        name: "touch-circle",
        center: new paper.Point(_touch.pos.x, _touch.pos.y),
        radius: 15
      });
      _circle.style = {
        fillColor: "green"
      };
      _touch.addChild(_circle);

      var _line_x = new paper.Path.Line({
        name: "touch-line-x",
        from: new paper.Point(this.data.from.x, _touch.pos.y),
        to: new paper.Point(this.data.to.x, _touch.pos.y),
        locked: true
      });
      _line_x.style = {
        strokeWidth: 1,
        strokeColor: "black"
      }
      _touch.addChild(_line_x);

      var _line_y = new paper.Path.Line({
        name: "touch-line-y",
        from: new paper.Point(_touch.pos.x, this.data.from.y),
        to: new paper.Point(_touch.pos.x, this.data.to.y),
        locked: true
      });
      _line_y.style = {
        strokeWidth: 1,
        strokeColor: "black"
      };
      _touch.addChild(_line_y);
      _touch.firstChild.bringToFront();
      return _touch;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;

      var _frame = new paper.Group({
        name: "pad-frame",
        data: {
          from: this.data.from,
          to: this.data.to,
          touchs: null,
          min: null,
          max: null,
          form_style: {
            from: "form-control",
            to: "form-control",
            touchs: "form-select",
            min: "form-select",
            max: "form-select"
          },
          form_select_params: {
            touchs: MIDI_CHANNELS,
            min: MIDI_NOTES,
            max: MIDI_NOTES
          }
        }
      });
      
      var _rect = new paper.Path.Rectangle({
        name: "frame-rect",
        from: this.data.from,
        to: this.data.to
      });
      _rect.style = {
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "pink"
      };
      _frame.addChild(_rect);
      this.addChild(_frame);

      var _touchs = new paper.Group({
        name: "pad-touchs"
      });
      for (let index = 0; index < this.data.touchs; index++) {
        _touchs.addChild(this.newTouch(index));
      }
      this.addChild(_touchs);
      this.bringToFront();
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        stroke: true,
        bounds: true,
        fill: true,
        tolerance: 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);

      if (tmp_select) {
        if (tmp_select.item.name === "TOUCHPAD") {
          highlight_item = tmp_select.item.firstChild;
        }
        else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "pad-touch"){
          highlight_item = tmp_select.item.firstChild;
        }
        else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "touch-circle"){
          highlight_item = tmp_select.item;
        }
        else {
          console.log("NOT_USED: " + tmp_select.item.name);
          return;
        }
      }
      switch (e256_current_mode) {
        case EDIT_MODE:
          highlight_item.selected = true;
          break;
        case PLAY_MODE:
          console.log("PLAY_MODE: NOT IMPLEMENTED!");
          break;
        default:
          break;
      }
    },
   
    onMouseLeave: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          highlight_item.selected = false;
          break;
        case PLAY_MODE:
          break;
        default:
          break;
      }
    },

    onMouseDown: function (mouseEvent) {

      this.bringToFront();

      var mouse_down_options = {
        stroke: false,
        bounds: true,
        fill: true,
        tolerance: 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      console.log(tmp_select.item.name);

      if (tmp_select) {
        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "TOUCHPAD") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "pad-touch") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "frame-rect" || tmp_select.item.name === "touch-circle") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select;
        }
        else {
          //console.log("NOT_USED : " + tmp_select.item.name);
        }
        //console.log("CTL_CUR: " + current_controleur.name);
        //onsole.log("CTL_PEV: " + previous_controleur.name);
        //console.log("ITEM_CUR: " + current_item.name);
        //console.log("ITEM_PEV: " + previous_item.name);
        //console.log("PART_CUR: " + current_part.type);
        //console.log("PART_PEV: " + previous_part.name);
        
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "grid-key" && previous_item.name === "grid-key") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.fillColor = "orange";
            }
            else if (current_item.name === "grid-frame" && previous_item.name === "grid-key") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.strokeColor = "orange";
            }
            else if (previous_item.name === "grid-frame" && current_item.name === "grid-key") {
              //previous_item.firstChild.style.strokeColor = "lightGreen";
              //current_item.firstChild.style.fillColor = "orange";
            }
            else {
              //console.log("NOT_USED - CUR: " + current_item.name + "- PREV - " + previous_item.name );
            }
            //update_menu_params(this);
            break;
          case PLAY_MODE:
            // TODO
            break;
        }
      }
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            moveItem(this, mouseEvent);
          }
          else if (current_part.type === "bounds") {
            let newSize = new paper.Point();
            let newPos = new paper.Point();
            if (current_item.name === "pad-frame") {
              switch (current_part.name) {
                case "top-left":
                  this.children["pad-frame"].children["frame-rect"].segments[0].point.x = mouseEvent.point.x;
                  this.children["pad-frame"].children["frame-rect"].segments[1].point = mouseEvent.point;
                  this.children["pad-frame"].children["frame-rect"].segments[2].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
                  for (const touch of this.children["pad-touchs"].children) {
                    touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-frame"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;
                case "top-right":
                  this.children["pad-frame"].children["frame-rect"].segments[1].point.y = mouseEvent.point.y;
                  this.children["pad-frame"].children["frame-rect"].segments[2].point = mouseEvent.point;
                  this.children["pad-frame"].children["frame-rect"].segments[3].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
                  for (const touch of this.children["pad-touchs"].children) {
                    touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-frame"].data.from.y = Math.round(mouseEvent.point.y);
                  this.children["pad-frame"].data.to.x = Math.round(mouseEvent.point.x);
                  break;
                case "bottom-right":
                  this.children["pad-frame"].children["frame-rect"].segments[2].point.x = mouseEvent.point.x;
                  this.children["pad-frame"].children["frame-rect"].segments[3].point = mouseEvent.point;
                  this.children["pad-frame"].children["frame-rect"].segments[0].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);
                  for (const touch of this.children["pad-touchs"].children) {
                    touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-frame"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;
                case "bottom-left":
                  this.children["pad-frame"].children["frame-rect"].segments[3].point.y = mouseEvent.point.y;
                  this.children["pad-frame"].children["frame-rect"].segments[0].point = mouseEvent.point;
                  this.children["pad-frame"].children["frame-rect"].segments[1].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);   
                  for (const touch of this.children["pad-touchs"].children) {
                    touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-frame"].data.from.x = Math.round(mouseEvent.point.x);
                  this.children["pad-frame"].data.to.y = Math.round(mouseEvent.point.y);
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
          }
          update_menu_params(this);
          break;
        case PLAY_MODE:
          //TODO
          break;
      }
    }
  });
  return _touchpad;
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

    onMouseLeave: function () {
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
              let previous_trigger_radius = trigger_radius;
              trigger_radius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              if (trigger_radius > trigger_min_size) {
                this.scale(trigger_radius / previous_trigger_radius);
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
    onMouseLeave: function () {
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
              var previous_switch_radius = switchRadius;
              var switchRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(switchRadius / previous_switch_radius);
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
  var previous_slider_val = null; // Is it Global !?
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
    onMouseLeave: function () {
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
                    if (mouseEvent.point.x > this.bounds.right - slider_min_width) {
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
                    if (mouseEvent.point.x < this.bounds.left + slider_min_width) {
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
                    if (mouseEvent.point.y < this.bounds.top + slider_min_height) {
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
          if (this.data.value != previous_slider_val) {
            previous_slider_val = this.data.value;
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
  var default_knob_stroke_width = 10;
  var default_knob_radius = 150;
  var default_knob_offet = 90;
  var previous_knob_offset = 0;
  var previous_knob_radius = 0;
  var previous_knob_theta = 0;

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
      this.data.radius = default_knob_radius;
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
      var headPos = pol_to_cart(this.data.radius - default_knob_stroke_width, deg_to_rad(default_knob_offet));
      var footPos = pol_to_cart(this.data.radius - default_knob_stroke_width * 2, deg_to_rad(default_knob_offet));
      var handlePos = pol_to_cart(this.data.radius + default_knob_stroke_width, deg_to_rad(default_knob_offet));
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
        previous_knob_radius = this.data.radius;
        this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
        if (MIDI_device_connected && this.data.radius != previous_knob_radius) {
          sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
        }
        previous_knob_theta = this.data.theta_val;
        var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
        this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
        if (MIDI_device_connected && this.data.theta_val != previous_knob_theta) {
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
    onMouseLeave: function () {
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
              previous_knob_offset = this.data.offset;
              this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              let delta = this.data.offset - previous_knob_offset;
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
          previous_knob_radius = this.data.radius;
          this.data.radius_val = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          previous_knob_theta = this.data.theta_val;
          this.data.theta_val = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(polar.radius, polar.theta);
          footPos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["needle-head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle-foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        update_menu_params(this);

        // SEND MIDI CONTROL_CHANGE
        if (MIDI_device_connected && this.data.theta_val != previous_knob_theta) {
          sendControlChange(this.data.tCc, this.data.theta_val, this.data.tChan);
        }
        if (MIDI_device_connected && this.data.radius_val != previous_knob_radius) {
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
    onMouseLeave: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },

    // controleur.addPoint(mouseEvent);   // Move it to the path_factory mose_down!

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
