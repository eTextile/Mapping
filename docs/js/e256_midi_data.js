
const NOTE_NAMES = ['C', 'Cd', 'D', 'Dd', 'E', 'F', 'Fd', 'G', 'Gd', 'A', 'Ad', 'B'];

const NOTES = {};

for (let midi = 0; midi <= 127; midi++) {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];

  const key = `${name}${octave}`;
  NOTES[key] = midi;
}

const midi_note_name = Array.from({ length: 128 }, (_, midi) => {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
});

const CHORD_TYPES = {
  1: major,
  2: minor,
  3: diminished,
  4: augmented,
  5: maj7,
  6: min7,
  7: dom7,
  8: sus2,
  9: sus4
};
