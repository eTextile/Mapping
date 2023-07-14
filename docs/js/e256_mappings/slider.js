/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SLIDER Factory
function sliderFactory() {
  const DEFAULT_SLIDER_WIDTH = 50;
  const DEFAULT_SLIDER_HEIGHT = 450;
  const SLIDER_MIN_WIDTH = 20;
  const SLIDER_MIN_HEIGHT = 100;
  const DEFAULT_SLIDER_MIN = 0;
  const DEFAULT_SLIDER_MAX = 127;

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;
  let highlight_item = null;
  let current_part = null;
  var previous_slider_val = null;
  var slider_dir = null;

  var _slider = new paper.Group({
    "name": "SLIDER",
    "value": null,
    "data": {
      "from": null,
      "to": null,
      "min": null,
      "max": null,
      "midiMsg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        Math.round(mouseEvent.point.x - (DEFAULT_SLIDER_WIDTH / 2)),
        Math.round(mouseEvent.point.y - (DEFAULT_SLIDER_HEIGHT / 2))
      );
      this.data.to = new paper.Point(
        Math.round(mouseEvent.point.x + (DEFAULT_SLIDER_WIDTH / 2)),
        Math.round(mouseEvent.point.y + (DEFAULT_SLIDER_HEIGHT / 2))
      );
      this.data.min = DEFAULT_SLIDER_MIN;
      this.data.max = DEFAULT_SLIDER_MAX;
      let _midiMsg = new Midi_slider(
        DEFAULT_MIDI_CHANNEL,
        DEFAULT_MIDI_CC,
        DEFAULT_SLIDER_MIN,
        DEFAULT_SLIDER_MAX
      );
      this.data.midiMsg = _midiMsg;
    },

    setup_from_config: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.min = params.min;
      this.data.max = params.max;
      this.data.midiMsg = params.midiMsg;
    },

    save_params: function () {
      this.data.from = this.children["slider-group"].data.from;
      this.data.to = this.children["slider-group"].data.to;
      this.data.min = this.children["slider-group"].data.min;
      this.data.max = this.children["slider-group"].data.max;
      this.data.midiMsg = this.children["handle-group"].data.midiMsg;
    },

    create: function () {
      slider_dir = V_SLIDER;
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;

      var _slider_group = new paper.Group({
        "name": "slider-group",
        "data": {
          "from": this.data.from,
          "to": this.data.to,
          "form_style": {
            "from": "form-control",
            "to": "form-control"
          }
        }
      });
      var _rect = new paper.Path.Rectangle({
        "name": "slider-frame",
        "from": this.data.from,
        "to": this.data.to
      });
      _rect.style = {
        "strokeWidth": 5,
        "dashArray": [10, 5],
        "strokeColor": "chartreuse",
        "fillColor": "azure"
      };
      _slider_group.addChild(_rect);
      this.addChild(_slider_group);

      var _handle_group = new paper.Group({
        "name": "handle-group",
        "data": {
          "min": this.data.min,
          "max": this.data.max,
          "midiMsg": this.data.midiMsg,
          "form_style": {
            "chan": "form-select",
            "cc": "form-select",
            "min": "form-select",
            "max": "form-select",
          }
        }
      });
      var _handle = new paper.Path.Line({
        "name": "slider-handle",
        "from": new paper.Point(this.data.from.x, this.data.from.y + (DEFAULT_SLIDER_HEIGHT / 2)),
        "to": new paper.Point(this.data.to.x, this.data.from.y + (DEFAULT_SLIDER_HEIGHT / 2)),
        //"locked": true
      });
      _handle.style = {
        "strokeWidth": 30,
        "strokeCap": "round",
        "strokeColor": "lightslategray"
      };
      _handle_group.addChild(_handle);
      this.addChild(_handle_group);
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
            if (tmp_select.item.name === "SLIDER") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "slider-group" || tmp_select.item.name === "handle-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "slider-frame" || tmp_select.item.name === "slider-handle") {
              highlight_item = tmp_select.item;
            }
            else {
              console.log("NOT_USED: " + tmp_select.item.name);
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
          highlight_item.selected = false;
          break;
        case PLAY_MODE:
          break;
        default:
          break;
      }
    },

    onMouseDown: function (mouseEvent) {
      this.bringToFront();
      var mouse_down_options = {
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

        if (tmp_select.item.name === "SLIDER") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "slider-group" || tmp_select.item.name === "handle-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "slider-frame" || tmp_select.item.name === "slider-handle") {
          current_item = tmp_select.item.parent;
          current_part = tmp_select;
        }
        else {
          //console.log("NOT_USED : " + tmp_select.item.name);
        }

        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "slider-handle" && previous_item.name === "slider-handle") {
              previous_item.firstChild.style.strokeColor = "lightslategray";
              current_item.firstChild.style.strokeColor = "orange";
            }
            else if (current_item.name === "slider-frame" && previous_item.name === "slider-handle") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.strokeColor = "orange";
            }
            else if (previous_item.name === "slider-frame" && current_item.name === "slider-handle") {
              //previous_item.firstChild.style.strokeColor = "lightGreen";
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

    onMouseDrag: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          if (current_part.type === "fill") {
            moveItem(this, mouseEvent);
          }
          else if (current_part.type === "bounds") {
            let newSize = new paper.Point();
            let newPos = new paper.Point();
            if (current_item.name === "slider-group") {
              switch (current_part.name) {

                case "top-left":
                  this.children["slider-group"].children["slider-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["slider-group"].children["slider-frame"].segments[1].point = mouseEvent.point;
                  this.children["slider-group"].children["slider-frame"].segments[2].point.y = mouseEvent.point.y;
                  this.children["handle-group"].children["slider-handle"].segments[0].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(SLIDER_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(SLIDER_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  //newSize.x = ((this.bounds.right - this.children["handle-group"].children["slider-handle"].position.x) * frame_width) / previous_frame_width;
                  newSize.y = ((this.bounds.bottom - this.children["handle-group"].children["slider-handle"].position.y) * frame_height) / previous_frame_height;
                  //newPos.x = this.bounds.right - newSize.x;
                  newPos.y = this.bounds.bottom - newSize.y;
                  this.children["handle-group"].children["slider-handle"].position.y = newPos.y;
                  this.children["slider-group"].data.from = new paper.Point(mouseEvent.point.x, mouseEvent.point.y);
                  break;

                case "top-right":
                  this.children["slider-group"].children["slider-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["slider-group"].children["slider-frame"].segments[2].point = mouseEvent.point;
                  this.children["slider-group"].children["slider-frame"].segments[3].point.x = mouseEvent.point.x;
                  this.children["handle-group"].children["slider-handle"].segments[1].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(SLIDER_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(SLIDER_MIN_HEIGHT, this.bounds.bottom - mouseEvent.point.y);
                  //newSize.x = ((this.children["handle-group"].children["slider-handle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                  newSize.y = ((this.bounds.bottom - this.children["handle-group"].children["slider-handle"].position.y) * frame_height) / previous_frame_height;
                  //newPos.x = this.bounds.left + newSize.x;
                  newPos.y = this.bounds.bottom - newSize.y;
                  this.children["handle-group"].children["slider-handle"].position.y = newPos.y;
                  this.children["slider-group"].data.from.y = mouseEvent.point.y;
                  this.children["slider-group"].data.to.x = mouseEvent.point.x;
                  break;

                case "bottom-right":
                  this.children["slider-group"].children["slider-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["slider-group"].children["slider-frame"].segments[3].point = mouseEvent.point;
                  this.children["slider-group"].children["slider-frame"].segments[0].point.y = mouseEvent.point.y;
                  this.children["handle-group"].children["slider-handle"].segments[1].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(SLIDER_MIN_WIDTH, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(SLIDER_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  //newSize.x = ((this.children["handle-group"].children["slider-handle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                  newSize.y = ((this.children["handle-group"].children["slider-handle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                  //newPos.x = this.bounds.left + newSize.x;
                  newPos.y = this.bounds.top + newSize.y;
                  this.children["handle-group"].children["slider-handle"].position.y = newPos.y;
                  this.children["slider-group"].data.to = new paper.Point(mouseEvent.point.x, mouseEvent.point.y);
                  break;

                case "bottom-left":
                  this.children["slider-group"].children["slider-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["slider-group"].children["slider-frame"].segments[0].point = mouseEvent.point;
                  this.children["slider-group"].children["slider-frame"].segments[1].point.x = mouseEvent.point.x;
                  this.children["handle-group"].children["slider-handle"].segments[0].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(SLIDER_MIN_WIDTH, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(SLIDER_MIN_HEIGHT, mouseEvent.point.y - this.bounds.top);
                  //newSize.x = ((this.bounds.right - this.children["handle-group"].children["slider-handle"].position.x) * frame_width) / previous_frame_width;
                  newSize.y = ((this.children["handle-group"].children["slider-handle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                  //newPos.x = this.bounds.right - newSize.x;
                  newPos.y = this.bounds.top + newSize.y;
                  this.children["handle-group"].children["slider-handle"].position.y = newPos.y;
                  this.children["slider-group"].data.from.x = mouseEvent.point.x;
                  this.children["slider-group"].data.to.y = mouseEvent.point.y;
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
    },

    onMouseUp: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          break;
        case PLAY_MODE:
          break;
      }
    },

    onMouseMove: function (mouseEvent) {
      switch (e256_current_mode) {
        case EDIT_MODE:
          break;
        case PLAY_MODE:
          switch (slider_dir) {
            case V_SLIDER:
              if (mouseEvent.point.y > this.bounds.top && mouseEvent.point.y < this.bounds.bottom) {
                //this.value = mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.max, this.data.min);
                this.children["handle-group"].children["slider-handle"].position.y = mouseEvent.point.y;
              }
              break;
            case H_SLIDER:
              if (mouseEvent.point.x > this.bounds.left && mouseEvent.point.x < this.bounds.right) {
                //this.value = mapp(mouseEvent.point.x, this.bounds.left, this.bounds.right, this.data.min, this.data.max);
                this.children["handle-group"].children["slider-handle"].position.x = mouseEvent.point.x;
              }
              break;
          }
          if (this.value != previous_slider_val) {
            previous_slider_val = this.value;
            if (MIDI_device_connected) sendControlChange(this.data.cc, this.value, this.data.chan);
            update_menu_params(this);
          }
          break;
      }
    }

  });
  return _slider;
};
