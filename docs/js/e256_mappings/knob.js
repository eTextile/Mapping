/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
// Multitouch MIDI knob GUI
function knob_factory() {
 
  const DEFAULT = {
    TOUCHS: 1,
    RADIUS: 250,
    OFFSET: -45,
    MIN_SIZE: 150,
    MODE_R: MIDI_TYPE.CONTROL_CHANGE,
    MODE_T: MIDI_TYPE.CONTROL_CHANGE,
    MODE_Z: MIDI_TYPE.NOTE_ON
  }

  var _knob = new paper.Group({
    "name": "knob",
    "center": null,
    "radius": null,
    "theta": null,
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "offset": null,
      "chan": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT.TOUCHS;
      this.radius = DEFAULT.RADIUS;
      this.data.from = new paper.Point(
        mouseEvent.point.x - this.radius,
        mouseEvent.point.y - this.radius
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + this.radius,
        mouseEvent.point.y + this.radius
      );
      this.data.offset = DEFAULT.OFFSET;
      this.data.chan = { in: MIDI_DEFAULT.INPUT_CHANNEL, out: MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.center = mouseEvent.point;
      this.theta = deg_to_rad(DEFAULT.OFFSET);
      this.data.msg = [];
      let touch_msg;
      for (let _touch = 0; _touch < DEFAULT.TOUCHS; _touch++) {
        touch_msg = {};
        touch_msg.radius = Object.assign(midi_msg_builder(DEFAULT.MODE_R),           { enabled: true });
        touch_msg.theta  = Object.assign(midi_msg_builder(DEFAULT.MODE_T),           { enabled: true });
        touch_msg.move   = Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press  = Object.assign(midi_msg_builder(DEFAULT.MODE_Z),           { enabled: true });
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
      this.data.offset = params.offset;
      this.data.chan = { in: params.chan?.in || MIDI_DEFAULT.INPUT_CHANNEL, out: params.chan?.out || MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.msg = params.msg;
      this.radius = (this.data.to.x - this.data.from.x) / 2;
      this.center = new paper.Point(this.data.from.x + this.radius, this.data.from.y + this.radius);
      this.theta = deg_to_rad(this.data.offset);
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["knob-group"].data.touchs;
      this.data.from = this.children["knob-group"].data.from;
      this.data.to = this.children["knob-group"].data.to;
      this.data.offset = this.children["knob-group"].data.offset;
      this.data.chan = this.children["knob-group"].data.chan;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        const prev = (_touch < previous_touch_count)
          ? this.children["touchs-group"].children[_touch].msg
          : {};
        touch_msg.radius = prev.radius || Object.assign(midi_msg_builder(DEFAULT.MODE_R),           { enabled: true });
        touch_msg.theta  = prev.theta  || Object.assign(midi_msg_builder(DEFAULT.MODE_T),           { enabled: true });
        touch_msg.move   = prev.move   || Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press  = prev.press  || Object.assign(midi_msg_builder(DEFAULT.MODE_Z),           { enabled: true });
        this.data.msg.push(touch_msg);
      }
      // Recompute from data, not from Paper.js visual properties: the knob-group's .center
      // and .radius are only updated when the user drags, not when from/to are edited via inputs.
      this.radius = (this.data.to.x - this.data.from.x) / 2;
      this.center = new paper.Point(this.data.from.x + this.radius, this.data.from.y + this.radius);
      this.theta = deg_to_rad(this.children["knob-group"].data.offset);
    },

    new_touch: function (_knob, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "center": this.center,
        "radius": get_random_int(50, this.radius - 10),
        "theta": deg_to_rad(get_random_int(0, 360)),
        "msg": this.data.msg[_touch_id],
        "prev_pos_r": null,
        "prev_pos_t": null,
        "prev_pos_z": null,
      });

      let _vel_xy = 0;
      let _last_move_t = 0;

      let _knob_touch_pos = pol_to_cart(_touch_group.radius, _touch_group.theta);

      let _knob_needle = new paper.Path.Line({
        "name": "knob-needle",
        "from": _touch_group.center,
        "to": new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y),
        "locked": true
      });

      _knob_needle.style = {
        "strokeCap": "round",
        "strokeColor": TOUCH_IDLE_COLOR,
        "strokeWidth": 1,
        "dashArray": [2, 4]
      }

      let _knob_touch = new paper.Shape.Circle({
        "name": "knob-touch",
        "center": new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y),
        "radius": TOUCH_RADIUS
      });

      _knob_touch.style = {
        "fillColor": TOUCH_IDLE_COLOR
      }

      _knob_touch.onMouseEnter = function () {
        this.style.fillColor = "red";
        if (e256_current_mode === MODE.EDIT && !touch_selection_locked) show_only_touch(_touch_group);
      }

      _knob_touch.onMouseLeave = function () {
        if (!(touch_selection_locked && current_touch.id === _touch_group.id)) this.style.fillColor = TOUCH_IDLE_COLOR;
      }

      _knob_touch.onMouseDown = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            show_only_touch(_touch_group, true);
            touch_selection_locked = true;
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = performance.now();
            touch_press_down(_knob, _touch_group);
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

      _knob_touch.onMouseUp = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = 0;
            touch_press_up(_knob, _touch_group);
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

      _knob_touch.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            // N/A
            break;
          case MODE.THROUGH:
            let x = mouseEvent.point.x - _knob.center.x; // Place the x origin to the circle center
            let y = mouseEvent.point.y - _knob.center.y; // Place the y origin to the circle center
            let polar = cart_to_pol(x, y);
            let new_polar = 0;
            if (polar.radius > _knob.radius) {
              new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'clockwise');
              //new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'counter-clockwise');
              _touch_group.msg.theta.midi.data2 = Math.round(mapp(new_polar, 0, 360, _touch_group.msg.theta.limit.min, _touch_group.msg.theta.limit.max));
              _knob_touch_pos = pol_to_cart(_knob.radius, polar.theta);
            } else {
              _touch_group.msg.radius.midi.data2 = Math.round(mapp(polar.radius, 0, _knob.radius, _touch_group.msg.radius.limit.min, _touch_group.msg.radius.limit.max));
              new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'clockwise');
              //new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'counter-clockwise');
              _touch_group.msg.theta.midi.data2 = Math.round(mapp(new_polar, 0, 360, _touch_group.msg.theta.limit.min, _touch_group.msg.theta.limit.max));
              _knob_touch_pos = pol_to_cart(polar.radius, polar.theta);
            }
            _knob_touch.position = new paper.Point(_knob.center.x + _knob_touch_pos.x, _knob.center.y + _knob_touch_pos.y);
            _knob_needle.segments[1].point = _knob_touch.position;
            _touch_txt.position = _knob_touch.position;

            if (_touch_group.msg.radius && _touch_group.msg.radius.enabled !== false &&
                _touch_group.msg.radius.midi.data2 != _touch_group.prev_pos_r) {
              _touch_group.prev_pos_r = _touch_group.msg.radius.midi.data2;
              send_midi_msg(_touch_group.msg.radius.midi);
            }
            if (_touch_group.msg.theta && _touch_group.msg.theta.enabled !== false &&
                _touch_group.msg.theta.midi.data2 != _touch_group.prev_pos_t) {
              _touch_group.prev_pos_t = _touch_group.msg.theta.midi.data2;
              send_midi_msg(_touch_group.msg.theta.midi);
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
            break;
          case MODE.PLAY:
            break;
        }
      }

      let _knob_touch_center = new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y);
      let _touch_txt = make_touch_txt(
        _knob_touch_center,
        String(_touch_id + 1),
        { fontSize: FONT_SIZE * 2, fontWeight: "bold", justification: "center", fillColor: "white" }
      );
      _touch_txt.position = _knob_touch_center;

      let _knob_touch_arc = make_touch_arc(new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y));

      _touch_group.addChild(_knob_needle);
      _touch_group.addChild(_knob_touch);
      _touch_group.addChild(_knob_touch_arc);
      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {

      let _knob_group = new paper.Group({
        "name": "knob-group",
        "modes_z": this.modes_z,
        "center": this.center,
        "radius": this.radius,
        "theta": this.theta,
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "offset": this.data.offset,
          "chan": this.data.chan
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _knob_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_knob_group, _touch));
      }

      // Build a conic gradient circle using N triangular sectors (white→purple over upper half).
      function build_conic(cx, cy, r, start_angle) {
        const N = 72;
        const step = 2 * Math.PI / N;
        const overlap = step * 0.3;
        let grp = new paper.Group({ "name": "knob-conic" });
        for (let i = 0; i < N; i++) {
          const a1 = start_angle + i * step;
          const a2 = (i === N - 1) ? a1 + step : a1 + step + overlap;
          const t = i / (N - 1);
          const s = new paper.Path([
            new paper.Point(cx, cy),
            new paper.Point(cx + r * Math.cos(a1), cy + r * Math.sin(a1)),
            new paper.Point(cx + r * Math.cos(a2), cy + r * Math.sin(a2))
          ]);
          s.closed = true;
          s.strokeWidth = 0;
          s.strokeColor = null;
          s.fillColor = new paper.Color(1 - 0.498 * t, 1 - t, 1 - 0.498 * t);
          grp.addChild(s);
        }
        return grp;
      }

      function refresh_conic() {
        const old = _knob_group.children["knob-conic"];
        const idx = old ? old.index : 1;
        if (old) old.remove();
        _knob_group.insertChild(idx, build_conic(_knob_group.center.x, _knob_group.center.y, _knob_group.radius, _knob_group.theta));
      }

      let _knob_circle = new paper.Shape.Circle({
        //"name": "knob-circle",
        "center": _knob_group.center,
        "radius": _knob_group.radius
      });

      _knob_circle.style = {
        "strokeWidth": 0,
        "strokeColor": null,
        "fillColor": new paper.Color(1, 1, 1, 0.01)
      };

      _knob_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            if (current_part.type === "fill") {
              move_item(_knob_group.parent, mouseEvent);
              _knob_group.center = this.position;
              _knob_group.data.from = new paper.Point(this.position.x - _knob_group.radius, this.position.y - _knob_group.radius);
              _knob_group.data.to   = new paper.Point(this.position.x + _knob_group.radius, this.position.y + _knob_group.radius);
              refresh_conic();
              update_item_main_params(_knob_group.parent);
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      let _knob_offset_pos = pol_to_cart(_knob_group.radius, _knob_group.theta);
      let _knob_offset = new paper.Shape.Circle({
        //"name": "knob-offset",
        "center": new paper.Point(_knob_group.center.x + _knob_offset_pos.x, _knob_group.center.y + _knob_offset_pos.y),
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure!
      });

      _knob_offset.style = {
        "fillColor": "red"
      }

      _knob_offset.onMouseDrag = function (mouseEvent) {

        switch (e256_current_mode) {
          case MODE.EDIT:
            _knob_group.theta = cart_to_pol(
              mouseEvent.point.x - _knob_group.center.x,
              mouseEvent.point.y - _knob_group.center.y
            ).theta;

            _knob_offset_pos = pol_to_cart(_knob_group.radius, _knob_group.theta);
            this.position = new paper.Point(
              _knob_group.center.x + _knob_offset_pos.x,
              _knob_group.center.y + _knob_offset_pos.y
            );

            _knob_group.data.offset = rad_to_deg(_knob_group.theta);
            refresh_conic();
            update_item_main_params(_knob_group.parent);
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      let _knob_frame = new paper.Path.Rectangle({
        "name": "key-frame",
        "from": _knob_group.data.from,
        "to": _knob_group.data.to
      });

      _knob_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": new paper.Color(1, 0, 0, 0.01)
      }

      _knob_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            this.selected = true;
            break;
          case MODE.PLAY:
            break;
        }
      }

      _knob_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            this.selected = false;
            break;
          case MODE.PLAY:
            break;
        }
      }

      _knob_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            if (current_part.type === "bounds") {
              switch (current_part.name) {
                case "top-left": {
                  const side = this.bounds.right - mouseEvent.point.x;
                  if (side < DEFAULT.MIN_SIZE * 2) break;
                  this.segments[0].point   = new paper.Point(mouseEvent.point.x, mouseEvent.point.y + side);
                  this.segments[1].point   = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  this.segments[3].point.y = mouseEvent.point.y + side;
                  _knob_group.data.from    = mouseEvent.point;
                  _knob_group.data.to.y    = mouseEvent.point.y + side;
                  break;
                }
                case "top-right": {
                  const side = mouseEvent.point.x - this.bounds.left;
                  if (side < DEFAULT.MIN_SIZE * 2) break;
                  this.segments[1].point.y = mouseEvent.point.y;
                  this.segments[2].point   = mouseEvent.point;
                  this.segments[3].point.x = mouseEvent.point.x;
                  this.segments[0].point.y = mouseEvent.point.y + side;
                  this.segments[3].point.y = mouseEvent.point.y + side;
                  _knob_group.data.from.y  = mouseEvent.point.y;
                  _knob_group.data.to.x    = mouseEvent.point.x;
                  _knob_group.data.to.y    = mouseEvent.point.y + side;
                  break;
                }
                case "bottom-right": {
                  const side = mouseEvent.point.x - this.bounds.left;
                  if (side < DEFAULT.MIN_SIZE * 2) break;
                  this.segments[2].point   = new paper.Point(mouseEvent.point.x, mouseEvent.point.y - side);
                  this.segments[3].point   = mouseEvent.point;
                  this.segments[0].point.y = mouseEvent.point.y;
                  this.segments[1].point.y = mouseEvent.point.y - side;
                  _knob_group.data.from.y  = mouseEvent.point.y - side;
                  _knob_group.data.to      = mouseEvent.point;
                  break;
                }
                case "bottom-left": {
                  const side = this.bounds.right - mouseEvent.point.x;
                  if (side < DEFAULT.MIN_SIZE * 2) break;
                  this.segments[3].point.y = mouseEvent.point.y;
                  this.segments[0].point   = mouseEvent.point;
                  this.segments[1].point   = new paper.Point(mouseEvent.point.x, mouseEvent.point.y - side);
                  this.segments[2].point.y = mouseEvent.point.y - side;
                  _knob_group.data.from    = new paper.Point(mouseEvent.point.x, mouseEvent.point.y - side);
                  _knob_group.data.to.y    = mouseEvent.point.y;
                  break;
                }
                default:
                  break;
              }
              const new_radius = (_knob_group.data.to.x - _knob_group.data.from.x) / 2;
              const scale      = new_radius / _knob_circle.radius;
              _knob_group.radius    = new_radius;
              _knob_circle.radius   = new_radius;
              _knob_group.center    = new paper.Point(
                _knob_group.data.from.x + new_radius,
                _knob_group.data.from.y + new_radius
              );
              _knob_circle.position = _knob_group.center;
              refresh_conic();
              _knob_offset_pos = pol_to_cart(new_radius, deg_to_rad(_knob_group.data.offset));
              _knob_offset.position.x = _knob_group.center.x + _knob_offset_pos.x;
              _knob_offset.position.y = _knob_group.center.y + _knob_offset_pos.y;
              for (const _touch of _touchs_group.children) {
                _touch.radius *= scale;
                const tp      = pol_to_cart(_touch.radius, _touch.theta);
                const new_pos = new paper.Point(_knob_group.center.x + tp.x, _knob_group.center.y + tp.y);
                _touch.children["knob-touch"].position           = new_pos;
                _touch.children["touch-txt"].position            = new_pos;
                _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                _touch.children["knob-needle"].segments[1].point = new_pos;
              }
              update_item_main_params(_knob_group.parent);
            }
            break;
          case MODE.PLAY:
            //TODO
            break;
        }
      }
     
      _knob_group.addChild(_knob_frame);
      _knob_group.addChild(build_conic(_knob_group.center.x, _knob_group.center.y, _knob_group.radius, _knob_group.theta));
      _knob_group.addChild(_knob_circle);
      _knob_group.addChild(_knob_offset);

      _knob_group.fit_to_canvas = function() {
        const old_radius = this.radius;
        const new_radius = canvas_width / 2;
        const scale = old_radius > 0 ? new_radius / old_radius : 1;
        const cx = canvas_width / 2;
        const cy = canvas_height / 2;
        this.data.from = new paper.Point(0, 0);
        this.data.to = new paper.Point(canvas_width, canvas_height);
        this.radius = new_radius;
        this.center = new paper.Point(cx, cy);
        this.children["key-frame"].segments[0].point = new paper.Point(0, canvas_height);
        this.children["key-frame"].segments[1].point = new paper.Point(0, 0);
        this.children["key-frame"].segments[2].point = new paper.Point(canvas_width, 0);
        this.children["key-frame"].segments[3].point = new paper.Point(canvas_width, canvas_height);
        _knob_circle.radius = new_radius;
        _knob_circle.position = this.center;
        refresh_conic();
        _knob_offset_pos = pol_to_cart(new_radius, deg_to_rad(this.data.offset));
        _knob_offset.position.x = cx + _knob_offset_pos.x;
        _knob_offset.position.y = cy + _knob_offset_pos.y;
        for (const touch of _touchs_group.children) {
          touch.radius = Math.min(touch.radius * scale, new_radius - 10);
          const tp = pol_to_cart(touch.radius, touch.theta);
          const new_pos = new paper.Point(cx + tp.x, cy + tp.y);
          touch.children["knob-touch"].position = new_pos;
          touch.children["touch-txt"].position = new_pos;
          touch.children["knob-needle"].segments[0].point = this.center;
          touch.children["knob-needle"].segments[1].point = new_pos;
        }
        update_item_main_params(this.parent);
      };

      this.addChild(_knob_group);
      this.addChild(_touchs_group);
    },

    midi_play_blob_update: function(sysExMsg) {
      const knob_group = this.children["knob-group"];
      blob_update_touch_visual(sysExMsg, this.children["touchs-group"], (touch_group, cx, cy, active) => {
        if (!knob_group) return false;
        const dx = cx - knob_group.center.x;
        const dy = cy - knob_group.center.y;
        if (active && Math.hypot(dx, dy) > knob_group.radius) return false;
        touch_group._blob_positioned = active;
        if (active) {
          const new_pos = new paper.Point(cx, cy);
          touch_group.radius = Math.hypot(dx, dy);
          touch_group.theta  = Math.atan2(dy, dx);
          touch_group.children["knob-touch"].position           = new_pos;
          touch_group.children["knob-needle"].segments[1].point = new_pos;
          touch_group.children["touch-txt"].position            = new_pos;
          touch_note_on_arc_update(touch_group, "knob-touch");
        }
        return true;
      });
    },

    midi_play_update: function (msg) {
      const touchs_group = this.children["touchs-group"];
      const knob_group = this.children["knob-group"];
      if (!touchs_group || !knob_group) return;
      const status = midi_msg_status_unpack(msg.status);
      let updated = false;

      for (const touch_group of touchs_group.children) {
        if (!touch_group.msg) continue;

        if (!touch_group.msg.press || touch_group.msg.press.enabled === false) continue;
        const press_midi = touch_group.msg.press.midi;
        if (!press_midi) continue;
        const ps = midi_msg_status_unpack(press_midi.status);
        if (ps.channel !== status.channel) continue;

        if (status.type === MIDI_TYPE.NOTE_ON || status.type === MIDI_TYPE.NOTE_OFF) {
          if (ps.type !== MIDI_TYPE.NOTE_ON || press_midi.data1 !== msg.data1) continue;
          const value = (status.type === MIDI_TYPE.NOTE_ON && msg.data2 > 0) ? msg.data2 : 0;
          touch_group.last_press_value = value;
          if (value > 0) {
            if (touch_group._blob_positioned) update_touch_arc(touch_group, value, "knob-touch");
          } else {
            touch_note_off_reset(touch_group, ["knob-touch", "touch-txt", "knob-needle"], "knob-touch");
          }
          updated = true;
        } else if (status.type === MIDI_TYPE.CONTROL_CHANGE) {
          if (ps.type !== MIDI_TYPE.CONTROL_CHANGE || press_midi.data1 !== msg.data1) continue;
          touch_group.last_press_value = msg.data2;
          update_touch_arc(touch_group, msg.data2, "knob-touch");
          updated = true;
        } else if (status.type === MIDI_TYPE.AFTERTOUCH_POLY) {
          if (press_midi.data1 !== msg.data1) continue;
          touch_group.last_press_value = msg.data2;
          update_touch_arc(touch_group, msg.data2, "knob-touch");
          updated = true;
        }
      }

      if (updated) paper.view.update();
    }

  });
  return _knob;
};
