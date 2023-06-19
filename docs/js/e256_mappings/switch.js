/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Codatammons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

/////////// TRIGGER Factory
function triggerFactory() {
  const DEFAULT_TRIGER_WIDTH = 45;
  const DEFAULT_TRIGER_HEIGHT = 45;
  const DEFAULT_TRIGER_RADIUS = 45;
  const DEFAULT_TRIGER_MODE = KEY_TRIGGER;
  const DEFAULT_TRIGER_SIZE_MIN = 30;

  var size = new paper.Point();
  var center = new paper.Point();
  let radius = new paper.Point();
  let select = false;

  let half_width = DEFAULT_TRIGER_WIDTH / 2;
  let half_height = DEFAULT_TRIGER_WIDTH / 2;

  var _trigger = new paper.Group({
    name: "trigger",
    data: {
      from: [null, null],
      to: [null, null],
      mode: null,
      chan: null,
      note: null,
      velo: null
    },

    setup_from_mouse_event: function (mouseEvent) {
      this.data.from = new paper.Point(
        Math.round(mouseEvent.point.x - DEFAULT_TRIGER_WIDTH / 2),
        Math.round(mouseEvent.point.y - DEFAULT_TRIGER_HEIGHT / 2)
      );
      this.data.to = new paper.Point(
        Math.round(mouseEvent.point.x + DEFAULT_TRIGER_WIDTH / 2),
        Math.round(mouseEvent.point.y + DEFAULT_TRIGER_HEIGHT / 2)
      );
      this.data.mode = DEFAULT_TRIGER_MODE;
    },

    setup_from_config: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velo = params.velo;
    },

    create: function () {
      size.x = this.bounds.right - this.bounds.left;
      size.y = this.bounds.bottom - this.bounds.top;
      center.x = this.bounds.left + (size.x / 2);
      center.y = this.bounds.top + (size.y / 2);

      var _frame = new paper.Group({
        name: "trigger-frame",
        data: {
          from: this.data.from,
          to: this.data.to,
          mode: this.data.mode,
          form_style: {
            from: "form-control",
            to: "form-control",
            mode: "form-select",
          },
          form_select_params: {
            mode: KEY_MODES,
          }
        }
      });

      var _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from,
        to: this.data.to,
      });
      _square.style = {
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "skyblue"
      }
      this.addChild(_square);

      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(circleCenterX, circleCenterY),
        radius: size.x / 2.5
      });
      _circle.style = {
        fillColor: "yellow"
      }
      this.addChild(_circle);
    },

    activate: function () {
      if (selectedPart.name === "circle") {
        this.children["circle"].fillColor = "lawngreen";
        this.data.value = this.data.note;
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velo, this.data.chan);
        update_menu_params(this);
        setTimeout(this.triggerOff, 300, this);
      }
    },

    onMouseEnter: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        if (!select) {
          e256_select(this.children["square"], MOUSE_OVER);
          show_item_menu_params(this);
          console.log("EVENT_ID: " + mouseEvent.currentTarget.index);
          console.log("EVENT_NAME: " + mouseEvent);
        } else {
          // NA
        }
      }
    },

    onMouseLeave: function () {
      if (e256_current_mode === EDIT_MODE) {
        if (!select) {
          e256_select(this.children["square"], MOUSE_LEAVE);
        } else {
        }
      }
    },

    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            if (selectedPart.name === "square") {
              previous_radius = radius;
              radius = new paper.Point(
                (this.bounds.right - this.bounds.left) / 2,
                (this.bounds.bottom - this.bounds.top) / 2
              );
              center.x = this.bounds.left + radius.x;
              center.y = this.bounds.top + radius.y;
              let x = mouseEvent.point.x - trigger_center_x;
              let y = mouseEvent.point.y - trigger_center_y;
              radius.x = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);

              if (radius.x > DEFAULT_TRIGER_SIZE_MIN && radius.y > DEFAULT_TRIGER_SIZE_MIN &&) {
                this.scale(radius.x / previous_radius.x);
                this.data.from.x = Math.round(this.children["square"].bounds.left);
                this.data.from.y = Math.round(this.children["square"].bounds.top);
                this.data.to.x = Math.round(this.children["square"].bounds.right);
                this.data.to.y = Math.round(this.children["square"].bounds.bottom);
              }
            }
            else if (selectedPart.name === "circle") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        update_menu_params(this);
      }
    },
    triggerOff: function (item) {
      item.children["circle"].fillColor = "yellow";
      item.data.value = 0;
      if (MIDI_device_connected) sendNoteOff(item.data.note, 0, item.data.chan);
      update_menu_params(item);
    }
  });
  return _trigger;
};

