/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// PATH Factory
// Multitouch MIDI path GUI
// http://paperjs.org/reference/path/#path
function path_factory() {

  const DEFAULT = {
    STROKE_WIDTH: 50,
    TOUCHS: 1,
    MODE_POS: MIDI_TYPE.CONTROL_CHANGE,
    MODE_Z: MIDI_TYPE.NOTE_ON
  }
  
  var _path = new paper.Group({
    "name": "path",
    "data": {
      "touchs": null,
      "segments": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT.TOUCHS;

      this.data.segments = [];
      this.data.segments.push(mouseEvent.point);

      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT.TOUCHS; _touch++) {
        let touch_msg = {};
        touch_msg.pos   = midi_msg_builder(DEFAULT.MODE_POS);
        touch_msg.move  = Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press = midi_msg_builder(DEFAULT.MODE_Z);
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs;
      this.data.segments = params.segments;
      this.data.msg = params.msg;
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["path-group"].data.touchs;

      const _path_curve = this.children["path-group"].children["path-curve"];
      this.data.segments = _path_curve.segments.map(s => s.point.clone());

      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        const prev = (_touch < previous_touch_count)
          ? this.children["touchs-group"].children[_touch].msg
          : {};
        touch_msg.pos   = prev.pos   || midi_msg_builder(DEFAULT.MODE_POS);
        touch_msg.move  = prev.move  || Object.assign(midi_msg_builder(MIDI_TYPE.CONTROL_CHANGE), { enabled: false });
        touch_msg.press = prev.press || midi_msg_builder(DEFAULT.MODE_Z);
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

      let _touch_circle = make_touch_circle(this.data.segments[0], { "fillColor": TOUCH_IDLE_COLOR });

      _touch_circle.on("mouseenter", function () {
        if (e256_current_mode === MODE.EDIT && !touch_selection_locked) show_only_touch(_touch_group);
      });

      _touch_circle.onMouseDown = function () {
        switch (e256_current_mode) {
          case MODE.EDIT:
            show_only_touch(_touch_group, true);
            touch_selection_locked = true;
            break;
          case MODE.THROUGH:
            touch_press_down(_path, _touch_group);
            if (press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.NOTE_ON || press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.CHORD) {
              this.style.fillColor = "red";
              paper.view.update();
            }
            break;
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_circle.onMouseUp = function () {
        if (e256_current_mode !== MODE.THROUGH) return;
        touch_press_up(_path, _touch_group);
        if (press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.NOTE_ON || press_type_from_msg(_touch_group.msg.press) === MIDI_TYPE.CHORD) {
          this.style.fillColor = TOUCH_IDLE_COLOR;
          paper.view.update();
        }
      }

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case MODE.EDIT:
            // N/A
            break;
          case MODE.THROUGH: {
            const _path_curve = _path.children["path-curve"];
            const nearest = _path_curve.getNearestPoint(mouseEvent.point);
            this.position = nearest;
            _touch_label.position = nearest;
            const offset = _path_curve.getOffsetOf(nearest);
            const pos_val = Math.round(mapp(
              offset,
              0, _path_curve.length,
              _touch_group.msg.pos.limit.min,
              _touch_group.msg.pos.limit.max
            ));
            if (pos_val !== _touch_group.prev_pos) {
              _touch_group.prev_pos = pos_val;
              _touch_group.msg.pos.midi.data2 = pos_val;
              send_midi_msg(_touch_group.msg.pos.midi);
            }
            break;
          }
          case MODE.PLAY:
            // N/A
            break;
        }
      }

      _touch_group.addChild(_touch_circle);

      let _touch_label = make_touch_txt(
        this.data.segments[0],
        String(_touch_id + 1),
        { fontSize: FONT_SIZE * 2, fontWeight: "bold", justification: "center", fillColor: "white" }
      );
      _touch_label.position = _touch_circle.position;
      _touch_group.addChild(_touch_label);

      return _touch_group;
    },

    create: function () {
      let _path_group = new paper.Group({
        "name": "path-group",
        "modes_z": this.modes_z,
        "data": {
          "touchs": this.data.touchs,
          "segments": this.data.segments
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
        "strokeWidth": DEFAULT.STROKE_WIDTH,
        "strokeColor": "purple",
        "strokeCap": "round",
        "strokeJoin": "round"
      }

      _path_curve.onMouseEnter = function () {
        if (e256_current_mode === MODE.EDIT) {
          this.selected = true;
        }
      }

      _path_curve.onMouseLeave = function () {
        if (e256_current_mode === MODE.EDIT) {
            this.selected = false;
        }
      }

      _path_curve.onMouseDrag = function (mouseEvent) {
        if (e256_current_mode === MODE.EDIT) {
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
        "strokeWidth": DEFAULT.STROKE_WIDTH,
        "strokeColor": "black",
        "dashArray": [1, 10]
      }

      _path_group.addChild(_graduations);

      _path_group.fit_to_canvas = function() {
        const curve = this.children["path-curve"];
        const grad = this.children["path-graduations"];
        if (!curve || curve.segments.length < 2) return;
        const b = curve.bounds;
        if (b.width === 0 && b.height === 0) return;
        const scale_x = b.width > 0 ? canvas_width / b.width : 1;
        const scale_y = b.height > 0 ? canvas_height / b.height : 1;
        for (let i = 0; i < curve.segments.length; i++) {
          const pt = curve.segments[i].point;
          const nx = (pt.x - b.left) * scale_x;
          const ny = (pt.y - b.top) * scale_y;
          curve.segments[i].point = new paper.Point(nx, ny);
          if (grad && i < grad.segments.length) grad.segments[i].point = new paper.Point(nx, ny);
          if (i < this.data.segments.length) this.data.segments[i] = new paper.Point(nx, ny);
        }
        const mid_pt = curve.segments[Math.floor(curve.segments.length / 2)].point;
        for (const touch of _touchs_group.children) {
          if (touch.children["touch-circle"]) touch.children["touch-circle"].position = mid_pt;
          if (touch.children["touch-txt"]) touch.children["touch-txt"].position = mid_pt;
        }
        update_item_main_params(this.parent);
      };

      this.addChild(_path_group);

      this.addChild(_touchs_group);
    },

    // Called when the user clicks on empty canvas space while this path is active (EDIT mode).
    // Appends a new vertex at the clicked position.
    draw_next_point: function (mouseEvent) {
      this.children["path-group"].children["path-curve"].add(mouseEvent.point);
      this.children["path-group"].children["path-graduations"].add(mouseEvent.point);
      this.children["path-group"].data.segments.push(mouseEvent.point.clone());
      // TODO: Place the touch to the segment middle!
      for (const _touch of this.children["touchs-group"].children) {
        let _path_graduation_interval = this.children["path-group"].children["path-curve"].length / (_touch.msg.pos.limit.max - _touch.msg.pos.limit.min);
        this.children["path-group"].children["path-graduations"].dashArray = [1, _path_graduation_interval];
      }
      //console.log(this.children["path-group"].children["path-curve"].segments);
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case MODE.EDIT:
          if (current_part.type === "fill" || current_part.type === "stroke") {
            move_item(this, mouseEvent);
            update_item_main_params(this);
          }
          break;
        case MODE.THROUGH:
          // N/A
          break;
        case MODE.PLAY:
          // N/A
          break;
      }
    }

  });
  return _path;
};
