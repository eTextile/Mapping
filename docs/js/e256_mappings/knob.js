/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
function knobFactory() {
  const DEFAULT_KNOB_RADIUS = 250;
  const DEFAULT_KNOB_OFFSET = -45;
  const DEFAULT_KNOB_TOUCH = 2;
  const DEFAULT_KNOB_MIN_SIZE = 30;

  let highlight_item = null;
  let current_part = null;

  /*
  let knob_previous_offset = 0;
  let knob_previous_theta = 0;
  */

  var _Knob = new paper.Group({
    "name": "knob",
    "center": null,
    "radius": null,
    "theta": null,
    "data": {
      "from": null,
      "to": null,
      "touch": null,
      "offset": null,
      "midiMsg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.center = mouseEvent.point;
      this.radius = DEFAULT_KNOB_RADIUS;
      this.theta = deg_to_rad(DEFAULT_KNOB_OFFSET);
      this.data.from = new paper.Point(mouseEvent.point.x - this.radius, mouseEvent.point.y - this.radius);
      this.data.to = new paper.Point(mouseEvent.point.x + this.radius, mouseEvent.point.y + this.radius);
      this.data.touch = DEFAULT_KNOB_TOUCH;
      this.data.offset = DEFAULT_KNOB_OFFSET;
      this.data.midiMsg = [];
      for (let _touch = 0; _touch < DEFAULT_KNOB_TOUCH; _touch++) {
        let _midiMsg = new Midi_knob(
          DEFAULT_MIDI_CHANNEL,
          DEFAULT_MIDI_CC,
          DEFAULT_MIDI_MIN,
          DEFAULT_MIDI_MAX,
          DEFAULT_MIDI_CHANNEL,
          DEFAULT_MIDI_CC,
          DEFAULT_MIDI_MIN,
          DEFAULT_MIDI_MAX
        );
        this.data.midiMsg.push(_midiMsg);
      }
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.touch = params.touch;
      this.data.offset = params.offset;
      for (const _key in params.keys) {
        let _midiMsg = new Midi_knob(
          params.midiMsg.t_chan,
          params.midiMsg.t_cc,
          params.midiMsg.t_min,
          params.midiMsg.t_max,
          params.midiMsg.r_chan,
          params.midiMsg.r_cc,
          params.midiMsg.r_min,
          params.midiMsg.r_max,
        );
        this.data.midiMsg.push(_midiMsg);
      }
      this.radius = (this.data.to.x - this.data.from.x) / 2;
      this.center = new paper.Point(this.data.from.x + this.radius, this.data.from.y + this.radius);
      this.theta = deg_to_rad(this.data.offset);
    },

    save_params: function () {
      this.center = this.children["knob-group"].center;
      this.radius = this.children["knob-group"].radius;
      this.theta = this.children["knob-group"].theta;
      this.data.from = this.children["knob-group"].data.from;
      this.data.to = this.children["knob-group"].data.to;
      this.data.touch = this.children["knob-group"].data.touch;
      this.data.offset = this.children["knob-group"].data.offset;
      this.data.midiMsg = [];
      for (const _knob_touch of this.children["touchs-group"].children) {
        this.data.midiMsg.push(_knob_touch.data.midiMsg);
      }
    },

    new_touch: function (_touch_index) {
      let _touch_group = new paper.Group({
        "name": "touch-group",
        "index": _touch_index,
        "center": this.center,
        "radius": get_random_int(50, this.radius - 10),
        "theta": deg_to_rad(get_random_int(0, 360)),
        "data": {
          "midiMsg": this.data.midiMsg[_touch_index],
          "form_style": {
            "t_chan": "form-select",
            "t_cc": "form-select",
            "t_min": "form-select",
            "t_max": "form-select",
            "r_chan": "form-select",
            "r_cc": "form-select",
            "r_min": "form-select",
            "r_max": "form-select"
          }
        }
      });

      let _knob_touch_target = pol_to_cart(_touch_group.radius, _touch_group.theta);
      let _knob_target = new paper.Shape.Circle({
        "name": "knob-target",
        "center": new paper.Point(_touch_group.center.x + _knob_touch_target.x, _touch_group.center.y + _knob_touch_target.y),
        "radius": 18
      });
      _knob_target.style = {
        "fillColor": "black"
      }
      _touch_group.addChild(_knob_target);

      let _knob_needle = new paper.Path.Line({
        "name": "knob-needle",
        "from": _touch_group.center,
        "to": new paper.Point(_touch_group.center.x + _knob_touch_target.x, _touch_group.center.y + _knob_touch_target.y),
        "locked": true
      });
      _knob_needle.style = {
        "strokeCap": "round",
        "strokeColor": "black",
        "strokeWidth": 2
      }
      _touch_group.addChild(_knob_needle);

      return _touch_group;
    },

    create: function () {
      let _knob_group = new paper.Group({
        "name": "knob-group",
        "center": this.center,
        "radius": this.radius,
        "theta": this.theta,
        "data": {
          "from": this.data.from,
          "to": this.data.to,
          "touch": this.data.touch,
          "offset": this.data.offset,
          "form_style": {
            "from": "form-control",
            "to": "form-control",
            "touch": "form-select",
            "offset": "form-control"
          }
        }
      });

      let _knob_frame = new paper.Path.Rectangle({
        "name": "knob-frame",
        "from": _knob_group.data.from,
        "to": _knob_group.data.to
      });
      _knob_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": "white"
      }
      _knob_group.addChild(_knob_frame);

      let _knob_circle = new paper.Shape.Circle({
        "name": "knob-circle",
        "center": _knob_group.center,
        "radius": _knob_group.radius
      });
      _knob_circle.style = {
        "fillColor": "Purple"
      }
      _knob_group.addChild(_knob_circle);

      let _knob_offset_target_pos = pol_to_cart(_knob_group.radius, _knob_group.theta);
      let _knob_offset = new paper.Shape.Circle({
        "name": "knob-offset",
        "center": new paper.Point(_knob_group.center.x + _knob_offset_target_pos.x, _knob_group.center.y + _knob_offset_target_pos.y),
        "radius": 18
      });
      _knob_offset.style = {
        "fillColor": "red"
      }
      _knob_group.addChild(_knob_offset);

      this.addChild(_knob_group);

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _knob_group.data.touch; _touch++) {
        _touchs_group.addChild(this.new_touch(_touch));
      }
      this.addChild(_touchs_group);

    },

    onMouseEnter: function (mouseEvent) {
      let mouse_enter_options = {
        "stroke": true,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }
      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);

      switch (e256_current_mode) {
        case EDIT_MODE:
          if (tmp_select) {
            if (tmp_select.item.name === "knob") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "knob-group" || tmp_select.item.name === "touch-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "knob-frame" || "knob-circle") {
              highlight_item = tmp_select.item;
            }
            else {
              console.log("NOT_USED: " + tmp_select);
              return;
            }
            highlight_item.selected = true;
          }
          break;
        case PLAY_MODE:
          console.log("PLAY_MODE: NOT IMPLEMENTED!");
          break;
        default:
          break;
      }
    },

    onMouseLeave: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (highlight_item) highlight_item.selected = false;
          break;
        case PLAY_MODE:
          break;
        default:
          break;
      }
    },

    onMouseDown: function (mouseEvent) {
      let mouse_down_options = {
        "stroke": false,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }

      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      if (tmp_select) {
        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;
        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "knob") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "knob-group" || tmp_select.item.name === "touch-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "knob-frame" || tmp_select.item.name === "knob-circle" ||
        tmp_select.item.name === "knob-offset" || tmp_select.item.name === "knob-target") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select;
        }
        else {
          //console.log("NOT_USED : " + tmp_select.item.name);
        }

        //console.log("CTL_CUR: " + current_controleur.name);
        //console.log("CTL_PEV: " + previous_controleur.name);
        //console.log("ITEM_CUR: " + current_item.name);
        //console.log("ITEM_PEV: " + previous_item.name);
        //console.log("PART_CUR: " + current_part.name);
        //console.log("PART_PEV: " + previous_part.name);

        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "button-switch") {
              // TODO
            }
            else {
              // TODO
            }
            break;
          case PLAY_MODE:
            /*
            let x = mouseEvent.point.x - this.center.x; // Place the x origin to the circle center
            let y = mouseEvent.point.y - this.center.y; // Place the y origin to the circle center
            let polar = cart_to_pol(x, y);
            _knob_touch_target = pol_to_cart(polar.radius, polar.theta);
            _knob_touch_target = pol_to_cart(polar.radius, polar.theta);
            this.children["knob-target"].position = new paper.Point(this.center.x + _knob_touch_target.x, this.center.y + _knob_touch_target.y);
            this.children["knob-needle"].segments[1].point = new paper.Point(this.center.x + _knob_touch_target.x, this.center.y + _knob_touch_target.y);
            this.radius = Math.round(mapp(polar.radius, 0, this.radius, this.data.r_min, this.data.r_max));
            if (MIDI_device_connected && this.radius != previousthis.radius) {
              sendControlChange(this.data.r_cc, this.radius, this.data.r_chan);
            }
            previous_knob_theta = knob_theta;
            let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
            knob_theta = Math.round(mapp(newPolar, 0, 380, this.data.t_min, this.data.t_max));
            if (MIDI_device_connected && knob_theta != previous_knob_theta) {
              sendControlChange(this.data.t_cc, knob_theta, this.data.t_chan);
            }
            */
            break;
        }
      }
    },

    onMouseDrag: function (mouseEvent) {

      let _knob_frame_whdth = null;
      let _knob_offset_target = null;
      let _knob_touch_target = null;
      let _knob_previous_radius = null;

      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            if (current_part.item.name === "knob-offset") {
              this.children["knob-group"].theta = cart_to_pol(
                mouseEvent.point.x - this.children["knob-group"].center.x,
                mouseEvent.point.y - this.children["knob-group"].center.y
              ).theta;
              _knob_offset_target = pol_to_cart(this.children["knob-group"].radius, this.children["knob-group"].theta);
              this.children["knob-group"].children["knob-offset"].position = new paper.Point(
                this.children["knob-group"].center.x + _knob_offset_target.x,
                this.children["knob-group"].center.y + _knob_offset_target.y
              );
              this.children["knob-group"].data.offset = rad_to_deg(this.children["knob-group"].theta);
            } else {
              move_item(this, mouseEvent);
              this.children["knob-group"].center = this.children["knob-group"].children["knob-circle"].position;
            }
          }
          else if (current_part.type === "bounds") {
            if (current_item.name === "knob-group") {
              switch (current_part.name) {
                case "top-left":
                  this.children["knob-group"].children["knob-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[1].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y;
                  _knob_frame_whdth = this.children["knob-group"].children["knob-frame"].bounds.right - mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.children["knob-group"].data.from = mouseEvent.point;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y + _knob_frame_whdth;
                  _knob_previous_radius = this.children["knob-group"].children["knob-circle"].radius;
                  this.children["knob-group"].radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = this.children["knob-group"].radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.to.x - this.children["knob-group"].radius,
                    this.children["knob-group"].data.to.y - this.children["knob-group"].radius
                  );
                  // "knob-offset"
                  this.children["knob-group"].center = this.children["knob-group"].children["knob-circle"].position;
                  _knob_offset_target = pol_to_cart(this.children["knob-group"].radius, deg_to_rad(this.children["knob-group"].data.offset));
                  this.children["knob-group"].children["knob-offset"].position.x = this.children["knob-group"].center.x + _knob_offset_target.x;
                  this.children["knob-group"].children["knob-offset"].position.y = this.children["knob-group"].center.y + _knob_offset_target.y;
                  // "knob-needle" & "knob-target"
                  for (const touch of this.children["touchs-group"].children) {
                    touch.radius = (touch.radius * this.children["knob-group"].radius) / _knob_previous_radius;
                    _knob_touch_target = pol_to_cart(touch.radius, touch.theta);
                    touch.children["knob-target"].position = new paper.Point(
                      this.children["knob-group"].center.x + _knob_touch_target.x,
                      this.children["knob-group"].center.y + _knob_touch_target.y
                    );
                    touch.children["knob-needle"].segments[0].point = this.children["knob-group"].center;
                    touch.children["knob-needle"].segments[1].point = touch.children["knob-target"].position;
                  }
                  break;

                case "top-right":
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["knob-group"].children["knob-frame"].segments[2].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.x = mouseEvent.point.x;
                  _knob_frame_whdth = mouseEvent.point.x - this.children["knob-group"].children["knob-frame"].bounds.left;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y + _knob_frame_whdth;
                  this.children["knob-group"].data.from.y = mouseEvent.point.y;
                  this.children["knob-group"].data.to.x = mouseEvent.point.x;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y + _knob_frame_whdth;
                  _knob_previous_radius = this.children["knob-group"].children["knob-circle"].radius;
                  this.children["knob-group"].radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = this.children["knob-group"].radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.from.x + this.children["knob-group"].radius,
                    this.children["knob-group"].data.to.y - this.children["knob-group"].radius
                  );
                  // "knob-offset"
                  this.children["knob-group"].center = this.children["knob-group"].children["knob-circle"].position;
                  _knob_offset_target = pol_to_cart(this.children["knob-group"].radius, deg_to_rad(this.children["knob-group"].data.offset));
                  this.children["knob-group"].children["knob-offset"].position.x = this.children["knob-group"].center.x + _knob_offset_target.x;
                  this.children["knob-group"].children["knob-offset"].position.y = this.children["knob-group"].center.y + _knob_offset_target.y;
                  // "knob-needle" & "knob-target"
                  for (const touch of this.children["touchs-group"].children) {
                    touch.radius = (touch.radius * this.children["knob-group"].radius) / _knob_previous_radius;
                    _knob_touch_target = pol_to_cart(touch.radius, touch.theta);
                    touch.children["knob-target"].position = new paper.Point(
                      this.children["knob-group"].center.x + _knob_touch_target.x,
                      this.children["knob-group"].center.y + _knob_touch_target.y
                    );
                    touch.children["knob-needle"].segments[0].point = this.children["knob-group"].center;
                    touch.children["knob-needle"].segments[1].point = touch.children["knob-target"].position;
                  }
                  break;

                case "bottom-right":
                  this.children["knob-group"].children["knob-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[3].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y;
                  _knob_frame_whdth = mouseEvent.point.x - this.children["knob-group"].children["knob-frame"].bounds.left;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].data.from.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].data.to = mouseEvent.point;

                  _knob_previous_radius = this.children["knob-group"].children["knob-circle"].radius;
                  this.children["knob-group"].radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = this.children["knob-group"].radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.from.x + this.children["knob-group"].radius,
                    this.children["knob-group"].data.from.y + this.children["knob-group"].radius
                  );
                  // "knob-offset"
                  this.children["knob-group"].center = this.children["knob-group"].children["knob-circle"].position;
                  _knob_offset_target = pol_to_cart(this.children["knob-group"].radius, deg_to_rad(this.children["knob-group"].data.offset));
                  this.children["knob-group"].children["knob-offset"].position.x = this.children["knob-group"].center.x + _knob_offset_target.x;
                  this.children["knob-group"].children["knob-offset"].position.y = this.children["knob-group"].center.y + _knob_offset_target.y;
                  // "knob-needle" & "knob-target"
                  for (const touch of this.children["touchs-group"].children) {
                    touch.radius = (touch.radius * this.children["knob-group"].radius) / _knob_previous_radius;
                    _knob_touch_target = pol_to_cart(touch.radius, touch.theta);
                    touch.children["knob-target"].position = new paper.Point(
                      this.children["knob-group"].center.x + _knob_touch_target.x,
                      this.children["knob-group"].center.y + _knob_touch_target.y
                    );
                    touch.children["knob-needle"].segments[0].point = this.children["knob-group"].center;
                    touch.children["knob-needle"].segments[1].point = touch.children["knob-target"].position;
                  }
                  break;

                case "bottom-left":

                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["knob-group"].children["knob-frame"].segments[0].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.x = mouseEvent.point.x;
                  _knob_frame_whdth = this.children["knob-group"].children["knob-frame"].bounds.right - mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].data.from.x = mouseEvent.point.x;
                  this.children["knob-group"].data.from.y = mouseEvent.point.y - _knob_frame_whdth;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y;

                  _knob_previous_radius = this.children["knob-group"].children["knob-circle"].radius;
                  this.children["knob-group"].radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = this.children["knob-group"].radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.to.x - this.children["knob-group"].radius,
                    this.children["knob-group"].data.from.y + this.children["knob-group"].radius
                  );
                  // "knob-offset"
                  this.children["knob-group"].center = this.children["knob-group"].children["knob-circle"].position;
                  _knob_offset_target = pol_to_cart(this.children["knob-group"].radius, deg_to_rad(this.children["knob-group"].data.offset));
                  this.children["knob-group"].children["knob-offset"].position.x = this.children["knob-group"].center.x + _knob_offset_target.x;
                  this.children["knob-group"].children["knob-offset"].position.y = this.children["knob-group"].center.y + _knob_offset_target.y;
                  // "knob-needle" & "knob-target"
                  for (const touch of this.children["touchs-group"].children) {
                    touch.radius = (touch.radius * this.children["knob-group"].radius) / _knob_previous_radius;
                    _knob_touch_target = pol_to_cart(touch.radius, touch.theta);
                    touch.children["knob-target"].position = new paper.Point(
                      this.children["knob-group"].center.x + _knob_touch_target.x,
                      this.children["knob-group"].center.y + _knob_touch_target.y
                    );
                    touch.children["knob-needle"].segments[0].point = this.children["knob-group"].center;
                    touch.children["knob-needle"].segments[1].point = touch.children["knob-target"].position;
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
          }
          update_menu_params(this);
          break;
        case PLAY_MODE:
          //TODO
          break;
      }
    }

    /*

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            
       if (e256_current_mode === PLAY_MODE) {
        let x = mouseEvent.point.x - this.data.center.x; // Place the x origin to the circle center
        let y = mouseEvent.point.y - this.data.center.y; // Place the y origin to the circle center
        let polar = cart_to_pol(x, y);
        if (polar.radius > this.radius) {
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          knob_theta = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          _knob_touch_target = pol_to_cart(this.radius, polar.theta);
        } else {
          previousthis.radius = this.radius;
          this.radius_val = Math.round(mapp(polar.radius, 0, this.radius, this.data.rMin, this.data.rMax));
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          previous_knob_theta = knob_theta;
          knob_theta = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          _knob_touch_target = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["knob-target"].position = new paper.Point(this.data.center.x + _knob_touch_target.x, this.data.center.y + _knob_touch_target.y);
        this.children["knob-needle"].segments[1].point = new paper.Point(this.data.center.x + _knob_touch_target.x, this.data.center.y + _knob_touch_target.y);

        update_menu_params(this);

        // SEND MIDI CONTROL_CHANGE
        if (MIDI_device_connected && knob_theta != previous_knob_theta) {
          sendControlChange(this.data.tCc, knob_theta, this.data.tChan);
        }
        if (MIDI_device_connected && this.radius_val != previousthis.radius) {
          sendControlChange(this.data.rCc, this.radius_val, this.data.rChan);
        }
      }
    },
    */

  });
  return _Knob;
};
