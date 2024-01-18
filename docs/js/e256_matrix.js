/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function Matrix(width, height) {
  this.matrix = [width * height];
  for (let i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = 0;
  }
}

Matrix.prototype.update = function (sysExMsg) {
  for (let i = 0; i < RAW_FRAME; i++) {
    this.matrix[i] = sysExMsg[i + 1] / 10;
  }
}

Matrix.prototype.getZ = function (index) {
  let val = this.matrix[index];
  if (val != null) {
    return val;
  }
  else {
    return 0;
  }
}

var e256_matrix = new Matrix(RAW_COLS, RAW_ROWS);
