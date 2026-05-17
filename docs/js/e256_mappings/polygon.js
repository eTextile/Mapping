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

      let polygon = new paper.Path.RegularPolygon(mouseEvent.point, DEFAULT_POLYGON_SIDES, DEFAULT_POLYGON_SIZE).segments;
      this.data.segments = polygon.map(s => [s.point]);
      this.data.touchs = DEFAULT_POLYGON_TOUCHS; // one central touch

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
      this.data.segments = params.segments;
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
          for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
            touch_msg["source_" + vertex_index] = midi_msg_builder(this.data.press);
          }
          touch_msg.press = midi_msg_builder(this.data.press);
        }
        else {
          if (touch_index < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[touch_index].msg;
          }
          else {
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

      function seg_pt(seg) {
        return (typeof seg[0] === "number")
          ? new paper.Point(seg[0], seg[1])
          : new paper.Point(seg[0]);
      }

      // Compute centroid
      let cx = 0, cy = 0;
      for (let seg of _polygon.data.segments) {
        let pt = seg_pt(seg);
        cx += pt.x; cy += pt.y;
      }
      const centroid = new paper.Point(cx / _polygon.data.segments.length, cy / _polygon.data.segments.length);

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": centroid,
        "prev_dists": new Array(_polygon.data.segments.length).fill(0)
      });

      // Spokes: lines from central touch to each vertex
      let _spokes_group = new paper.Group({ "name": "spokes-group" });
      for (let vi = 0; vi < _polygon.data.segments.length; vi++) {
        let spoke = new paper.Path.Line({
          "from": centroid.clone(),
          "to": seg_pt(_polygon.data.segments[vi])
        });
        spoke.style = { "strokeWidth": 1, "strokeColor": "#aaa" };
        spoke.locked = true;
        _spokes_group.addChild(spoke);
      }
      _touch_group.addChild(_spokes_group);

      // Central touch circle
      let _touch_circle = make_touch_circle(centroid, { "fillColor": "orange" });

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
          _touch_circle.position = mouseEvent.point;
          for (let spoke of _spokes_group.children) {
            spoke.segments[0].point = mouseEvent.point;
          }
        } else if (e256_current_mode === MODE.THROUGH) {
          const _polygon_curve = _polygon.children["polygon"];
          if (_polygon_curve && _polygon_curve.contains(mouseEvent.point)) {
            _touch_circle.position = mouseEvent.point;
            const bounds = _polygon_curve.bounds;
            const max_dist = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height);
            for (let vi = 0; vi < _spokes_group.children.length; vi++) {
              _spokes_group.children[vi].segments[0].point = mouseEvent.point;
              const vpt = seg_pt(_polygon.data.segments[vi]);
              const dist = mouseEvent.point.getDistance(vpt);
              const key = "source_" + vi;
              if (_touch_group.msg[key]) {
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

      // Vertex handles (EDIT only — drag moves vertex + updates spoke + source circle)
      let _handles_group = new paper.Group({ "name": "handles-group" });
      for (let vi = 0; vi < _polygon.data.segments.length; vi++) {
        let _handle = new paper.Path.Circle({
          "name": "handle-" + vi,
          "center": seg_pt(_polygon.data.segments[vi]),
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
          _polygon.data.segments[vi] = [mouseEvent.point.x, mouseEvent.point.y];
          _polygon.children["polygon"].segments[vi].point = mouseEvent.point;
          _spokes_group.children[vi].segments[1].point = mouseEvent.point;
          update_item_main_params(_polygon.parent);
        };
        _handles_group.addChild(_handle);
      }
      _touch_group.addChild(_handles_group);

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

      this.addChild(_polygon_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === MODE.EDIT) {
        if (current_part.type === "fill") {
          move_item(this, mouseEvent);
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
