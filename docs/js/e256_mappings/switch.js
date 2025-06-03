/*
This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SWITCH Factory
function switch_factory() {
  const DEFAULT_SWITCH_WIDTH = canvas_width / SCALE_X;
  const DEFAULT_SWITCH_HEIGHT = canvas_height / SCALE_X;
  //const DEFAULT_SWITCH_MIN_SIZE = 50;
  const DEFAULT_SWITCH_TOUCHS = 1;
  const DEFAULT_SWITCH_MODE_Z = NOTE_ON;
  const DEFAULT_SWITCH_BUTTON_PADDING = 8;

  let half_frame_width = null;
  let half_frame_height = null;

  let switch_radius_size_width = null;
  let switch_radius_size_height = null;

  var _switch = new paper.Group({
    "name": "switch",
    "modes": {
      0: "NOTE_ON",        // TRIGGER NOTE WITH VELOCITY
      1: "C_CHANGE",       // PRESSURE ONLY
      2: "AFTERTOUCH_POLY" // TRIGGER NOTE AND MODULATE
    },
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT_SWITCH_TOUCHS;
      this.data.mode_z = DEFAULT_SWITCH_MODE_Z;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SWITCH_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SWITCH_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SWITCH_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SWITCH_HEIGHT / 2)
      );
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_SWITCH_TOUCHS; _touch++) {
        let touch_msg = {};
        switch (this.data.mode_z) {
          case NOTE_ON:
            touch_msg.note = midi_msg_builder(NOTE_ON);
            break;
          case C_CHANGE:
            touch_msg.press = midi_msg_builder(C_CHANGE);
            break;
          case AFTERTOUCH_POLY:
            touch_msg.note = midi_msg_builder(NOTE_ON);
            touch_msg.press = midi_msg_builder(C_CHANGE);
            break;
        }
        this.data.msg.push(touch_msg);
      }
    },

    setup_from_config: function (params) {
      this.data.touchs = params.touchs;
      this.data.from = new paper.Point(
        mapp(params.from[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.from[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.to = new paper.Point(
        mapp(params.to[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.to[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.mode_z = params.mode_z;
      this.data.msg = params.msg;
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      this.data.touchs = this.children["switch-group"].data.touchs;
      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;

      let previous_mode_z = this.data.mode_z;
      this.data.mode_z = this.children["switch-group"].data.mode_z;
      
      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touchs; _touch++) {
        let touch_msg = {};
        if (this.data.mode_z != previous_mode_z) {
          switch (this.data.mode_z) {
            case NOTE_ON:
              touch_msg.note = midi_msg_builder(NOTE_ON);
              break;
            case C_CHANGE:
              touch_msg.press = midi_msg_builder(C_CHANGE);
              break;
            case AFTERTOUCH_POLY:
              touch_msg.note = midi_msg_builder(NOTE_ON);
              touch_msg.press = midi_msg_builder(C_CHANGE);
              break;
          }
        }
        else {
          if (_touch < previous_touch_count) {
            touch_msg = this.children["touchs-group"].children[_touch].msg;
          }
          else {
            switch (this.data.mode_z) {
              case NOTE_ON:
                touch_msg.note = midi_msg_builder(NOTE_ON);
                break;
              case C_CHANGE:
                touch_msg.press = midi_msg_builder(C_CHANGE);
                break;
              case AFTERTOUCH_POLY:
                touch_msg.note = midi_msg_builder(NOTE_ON);
                touch_msg.press = midi_msg_builder(C_CHANGE);
                break;
            }
          }
        }
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_switch, _touch_id) {

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "msg": this.data.msg[_touch_id],
        "pos": new paper.Point(this.data.from.x + half_frame_width, this.data.from.y + half_frame_height),
      });

      let _touch_ellipse = new paper.Shape.Ellipse({
        "name": "touch-ellipse",
        "center": _touch_group.pos,
        "radius": new paper.Point((switch_radius_size_width * DEFAULT_SWITCH_TOUCHS) - (_touch_id * switch_radius_size_width), (switch_radius_size_height * DEFAULT_SWITCH_TOUCHS) - (_touch_id * switch_radius_size_height)),
      });

      _touch_ellipse.style = {
        "fillColor": "pink"
      }

      _touch_ellipse.onMouseEnter = function () {
        //this.style.fillColor = "orange";
      }

      _touch_ellipse.onMouseLeave = function () {
        //this.style.fillColor = "pink";
      }

      _touch_ellipse.onMouseDown = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case THROUGH_MODE:
            this.style.fillColor = "orange";
            switch (_switch.data.mode_z) {
              case NOTE_ON:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status | NOTE_ON);
                _touch_group.msg.note.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.note.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = get_random_int(64, 127);
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status | NOTE_ON);
                _touch_group.msg.note.midi.data2 = 127;
                send_midi_msg(_touch_group.msg.note.midi);
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

      _touch_ellipse.onMouseUp = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // N/A
            break;
          case THROUGH_MODE:
            this.style.fillColor = "pink";
            switch (_switch.data.mode_z) {
              case NOTE_ON:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status & NOTE_OFF);
                _touch_group.msg.note.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.note.midi);
                break;
              case C_CHANGE:
                _touch_group.msg.press.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.press.midi);
                break;
              case AFTERTOUCH_POLY:
                _touch_group.msg.note.midi.status = (_touch_group.msg.note.midi.status & NOTE_OFF);
                _touch_group.msg.note.midi.data2 = 0;
                send_midi_msg(_touch_group.msg.note.midi);
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
      _touch_group.addChild(_touch_ellipse);

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_group.pos,
        //"content": JSON.stringify(_touch_group.msg),
        "content": null,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE
      };

      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {

      let _switch_group = new paper.Group({
        "name": "switch-group",
        "modes": this.modes,
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "mode_z": this.data.mode_z,
        }
      });

      half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
      half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;

      switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
      switch_radius_size_height = (half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _switch_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_switch_group, _touch));
      }

      let _switch_frame = new paper.Path.Rectangle({
        "name": "switch-frame",
        "from": _switch_group.data.from,
        "to": _switch_group.data.to
      });

      _switch_frame.style = {
        "fillColor": "skyblue"
      }

      _switch_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case THROUGH_MODE:
            break;
          case PLAY_MODE:
            break;
        }
      }

      _switch_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case THROUGH_MODE:
            break;
          case PLAY_MODE:
            break;
        }
      }

      /*
      _switch_frame.onMouseDown = function () {
      }
      */

      _switch_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            let new_pos = new paper.Point();
            if (current_part.type === "bounds") {
              switch (current_part.name) {
                case "top-left":
                  this.segments[0].point.x = mouseEvent.point.x;
                  this.segments[1].point = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  _switch_group.data.from = mouseEvent.point;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.to.x - half_frame_width;
                  new_pos.y = _switch_group.data.to.y - half_frame_height;
                  switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  switch_radius_size_height = (half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      (switch_radius_size_width * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_width),
                      (switch_radius_size_height * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_height)
                    ];
                  }
                  break;
                case "top-right":
                  this.segments[1].point.y = mouseEvent.point.y;
                  this.segments[2].point = mouseEvent.point;
                  this.segments[3].point.x = mouseEvent.point.x;
                  _switch_group.data.from.y = mouseEvent.point.y;
                  _switch_group.data.to.x = mouseEvent.point.x;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.from.x + half_frame_width;
                  new_pos.y = _switch_group.data.to.y - half_frame_height;
                  switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  switch_radius_size_height = (half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      (switch_radius_size_width * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_width),
                      (switch_radius_size_height * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_height)
                    ];
                  }
                  break;
                case "bottom-right":
                  this.segments[2].point.x = mouseEvent.point.x;
                  this.segments[3].point = mouseEvent.point;
                  this.segments[0].point.y = mouseEvent.point.y;
                  _switch_group.data.to = mouseEvent.point;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.from.x + half_frame_width;
                  new_pos.y = _switch_group.data.from.y + half_frame_height;switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  switch_radius_size_height = (half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;                  
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      (switch_radius_size_width * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_width),
                      (switch_radius_size_height * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_height)
                    ];
                  }
                  break;
                case "bottom-left":
                  this.segments[3].point.y = mouseEvent.point.y;
                  this.segments[0].point = mouseEvent.point;
                  this.segments[1].point.x = mouseEvent.point.x;
                  _switch_group.data.from.x = mouseEvent.point.x;
                  _switch_group.data.to.y = mouseEvent.point.y;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  new_pos.x = _switch_group.data.to.x - half_frame_width;
                  new_pos.y = _switch_group.data.from.y + half_frame_height;
                  switch_radius_size_width = (half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  switch_radius_size_height = (half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING) / DEFAULT_SWITCH_TOUCHS;
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      (switch_radius_size_width * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_width),
                      (switch_radius_size_height * DEFAULT_SWITCH_TOUCHS) - (_touch.name[_touch.name.length - 1] * switch_radius_size_height)
                    ];
                  }
                  break;
                default:
                  //console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_main_params(_switch_group.parent);
            break;
          case PLAY_MODE:
            // N/A
            break;
        }
      }

      _switch_group.addChild(_switch_frame);
      this.addChild(_switch_group);
      this.addChild(_touchs_group);
    },

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            move_item(this, mouseEvent);
            update_item_main_params(this);
          }
          break;
        case PLAY_MODE:
          // N/A
          break;
      }
    }

  });
  return _switch;
};
