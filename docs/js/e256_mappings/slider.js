/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// SLIDER Factory
// Multitouch MIDI slider GUI
function sliderFactory() {
  const DEFAULT_SLIDER_WIDTH = 60;
  const DEFAULT_SLIDER_HEIGHT = 400;
  const DEFAULT_SLIDER_MIN_WIDTH = 50;
  const DEFAULT_SLIDER_MIN_HEIGHT = 100;
  const DEFAULT_SLIDER_TOUCHS = 1;
  const DEFAULT_SLIDER_TOUCH_RADIUS = 20;
  const DEFAULT_SLIDER_VELOCITY = "OFF";
  const DEFAULT_SLIDER_DIR = "V_SLIDER";

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;

  var _slider = new paper.Group({
    "name": "slider",
    "dir": null,
    "data": {
      "touch": null,
      "from": null,
      "to": null,
      "velocity": null,
      "pressure": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.dir = DEFAULT_SLIDER_DIR;
      this.data.touch = DEFAULT_SLIDER_TOUCHS;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_SLIDER_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_SLIDER_HEIGHT / 2)
      );
      this.data.velocity = DEFAULT_SLIDER_VELOCITY;
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_SLIDER_TOUCHS; _touch++) {
        this.data.msg.push(new midi_slider_touch_msg(_touch));
      }
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;
    },

    setup_from_config: function (params) {
      this.data.touch = params.touch;
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.velocity = params.velocity;
      this.data.msg = params.msg;
    },

    save_params: function () {
      let last_touch_count = this.data.touch;
      this.data.touch = this.children["slider-group"].data.touch;
      this.data.from = this.children["slider-group"].data.from;
      this.data.to = this.children["slider-group"].data.to;
      this.data.velocity = this.children["slider-group"].data.velocity;
      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touch; _touch++) {
        if (_touch < last_touch_count) {
          
          //console.log("min: " + this.children["touchs-group"].children[_touch].data.midi.position.min);
          //console.log("max: " + this.children["touchs-group"].children[_touch].data.midi.position.max);
          this.data.msg.push(this.children["touchs-group"].children[_touch].data);
        }
        else {
          this.data.msg.push(new midi_slider_touch_msg(_touch));
        }
      }
    },

    // TOUCH_GROUP
    new_touch: function (_touch_uid, _slider) {
      
      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_uid,
        "pos": new paper.Point(
          this.data.to.x - this.data.from.x + (DEFAULT_SLIDER_HEIGHT / 2),
          get_random_int(this.data.from.y, this.data.to.y)
        ),
        "curr_position": null,
        "prev_position": null,
        "curr_pressure": null,
        "prev_pressure": null,    
        "data": this.data.msg[_touch_uid]
      });

      let _touch_line = new paper.Path.Line({
        "name": "touch-line",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });

      _touch_line.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "locked": true
      };
      
      _touch_group.addChild(_touch_line);

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": new paper.Point(this.data.from.x + (DEFAULT_SLIDER_WIDTH / 2), _touch_group.pos.y),
        "radius": DEFAULT_SLIDER_TOUCH_RADIUS // TODO: mapping with the blob pressure!  
      });
      
      _touch_circle.style = {
        "fillColor": "#606060"
      };
      
      _touch_circle.onMouseEnter = function () {
        this.style.fillColor = "red";
      }
      
      _touch_circle.onMouseLeave = function () {
        this.style.fillColor = "#606060";
      }

      _touch_circle.onMouseDown = function () {
        previous_item = current_item;
        current_item = this.parent;
      }

      _touch_circle.onMouseMove = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // NA
            break;
          case PLAY_MODE:
            switch (_slider.dir) {
              case "V_SLIDER":
                if (mouseEvent.point.y > _slider.children["slider-frame"].bounds.top &&
                    mouseEvent.point.y < _slider.children["slider-frame"].bounds.bottom){
                      _touch_line.position.y = mouseEvent.point.y;
                      _touch_circle.position.y = mouseEvent.point.y;
                      _touch_group.data.midi.position.val = Math.round(
                        mapp(
                          mouseEvent.point.y,
                          _slider.children["slider-frame"].bounds.top,
                          _slider.children["slider-frame"].bounds.bottom,
                          _touch_group.data.midi.position.min,
                          _touch_group.data.midi.position.max
                        )
                      );
                    }
                break;
              case "H_SLIDER":
                if (mouseEvent.point.x > _slider.children["slider-frame"].bounds.left &&
                    mouseEvent.point.x < _slider.children["slider-frame"].bounds.right){
                      _touch_line.position.x = mouseEvent.point.x;
                      _touch_circle.position.x = mouseEvent.point.x;
                      _touch_group.data.midi.position.val = Math.round(
                        mapp(
                          mouseEvent.point.x,
                          _slider.children["slider-frame"].bounds.left,
                          _slider.children["slider-frame"].bounds.right,
                          _touch_group.data.midi.position.min,
                          _touch_group.data.midi.position.max
                        )
                      );
                    }
                break;
            }
            update_touch_menu_params(_touch_group);

            if (_touch_group.data.midi.position.val != _touch_group.prev_position) {
              _touch_group.prev_position = _touch_group.data.midi.position.val;
              if (midi_device_connected){
                //sendControlChange(this.data.msg.position);
                // TODO: add console GUI to monitor the outgoing MIDI messages!
              }
            }
            break;
        }
      }

      /*
      let _touch_txt = new paper.PointText({
        "name": "key-text",
        "point": _touch_circle.position,
        "content": _touch_uid,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": 25
      };
      
      _touch_circle.addChild(_touch_txt);
      */
      
      _touch_group.addChild(_touch_circle);
      return _touch_group;
    },

    create: function () {

      let _slider_group = new paper.Group({
        "name": "slider-group",
        "dir": this.dir,
        "data": {
          "touch": this.data.touch,
          "from": this.data.from,
          "to": this.data.to,
          "velocity": this.data.velocity
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < _slider_group.data.touch; _touch++) {
        _touchs_group.addChild(this.new_touch(_touch, _slider_group));
      }

      var _slider_frame = new paper.Path.Rectangle({
        "name": "slider-frame",
        "from": _slider_group.data.from,
        "to": _slider_group.data.to
      });

      _slider_frame.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "fillColor": "azure"
      };

      _slider_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _slider_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _slider_frame.onMouseDown = function () {
        previous_item = current_item;
        current_item = _slider_group;
      }

      _slider_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              let new_size = new paper.Point();
              let new_pos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  previous_frame_width = frame_width;
                  frame_width = this.bounds.right - mouseEvent.point.x;
                  if (frame_width > DEFAULT_SLIDER_MIN_WIDTH) {
                    this.segments[0].point.x = mouseEvent.point.x;
                    this.segments[1].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      new_size.x = ((this.bounds.right - _touch.children["touch-line"].position.x) * frame_width) / previous_frame_width;
                      new_pos.x = this.bounds.right - new_size.x;
                      _touch.children["touch-line"].segments[0].point.x = mouseEvent.point.x;
                      _touch.children["touch-circle"].position.x = new_pos.x;
                    }
                    _slider_group.data.from.x = mouseEvent.point.x;
                  }
                  previous_frame_height = frame_height;
                  frame_height = this.bounds.bottom - mouseEvent.point.y;
                  if (frame_height > DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[1].point.y = mouseEvent.point.y;
                    this.segments[2].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-line"].position.y) * frame_height) / previous_frame_height;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-line"].position.y = new_pos.y;
                      _touch.children["touch-circle"].position.y = new_pos.y;
                    }
                    _slider_group.data.from.y = mouseEvent.point.y;
                  }
                  break;
                case "top-right":
                  previous_frame_width = frame_width;
                  frame_width = mouseEvent.point.x - this.bounds.left;
                  if (frame_width > DEFAULT_SLIDER_MIN_WIDTH) {
                    this.segments[2].point.x = mouseEvent.point.x;
                    this.segments[3].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line"].segments[1].point.x = mouseEvent.point.x;
                      new_size.x = ((_touch.children["touch-line"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                      new_pos.x = this.bounds.left + new_size.x;
                      _touch.children["touch-circle"].position.x = new_pos.x;
                    }
                    _slider_group.data.to.x = mouseEvent.point.x;
                  }
                  previous_frame_height = frame_height;
                  frame_height = this.bounds.bottom - mouseEvent.point.y;
                  if (frame_height > DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[1].point.y = mouseEvent.point.y;
                    this.segments[2].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.y = ((this.bounds.bottom - _touch.children["touch-line"].position.y) * frame_height) / previous_frame_height;
                      new_pos.y = this.bounds.bottom - new_size.y;
                      _touch.children["touch-line"].position.y = new_pos.y;
                      _touch.children["touch-circle"].position.y = new_pos.y;
                    }
                    _slider_group.data.from.y = mouseEvent.point.y;
                  }

                  break;
                case "bottom-right":
                  previous_frame_width = frame_width;
                  frame_width = mouseEvent.point.x - this.bounds.left;
                  if (frame_width > DEFAULT_SLIDER_MIN_WIDTH) {
                    this.segments[2].point.x = mouseEvent.point.x;
                    this.segments[3].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line"].segments[1].point.x = mouseEvent.point.x;
                      new_size.x = ((_touch.children["touch-line"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                      new_pos.x = this.bounds.left + new_size.x;
                      _touch.children["touch-circle"].position.x = new_pos.x;
                    }
                    _slider_group.data.to.x = mouseEvent.point.x;
                  }
                  previous_frame_height = frame_height;
                  frame_height = mouseEvent.point.y - this.bounds.top;
                  if (frame_height > DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[0].point.y = mouseEvent.point.y;
                    this.segments[3].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.y = ((_touch.children["touch-line"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-line"].position.y = new_pos.y;
                      _touch.children["touch-circle"].position.y = new_pos.y;
                    }
                    _slider_group.data.to.y = mouseEvent.point.y;
                  }
                  break;
                case "bottom-left":
                  previous_frame_width = frame_width;
                  frame_width = this.bounds.right - mouseEvent.point.x;
                  if (frame_width > DEFAULT_SLIDER_MIN_WIDTH) {
                    this.segments[0].point.x = mouseEvent.point.x;
                    this.segments[1].point.x = mouseEvent.point.x;
                    for (const _touch of _touchs_group.children) {
                      _touch.children["touch-line"].segments[0].point.x = mouseEvent.point.x;
                      new_size.x = ((this.bounds.right - _touch.children["touch-line"].position.x) * frame_width) / previous_frame_width;
                      new_pos.x = this.bounds.right - new_size.x;
                      _touch.children["touch-circle"].position.x = new_pos.x;
                    }
                    _slider_group.data.from.x = mouseEvent.point.x;
                  }
                  previous_frame_height = frame_height;
                  frame_height = mouseEvent.point.y - this.bounds.top;
                  if (frame_height > DEFAULT_SLIDER_MIN_HEIGHT) {
                    this.segments[3].point.y = mouseEvent.point.y;
                    this.segments[0].point.y = mouseEvent.point.y;
                    for (const _touch of _touchs_group.children) {
                      new_size.y = ((_touch.children["touch-line"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                      new_pos.y = this.bounds.top + new_size.y;
                      _touch.children["touch-line"].position.y = new_pos.y;
                      _touch.children["touch-circle"].position.y = new_pos.y;
                    }
                    _slider_group.data.to.y = mouseEvent.point.y;
                  }
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_menu_params(_slider_group.parent);
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      _slider_group.addChild(_slider_frame);
      this.addChild(_slider_group);
      this.addChild(_touchs_group);
      //_touch_group.children["key-text"].bringToFront();
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

  return _slider;
};
