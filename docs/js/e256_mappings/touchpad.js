/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TOUCHPAD Factory
function touchpad_factory() {
  const DEFAULT_PAD_WIDTH = 450;
  const DEFAULT_PAD_HEIGHT = 450;
  const DEFAULT_PAD_TOUCH_MARGIN = 35;
  const DEFAULT_PAD_MIN_WIDTH = 100;
  const DEFAULT_PAD_MIN_HEIGHT = 100;
  const DEFAULT_PAD_MODE_X = C_CHANGE;
  const DEFAULT_PAD_MODE_Y = C_CHANGE;
  const DEFAULT_PAD_MODE_Z = AFTERTOUCH_POLY;
  const DEFAULT_PAD_TOUCHS = 2;

  let current_frame_width = null;
  let previous_frame_width = null;
  let current_frame_height = null;
  let previous_frame_height = null;

  var _touchpad = new paper.Group({
    "name": "touchpad",
    "modes": {
      0: "NOTE_ON",        // TRIGGER NOTE WITH VELOCITY
      1: "C_CHANGE",       // PRESSURE ONLY
      2: "AFTERTOUCH_POLY" // TRIGGER NOTE AND MODULATE
    },
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT_PAD_TOUCHS;
      this.data.mode_z = DEFAULT_PAD_MODE_Z;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_PAD_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_PAD_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_PAD_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_PAD_HEIGHT / 2)
      );
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_PAD_TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos_x = midi_msg_builder(DEFAULT_PAD_MODE_X);
        touch_msg.pos_y = midi_msg_builder(DEFAULT_PAD_MODE_Y);
        switch (this.data.mode_z) {
          case NOTE_ON:
            touch_msg.note = midi_msg_builder(NOTE_ON);
            //touch_msg.press = null;
            break;
          case C_CHANGE:
            //touch_msg.note = null;
            touch_msg.press = midi_msg_builder(C_CHANGE);
            break;
          case AFTERTOUCH_POLY:
            touch_msg.note = midi_msg_builder(NOTE_ON);
            touch_msg.press = midi_msg_builder(C_CHANGE);
            break;
        }
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs;
      this.data.from = new paper.Point(
        mapp(params.from[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.from[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.to = new paper.Point(
        mapp(params.to[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.to[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.mode_z = params.mode_z;
      this.data.msg = params.msg;
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["pad-group"].data.touchs;
      this.data.from = this.children["pad-group"].data.from;
      this.data.to = this.children["pad-group"].data.to;

      let previous_mode_z = this.data.mode_z;
      this.data.mode_z = this.children["pad-group"].data.mode_z;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (this.data.mode_z != previous_mode_z) {
          touch_msg.pos_x = midi_msg_builder(DEFAULT_PAD_MODE_X);
          touch_msg.pos_y = midi_msg_builder(DEFAULT_PAD_MODE_Y);
          switch (this.data.mode_z) {
            case NOTE_ON:
              touch_msg.note = midi_msg_builder(NOTE_ON);
              break;
            case C_CHANGE:
              touch_msg.press = midi_msg_builder(C_CHANGE);
              break;
            case AFTERTOUCH_POLY:
              touch_msg.note = midi_msg_builder(NOTE_ON);
              touch_msg.press = midi_msg_builder(C_CHANGE);
              break;
          }
        }
        else {
          if (_touch < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[_touch].msg;
          }
          else {
            touch_msg.pos_x = midi_msg_builder(DEFAULT_PAD_MODE_X);
            touch_msg.pos_y = midi_msg_builder(DEFAULT_PAD_MODE_Y);
            switch (this.data.mode_z) {
              case NOTE_ON:
                touch_msg.note = midi_msg_builder(NOTE_ON);
                break;
              case C_CHANGE:
                touch_msg.press = midi_msg_builder(C_CHANGE);
                break;
              case AFTERTOUCH_POLY:
                touch_msg.note = midi_msg_builder(NOTE_ON);
                touch_msg.press = midi_msg_builder(C_CHANGE);
                break;
            }
          }
        }
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_touchpad, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "pos": new paper.Point(
          get_random_int(this.data.from.x + DEFAULT_PAD_TOUCH_MARGIN, this.data.to.x - DEFAULT_PAD_TOUCH_MARGIN),
          get_random_int(this.data.from.y + DEFAULT_PAD_TOUCH_MARGIN, this.data.to.y - DEFAULT_PAD_TOUCH_MARGIN)
        ),
        "msg": this.data.msg[_touch_id],
        "prev_pos_x": null,
        "prev_pos_y": null,
        "prev_pos_z": null
      });

      let _touch_line_x = new paper.Path.Line({
        "name": "touch-line-x",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });

      _touch_line_x.style = {
        "strokeWidth": .5,
        "dashArray": [15, 4],
        "strokeColor": "black"
      }

      _touch_group.addChild(_touch_line_x);

      let _touch_line_y = new paper.Path.Line({
        "name": "touch-line-y",
        "from": new paper.Point(_touch_group.pos.x, this.data.from.y),
        "to": new paper.Point(_touch_group.pos.x, this.data.to.y),
        "locked": true
      });

      _touch_line_y.style = {
        "strokeWidth": .5,
        "dashArray": [15, 4],
        "strokeColor": "black"
      }

      _touch_group.addChild(_touch_line_y);

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": _touch_group.pos,
        "radius": TOUCH_RADIUS
      });

      _touch_circle.style = {
        "fillColor": "green"
      }

      _touch_circle.onMouseEnter = function () {
        this.style.fillColor = "red";
      }

      _touch_circle.onMouseLeave = function () {
        this.style.fillColor = "green";
      }

      _touch_circle.onMouseDown = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case THROUGH_MODE:
            switch (_touchpad.data.mode_z) { // BUG_FIX: this.data.mode_z -> _touchpad.data.mode_z
              case NOTE_ON:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status | NOTE_ON);
                _touch_group.msg.note.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.note.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status | NOTE_ON);
                _touch_group.msg.note.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.note.midi);
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
            }
            break;
          case PLAY_MODE:
            // N/A
            break;
        }
      }
      
      _touch_circle.onMouseUp = function () {        
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            switch (_touchpad.data.mode_z) { // BUG_FIX: this.data.mode_z -> _touchpad.data.mode_z
              case NOTE_ON:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status & NOTE_OFF);
                _touch_group.msg.note.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.note.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status & NOTE_OFF);
                _touch_group.msg.note.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.note.midi);
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
            }
            break;
          case PLAY_MODE:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            if (mouseEvent.point.x > _touchpad.children["pad-frame"].bounds.left &&
              mouseEvent.point.x < _touchpad.children["pad-frame"].bounds.right &&
              mouseEvent.point.y > _touchpad.children["pad-frame"].bounds.top &&
              mouseEvent.point.y < _touchpad.children["pad-frame"].bounds.bottom) {
              _touch_line_x.position.y = mouseEvent.point.y;
              _touch_line_y.position.x = mouseEvent.point.x
              _touch_circle.position = mouseEvent.point;
              _touch_txt.position = mouseEvent.point;

              _touch_group.msg.pos_x.midi.data2 = Math.round(
                mapp(mouseEvent.point.x,
                  _touchpad.children["pad-frame"].bounds.right,
                  _touchpad.children["pad-frame"].bounds.left,
                  _touch_group.msg.pos_x.limit.min,
                  _touch_group.msg.pos_x.limit.max
                )
              )
              if (_touch_group.msg.pos_x.midi.data2 != _touch_group.prev_pos_x) {
                _touch_group.prev_pos_x = _touch_group.msg.pos_x.midi.data2;
                send_midi_msg(_touch_group.msg.pos_x.midi);
              }

              _touch_group.msg.pos_y.midi.data2 = Math.round(
                mapp(mouseEvent.point.y,
                  _touchpad.children["pad-frame"].bounds.top,
                  _touchpad.children["pad-frame"].bounds.bottom,
                  _touch_group.msg.pos_y.limit.min,
                  _touch_group.msg.pos_y.limit.max
                )
              )
              if (_touch_group.msg.pos_y.midi.data2 != _touch_group.prev_pos_y) {
                _touch_group.prev_pos_y = _touch_group.msg.pos_y.midi.data2;
                send_midi_msg(_touch_group.msg.pos_y.midi);
              }
            }
            break;
          case PLAY_MODE:
            // TODO
            break;
        }
      };

      _touch_group.addChild(_touch_circle);

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_group.pos,
        "content": _touch_group.msg.pos_y.midi.data1,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE
      }

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {
      current_frame_width = this.data.to.x - this.data.from.x;
      current_frame_height = this.data.to.y - this.data.from.y;

      let _pad_group = new paper.Group({
        "name": "pad-group",
        "modes": this.modes,
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "mode_z": this.data.mode_z
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_pad_group, _touch));
      }

      let _pad_frame = new paper.Path.Rectangle({
        "name": "pad-frame",
        "from": _pad_group.data.from,
        "to": _pad_group.data.to
      });

      _pad_frame.style = {
        "fillColor": "pink"
      }

      _pad_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case THROUGH_MODE:
            break;
          case PLAY_MODE:
            break;
        }
      }

      _pad_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case THROUGH_MODE:
            break;
          case PLAY_MODE:
            break;
        }
      }

      /*
      _pad_frame.onMouseDown = function () {
      }
      */

      _pad_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              let new_size = new paper.Point();
              let new_pos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_PAD_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_PAD_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT_PAD_MIN_WIDTH && current_frame_height >= DEFAULT_PAD_MIN_HEIGHT) {
                    this.segments[0].point.x = mouseEvent.point.x;
                    this.segments[1].point = mouseEvent.point;
                    this.segments[2].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                      _touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.right - new_size.x;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line-x"].position.y = new_pos.y;
                      _touch.children["touch-line-y"].position.x = new_pos.x;
                    }
                    _pad_group.data.from = mouseEvent.point;
                  }
                  break;
                case "top-right":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_PAD_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_PAD_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT_PAD_MIN_WIDTH && current_frame_height >= DEFAULT_PAD_MIN_HEIGHT) {
                    this.segments[1].point.y = mouseEvent.point.y;
                    this.segments[2].point = mouseEvent.point;
                    this.segments[3].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                      _touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.left + new_size.x;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line-x"].position.y = new_pos.y;
                      _touch.children["touch-line-y"].position.x = new_pos.x;
                    }
                    _pad_group.data.from.y = mouseEvent.point.y;
                    _pad_group.data.to.x = mouseEvent.point.x;
                  }
                  break;
                case "bottom-right":
                  previous_frame_width = current_frame_width;
                  previous_frame_height = current_frame_height;
                  current_frame_width = Math.max(DEFAULT_PAD_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  current_frame_height = Math.max(DEFAULT_PAD_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT_PAD_MIN_WIDTH && current_frame_height >= DEFAULT_PAD_MIN_HEIGHT) {
                    this.segments[2].point.x = mouseEvent.point.x;
                    this.segments[3].point = mouseEvent.point;
                    this.segments[0].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                      _touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.left + new_size.x;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line-x"].position.y = new_pos.y;
                      _touch.children["touch-line-y"].position.x = new_pos.x;
                    }
                    _pad_group.data.to = mouseEvent.point;
                  }
                  break;
                case "bottom-left":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_PAD_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_PAD_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT_PAD_MIN_WIDTH && current_frame_height >= DEFAULT_PAD_MIN_HEIGHT) {
                    this.segments[3].point.y = mouseEvent.point.y;
                    this.segments[0].point = mouseEvent.point;
                    this.segments[1].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                      _touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.right - new_size.x;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line-x"].position.y = new_pos.y;
                      _touch.children["touch-line-y"].position.x = new_pos.x;
                    }
                    _pad_group.data.from.x = mouseEvent.point.x;
                    _pad_group.data.to.y = mouseEvent.point.y;
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_main_params(_pad_group.parent);
            break;
          case PLAY_MODE:
            // N/A
            break;
        }
      }

      _pad_group.addChild(_pad_frame);
      this.addChild(_pad_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            move_item(this, mouseEvent);
            update_item_main_params(this);
          }
          break;
        case THROUGH_MODE:
          // N/A
          break;
        case PLAY_MODE:
          // N/A
          break;
      }
    }
  });

  return _touchpad;
};
