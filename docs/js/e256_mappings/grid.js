/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// GRID Factory
function gridFactory() {
  const DEFAULT_GRID_WIDTH = 400;
  const DEFAULT_GRID_HEIGHT = 400;
  const DEFAULT_GRID_COLS = 8;
  const DEFAULT_GRID_ROWS = 8;
  const DEFAULT_GRID_MODE = KEY_TRIGGER;
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
      this.data.mode = DEFAULT_GRID_MODE;
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
      this.data.from = new paper.Point(params.from.x, params.from.y); // ["Point",13,22]
      this.data.to = new paper.Point(params.to.x, params.to.y); // ["Point",141,144]
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.mode = params.mode;
      this.data.velocity = params.velocity;
      this.data.aftertouch = params.aftertouch;
      // TODO: keys setup!
    },

    save_params: function () {
      this.data.from = this.children["grid-group"].data.from;
      this.data.to = this.children["grid-group"].data.to;
      this.data.cols = this.children["grid-group"].data.cols;
      this.data.rows = this.children["grid-group"].data.rows;
      this.data.mode = this.children["grid-group"].data.mode;
      this.data.velocity = this.children["grid-group"].data.velocity;
      this.data.aftertouch = this.children["grid-group"].data.aftertouch;
      // TODO: save keys PARAMS!
      console.log("ITEM_PARAMS_SAVED: " + this.name);
    },

    new_key: function (index_y, index_x, key_w, key_h) {
      var _key_group = new paper.Group({
        name: "key-group",
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
      var _key_frame = new paper.Path.Rectangle({
        name: "key-frame",
        from: _key_group.from,
        to: _key_group.to
      });
      _key_frame.style = {
        fillColor: "pink",
        strokeColor: "black",
        strokeWidth: 0.2
      };
      _key_group.addChild(_key_frame);
      var _key_txt = new paper.PointText({
        name: "key-text",
        point: new paper.Point(_key_frame.position),
        content: index_y * this.data.cols + index_x, //_key_group.index -> Do not work!?
        locked: true
      });
      _key_txt.style = {
        fillColor: "black"
      };
      _key_group.addChild(_key_txt);
      return _key_group;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;
      key_width = frame_width / this.data.cols;
      key_height = frame_height / this.data.rows;

      var _grid_group = new paper.Group({
        name: "grid-group",
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

      var _grid_frame = new paper.Path.Rectangle({
        name: "grid-frame",
        from: this.data.from,
        to: this.data.to
      });
      _grid_frame.style = {
        strokeColor: "lightGreen",
        strokeWidth: 15
      };
      _grid_group.addChild(_grid_frame);

      this.addChild(_grid_group);

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
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (tmp_select) {
            if (tmp_select.item.name === "GRID") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "grid-group" || tmp_select.item.name === "key-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "grid-frame" || tmp_select.item.name === "key-frame") {
              highlight_item = tmp_select.item;
            }
            else {
              console.log("NOT_USED: " + tmp_select.item.name);
              return;
            }
            highlight_item.selected = true;
          }
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
        else if (tmp_select.item.name === "grid-group" || tmp_select.item.name === "key-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "grid-frame" || tmp_select.item.name === "key-frame") {
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
            if (current_item.name === "key-group" && previous_item.name === "key-group") {
              previous_item.firstChild.style.fillColor = "pink";
              current_item.firstChild.style.fillColor = "orange";
            }
            else if (current_item.name === "grid-group" && previous_item.name === "key-group") {
              previous_item.firstChild.style.fillColor = "pink";
              current_item.firstChild.style.strokeColor = "orange";
            }
            else if (previous_item.name === "grid-group" && current_item.name === "key-group") {
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
            if (current_item.name === "grid-group") {
              switch (current_part.name) {
                case "top-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-group"].children["grid-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["grid-group"].children["grid-frame"].segments[1].point = mouseEvent.point;
                  this.children["grid-group"].children["grid-frame"].segments[2].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-group"].children["grid-frame"].bounds.right - (this.data.cols - key.pos.x) * key_width + half_key_width;
                    newPos.y = this.children["grid-group"].children["grid-frame"].bounds.bottom - (this.data.rows - key.pos.y) * key_height + half_key_height;
                    key.children["key-frame"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-frame"].bounds.width = key_width;
                    key.children["key-frame"].bounds.height = key_height;
                  }
                  this.children["grid-group"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;

                case "top-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-group"].children["grid-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["grid-group"].children["grid-frame"].segments[2].point = mouseEvent.point;
                  this.children["grid-group"].children["grid-frame"].segments[3].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;this.children["grid-group"].children["grid-frame"].segments[2].point.y = mouseEvent.point.y;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-group"].children["grid-frame"].bounds.left + key.pos.x * key_width + half_key_width;
                    newPos.y = this.children["grid-group"].children["grid-frame"].bounds.bottom - (this.data.rows - key.pos.y) * key_height + half_key_height;
                    key.children["key-frame"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-frame"].bounds.width = key_width;
                    key.children["key-frame"].bounds.height = key_height;
                  }
                  this.children["grid-group"].data.from.y = Math.round(mouseEvent.point.y);
                  this.children["grid-group"].data.to.x = Math.round(mouseEvent.point.x);
                  break;

                case "bottom-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-group"].children["grid-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["grid-group"].children["grid-frame"].segments[3].point = mouseEvent.point;
                  this.children["grid-group"].children["grid-frame"].segments[0].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-group"].children["grid-frame"].bounds.left + key.pos.x * key_width + half_key_width;
                    newPos.y = this.children["grid-group"].children["grid-frame"].bounds.top + key.pos.y * key_height + half_key_height;
                    key.children["key-frame"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-frame"].bounds.width = key_width;
                    key.children["key-frame"].bounds.height = key_height;
                  }
                  this.children["grid-group"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;

                case "bottom-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / this.data.cols;
                  half_key_width = key_width / 2;
                  this.children["grid-group"].children["grid-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["grid-group"].children["grid-frame"].segments[0].point = mouseEvent.point;
                  this.children["grid-group"].children["grid-frame"].segments[1].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / this.data.rows;
                  half_key_height = key_height / 2;
                  for (const key of this.children["grid-keys"].children) {
                    newPos.x = this.children["grid-group"].children["grid-frame"].bounds.right - (this.data.cols - key.pos.x) * key_width + half_key_width;
                    newPos.y = this.children["grid-group"].children["grid-frame"].bounds.top + key.pos.y * key_height + half_key_height;
                    key.children["key-frame"].position = newPos;
                    key.children["key-text"].position = newPos;
                    key.children["key-frame"].bounds.width = key_width;
                    key.children["key-frame"].bounds.height = key_height;
                  }
                  this.children["grid-group"].data.from.x = Math.round(mouseEvent.point.x);
                  this.children["grid-group"].data.to.y = Math.round(mouseEvent.point.y);
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
