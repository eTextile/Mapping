/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
function knob_factory() {
  const DEFAULT_KNOB_TOUCHS = 1;
  const DEFAULT_KNOB_RADIUS = 250;
  const DEFAULT_KNOB_OFFSET = -45;
  const DEFAULT_KNOB_MIN_SIZE = 30;
  const DEFAULT_KNOB_MODE_R = C_CHANGE;
  const DEFAULT_KNOB_MODE_T = C_CHANGE;
  const DEFAULT_KNOB_MODE_Z = NOTE_ON;

  var _knob = new paper.Group({
    "name": "knob",
    "center": null,
    "radius": null,
    "theta": null,
    "modes": {
      0: "NOTE_ON",     // TRIGGER WITH VELOCITY
      1: "C_CHANGE",    // PRESSURE ONLY
      2: "AFTERTOUCH_POLY" // TRIGGER AND PRESSURE
    },
    "data": {
      "touchs": null,
      "from": null,
      "to": null,
      "offset": null,
      "mode_z": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touchs = DEFAULT_KNOB_TOUCHS;
      this.data.mode_z = DEFAULT_KNOB_MODE_Z;
      this.radius = DEFAULT_KNOB_RADIUS;
      this.data.from = new paper.Point(
        mouseEvent.point.x - this.radius,
        mouseEvent.point.y - this.radius
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + this.radius,
        mouseEvent.point.y + this.radius
      );
      this.data.offset = DEFAULT_KNOB_OFFSET;
      this.center = mouseEvent.point;
      this.theta = deg_to_rad(DEFAULT_KNOB_OFFSET);
      this.data.msg = [];
      let midi_touch;
      for (let _touch = 0; _touch < DEFAULT_KNOB_TOUCHS; _touch++) {
        midi_touch = {};
        midi_touch.radius = midi_msg_builder(DEFAULT_KNOB_MODE_R);
        midi_touch.theta = midi_msg_builder(DEFAULT_KNOB_MODE_T);
        midi_touch.press = midi_msg_builder(DEFAULT_KNOB_MODE_Z);
        this.data.msg.push(midi_touch);
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
      this.data.offset = params.offset;
      this.data.msg = params.msg;
      let status = midi_msg_status_unpack(params.msg[0].press.midi.status);
      this.data.mode_z = status.type;

      this.radius = (this.data.to.x - this.data.from.x) / 2;
      this.center = new paper.Point(this.data.from.x + this.radius, this.data.from.y + this.radius);
      this.theta = deg_to_rad(this.data.offset);
    },

    save_params: function () {
      let previous_touch_count = this.data.touchs;
      let previous_touch_mode_z = this.data.mode_z;
      this.data.touchs = this.children["knob-group"].data.touchs;
      this.data.from = this.children["knob-group"].data.from;
      this.data.to = this.children["knob-group"].data.to;
      this.data.offset = this.children["knob-group"].data.offset;
      this.data.mode_z = this.children["knob-group"].data.mode_z;

      this.data.msg = [];
      let midi_touch;
      if (this.data.mode_z !== previous_touch_mode_z) {
        for (let _touch = 0; _touch < this.data.touchs; _touch++) {
          midi_touch = {};
          midi_touch.radius = midi_msg_builder(DEFAULT_KNOB_MODE_R);
          midi_touch.theta = midi_msg_builder(DEFAULT_KNOB_MODE_T);
          midi_touch.press = midi_msg_builder(this.data.mode_z);
          this.data.msg.push(midi_touch);
        }
      }
      else {
        for (let _touch = 0; _touch < this.data.touchs; _touch++) {
          if (_touch < previous_touch_count) {
            let status = midi_msg_status_unpack(this.children["touchs-group"].children[_touch].msg.press.midi.status);
            let new_status = midi_msg_status_pack(this.data.mode_z, status.channel);
            this.children["touchs-group"].children[_touch].msg.press.midi.status = new_status;
            this.data.msg.push(this.children["touchs-group"].children[_touch].msg);
          }
          else {
            midi_touch = {};
            midi_touch.radius = midi_msg_builder(DEFAULT_KNOB_MODE_R);
            midi_touch.theta = midi_msg_builder(DEFAULT_KNOB_MODE_T);
            midi_touch.press = midi_msg_builder(this.data.mode_z);
            this.data.msg.push(midi_touch);
          }
        }
      }
      this.center = this.children["knob-group"].center;
      this.radius = this.children["knob-group"].radius;
      this.theta = this.children["knob-group"].theta;
    },

    new_touch: function (_knob, _touch_id) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "center": this.center,
        "radius": get_random_int(50, this.radius - 10),
        "theta": deg_to_rad(get_random_int(0, 360)),
        "msg": this.data.msg[_touch_id],
        "prev_pos_r": null, // radius
        "prev_pos_t": null, // theta
        "prev_pos_z": null, // pressure
      });

      let _knob_touch_pos = pol_to_cart(_touch_group.radius, _touch_group.theta);

      let _knob_needle = new paper.Path.Line({
        "name": "knob-needle",
        "from": _touch_group.center,
        "to": new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y),
        "locked": true
      });

      _knob_needle.style = {
        "strokeCap": "round",
        "strokeColor": "black",
        "strokeWidth": 2
      }

      let _knob_touch = new paper.Shape.Circle({
        "name": "knob-touch",
        "center": new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y),
        "radius": TOUCH_RADIUS
      });

      _knob_touch.style = {
        "fillColor": "black"
      }

      _knob_touch.onMouseEnter = function () {
        this.style.fillColor = "red";
      }

      _knob_touch.onMouseLeave = function () {
        this.style.fillColor = "black";
      }

      _knob_touch.onMouseDown = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            previous_touch = current_touch;
            current_touch = _touch_group;
            break;
          case PLAY_MODE:
            // Set midi_msg status to NOTE_ON
            _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status | NOTE_ON;
            _touch_group.msg.press.midi.data2 = 127;
            send_midi_msg(_touch_group.msg.press.midi);
            break;
        }
      }

      _knob_touch.onMouseUp = function () {
        // Set midi_msg status to NOTE_OFF
        _touch_group.msg.press.midi.status = _touch_group.msg.press.midi.status & NOTE_OFF;
        _touch_group.msg.press.midi.data2 = 0;
        send_midi_msg(_touch_group.msg.press.midi);
      }

      _knob_touch.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // NA
            break;
          case PLAY_MODE:
            let x = mouseEvent.point.x - _knob.center.x; // Place the x origin to the circle center
            let y = mouseEvent.point.y - _knob.center.y; // Place the y origin to the circle center
            let polar = cart_to_pol(x, y);
            let new_polar = 0;
            if (polar.radius > _knob.radius) {
              new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'clockwise');
              //new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'counter-clockwise');
              _touch_group.msg.theta.midi.data2 = Math.round(mapp(new_polar, 0, 380, _touch_group.msg.theta.limit.min, _touch_group.msg.theta.limit.max));
              _knob_touch_pos = pol_to_cart(_knob.radius, polar.theta);
            } else {
              _touch_group.msg.radius.midi.data2 = Math.round(mapp(polar.radius, _knob.radius, 0, _touch_group.msg.radius.limit.min, _touch_group.msg.radius.limit.max));
              new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'clockwise');
              //new_polar = rotate_polar(rad_to_deg(polar.theta), _knob.data.offset, 'counter-clockwise');
              _touch_group.msg.theta.midi.data2 = Math.round(mapp(new_polar, 0, 380, _touch_group.msg.theta.limit.min, _touch_group.msg.theta.limit.max));
              _knob_touch_pos = pol_to_cart(polar.radius, polar.theta);
            }
            _knob_touch.position = new paper.Point(_knob.center.x + _knob_touch_pos.x, _knob.center.y + _knob_touch_pos.y);
            _knob_needle.segments[1].point = new paper.Point(_knob.center.x + _knob_touch_pos.x, _knob.center.y + _knob_touch_pos.y);

            if (_touch_group.msg.radius.midi.data2 != _touch_group.prev_pos_r) {
              _touch_group.prev_pos_r = _touch_group.msg.radius.midi.data2;
              send_midi_msg(_touch_group.msg.radius.midi);
            }
            if (_touch_group.msg.theta.midi.data2 != _touch_group.prev_pos_t) {
              _touch_group.prev_pos_t = _touch_group.msg.theta.midi.data2;
              send_midi_msg(_touch_group.msg.theta.midi);
            }
            break;
        }
      }

      let _touch_txt = new paper.PointText({
        "name": "touch-txt",
        "point": new paper.Point(_touch_group.center.x + _knob_touch_pos.x, _touch_group.center.y + _knob_touch_pos.y),
        "content": _touch_group.msg.press.midi.data1,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "purple",
        "fontSize": FONT_SIZE
      };

      _touch_group.addChild(_knob_needle);
      _touch_group.addChild(_knob_touch);
      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {

      let _knob_group = new paper.Group({
        "name": "knob-group",
        "modes": this.modes,
        "center": this.center,
        "radius": this.radius,
        "theta": this.theta,
        "data": {
          "touchs": this.data.touchs,
          "from": this.data.from,
          "to": this.data.to,
          "offset": this.data.offset,
          "mode_z": this.data.mode_z
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _knob_group.data.touchs; _touch++) {
        _touchs_group.addChild(this.new_touch(_knob_group, _touch));
      }

      let _knob_circle = new paper.Shape.Circle({
        //"name": "knob-circle",
        "center": _knob_group.center,
        "radius": _knob_group.radius
      });

      _knob_circle.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": "Purple"
      }

      _knob_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "fill") {
              move_item(_knob_group.parent, mouseEvent);
              _knob_group.center = this.position;
              update_item_main_params(_knob_group.parent);
            }
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      let _knob_offset_pos = pol_to_cart(_knob_group.radius, _knob_group.theta);
      let _knob_offset = new paper.Shape.Circle({
        //"name": "knob-offset",
        "center": new paper.Point(_knob_group.center.x + _knob_offset_pos.x, _knob_group.center.y + _knob_offset_pos.y),
        "radius": TOUCH_RADIUS // TODO: mapping with the blob pressure!
      });

      _knob_offset.style = {
        "fillColor": "red"
      }

      _knob_offset.onMouseDrag = function (mouseEvent) {

        switch (e256_current_mode) {
          case EDIT_MODE:
            _knob_group.theta = cart_to_pol(
              mouseEvent.point.x - _knob_group.center.x,
              mouseEvent.point.y - _knob_group.center.y
            ).theta;

            _knob_offset_pos = pol_to_cart(_knob_group.radius, _knob_group.theta);
            this.position = new paper.Point(
              _knob_group.center.x + _knob_offset_pos.x,
              _knob_group.center.y + _knob_offset_pos.y
            );

            _knob_group.data.offset = rad_to_deg(_knob_group.theta);
            update_item_main_params(_knob_group.parent);
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      let _knob_frame = new paper.Path.Rectangle({
        "name": "key-frame",
        "from": _knob_group.data.from,
        "to": _knob_group.data.to
      });

      _knob_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": new paper.Color(1, 0, 0, 0.01)
      }

      _knob_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _knob_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _knob_frame.onMouseDrag = function (mouseEvent) {
        let _knob_previous_radius = null;
        let _knob_frame_whdth = null;

        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              switch (current_part.name) {
                case "top-left":
                  this.segments[0].point.x = mouseEvent.point.x;
                  this.segments[1].point = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  _knob_frame_whdth = this.bounds.right - mouseEvent.point.x;
                  this.segments[0].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.segments[3].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  _knob_group.data.from = mouseEvent.point;
                  _knob_group.data.to.y = mouseEvent.point.y + _knob_frame_whdth;

                  _knob_previous_radius = _knob_circle.radius;
                  _knob_group.radius = (_knob_group.data.to.x - _knob_group.data.from.x) / 2;
                  _knob_circle.radius = _knob_group.radius;
                  _knob_circle.position = new paper.Point(
                    _knob_group.data.to.x - _knob_group.radius,
                    _knob_group.data.to.y - _knob_group.radius
                  );
                  // "knob-offset"
                  _knob_group.center = _knob_circle.position;
                  _knob_offset_pos = pol_to_cart(_knob_group.radius, deg_to_rad(_knob_group.data.offset));
                  _knob_offset.position.x = _knob_group.center.x + _knob_offset_pos.x;
                  _knob_offset.position.y = _knob_group.center.y + _knob_offset_pos.y;
                  // "knob-touch" & "knob-needle"
                  for (const _touch of _touchs_group.children) {
                    _touch.radius = (_touch.radius * _knob_group.radius) / _knob_previous_radius;
                    _knob_touch_pos = pol_to_cart(_touch.radius, _touch.theta);
                    _touch.children["knob-touch"].position = new paper.Point(
                      _knob_group.center.x + _knob_touch_pos.x,
                      _knob_group.center.y + _knob_touch_pos.y
                    );
                    _touch.children["touch-txt"].position = _touch.children["knob-touch"].position;
                    _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                    _touch.children["knob-needle"].segments[1].point = _touch.children["knob-touch"].position;
                  }
                  break;

                case "top-right":
                  this.segments[1].point.y = mouseEvent.point.y;
                  this.segments[2].point = mouseEvent.point;
                  this.segments[3].point.x = mouseEvent.point.x;
                  _knob_frame_whdth = mouseEvent.point.x - this.bounds.left;
                  this.segments[0].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.segments[3].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  _knob_group.data.from.y = mouseEvent.point.y;
                  _knob_group.data.to.x = mouseEvent.point.x;
                  _knob_group.data.to.y = mouseEvent.point.y + _knob_frame_whdth;

                  _knob_previous_radius = _knob_circle.radius;
                  _knob_group.radius = (_knob_group.data.to.x - _knob_group.data.from.x) / 2;
                  _knob_circle.radius = _knob_group.radius;
                  _knob_circle.position = new paper.Point(
                    _knob_group.data.from.x + _knob_group.radius,
                    _knob_group.data.to.y - _knob_group.radius
                  );
                  // "knob-offset"
                  _knob_group.center = _knob_circle.position;
                  _knob_offset_pos = pol_to_cart(_knob_group.radius, deg_to_rad(_knob_group.data.offset));
                  _knob_offset.position.x = _knob_group.center.x + _knob_offset_pos.x;
                  _knob_offset.position.y = _knob_group.center.y + _knob_offset_pos.y;
                  // "knob-touch" & "knob-needle"
                  for (const _touch of _touchs_group.children) {
                    _touch.radius = (_touch.radius * _knob_group.radius) / _knob_previous_radius;
                    _knob_touch_pos = pol_to_cart(_touch.radius, _touch.theta);
                    _touch.children["knob-touch"].position = new paper.Point(
                      _knob_group.center.x + _knob_touch_pos.x,
                      _knob_group.center.y + _knob_touch_pos.y
                    );
                    _touch.children["touch-txt"].position = _touch.children["knob-touch"].position;
                    _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                    _touch.children["knob-needle"].segments[1].point = _touch.children["knob-touch"].position;
                  }
                  break;

                case "bottom-right":
                  this.segments[2].point.x = mouseEvent.point.x;
                  this.segments[3].point = mouseEvent.point;
                  this.segments[0].point.y = mouseEvent.point.y;
                  _knob_frame_whdth = mouseEvent.point.x - this.bounds.left;
                  this.segments[1].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.segments[2].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  _knob_group.data.from.y = mouseEvent.point.y - _knob_frame_whdth;
                  _knob_group.data.to = mouseEvent.point;

                  _knob_previous_radius = _knob_circle.radius;
                  _knob_group.radius = (_knob_group.data.to.x - _knob_group.data.from.x) / 2;
                  _knob_circle.radius = _knob_group.radius;
                  _knob_circle.position = new paper.Point(
                    _knob_group.data.from.x + _knob_group.radius,
                    _knob_group.data.from.y + _knob_group.radius
                  );
                  // "knob-offset"
                  _knob_group.center = _knob_circle.position;
                  _knob_offset_pos = pol_to_cart(_knob_group.radius, deg_to_rad(_knob_group.data.offset));
                  _knob_offset.position.x = _knob_group.center.x + _knob_offset_pos.x;
                  _knob_offset.position.y = _knob_group.center.y + _knob_offset_pos.y;
                  // "knob-touch" & "knob-needle"
                  for (const _touch of _touchs_group.children) {
                    _touch.radius = (_touch.radius * _knob_group.radius) / _knob_previous_radius;
                    _knob_touch_pos = pol_to_cart(_touch.radius, _touch.theta);
                    _touch.children["knob-touch"].position = new paper.Point(
                      _knob_group.center.x + _knob_touch_pos.x,
                      _knob_group.center.y + _knob_touch_pos.y
                    );
                    _touch.children["touch-txt"].position = _touch.children["knob-touch"].position;
                    _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                    _touch.children["knob-needle"].segments[1].point = _touch.children["knob-touch"].position;
                  }
                  break;

                case "bottom-left":
                  this.segments[3].point.y = mouseEvent.point.y;
                  this.segments[0].point = mouseEvent.point;
                  this.segments[1].point.x = mouseEvent.point.x;
                  _knob_frame_whdth = this.bounds.right - mouseEvent.point.x;
                  this.segments[1].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.segments[2].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  _knob_group.data.from.x = mouseEvent.point.x;
                  _knob_group.data.from.y = mouseEvent.point.y - _knob_frame_whdth;
                  _knob_group.data.to.y = mouseEvent.point.y;

                  _knob_previous_radius = _knob_circle.radius;
                  _knob_group.radius = (_knob_group.data.to.x - _knob_group.data.from.x) / 2;
                  _knob_circle.radius = _knob_group.radius;
                  _knob_circle.position = new paper.Point(
                    _knob_group.data.to.x - _knob_group.radius,
                    _knob_group.data.from.y + _knob_group.radius
                  );
                  // "knob-offset"
                  _knob_group.center = _knob_circle.position;
                  _knob_offset_pos = pol_to_cart(_knob_group.radius, deg_to_rad(_knob_group.data.offset));
                  _knob_offset.position.x = _knob_group.center.x + _knob_offset_pos.x;
                  _knob_offset.position.y = _knob_group.center.y + _knob_offset_pos.y;
                  // "knob-touch" & "knob-needle"
                  for (const _touch of _touchs_group.children) {
                    _touch.radius = (_touch.radius * _knob_group.radius) / _knob_previous_radius;
                    _knob_touch_pos = pol_to_cart(_touch.radius, _touch.theta);
                    _touch.children["knob-touch"].position = new paper.Point(
                      _knob_group.center.x + _knob_touch_pos.x,
                      _knob_group.center.y + _knob_touch_pos.y
                    );
                    _touch.children["touch-txt"].position = _touch.children["knob-touch"].position;
                    _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                    _touch.children["knob-needle"].segments[1].point = _touch.children["knob-touch"].position;
                  }
                  break;
                default:
                  //console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
              update_item_main_params(_knob_group.parent);
            }
            break;
          case PLAY_MODE:
            //TODO
            break;
        }
      }
     
      _knob_group.addChild(_knob_frame);
      _knob_group.addChild(_knob_circle);
      _knob_group.addChild(_knob_offset);

      this.addChild(_knob_group);
      this.addChild(_touchs_group);
    }

  });
  return _knob;
};
