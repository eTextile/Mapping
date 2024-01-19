/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TOUCHPAD Factory
function touchpadFactory() {
  const DEFAULT_PAD_WIDTH = 450;
  const DEFAULT_PAD_HEIGHT = 450;
  const DEFAULT_PAD_MARGIN = 35;
  const DEFAULT_PAD_MIN_SIZE = 30;
  const DEFAULT_PAD_TOUCH = 1;
  const DEFAULT_PAD_TOUCH_RADIUS = 20;

  let frame_width = null;
  let frame_height = null;
  let previous_frame_width = null;
  let previous_frame_height = null;

  var _touchpad = new paper.Group({
    name: "touchpad",
    data: {
      "touch": null,
      "from": null,
      "to": null,
      "pressure": null,
      "velocity": null,
      "msg": null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.touch = DEFAULT_PAD_TOUCH;
      this.data.from = new paper.Point(
        mouseEvent.point.x - (DEFAULT_PAD_WIDTH / 2),
        mouseEvent.point.y - (DEFAULT_PAD_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        mouseEvent.point.x + (DEFAULT_PAD_WIDTH / 2),
        mouseEvent.point.y + (DEFAULT_PAD_HEIGHT / 2)
      );
      this.data.msg = [];
      for (let _touch = 0; _touch < DEFAULT_PAD_TOUCH; _touch++) {
        this.data.msg.push(new midi_pad_touch_msg(_touch));
      }
    },

    setup_from_config: function (params) {
      this.data.touch = params.touch;
      this.data.from = new paper.Point(params.from);
      this.data.to = new paper.Point(params.to);
      this.data.msg = params.msg;
    },

    save_params: function () {
      let last_touch_count = this.data.touch;
      this.data.touch = this.children["pad-group"].data.touch;
      this.data.from = this.children["pad-group"].data.from;
      this.data.to = this.children["pad-group"].data.to;
      this.data.velocity = this.children["pad-group"].data.velocity;
      this.data.msg = [];
      for (let _touch = 0; _touch < this.data.touch; _touch++) {
        if (_touch < last_touch_count) {
          this.data.msg.push(this.children["touchs-group"].children[_touch].data);
        }
        else {
          this.data.msg.push(new midi_pad_touch_msg(_touch));
        }
      }
    },

    new_touch: function (_touch_id, _touchpad) {

      let _touch_group = new paper.Group({
        "name": "touch-" + _touch_id,
        "pos": new paper.Point(
          get_random_int(this.data.from.x + DEFAULT_PAD_MARGIN, this.data.to.x - DEFAULT_PAD_MARGIN),
          get_random_int(this.data.from.y + DEFAULT_PAD_MARGIN, this.data.to.y - DEFAULT_PAD_MARGIN)
        ),
        //"curr_position_x": null,
        "prev_position_x": null,
        "curr_pressure": null,
        "prev_pressure": null,
        "data": this.data.msg[_touch_id]
      });

      let _touch_line_x = new paper.Path.Line({
        "name": "touch-line-x",
        "from": new paper.Point(this.data.from.x, _touch_group.pos.y),
        "to": new paper.Point(this.data.to.x, _touch_group.pos.y),
        "locked": true
      });

      _touch_line_x.style = {
        "strokeWidth": .5,
        "dashArray": [15, 4],
        "strokeColor": "black"
      }

      _touch_group.addChild(_touch_line_x);

      let _touch_line_y = new paper.Path.Line({
        "name": "touch-line-y",
        "from": new paper.Point(_touch_group.pos.x, this.data.from.y),
        "to": new paper.Point(_touch_group.pos.x, this.data.to.y),
        "locked": true
      });

      _touch_line_y.style = {
        "strokeWidth": .5,
        "dashArray": [15, 4],
        "strokeColor": "black"
      };

      _touch_group.addChild(_touch_line_y);

      let _touch_circle = new paper.Path.Circle({
        "name": "touch-circle",
        "center": _touch_group.pos,
        "radius": DEFAULT_PAD_TOUCH_RADIUS
      });

      _touch_circle.style = {
        "fillColor": "green"
      };

      _touch_circle.onMouseEnter = function () {
        this.style.fillColor = "red";
      }

      _touch_circle.onMouseLeave = function () {
        this.style.fillColor = "green";
      }

      _touch_circle.onMouseDown = function () {
        previous_touch = current_touch;
        current_touch = _touch_group;
      }

      let _touch_txt = new paper.PointText({
        "name": "key-text",
        "point": _touch_circle.position + ,
        "content": _touch_id,
        "locked": true
      });

      _touch_txt.style = {
        "fillColor": "black",
        "fontSize": 25
      };

      _touch_circle.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            // NA
            break;
          case PLAY_MODE:
            if (mouseEvent.point.x > _touchpad.children["pad-frame"].bounds.left &&
              mouseEvent.point.x < _touchpad.children["pad-frame"].bounds.right &&
              mouseEvent.point.y > _touchpad.children["pad-frame"].bounds.top &&
              mouseEvent.point.y < _touchpad.children["pad-frame"].bounds.bottom) {
              _touch_line_x.position.y = mouseEvent.point.y;
              _touch_line_y.position.x = mouseEvent.point.x
              _touch_circle.position = mouseEvent.point;
              _touch_txt.position = mouseEvent.point;

              _touch_group.data.midi.position_x.val = Math.round(
                mapp(mouseEvent.point.x,
                  _touchpad.children["pad-frame"].bounds.right,
                  _touchpad.children["pad-frame"].bounds.left,
                  _touch_group.data.midi.position_x.min,
                  _touch_group.data.midi.position_x.max
                )
              );
              if (_touch_group.data.midi.position_x.val != _touch_group.prev_position_x) {
                _touch_group.prev_position_x = _touch_group.data.midi.position_x.val;
                //if (midi_device_connected){
                sendControlChange(_touch_group.data.midi.position_x);
                //}
              }
              _touch_group.data.midi.position_y.val = Math.round(
                mapp(mouseEvent.point.y,
                  _touchpad.children["pad-frame"].bounds.top,
                  _touchpad.children["pad-frame"].bounds.bottom,
                  _touch_group.data.midi.position_y.min,
                  _touch_group.data.midi.position_y.max
                )
              );
              if (_touch_group.data.midi.position_y.val != _touch_group.prev_position_y) {
                _touch_group.prev_position_y = _touch_group.data.midi.position_y.val;
                //if (midi_device_connected){
                sendControlChange(_touch_group.data.midi.position_y);
                //}
              }
            }

            update_touch_menu_params(_touch_group);
            break;
        }
      }
      _touch_group.addChild(_touch_circle);
      _touch_group.addChild(_touch_txt);

      return _touch_group;
    },

    create: function () {
      frame_width = this.data.to.x - this.data.from.x;
      frame_height = this.data.to.y - this.data.from.y;

      let _pad_group = new paper.Group({
        name: "pad-group",
        data: {
          "touch": this.data.touch,
          "from": this.data.from,
          "to": this.data.to
        }
      });

      let _touchs_group = new paper.Group({
        "name": "touchs-group"
      });

      for (let _touch = 0; _touch < this.data.touch; _touch++) {
        _touchs_group.addChild(this.new_touch(_touch, _pad_group));
      }

      let _pad_frame = new paper.Path.Rectangle({
        "name": "pad-frame",
        "from": this.data.from,
        "to": this.data.to
      });

      _pad_frame.style = {
        "fillColor": "pink"
      };

      _pad_frame.onMouseEnter = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = true;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _pad_frame.onMouseLeave = function () {
        switch (e256_current_mode) {
          case EDIT_MODE:
            this.selected = false;
            break;
          case PLAY_MODE:
            break;
        }
      }

      _pad_frame.onMouseDown = function () {
      }

      _pad_frame.onMouseDrag = function (mouseEvent) {
        switch (e256_current_mode) {
          case EDIT_MODE:
            if (current_part.type === "bounds") {
              let newSize = new paper.Point();
              let newPos = new paper.Point();
              switch (current_part.name) {
                case "top-left":
                  this.segments[0].point.x = mouseEvent.point.x;
                  this.segments[1].point = mouseEvent.point;
                  this.segments[2].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    _touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    _touch.children["touch-circle"].position = newPos;
                    _touch.children["touch-line-x"].position.y = newPos.y;
                    _touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  _pad_group.data.from = new paper.Point(mouseEvent.point.x, mouseEvent.point.y);
                  break;
                case "top-right":
                  this.segments[1].point.y = mouseEvent.point.y;
                  this.segments[2].point = mouseEvent.point;
                  this.segments[3].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_MIN_SIZE, this.bounds.bottom - mouseEvent.point.y);
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    _touch.children["touch-line-y"].segments[0].point.y = mouseEvent.point.y;
                    newSize.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((this.bounds.bottom - _touch.children["touch-circle"].position.y) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.bottom - newSize.y;
                    _touch.children["touch-circle"].position = newPos;
                    _touch.children["touch-line-x"].position.y = newPos.y;
                    _touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  _pad_group.data.from.y = mouseEvent.point.y;
                  _pad_group.data.to.x = mouseEvent.point.x;
                  break;
                case "bottom-right":
                  this.segments[2].point.x = mouseEvent.point.x;
                  this.segments[3].point = mouseEvent.point;
                  this.segments[0].point.y = mouseEvent.point.y;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_MIN_SIZE, mouseEvent.point.x - this.bounds.left);
                  frame_height = Math.max(DEFAULT_PAD_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-line-x"].segments[1].point.x = mouseEvent.point.x;
                    _touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((_touch.children["touch-circle"].position.x - this.bounds.left) * frame_width) / previous_frame_width;
                    newSize.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.left + newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    _touch.children["touch-circle"].position = newPos;
                    _touch.children["touch-line-x"].position.y = newPos.y;
                    _touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  _pad_group.data.to = new paper.Point(mouseEvent.point.x, mouseEvent.point.y);
                  break;
                case "bottom-left":
                  this.segments[3].point.y = mouseEvent.point.y;
                  this.segments[0].point = mouseEvent.point;
                  this.segments[1].point.x = mouseEvent.point.x;
                  previous_frame_width = frame_width;
                  previous_frame_height = frame_height;
                  frame_width = Math.max(DEFAULT_PAD_MIN_SIZE, this.bounds.right - mouseEvent.point.x);
                  frame_height = Math.max(DEFAULT_PAD_MIN_SIZE, mouseEvent.point.y - this.bounds.top);
                  for (const _touch of _touchs_group.children) {
                    _touch.children["touch-line-x"].segments[0].point.x = mouseEvent.point.x;
                    _touch.children["touch-line-y"].segments[1].point.y = mouseEvent.point.y;
                    newSize.x = ((this.bounds.right - _touch.children["touch-circle"].position.x) * frame_width) / previous_frame_width;
                    newSize.y = ((_touch.children["touch-circle"].position.y - this.bounds.top) * frame_height) / previous_frame_height;
                    newPos.x = this.bounds.right - newSize.x;
                    newPos.y = this.bounds.top + newSize.y;
                    _touch.children["touch-circle"].position = newPos;
                    _touch.children["touch-line-x"].position.y = newPos.y;
                    _touch.children["touch-line-y"].position.x = newPos.x;
                  }
                  _pad_group.data.from.x = mouseEvent.point.x;
                  _pad_group.data.to.y = mouseEvent.point.y;
                  break;
                default:
                  console.log("PART_NOT_USE: " + current_part.name);
                  break;
              }
            }
            update_item_menu_params(_pad_group.parent);
            break;
          case PLAY_MODE:
            // NA
            break;
        }
      }

      _pad_group.addChild(_pad_frame);
      this.addChild(_pad_group);
      this.addChild(_touchs_group);
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

  return _touchpad;
};
