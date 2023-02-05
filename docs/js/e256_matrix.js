/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2023 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function Matrix(width, height) {
  this.matrix = [width * height];
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = 0;
  }
}
Matrix.prototype.update = function (sysExMsg) {
  for (var i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = sysExMsg[i + 1] / 10;
  }
}
Matrix.prototype.getZ = function (index) {
  var val = this.matrix[index];
  if (val != null) {
    return val;
  }
  else {
    return 0;
  }
}

let e256_matrix = new Matrix(RAW_COLS, RAW_ROWS);
