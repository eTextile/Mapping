/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

let blobTouch = [];
let blobPath = [];
let blobPathSmooth = [];

function onBlobDown() {
  let blob_circle = new paper.Path.Circle({
    center: [0, 0], // TODO! new paper.Point();
    radius: 10,
  });
  blob_circle.style = {
    "fillColor": "red"
  }
  blobTouch.push(blob_circle);
  path = new paper.Path();
  path.strokeColor = "#00000";
  blobPath.push(path);
}

function onBlobUpdate(event) {
  let blob = new Blob;
  blob = e256_blobs.get(event);
  let pos = new paper.Point(blob.x * scaleFactor, blob.y * scaleFactor);
  blobTouch[event].position = pos;
  //blobTouch[event].radius = blob.z; // FIXME!
  blobPath[event].add(pos);
  //blobPathSmooth[event].smoothCatmullRom(0.5, 10, 15); // Smooths with tension = 0.5, from segment 10 - 15
  //blobPath[event].smooth({ type: 'continuous' }); // http://paperjs.org/reference/path/#smooth
}

function onBlobRelease(event) {
  blobTouch[event].remove();
  blobTouch.splice(event, 1);
  blobPath[event].remove();
  blobPath.splice(event, 1);
}

function Blob(id, x, y, z, w, h) {
  this.uid = id;
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  this.h = h;
}

Blob.prototype.update = function (sysExMsg) {
  this.x = sysExMsg[2];
  this.y = sysExMsg[3];
  this.z = sysExMsg[4];
  this.w = sysExMsg[5];
  this.h = sysExMsg[6];
}

Blob.prototype.print = function () {
  console.log(
    `ID:` + this.uid +
    ` X:` + this.x +
    ` Y:` + this.y +
    ` Z:` + this.z +
    ` W:` + this.w +
    ` H:` + this.h
  );
}

// Blobs array management
function Blobs() {
  this.blobs = [];
}

Blobs.prototype.add = function (noteOn, callback) {
  if (this.blobs.findIndex(blob => blob.uid == noteOn[1]) == -1) {
    var blob = new Blob(noteOn[1], 0, 0, 0, 0, 0);
    this.blobs.push(blob);
    callback();
  } else {
    console.log("BLOB_EXIST: " + noteOn[1]);
    return;
  }
}

Blobs.prototype.remove = function (noteOff, callback) {
  let index = this.blobs.findIndex(blob => blob.uid == noteOff[1]);
  if (index !== -1) {
    this.blobs.splice(index, 1);
    callback(index);
  } else {
    console.log("BLOB_NOT_FOUND_REMOVE: " + noteOff[1]);
    return;
  }
}

Blobs.prototype.update = function (sysExMsg, callback) {
  let index = this.blobs.findIndex(blob => blob.uid == sysExMsg[1]);
  if (index != -1) {
    this.blobs[index].update(sysExMsg);
    callback(index);
  } else {
    console.log("BLOB_NOT_FOUND_UPDATE: " + sysExMsg[1]);
    return;
  }
}

Blobs.prototype.get = function (index) {
  return this.blobs[index];
}

Blobs.prototype.size = function () {
  return this.blobs.length;
}

e256_blobs = new Blobs();
