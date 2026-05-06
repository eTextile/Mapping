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
  const DEFAULT_POLYGON_STROKE_WIDTH = 10;
  const DEFAULT_POLYGON_TOUCHS = 1;
  const DEFAULT_POLYGON_MODE_DIST = MIDI_TYPE.CONTROL_CHANGE;
  const DEFAULT_POLYGON_MODE_Z = MIDI_TYPE.NOTE_ON;
  const DEFAULT_SOURCE_RADIUS = Math.round(DEFAULT_POLYGON_SIZE / 3);
  const SOURCE_EDGE_TOLERANCE = 14;

  var _polygon = new paper.Group({
    "name": "polygon",
    "data": {
      "touchs": null,
      "segments": null,
      "press": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {

      this.data.touchs = DEFAULT_POLYGON_TOUCHS;
      this.data.press = DEFAULT_POLYGON_MODE_Z;

      let polygon = new paper.Path.RegularPolygon(mouseEvent.point, DEFAULT_POLYGON_SIDES, DEFAULT_POLYGON_SIZE).segments;
      this.data.segments = polygon.map(s => [s.point]);
      this.data.source_radii = new Array(DEFAULT_POLYGON_SIDES).fill(DEFAULT_SOURCE_RADIUS);

      this.data.msg = [];
      for (let touch_index = 0; touch_index < DEFAULT_POLYGON_TOUCHS; touch_index++) {
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
      this.data.source_radii = params.source_radii || new Array(params.segments.length).fill(DEFAULT_SOURCE_RADIUS);
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
      const _srcs = this.children["sources-group"];
      if (_srcs) {
        this.data.source_radii = Array.from(_srcs.children).map(s => s.bounds.width / 2);
      }
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

      let bounding_box = get_bounding_box(_polygon.data.segments);

      let _touch_group = new paper.Group({  
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": new paper.Point( // This is not exact: contains the pos to the polygon limits
          get_random_int(bounding_box.left, bounding_box.right),
          get_random_int(bounding_box.top, bounding_box.bottom)
        ),
        "prev_dists": [this.data.segments.length]
      });

      //console.log(JSON.stringify(this.data.msg[_touch_id].sources[0].midi));

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": _touch_group.pos,
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure! (PLAY)
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
          case MODE.EDIT:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case MODE.THROUGH:
            switch (_polygon.data.press) {
              case MIDI_TYPE.NOTE_ON:
                _touch_group.msg.press.midi.status = (_touch_group.msg.press.midi.status | MIDI_TYPE.NOTE_ON);
                _touch_group.msg.press.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case MIDI_TYPE.CONTROL_CHANGE:
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case MIDI_TYPE.AFTERTOUCH_POLY:
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }
      
      _touch_circle.onMouseUp = function () {        
        switch (e256_current_mode) {
          case MODE.EDIT:
            // N/A
            break;
          case MODE.THROUGH:
            switch (_polygon.data.press) {
              case MIDI_TYPE.NOTE_ON:
                _touch_group.msg.press.midi.status = (_touch_group.msg.press.midi.status & MIDI_TYPE.NOTE_OFF);
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case MIDI_TYPE.CONTROL_CHANGE:
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case MIDI_TYPE.AFTERTOUCH_POLY:
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseDrag = function (mouseEvent) {

        if (e256_current_mode === MODE.THROUGH) {
          // Check if new center is inside polygon
          if (_polygon.contains(mouseEvent.point)) {
            _touch_circle.position = mouseEvent.point;
            _touch_txt.position = mouseEvent.point;
            let bounding_box = get_bounding_box(_polygon.data.segments);
            // Find the distance between the touch and polygon vertex
            for (let vertex_index = 0; vertex_index < _polygon.data.segments.length; vertex_index++) {
              let dist = Math.sqrt(
                Math.pow((_polygon.data.segments[vertex_index][0] - mouseEvent.point.x), 2) +
                Math.pow((_polygon.data.segments[vertex_index][1] - mouseEvent.point.y), 2)
              );
              
              // TODO: Find the polygon centroide

              _touch_group.prev_dists[vertex_index] = _touch_group.msg.sources[vertex_index].midi.data2;
              _touch_group.msg.sources[vertex_index].midi.data2 = Math.round(
                mapp(dist,
                  bounding_box.left,  // This is not exact: contains the pos to the polygon limits
                  bounding_box.right, // This is not exact: contains the pos to the polygon limits
                  _touch_group.msg.sources[vertex_index].limit.min,
                  _touch_group.msg.sources[vertex_index].limit.max
                )
              )
              if (_touch_group.msg.sources[vertex_index].midi.data2 != _touch_group.prev_dists[vertex_index]) {
                send_midi_msg(_touch_group.msg.sources[vertex_index].midi);
              }
            }
          }
        }
      }

      _touch_group.addChild(_touch_circle);

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_group.pos,
        "content": "T: " + _touch_id,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE
      }

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    new_source: function (_polygon_group, _vertex_index, _segment, _radius) {
      // _segment[0] is a paper.Point (from mouse event) or {x,y} (from config) or a number (after drag update where segment=[x,y])
      const center = (typeof _segment[0] === "number")
        ? new paper.Point(_segment[0], _segment[1])
        : new paper.Point(_segment[0]);

      let _source_circle = new paper.Path.Circle({
        "name": "source-circle",
        "center": center,
        "radius": _radius
      });

      _source_circle.style = {
        "strokeWidth": 3,
        "strokeColor": "black",
        "fillColor": new paper.Color(0, 0, 0, 0.05)
      };

      let _drag_mode = null;

      _source_circle.onMouseEnter = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.style.strokeWidth = 6;
          this.style.strokeColor = "red";
        }
      };

      _source_circle.onMouseLeave = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.style.strokeWidth = 3;
          this.style.strokeColor = "black";
        }
      };

      _source_circle.onMouseDown = function (mouseEvent) {
        if (e256_current_mode !== MODE.EDIT) return;
        const dist = this.position.getDistance(mouseEvent.point);
        const r = this.bounds.width / 2;
        _drag_mode = (dist > r - SOURCE_EDGE_TOLERANCE) ? "resize" : "move";
      };

      _source_circle.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode !== MODE.EDIT) return;
        if (_drag_mode === "move") {
          this.position = mouseEvent.point;
          _polygon_group.data.segments[_vertex_index] = [mouseEvent.point.x, mouseEvent.point.y];
          _polygon_group.children["polygon"].segments[_vertex_index].point = mouseEvent.point;
          update_item_main_params(_polygon_group.parent);
        } else if (_drag_mode === "resize") {
          const new_r = this.position.getDistance(mouseEvent.point);
          if (new_r > 10) {
            const old_r = this.bounds.width / 2;
            this.scale(new_r / old_r);
          }
        }
      };

      return _source_circle;
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
        "fillColor": "orange",
        "strokeColor": "purple",
        "strokeJoin": "round"
      }

      _polygon_curve.onMouseEnter = function () {
        if (e256_current_mode === EDIT) {
          this.selected = true;
        }
      }

      _polygon_curve.onMouseLeave = function () {
        if (e256_current_mode === EDIT) {
          this.selected = false;
        }
      }

      _polygon_curve.onMouseDown = function (mouseEvent) {

        if (e256_current_mode === EDIT) {
          current_part = this;
          if (current_part.type === "stroke") {
            let location = current_part.location;
            _polygon_curve.insert(location.index + 1, mouseEvent.point);
          }
        }
      }

      _polygon_curve.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === EDIT) {          
          if (current_part.type === "segment") {
            current_part.segment.point = mouseEvent.point;
            this.segments[current_part.segment.index].point = mouseEvent.point;
            update_item_main_params(_polygon_group.parent);     
          }
        }
      }

      _polygon_group.addChild(_polygon_curve);
      
      //////////////////////////// ADDING SOURCES
      let _source_group = new paper.Group({
        "name": "sources-group"
      });

      for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
        _source_group.addChild(
          this.new_source(_polygon_group, vertex_index, this.data.segments[vertex_index], this.data.source_radii[vertex_index])
        );
      }

      this.addChild(_source_group);
      this.addChild(_polygon_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT) {
        if (current_part.type === "fill") {
          move_item(this, mouseEvent);
          update_item_main_params(this);
        }
      }
    }

  });

  return _polygon;
};
