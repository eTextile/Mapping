/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const BLOB_UID_INDEX = 1;
//..
const BLOB_WIDTH_INDEX = 6;
const BLOB_HEIGHT_INDEX = 7;
const BLOB_DEPTH_INDEX = 8;
const BLOB_STATUS_INDEX = 9;
const BLOB_LAST_STATUS_INDEX = 10;

function blob_factory() {

  var _blob = new paper.Group({
    "UID": null,
    //"status": null,
    //"last_status": null,
    //"active_time_stamp": null,
    //"life_time_stamp": null,

    create: function (sysExMsg) {

      paper.project.layers['blob'].activate();
      paper.project.layers['blob'].bringToFront();

      this.UID = sysExMsg[BLOB_UID_INDEX];

      let _blob_group = new paper.Group({
        "name": "blob-group"
      });
     
      let _blob_rect = new paper.Path.Rectangle({
        "name": "blob-box",
        "point": null,
        "size": null
      });

      _blob_rect.style = {
        "fillColor": "black",
        "strokeWidth": 1,
        "strokeColor": "black",
        "locked": true
      }
      _blob_group.addChild(_blob_rect);

      let _blob_centroid = new paper.Shape.Ellipse({
        "name": "blob-centroid",
        "center": null,
        "radius": null
      });

      _blob_centroid.style = {
        "fillColor": null,
        "locked": true
      }
      _blob_group.addChild(_blob_centroid);

      let _blob_txt = new paper.PointText({
        "name": "blob-txt",
        "point": null,
        "content": sysExMsg[BLOB_UID_INDEX],
      });

      _blob_txt.style = {
        "fillColor": "black",
        "fontSize": FONT_SIZE / 1.5,
        "locked": true
      };
      _blob_group.addChild(_blob_txt);

      /*
      let _blob_path = new paper.Path({
        "name": "blob-path",
        "segments": [],
        "closed": false
      });

      _blob_path.style = {
        "strokeWidth": 1,
        "strokeColor": "black",
        "strokeCap": "round",
        "strokeJoin": "round",
        "locked": true
      }
      _blob_group.addChild(_blob_path);
      */

      this.addChild(_blob_group);
    },

    present: function () {
      this.children["blob-group"].children["blob-centroid"].style.fillColor = 'green';
    },

    missing: function () {
      this.children["blob-group"].children["blob-centroid"].style.fillColor = 'red';
    },
    
    relesed: function () {
      this.removeChildren();
    },

    update: function (sysExMsg) {

      let centroid = new paper.Point(
        mapp((sysExMsg[2] + (sysExMsg[3] / 100)), 0, NEW_COLS, 0, canvas_width),
        mapp((sysExMsg[4] + (sysExMsg[5] / 100)), 0, NEW_ROWS, 0, canvas_height)
      );
      
      this.children["blob-group"].children["blob-centroid"].position = centroid;
      this.children["blob-group"].children["blob-centroid"].radius = sysExMsg[BLOB_DEPTH_INDEX];

      let blob_width = Math.round(mapp(sysExMsg[BLOB_WIDTH_INDEX], 0, NEW_COLS, 0, canvas_width));
      let blob_height = Math.round(mapp(sysExMsg[BLOB_HEIGHT_INDEX], 0, NEW_ROWS, 0, canvas_height));
      //console.log("WIDTH: " + blob_width.toFixed(2), " HEIGHT: " + blob_height.toFixed(2));
      //console.log("WIDTH: " + blob_width, " HEIGHT: " + blob_height);
      
      let size = new paper.Size(blob_width, blob_height); // FIXME: boxe is not visible
      this.children["blob-group"].children["blob-box"].point = centroid;
      this.children["blob-group"].children["blob-box"].size = size; 

      this.children["blob-group"].children["blob-txt"].position = centroid;
      this.children["blob-group"].children["blob-txt"].content = 
        "UID: " + sysExMsg[BLOB_UID_INDEX] +
        "\nX: " + centroid.x.toFixed(2) +
        "\nY: " + centroid.y.toFixed(2) +
        "\nZ: " + sysExMsg[8];

      //this.children["blob-group"].children["blob-path"].segments.push(centroid); // FIXME!      
      //this.path.smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
      //this.path.smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth

      this.children["blob-group"].bringToFront();
    }

  });
  return _blob;
};

function blobs_factory() {

  var _blobs_array = new paper.Group({
    "blobs_array": [],
    
    update(sysExMsg) {

      let index = this.blobs_array.findIndex((blob) => blob.UID === sysExMsg[BLOB_UID_INDEX]);

      if (index === -1) {
        if (sysExMsg[BLOB_STATUS_INDEX] === BLOB_NEW) {
          let new_blob = blob_factory();
          new_blob.create(sysExMsg);
          new_blob.present();
          this.blobs_array.push(new_blob);
          //console.log("BLOB_NEW: " + sysExMsg[BLOB_UID_INDEX]);
        }
      }
      else {
        if (sysExMsg[BLOB_STATUS_INDEX] === BLOB_MISSING && sysExMsg[BLOB_LAST_STATUS_INDEX] === BLOB_PRESENT) {
          this.blobs_array[index].missing();
          //console.log("BLOB_IS_MISSING: " + sysExMsg[BLOB_UID_INDEX]);
        }
        else if (sysExMsg[BLOB_STATUS_INDEX] === BLOB_PRESENT && sysExMsg[BLOB_LAST_STATUS_INDEX] === BLOB_MISSING) {
          this.blobs_array[index].present();
          //console.log("BLOB_IS_BACK: " + sysExMsg[BLOB_UID_INDEX]);
        }
        else if (sysExMsg[BLOB_STATUS_INDEX] === BLOB_FREE) {
          this.blobs_array[index].relesed();
          this.blobs_array.splice(index, 1);
          //console.log("BLOB_SI_FREE: " + sysExMsg[BLOB_UID_INDEX]);
        }
        else {
          this.blobs_array[index].update(sysExMsg);
          //console.log("BLOB_UPDATE: " + sysExMsg[BLOB_UID_INDEX]);
        }
      }
    }

  });
  return _blobs_array;
};

var e256_blobs = blobs_factory();