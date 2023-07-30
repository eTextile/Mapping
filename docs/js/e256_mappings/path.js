/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// http://paperjs.org/reference/path/#path
function pathFactory() {
  const DEFAULT_PATH_MIN = 0;
  const DEFAULT_PATH_MAX = 127;
  const DEFAULT_PATH_STROKE_WIDTH = 20;
  const DEFAULT_PATH_HANDLE_RADIUS = 15;

  var _Path = new paper.Group({
    "name": "path",
    "radius": null,
    "data": {
      "min": null,
      "max": null,
      "segments": [],
      "midiMsg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.radius = DEFAULT_PATH_HANDLE_RADIUS;
      this.data.min = DEFAULT_PATH_MIN;
      this.data.max = DEFAULT_PATH_MAX;
      this.data.segments.push(new paper.Point(mouseEvent.point.x, mouseEvent.point.y));
      this.data.midiMsg = new Midi_slider(
        DEFAULT_MIDI_CHANNEL,
        DEFAULT_MIDI_CC,
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      //this.path.closed = true;
    },

    setup_from_config: function (params) {
      this.data.min = params.min;
      this.data.max = params.max;
      this.data.segments = params.segments; // vertex!?
      this.data.midiMsg = new Midi_slider(
        params.midiMsg.chan,
        params.midiMsg.cc
      );
    },
    
    save_params: function () {
      this.data.min = this.children["path-group"].data.min;
      this.data.max = this.children["path-group"].data.max;
      this.data.segments = this.children["path-group"].data.segments;
      this.data.midiMsg = this.children["path-group"].data.midiMsg;
    },

    create: function () {
      let _path_group = new paper.Group({
        "name": "path-group",
        "data": {
          "min": this.data.min,
          "max": this.data.max,
          "segments": this.data.segments,
          "form_style": {
            "min": "form-select",
            "max": "form-select"
          }
        }
      });
      var _path = new paper.Path({
        "name": "path",
        "segments": _path_group.data.segments, // vertex!?
      });
      _path.style = {
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": new paper.Color(0.7, 0, 0.5),
        "strokeCap": "round",
        "strokeJoin": "round"
      }
      _path_group.addChild(_path);
      this.addChild(_path_group);

      var _handle_group = new paper.Group({
        "name": "handle-group",
        "data": {
          "midiMsg": this.data.midiMsg,
          "form_style": {
            "chan": "form-select",
            "cc": "form-select"
          }
        }
      });

      let _path_handle = new paper.Path.Circle({
        "name": "path-handle",
        "center": new paper.Point(_path_group.data.segments[0].x, _path_group.data.segments[0].y),
        "radius": this.radius,
      });
      _path_handle.style = {
        "fillColor": "red"
      };
      _handle_group.addChild(_path_handle);
      this.addChild(_handle_group); 
    },

    graw: function (mouseEvent) {
      this.children["path-group"].children["path"].add(new paper.Point(mouseEvent.point.x, mouseEvent.point.y));
      //this.children["path-group"].children["path"].smooth();
    },

    /*
    onMouseEnter: function (mouseEvent) {
      let mouse_enter_options = {
        "stroke": true,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }
      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (tmp_select) {
            if (tmp_select.item.name === "path") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "path-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else {
              console.log("NOT_USED: " + tmp_select.item.name);
              return;
            }
            highlight_item.selected = true;
          }
          break;
        case PLAY_MODE:
          console.log("PLAY_MODE: NOT IMPLEMENTED!");
          break;
        default:
          break;
      }
    },

    onMouseLeave: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          highlight_item.selected = false;
          break;
        case PLAY_MODE:
          break;
        default:
          break;
      }
    },
  
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (selectedSegment) {
          this.children["path-group"].children["path"].segments[selectedSegment].point.x = mouseEvent.point.x;
          this.children["path-group"].children["path"].segments[selectedSegment].point.y = mouseEvent.point.y;
          //update_menu_params(this);
        }
      }
      else if (e256_current_mode === PLAY_MODE) {
        // TODO!
      }
    }
    */

  });
  return _Path;
};
