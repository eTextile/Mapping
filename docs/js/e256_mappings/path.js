/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// Multitouch MIDI path GUI
// http://paperjs.org/reference/path/#path
function pathFactory() {
  const DEFAULT_PATH_STROKE_WIDTH = 50;
  const DEFAULT_PATH_TOUCHS = 1;

  var _path = new paper.Group({
    "name": "path",
    "data": {
      "touchs": null,
      "segments": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT_PATH_TOUCHS;
      this.data.segments = [];
      this.data.segments.push(mouseEvent.point);
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_PATH_TOUCHS; _touch++) {
        this.data.msg.push(new midi_slider_touch_msg(_touch));
      }
    },

    setup_from_config: function (params) {
      this.data.segments = params.segments; // vertex!?
      this.data.msg = new midi_slider_touch_msg();
      this.data.msg = params.midiMsg;
    },

    save_params: function () {
      this.data.segments = this.children["path-group"].data.segments;
      this.data.msg = [];
      for (const _touch of this.children["touchs-group"].children) {
        this.data.msg.push(_touch.data);
      }
    },

    // touch-group
    new_touch: function (_touch_uid) {

      let _touch_group = new paper.Group({  
        "name": "touch-" + _touch_uid,
        "pos": this.data.segments[0],
        "prev_position": null,
        "prev_pressure": null,
        "data": this.data.msg[_touch_uid]
      });

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": this.data.segments[0],
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure!  
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
      }

      _touch_group.addChild(_touch_circle);

      // TODO: make it visible when toutch is over!
      let _path_graduations = new paper.Path({
        "name": "path-graduations",
        "segments": this.data.segments,
        "closed": false,
        "locked": true
      });

      _path_graduations.style = {
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": "black",
        "dashArray": [1, 10]
      };

      _touch_group.addChild(_path_graduations);

      _touch_group.onMouseMove = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // NA
            break;
          case PLAY_MODE:
            if (_touch_group.data.midi.position.val != _touch_group.prev_position) {
              _touch_group.prev_position = _touch_group.data.midi.position.val;
              send_midi_msg(_touch_group.midi.position.msg);
            }
            if (_touch_group.data.midi.pressure.val != _touch_group.prev_pressure) {
              _touch_group.prev_pressure = _touch_group.data.midi.pressure.val;
              send_midi_msg(_touch_group.midi.pressure.msg);
            }
            break;
        }
      }
      return _touch_group;
    },

    create: function () {
      let _path_group = new paper.Group({
        "name": "path-group",
        "data": {
          "touchs": this.data.touchs,
          "segments": this.data.segments
        }
      });

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
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _path_curve.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _path_curve.onMouseDown = function () {
      }

      _path_group.addChild(_path_curve);
      this.addChild(_path_group);

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_touch));
      }

      this.addChild(_touchs_group);
    },

    // Call on mousedown event
    graw: function (mouseEvent) {
      this.children["path-group"].children["path-curve"].add(mouseEvent.point);
      // TODO: Place the touch to the segment middle!
      for (const _touch of this.children["touchs-group"].children) {
        _touch.children["path-graduations"].add(mouseEvent.point);
        let _path_graduation_interval = this.children["path-group"].children["path-curve"].length / (_touch.data.midi.position.max - _touch.data.midi.position.min);
        _touch.children["path-graduations"].dashArray = [1, _path_graduation_interval];
      }
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill" || current_part.type === "stroke") {
            move_item(this, mouseEvent);
          }
          else if (current_part.type === "segment") {
            current_part.segment.point = mouseEvent.point;
            this.children["path-group"].children["path-curve"].segments[current_part.segment.index].point = mouseEvent.point;
            for (const _touch of this.children["touchs-group"].children) {
              _touch.children["path-graduations"].segments[current_part.segment.index].point = mouseEvent.point;
              let _path_graduation_interval = this.children["path-group"].children["path-curve"].length / (_touch.data.midi.position.max - _touch.data.midi.position.min);
              _touch.children["path-graduations"].dashArray = [1, _path_graduation_interval];
            }
            update_menu_1st_level(_path_group.parent);
          }
          break;
        case PLAY_MODE:
          // NA
          break;
      }
    }

  });
  return _path;
};
