/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/
      
/////////// POLYGON Factory / Simple polygon
// Multitouch MIDI polygon GUI
// Multidimensional crossfade
function polygon_factory() {
  const DEFAULT_POLYGON_SIDES = 3;
  const DEFAULT_POLYGON_SIZE = 300;
  const DEFAULT_POLYGON_STROKE_WIDTH = 1;
  const DEFAULT_POLYGON_TOUCHS = 1;
  const DEFAULT_POLYGON_MODE_DIST = MIDI_TYPE.CONTROL_CHANGE;
  const DEFAULT_POLYGON_MODE_Z = MIDI_TYPE.NOTE_ON;
  const HANDLE_RADIUS = 8;

  var _polygon = new paper.Group({
    "name": "polygon",
    "data": {
      "touchs": null,
      "segments": null,
      "press": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {

      this.data.press = DEFAULT_POLYGON_MODE_Z;

      // Build a regular polygon centered on the click; store segments as [paper.Point] arrays.
      let polygon = new paper.Path.RegularPolygon(mouseEvent.point, DEFAULT_POLYGON_SIDES, DEFAULT_POLYGON_SIZE).segments;
      this.data.segments = polygon.map(s => [s.point]);
      this.data.touchs = DEFAULT_POLYGON_TOUCHS; // one central touch per polygon

      // One source_N CC axis per vertex + one press axis per touch.
      this.data.msg = [];
      for (let touch_index = 0; touch_index < this.data.touchs; touch_index++) {
        let touch_msg = {};
        for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
          const key = "source_"+ vertex_index;
          touch_msg[key] = midi_msg_builder(DEFAULT_POLYGON_MODE_DIST);
        }
        touch_msg.press = midi_msg_builder(this.data.press);
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs;
      // Segments are stored normalized ([0,NEW_COLS]×[0,NEW_ROWS]) in the config file;
      // convert back to canvas pixel coordinates for Paper.js rendering.
      this.data.segments = params.segments.map(seg => [
        mapp(seg[0], 0, NEW_COLS, 0, canvas_width),
        mapp(seg[1], 0, NEW_ROWS, 0, canvas_height)
      ]);
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.press = status.type;
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["polygon-group"].data.touchs;

      let previous_mode_z = this.data.press;
      this.data.press = this.children["polygon-group"].data.press;

      this.data.segments = this.children["polygon-group"].data.segments;
      this.data.msg = [];

      for (let touch_index = 0; touch_index < this.data.touchs; touch_index++) {
        let touch_msg = {};
        if (this.data.press != previous_mode_z) {
          // Press mode changed: reset all axes to fresh defaults.
          for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
            touch_msg["source_" + vertex_index] = midi_msg_builder(this.data.press);
          }
          touch_msg.press = midi_msg_builder(this.data.press);
        }
        else {
          if (touch_index < previous_touch_count) {
            // Reuse existing MIDI params for touches that already existed.
            touch_msg = this.children["touchs-group"].children[touch_index].msg;
          }
          else {
            // New touch slot added: initialize with defaults.
            for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
              touch_msg["source_" + vertex_index] = midi_msg_builder(this.data.press);
            }
            touch_msg.press = midi_msg_builder(this.data.press);
          }
        }
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_polygon, _touch_id) {

      // Segments can be [x, y] numbers (after a handle drag) or [paper.Point] (from setup).
      function seg_pt(seg) {
        return (typeof seg[0] === "number")
          ? new paper.Point(seg[0], seg[1])
          : new paper.Point(seg[0]);
      }

      // Compute centroid + bounding box for initial touch placement.
      const n_seg = _polygon.data.segments.length;
      let cx = 0, cy = 0;
      let min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity;
      for (let seg of _polygon.data.segments) {
        const pt = seg_pt(seg);
        cx += pt.x; cy += pt.y;
        if (pt.x < min_x) min_x = pt.x; if (pt.x > max_x) max_x = pt.x;
        if (pt.y < min_y) min_y = pt.y; if (pt.y > max_y) max_y = pt.y;
      }
      const centroid = new paper.Point(cx / n_seg, cy / n_seg);

      // Ray-casting point-in-polygon test
      function point_in_poly(pt) {
        let inside = false;
        for (let i = 0, j = n_seg - 1; i < n_seg; j = i++) {
          const pi = seg_pt(_polygon.data.segments[i]);
          const pj = seg_pt(_polygon.data.segments[j]);
          if (((pi.y > pt.y) !== (pj.y > pt.y)) &&
              (pt.x < (pj.x - pi.x) * (pt.y - pi.y) / (pj.y - pi.y) + pi.x))
            inside = !inside;
        }
        return inside;
      }

      // Random start position inside polygon (centroid as fallback)
      let start_pt = centroid;
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = new paper.Point(
          min_x + Math.random() * (max_x - min_x),
          min_y + Math.random() * (max_y - min_y)
        );
        if (point_in_poly(candidate)) { start_pt = candidate; break; }
      }

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": start_pt,
        "prev_dists": new Array(n_seg).fill(0)
      });

      // Spokes: lines from start position to each vertex
      let _spokes_group = new paper.Group({ "name": "spokes-group" });
      for (let vi = 0; vi < n_seg; vi++) {
        let spoke = new paper.Path.Line({
          "from": start_pt.clone(),
          "to": seg_pt(_polygon.data.segments[vi])
        });
        spoke.style = { "strokeWidth": 1, "strokeColor": "#aaa" };
        spoke.locked = true;
        _spokes_group.addChild(spoke);
      }
      _touch_group.addChild(_spokes_group);

      // Central touch circle
      let _touch_circle = make_touch_circle(start_pt, { "fillColor": "orange" });

      _touch_circle.onMouseDown = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case MODE.THROUGH:
            touch_press_down(_polygon, _touch_group);
            break;
          case MODE.PLAY:
            break;
        }
      };

      _touch_circle.onMouseUp = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            break;
          case MODE.THROUGH:
            touch_press_up(_polygon, _touch_group);
            break;
          case MODE.PLAY:
            break;
        }
      };

      _touch_circle.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.EDIT) {
          // In EDIT mode just reposition the touch and update spoke origins.
          _touch_circle.position = mouseEvent.point;
          for (let spoke of _spokes_group.children) {
            spoke.segments[0].point = mouseEvent.point;
          }
        } else if (e256_current_mode === MODE.THROUGH) {
          const _polygon_curve = _polygon.children["polygon"];
          if (_polygon_curve && _polygon_curve.contains(mouseEvent.point)) {
            _touch_circle.position = mouseEvent.point;
            // Bounding-box diagonal as 100% distance reference (matches firmware max_dist).
            const bounds = _polygon_curve.bounds;
            const max_dist = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height);
            for (let vi = 0; vi < _spokes_group.children.length; vi++) {
              _spokes_group.children[vi].segments[0].point = mouseEvent.point;
              const vpt = seg_pt(_polygon.data.segments[vi]);
              const dist = mouseEvent.point.getDistance(vpt);
              const key = "source_" + vi;
              if (_touch_group.msg[key]) {
                // Inverted mapping: dist=0 (touch on vertex) → limit.max; dist=max → limit.min.
                const new_val = Math.round(mapp(dist, 0, max_dist,
                  _touch_group.msg[key].limit.max, _touch_group.msg[key].limit.min));
                if (new_val !== _touch_group.prev_dists[vi]) {
                  _touch_group.prev_dists[vi] = new_val;
                  _touch_group.msg[key].midi.data2 = new_val;
                  send_midi_msg(_touch_group.msg[key].midi);
                }
              }
            }
            paper.view.update();
          }
        }
      };

      _touch_group.addChild(_touch_circle);

      return _touch_group;
    },

    create: function () {
      let _polygon_group = new paper.Group({
        "name": "polygon-group",
        "modes_z": this.modes_z,
        "data": {
          "touchs": this.data.touchs,
          "segments": this.data.segments,
          "press": this.data.press
        }
      });
      
      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let touch_index = 0; touch_index < this.data.touchs; touch_index++) {
        _touchs_group.addChild(this.new_touch(_polygon_group, touch_index));
      }

      let _polygon_curve = new paper.Path({
        "name": "polygon",
        "segments": _polygon_group.data.segments,
        "closed": true
      });

      _polygon_curve.style = {
        "strokeWidth": DEFAULT_POLYGON_STROKE_WIDTH,
        "fillColor": new paper.Color(0, 0, 0, 0.01),
        "strokeColor": "black",
        "strokeJoin": "round"
      }

      _polygon_curve.onMouseEnter = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.selected = true;
        }
      }

      _polygon_curve.onMouseLeave = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.selected = false;
        }
      }

      _polygon_curve.onMouseDown = function (mouseEvent) {
        if (e256_current_mode === MODE.EDIT) {
          current_part = this;
          if (current_part.type === "stroke") {
            // Click on an edge: insert a new vertex at that point.
            let location = current_part.location;
            _polygon_curve.insert(location.index + 1, mouseEvent.point);
          }
        }
      }

      _polygon_curve.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.EDIT) {
          if (current_part.type === "segment") {
            current_part.segment.point = mouseEvent.point;
            this.segments[current_part.segment.index].point = mouseEvent.point;
            update_item_main_params(_polygon_group.parent);
          }
        }
      }

      _polygon_group.addChild(_polygon_curve);

      // One handle per vertex, shared across all touches.
      // Handles live in create() (not in new_touch) so multiple touches don't duplicate them.
      let _handles_group = new paper.Group({ "name": "handles-group" });
      for (let vi = 0; vi < this.data.segments.length; vi++) {
        const seg = this.data.segments[vi];
        const vpt = (typeof seg[0] === "number")
          ? new paper.Point(seg[0], seg[1])
          : new paper.Point(seg[0]);
        let _handle = new paper.Path.Circle({
          "name": "handle-" + vi,
          "center": vpt,
          "radius": HANDLE_RADIUS
        });
        _handle.style = {
          "strokeWidth": 2,
          "strokeColor": "rgb(255, 0, 212)",
          "fillColor": "white"
        };
        _handle.onMouseEnter = function () { this.style.fillColor = "rgb(255, 0, 212)"; };
        _handle.onMouseLeave = function () { this.style.fillColor = "white"; };
        _handle.onMouseDown = function () {
          if (e256_current_mode === MODE.EDIT) {
            previous_touch = current_touch;
            current_touch = { "id": null }; // null sentinel: suppress MIDI params panel
          }
        };
        _handle.onMouseDrag = function (mouseEvent) {
          if (e256_current_mode !== MODE.EDIT) return;
          this.position = mouseEvent.point;
          // Keep data.segments in sync so the firmware export stays accurate.
          _polygon_group.data.segments[vi] = [mouseEvent.point.x, mouseEvent.point.y];
          _polygon_curve.segments[vi].point = mouseEvent.point;
          // Update the spoke endpoint for this vertex across all touches.
          for (let touch of _touchs_group.children) {
            const spokes = touch.children["spokes-group"];
            if (spokes && spokes.children[vi]) spokes.children[vi].segments[1].point = mouseEvent.point;
          }
          update_item_main_params(_polygon_group.parent);
        };
        _handles_group.addChild(_handle);
      }

      this.addChild(_polygon_group);
      this.addChild(_touchs_group);
      this.addChild(_handles_group);
    },

    // Called when the user clicks on empty canvas space while this polygon is active (EDIT mode).
    // Adds a new vertex at the clicked position, extends all spokes, and registers a new source_N MIDI axis.
    graw: function (mouseEvent) {
      const new_pt = mouseEvent.point;
      const _polygon_group = this.children["polygon-group"];
      const _polygon_curve = _polygon_group.children["polygon"];
      const _touchs_group = this.children["touchs-group"];
      const _handles_group = this.children["handles-group"];
      const vi = this.data.segments.length; // index of the new vertex
      const key = "source_" + vi;

      // Update data model
      this.data.segments.push([new_pt.x, new_pt.y]);
      _polygon_group.data.segments.push([new_pt.x, new_pt.y]);
      _polygon_curve.add(new_pt);

      // Add a spoke from each touch's current position to the new vertex, and extend its MIDI msg.
      for (let touch of _touchs_group.children) {
        const touch_circle = touch.children["touch-circle"];
        const from_pt = touch_circle ? touch_circle.position.clone() : new_pt.clone();
        const _spokes_group = touch.children["spokes-group"];
        let spoke = new paper.Path.Line({ "from": from_pt, "to": new_pt.clone() });
        spoke.style = { "strokeWidth": 1, "strokeColor": "#aaa" };
        spoke.locked = true;
        _spokes_group.addChild(spoke);
        touch.prev_dists.push(0);
        touch.msg[key] = midi_msg_builder(DEFAULT_POLYGON_MODE_DIST);
      }

      // Add a draggable vertex handle for the new point.
      const _handle = new paper.Path.Circle({
        "name": "handle-" + vi,
        "center": new_pt,
        "radius": HANDLE_RADIUS
      });
      _handle.style = {
        "strokeWidth": 2,
        "strokeColor": "rgb(255, 0, 212)",
        "fillColor": "white"
      };
      _handle.onMouseEnter = function () { this.style.fillColor = "rgb(255, 0, 212)"; };
      _handle.onMouseLeave = function () { this.style.fillColor = "white"; };
      _handle.onMouseDown = function () {
        if (e256_current_mode === MODE.EDIT) {
          previous_touch = current_touch;
          current_touch = { "id": null };
        }
      };
      _handle.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode !== MODE.EDIT) return;
        this.position = mouseEvent.point;
        _polygon_group.data.segments[vi] = [mouseEvent.point.x, mouseEvent.point.y];
        _polygon_curve.segments[vi].point = mouseEvent.point;
        for (let touch of _touchs_group.children) {
          const spokes = touch.children["spokes-group"];
          if (spokes && spokes.children[vi]) spokes.children[vi].segments[1].point = mouseEvent.point;
        }
        update_item_main_params(_polygon_group.parent);
      };
      _handles_group.addChild(_handle);

      update_item_main_params(this);
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === MODE.EDIT) {
        if (current_part.type === "fill") {
          move_item(this, mouseEvent);
          // move_item translates the Paper.js hierarchy but does not update data.segments,
          // so read back the new vertex positions manually after the move.
          const curve = this.children["polygon-group"].children["polygon"];
          if (curve) {
            for (let vi = 0; vi < curve.segments.length; vi++) {
              this.data.segments[vi] = [curve.segments[vi].point.x, curve.segments[vi].point.y];
            }
          }
          update_item_main_params(this);
        }
      }
    }

  });

  return _polygon;
};
