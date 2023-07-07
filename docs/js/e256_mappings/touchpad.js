/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TOUCHPAD Factory
function touchpadFactory() {
  const DEFAULT_PAD_WIDTH = 400;
  const DEFAULT_PAD_HEIGHT = 400;
  const DEFAULT_PAD_TOUCHS = 3;
  const DEFAULT_PAD_MIN = 0;
  const DEFAULT_PAD_MAX = 127;
  const DEFAULT_PAD_SIZE_MIN = 30;
  const DEFAULT_PAD_MARGIN = 35;
  const DEFAULT_MIDI_TOUCH = {
    "x_chan": 1,
    "x_cc": 33,
    "y_chan": 1,
    "y_cc": 34,
    "z_chan": 1,
    "z_cc": 35
  };

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;
  let highlight_item = null;
  let current_part = null;

  var _touchpad = new paper.Group({
    name: "TOUCHPAD",
    data: {
      "from": null,
      "to": null,
      "touchs": null,
      "min": null,
      "max": null,
      "midi": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        Math.round(mouseEvent.point.x - (DEFAULT_PAD_WIDTH / 2)),
        Math.round(mouseEvent.point.y - (DEFAULT_PAD_HEIGHT / 2))
      );
      this.data.to = new paper.Point(
        Math.round(mouseEvent.point.x + (DEFAULT_PAD_WIDTH / 2)),
        Math.round(mouseEvent.point.y + (DEFAULT_PAD_HEIGHT / 2))
      );
      this.data.touchs = DEFAULT_PAD_TOUCHS;
      this.data.min = DEFAULT_PAD_MIN;
      this.data.max = DEFAULT_PAD_MAX;
      this.data.midi = [];
      for (let touch = 0; touch < DEFAULT_PAD_TOUCHS; touch++) {
        this.data.midi.push(DEFAULT_MIDI_TOUCH);
      }
    },

    setup_from_config: function (params) {
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.touchs = params.touchs;
      this.data.min = params.min;
      this.data.max = params.max;
      this.data.midi = [];
      for (const touch in params.touchs) {
        this.data.midi.push(touch);
      }
    },

    save_params: function () {
      this.data.from = this.children["pad-group"].data.from;
      this.data.to = this.children["pad-group"].data.to;
      this.data.touchs = this.children["pad-group"].data.touchs;
      this.data.min = this.children["pad-group"].data.min;
      this.data.max = this.children["pad-group"].data.max;
      this.data.midi = [];
      for (const touch of this.children["touchs-group"].children) {
        this.data.midi.push(touch.data.midi);
      }
    },

    newTouch: function (index) {
      //console.log("INDEX: " + index);
      var _touch_group = new paper.Group({
        "name": "touch-group",
        "index": index,
        "pos": new paper.Point(
          getRandomInt(this.data.from.x + DEFAULT_PAD_MARGIN, this.data.to.x - DEFAULT_PAD_MARGIN),
          getRandomInt(this.data.from.y + DEFAULT_PAD_MARGIN, this.data.to.y - DEFAULT_PAD_MARGIN)
        ),
        "data": {
          "midi": this.data.midi[index],
          "form_style": {
            "x_chan": "form-select",
            "x_cc": "form-select",
            "y_chan": "form-select",
            "y_cc": "form-select",
            "z_chan": "form-select",
            "z_cc": "form-select"
          },
          "form_select_params": {
            "x_chan": MIDI_CHANNELS,
            "x_cc": MIDI_CCHANGE,
            "y_chan": MIDI_CHANNELS,
            "y_cc": MIDI_CCHANGE,
            "z_chan": MIDI_CHANNELS,
            "z_cc": MIDI_CCHANGE
          }
        }
      });

      var _circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": new paper.Point(_touch_group.pos.x, _touch_group.pos.y),
        "radius": 15
      });
      _circle.style = {
        "fillColor": "green"
      };
      _touch_group.addChild(_circle);

      var _line_x = new paper.Path.Line({
        "name": "touch-line-x",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });
      _line_x.style = {
        "strokeWidth": 1,
        "strokeColor": "black"
      }
      _touch_group.addChild(_line_x);

      var _line_y = new paper.Path.Line({
        "name": "touch-line-y",
        "from": new paper.Point(_touch_group.pos.x, this.data.from.y),
        "to": new paper.Point(_touch_group.pos.x, this.data.to.y),
        "locked": true
      });
      _line_y.style = {
        "strokeWidth": 1,
        "strokeColor": "black"
      };
      _touch_group.addChild(_line_y);
      _touch_group.firstChild.bringToFront();
      return _touch_group;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;

      var _pad_group = new paper.Group({
        name: "pad-group",
        data: {
          "from": this.data.from,
          "to": this.data.to,
          "touchs": null,
          "min": null,
          "max": null,
          "form_style": {
            "from": "form-control",
            "to": "form-control",
            "touchs": "form-select",
            "min": "form-select",
            "max": "form-select"
          },
          form_select_params: {
            "touchs": MIDI_CHANNELS,
            "min": MIDI_NOTES,
            "max": MIDI_NOTES
          }
        }
      });

      var _pad_frame = new paper.Path.Rectangle({
        "name": "pad-frame",
        "from": this.data.from,
        "to": this.data.to
      });
      _pad_frame.style = {
        "strokeWidth": 5,
        "dashArray": [10, 5],
        "strokeColor": "chartreuse",
        "fillColor": "pink"
      };
      _pad_group.addChild(_pad_frame);
      this.addChild(_pad_group);

      var _touchs_group = new paper.Group({
        "name": "touchs-group"
      });
      for (let touch = 0; touch < this.data.touchs; touch++) {
        _touchs_group.addChild(this.newTouch(touch));
      }
      this.addChild(_touchs_group);
      this.bringToFront();
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
            if (tmp_select.item.name === "TOUCHPAD") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "pad-group" || tmp_select.item.name === "touch-group") {
              highlight_item = tmp_select.item.firstChild;
            }
            else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "touch-circle") {
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

      console.log(tmp_select.item.name);

      if (tmp_select) {
        previous_controleur = current_controleur; // DONE in paper_script.js
        current_controleur = this;

        previous_item = current_item;
        previous_part = current_part;

        if (tmp_select.item.name === "TOUCHPAD") {
          current_item = tmp_select.item.firstChild;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "pad-group" || tmp_select.item.name === "touch-group") {
          current_item = tmp_select.item;
          current_part = tmp_select;
        }
        else if (tmp_select.item.name === "pad-frame" || tmp_select.item.name === "touch-circle") {
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
        //console.log("PART_CUR: " + current_part.type);
        //console.log("PART_PEV: " + previous_part.name);

        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_item.name === "grid-key" && previous_item.name === "grid-key") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.fillColor = "orange";
            }
            else if (current_item.name === "grid-frame" && previous_item.name === "grid-key") {
              //previous_item.firstChild.style.fillColor = "pink";
              //current_item.firstChild.style.strokeColor = "orange";
            }
            else if (previous_item.name === "grid-frame" && current_item.name === "grid-key") {
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
            if (current_item.name === "pad-group") {
              switch (current_part.name) {
                case "top-left":
                  this.children["pad-group"].children["pad-frame"].segments[0].point.x = mouseEvent.point.x;
                  this.children["pad-group"].children["pad-frame"].segments[1].point = mouseEvent.point;
                  this.children["pad-group"].children["pad-frame"].segments[2].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
                  for (const touch of this.children["touchs-group"].children) {
                    touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-group"].data.from = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;
                case "top-right":
                  this.children["pad-group"].children["pad-frame"].segments[1].point.y = mouseEvent.point.y;
                  this.children["pad-group"].children["pad-frame"].segments[2].point = mouseEvent.point;
                  this.children["pad-group"].children["pad-frame"].segments[3].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.bottom - mouseEvent.point.y);
                  for (const touch of this.children["touchs-group"].children) {
                    touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-group"].data.from.y = Math.round(mouseEvent.point.y);
                  this.children["pad-group"].data.to.x = Math.round(mouseEvent.point.x);
                  break;
                case "bottom-right":
                  this.children["pad-group"].children["pad-frame"].segments[2].point.x = mouseEvent.point.x;
                  this.children["pad-group"].children["pad-frame"].segments[3].point = mouseEvent.point;
                  this.children["pad-group"].children["pad-frame"].segments[0].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);
                  for (const touch of this.children["touchs-group"].children) {
                    touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-group"].data.to = new paper.Point(Math.round(mouseEvent.point.x), Math.round(mouseEvent.point.y));
                  break;
                case "bottom-left":
                  this.children["pad-group"].children["pad-frame"].segments[3].point.y = mouseEvent.point.y;
                  this.children["pad-group"].children["pad-frame"].segments[0].point = mouseEvent.point;
                  this.children["pad-group"].children["pad-frame"].segments[1].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_SIZE_MIN, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_SIZE_MIN, mouseEvent.point.y - this.bounds.top);
                  for (const touch of this.children["touchs-group"].children) {
                    touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    touch.children["touch-circle"].position = newPos;
                    touch.children["touch-line-x"].position.y = newPos.y;
                    touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  this.children["pad-group"].data.from.x = Math.round(mouseEvent.point.x);
                  this.children["pad-group"].data.to.y = Math.round(mouseEvent.point.y);
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
  return _touchpad;
};
