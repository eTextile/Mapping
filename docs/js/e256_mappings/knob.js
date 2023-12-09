/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
function knobFactory() {
  const DEFAULT_KNOB_TOUCH = 1;
  const DEFAULT_KNOB_RADIUS = 250;
  const DEFAULT_KNOB_TOUCH_RADIUS = 20;
  const DEFAULT_KNOB_OFFSET = -45;
  const DEFAULT_KNOB_MIN_SIZE = 30;

  let _knob_frame_whdth = null;
  let _knob_offset = null;

  var _Knob = new paper.Group({
    "name": "knob",
    "center": null,
    "radius": null,
    "theta": null,
    "data": {
      "touch": null,
      "from": null,
      "to": null,
      "offset": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touch = DEFAULT_KNOB_TOUCH;
      this.center = mouseEvent.point;
      this.radius = DEFAULT_KNOB_RADIUS;
      this.theta = deg_to_rad(DEFAULT_KNOB_OFFSET);
      this.data.from = new paper.Point(mouseEvent.point.x - this.radius, mouseEvent.point.y - this.radius);
      this.data.to = new paper.Point(mouseEvent.point.x + this.radius, mouseEvent.point.y + this.radius);
      this.data.offset = DEFAULT_KNOB_OFFSET;
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_KNOB_TOUCH; _touch++) {
        this.data.msg.push(new midi_touch_circular_msg(_touch));
      }
    },

    setup_from_config: function (params) {
      this.data.touch = params._touch.length;
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.radius = (this.data.to.x - this.data.from.x) / 2;
      this.center = new paper.Point(this.data.from.x + this.radius, this.data.from.y + this.radius);
      this.theta = deg_to_rad(this.data.offset);
      this.data.offset = params.offset;
      this.data.msg = params.msg;
    },

    save_params: function () {
      let last_touch_count = this.data.touch;
      this.center = this.children["knob-group"].center;
      this.radius = this.children["knob-group"].radius;
      this.theta = this.children["knob-group"].theta;

      this.data.touch = this.children["knob-group"].data.touch;
      this.data.from = this.children["knob-group"].data.from;
      this.data.to = this.children["knob-group"].data.to;
      this.data.offset = this.children["knob-group"].data.offset;
      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touch; _touch++) {
        if (_touch < last_touch_count) {
          this.data.msg.push(this.children["touchs-group"].children[_touch].data);
        }
        else {
          this.data.msg.push(new midi_touch_circular_msg(_touch));
        }
      }
    },

    new_touch: function (_touch_uid, _knob) {
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_uid,
        "center": this.center,
        "radius": get_random_int(50, this.radius - 10),
        "theta": deg_to_rad(get_random_int(0, 360)),
        "prev_radius": null,
        "prev_theta": null,
        "prev_pressure": null,
        "data": this.data.msg[_touch_uid]
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
        "radius": DEFAULT_KNOB_TOUCH_RADIUS
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
        previous_touch = current_touch;
        current_touch = _touch_group;
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
            if (polar.radius > _knob.radius) {
              let new_polar = rotatePolar(rad_to_deg(polar.theta), _knob.data.offset);
              _touch_group.data.midi.theta.val = Math.round(mapp(new_polar, 0, 380, _touch_group.data.midi.theta.min, _touch_group.data.midi.theta.max));
              _knob_touch_pos = pol_to_cart(_knob.radius, polar.theta);
            } else {
              _touch_group.data.midi.radius.val = Math.round(mapp(polar.radius, 0, _knob.radius, _touch_group.data.midi.radius.min, _touch_group.data.midi.radius.max));
              let new_polar = rotatePolar(rad_to_deg(polar.theta), _knob.data.offset);
              _touch_group.data.midi.theta.val = Math.round(mapp(new_polar, 0, 380, _touch_group.data.midi.theta.min, _touch_group.data.midi.theta.max));
              _knob_touch_pos = pol_to_cart(polar.radius, polar.theta);
            }
            _knob_touch.position = new paper.Point(_knob.center.x + _knob_touch_pos.x, _knob.center.y + _knob_touch_pos.y);
            _knob_needle.segments[1].point = new paper.Point(_knob.center.x + _knob_touch_pos.x, _knob.center.y + _knob_touch_pos.y);

            if (midi_device_connected) {
              if (_touch_group.data.midi.theta.val != _touch_group.prev_theta) {
                _touch_group.prev_theta = _touch_group.data.midi.theta.val;
                //console.log("THETA: " + _touch_group.data.midi.theta.val); // PROB!
                sendControlChange(_touch_group.data.midi.theta);
              }
              if (_touch_group.data.midi.radius.val != _touch_group.prev_radius) {
                _touch_group.prev_radius = _touch_group.data.midi.radius.val;
                //console.log("RADIUS: " + _touch_group.data.midi.radius.val); // PROB!
                sendControlChange(_touch_group.data.midi.radius);
              }
            }
            update_touch_menu_params(_touch_group);
            break;
        }
      }

      _touch_group.addChild(_knob_needle);
      _touch_group.addChild(_knob_touch);

      return _touch_group;
    },

    create: function () {

      let _knob_group = new paper.Group({
        "name": "knob-group",
        "center": this.center,
        "radius": this.radius,
        "theta": this.theta,
        "data": {
          "touch": this.data.touch,
          "from": this.data.from,
          "to": this.data.to,
          "offset": this.data.offset
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _knob_group.data.touch; _touch++) {
        _touchs_group.addChild(this.new_touch(_touch, _knob_group));
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

      _knob_circle.onMouseDown = function () {
      }

      _knob_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "fill") {
              move_item(_knob_group.parent, mouseEvent);
              _knob_group.center = this.position;
              update_item_menu_params(_knob_group.parent); // FIXME!?
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
        "radius": DEFAULT_KNOB_TOUCH_RADIUS
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
            update_item_menu_params(_knob_group.parent);
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      let _knob_frame = new paper.Path.Rectangle({
        //"name": "knob-frame",
        "from": _knob_group.data.from,
        "to": _knob_group.data.to
      });

      _knob_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black"
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

      _knob_frame.onMouseDown = function () {
      }

      _knob_frame.onMouseDrag = function (mouseEvent) {
        let _knob_previous_radius = null;

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
                    _touch.children["knob-needle"].segments[0].point = _knob_group.center;
                    _touch.children["knob-needle"].segments[1].point = _touch.children["knob-touch"].position;
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }

            }
            update_item_menu_params(_knob_group.parent);
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
    },

  });
  return _Knob;
};
