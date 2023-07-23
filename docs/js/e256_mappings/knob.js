/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// KNOB Factory
function knobFactory() {
  const DEFAULT_KNOB_SIZE = 500;
  const DEFAULT_KNOB_OFFSET = -45; // In deg
  const DEFAULT_KNOB_TOUCH = 2;
  const KNOB_MIN_SIZE = 30;

  let _knob_radius = null;
  let _knob_center = null;
  let highlight_item = null;
  let current_part = null;

  /*
  let knob_previous_offset = 0;
  let knob_previous_radius = 0;
  let knob_previous_theta = 0;
  */

  var _Knob = new paper.Group({
    "name": "knob",
    "data": {
      "from": null,
      "to": null,
      "touch": null,
      "offset": null,
      "midiMsg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_KNOB_SIZE / 2),
        mouseEvent.point.y - (DEFAULT_KNOB_SIZE / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_KNOB_SIZE / 2),
        mouseEvent.point.y + (DEFAULT_KNOB_SIZE / 2)
      );
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
    },

    save_params: function () {
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
      let _knob_target_theta = pol_to_cart(get_random_int(10, _knob_radius), deg_to_rad(get_random_int(0, 360)));
      let _touch_group = new paper.Group({
        "name": "touch-group",
        "index": _touch_index,
        "target": new paper.Point(
          _knob_center.x + _knob_target_theta.x,
          _knob_center.y + _knob_target_theta.y
        ),
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

      let _knob_needle = new paper.Path.Line({
        "name": "knob-needle",
        "from": _knob_center,
        "to": _touch_group.target,
        "locked": true
      });
      _knob_needle.style = {
        "strokeCap": "round",
        "strokeColor": "black",
        "strokeWidth": 5
      }
      _touch_group.addChild(_knob_needle);

      let _knob_target = new paper.Shape.Circle({
        "name": "knob-target",
        "center": _touch_group.target,
        "radius": 20
      });
      _knob_target.style = {
        "fillColor": "black",
        "strokeWidth": 1
      }
      _touch_group.addChild(_knob_target);

      return _touch_group;
    },

    create: function () {
      _knob_radius = (this.data.to.x - this.data.from.x) / 2;
      _knob_center = new paper.Point(
        this.data.from.x + _knob_radius,
        this.data.from.y + _knob_radius
      );

      let _knob_group = new paper.Group({
        "name": "knob-group",
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
        "from": this.data.from,
        "to": this.data.to
      });
      _knob_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": "white"
      }
      _knob_group.addChild(_knob_frame);

      let _knob_circle = new paper.Shape.Circle({
        "name": "knob-circle",
        "center": _knob_center,
        "radius": _knob_radius
      });
      _knob_circle.style = {
        "fillColor": "Purple"
      }
      _knob_group.addChild(_knob_circle);

      let _knob_offset_theta = pol_to_cart(_knob_radius, deg_to_rad(_knob_group.data.offset));

      let _knob_offset = new paper.Shape.Circle({
        "name": "knob-offset",
        "center": new paper.Point(
          _knob_center.x + _knob_offset_theta.x,
          _knob_center.y + _knob_offset_theta.y
        ),
        "radius": 20
      });
      _knob_offset.style = {
        "fillColor": "red"
      }
      _knob_group.addChild(_knob_offset);

      this.addChild(_knob_group);

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < this.data.touch; _touch++) {
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
            else if (tmp_select.item.name === "knob-group" || tmp_select.item.name === "knob-touch-group") {
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
      this.bringToFront();

      let mouse_down_options = {
        "stroke": false,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }
      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      if (tmp_select) {

        //console.log("TMP: " + tmp_select.item.name); // PROB!

        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "knob") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "knob-group" || tmp_select.item.name === "knob-touch-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "knob-frame" || tmp_select.item.name === "knob-circle" || tmp_select.item.name === "knob-offset") {
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
            let x = mouseEvent.point.x - _knob_center.x; // Place the x origin to the circle center
            let y = mouseEvent.point.y - _knob_center.y; // Place the y origin to the circle center
            let polar = cart_to_pol(x, y);
            _knob_target_pos = pol_to_cart(polar.radius, polar.theta);
            _knob_target_pos = pol_to_cart(polar.radius, polar.theta);
            this.children["knob-target"].position = new paper.Point(_knob_center.x + _knob_target_pos.x, _knob_center.y + _knob_target_pos.y);
            this.children["knob-needle"].segments[1].point = new paper.Point(_knob_center.x + _knob_target_pos.x, _knob_center.y + _knob_target_pos.y);
            _knob_radius = Math.round(mapp(polar.radius, 0, _knob_radius, this.data.r_min, this.data.r_max));
            if (MIDI_device_connected && _knob_radius != previous_knob_radius) {
              sendControlChange(this.data.r_cc, _knob_radius, this.data.r_chan);
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
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            if (current_part.item.name === "knob-offset") {
              let x = mouseEvent.point.x - _knob_center.x; // Place the x origin to the circle center
              let y = mouseEvent.point.y - _knob_center.y; // Place the y origin to the circle center
              let _knob_offset_theta = cart_to_pol(x, y).theta;
              let new_offset_pos = pol_to_cart(_knob_radius, _knob_offset_theta);
              new_offset_pos.x += _knob_center.x;
              new_offset_pos.y += _knob_center.y;
              this.children["knob-group"].children["knob-offset"].position = new_offset_pos;
              this.children["knob-group"].data.offset = rad_to_deg(_knob_offset_theta);
            } else {
              move_item(this, mouseEvent);
              _knob_center = this.children["knob-group"].children["knob-circle"].position; //
              //console.log(JSON.stringify(_knob_center));
            }
          }
          else if (current_part.type === "bounds") {
            let _rect_whdth = null;

            if (current_item.name === "knob-group") {
              switch (current_part.name) {
                case "top-left":
                  this.children["knob-group"].children["knob-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[1].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y;

                  _rect_whdth = this.children["knob-group"].children["knob-frame"].bounds.right - mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y + _rect_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y + _rect_whdth;

                  this.children["knob-group"].data.from = mouseEvent.point;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y + _rect_whdth;

                  _knob_radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = _knob_radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.to.x - _knob_radius,
                    this.children["knob-group"].data.to.y - _knob_radius
                  );
  
                  break;

                case "top-right":
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["knob-group"].children["knob-frame"].segments[2].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.x = mouseEvent.point.x;

                  _rect_whdth = mouseEvent.point.x - this.children["knob-group"].children["knob-frame"].bounds.left;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y + _rect_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y + _rect_whdth;

                  this.children["knob-group"].data.from.y = mouseEvent.point.y;
                  this.children["knob-group"].data.to.x = mouseEvent.point.x;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y + _rect_whdth;

                  _knob_radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = _knob_radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.from.x + _knob_radius,
                    this.children["knob-group"].data.to.y - _knob_radius
                  );

                  break;

                case "bottom-right":
                  this.children["knob-group"].children["knob-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[3].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[0].point.y = mouseEvent.point.y;

                  _rect_whdth = mouseEvent.point.x - this.children["knob-group"].children["knob-frame"].bounds.left;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y - _rect_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y - _rect_whdth;

                  this.children["knob-group"].data.from.y = mouseEvent.point.y - _rect_whdth;
                  this.children["knob-group"].data.to = mouseEvent.point;

                  _knob_radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = _knob_radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.from.x + _knob_radius,
                    this.children["knob-group"].data.from.y + _knob_radius
                  );
                  break;

                case "bottom-left":

                  this.children["knob-group"].children["knob-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["knob-group"].children["knob-frame"].segments[0].point = mouseEvent.point;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.x = mouseEvent.point.x;

                  _rect_whdth = this.children["knob-group"].children["knob-frame"].bounds.right - mouseEvent.point.x;
                  this.children["knob-group"].children["knob-frame"].segments[1].point.y = mouseEvent.point.y - _rect_whdth;
                  this.children["knob-group"].children["knob-frame"].segments[2].point.y = mouseEvent.point.y - _rect_whdth;

                  this.children["knob-group"].data.from.x = mouseEvent.point.x;
                  this.children["knob-group"].data.from.y = mouseEvent.point.y - _rect_whdth;
                  this.children["knob-group"].data.to.y = mouseEvent.point.y;


                  _knob_radius = (this.children["knob-group"].data.to.x - this.children["knob-group"].data.from.x) / 2;
                  this.children["knob-group"].children["knob-circle"].radius = _knob_radius;
                  this.children["knob-group"].children["knob-circle"].position = new paper.Point(
                    this.children["knob-group"].data.to.x - _knob_radius,
                    this.children["knob-group"].data.from.y + _knob_radius
                  );
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
        if (polar.radius > _knob_radius) {
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          knob_theta = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          _knob_target_pos = pol_to_cart(_knob_radius, polar.theta);
        } else {
          previous_knob_radius = _knob_radius;
          _knob_radius_val = Math.round(mapp(polar.radius, 0, _knob_radius, this.data.rMin, this.data.rMax));
          let newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          previous_knob_theta = knob_theta;
          knob_theta = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          _knob_target_pos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["knob-target"].position = new paper.Point(this.data.center.x + _knob_target_pos.x, this.data.center.y + _knob_target_pos.y);
        this.children["knob-needle"].segments[1].point = new paper.Point(this.data.center.x + _knob_target_pos.x, this.data.center.y + _knob_target_pos.y);

        update_menu_params(this);

        // SEND MIDI CONTROL_CHANGE
        if (MIDI_device_connected && knob_theta != previous_knob_theta) {
          sendControlChange(this.data.tCc, knob_theta, this.data.tChan);
        }
        if (MIDI_device_connected && _knob_radius_val != previous_knob_radius) {
          sendControlChange(this.data.rCc, _knob_radius_val, this.data.rChan);
        }
      }
    },
    */

  });
  return _Knob;
};
