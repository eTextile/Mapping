
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

const major      = [0, 4, 7];
const minor      = [0, 3, 7];
const diminished = [0, 3, 6];
const augmented  = [0, 4, 8];
const maj7       = [0, 4, 7, 11];
const min7       = [0, 3, 7, 10];
const dom7       = [0, 4, 7, 10];
const sus2       = [0, 2, 7];
const sus4       = [0, 5, 7];

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
