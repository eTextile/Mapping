/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TOUCHPAD Factory
function touchpad_factory() {

  const DEFAULT = {
    WIDTH: 450,
    HEIGHT: 450,
    TOUCH_MARGIN: 35,
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
    MODE_X: MIDI_TYPE.CONTROL_CHANGE,
    MODE_Y: MIDI_TYPE.CONTROL_CHANGE,
    MODE_Z: MIDI_TYPE.NOTE_ON,
    MODE_SIZE: MIDI_TYPE.CONTROL_CHANGE,
    TOUCHS: 1
  };

  let current_frame_width = null;
  let previous_frame_width = null;
  let current_frame_height = null;
  let previous_frame_height = null;

  var _touchpad = new paper.Group({
    "name": "touchpad",
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "chan": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT.TOUCHS;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT.WIDTH / 2),
        mouseEvent.point.y - (DEFAULT.HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT.WIDTH / 2),
        mouseEvent.point.y + (DEFAULT.HEIGHT / 2)
      );
      this.data.chan = { in: MIDI_DEFAULT.INPUT_CHANNEL, out: MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT.TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos_x  = midi_msg_builder(DEFAULT.MODE_X);
        touch_msg.pos_y  = midi_msg_builder(DEFAULT.MODE_Y);
        touch_msg.size   = Object.assign(midi_msg_builder(DEFAULT.MODE_SIZE), { enabled: false });
        touch_msg.move   = Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press  = midi_msg_builder(DEFAULT.MODE_Z);
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
      this.data.chan = { in: params.chan?.in || MIDI_DEFAULT.INPUT_CHANNEL, out: params.chan?.out || MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.msg = params.msg;
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["pad-group"].data.touchs;

      this.data.from = this.children["pad-group"].data.from;
      this.data.to = this.children["pad-group"].data.to;
      this.data.chan = this.children["pad-group"].data.chan;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        const prev = (_touch < previous_touch_count)
          ? this.children["touchs-group"].children[_touch].msg
          : {};
        touch_msg.pos_x  = prev.pos_x  || midi_msg_builder(DEFAULT.MODE_X);
        touch_msg.pos_y  = prev.pos_y  || midi_msg_builder(DEFAULT.MODE_Y);
        touch_msg.size   = prev.size   || Object.assign(midi_msg_builder(DEFAULT.MODE_SIZE), { enabled: false });
        touch_msg.move   = prev.move   || Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press  = prev.press  || midi_msg_builder(DEFAULT.MODE_Z);
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_touchpad, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "pos": new paper.Point(
          get_random_int(this.data.from.x + DEFAULT.TOUCH_MARGIN, this.data.to.x - DEFAULT.TOUCH_MARGIN),
          get_random_int(this.data.from.y + DEFAULT.TOUCH_MARGIN, this.data.to.y - DEFAULT.TOUCH_MARGIN)
        ),
        "msg": this.data.msg[_touch_id],
        "prev_pos_x": null,
        "prev_pos_y": null,
        "prev_pos_z": null
      });

      let _vel_xy = 0;
      let _last_move_t = 0;

      let _touch_line_x = new paper.Path.Line({
        "name": "touch-line-x",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });

      _touch_line_x.style = {
        "strokeWidth": 1,
        "dashArray": [2, 4],
        "strokeColor": TOUCH_IDLE_COLOR
      }

      _touch_group.addChild(_touch_line_x);

      let _touch_line_y = new paper.Path.Line({
        "name": "touch-line-y",
        "from": new paper.Point(_touch_group.pos.x, this.data.from.y),
        "to": new paper.Point(_touch_group.pos.x, this.data.to.y),
        "locked": true
      });

      _touch_line_y.style = {
        "strokeWidth": 1,
        "dashArray": [2, 4],
        "strokeColor": TOUCH_IDLE_COLOR
      }

      _touch_group.addChild(_touch_line_y);

      let _touch_circle = make_touch_circle(_touch_group.pos, { "fillColor": TOUCH_IDLE_COLOR });

      _touch_circle.on("mouseenter", function () {
        if (e256_current_mode === MODE.EDIT && !touch_selection_locked) show_only_touch(_touch_group);
      });

      _touch_circle.onMouseDown = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            show_only_touch(_touch_group, true);
            touch_selection_locked = true;
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = performance.now();
            touch_press_down(_touchpad, _touch_group);
            if (press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.NOTE_ON || press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.CHORD) {
              this.style.fillColor = "red";
              paper.view.update();
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
            // N/A
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = 0;
            touch_press_up(_touchpad, _touch_group);
            if (press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.NOTE_ON || press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.CHORD) {
              this.style.fillColor = TOUCH_IDLE_COLOR;
              paper.view.update();
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            // N/A
            break;
          case MODE.THROUGH:
            if (_touchpad.contains(mouseEvent.point)) {
              _touch_line_x.position.y = mouseEvent.point.y;
              _touch_line_y.position.x = mouseEvent.point.x
              _touch_circle.position = mouseEvent.point;
              _touch_txt.position = mouseEvent.point;

              if (_touch_group.msg.pos_x && _touch_group.msg.pos_x.enabled !== false) {
                _touch_group.prev_pos_x = _touch_group.msg.pos_x.midi.data2;
                _touch_group.msg.pos_x.midi.data2 = Math.round(
                  mapp(mouseEvent.point.x,
                    _touchpad.children["pad-frame"].bounds.left,
                    _touchpad.children["pad-frame"].bounds.right,
                    _touch_group.msg.pos_x.limit.min,
                    _touch_group.msg.pos_x.limit.max
                  )
                );
                if (_touch_group.msg.pos_x.midi.data2 != _touch_group.prev_pos_x) {
                  send_midi_msg(_touch_group.msg.pos_x.midi);
                }
              }

              if (_touch_group.msg.pos_y && _touch_group.msg.pos_y.enabled !== false) {
                _touch_group.prev_pos_y = _touch_group.msg.pos_y.midi.data2;
                _touch_group.msg.pos_y.midi.data2 = Math.round(
                  mapp(mouseEvent.point.y,
                    _touchpad.children["pad-frame"].bounds.top,
                    _touchpad.children["pad-frame"].bounds.bottom,
                    _touch_group.msg.pos_y.limit.min,
                    _touch_group.msg.pos_y.limit.max
                  )
                );
                if (_touch_group.msg.pos_y.midi.data2 != _touch_group.prev_pos_y) {
                  send_midi_msg(_touch_group.msg.pos_y.midi);
                }
              }
              if (_touch_group.msg.move && _touch_group.msg.move.enabled) {
                const now = performance.now();
                const dt_s = Math.max(0.001, (now - _last_move_t) / 1000);
                const dx = mouseEvent.delta.x * NEW_COLS / canvas_width;
                const dy = mouseEvent.delta.y * NEW_ROWS / canvas_height;
                _vel_xy = 0.5 * Math.sqrt(dx * dx + dy * dy) / dt_s + 0.5 * _vel_xy;
                _last_move_t = now;
                _touch_group.msg.move.midi.data2 = Math.max(0, Math.min(127, Math.round(_vel_xy * 127 / 120)));
                send_midi_msg(_touch_group.msg.move.midi);
              }
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      };

      _touch_group.addChild(_touch_circle);

      let _touch_size_ring = new paper.Shape.Circle({
        "name": "touch-size-ring",
        "center": _touch_group.pos,
        "radius": TOUCH_RADIUS
      });
      _touch_size_ring.style = {
        "strokeColor": "#FF8C00",
        "strokeWidth": 1.5,
        "fillColor": null
      };
      _touch_size_ring.visible = false;
      _touch_group.addChild(_touch_size_ring);

      let _touch_arc = make_touch_arc(_touch_group.pos);
      _touch_group.addChild(_touch_arc);

      let _touch_txt = make_touch_txt(
        _touch_group.pos,
        String(_touch_id + 1),
        { fontSize: FONT_SIZE * 2, fontWeight: "bold", justification: "center", fillColor: "white" }
      );
      _touch_txt.position = _touch_group.pos;

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {
      current_frame_width = this.data.to.x - this.data.from.x;
      current_frame_height = this.data.to.y - this.data.from.y;

      let _pad_group = new paper.Group({
        "name": "pad-group",
        "modes_z": this.modes_z,
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "chan": this.data.chan
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
          case MODE.EDIT:
            this.selected = true;
            break;
          case MODE.THROUGH:
            break;
          case MODE.PLAY:
            break;
        }
      }

      _pad_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            this.selected = false;
            break;
          case MODE.THROUGH:
            break;
          case MODE.PLAY:
            break;
        }
      }

      /*
      _pad_frame.onMouseDown = function () {
      }
      */

      _pad_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            if (current_part.type === "bounds") {
              let new_size = new paper.Point();
              let new_pos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  previous_frame_width = current_frame_width;
                  current_frame_width = Math.max(DEFAULT.MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT.MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT.MIN_WIDTH && current_frame_height >= DEFAULT.MIN_HEIGHT) {
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
                  current_frame_width = Math.max(DEFAULT.MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT.MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  if (current_frame_width >= DEFAULT.MIN_WIDTH && current_frame_height >= DEFAULT.MIN_HEIGHT) {
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
                  current_frame_width = Math.max(DEFAULT.MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  current_frame_height = Math.max(DEFAULT.MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT.MIN_WIDTH && current_frame_height >= DEFAULT.MIN_HEIGHT) {
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
                  current_frame_width = Math.max(DEFAULT.MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  previous_frame_height = current_frame_height;
                  current_frame_height = Math.max(DEFAULT.MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  if (current_frame_width >= DEFAULT.MIN_WIDTH && current_frame_height >= DEFAULT.MIN_HEIGHT) {
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
                  //console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_main_params(_pad_group.parent);
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _pad_group.addChild(_pad_frame);

      _pad_group.fit_to_canvas = function() {
        this.data.from = new paper.Point(0, 0);
        this.data.to = new paper.Point(canvas_width, canvas_height);
        current_frame_width = canvas_width;
        current_frame_height = canvas_height;
        _pad_frame.segments[0].point = new paper.Point(0, canvas_height);
        _pad_frame.segments[1].point = new paper.Point(0, 0);
        _pad_frame.segments[2].point = new paper.Point(canvas_width, 0);
        _pad_frame.segments[3].point = new paper.Point(canvas_width, canvas_height);
        const cx = canvas_width / 2;
        const cy = canvas_height / 2;
        for (const touch of _touchs_group.children) {
          touch.children["touch-line-x"].segments[0].point = new paper.Point(0, cy);
          touch.children["touch-line-x"].segments[1].point = new paper.Point(canvas_width, cy);
          touch.children["touch-line-y"].segments[0].point = new paper.Point(cx, 0);
          touch.children["touch-line-y"].segments[1].point = new paper.Point(cx, canvas_height);
          touch.children["touch-circle"].position = new paper.Point(cx, cy);
          touch.children["touch-txt"].position = new paper.Point(cx, cy);
        }
        update_item_main_params(this.parent);
      };

      this.addChild(_pad_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case MODE.EDIT:
          if (current_part.type === "fill") {
            move_item(this, mouseEvent);
            update_item_main_params(this);
          }
          break;
        case MODE.THROUGH:
          // N/A
          break;
        case MODE.PLAY:
          // N/A
          break;
      }
    },

    // Called by midi_play_blob_update_all() in PLAY/THROUGH mode for each incoming SysEx blob.
    // Uses blob UID for touch identity — immune to shared-CC configuration.
    midi_play_blob_update: function(sysExMsg) {
      const frame = this.children["pad-group"].children["pad-frame"];
      blob_update_touch_visual(sysExMsg, this.children["touchs-group"], (touch_group, cx, cy, active) => {
        if (active && (!frame || !frame.contains(new paper.Point(cx, cy)))) return false;
        const line_x   = touch_group.children["touch-line-x"];
        const line_y   = touch_group.children["touch-line-y"];
        const size_ring = touch_group.children["touch-size-ring"];
        touch_group._blob_positioned = active;
        if (active) {
          const x = Math.max(frame.bounds.left, Math.min(frame.bounds.right,  cx));
          const y = Math.max(frame.bounds.top,  Math.min(frame.bounds.bottom, cy));
          const pt = new paper.Point(x, y);
          line_x.position.y = y;
          line_y.position.x = x;
          touch_group.children["touch-circle"].position = pt;
          touch_group.children["touch-txt"].position    = pt;
          if (size_ring && touch_group.msg.size?.enabled !== false) {
            const raw_w = sysExMsg[BLOB_PARAM_CODE.WIDTH];
            const raw_h = sysExMsg[BLOB_PARAM_CODE.HEIGHT];
            const sz = Math.round(mapp(raw_w * raw_h, 0, BLOB_MAX_SIZE, 0, 127));
            size_ring.radius   = TOUCH_RADIUS + 5 + (sz / 127) * (TOUCH_RADIUS * 3);
            size_ring.position = pt;
            size_ring.visible  = true;
          }
          touch_note_on_arc_update(touch_group, "touch-circle");
        }
        if (line_x) line_x.visible = active;
        if (line_y) line_y.visible = active;
        if (size_ring && (!active || touch_group.msg.size?.enabled === false)) size_ring.visible = false;
        return true;
      });
    },

    // Called by midi_play_update_all() in PLAY mode for each incoming MIDI message.
    // CC pos_x / pos_y → moves the touch + redraws pressure arc at new position.
    // CC / NoteOn / NoteOff / AfterTouchPoly matching press midi → updates pressure arc.
    midi_play_update: function(msg) {
      let status = midi_msg_status_unpack(msg.status);
      let frame = this.children["pad-group"].children["pad-frame"];
      let touchs_group = this.children["touchs-group"];
      if (!touchs_group) return;
      let updated = false;

      if (status.type === MIDI_TYPE.CONTROL_CHANGE) {
        for (let touch_group of touchs_group.children) {
          const press = touch_group.msg.press;
          const press_midi = (press && press.enabled !== false) ? press.midi : null;
          if (press_midi && (press_midi.status & 0xF0) === MIDI_TYPE.CONTROL_CHANGE &&
              press_midi.status === msg.status && press_midi.data1 === msg.data1) {
            touch_group.last_press_value = msg.data2;
            const active = msg.data2 > 0;
            const touch_el  = touch_group.children["touch-circle"];
            const touch_txt = touch_group.children["touch-txt"];
            const line_x    = touch_group.children["touch-line-x"];
            const line_y    = touch_group.children["touch-line-y"];
            if (touch_el)  touch_el.visible  = active;
            if (touch_txt) touch_txt.visible = active;
            if (line_x)    line_x.visible    = active;
            if (line_y)    line_y.visible    = active;
            update_touch_arc(touch_group, msg.data2);
            updated = true;
            break;
          }

          const size = touch_group.msg.size;
          const size_midi = (size && size.enabled !== false) ? size.midi : null;
          if (size_midi && size_midi.status === msg.status && size_midi.data1 === msg.data1) {
            touch_group.last_size_value = msg.data2;
            const size_ring = touch_group.children["touch-size-ring"];
            if (size_ring && size_ring.visible) {
              size_ring.radius = TOUCH_RADIUS + 5 + (msg.data2 / 127) * (TOUCH_RADIUS * 3);
            }
            updated = true;
            break;
          }
        }
      }
      else if (status.type === MIDI_TYPE.NOTE_ON || status.type === MIDI_TYPE.NOTE_OFF ||
               status.type === MIDI_TYPE.AFTERTOUCH_POLY) {
        for (let touch_group of touchs_group.children) {
          if (!touch_group.msg.press || touch_group.msg.press.enabled === false) continue;
          let press_midi = touch_group.msg.press.midi;
          if (!press_midi) continue;
          if ((press_midi.status & MIDI_CHANNEL_MASK) !== (msg.status & MIDI_CHANNEL_MASK)) continue;
          if (press_midi.data1 !== msg.data1) continue;
          let value = 0;
          if (status.type === MIDI_TYPE.NOTE_ON && msg.data2 > 0) value = msg.data2;
          else if (status.type === MIDI_TYPE.AFTERTOUCH_POLY)     value = msg.data2;
          touch_group.last_press_value = value;
          if (value > 0) {
            if (touch_group._blob_positioned) update_touch_arc(touch_group, value);
          } else {
            touch_note_off_reset(touch_group, ["touch-circle", "touch-txt", "touch-line-x", "touch-line-y"]);
          }
          updated = true;
          break;
        }
      }

      if (updated) paper.view.update();
    }
  });

  return _touchpad;
};
