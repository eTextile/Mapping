/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const BLOB_STATUS = {
  FREE: 0,
  NEW: 1,
  PRESENT: 2,
  MISSING: 3,
  RELEASED: 4
};

const BLOB_PARAM_CODE = {
  STATUS: 0,
  LAST_STATUS: 1,
  UID: 2,
  CENTROID_X_WHOLE_PART: 3,
  CENTROID_X_FRACTIONAL_PART: 4,
  CENTROID_Y_WHOLE_PART: 5,
  CENTROID_Y_FRACTIONAL_PART: 6,
  WIDTH: 7,
  HEIGHT: 8,
  DEPTH: 9,
  VELOCITY_XY: 10,
  VELOCITY_Z: 11,
  ATTACK_Z: 12,
  ATTACK_DONE: 13
};

function blob_factory() {

  paper.project.layers['blob'].activate();

  var _blob = new paper.Group({
    "UID": null,

    create: function (sysExMsg) {

      paper.project.layers['blob'].bringToFront();

      this.UID = sysExMsg[BLOB_PARAM_CODE.UID];

      let _blob_group = new paper.Group({
        "name": "blob-group"
      });

      // Pressure arc — drawn first so the circle outline sits on top.
      let _blob_arc = new paper.Path({
        "name": "blob-arc",
        "closed": false,
        "locked": true
      });
      _blob_arc.style = {
        "strokeWidth": 0,
        "strokeColor": null,
        "fillColor": null
      };
      _blob_group.addChild(_blob_arc);

      // Fixed-size circle outline — radius never changes.
      let _blob_centroid = new paper.Path.Circle({
        "name": "blob-centroid",
        "center": new paper.Point(0, 0),
        "radius": TOUCH_RADIUS,
        "locked": true
      });
      _blob_centroid.style = {
        "strokeWidth": 2,
        "strokeColor": null,
        "fillColor": null
      };
      _blob_group.addChild(_blob_centroid);

      let _blob_txt = new paper.PointText({
        "name": "blob-txt",
        "point": null,
        "content": null,
        "locked": true
      });
      _blob_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE / 1.5
      };
      _blob_group.addChild(_blob_txt);

      let _blob_trail = new paper.Group({
        "name": "blob-trail"
      });
      _blob_group.addChild(_blob_trail);

      let _blob_rect = new paper.Shape.Rectangle({
        "name": "blob-box",
        "center": new paper.Point(0, 0),
        "size": new paper.Size(1, 1)
      });
      _blob_rect.style = {
        "strokeWidth": 1,
        "strokeColor": null,
        "fillColor": null
      };
      _blob_group.addChild(_blob_rect);

      this.addChild(_blob_group);
    },

    present: function () {
      this.children["blob-group"].children["blob-centroid"].style.strokeColor = "green";
      this.children["blob-group"].children["blob-arc"].style.fillColor = new paper.Color(0, 0.8, 0, 0.65);
      this.children["blob-group"].children["blob-box"].style.strokeColor = "green";
    },

    missing: function () {
      this.children["blob-group"].children["blob-centroid"].style.strokeColor = "orange";
      this.children["blob-group"].children["blob-arc"].style.fillColor = new paper.Color(1, 0.55, 0, 0.65);
      this.children["blob-group"].children["blob-box"].style.strokeColor = "orange";
    },

    released: function () {
      this.remove();
    },

    update: function (sysExMsg) {

      let centroid = new paper.Point(
        mapp((sysExMsg[BLOB_PARAM_CODE.CENTROID_X_WHOLE_PART] + (sysExMsg[BLOB_PARAM_CODE.CENTROID_X_FRACTIONAL_PART] / 100)), 0, NEW_COLS, 0, canvas_width),
        mapp((sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_WHOLE_PART] + (sysExMsg[BLOB_PARAM_CODE.CENTROID_Y_FRACTIONAL_PART] / 100)), 0, NEW_ROWS, 0, canvas_height)
      );

      // Fixed circle, just move it.
      this.children["blob-group"].children["blob-centroid"].position = centroid;

      // Pressure arc: 0–127 → 0°–360°.
      const depth = sysExMsg[BLOB_PARAM_CODE.DEPTH];
      const arc = this.children["blob-group"].children["blob-arc"];
      _rebuild_pressure_arc(arc, centroid.x, centroid.y, TOUCH_RADIUS, (depth / 127) * 2 * Math.PI);

      let blob_width  = Math.round(mapp(sysExMsg[BLOB_PARAM_CODE.WIDTH],  0, NEW_COLS, 0, canvas_width));
      let blob_height = Math.round(mapp(sysExMsg[BLOB_PARAM_CODE.HEIGHT], 0, NEW_ROWS, 0, canvas_height));

      this.children["blob-group"].children["blob-box"].position = centroid;
      this.children["blob-group"].children["blob-box"].size = new paper.Size(blob_width, blob_height);

      this.children["blob-group"].children["blob-txt"].position = centroid;
      this.children["blob-group"].children["blob-txt"].content =
        "UID: " + sysExMsg[BLOB_PARAM_CODE.UID] +
        "\nX: " + centroid.x.toFixed(2) +
        "\nY: " + centroid.y.toFixed(2) +
        "\nZ: " + depth +
        "\nW: " + blob_width +
        "\nH: " + blob_height +
        "\nVxy: " + sysExMsg[BLOB_PARAM_CODE.VELOCITY_XY] +
        "\nVz: " + sysExMsg[BLOB_PARAM_CODE.VELOCITY_Z] +
        "\nAz: " + sysExMsg[BLOB_PARAM_CODE.ATTACK_Z] +
        "\nAd: " + sysExMsg[BLOB_PARAM_CODE.ATTACK_DONE];

      const VXY_ALPHA = 0.2;
      this.smooth_vxy = this.smooth_vxy !== undefined
        ? this.smooth_vxy + VXY_ALPHA * (sysExMsg[BLOB_PARAM_CODE.VELOCITY_XY] - this.smooth_vxy)
        : sysExMsg[BLOB_PARAM_CODE.VELOCITY_XY];

      let _trail = this.children["blob-group"].children["blob-trail"];
      if (this.last_centroid) {
        let seg = new paper.Path({
          segments: [this.last_centroid, centroid],
          strokeWidth: mapp(this.smooth_vxy, 0, 127, 1, 20),
          strokeColor: "green",
          strokeCap: "round",
          strokeJoin: "round"
        });
        _trail.addChild(seg);
        if (_trail.children.length > 64) _trail.firstChild.remove();
      }
      this.last_centroid = centroid;
    }

  });
  return _blob;
};

