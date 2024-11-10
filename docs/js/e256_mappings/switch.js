/*
This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SWITCH Factory
function switchFactory() {
  const DEFAULT_SWITCH_WIDTH = canvas_width / RAW_COLS;
  const DEFAULT_SWITCH_HEIGHT = canvas_height / RAW_ROWS;
  const DEFAULT_SWITCH_MIN_SIZE = canvas_height / RAW_ROWS;

  const DEFAULT_SWITCH_MODE_Z = NOTE_ON;
  const DEFAULT_SWITCH_BUTTON_PADDING = 8;

  //let current_frame_width = null;
  //let previous_frame_width = null;
  //let current_frame_height = null;
  //let previous_frame_height = null;

  let half_frame_width = null;
  let half_frame_height = null;

  var _switch = new paper.Group({
    "name": "switch",
    "modes": {
      0: "NOTE_ON",     // TRIGGER WITH VELOCITY
      1: "C_CHANGE",    // PRESSURE ONLY
      2: "P_AFTERTOUCH" // TRIGGER AND PRESSURE
    },
    "data": {
      "from": null,
      "to": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
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
      let touch_msg = {};
      touch_msg.press = midi_msg_builder(DEFAULT_SWITCH_MODE_Z);
      this.data.msg.push(touch_msg);
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(
        mapp(params.from[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.from[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.to = new paper.Point(
        mapp(params.to[0], 0, NEW_COLS, 0, canvas_width),
        mapp(params.to[1], 0, NEW_ROWS, 0, canvas_height)
      );
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.mode_z = status.type;
    },

    save_params: function () {
      let previous_touch_mode_z = this.data.mode_z;
      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;
      this.data.mode_z = this.children["switch-group"].data.mode_z;
      this.data.msg = [];
      if (this.data.mode_z == previous_touch_mode_z) {
        let status = midi_msg_status_unpack(this.children["touchs-group"].children[0].msg.press.midi.status);
        let new_status = midi_msg_status_pack(this.data.mode_z, status.channel);
        this.children["touchs-group"].children[0].msg.press.midi.status = new_status;
        this.data.msg.push(this.children["touchs-group"].children[0].msg);
      }
      else {
        let touch_msg = {};
        touch_msg.press = midi_msg_builder(this.data.mode_z);
        this.data.msg.push(touch_msg);
      }
    },

    new_touch: function (_switch, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "pos": new paper.Point(this.data.from.x + half_frame_width, this.data.from.y + half_frame_height),
        "msg": this.data.msg[0]
      });

      let _touch_ellipse = new paper.Shape.Ellipse({
        "name": "touch-ellipse",
        "center": _touch_group.pos,
        "radius": new paper.Point(half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING, half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING),
      });

      _touch_ellipse.style = {
        "fillColor": "pink"
      }

      _touch_ellipse.onMouseEnter = function () {
        this.style.fillColor = "orange";
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      _touch_ellipse.onMouseLeave = function () {
        this.style.fillColor = "pink";
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      _touch_ellipse.onMouseDown = function () {
        previous_touch = current_touch;
        current_touch = _touch_group;
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_ON
            _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status | (NOTE_ON << 4);
            _touch_group.msg.press.midi.data2 = 127;
            send_midi_msg(_touch_group.msg.press.midi);
        }
      }

      _touch_ellipse.onMouseUp = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_OFF
            _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status & (NOTE_OFF << 4);
            _touch_group.msg.press.midi.data2 = 0;
            send_midi_msg(_touch_group.msg.press.midi);
        }
      }
      _touch_group.addChild(_touch_ellipse);

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": _touch_group.pos,
        "content": _touch_group.msg.press.midi.data1,
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
          "from": this.data.from,
          "to": this.data.to,
          "mode_z": this.data.mode_z,
        }
      });

      half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
      half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      _touchs_group.addChild(this.new_touch(_switch_group, 0));

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
          case PLAY_MODE:
            break;
        }
      }

      _switch_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING,
                      half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING,
                      half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING
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
                  new_pos.y = _switch_group.data.from.y + half_frame_height;
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING,
                      half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new_pos;
                    _touch.children["touch-txt"].position = new_pos;
                    _touch.children["touch-ellipse"].radius = [
                      half_frame_width - DEFAULT_SWITCH_BUTTON_PADDING,
                      half_frame_height - DEFAULT_SWITCH_BUTTON_PADDING
                    ];
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_menu_1st_level(_switch_group.parent);
            break;
          case PLAY_MODE:
            // NA
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
            update_menu_1st_level(this);
          }
          break;
        case PLAY_MODE:
          // NA
          break;
      }
    }
  });

  return _switch;
};
