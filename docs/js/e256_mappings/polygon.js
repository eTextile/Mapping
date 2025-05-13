/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// POLYGON Factory
// Multitouch MIDI polygon GUI
function polygon_factory() {
  const DEFAULT_POLYGON_STROKE_WIDTH = 4;
  const DEFAULT_POLYGON_TOUCHS = 1;
  const DEFAULT_POLYGON_MODE_POS = C_CHANGE;
  const DEFAULT_POLYGON_MODE_Z = NOTE_ON;

  var _polygon = new paper.Group({
    "name": "polygon",
    "modes": {
      0: "NOTE_ON",        // TRIGGER NOTE WITH VELOCITY
      1: "C_CHANGE",       // PRESSURE ONLY
      2: "AFTERTOUCH_POLY" // TRIGGER NOTE AND MODULATE
    },
    "data": {
      "touchs": null,
      "segments": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT_POLYGON_TOUCHS;
      this.data.mode_z = DEFAULT_POLYGON_MODE_Z;

      this.data.segments = [];
      this.data.segments.push(mouseEvent.point);
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_POLYGON_TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos = midi_msg_builder(DEFAULT_POLYGON_MODE_POS);
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
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs;
      this.data.segments = params.segments;
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.mode_z = status.type;
    },

    save_params: function () {
      this.data.segments = this.children["polygon-group"].data.segments;
      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (this.data.mode_z != previous_mode_z) {
          touch_msg.pos = midi_msg_builder(DEFAULT_POLYGON_MODE_POS);
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
            touch_msg.pos = midi_msg_builder(DEFAULT_POLYGON_MODE_POS);
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

    new_touch: function (_polygon, _touch_id) {

      let _touch_group = new paper.Group({  
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": this.data.segments[0],
        "prev_pos": null,
      });

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": this.data.segments[0],
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure!  
      });

      _touch_circle.style = {
        "fillColor": "#606060"
      }

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
          case THROUGH_MODE:
            switch (_polygon.data.mode_z) {
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

      _touch_group.addChild(_touch_circle);

      //_touch_group.onMouseMove = function (mouseEvent) {
      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            if (_touch_group.msg.pos.midi.data2 != _touch_group.prev_pos) {
              _touch_group.prev_pos = _touch_group.msg.pos.midi.data2;
              send_midi_msg(_touch_group.msg.pos.midi);
            }
            break;
          case PLAY_MODE:
            // N/A
            break;
        }
      }
      return _touch_group;
    },

    create: function () {
      let _polygon_group = new paper.Group({
        "name": "polygon-group",
        "modes": this.modes,
        "data": {
          "touchs": this.data.touchs,
          "segments": this.data.segments,
          "mode_z": this.data.mode_z
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_polygon_group, _touch));
      }

      let _polygon_curve = new paper.Path({
        "name": "polygon-curve",
        "segments": _polygon_group.data.segments,
        "closed": true
      });

      _polygon_curve.style = {
        "strokeWidth": DEFAULT_POLYGON_STROKE_WIDTH,
        "strokeColor": "purple",
        "strokeCap": "round",
        "strokeJoin": "round"
      }

      _polygon_curve.onMouseEnter = function () {
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

      _polygon_curve.onMouseLeave = function () {
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

      _polygon_curve.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "segment") {
              current_part.segment.point = mouseEvent.point;
              this.segments[current_part.segment.index].point = mouseEvent.point;
              for (const _touch of _touchs_group.children) {
                _polygon_group.children["polygon-graduations"].segments[current_part.segment.index].point = mouseEvent.point;
                let _polygon_graduation_interval = this.length / (_touch.msg.pos.limit.max - _touch.msg.pos.limit.min);
                _polygon_group.children["polygon-graduations"].dashArray = [1, _polygon_graduation_interval];
              }
              update_item_main_params(_polygon_group.parent);
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

      _polygon_group.addChild(_polygon_curve);

      this.addChild(_polygon_group);

      this.addChild(_touchs_group);
    },

    // Call on mousedown event
    graw: function (mouseEvent) {
      this.children["polygon-group"].children["polygon-curve"].add(mouseEvent.point);
      // TODO: Place the touch
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill" || current_part.type === "stroke") {
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
  return _polygon;
};
