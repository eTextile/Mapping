/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// http://paperjs.org/reference/path/#path
function pathFactory() {
  var path_default_stroke_width = 20;

  var _Path = new paper.Group({
    data: {
      type: "path",
      segments: [],
      min: 0,
      max: 127
    },
    setup_from_mouse_event: function (mouseEvent) {
      this.data.segments.push([Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)]);
      //this.path.closed = true;
    },
    setup_from_config: function (params) {
      this.data.segments = params.segments; // vertex!?
      this.data.min = params.min;
      this.data.max = params.max;
    },
    create: function () {
      var _path = new paper.Path({
        name: "path",
        segments: this.data.segments, // vertex!?
        strokeWidth: path_default_stroke_width,
        strokeColor: new paper.Color(0.7, 0, 0.5),
        //selected: true,
        strokeCap: "round",
        strokeJoin: "round"
      });
      this.addChild(_path);
    },
    addPoint: function (mouseEvent) {
      var newPoint = [Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y)];
      this.data.segments.push(newPoint);
      this.children["path"].add(newPoint);
      this.children["path"].smooth();
    },
    activate: function () {
      this.children[0].selected = true;
    },
    select: function () {
      this.children["rect"].opacity = 1;
      update_menu_params(this);
    },
    free: function () {
      this.children["rect"].opacity = 0;
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
