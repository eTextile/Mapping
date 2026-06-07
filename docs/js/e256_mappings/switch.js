/*
This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SWITCH Factory
function switch_factory() {
  const DEFAULT = {
    WIDTH:          canvas_width / SCALE_X,
    HEIGHT:         canvas_height / SCALE_X,
    MIN_WIDTH:      100,
    MIN_HEIGHT:     100,
    TOUCHS:         1,
    MODE_Z:         MIDI_TYPE.NOTE_ON,
    CHORD:          1,
    BUTTON_PADDING: 8
  };

  let half_frame_width = null;
  let half_frame_height = null;

  let switch_radius_step = null;

  let _tap_times = [];
  let _clock_timer_id = null;
  let _initial_aspect_ratio = null;
  let _pressed_touch_id = null;

  var _switch = new paper.Group({
    "name": "switch",
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "chan": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {

      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT.WIDTH / 2),
        mouseEvent.point.y - (DEFAULT.HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT.WIDTH / 2),
        mouseEvent.point.y + (DEFAULT.HEIGHT / 2)
      );

      this.data.touchs = DEFAULT.TOUCHS;
      this.data.chan = { in: MIDI_DEFAULT.INPUT_CHANNEL, out: MIDI_DEFAULT.OUTPUT_CHANNEL };

      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT.TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.press = midi_msg_builder(DEFAULT.MODE_Z);
        touch_msg.move  = Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        this.data.msg.push(touch_msg);
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
      this.data.touchs = params.touchs;
      this.data.chan = { in: params.chan?.in || MIDI_DEFAULT.INPUT_CHANNEL, out: params.chan?.out || MIDI_DEFAULT.OUTPUT_CHANNEL };
      this.data.msg = params.msg;
    },

    save_params: function () {

      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;

      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["switch-group"].data.touchs;

      this.data.chan = this.children["switch-group"].data.chan;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (_touch < previous_touch_count) {
          touch_msg = this.children["touchs-group"].children[_touch].msg;
        } else {
          touch_msg.press = midi_msg_builder(DEFAULT.MODE_Z);
        }
        if (!touch_msg.move) touch_msg.move = Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_switch, _touch_id, touchs_count) {

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": new paper.Point(this.data.from.x + half_frame_width, this.data.from.y + half_frame_height),
      });

      let _vel_xy = 0;
      let _last_move_t = 0;

      const _disc_radius = switch_radius_step * (touchs_count - _touch_id);
      // Opacity increases toward the center so rings are visually distinct
      const _disc_alpha = 0.75 + 0.25 * (_touch_id / Math.max(touchs_count - 1, 1));

      let _touch_ellipse = new paper.Shape.Circle({
        "name": "touch-ellipse",
        "center": _touch_group.pos,
        "radius": _disc_radius,
      });

      const _disc_color       = new paper.Color(1, 140/255, 0, _disc_alpha);
      const _disc_color_hover = new paper.Color(1, 100/255, 0, Math.min(_disc_alpha + 0.2, 1));

      _touch_ellipse.style = {
        "fillColor": _disc_color,
        "strokeColor": null
      };

      _touch_ellipse.onMouseEnter = function () {
        if (_pressed_touch_id !== null && _pressed_touch_id !== _touch_id) return;
        this.style.fillColor = _disc_color_hover;
        if (e256_current_mode === MODE.EDIT && !touch_selection_locked) show_only_touch(_touch_group);
      }

      _touch_ellipse.onMouseLeave = function () {
        if (_pressed_touch_id === _touch_id) return;
        this.style.fillColor = _disc_color;
      }

      _touch_ellipse.onMouseDown = function () {
        _pressed_touch_id = _touch_id;
        switch (e256_current_mode) {
          case MODE.EDIT:
            show_only_touch(_touch_group, true);
            touch_selection_locked = true;
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = performance.now();
            this.style.fillColor = new paper.Color(1, 0, 0, _disc_alpha + 0.2);
            if (press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.CLOCK) {
              const now = performance.now();
              _tap_times.push(now);
              if (_tap_times.length > 4) _tap_times.shift();
              if (_tap_times.length >= 2) {
                let total = 0;
                for (let i = 1; i < _tap_times.length; i++) total += _tap_times[i] - _tap_times[i - 1];
                const beat_ms = total / (_tap_times.length - 1);
                if (_clock_timer_id) clearInterval(_clock_timer_id);
                _clock_timer_id = setInterval(() => {
                  if (midi_device_connected && midi_output) midi_output.send([0xF8]);
                }, beat_ms / 24);
              }
            } else {
              touch_press_down(_switch, _touch_group);
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_ellipse.onMouseUp = function () {
        _pressed_touch_id = null;
        this.style.fillColor = _disc_color;
        switch (e256_current_mode) {
          case MODE.EDIT:
            // N/A
            break;
          case MODE.THROUGH:
            _vel_xy = 0;
            _last_move_t = 0;
            if (press_type_from_msg(_touch_group.msg.press) !== MIDI_TYPE.CLOCK) touch_press_up(_switch, _touch_group);
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_ellipse.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.THROUGH) {
          if (!_touch_group.msg.move || !_touch_group.msg.move.enabled) return;
          const now = performance.now();
          const dt_s = Math.max(0.001, (now - _last_move_t) / 1000);
          const dx = mouseEvent.delta.x * NEW_COLS / canvas_width;
          const dy = mouseEvent.delta.y * NEW_ROWS / canvas_height;
          _vel_xy = 0.5 * Math.sqrt(dx * dx + dy * dy) / dt_s + 0.5 * _vel_xy;
          _last_move_t = now;
          _touch_group.msg.move.midi.data2 = Math.max(0, Math.min(127, Math.round(_vel_xy * 127 / 120)));
          send_midi_msg(_touch_group.msg.move.midi);
        }
      };

      _touch_group.addChild(_touch_ellipse);
      let _touch_arc = make_touch_arc(_touch_group.pos);
      _touch_group.addChild(_touch_arc);

      // ID label placed just inside the top edge of this disc
      let _touch_txt = make_touch_txt(
        new paper.Point(_touch_group.pos.x, _touch_group.pos.y - _disc_radius + FONT_SIZE),
        String(_touch_id + 1),
        { fontSize: FONT_SIZE, fontWeight: "bold", justification: "center", fillColor: "white" }
      );

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {

      let _switch_group = new paper.Group({
        "name": "switch-group",
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "chan": this.data.chan
        }
      });

      half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
      half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;

      switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / _switch_group.data.touchs;

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _switch_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_switch_group, _touch, _switch_group.data.touchs));
      }

      let _switch_frame = new paper.Path.Rectangle({
        "name": "switch-frame",
        "from": _switch_group.data.from,
        "to": _switch_group.data.to
      });

      _switch_frame.style = {
        "fillColor": "skyblue"
      }

      _switch_frame.onMouseEnter = function () {
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

      _switch_frame.onMouseLeave = function () {
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

      _switch_frame.onMouseDown = function () {
        const w = _switch_group.data.to.x - _switch_group.data.from.x;
        const h = _switch_group.data.to.y - _switch_group.data.from.y;
        _initial_aspect_ratio = h > 0 ? w / h : 1;
      };

      _switch_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            let new_pos = new paper.Point();
            if (current_part.type === "bounds") {
              let pt = mouseEvent.point.clone();
              const ratio = _initial_aspect_ratio || 1;
              if (mouseEvent.modifiers.shift) {
                switch (current_part.name) {
                  case "top-left": {
                    const dx = _switch_group.data.to.x - pt.x;
                    const dy = _switch_group.data.to.y - pt.y;
                    if (dx / ratio > dy) pt.y = _switch_group.data.to.y - dx / ratio;
                    else pt.x = _switch_group.data.to.x - dy * ratio;
                    break;
                  }
                  case "top-right": {
                    const dx = pt.x - _switch_group.data.from.x;
                    const dy = _switch_group.data.to.y - pt.y;
                    if (dx / ratio > dy) pt.y = _switch_group.data.to.y - dx / ratio;
                    else pt.x = _switch_group.data.from.x + dy * ratio;
                    break;
                  }
                  case "bottom-right": {
                    const dx = pt.x - _switch_group.data.from.x;
                    const dy = pt.y - _switch_group.data.from.y;
                    if (dx / ratio > dy) pt.y = _switch_group.data.from.y + dx / ratio;
                    else pt.x = _switch_group.data.from.x + dy * ratio;
                    break;
                  }
                  case "bottom-left": {
                    const dx = _switch_group.data.to.x - pt.x;
                    const dy = pt.y - _switch_group.data.from.y;
                    if (dx / ratio > dy) pt.y = _switch_group.data.from.y + dx / ratio;
                    else pt.x = _switch_group.data.to.x - dy * ratio;
                    break;
                  }
                }
              }
              switch (current_part.name) {
                case "top-left":
                  if (_switch_group.data.to.x - pt.x < DEFAULT.MIN_WIDTH || _switch_group.data.to.y - pt.y < DEFAULT.MIN_HEIGHT) break;
                  this.segments[0].point.x = pt.x;
                  this.segments[1].point = pt;
                  this.segments[2].point.y = pt.y;
                  _switch_group.data.from = pt;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.to.x - half_frame_width;
                  new_pos.y = _switch_group.data.to.y - half_frame_height;
                  switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / _switch_group.data.touchs;
                  for (const _touch of _touchs_group.children) {
                    const tid = Number(_touch.name[_touch.name.length - 1]);
                    const r = switch_radius_step * (_switch_group.data.touchs - tid);
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = r;
                    _touch.children["touch-txt"].position = new paper.Point(new_pos.x, new_pos.y - r + FONT_SIZE);
                  }
                  break;
                case "top-right":
                  if (pt.x - _switch_group.data.from.x < DEFAULT.MIN_WIDTH || _switch_group.data.to.y - pt.y < DEFAULT.MIN_HEIGHT) break;
                  this.segments[1].point.y = pt.y;
                  this.segments[2].point = pt;
                  this.segments[3].point.x = pt.x;
                  _switch_group.data.from.y = pt.y;
                  _switch_group.data.to.x = pt.x;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.from.x + half_frame_width;
                  new_pos.y = _switch_group.data.to.y - half_frame_height;
                  switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / _switch_group.data.touchs;
                  for (const _touch of _touchs_group.children) {
                    const tid = Number(_touch.name[_touch.name.length - 1]);
                    const r = switch_radius_step * (_switch_group.data.touchs - tid);
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = r;
                    _touch.children["touch-txt"].position = new paper.Point(new_pos.x, new_pos.y - r + FONT_SIZE);
                  }
                  break;
                case "bottom-right":
                  if (pt.x - _switch_group.data.from.x < DEFAULT.MIN_WIDTH || pt.y - _switch_group.data.from.y < DEFAULT.MIN_HEIGHT) break;
                  this.segments[2].point.x = pt.x;
                  this.segments[3].point = pt;
                  this.segments[0].point.y = pt.y;
                  _switch_group.data.to = pt;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.from.x + half_frame_width;
                  new_pos.y = _switch_group.data.from.y + half_frame_height;
                  switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / _switch_group.data.touchs;
                  for (const _touch of _touchs_group.children) {
                    const tid = Number(_touch.name[_touch.name.length - 1]);
                    const r = switch_radius_step * (_switch_group.data.touchs - tid);
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = r;
                    _touch.children["touch-txt"].position = new paper.Point(new_pos.x, new_pos.y - r + FONT_SIZE);
                  }
                  break;
                case "bottom-left":
                  if (_switch_group.data.to.x - pt.x < DEFAULT.MIN_WIDTH || pt.y - _switch_group.data.from.y < DEFAULT.MIN_HEIGHT) break;
                  this.segments[3].point.y = pt.y;
                  this.segments[0].point = pt;
                  this.segments[1].point.x = pt.x;
                  _switch_group.data.from.x = pt.x;
                  _switch_group.data.to.y = pt.y;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.to.x - half_frame_width;
                  new_pos.y = _switch_group.data.from.y + half_frame_height;
                  switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / _switch_group.data.touchs;
                  for (const _touch of _touchs_group.children) {
                    const tid = Number(_touch.name[_touch.name.length - 1]);
                    const r = switch_radius_step * (_switch_group.data.touchs - tid);
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = r;
                    _touch.children["touch-txt"].position = new paper.Point(new_pos.x, new_pos.y - r + FONT_SIZE);
                  }
                  break;
                default:
                  //console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_main_params(_switch_group.parent);
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _switch_group.addChild(_switch_frame);

      _switch_group.fit_to_canvas = function() {
        this.data.from = new paper.Point(0, 0);
        this.data.to = new paper.Point(canvas_width, canvas_height);
        half_frame_width = canvas_width / 2;
        half_frame_height = canvas_height / 2;
        switch_radius_step = (Math.min(half_frame_width, half_frame_height) - DEFAULT.BUTTON_PADDING) / this.data.touchs;
        _switch_frame.segments[0].point = new paper.Point(0, canvas_height);
        _switch_frame.segments[1].point = new paper.Point(0, 0);
        _switch_frame.segments[2].point = new paper.Point(canvas_width, 0);
        _switch_frame.segments[3].point = new paper.Point(canvas_width, canvas_height);
        const center = new paper.Point(canvas_width / 2, canvas_height / 2);
        for (const touch of _touchs_group.children) {
          const tid = Number(touch.name[touch.name.length - 1]);
          const r = switch_radius_step * (this.data.touchs - tid);
          touch.children["touch-ellipse"].position = center;
          touch.children["touch-ellipse"].radius = r;
          touch.children["touch-txt"].position = new paper.Point(center.x, center.y - r + FONT_SIZE);
        }
        update_item_main_params(this.parent);
      };

      this.addChild(_switch_group);
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
        case MODE.PLAY:
          // N/A
          break;
      }
    },

    midi_play_update: function(msg) {
      const touchs_group = this.children["touchs-group"];
      if (!touchs_group) return;
      const status = midi_msg_status_unpack(msg.status);
      let updated = false;
      for (const touch_group of touchs_group.children) {
        if (!touch_group.msg?.press || touch_group.msg.press.enabled === false) continue;
        const press_midi = touch_group.msg.press.midi;
        if (!press_midi) continue;
        const ps = midi_msg_status_unpack(press_midi.status);
        if (ps.channel !== status.channel) continue;
        let value = 0;
        if (status.type === MIDI_TYPE.NOTE_ON || status.type === MIDI_TYPE.NOTE_OFF) {
          if (ps.type !== MIDI_TYPE.NOTE_ON || press_midi.data1 !== msg.data1) continue;
          value = (status.type === MIDI_TYPE.NOTE_ON && msg.data2 > 0) ? msg.data2 : 0;
        } else if (status.type === MIDI_TYPE.CONTROL_CHANGE) {
          if (ps.type !== MIDI_TYPE.CONTROL_CHANGE || press_midi.data1 !== msg.data1) continue;
          value = msg.data2;
        } else {
          continue;
        }
        update_touch_arc(touch_group, value, "touch-ellipse");
        updated = true;
        break;
      }
      if (updated) paper.view.update();
    }

  });
  return _switch;
};
