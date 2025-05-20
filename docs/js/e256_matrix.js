/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014- Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

function matrix_factory() {

  var _e256_matrix = new paper.Group({
    "matrix": [],

    update: function (sysExMsg) {
      for (let i = 0; i < RAW_FRAME; i++) {
        this.matrix[i] = sysExMsg[i + 1] / 10;
      }
    },

    getZ: function (index) {
      let val = this.matrix[index];
      if (val != null) {
        return -val;
      }
      else {
        return 0;
      }
    }

  });
  return _e256_matrix;
};

var e256_matrix = new matrix_factory();
