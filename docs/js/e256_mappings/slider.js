/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SLIDER Factory
// Multitouch MIDI slider GUI
function sliderFactory() {
  const DEFAULT_SLIDER_WIDTH = 60;
  const DEFAULT_SLIDER_HEIGHT = 400;
  const DEFAULT_SLIDER_MIN_WIDTH = 50;
  const DEFAULT_SLIDER_MIN_HEIGHT = 100;
  const DEFAULT_SLIDER_TOUCH = 2;
  const DEFAULT_SLIDER_TOUCH_MODE = C_CHANGE;
  const DEFAULT_SLIDER_TOUCH_MODE_Z = NOTE_ON;
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
      "touch": null,
      "from": null,
      "to": null,
      "mode_z": null,
      "midi": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.dir = DEFAULT_SLIDER_DIR;
      this.data.touch = DEFAULT_SLIDER_TOUCH;
      this.data.mode_z = DEFAULT_SLIDER_TOUCH_MODE_Z;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.midi = [];
      let midi_touch;
      for (let _touch = 0; _touch < DEFAULT_SLIDER_TOUCH; _touch++) {
        midi_touch = {};
        midi_touch.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCH_MODE);
        midi_touch.pos_z = midi_msg_builder(this.data.mode_z);
        this.data.midi.push(midi_touch);
      }
    },

    setup_from_config: function (params) {
      this.data.touch = params.touch;
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.mode_z = params.mode_z;
      this.data.midi = params.midi;
    },

    save_params: function () {
      let previous_touch_count = this.data.touch;
      let previous_touch_mode_z = this.data.mode_z;
      this.data.touch = this.children["slider-group"].data.touch;
      this.data.from = this.children["slider-group"].data.from;
      this.data.to = this.children["slider-group"].data.to;
      this.data.mode_z = this.children["slider-group"].data.mode_z;

      this.data.midi = [];
      if (this.data.mode_z !== previous_touch_mode_z) {
        for (let _touch = 0; _touch < this.data.touch; _touch++) {
          let midi_touch = {};
          midi_touch.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCH_MODE);
          midi_touch.pos_z = midi_msg_builder(this.data.mode_z);
          this.data.midi.push(midi_touch);
        }
      }
      else {
        for (let _touch = 0; _touch < this.data.touch; _touch++) {
          if (_touch < previous_touch_count) {
            let status = midi_msg_status_unpack(this.children["touchs-group"].children[_touch].midi.pos_z.msg.status);
            let new_status = midi_msg_status_pack(this.data.mode_z, status.channel);
            this.children["touchs-group"].children[_touch].midi.pos_z.msg.status = new_status;
            this.data.midi.push(this.children["touchs-group"].children[_touch].midi);
          }
          else {
            let midi_touch = {};
            midi_touch.pos = midi_msg_builder(DEFAULT_SLIDER_TOUCH_MODE);
            midi_touch.pos_z = midi_msg_builder(this.data.mode_z);
            this.data.midi.push(midi_touch);
          }
        }
      }
    },

    new_touch: function (_slider, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "pos": new paper.Point(
          this.data.from.x + (DEFAULT_SLIDER_WIDTH / 2),
          get_random_int(this.data.from.y + 10, this.data.to.y - 10)
        ),
        "midi": this.data.midi[_touch_id],
        "prev_pos": null,
        "prev_pos_z": null
      });

      let _touch_line = new paper.Path.Line({
        "name": "touch-line",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });

      _touch_line.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "locked": true
      };

      _touch_group.addChild(_touch_line);

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": new paper.Point(this.data.from.x + (DEFAULT_SLIDER_WIDTH / 2), _touch_group.pos.y),
        "radius": DEFAULT_TOUCH_RADIUS // TODO: mapping with the blob pressure!  
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
        previous_touch = current_touch;
        current_touch = _touch_group;
        // Set midi_msg status to NOTE_ON
        _touch_group.midi.pos_z.msg.status = _touch_group.midi.pos_z.msg.status | (NOTE_ON << 4);
        _touch_group.midi.pos_z.msg.data2 = 127;
        send_midi_msg(_touch_group.midi.pos_z.msg);
      }

      _touch_circle.onMouseUp = function () {
        // Set midi_msg status to NOTE_OFF
        _touch_group.midi.pos_z.msg.status = _touch_group.midi.pos_z.msg.status & (NOTE_OFF << 4);
        _touch_group.midi.pos_z.msg.data2 = 0;
        send_midi_msg(_touch_group.midi.pos_z.msg);
      }

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_circle.position,
        "content": _touch_group.midi.pos.msg.data1,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": DEFAULT_FONT_SIZE
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
                  _touch_group.midi.pos.msg.data2 = Math.round(
                    mapp(mouseEvent.point.y,
                      _slider.children["slider-frame"].bounds.top,
                      _slider.children["slider-frame"].bounds.bottom,
                      _touch_group.midi.pos.limit.min,
                      _touch_group.midi.pos.limit.max
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
                  _touch_group.midi.pos.msg.data2 = Math.round(
                    mapp(mouseEvent.point.x,
                      _slider.children["slider-frame"].bounds.left,
                      _slider.children["slider-frame"].bounds.right,
                      _touch_group.midi.pos.limit.min,
                      _touch_group.midi.pos.limit.max
                    )
                  );
                }
                break;
            }
            if (_touch_group.midi.pos.msg.data2 != _touch_group.prev_pos) {
              _touch_group.prev_pos = _touch_group.midi.pos.msg.data2;
              send_midi_msg(_touch_group.midi.pos.msg);
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
          "touch": this.data.touch,
          "from": this.data.from,
          "to": this.data.to,
          "mode_z": this.data.mode_z
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _slider_group.data.touch; _touch++) {
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

      /*
      _slider_frame.onMouseDown = function () {
      }
      */

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
                      _touch.children["touch-line"].segments[0].point.x = mouseEvent.point.x;
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.right - new_size.x;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line"].position.y = new_pos.y;
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
                      _touch.children["touch-line"].segments[1].point.x = mouseEvent.point.x;
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.left + new_size.x;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line"].position.y = new_pos.y;
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
                      _touch.children["touch-line"].segments[1].point.x = mouseEvent.point.x;
                      new_size.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.left + new_size.x;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line"].position.y = new_pos.y;
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
                      _touch.children["touch-line"].segments[0].point.x = mouseEvent.point.x;
                      new_size.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * current_frame_width) / previous_frame_width;
                      new_size.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * current_frame_height) / previous_frame_height;
                      new_pos.x = this.bounds.right - new_size.x;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-circle"].position = new_pos;
                      _touch.children["touch-txt"].position = new_pos;
                      _touch.children["touch-line"].position.y = new_pos.y;
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