/////////// SWITCH Factory
function switchFactory() {
  var defaulSize = 80;
  var _Switch = new paper.Group({
    data: {
      type: "switch",
      from: [null, null],
      to: [null, null],
      value: true,
      chan: null,
      note: null,
      velo: null
    },
    setup_from_mouse_event: function (mouseEvent) {
      let halfSize = defaulSize / 2
      this.data.from.y = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to.y = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setup_from_config: function (params) {
      this.data.from.y = params.from;
      this.data.to.y = params.to;
      this.data.chan = params.chan;
      this.data.note = params.note;
      this.data.velo = params.velo;
    },
    create: function () {
      let _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from.y,
        to: this.data.to.y,
        strokeWidth: 5,
        dashArray: [10, 5],
        strokeColor: "chartreuse",
        fillColor: "yellow"
      });
      let _line_a = new paper.Path.Line({
        name: "cross_line_x",
        from: new paper.Point(this.data.from.x, this.data.from.y),
        to: new paper.Point(this.data.to.x, this.data.to.y),
        strokeWidth: 1,
        strokeColor: "black"
      });
      let _line_b = new paper.Path.Line({
        name: "cross_line_y",
        from: new paper.Point(this.data.from.x, this.data.to.y),
        to: new paper.Point(this.data.to.x, this.data.from.y),
        strokeWidth: 1,
        strokeColor: "black"
      });
      this.addChild(_square);
      this.addChild(_line_a);
      this.addChild(_line_b);
    },
    activate: function () {
      this.data.value = !this.data.value;
      if (this.data.value) {
        this.children["cross_line_x"].visible = true;
        this.children["cross_line_y"].visible = true;
        if (MIDI_device_connected) sendNoteOn(this.data.note, this.data.velo, this.data.chan);
      } else {
        this.children["cross_line_x"].visible = false;
        this.children["cross_line_y"].visible = false;
        if (MIDI_device_connected) sendNoteOff(this.data.note, 0, this.data.chan);
      }
      update_menu_params(this);
    },
    select: function () {
      this.children["square"].opacity = 1;
      update_menu_params(this);
    },
    free: function () {
      this.children["square"].opacity = 0;
    },
    onMouseEnter: function () {
      switch (e256_current_mode) {
        case EDIT_MODE:
          this.select();
          break;
        case PLAY_MODE:
          //
          break;
      }
      show_item_menu_params(this);
      update_menu_params(this);
    },
    onMouseLeave: function () {
      if (e256_current_mode === EDIT_MODE) {
        this.free();
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (e256_current_mode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            break;
          case "stroke":
            if (selectedPart.name === "square") {
              var switchRadius_x = (this.bounds.right - this.bounds.left) / 2;
              var switchRadius_y = (this.bounds.bottom - this.bounds.top) / 2;
              var switchRadius = switchRadius_x;
              var switchCenter_x = this.bounds.left + switchRadius_x;
              var switchCenter_y = this.bounds.top + switchRadius_y;
              var x = mouseEvent.point.x - switchCenter_x;
              var y = mouseEvent.point.y - switchCenter_y;
              var previous_switch_radius = switchRadius;
              var switchRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(switchRadius / previous_switch_radius);
              this.data.from.x = Math.round(this.children["square"].bounds.left);
              this.data.from.y = Math.round(this.children["square"].bounds.top);
              this.data.to.x = Math.round(this.children["square"].bounds.right);
              this.data.to.y = Math.round(this.children["square"].bounds.bottom);
            }
            else if (selectedPart.name === "line") {
              moveItem(this, mouseEvent);
            }
            break;
        }
        update_menu_params(this);
      }
    }
  });
  return _switch;
};
