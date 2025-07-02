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
  const DEFAULT_POLYGON_MODE_DIST = C_CHANGE;
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

      let polygon = new paper.Path.RegularPolygon(mouseEvent.point, DEFAULT_POLYGON_SIDES, DEFAULT_POLYGON_SIZE).segments;
      this.data.segments = polygon.map(s => [s.point]);

      this.data.msg = [];
      for (let touch_index = 0; touch_index < DEFAULT_POLYGON_TOUCHS; touch_index++) {
        let touch_msg = {};
        for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
          const key = "source_"+ vertex_index;
          touch_msg[key] = midi_msg_builder(DEFAULT_POLYGON_MODE_DIST);
        }
        touch_msg.press = midi_msg_builder(this.data.mode_z);
        this.data.msg.push(touch_msg);
        console.log("touch_msg_" + touch_index + ": " + JSON.stringify(touch_msg));
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
      this.data.touchs = this.children["polygon-group"].data.touchs;

      let previous_mode_z = this.data.mode_z;
      this.data.mode_z = this.children["polygon-group"].data.mode_z;

      this.data.segments = this.children["polygon-group"].data.segments;
      this.data.msg = [];

      for (let touch_index = 0; touch_index < this.data.touchs; touch_index++) {
        let touch_msg = {};
        if (this.data.mode_z != previous_mode_z) {
          for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
            touch_msg["source_" + vertex_index] = midi_msg_builder(this.data.mode_z);
          }
          touch_msg.press = midi_msg_builder(this.data.mode_z);
        }
        else {
          if (touch_index < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[touch_index].msg;
          }
          else {
            for (let vertex_index = 0; vertex_index < this.data.segments.length; vertex_index++) {
              touch_msg["source_" + vertex_index] = midi_msg_builder(this.data.mode_z);
            }
            touch_msg.press = midi_msg_builder(this.data.mode_z);
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
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure! (PLAY_MODE)
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
      
      _touch_circle.onMouseUp = function () {        
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            switch (_polygon.data.mode_z) {
              case NOTE_ON:
                _touch_group.msg.press.midi.status = (_touch_group.msg.press.midi.status & NOTE_OFF);
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
                _touch_group.msg.press.midi.data2 = 0;
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

        if (e256_current_mode === THROUGH_MODE) {
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

    ////// IN PROGRESS ////////////////////////////////////////////
    new_source: function (_segment) {
      let _source_circle = new paper.Path.Circle({
        "name": "source-circle",
        "center": new paper.Point( // This is not exact: contains the pos to the polygon limits
          _segment[0],
          _segment[1]
        ),
        "radius": 100
      });

      _source_circle.style = {
        "strokeWidth": 1,
        "strokeColor": "yelow",
      }
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
        if (e256_current_mode === EDIT_MODE) {
          this.selected = true;
        }
      }

      _polygon_curve.onMouseLeave = function () {
        if (e256_current_mode === EDIT_MODE) {
          this.selected = false;
        }
      }

      _polygon_curve.onMouseDown = function (mouseEvent) {

        if (e256_current_mode === EDIT_MODE) {
          console.log("polygon_2: " + _polygon.data.segments);
          current_part = this;
          console.log("current_part: " + JSON.stringify(current_part));
          if (current_part.type === "stroke") {
            let location = current_part.location;
            _polygon_curve.insert(location.index + 1, mouseEvent.point);
          }
        }
      }

      _polygon_curve.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === EDIT_MODE) {          
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

      for (const _segment of this.data.segments) {
        _source_group.addChild(this.new_source(_segment));
      }

      this.addChild(_source_group);
      this.addChild(_polygon_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (current_part.type === "fill") {
          move_item(this, mouseEvent);
          update_item_main_params(this);
        }
      }
    }

  });

  return _polygon;
};
