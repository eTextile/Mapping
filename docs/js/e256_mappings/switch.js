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
  const SWITCH_MIN_radius = 30;

  let _center = null;
  let _radius = null;
  let current_part = null;
  let highlight_item = null;
  let select = false;

  var _switch = new paper.Group({
    name: "SWITCH",
    data: {
      from: null,
      to: null,
      mode: null,
      velocity: null,
      aftertouch: null,
      chan: null,
      note: null,
      velo: null
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
      this.data.chan = DEFAULT_SWITCH_MODE;
      this.data.note = DEFAULT_SWITCH_MODE;
      this.data.velo = DEFAULT_SWITCH_MODE;
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from.x, params.from.y);
      this.data.to = new paper.Point(params.to.x, params.to.y);
      this.data.mode = params.mode;
      this.data.velocity = params.velo;
      this.data.aftertouch = params.after;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velo = params.velo;
    },

    create: function () {
      
      _radius = new paper.Point(
        (this.data.to.x - this.data.from.x) / 2,
        (this.data.to.y - this.data.from.y) / 2
      );

      _center = new paper.Point(
        this.data.from.x + _radius.x,
        this.data.from.y + _radius.y
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

      //let _switch_button = new paper.Path.Circle({
      let _switch_button = new paper.Path.Ellipse({
        name: "switch-button",
        center: _center,
        radius: _radius,
      });
      _switch_button.style = {
        fillColor: "black"
      }
      _switch_group.addChild(_switch_button);

      this.addChild(_switch_group);
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
              //console.log("A");
            }
            else if (tmp_select.item.name === "switch-group") {
              highlight_item = tmp_select.item.firstChild;
              //console.log("B");
            }
            else if (tmp_select.item.name === "switch-frame") {
              highlight_item = tmp_select.item;
              //console.log("C");
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
        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "SWITCH") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "switch-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "switch-frame") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select;
        }
        else {
          //console.log("NOT_USED : " + tmp_select.item.name);
        }
        //console.log("CTL_CUR: " + current_controleur.name);
        //onsole.log("CTL_PEV: " + previous_controleur.name);
        //console.log("ITEM_CUR: " + current_item.name);
        //console.log("ITEM_PEV: " + previous_item.name);
        //console.log("PART_CUR: " + current_part.name);
        //console.log("PART_PEV: " + previous_part.name);
        
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "switch-group") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.fillColor = "orange";
            }
            else {
              //console.log("NOT_USED - CUR: " + current_item.name + "- PREV - " + previous_item.name );
            }
            //update_menu_params(this);
            break;
          case PLAY_MODE:
            // TODO
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

                  _radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _center.x = this.children["switch-group"].data.from.x + _radius.x;
                  _radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _center.y = this.children["switch-group"].data.from.y + _radius.y;
                  
                  this.children["switch-group"].children["switch-button"].center = [_center.x, _center.y];
                  this.children["switch-group"].children["switch-button"].radius = [_radius.x, _radius.y];
                  break;

                case "top-right":
                  this.children["switch-group"].children["switch-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[2].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[3].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to.x = mouseEvent.point.x;
                  
                  _radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _center.x = this.children["switch-group"].data.from.x + _radius.x;
                  _radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _center.y = this.children["switch-group"].data.from.y + _radius.y;

                  this.children["switch-group"].children["switch-button"].center = _center;
                  this.children["switch-group"].children["switch-button"].radius = _radius;
                  break;

                case "bottom-right":
                  this.children["switch-group"].children["switch-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["switch-group"].children["switch-frame"].segments[3].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[0].point.y = mouseEvent.point.y;
                  this.children["switch-group"].data.to = mouseEvent.point;

                  _radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _center.x = this.children["switch-group"].data.from.x + _radius.x;
                  _radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _center.y = this.children["switch-group"].data.from.y + _radius.y;

                  this.children["switch-group"].children["switch-button"].center = _center;
                  this.children["switch-group"].children["switch-button"].radius = _radius;
                  break;

                case "bottom-left":
                  this.children["switch-group"].children["switch-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["switch-group"].children["switch-frame"].segments[0].point = mouseEvent.point;
                  this.children["switch-group"].children["switch-frame"].segments[1].point.x = mouseEvent.point.x;
                  this.children["switch-group"].data.from.x = mouseEvent.point.x;
                  this.children["switch-group"].data.to.y = mouseEvent.point.y;

                  _radius.x = (this.children["switch-group"].data.to.x - this.children["switch-group"].data.from.x) / 2;
                  _center.x = this.children["switch-group"].data.from.x + _radius.x;
                  _radius.y = (this.children["switch-group"].data.to.y - this.children["switch-group"].data.from.y) / 2;
                  _center.y = this.children["switch-group"].data.from.y + _radius.y;

                  this.children["switch-group"].children["switch-button"].center = _center;
                  this.children["switch-group"].children["switch-button"].radius = _radius;
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
