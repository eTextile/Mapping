/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SLIDER Factory
// Multitouch MIDI slider GUI
function slider_factory() {
  const DEFAULT_SLIDER_WIDTH = 60;
  const DEFAULT_SLIDER_HEIGHT = 400;
  const DEFAULT_SLIDER_MIN_WIDTH = 50;
  const DEFAULT_SLIDER_MIN_HEIGHT = 100;
  const DEFAULT_SLIDER_TOUCHS = 1;
  const DEFAULT_SLIDER_TOUCHS_MODE = C_CHANGE;
  const DEFAULT_SLIDER_TOUCHS_MODE_Z = NOTE_ON;
  const DEFAULT_SLIDER_DIR = "V_SLIDER";

  let current_frame_width = null;
  let previous_frame_width = null;
  let current_frame_height = null;
  let previous_frame_height = null;

  var _slider = new paper.Group({
    "name": "slider",
    "dir": null,
    "modes": {
      0: "NOTE_ON",     // TRIGGER WITH VELOCITY
      1: "C_CHANGE",    // PRESSURE ONLY
      2: "P_AFTERTOUCH" // TRIGGER AND PRESSURE
    },
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.dir = DEFAULT_SLIDER_DIR;
      this.data.touchs = DEFAULT_SLIDER_TOUCHS;
      this.data.mode_z = DEFAULT_SLIDER_TOUCHS_MODE_Z;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.msg = [];
      let touch_msg;
      for (let _touch = 0; _touch < DEFAULT_SLIDER_TOUCHS; _touch++) {
        touch_msg = {};
        touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCHS_MODE);
        touch_msg.press = midi_msg_builder(DEFAULT_SLIDER_TOUCHS_MODE_Z);
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
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.mode_z = status.type;
      let frame_height = this.data.to.y - this.data.from.y;
      let frame_width = this.data.to.x - this.data.from.x;
      if (frame_height > frame_width) {
        this.dir = "V_SLIDER";
      } else {
        this.dir = "H_SLIDER";
      }
    },

    save_params: function () {
      this.dir = this.children["slider-group"].dir;
      let previous_touch_count = this.data.touchs;
      let previous_touch_mode_z = this.data.mode_z;
      this.data.touchs = this.children["slider-group"].data.touchs;
      this.data.from = this.children["slider-group"].data.from;
      this.data.to = this.children["slider-group"].data.to;
      this.data.mode_z = this.children["slider-group"].data.mode_z;

      this.data.msg = [];
      if (this.data.mode_z !== previous_touch_mode_z) {
        for (let _touch = 0; _touch < this.data.touchs; _touch++) {
          let touch_msg = {};
          touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCHS_MODE);
          touch_msg.press = midi_msg_builder(this.data.mode_z);
          this.data.msg.push(touch_msg);
        }
      }
      else {
        for (let _touch = 0; _touch < this.data.touchs; _touch++) {
          if (_touch < previous_touch_count) {
            let status = midi_msg_status_unpack(this.children["touchs-group"].children[_touch].msg.press.midi.status);
            let new_status = midi_msg_status_pack(this.data.mode_z, status.channel);
            this.children["touchs-group"].children[_touch].msg.press.midi.status = new_status;
            this.data.msg.push(this.children["touchs-group"].children[_touch].msg);
          }
          else {
            let touch_msg = {};
            touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCHS_MODE);
            touch_msg.press = midi_msg_builder(this.data.mode_z);
            this.data.msg.push(touch_msg);
          }
        }
      }
    },

    new_touch: function (_slider, _touch_id) {

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": null,
        "prev_pos": null
      });

      let _touch_line = new paper.Path.Line({
        "name": "touch-line",
        "from": null,
        "to": null,
        "locked": true
      });

      switch (this.dir) {
        case "V_SLIDER":
          _touch_group.pos = new paper.Point(
            this.data.from.x + ((this.data.to.x - this.data.from.x) / 2),
            get_random_int(this.data.from.y + 10, this.data.to.y - 10)
          );
          _touch_line.segments[0].point = new paper.Point(this.data.from.x, _touch_group.pos.y);
          _touch_line.segments[1].point = new paper.Point(this.data.to.x, _touch_group.pos.y);
          break;
        case "H_SLIDER":
          _touch_group.pos = new paper.Point(
            get_random_int(this.data.from.x + 10, this.data.to.x - 10),
            this.data.from.y + ((this.data.to.y - this.data.from.y) / 2)
          );
          _touch_line.segments[0].point = new paper.Point(_touch_group.pos.x, this.data.from.y);
          _touch_line.segments[1].point = new paper.Point(_touch_group.pos.x, this.data.to.y);
          break;
      }

      _touch_line.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "locked": true
      };

      _touch_group.addChild(_touch_line);

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": _touch_group.pos,
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure!?
      });

      _touch_circle.style = {
        "fillColor": "#606060"
      };

      _touch_circle.onMouseEnter = function () {
        this.style.fillColor = "red";
      }

      _touch_circle.onMouseLeave = function () {
        this.style.fillColor = "#606060";
      }

      _touch_circle.onMouseDown = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_ON
            _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status | NOTE_ON ;
            _touch_group.msg.press.midi.data2 = 127;
            send_midi_msg(_touch_group.msg.press.midi);
            break;
        }
      }

      _touch_circle.onMouseUp = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_OFF
            _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status & NOTE_OFF ;
            _touch_group.msg.press.midi.data2 = 0;
            send_midi_msg(_touch_group.msg.press.midi);
            break;
        }
      }

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_circle.position,
        "content": _touch_group.msg.pos.midi.data1,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE
      };

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // NA
            break;
          case PLAY_MODE:
            switch (_slider.dir) {
              case "V_SLIDER":
                if (mouseEvent.point.y > _slider.children["slider-frame"].bounds.top &&
                  mouseEvent.point.y < _slider.children["slider-frame"].bounds.bottom) {
                  _touch_line.position.y = mouseEvent.point.y;
                  _touch_circle.position.y = mouseEvent.point.y;
                  _touch_txt.position.y = mouseEvent.point.y;
                  _touch_group.msg.pos.midi.data2 = Math.round(
                    mapp(mouseEvent.point.y,
                      _slider.children["slider-frame"].bounds.top,
                      _slider.children["slider-frame"].bounds.bottom,
                      _touch_group.msg.pos.limit.min,
                      _touch_group.msg.pos.limit.max
                    )
                  );
                }
                break;
              case "H_SLIDER":
                if (mouseEvent.point.x > _slider.children["slider-frame"].bounds.left &&
                  mouseEvent.point.x < _slider.children["slider-frame"].bounds.right) {
                  _touch_line.position.x = mouseEvent.point.x;
                  _touch_circle.position.x = mouseEvent.point.x;
                  _touch_txt.position.x = mouseEvent.point.x;
                  _touch_group.msg.pos.midi.data2 = Math.round(
                    mapp(mouseEvent.point.x,
                      _slider.children["slider-frame"].bounds.left,
                      _slider.children["slider-frame"].bounds.right,
                      _touch_group.msg.pos.limit.min,
                      _touch_group.msg.pos.limit.max
                    )
                  );
                }
                break;
            }
            if (_touch_group.msg.pos.midi.data2 != _touch_group.prev_pos) {
              _touch_group.prev_pos = _touch_group.msg.pos.midi.data2;
              send_midi_msg(_touch_group.msg.pos.midi);
            }
            break;
        }
      }
      _touch_group.addChild(_touch_circle);
      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {
      current_frame_width = this.data.to.x - this.data.from.x;
      current_frame_height = this.data.to.y - this.data.from.y;

      let _slider_group = new paper.Group({
        "name": "slider-group",
        "modes": this.modes,
        "dir": this.dir,
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

      for (let _touch = 0; _touch < _slider_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_slider_group, _touch));
      }

      var _slider_frame = new paper.Path.Rectangle({
        "name": "slider-frame",
        "from": _slider_group.data.from,
        "to": _slider_group.data.to
      });

      _slider_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": "azure"
      };

      _slider_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _slider_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _slider_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              let new_size = new paper.Point();
              let new_pos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_SLIDER_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_SLIDER_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT_SLIDER_MIN_WIDTH && current_frame_height >= DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[0].point.x = mouseEvent.point.x;
                    this.segments[1].point = mouseEvent.point;
                    this.segments[2].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      if (current_frame_height > current_frame_width) {
                        _slider_group.dir = "V_SLIDER";
                        new_pos.x = this.bounds.right - ((this.bounds.right - this.bounds.left) / 2);
                        new_pos.y = this.bounds.bottom - new_size.y;
                        _touch.children["touch-line"].segments[0].point = new paper.Point(this.bounds.left, new_pos.y);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(this.bounds.right, new_pos.y);
                      } else {
                        _slider_group.dir = "H_SLIDER";
                        new_pos.x = this.bounds.right - new_size.x;
                        new_pos.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                        _touch.children["touch-line"].segments[0].point = new paper.Point(new_pos.x, this.bounds.top);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(new_pos.x, this.bounds.bottom);
                      }
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                    }
                    _slider_group.data.from = mouseEvent.point;
                  }
                  break;
                case "top-right":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_SLIDER_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_SLIDER_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT_SLIDER_MIN_WIDTH && current_frame_height >= DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[1].point.y = mouseEvent.point.y;
                    this.segments[2].point = mouseEvent.point;
                    this.segments[3].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      if (current_frame_height > current_frame_width) {
                        _slider_group.dir = "V_SLIDER";
                        new_pos.x = this.bounds.right - ((this.bounds.right - this.bounds.left) / 2);
                        new_pos.y = this.bounds.bottom - new_size.y;
                        _touch.children["touch-line"].segments[0].point = new paper.Point(this.bounds.left, new_pos.y);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(this.bounds.right, new_pos.y);
                      } else {
                        _slider_group.dir = "H_SLIDER";
                        new_pos.x = this.bounds.left + new_size.x;
                        new_pos.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                        _touch.children["touch-line"].segments[0].point = new paper.Point(new_pos.x, this.bounds.top);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(new_pos.x, this.bounds.bottom);
                      }
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                    }
                    _slider_group.data.from.y = mouseEvent.point.y;
                    _slider_group.data.to.x = mouseEvent.point.x;
                  }
                  break;
                case "bottom-right":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_SLIDER_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_SLIDER_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT_SLIDER_MIN_WIDTH && current_frame_height >= DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[2].point.x = mouseEvent.point.x;
                    this.segments[3].point = mouseEvent.point;
                    this.segments[0].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      if (current_frame_height > current_frame_width) {
                        _slider_group.dir = "V_SLIDER";
                        new_pos.x = this.bounds.right - ((this.bounds.right - this.bounds.left) / 2);
                        new_pos.y = this.bounds.top + new_size.y;
                        _touch.children["touch-line"].segments[0].point = new paper.Point(this.bounds.left, new_pos.y);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(this.bounds.right, new_pos.y);
                      } else {
                        _slider_group.dir = "H_SLIDER";
                        new_pos.x = this.bounds.left + new_size.x;
                        new_pos.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                        _touch.children["touch-line"].segments[0].point = new paper.Point(new_pos.x, this.bounds.top);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(new_pos.x, this.bounds.bottom);
                      }
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                    }
                    _slider_group.data.to = mouseEvent.point;
                  }
                  break;
                case "bottom-left":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT_SLIDER_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT_SLIDER_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT_SLIDER_MIN_WIDTH && current_frame_height >= DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[3].point.y = mouseEvent.point.y;
                    this.segments[0].point = mouseEvent.point;
                    this.segments[1].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      if (current_frame_height > current_frame_width) {
                        _slider_group.dir = "V_SLIDER";
                        new_pos.x = this.bounds.right - ((this.bounds.right - this.bounds.left) / 2);
                        new_pos.y = this.bounds.top + new_size.y;
                        _touch.children["touch-line"].segments[0].point = new paper.Point(this.bounds.left, new_pos.y);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(this.bounds.right, new_pos.y);
                      } else {
                        _slider_group.dir = "H_SLIDER";
                        new_pos.x = this.bounds.right - new_size.x;
                        new_pos.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                        _touch.children["touch-line"].segments[0].point = new paper.Point(new_pos.x, this.bounds.top);
                        _touch.children["touch-line"].segments[1].point = new paper.Point(new_pos.x, this.bounds.bottom);
                      }
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                    }
                    _slider_group.data.from.x = mouseEvent.point.x;
                    _slider_group.data.to.y = mouseEvent.point.y;
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_menu_1st_level(_slider_group.parent);
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      _slider_group.addChild(_slider_frame);
      this.addChild(_slider_group);
      this.addChild(_touchs_group);
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

  return _slider;
};
