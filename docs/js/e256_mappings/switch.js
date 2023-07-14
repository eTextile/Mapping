/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SWITCH Factory
function switchFactory() {
  const DEFAULT_SWITCH_WIDTH = 45;
  const DEFAULT_SWITCH_HEIGHT = 45;
  const DEFAULT_SWITCH_MODE = KEY_TRIGGER;
  const DEFAULT_SWITCH_VELOCITY = "OFF";
  const DEFAULT_SWITCH_AFTERTOUCH = "OFF";
  const DEFAULT_button_switch_RADIUS = 30;

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;
  var previous_slider_val = null;
  let _button_center = null;
  let _button_radius = null;
  let current_part = null;
  let highlight_item = null;
  let state = false;

  var _switch = new paper.Group({
    "name": "SWITCH",
    "data": {
      "from": null,
      "to": null,
      "mode": null,
      "velocity": null,
      "aftertouch": null,
      "midiMsg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
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
      let _midiMsg = new Midi_key(
        DEFAULT_MIDI_CHANNEL,
        DEFAULT_MIDI_NOTE,
        DEFAULT_MIDI_VELOCITY
      );
      this.data.midiMsg = _midiMsg;
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from.x, params.from.y);
      this.data.to = new paper.Point(params.to.x, params.to.y);
      this.data.mode = params.mode;
      this.data.velocity = params.velo;
      this.data.aftertouch = params.after;
      this.data.midiMsg = params.midiMsg;
    },

    save_params: function () {
      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;
      this.data.mode = this.children["switch-group"].data.mode;
      this.data.velocity = this.children["switch-group"].data.velocity;
      this.data.aftertouch = this.children["switch-group"].data.aftertouch;

      this.data.midiMsg = this.children["button-group"].data.midiMsg;
    },

    create: function () {
      half_frame_width = (this.data.to.x - this.data.from.x) / 2;
      half_frame_height = (this.data.to.y - this.data.from.y) / 2;

      let _switch_group = new paper.Group({
        "name": "switch-group",
        "data": {
          "from": this.data.from,
          "to": this.data.to,
          "mode": this.data.mode,
          "velocity": this.data.velocity,
          "aftertouch": this.data.aftertouch,
          "form_style": {
            "from": "form-control",
            "to": "form-control",
            "mode": "form-select",
            "aftertouch": "form-toggle",
            "velocity": "form-toggle"
          }
        }
      });

      let _switch_frame = new paper.Path.Rectangle({
        "name": "switch-frame",
        "from": this.data.from,
        "to": this.data.to
      });
      _switch_frame.style = {
        "strokeColor": "chartreuse",
        "strokeWidth": 3,
        "fillColor": "skyblue"
      }
      _switch_group.addChild(_switch_frame);
      this.addChild(_switch_group);

      var _button_group = new paper.Group({
        "name": "button-group",
        "data": {
          "midiMsg": this.data.midiMsg,
          "form_style": {
            "chan": "form-select",
            "note": "form-select", // "form-control"
            "velo": "form-select" // "form-control"
          }
        }
      });

      let _button_switch = new paper.Shape.Ellipse({
        "name": "button-switch",
        "center": new paper.Point(this.data.from.x + half_frame_width, this.data.from.y + half_frame_height),
        "radius": new paper.Point(half_frame_width, half_frame_height)
      });
      _button_switch.style = {
        "fillColor": "black"
      }
      _button_group.addChild(_button_switch);
      this.addChild(_button_group);
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        "stroke": true,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }
      tmp_select = this.hitTest(mouseEvent.point, mouse_enter_options);
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (tmp_select) {
            if (tmp_select.item.name === "SWITCH") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "switch-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "switch-frame") {
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

      //this.bringToFront();

      var mouse_down_options = {
        "stroke": false,
        "bounds": true,
        "fill": true,
        "tolerance": 8
      }
      tmp_select = this.hitTest(mouseEvent.point, mouse_down_options);

      if (tmp_select) {
        //console.log("TMP: " + tmp_select.item.name);

        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "SWITCH") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "switch-group" || tmp_select.item.name === "button-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "switch-frame" ) {
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
            if (current_item.name === "button-switch") {
              console.log("MODE: " + this.data.mode);
              if (this.data.mode === KEY_TOGGLE) {
                state = !state;
                if (state) {
                  this.children["switch-group"].children["button-switch"].fillColor = "red";
                } else {
                  this.children["switch-group"].children["button-switch"].fillColor = "black";
                }
              }
              else if (this.data.mode === KEY_TRIGGER) {
                // TODO
              }

            }
            break;
        }
      }
    },

  /*
    activate: function () {
      if (selectedPart.name === "circle") {
        this.children["circle"].fillColor = "lawngreen";
        this.data.value = this.data.note;
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velo, this.data.chan);
        update_menu_params(this);
        setTimeout(this.triggerOff, 300, this);
      }
    },
    */

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            moveItem(this, mouseEvent);
          }
          else if (current_part.type === "bounds") {
            if (current_item.name === "switch-group") {
              switch (current_part.name) {
                case "top-left":
                  this.children["switch-group"].children["switch-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["switch-group"].children["switch-frame"].segments[1].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[2].point.y = mouseEvent.point.y;
                  this.children["switch-group"].data.from = mouseEvent.point;
                  half_frame_width = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  half_frame_height = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  this.children["button-group"].children["button-switch"].position = [
                    this.children["switch-group"].data.to.x - half_frame_width,
                    this.children["switch-group"].data.to.y - half_frame_height
                  ];
                  this.children["button-group"].children["button-switch"].radius = [half_frame_width, half_frame_height];
                  break;

                case "top-right":
                  this.children["switch-group"].children["switch-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[2].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[3].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to.x = mouseEvent.point.x;
                  half_frame_width = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  half_frame_height = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  this.children["button-group"].children["button-switch"].position = [
                    this.children["switch-group"].data.from.x + half_frame_width,
                    this.children["switch-group"].data.to.y - half_frame_height
                  ];
                  this.children["button-group"].children["button-switch"].radius = [half_frame_width, half_frame_height];
                  break;

                case "bottom-right":
                  this.children["switch-group"].children["switch-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["switch-group"].children["switch-frame"].segments[3].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[0].point.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to = mouseEvent.point;
                  half_frame_width = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  half_frame_height = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  this.children["button-group"].children["button-switch"].position = [
                    this.children["switch-group"].data.from.x + half_frame_width,
                    this.children["switch-group"].data.from.y + half_frame_height
                  ];
                  this.children["button-group"].children["button-switch"].radius = [half_frame_width, half_frame_height];
                  break;

                case "bottom-left":
                  this.children["switch-group"].children["switch-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[0].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[1].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.x = mouseEvent.point.x;
                  this.children["switch-group"].data.to.y = mouseEvent.point.y;
                  half_frame_width = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  half_frame_height = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  this.children["button-group"].children["button-switch"].position = [
                    this.children["switch-group"].data.to.x - half_frame_width,
                    this.children["switch-group"].data.from.y + half_frame_height
                  ];
                  this.children["button-group"].children["button-switch"].radius = [half_frame_width, half_frame_height];
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
  });
  return _switch;
};
