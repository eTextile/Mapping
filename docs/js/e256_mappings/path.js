/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// http://paperjs.org/reference/path/#path
function pathFactory() {
  var DEFAULT_PATH_STROKE_WIDTH = 20;

  var _Path = new paper.Group({
    "name": "path",
    "data": {
      "min": 0,
      "max": 127,
      "segments": []
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.min = params.min;
      this.data.max = params.max;
      this.data.segments.push([Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)]);
      //this.path.closed = true;
    },

    setup_from_config: function (params) {
      this.data.min = params.min;
      this.data.max = params.max;
      this.data.segments = params.segments; // vertex!?
    },
    
    save_params: function () {
      this.data.min = this.children["path-group"].data.min;
      this.data.max = this.children["path-group"].data.max;

      this.data.midiMsg = [];
      for (const _knob_touch of this.children["touchs-group"].children) {
        this.data.midiMsg.push(_knob_touch.data.midiMsg);
      }
    },

    create: function () {
      let _path_group = new paper.Group({
        "name": "path-group",
        "data": {
          "min": this.data.min,
          "max": this.data.max,
          "segments": this.data.segments,
          "form_style": {
            "min": "form-control",
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
    },

    addPoint: function (mouseEvent) {
      var newPoint = [Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)];
      this.data.segments.push(newPoint);
      this.children["path"].add(newPoint);
      this.children["path"].smooth();
    },
    
    onMouseEnter: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.select();
      }
      show_item_menu_params(this);
    },
    
    onMouseLeave: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },

    // controleur.addPoint(mouseEvent);   // Move it to the path_factory mose_down!

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (selectedSegment) {
          this.children["path"].segments[selectedSegment].point.x = mouseEvent.point.x;
          this.children["path"].segments[selectedSegment].point.y = mouseEvent.point.y;
          this.data.segments[selectedSegment][0] = Math.round(mouseEvent.point.x);
          this.data.segments[selectedSegment][1] = Math.round(mouseEvent.point.y);
          update_menu_params(this);
        }
      }
      else if (e256_current_mode === PLAY_MODE) {
        // TODO!
      }
    }
  });
  return _Path;
};
