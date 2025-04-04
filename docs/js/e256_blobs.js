/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/


const BLOB_UID = 1;
//..
const BLOB_WIDTH = 6;
const BLOB_HEIGHT = 7;
const BLOB_DEPTH = 8;
const BLOB_STATUS = 9;
const BLOB_LAST_STATUS = 10;

function blob_factory() {

  const DEFAULT_PATH_STROKE_WIDTH = 2;
  const DEFAULT_TOUCH_RADIUS = 10;

  var _blob = new paper.Group({
    "UID": null,

    create: function (sysExMsg) {

      this.UID = sysExMsg[BLOB_UID];

      let _blob_group = new paper.Group({
        "name": "blob-group"
      });
     
      /*
      let _blob_rect = new paper.Path.Rectangle({
        "name": "blob-box",
        "point": null,
        "size": null
      });

      _blob_rect.style = {
        //"fillColor": "black",
        "strokeWidth": 1,
        "strokeColor": "black",
        "locked": true
      }
      _blob_group.addChild(_blob_rect);
      */

      let _blob_centroid = new paper.Shape.Ellipse({
        "name": "blob-centroid",
        "center": null,
        "radius": null
      });

      _blob_centroid.style = {
        "fillColor": "red",
        "locked": true
      }
      _blob_group.addChild(_blob_centroid);

      let _blob_txt = new paper.PointText({
        "name": "blob-txt",
        "point": null,
        "content": sysExMsg[BLOB_UID],
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
        "strokeWidth": DEFAULT_PATH_STROKE_WIDTH,
        "strokeColor": "black",
        "strokeCap": "round",
        "strokeJoin": "round",
        "locked": true
      }
      _blob_group.addChild(_blob_path);
      */

      this.addChild(_blob_group);
    },

    update: function (sysExMsg) {

      let centroid = new paper.Point(
        mapp((sysExMsg[2] + sysExMsg[3] / 100), 0, 64, 0, canvas_width),
        mapp((sysExMsg[4] + sysExMsg[5] / 100), 0, 64, 0, canvas_height)
      );
      let blob_width = mapp(sysExMsg[BLOB_WIDTH], 0, 64, 0, canvas_width);
      let blob_height = mapp(sysExMsg[BLOB_HEIGHT], 0, 64, 0, canvas_height);

      //console.log("WIDTH: " + blob_width.toFixed(2), " HEIGHT: " + blob_height.toFixed(2));

      this.children["blob-group"].children["blob-centroid"].position = centroid;
      this.children["blob-group"].children["blob-centroid"].radius = sysExMsg[BLOB_DEPTH];

      let size = new paper.Size(blob_width, blob_height);

      //this.children["blob-group"].children["blob-box"].position = centroid;
      //this.children["blob-group"].children["blob-box"].size = size;

      this.children["blob-group"].children["blob-txt"].position = centroid;
      this.children["blob-group"].children["blob-txt"].content = "UID: " + sysExMsg[BLOB_UID] + "\nX: " + centroid.x.toFixed(2) + "\nY: " + centroid.y.toFixed(2);

      //this.children["blob-group"].children["blob-path"].segments.push(centroid); // FIXME!      
      //this.path.smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
      //this.path.smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth

      this.bringToFront();
    }
    
  });
  return _blob;
};