function blobs_factory() {

  var _blobs_array = new paper.Group({
    "blobs_array": [],

    update(sysExMsg) {

      let index = this.blobs_array.findIndex((blob) => blob.UID === sysExMsg[BLOB_PARAM_CODE.UID]);

      if (index === -1) {
        if (sysExMsg[BLOB_PARAM_CODE.STATUS] === BLOB_STATUS.NEW) {
          let new_blob = blob_factory();
          new_blob.create(sysExMsg);
          new_blob.present();
          this.blobs_array.push(new_blob);
        }
      }
      else {
        if (sysExMsg[BLOB_PARAM_CODE.STATUS] === BLOB_STATUS.MISSING && sysExMsg[BLOB_PARAM_CODE.LAST_STATUS] === BLOB_STATUS.PRESENT) {
          this.blobs_array[index].missing();
        }
        else if (sysExMsg[BLOB_PARAM_CODE.STATUS] === BLOB_STATUS.PRESENT && sysExMsg[BLOB_PARAM_CODE.LAST_STATUS] === BLOB_STATUS.MISSING) {
          this.blobs_array[index].present();
        }
        else if (sysExMsg[BLOB_PARAM_CODE.STATUS] === BLOB_STATUS.RELEASED) {
          this.blobs_array[index].released();
          this.blobs_array.splice(index, 1);
        }
        else {
          this.blobs_array[index].update(sysExMsg);
        }
      }
    },

    clear: function () {
      for (let blob of this.blobs_array) blob.remove();
      this.blobs_array = [];
      paper.project.layers['blob'].removeChildren();
      paper.view.update();
    }

  });
  return _blobs_array;
};

var e256_blobs = blobs_factory();
