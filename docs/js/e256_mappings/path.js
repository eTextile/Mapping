/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// Multitouch MIDI path GUI
// http://paperjs.org/reference/path/#path
function path_factory() {
  const DEFAULT_PATH_STROKE_WIDTH = 50;
  const DEFAULT_PATH_TOUCHS = 1;
  const DEFAULT_PATH_MODE_POS = C_CHANGE;
  const DEFAULT_PATH_MODE_Z = NOTE_ON;

  var _path = new paper.Group({
    "name": "path",
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
      this.data.touchs = DEFAULT_PATH_TOUCHS;
      this.data.mode_z = DEFAULT_PATH_MODE_Z;

      this.data.segments = [];
      this.data.segments.push(mouseEvent.point);
      
      //console.log("path: " + this.data.segments);

      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_PATH_TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos = midi_msg_builder(DEFAULT_PATH_MODE_POS);
        touch_msg.press = midi_msg_builder(this.data.mode_z);
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
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["path-group"].data.touchs;

      let previous_mode_z = this.data.mode_z;
      this.data.mode_z = this.children["path-group"].data.mode_z;

      this.data.segments = this.children["path-group"].data.segments;

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (this.data.mode_z != previous_mode_z) {
          touch_msg.pos = midi_msg_builder(DEFAULT_PATH_MODE_POS);
          touch_msg.press = midi_msg_builder(this.data.mode_z);
        }
        else {
          if (_touch < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[_touch].msg;
          }
          else {
            touch_msg.pos = midi_msg_builder(DEFAULT_PATH_MODE_POS);
            touch_msg.press = midi_msg_builder(this.data.mode_z);
          }
        }
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_path, _touch_id) {

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
            switch (_path.data.mode_z) {
              case NOTE_ON:
                _touch_group.msg.press.midi.status = (_touch_group.msg.press.midi.status | NOTE_ON);
                _touch_group.msg.press.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
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

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            // TODO: move the _touch_circle along the path
            // http://paperjs.org/reference/path/#getnearestpoint-point
            this.position = mouseEvent; // FIXME!
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

      _touch_group.addChild(_touch_circle);

      return _touch_group;
    },

    create: function () {
      let _path_group = new paper.Group({
        "name": "path-group",
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
        _touchs_group.addChild(this.new_touch(_path_group, _touch));
      }

      let _path_curve = new paper.Path({
        "name": "path-curve",
        "segments": _path_group.data.segments,
        "closed": false
      });

      _path_curve.style = {
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": "purple",
        "strokeCap": "round",
        "strokeJoin": "round"
      }

      _path_curve.onMouseEnter = function () {
        if (e256_current_mode === EDIT_MODE) {
          this.selected = true;
        }
      }

      _path_curve.onMouseLeave = function () {
        if (e256_current_mode === EDIT_MODE) {
            this.selected = false;
        }
      }

      _path_curve.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === EDIT_MODE) {
          if (current_part.type === "segment") {
            current_part.segment.point = mouseEvent.point;
            this.segments[current_part.segment.index].point = mouseEvent.point;
            for (const _touch of _touchs_group.children) {
              _path_group.children["path-graduations"].segments[current_part.segment.index].point = mouseEvent.point;
              let _path_graduation_interval = this.length / (_touch.msg.pos.limit.max - _touch.msg.pos.limit.min);
              _path_group.children["path-graduations"].dashArray = [1, _path_graduation_interval];
            }
            update_item_main_params(_path_group.parent);
          }
        }
      }

      _path_group.addChild(_path_curve);

      // TODO: make it visible when toutch is over!
      let _graduations = new paper.Path({
        "name": "path-graduations",
        "segments": this.data.segments,
        "closed": false,
        "locked": true
      });

      _graduations.style = {
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": "black",
        "dashArray": [1, 10]
      }

      _path_group.addChild(_graduations);

      this.addChild(_path_group);

      this.addChild(_touchs_group);
    },

    // Call on mousedown event
    graw: function (mouseEvent) {
      this.children["path-group"].children["path-curve"].add(mouseEvent.point);
      this.children["path-group"].children["path-graduations"].add(mouseEvent.point);
      // TODO: Place the touch to the segment middle!
      for (const _touch of this.children["touchs-group"].children) {
        let _path_graduation_interval = this.children["path-group"].children["path-curve"].length / (_touch.msg.pos.limit.max - _touch.msg.pos.limit.min);
        this.children["path-group"].children["path-graduations"].dashArray = [1, _path_graduation_interval];
      }
      //console.log(this.children["path-group"].children["path-curve"].segments);
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
  return _path;
};
