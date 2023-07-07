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
  const DEFAULT_SWITCH_AFTERTOUCH = "ON";
  const DEFAULT_SWITCH_BUTTON_RADIUS = 30;
  const DEFAULT_MIDI_SWITCH = {
    "chan": 1,
    "note": 64,
    "velo": 127
  };

  let _button_center = null;
  let _button_radius = null;
  let current_part = null;
  let highlight_item = null;
  let state = false;

  var _switch = new paper.Group({
    name: "SWITCH",
    data: {
      from: null,
      to: null,
      mode: null,
      velocity: null,
      aftertouch: null,
      midi: null
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
      this.data.midi = [DEFAULT_MIDI_SWITCH];
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from.x, params.from.y);
      this.data.to = new paper.Point(params.to.x, params.to.y);
      this.data.mode = params.mode;
      this.data.velocity = params.velo;
      this.data.aftertouch = params.after;
      this.data.midi = params.midi; // {"chan": x, "note": x, "velo": x}
    },

    save_params: function () {
      this.data.from = this.children["switch-group"].data.from;
      this.data.to = this.children["switch-group"].data.to;
      this.data.mode = this.children["switch-group"].data.mode;
      this.data.velocity = this.children["switch-group"].data.velocity;
      this.data.aftertouch = this.children["switch-group"].data.aftertouch;

      this.data.midi = this.children["button-group"].data.midi;
    },

    create: function () {
      _button_radius = new paper.Point(
        (this.data.to.x - this.data.from.x) / 2,
        (this.data.to.y - this.data.from.y) / 2
      );
      _button_center = new paper.Point(
        this.data.from.x + _button_radius.x,
        this.data.from.y + _button_radius.y
      );

      let _switch_group = new paper.Group({
        name: "switch-group",
        data: {
          from: this.data.from,
          to: this.data.to,
          mode: this.data.mode,
          velocity: this.data.velocity,
          aftertouch: this.data.aftertouch,
          form_style: {
            from: "form-control",
            to: "form-control",
            mode: "form-select",
            aftertouch: "form-toggle",
            velocity: "form-toggle"
          },
          form_select_params: {
            mode: KEY_MODES,
          }
        }
      });

      let _switch_frame = new paper.Path.Rectangle({
        name: "switch-frame",
        from: this.data.from,
        to: this.data.to
      });
      _switch_frame.style = {
        strokeColor: "chartreuse",
        strokeWidth: 3,
        fillColor: "skyblue"
      }
      _switch_group.addChild(_switch_frame);
      this.addChild(_switch_group);

      var _button_group = new paper.Group({
        name: "button-group",
        data: {
          midi: this.data.midi,
          form_style: {
            chan: "form-select",
            note: "form-select", // "form-control"
            velo: "form-select" // "form-control"
          },
          form_select_params: {
            chan: MIDI_CHANNELS,
            note: MIDI_NOTES,
            velo: MIDI_VELOCITYS
          }
        }
      });

      let _switch_button = new paper.Shape.Ellipse({
        name: "switch-button",
        center: _button_center,
        radius: _button_radius,
      });
      _switch_button.style = {
        fillColor: "black"
      }
      _button_group.addChild(_switch_button);
      this.addChild(_button_group);
    },

    onMouseEnter: function (mouseEvent) {
      var mouse_enter_options = {
        stroke: true,
        bounds: true,
        fill: true,
        tolerance: 8
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
        stroke: false,
        bounds: true,
        fill: true,
        tolerance: 8
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
            if (current_item.name === "switch-button") {
              // TODO
            }
            else {
              // TODO
            }
            break;
          case PLAY_MODE:
            if (current_item.name === "switch-button") {
              console.log("MODE: " + this.data.mode);
              if (this.data.mode === KEY_TOGGLE) {
                state = !state;
                if (state) {
                  this.children["switch-group"].children["switch-button"].fillColor = "red";
                } else {
                  this.children["switch-group"].children["switch-button"].fillColor = "black";
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

                  _button_radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _button_center.x = this.children["switch-group"].data.from.x + _button_radius.x;
                  _button_radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _button_center.y = this.children["switch-group"].data.from.y + _button_radius.y;
                  
                  this.children["button-group"].children["switch-button"].position = [_button_center.x, _button_center.y];
                  this.children["button-group"].children["switch-button"].radius = [_button_radius.x, _button_radius.y];
                  break;

                case "top-right":
                  this.children["switch-group"].children["switch-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[2].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[3].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to.x = mouseEvent.point.x;
                  
                  _button_radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _button_center.x = this.children["switch-group"].data.from.x + _button_radius.x;
                  _button_radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _button_center.y = this.children["switch-group"].data.from.y + _button_radius.y;

                  this.children["button-group"].children["switch-button"].position = _button_center;
                  this.children["button-group"].children["switch-button"].radius = _button_radius;
                  break;

                case "bottom-right":
                  this.children["switch-group"].children["switch-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["switch-group"].children["switch-frame"].segments[3].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[0].point.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to = mouseEvent.point;

                  _button_radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _button_center.x = this.children["switch-group"].data.from.x + _button_radius.x;
                  _button_radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _button_center.y = this.children["switch-group"].data.from.y + _button_radius.y;

                  this.children["button-group"].children["switch-button"].position = _button_center;
                  this.children["button-group"].children["switch-button"].radius = _button_radius;
                  break;

                case "bottom-left":
                  this.children["switch-group"].children["switch-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[0].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[1].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.x = mouseEvent.point.x;
                  this.children["switch-group"].data.to.y = mouseEvent.point.y;

                  _button_radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _button_center.x = this.children["switch-group"].data.from.x + _button_radius.x;
                  _button_radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _button_center.y = this.children["switch-group"].data.from.y + _button_radius.y;

                  this.children["button-group"].children["switch-button"].position = _button_center;
                  this.children["button-group"].children["switch-button"].radius = _button_radius;
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
