/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function blobFactory() {
  const DEFAULT_PATH_STROKE_WIDTH = 2;
  const DEFAULT_TOUCH_RADIUS = 10;

  let scale_factor = null;

  var blob = new paper.Group({
    "name": "blob",
    "UID": null,

    setup: function (midiMsg) {
      this.UID = midiMsg[1]
      scale_factor = 6; // FIXME!
    },

    create: function () {
      let _blob_group = new paper.Group({
        "name": "blob-group",
      });

      let _blob_centroid = new paper.Shape.Circle({
        "name": "blob-centroid",
        "center": null,
        "radius": DEFAULT_TOUCH_RADIUS
      });

      _blob_centroid.style = {
        "fillColor": "red"
      };

      _blob_group.addChild(_blob_centroid);

      let _blob_rect = new paper.Path.Rectangle({
        "name": "blob-rect",
      });
      _blob_group.addChild(_blob_rect);

      let _blob_path = new paper.Path({
        "name": "blob-path",
        "segments": [],
        "closed": false
      });

      _blob_path.style = {
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": "black",
        "strokeCap": "round",
        "strokeJoin": "round"
      }
      _blob_group.addChild(_blob_path);

      this.addChild(_blob_group);
    },

    update: function (sysExMsg) {
      let centroid = new paper.Point(
        sysExMsg[2] * scale_factor,
        sysExMsg[3] * scale_factor
      );
      let radius = sysExMsg[4];
      let width = sysExMsg[5] * scale_factor;
      let height = sysExMsg[6] * scale_factor;

      this.children["blob-group"].children["blob-centroid"].position = centroid;
      this.children["blob-group"].children["blob-centroid"].size = radius;
      
      //this.children["blob-group"].children["blob-path"].segments.push(centroid);
      
      //this.children["blob-group"].children["blob-rect"].pos = centroid;
      //this.children["blob-group"].children["blob-rect"].width = width;
      //this.children["blob-group"].children["blob-rect"].height = height;
      
      //this.path.smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
      //this.path.smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth
    },

    print: function () {
      console.log(
        "ID:" + this.UID +
        " X:" + this.children["blob-group"].children["blob-centroid"].center.x +
        " Y:" + this.children["blob-group"].children["blob-centroid"].center.y +
        " Z:" + this.children["blob-group"].children["blob-centroid"].radius +
        " W:" + this.children["blob-group"].children["blob-rect"].width +
        " H:" + this.children["blob-group"].children["blob-rect"].height
      );
    }

  });
  return blob;
};

/////////////////////////////////// Blobs array management
function blobs_array() {
  this.blobs = [];
}

blobs_array.prototype.add = function (midiMsg) {
  if (this.blobs.findIndex(blob => blob.UID === midiMsg[1]) === -1) {
    let new_blob = new blobFactory();
    new_blob.setup(midiMsg);
    new_blob.create();
    this.blobs.push(new_blob);
    //console.log("BLOB_ADD / ADDED: " + midiMsg[1])
  } else {
    console.log("BLOB_ADD / EXISTING: " + midiMsg[1]);
    return;
  }
}

blobs_array.prototype.update = function (sysExMsg) {
  let index = this.blobs.findIndex(blob => blob.UID === sysExMsg[1]);
  if (index !== -1) {
    this.blobs[index].update(sysExMsg);
    //console.log("BLOB_UPDATE / UPDATED: " + sysExMsg[1]);
    //console.log("INDEX: " + index);
  } else {
    return;
  }
}

blobs_array.prototype.remove = function (midiMsg) {
  let index = this.blobs.findIndex(blob => blob.UID === midiMsg[1]);
  if (index !== -1) {
    console.log("INDEX: " + index);
    //this.blobs[index].remove;
    this.blobs[index].children["blob-group"].children["blob-centroid"].fillColor = null;
    this.blobs.splice(index, 1);
    //console.log("BLOB_REMOVE / REMOVED: " + midiMsg[1]);
  } else {
    console.log("BLOB_REMOVE / NOT_FOUND: " + midiMsg[1]);
    return;
  }
}

var e256_blobs = new blobs_array;
