# Mapping Toolkit web app
### This web app is made for combining graphic & audio modules built inside the eTextile-Synthesizer.

This **Mapping Toolkit** is made to create the mapping between the textile graphic patterns and the builtin audio-synthesizer or any external MIDI device. It offers a library of geometric shapes which are tactile input controls like sliders, switches, etc.

Starting from the textile design paterns placed on top of the matrix sensor, this application is using the sensor values to define and adjust the tactile input controls in relation with the textile graphic patterns.

## Web Application

    https://mapping.etextile.org/ (load using chrome!)

## Functionalities
- Create custom graphic user interface for the eTextile-Synthesizer
  - Add graphics components with interactive bihavious.
  - define the MIDI commands (channes, notes, ...) of each graphic components according to the built in or external MIDI synthesizer.
- Upload your created GUI and MIDI parameters to the eTextile-Synthesizer.
- If you are satisfied, save it to the eTextile-Synthesizer permanent memory.

## Repository

    https://github.com/eTextile/Mapping

## Technicals specifications
The e256 eTextile-Synthesizer is connected to the MAPPING_TOOLKIT web app via the webMIDI API.
    https://www.w3.org/TR/webmidi/
    https://webaudio.github.io/web-midi-api/

## TODO

