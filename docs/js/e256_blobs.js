/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function Blob(id, x, y, z, w, h) {
  this.uid = id;
  this.touch.x = x;
  this.touch.y = y;
  this.touch.z = z;
  this.touch.w = w;
  this.touch.h = h;
  this.path = [];

  let blob_touch = new paper.Path.Circle({
    "name": "blob-touch",
    "center": new paper.Point(this.x, this.y),
    "radius": this.z
  });
  blob_touch.style = {
    "fillColor": "red"
  }
  this.add(blob_touch);

  let blob_path = new paper.Path({
    "name": "blob-path",
  });
  blob_path.style = {
    "strokeColor": "balck"
  }
  this.add(blob_path);
}

Blob.prototype.update = function (sysExMsg) {
  this.touch.x = sysExMsg[2] * scale_factor;
  this.touch.y = sysExMsg[3] * scale_factor;
  this.touch.z = sysExMsg[4];
  this.touch.w = sysExMsg[5] * scale_factor;
  this.touch.h = sysExMsg[6] * scale_factor;
  this.path.add(new paper.Point(this.touch.x, this.touch.y));
  //this.path.smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
  //this.path.smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth
}

Blob.prototype.print = function () {
  console.log(
    "ID:" + this.uid +
    " X:" + this.touch.x +
    " Y:" + this.touch.y +
    " Z:" + this.touch.z +
    " W:" + this.touch.w +
    " H:" + this.touch.h
  );
}

// Blobs array management
function Blobs() {
  this.blobs = [];
}

Blobs.prototype.add = function (noteOn) {
  if (this.blobs.findIndex(blob => blob.uid === noteOn[1]) === -1) {
    this.blobs.push(new Blob(noteOn[1], 0, 0, 0, 0, 0));
  } else {
    console.log("BLOB_ADD / EXISTING: " + noteOn[1]);
    return;
  }
}

Blobs.prototype.remove = function (noteOff) {
  let index = this.blobs.findIndex(blob => blob.uid === noteOff[1]);
  if (index !== -1) {
    this.blobs.splice(index, 1);
    //blob_touch_array[index].remove();
    //blob_touch_array.splice(index, 1);
    //blob_path_array[index].remove();
    //blob_path_array.splice(index, 1);
  } else {
    console.log("BLOB_REMOVE / NOT_FOUND: " + noteOff[1]);
    return;
  }
}

Blobs.prototype.update = function (sysExMsg) {
  let index = this.blobs.findIndex(blob => blob.uid === sysExMsg[1]);
  if (index !== -1) {
    this.blobs[index].update(sysExMsg);
  } else {
    console.log("BLOB_UPDATE / NOT_FOUND: " + sysExMsg[1]);
    return;
  }
}

/*
Blobs.prototype.get = function (index) {
  return this.blobs[index];
}
*/

/*
Blobs.prototype.size = function () {
  return this.blobs.length;
}
*/

e256_blobs = new Blobs();
