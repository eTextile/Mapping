/*
  **Mapping-app V0.1**
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var currentMode = EDIT_MODE;
var e256_drawMode = null;

window.onload = function () {

  console.log("CurrentMode: " + currentMode);
  $(".btn").addClass("shadow-none");
  $(".input-group").addClass("input-group-sm");
  $(".form-control").addClass("shadow-none");
  $(".btn-group").addClass("btn-group-sm");
  $(".btn").addClass("btn-sm");
  $(".btn-group > .btn").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
  });

  $(".e256_setMode").click(function (event) {
    e256_setMode(event.target.id);
  });

  $("#calibrate").on("click", function () {
    calibrate();
    $("#summaryAction").html("CALIBRATED").removeClass("badge-danger").addClass("badge-success");
  });
  
  $("#getConfig").click(function () {
    // TODO
  });

  $("#loadConfigFile").change(function (event) {
    loadFile(event);
  });

  $("#setConfig").click(function () {
    setConfig();
  });

  $(".mapingTool").click(function (event) {
    $(".param").collapse("hide");
    e256_drawMode = event.target.id;
    console.log("e256_drawMode: " + e256_drawMode);
  });

  // Update item parameters using the txt input fields
  $(".btnSet").click(function (event) {
    updateParams(event.target.id);
  });

  function e256_setMode(event) {
    switch (event) {
      case "matrixMode":
        currentMode = MATRIX_MODE_RAW;
        //currentMode = MATRIX_MODE_INTERP; // TODO
        $("#calibrateMenu").collapse("show");
        $("#mappingMenu").collapse("hide");
        $("#mappingCanvas").collapse("hide");
        $("#matrixMenu").collapse("show");
        $("#matrixCanvas").collapse("show");
        $("#summaryAction").html("3D-VISUALISATION").removeClass("badge-danger").addClass("badge-success");
        $("#summaryContent").html("This 3D visualisation is made to check all the eTextile matrix piezoresistive pressure sensors");
        $(".param").collapse("hide");
        break;
      case "mappingMode":
        // Look if there is loaded CONFIG file in the ETEXTILE_SYNTH
        currentMode = GET_CONFIG;
        $("#calibrateMenu").collapse("show");
        $("#matrixMenu").collapse("hide");
        $("#matrixCanvas").collapse("hide");
        $("#mappingMenu").collapse("show");
        $("#mappingCanvas").collapse("show");
        $("#summaryAction").html("2D MAPPING-APP").removeClass("badge-danger").addClass("badge-success");
        $("#summaryContent").html("This 2D graphic user interface is made to draw your own eTextile custom interfaces!");
        $(".param").collapse("hide");
        break;
      case "editMode":
        currentMode = EDIT_MODE;
        $("#editMenu").collapse("show");
        $("#playMenu").collapse("hide");
        $("#loadMenu").collapse("hide");
        $("#summaryAction").html("EDIT-MODE").removeClass("badge-danger").addClass("badge-success");
        $("#summaryContent").html("Add new components");
        break;
      case "playMode":
        currentMode = PLAY_MODE;
        $("#editMenu").collapse("hide");
        $("#playMenu").collapse("show");
        $("#loadMenu").collapse("show");
        $("#summaryAction").html("PLAY-MODE").removeClass("badge-danger").addClass("badge-success");
        $("#summaryContent").html("Evaluate what you have made");
        $(".param").collapse("hide");
        break;
    }
    programChange(currentMode, CHAN1);
  }
}