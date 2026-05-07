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
  const DEFAULT_SLIDER_MODE_POS = MIDI_TYPE.CONTROL_CHANGE;
  const DEFAULT_SLIDER_MODE_MOVE = MOVE_CODES.LIN;
  const DEFAULT_SLIDER_MODE_PRESS = MIDI_TYPE.NOTE_ON;
  const DEFAULT_SLIDER_POPULATE = POPULATE_CODES.OFF;
  const DEFAULT_SLIDER_STEPS = 20;
  const DEFAULT_SLIDER_INPUT_CHAN = 1;

  const DEFAULT_SLIDER_DIR = "V_SLIDER";

  let current_frame_width = null;
  let previous_frame_width = null;
  let current_frame_height = null;
  let previous_frame_height = null;

  var _slider = new paper.Group({
    "name": "slider",
    "dir": null,
    "data": {
      "touchs": null,
      "input_chan": null,
      "from": null,
      "to": null,
      "move": null,
      "press": null,
      "populate": null,
      "steps": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.dir = DEFAULT_SLIDER_DIR;
      this.data.touchs = DEFAULT_SLIDER_TOUCHS;
      this.data.input_chan = DEFAULT_SLIDER_INPUT_CHAN;
      this.data.press = DEFAULT_SLIDER_MODE_PRESS;
      this.data.move = DEFAULT_SLIDER_MODE_MOVE;
      this.data.populate = DEFAULT_SLIDER_POPULATE;
      this.data.steps = DEFAULT_SLIDER_STEPS;

      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_SLIDER_TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_MODE_POS);
        touch_msg.press = midi_msg_builder(this.data.press);
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs || 1;
      this.data.input_chan = params.input_chan || DEFAULT_SLIDER_INPUT_CHAN;
      this.data.steps = params.steps || DEFAULT_SLIDER_STEPS;
      this.data.move = params.move || DEFAULT_SLIDER_MODE_MOVE;
      this.data.populate = params.populate || DEFAULT_SLIDER_POPULATE;
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
      this.data.press = status.type;

      let frame_height = this.data.to.y - this.data.from.y;
      let frame_width = this.data.to.x - this.data.from.x;
      if (frame_height > frame_width) {
        this.dir = "V_SLIDER";
      } else {
        this.dir = "H_SLIDER";
      }
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["slider-group"].data.touchs;
      this.data.input_chan = this.children["slider-group"].data.input_chan;

      this.data.move = this.children["slider-group"].data.move;
      this.data.populate = this.children["slider-group"].data.populate;
      this.data.steps = this.children["slider-group"].data.steps;

      let previous_press = this.data.press;
      this.data.press = this.children["slider-group"].data.press;

      this.dir = this.children["slider-group"].dir;

      this.data.from = this.children["slider-group"].data.from;
      this.data.to = this.children["slider-group"].data.to;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (this.data.press != previous_press) {
          touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_MODE_POS);
          touch_msg.press = midi_msg_builder(this.data.press);
        }
        else {
          if (_touch < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[_touch].msg;
          }
          else {
            touch_msg.pos = midi_msg_builder(DEFAULT_SLIDER_MODE_POS);
            touch_msg.press = midi_msg_builder(this.data.press);
          }
        }
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_slider, _touch_id, _total) {

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": null,
        "prev_pos": null,
        "current_step": -1
      });

      function get_step_idx(point) {
        let frame = _slider.children["slider-frame"];
        let steps = _slider.data.steps;
        let idx = (_slider.dir === "V_SLIDER")
          ? Math.floor(mapp(point.y, frame.bounds.top, frame.bounds.bottom, 0, steps))
          : Math.floor(mapp(point.x, frame.bounds.left, frame.bounds.right, 0, steps));
        return Math.max(0, Math.min(steps - 1, idx));
      }

      let _touch_line = new paper.Path.Line({
        "name": "touch-line",
        "from": null,
        "to": null,
        "locked": true
      });

      if (this.dir === "V_SLIDER") {
        _touch_group.pos = new paper.Point(
          this.data.from.x + ((this.data.to.x - this.data.from.x) / 2),
          this.data.from.y + ((_touch_id + 1) / (_total + 1)) * (this.data.to.y - this.data.from.y)
        );
        _touch_line.segments[0].point = new paper.Point(this.data.from.x, _touch_group.pos.y);
        _touch_line.segments[1].point = new paper.Point(this.data.to.x, _touch_group.pos.y);
      }
      else { // H_SLIDER
        _touch_group.pos = new paper.Point(
          this.data.from.x + ((_touch_id + 1) / (_total + 1)) * (this.data.to.x - this.data.from.x),
          this.data.from.y + ((this.data.to.y - this.data.from.y) / 2)
        );
        _touch_line.segments[0].point = new paper.Point(_touch_group.pos.x, this.data.from.y);
        _touch_line.segments[1].point = new paper.Point(_touch_group.pos.x, this.data.to.y);
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
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure
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
          case MODE.EDIT:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case MODE.THROUGH:
            if (_slider.data.move === MOVE_CODES.ROL && _slider.data.steps > 0) {
              let step_idx = get_step_idx(_touch_circle.position);
              _touch_group.current_step = step_idx;
              let chan = (_touch_group.msg.press.midi.status & 0x0F) + 1; // _touch_group.msg.press.midi.channel;
              send_midi_msg(note_on(chan, 60 + step_idx, 127));
              if (_slider.data.press === MIDI_TYPE.CONTROL_CHANGE || _slider.data.press === MIDI_TYPE.AFTERTOUCH_POLY) {
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
              }
            } else {
              switch (_slider.data.press) {
                case MIDI_TYPE.NOTE_ON:
                  _touch_group.msg.press.midi.status = (_touch_group.msg.press.midi.status | MIDI_TYPE.NOTE_ON);
                  _touch_group.msg.press.midi.data2 = 127;
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
                case MIDI_TYPE.CONTROL_CHANGE:
                  _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
                case MIDI_TYPE.AFTERTOUCH_POLY:
                  _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
              }
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseUp = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            break;
          case MODE.THROUGH:
            if (_slider.data.move === MOVE_CODES.ROL && _slider.data.steps > 0) {
              if (_touch_group.current_step >= 0) {
                send_midi_msg(note_off(_touch_group.msg.press.midi.status.channel, 60 + _touch_group.current_step, 0));
                _touch_group.current_step = -1;
              }
              if (_slider.data.press === MIDI_TYPE.CONTROL_CHANGE || _slider.data.press === MIDI_TYPE.AFTERTOUCH_POLY) {
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
              }
            } else {
              switch (_slider.data.press) {
                case MIDI_TYPE.NOTE_ON:
                  _touch_group.msg.press.midi.status = midi_msg_status_pack(_touch_group.msg.press.midi.channel, MIDI_TYPE.NOTE_OFF);
                  _touch_group.msg.press.midi.data2 = 0;
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
                case MIDI_TYPE.CONTROL_CHANGE:
                  _touch_group.msg.press.midi.data2 = 0;
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
                case MIDI_TYPE.AFTERTOUCH_POLY:
                  _touch_group.msg.press.midi.data2 = 0;
                  send_midi_msg(_touch_group.msg.press.midi);
                  break;
              }
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.THROUGH) {
          if (_slider.contains(mouseEvent.point)) {
            if (_slider.dir === "V_SLIDER") {
              _touch_line.position.y = mouseEvent.point.y;
              _touch_circle.position.y = mouseEvent.point.y;
              _touch_txt.position = new paper.Point(_touch_circle.position.x + _txt_offset, mouseEvent.point.y);
              _touch_group.msg.pos.midi.data2 = Math.round(
                mapp(mouseEvent.point.y,
                  _slider.children["slider-frame"].bounds.top,
                  _slider.children["slider-frame"].bounds.bottom,
                  _touch_group.msg.pos.limit.min,
                  _touch_group.msg.pos.limit.max
                )
              );
            }
            else { // "H_SLIDER":
              _touch_line.position.x = mouseEvent.point.x;
              _touch_circle.position.x = mouseEvent.point.x;
              _touch_txt.position = new paper.Point(mouseEvent.point.x + _txt_offset, _touch_circle.position.y);
              _touch_group.msg.pos.midi.data2 = Math.round(
                mapp(mouseEvent.point.x,
                  _slider.children["slider-frame"].bounds.left,
                  _slider.children["slider-frame"].bounds.right,
                  _touch_group.msg.pos.limit.min,
                  _touch_group.msg.pos.limit.max
                )
              );
            }
            if (_slider.data.move === MOVE_CODES.ROL && _slider.data.steps > 0) {
              let new_step = get_step_idx(mouseEvent.point);
              if (new_step !== _touch_group.current_step) {
                let chan = (_touch_group.msg.press.midi.status & 0x0F) + 1; // FIXME
                if (_touch_group.current_step >= 0) {
                  send_midi_msg(note_off(chan, 60 + _touch_group.current_step, 0));
                }
                _touch_group.current_step = new_step;
                send_midi_msg(note_on(chan, 60 + new_step, 127));
              }
            } else {
              if (_touch_group.msg.pos.midi.data2 != _touch_group.prev_pos) {
                _touch_group.prev_pos = _touch_group.msg.pos.midi.data2;
                send_midi_msg(_touch_group.msg.pos.midi);
              }
            }
          }
        }
      }
      _touch_group.addChild(_touch_circle);

      const _txt_offset = TOUCH_RADIUS + 8;
      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": new paper.Point(_touch_group.pos.x + _txt_offset, _touch_group.pos.y),
        "content": "T:" + _touch_id + "\npos:" + _touch_group.msg.pos.midi.data1 + "\nz:" + _touch_group.msg.press.midi.data1,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE
      };

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {
      current_frame_width = this.data.to.x - this.data.from.x;
      current_frame_height = this.data.to.y - this.data.from.y;

      let _slider_group = new paper.Group({
        "name": "slider-group",
        "dir": this.dir,
        "data": {
          "touchs": this.data.touchs,
          "input_chan": this.data.input_chan,
          "from": this.data.from,
          "to": this.data.to,
          "move": this.data.move,
          "press": this.data.press,
          "populate": this.data.populate,
          "steps": this.data.steps
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _slider_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_slider_group, _touch, _slider_group.data.touchs));
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
        if (e256_current_mode === MODE.EDIT) {
          this.selected = true;
        }
      }

      _slider_frame.onMouseLeave = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.selected = false;
        }
      }

      _slider_frame.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.EDIT) {
          if (current_part.type === "bounds") {

            // Reposition all touches after a frame resize.
            // scale_x_from_right: true when the right edge is the fixed anchor (top-left, bottom-left corners).
            // scale_y_from_bottom: true when the bottom edge is the fixed anchor (top-left, top-right corners).
            // On direction change (V↔H), touches are distributed evenly along the new axis instead of
            // collapsing to a single point (all touches shared the same perpendicular-axis coordinate).
            const reposition_touches = (bounds, scale_x_from_right, scale_y_from_bottom) => {
              const prev_dir = _slider_group.dir;
              const num = _touchs_group.children.length;
              const cx = bounds.left + (bounds.right - bounds.left) / 2;
              const cy = bounds.top + (bounds.bottom - bounds.top) / 2;
              for (let _i = 0; _i < num; _i++) {
                const _touch = _touchs_group.children[_i];
                const cp = _touch.children["touch-circle"].position;
                let new_x, new_y;
                if (current_frame_height > current_frame_width) {
                  _slider_group.dir = "V_SLIDER";
                  new_x = cx;
                  if (prev_dir === "H_SLIDER") {
                    new_y = bounds.top + ((_i + 1) / (num + 1)) * current_frame_height;
                  } else if (scale_y_from_bottom) {
                    new_y = bounds.bottom - ((bounds.bottom - cp.y) * current_frame_height) / previous_frame_height;
                  } else {
                    new_y = bounds.top + ((cp.y - bounds.top) * current_frame_height) / previous_frame_height;
                  }
                  _touch.children["touch-line"].segments[0].point = new paper.Point(bounds.left, new_y);
                  _touch.children["touch-line"].segments[1].point = new paper.Point(bounds.right, new_y);
                } else {
                  _slider_group.dir = "H_SLIDER";
                  new_y = cy;
                  if (prev_dir === "V_SLIDER") {
                    new_x = bounds.left + ((_i + 1) / (num + 1)) * current_frame_width;
                  } else if (scale_x_from_right) {
                    new_x = bounds.right - ((bounds.right - cp.x) * current_frame_width) / previous_frame_width;
                  } else {
                    new_x = bounds.left + ((cp.x - bounds.left) * current_frame_width) / previous_frame_width;
                  }
                  _touch.children["touch-line"].segments[0].point = new paper.Point(new_x, bounds.top);
                  _touch.children["touch-line"].segments[1].point = new paper.Point(new_x, bounds.bottom);
                }
                const new_pos = new paper.Point(new_x, new_y);
                _touch.children["touch-circle"].position = new_pos;
                _touch.children["touch-txt"].position = new paper.Point(new_x + TOUCH_RADIUS + 8, new_y);
              }
            };

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
                  reposition_touches(this.bounds, true, true);
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
                  reposition_touches(this.bounds, false, true);
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
                  reposition_touches(this.bounds, false, false);
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
                  reposition_touches(this.bounds, true, false);
                  _slider_group.data.from.x = mouseEvent.point.x;
                  _slider_group.data.to.y = mouseEvent.point.y;
                }
                break;
              default:
                break;
            }
            update_item_main_params(_slider_group.parent);
            redraw_steps();
          }
        }
      }

      _slider_group.addChild(_slider_frame);

      function redraw_steps() {
        let existing = _slider_group.children["steps-group"];
        if (existing) existing.remove();
        let steps = _slider_group.data.steps;
        if (_slider_group.data.move !== MOVE_CODES.ROL || !steps || steps < 2) return;
        let b = _slider_frame.bounds;
        let _steps_group = new paper.Group({ "name": "steps-group" });
        for (let i = 0; i < steps; i++) {
          let t0 = i / steps;
          let t1 = (i + 1) / steps;
          let cell = (_slider_group.dir === "V_SLIDER")
            ? new paper.Path.Rectangle(
                new paper.Point(b.left,              b.top + t0 * b.height),
                new paper.Point(b.right,             b.top + t1 * b.height))
            : new paper.Path.Rectangle(
                new paper.Point(b.left + t0 * b.width, b.top),
                new paper.Point(b.left + t1 * b.width, b.bottom));
          cell.fillColor   = null;
          cell.strokeColor = "#606060";
          cell.strokeWidth = 0.5;
          _steps_group.addChild(cell);
        }
        _steps_group.locked = true;
        _slider_group.insertChild(1, _steps_group);
        paper.view.update();
      }
      _slider_group.redraw_steps = redraw_steps;
      redraw_steps();

      this.addChild(_slider_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === MODE.EDIT) {
        if (current_part.type === "fill") {
          move_item(this, mouseEvent);
          update_item_main_params(this);
        }
      }
    },

    // Called by midi_play_update_all() in PLAY mode for each incoming MIDI message.
    // CC  → moves every touch whose pos.midi matches (status + data1) along the slider axis.
    // NoteOn/Off (ROL) → colors the matching step cell red (active) or clears it (released).
    //   Firmware pre-fills step_note[i] = 60 + i (mapp_slider.cpp:316), so step_idx = note - 60.
    midi_play_update: function(msg) {
      let status = midi_msg_status_unpack(msg.status);
      let slider_group = this.children["slider-group"];
      let touchs_group = this.children["touchs-group"];
      let updated = false;

      if (status.type === MIDI_TYPE.CONTROL_CHANGE) {
        let frame = slider_group.children["slider-frame"];
        for (let touch_group of touchs_group.children) {
          let pos_midi = touch_group.msg.pos.midi;
          if (pos_midi.status === msg.status && pos_midi.data1 === msg.data1) {
            let limit = touch_group.msg.pos.limit;
            if (this.dir === "V_SLIDER") {
              let y = mapp(msg.data2, limit.min, limit.max, frame.bounds.top, frame.bounds.bottom);
              touch_group.children["touch-line"].position.y   = y;
              touch_group.children["touch-circle"].position.y = y;
              touch_group.children["touch-txt"].position.y    = y;
              // x stays fixed at circle.x + offset (set at creation)
            } else {
              let x = mapp(msg.data2, limit.min, limit.max, frame.bounds.left, frame.bounds.right);
              touch_group.children["touch-line"].position.x   = x;
              touch_group.children["touch-circle"].position.x = x;
              touch_group.children["touch-txt"].position.x    = x + TOUCH_RADIUS + 8;
            }
            updated = true;
            break;
          }
        }

      } else if (status.type === MIDI_TYPE.NOTE_ON || status.type === MIDI_TYPE.NOTE_OFF) {
        let steps_group = slider_group.children["steps-group"];
        if (!steps_group) return;
        for (let touch_group of touchs_group.children) {
          if ((touch_group.msg.press.midi.status & 0x0F) === (msg.status & 0x0F)) {
            let step_idx = msg.data1 - 60; // firmware default: step_note[i] = 60 + i
            if (step_idx < 0 || step_idx >= steps_group.children.length) return;
            let active = (status.type === MIDI_TYPE.NOTE_ON && msg.data2 > 0);
            steps_group.children[step_idx].fillColor = active ? "red" : null;
            updated = true;
            break;
          }
        }
      }

      if (updated) paper.view.update();
    }

  });

  return _slider;
};
