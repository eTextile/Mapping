/*
This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SWITCH Factory
function switchFactory() {
  const DEFAULT_SWITCH_WIDTH = 60;
  const DEFAULT_SWITCH_HEIGHT = 60;
  const DEFAULT_SWITCH_MIN_SIZE = 60;
  const DEFAULT_SWITCH_MODE = "TRIGGER";
  const DEFAULT_SWITCH_VELOCITY = "OFF";
  const DEFAULT_SWITCH_AFTERTOUCH = "OFF";
  const DEFAULT_SWITCH_BUTTON_PADDING = 8;

  let half_frame_width = null;
  let half_frame_height = null;

  var _switch = new paper.Group({
    "name": "switch",
    "modes": null,
    "data": {
      "from": null,
      "to": null,
      "mode": null,
      "velocity": null,
      "aftertouch": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.modes = KEY_MODES;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SWITCH_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SWITCH_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SWITCH_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SWITCH_HEIGHT / 2)
      );
      this.data.mode = DEFAULT_SWITCH_MODE;
      this.data.velocity = DEFAULT_SWITCH_VELOCITY;
      this.data.aftertouch = DEFAULT_SWITCH_AFTERTOUCH;
      this.data.msg = new midi_key_touch_msg(0);
      //console.log("AAA"); 
      //console.log("AA " + JSON.stringify(new midi_key_touch_msg(0)));
      console.log("A " + JSON.stringify(this.data.msg.midi.note));
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.mode = params.mode;
      this.data.velocity = params.velocity;
      this.data.aftertouch = params.aftertouch;
      this.data.msg = new midi_key_touch_msg(0);
    },

    save_params: function () {
      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;
      this.data.mode = this.children["switch-group"].data.mode;
      this.data.velocity = this.children["switch-group"].data.velocity;
      this.data.aftertouch = this.children["switch-group"].data.aftertouch;
      this.data.msg = this.children["touchs-group"].firstChild.data;
    },

    // TOUCH_GROUP
    new_touch: function (touch_id) {

      let _touch_group = new paper.Group({
        "name": "touch-" + touch_id,
        "data": this.data.msg
      });

      let _touch_ellipse = new paper.Shape.Ellipse({
        "name": "touch-ellipse",
        "center": new paper.Point(this.data.from.x + half_frame_width, this.data.from.y + half_frame_height),
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
        previous_item = current_item;
        current_item = this.parent;

        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            if (midi_device_connected) {
              switch (_touch_group.parent.data.mode) { // FIXME!
                case "TRIGGER":
                  console.log("TRIGGER");
                  data.msg.midi.note
                  //sendNoteOn(_touch_group.data.msg.midi.note);
                  //setTimeout(_touch_group.triggerOff, 300, _touch_group);
                  break;
                case "TOGGLE":
                  console.log("TOGGLE");
                  //sendNoteOn(_touch_group.data.msg.midi.note);
                  break;
              }
            }
        }
      }

      _touch_ellipse.onMouseRelease = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            break;
          case PLAY_MODE:
            if (midi_device_connected) {
              if (_touch_group.parent.data.mode === "TOGGLE") {
                //sendNoteOff(_touch_group.data.msg.midi.note);
              }
            }
            break;
        }
      }

      _touch_group.addChild(_touch_ellipse);

      return _touch_group;
    },

    create: function () {

      let _switch_group = new paper.Group({
        "name": "switch-group",
        "modes": this.modes,
        "data": {
          "from": this.data.from,
          "to": this.data.to,
          "mode": this.data.mode,
          "velocity": this.data.velocity,
          "aftertouch": this.data.aftertouch
        }
      });

      half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
      half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      _touchs_group.addChild(this.new_touch(0));

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

      _switch_frame.onMouseDown = function () {
        previous_item = current_item;
        current_item = _switch_group;
      }

      _switch_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              switch (current_part.name) {
                case "top-left":
                  this.segments[0].point.x = mouseEvent.point.x;
                  this.segments[1].point = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  _switch_group.data.from = mouseEvent.point;
                  half_frame_width = (_switch_group.data.to.x - _switch_group.data.from.x) / 2;
                  half_frame_height = (_switch_group.data.to.y - _switch_group.data.from.y) / 2;
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new paper.Point(
                      _switch_group.data.to.x - half_frame_width,
                      _switch_group.data.to.y - half_frame_height
                    );
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new paper.Point(
                      _switch_group.data.from.x + half_frame_width,
                      _switch_group.data.to.y - half_frame_height
                    );
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new paper.Point(
                      _switch_group.data.from.x + half_frame_width,
                      _switch_group.data.from.y + half_frame_height
                    );
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
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-ellipse"].position = new paper.Point(
                      _switch_group.data.to.x - half_frame_width,
                      _switch_group.data.from.y + half_frame_height
                    );
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
            update_item_menu_params(_switch_group.parent);
            break;
          case PLAY_MODE:
            //TODO
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
            update_item_menu_params(this);
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
