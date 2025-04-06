/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// GRID Factory
function grid_factory() {
  const DEFAULT_GRID_WIDTH = 400;
  const DEFAULT_GRID_HEIGHT = 400;
  const DEFAULT_GRID_COLS = 8;
  const DEFAULT_GRID_ROWS = 8;
  const DEFAULT_GRID_MODE_Z = NOTE_ON;
  const GRID_MIN_SIZE = 30;
  

  let frame_width = null;
  let frame_height = null;
  let key_width = null;
  let key_height = null;
  let half_key_width = null;
  let half_key_height = null;

  let current_key_count = null;
  let previous_key_count = null;

  var _grid = new paper.Group({
    "name": "grid",
    "modes": {
      0: "NOTE_ON",     // TRIGGER WITH VELOCITY
      1: "C_CHANGE",    // PRESSURE ONLY
      2: "P_AFTERTOUCH" // TRIGGER AND PRESSURE
    },
    "data": {
      "from": null,
      "to": null,
      "cols": null,
      "rows": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.mode_z = DEFAULT_GRID_MODE_Z;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_GRID_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_GRID_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_GRID_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_GRID_HEIGHT / 2)
      );
      this.data.cols = DEFAULT_GRID_COLS;
      this.data.rows = DEFAULT_GRID_ROWS;

      this.data.msg = [];
      let key_msg;
      current_key_count = this.data.cols * this.data.rows;
      for (let _key = 0; _key < current_key_count; _key++) {
        key_msg = {};
        key_msg.press = midi_msg_builder(DEFAULT_GRID_MODE_Z);
        this.data.msg.push(key_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(
        mapp(params.from[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.from[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.to = new paper.Point(
        mapp(params.to[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.to[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.cols = params.cols;
      this.data.rows = params.rows;
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.mode_z = status.type;
    },

    save_params: function () {
      let previous_key_mode_z = this.data.mode_z;
      this.data.from = this.children["grid-group"].data.from;
      this.data.to = this.children["grid-group"].data.to;
      this.data.cols = this.children["grid-group"].data.cols;
      this.data.rows = this.children["grid-group"].data.rows;
      this.data.mode_z = this.children["grid-group"].data.mode_z;

      previous_key_count = current_key_count;
      current_key_count = this.data.cols * this.data.rows;
      this.data.msg = [];
      if (this.data.mode_z !== previous_key_mode_z) {
        for (let _key = 0; _key < current_key_count; _key++) {
          let key_msg = {};
          key_msg.press = midi_msg_builder(this.data.mode_z);
          this.data.msg.push(key_msg);
        }
      }
      else {
        for (let _key = 0; _key < current_key_count; _key++) {
          if (_key < previous_key_count) {
            let status = midi_msg_status_unpack(this.children["keys-group"].children[_key].msg.press.midi.status);
            let new_status = midi_msg_status_pack(this.data.mode_z, status.channel);
            this.children["keys-group"].children[_key].msg.press.midi.status = new_status;
            this.data.msg.push(this.children["keys-group"].children[_key].msg);
          }
          else {
            let key_msg = {};
            key_msg.press = midi_msg_builder(this.data.mode_z);
            this.data.msg.push(key_msg);
          }
        }
      }

    },

    new_key: function (index_x, index_y) {
      let _key_id = index_y * this.data.cols + index_x;
      let _key_group = new paper.Group({
        "name": "key-" + _key_id,
        "pos": new paper.Point(index_x, index_y),
        "from": new paper.Point(
          this.data.from.x + index_x * key_width,
          this.data.from.y + index_y * key_height
        ),
        "to": new paper.Point(
          this.data.from.x + index_x * key_width + key_width,
          this.data.from.y + index_y * key_height + key_height
        ),
        "msg": this.data.msg[_key_id],
        "prev_pos_z": null
      });

      let _key_frame = new paper.Path.Rectangle({
        "name": "key-frame",
        "from": _key_group.from,
        "to": _key_group.to
      });

      _key_frame.style = {
        "fillColor": "pink",
        "strokeColor": "black",
        "strokeWidth": 0.2
      };

      _key_frame.onMouseEnter = function () {
        this.style.fillColor = "orange";
      }

      _key_frame.onMouseLeave = function () {
        this.style.fillColor = "pink";
      }

      _key_frame.onMouseDown = function () {
        previous_touch = current_touch;
        current_touch = _key_group;
        this.style.fillColor = "red";
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_ON
            _key_group.msg.press.midi.status = _key_group.msg.press.midi.status | NOTE_ON ;
            _key_group.msg.press.midi.data2 = 127;
            send_midi_msg(_key_group.msg.press.midi);
            break;
        }
      }

      _key_frame.onMouseUp = function () {
        this.style.fillColor = "orange";
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_OFF
            _key_group.msg.press.midi.status = _key_group.msg.press.midi.status & NOTE_OFF ;
            _key_group.msg.press.midi.data2 = 0;
            send_midi_msg(_key_group.msg.press.midi);
            break;
        }
      }

      _key_group.addChild(_key_frame);

      let _key_txt = new paper.PointText({
        "name": "key-text",
        "point": _key_frame.position,
        "content": _key_group.msg.press.midi.data1,
        "locked": true
      });

      _key_txt.style = {
        "fillColor": "black"
      };

      _key_group.addChild(_key_txt);
      return _key_group;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;
      key_width = frame_width / this.data.cols;
      key_height = frame_height / this.data.rows;

      let _grid_group = new paper.Group({
        "name": "grid-group",
        "modes": this.modes,
        "data": {
          "from": this.data.from,
          "to": this.data.to,
          "cols": this.data.cols,
          "rows": this.data.rows,
          "mode_z": this.data.mode_z
        }
      });

      let _keys_group = new paper.Group({
        "name": "keys-group"
      });

      for (let index_y = 0; index_y < _grid_group.data.rows; index_y++) {
        for (let index_x = 0; index_x < _grid_group.data.cols; index_x++) {
          _keys_group.addChild(this.new_key(index_x, index_y));
        }
      }

      let _grid_frame = new paper.Path.Rectangle({
        //"name": "grid-frame",
        "from": _grid_group.data.from,
        "to": _grid_group.data.to
      });

      _grid_frame.style = {
        "strokeColor": "lightGray",
        "strokeWidth": 15
      };
      _grid_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _grid_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      /*
      _grid_frame.onMouseDown = function () {
      }
      */

      _grid_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              let newPos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / _grid_group.data.cols;
                  half_key_width = key_width / 2;
                  this.segments[0].point.x = mouseEvent.point.x;
                  this.segments[1].point = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / _grid_group.data.rows;
                  half_key_height = key_height / 2;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.right - (_grid_group.data.cols - _key.pos.x) * key_width + half_key_width;
                    newPos.y = this.bounds.bottom - (_grid_group.data.rows - _key.pos.y) * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-text"].position = newPos;
                  }
                  _grid_group.data.from = mouseEvent.point;
                  break;
                case "top-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / _grid_group.data.cols;
                  half_key_width = key_width / 2;
                  this.segments[1].point.y = mouseEvent.point.y;
                  this.segments[2].point = mouseEvent.point;
                  this.segments[3].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  key_height = frame_height / _grid_group.data.rows;
                  half_key_height = key_height / 2; this.segments[2].point.y = mouseEvent.point.y;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.left + _key.pos.x * key_width + half_key_width;
                    newPos.y = this.bounds.bottom - (_grid_group.data.rows - _key.pos.y) * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-text"].position = newPos;
                  }
                  _grid_group.data.from.y = mouseEvent.point.y;
                  _grid_group.data.to.x = mouseEvent.point.x;
                  break;
                case "bottom-right":
                  frame_width = Math.max(GRID_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  key_width = frame_width / _grid_group.data.cols;
                  half_key_width = key_width / 2;
                  this.segments[2].point.x = mouseEvent.point.x;
                  this.segments[3].point = mouseEvent.point;
                  this.segments[0].point.y = mouseEvent.point.y;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / _grid_group.data.rows;
                  half_key_height = key_height / 2;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.left + _key.pos.x * key_width + half_key_width;
                    newPos.y = this.bounds.top + _key.pos.y * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-text"].position = newPos;
                  }
                  _grid_group.data.to = mouseEvent.point;
                  break;
                case "bottom-left":
                  frame_width = Math.max(GRID_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  key_width = frame_width / _grid_group.data.cols;
                  half_key_width = key_width / 2;
                  this.segments[3].point.y = mouseEvent.point.y;
                  this.segments[0].point = mouseEvent.point;
                  this.segments[1].point.x = mouseEvent.point.x;
                  frame_height = Math.max(GRID_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  key_height = frame_height / _grid_group.data.rows;
                  half_key_height = key_height / 2;
                  for (const _key of _keys_group.children) {
                    newPos.x = this.bounds.right - (_grid_group.data.cols - _key.pos.x) * key_width + half_key_width;
                    newPos.y = this.bounds.top + _key.pos.y * key_height + half_key_height;
                    _key.children["key-frame"].position = newPos;
                    _key.children["key-frame"].bounds.width = key_width;
                    _key.children["key-frame"].bounds.height = key_height;
                    _key.children["key-text"].position = newPos;
                  }
                  _grid_group.data.from.x = mouseEvent.point.x;
                  _grid_group.data.to.y = mouseEvent.point.y;
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
              update_menu_1st_level(_grid_group.parent);
            }
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }
      _grid_group.addChild(_grid_frame);
      this.addChild(_grid_group);
      this.addChild(_keys_group);
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            move_item(this, mouseEvent);
            update_menu_1st_level(this);
          }
          break;
        case PLAY_MODE:
          // NA
          break;
      }
    }

  });
  return _grid;
};
