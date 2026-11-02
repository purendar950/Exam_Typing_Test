/**
 * Hindi Transliteration & Normalization Engine
 * Supports Mangal (Inscript layout) and Kruti Dev 010 (Remington layout)
 * Integrated with reverse-engineered Unicode NFKC Nukta normalizer.
 */

export interface KeyMapping {
  normal: string;
  shift: string;
  enNormal: string;
  enShift: string;
  finger: 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';
}

/**
 * Standard Mangal Inscript Keyboard Definition by Physical Key Code (QWERTY)
 * Matches the official CDAC / BIS Inscript specification and user diagram.
 */
export const MANGAL_INSCRIPT_KEYS: Record<string, KeyMapping> = {
  // Row 0 - Numbers
  Backquote:    { normal: 'ॊ', shift: 'ऒ', enNormal: '`', enShift: '~', finger: 'left-pinky' },
  Digit1:       { normal: '1', shift: 'ऍ', enNormal: '1', enShift: '!', finger: 'left-pinky' },
  Digit2:       { normal: '2', shift: 'ॅ', enNormal: '2', enShift: '@', finger: 'left-ring' },
  Digit3:       { normal: '3', shift: '्र', enNormal: '3', enShift: '#', finger: 'left-middle' },
  Digit4:       { normal: '4', shift: 'र्', enNormal: '4', enShift: '$', finger: 'left-index' },
  Digit5:       { normal: '5', shift: 'ज्ञ', enNormal: '5', enShift: '%', finger: 'left-index' },
  Digit6:       { normal: '6', shift: 'त्र', enNormal: '6', enShift: '^', finger: 'right-index' },
  Digit7:       { normal: '7', shift: 'क्ष', enNormal: '7', enShift: '&', finger: 'right-index' },
  Digit8:       { normal: '8', shift: 'श्र', enNormal: '8', enShift: '*', finger: 'right-middle' },
  Digit9:       { normal: '9', shift: '(', enNormal: '9', enShift: '(', finger: 'right-middle' },
  Digit0:       { normal: '0', shift: ')', enNormal: '0', enShift: ')', finger: 'right-ring' },
  Minus:        { normal: '-', shift: 'ः', enNormal: '-', enShift: '_', finger: 'right-pinky' },
  Equal:        { normal: 'ृ', shift: 'ऋ', enNormal: '=', enShift: '+', finger: 'right-pinky' },

  // Row 1 - QWERTY
  KeyQ:         { normal: 'ौ', shift: 'औ', enNormal: 'q', enShift: 'Q', finger: 'left-pinky' },
  KeyW:         { normal: 'ै', shift: 'ऐ', enNormal: 'w', enShift: 'W', finger: 'left-ring' },
  KeyE:         { normal: 'ा', shift: 'आ', enNormal: 'e', enShift: 'E', finger: 'left-middle' },
  KeyR:         { normal: 'ी', shift: 'ई', enNormal: 'r', enShift: 'R', finger: 'left-index' },
  KeyT:         { normal: 'ू', shift: 'ऊ', enNormal: 't', enShift: 'T', finger: 'left-index' },
  KeyY:         { normal: 'ब', shift: 'भ', enNormal: 'y', enShift: 'Y', finger: 'right-index' },
  KeyU:         { normal: 'ह', shift: 'ङ', enNormal: 'u', enShift: 'U', finger: 'right-index' },
  KeyI:         { normal: 'ग', shift: 'घ', enNormal: 'i', enShift: 'I', finger: 'right-middle' },
  KeyO:         { normal: 'द', shift: 'ध', enNormal: 'o', enShift: 'O', finger: 'right-ring' },
  KeyP:         { normal: 'ज', shift: 'झ', enNormal: 'p', enShift: 'P', finger: 'right-pinky' },
  BracketLeft:  { normal: 'ड', shift: 'ढ', enNormal: '[', enShift: '{', finger: 'right-pinky' },
  BracketRight: { normal: '़', shift: 'ञ', enNormal: ']', enShift: '}', finger: 'right-pinky' },
  Backslash:    { normal: 'ॉ', shift: 'ऑ', enNormal: '\\', enShift: '|', finger: 'right-pinky' },

  // Row 2 - Home Row
  KeyA:         { normal: 'ो', shift: 'ओ', enNormal: 'a', enShift: 'A', finger: 'left-pinky' },
  KeyS:         { normal: 'े', shift: 'ए', enNormal: 's', enShift: 'S', finger: 'left-ring' },
  KeyD:         { normal: '्', shift: 'अ', enNormal: 'd', enShift: 'D', finger: 'left-middle' },
  KeyF:         { normal: 'ि', shift: 'इ', enNormal: 'f', enShift: 'F', finger: 'left-index' },
  KeyG:         { normal: 'ु', shift: 'उ', enNormal: 'g', enShift: 'G', finger: 'left-index' },
  KeyH:         { normal: 'प', shift: 'फ', enNormal: 'h', enShift: 'H', finger: 'right-index' },
  KeyJ:         { normal: 'र', shift: 'ऱ', enNormal: 'j', enShift: 'J', finger: 'right-index' },
  KeyK:         { normal: 'क', shift: 'ख', enNormal: 'k', enShift: 'K', finger: 'right-middle' },
  KeyL:         { normal: 'त', shift: 'थ', enNormal: 'l', enShift: 'L', finger: 'right-ring' },
  Semicolon:    { normal: 'च', shift: 'छ', enNormal: ';', enShift: ':', finger: 'right-pinky' },
  Quote:        { normal: 'ट', shift: 'ठ', enNormal: "'", enShift: '"', finger: 'right-pinky' },

  // Row 3 - Bottom Row
  KeyZ:         { normal: 'ॆ', shift: 'ऎ', enNormal: 'z', enShift: 'Z', finger: 'left-pinky' },
  KeyX:         { normal: 'ं', shift: 'ँ', enNormal: 'x', enShift: 'X', finger: 'left-ring' },
  KeyC:         { normal: 'म', shift: 'ण', enNormal: 'c', enShift: 'C', finger: 'left-middle' },
  KeyV:         { normal: 'न', shift: 'ऩ', enNormal: 'v', enShift: 'V', finger: 'left-index' },
  KeyB:         { normal: 'व', shift: 'ऴ', enNormal: 'b', enShift: 'B', finger: 'left-index' },
  KeyN:         { normal: 'ल', shift: 'ळ', enNormal: 'n', enShift: 'N', finger: 'right-index' },
  KeyM:         { normal: 'स', shift: 'श', enNormal: 'm', enShift: 'M', finger: 'right-index' },
  Comma:        { normal: ',', shift: 'ष', enNormal: ',', enShift: '<', finger: 'right-middle' },
  Period:       { normal: '.', shift: '।', enNormal: '.', enShift: '>', finger: 'right-ring' },
  Slash:        { normal: 'य', shift: '?', enNormal: '/', enShift: '?', finger: 'right-pinky' },
  Space:        { normal: ' ', shift: ' ', enNormal: ' ', enShift: ' ', finger: 'thumb' }
};

/**
 * Kruti Dev 010 (Remington Gail) Keyboard Definition by Physical Key Code
 */
export const KRUTI_DEV_KEYS: Record<string, KeyMapping> = {
  // Row 0 - Numbers
  Backquote:    { normal: '`', shift: '~', enNormal: '`', enShift: '~', finger: 'left-pinky' },
  Digit1:       { normal: '1', shift: 'त्', enNormal: '1', enShift: '!', finger: 'left-pinky' },
  Digit2:       { normal: '2', shift: '्र', enNormal: '2', enShift: '@', finger: 'left-ring' },
  Digit3:       { normal: '3', shift: 'र्', enNormal: '3', enShift: '#', finger: 'left-middle' },
  Digit4:       { normal: '4', shift: '+', enNormal: '4', enShift: '$', finger: 'left-index' },
  Digit5:       { normal: '5', shift: ':', enNormal: '5', enShift: '%', finger: 'left-index' },
  Digit6:       { normal: '6', shift: '‘', enNormal: '6', enShift: '^', finger: 'right-index' },
  Digit7:       { normal: '7', shift: '’', enNormal: '7', enShift: '&', finger: 'right-index' },
  Digit8:       { normal: '8', shift: '“', enNormal: '8', enShift: '*', finger: 'right-middle' },
  Digit9:       { normal: '9', shift: '”', enNormal: '9', enShift: '(', finger: 'right-middle' },
  Digit0:       { normal: '0', shift: 'ऋ', enNormal: '0', enShift: ')', finger: 'right-ring' },
  Minus:        { normal: '-', shift: 'ः', enNormal: '-', enShift: '_', finger: 'right-pinky' },
  Equal:        { normal: 'ृ', shift: 'ऋ', enNormal: '=', enShift: '+', finger: 'right-pinky' },

  // Row 1 - QWERTY
  KeyQ:         { normal: 'ु', shift: 'फ', enNormal: 'q', enShift: 'Q', finger: 'left-pinky' },
  KeyW:         { normal: 'ू', shift: 'ॅ', enNormal: 'w', enShift: 'W', finger: 'left-ring' },
  KeyE:         { normal: 'म', shift: 'म्', enNormal: 'e', enShift: 'E', finger: 'left-middle' },
  KeyR:         { normal: 'त', shift: 'त्', enNormal: 'r', enShift: 'R', finger: 'left-index' },
  KeyT:         { normal: 'ज', shift: 'ज्', enNormal: 't', enShift: 'T', finger: 'left-index' },
  KeyY:         { normal: 'ल', shift: 'ल्', enNormal: 'y', enShift: 'Y', finger: 'right-index' },
  KeyU:         { normal: 'न', shift: 'न्', enNormal: 'u', enShift: 'U', finger: 'right-index' },
  KeyI:         { normal: 'प', shift: 'प्', enNormal: 'i', enShift: 'I', finger: 'right-middle' },
  KeyO:         { normal: 'व', shift: 'व्', enNormal: 'o', enShift: 'O', finger: 'right-ring' },
  KeyP:         { normal: 'च', shift: 'च्', enNormal: 'p', enShift: 'P', finger: 'right-pinky' },
  BracketLeft:  { normal: 'ख्', shift: 'क्ष', enNormal: '[', enShift: '{', finger: 'right-pinky' },
  BracketRight: { normal: ',', shift: ')', enNormal: ']', enShift: '}', finger: 'right-pinky' },
  Backslash:    { normal: '.', shift: '(', enNormal: '\\', enShift: '|', finger: 'right-pinky' },

  // Row 2 - Home Row
  KeyA:         { normal: 'ं', shift: 'ँ', enNormal: 'a', enShift: 'A', finger: 'left-pinky' },
  KeyS:         { normal: 'े', shift: 'ै', enNormal: 's', enShift: 'S', finger: 'left-ring' },
  KeyD:         { normal: 'क', shift: 'क्', enNormal: 'd', enShift: 'D', finger: 'left-middle' },
  KeyF:         { normal: 'ि', shift: 'थ्', enNormal: 'f', enShift: 'F', finger: 'left-index' },
  KeyG:         { normal: 'ह', shift: 'भ', enNormal: 'g', enShift: 'G', finger: 'left-index' },
  KeyH:         { normal: 'ी', shift: 'भ्', enNormal: 'h', enShift: 'H', finger: 'right-index' },
  KeyJ:         { normal: 'र', shift: 'श्र', enNormal: 'j', enShift: 'J', finger: 'right-index' },
  KeyK:         { normal: 'ा', shift: 'ज्ञ', enNormal: 'k', enShift: 'K', finger: 'right-middle' },
  KeyL:         { normal: 'स', shift: 'स्', enNormal: 'l', enShift: 'L', finger: 'right-ring' },
  Semicolon:    { normal: 'य', shift: 'रू', enNormal: ';', enShift: ':', finger: 'right-pinky' },
  Quote:        { normal: 'श', shift: 'ष्', enNormal: "'", enShift: '"', finger: 'right-pinky' },

  // Row 3 - Bottom Row
  KeyZ:         { normal: '्र', shift: 'र्', enNormal: 'z', enShift: 'Z', finger: 'left-pinky' },
  KeyX:         { normal: 'ग', shift: 'ग्', enNormal: 'x', enShift: 'X', finger: 'left-ring' },
  KeyC:         { normal: 'ब', shift: 'ब्', enNormal: 'c', enShift: 'C', finger: 'left-middle' },
  KeyV:         { normal: 'अ', shift: 'ट', enNormal: 'v', enShift: 'V', finger: 'left-index' },
  KeyB:         { normal: 'इ', shift: 'ठ', enNormal: 'b', enShift: 'B', finger: 'left-index' },
  KeyN:         { normal: 'द', shift: 'छ', enNormal: 'n', enShift: 'N', finger: 'right-index' },
  KeyM:         { normal: 'उ', shift: 'ड', enNormal: 'm', enShift: 'M', finger: 'right-index' },
  Comma:        { normal: 'ए', shift: 'ढ', enNormal: ',', enShift: '<', finger: 'right-middle' },
  Period:       { normal: 'ण्', shift: 'झ', enNormal: '.', enShift: '>', finger: 'right-ring' },
  Slash:        { normal: 'ध', shift: 'घ', enNormal: '/', enShift: '?', finger: 'right-pinky' },
  Space:        { normal: ' ', shift: ' ', enNormal: ' ', enShift: ' ', finger: 'thumb' }
};

// Fast lookup tables by character / key string
const INSCRIPT_LOOKUP_NORMAL: Record<string, string> = {};
const INSCRIPT_LOOKUP_SHIFT: Record<string, string> = {};
const KRUTI_LOOKUP_NORMAL: Record<string, string> = {};
const KRUTI_LOOKUP_SHIFT: Record<string, string> = {};

Object.values(MANGAL_INSCRIPT_KEYS).forEach((item) => {
  INSCRIPT_LOOKUP_NORMAL[item.enNormal] = item.normal;
  INSCRIPT_LOOKUP_SHIFT[item.enShift] = item.shift;
  INSCRIPT_LOOKUP_SHIFT[item.enNormal] = item.shift; // In case shiftKey is true but key is lowercase
});

Object.values(KRUTI_DEV_KEYS).forEach((item) => {
  KRUTI_LOOKUP_NORMAL[item.enNormal] = item.normal;
  KRUTI_LOOKUP_SHIFT[item.enShift] = item.shift;
  KRUTI_LOOKUP_SHIFT[item.enNormal] = item.shift;
});

/**
 * Translates a physical keystroke to Mangal Inscript Unicode character.
 * Supports physical event code, key string, and shift state.
 */
export function translateToMangalInscript(key: string, isShift: boolean, code?: string): string {
  // If key is already Devanagari (e.g. native OS Hindi keyboard active), keep it
  if (key && /^[\u0900-\u097F]$/.test(key)) {
    return key;
  }

  // Preserve whitespace
  if (key === ' ' || code === 'Space') {
    return ' ';
  }

  // 1. Prioritize physical key code (independent of OS locale or Shift symbol quirks)
  if (code && MANGAL_INSCRIPT_KEYS[code]) {
    return isShift ? MANGAL_INSCRIPT_KEYS[code].shift : MANGAL_INSCRIPT_KEYS[code].normal;
  }

  // 2. Direct lookup by key character
  if (isShift) {
    if (INSCRIPT_LOOKUP_SHIFT[key]) return INSCRIPT_LOOKUP_SHIFT[key];
    const lower = key.toLowerCase();
    if (INSCRIPT_LOOKUP_SHIFT[lower]) return INSCRIPT_LOOKUP_SHIFT[lower];
  } else {
    if (INSCRIPT_LOOKUP_NORMAL[key]) return INSCRIPT_LOOKUP_NORMAL[key];
    const lower = key.toLowerCase();
    if (INSCRIPT_LOOKUP_NORMAL[lower]) return INSCRIPT_LOOKUP_NORMAL[lower];
  }

  return key;
}

/**
 * Translates a keystroke to Kruti Dev 010 (Remington Gail) character
 */
export function translateToKrutiDev(key: string, isShift: boolean, code?: string): string {
  if (key && /^[\u0900-\u097F]$/.test(key)) {
    return key;
  }

  if (key === ' ' || code === 'Space') {
    return ' ';
  }

  if (code && KRUTI_DEV_KEYS[code]) {
    return isShift ? KRUTI_DEV_KEYS[code].shift : KRUTI_DEV_KEYS[code].normal;
  }

  if (isShift) {
    if (KRUTI_LOOKUP_SHIFT[key]) return KRUTI_LOOKUP_SHIFT[key];
    const lower = key.toLowerCase();
    if (KRUTI_LOOKUP_SHIFT[lower]) return KRUTI_LOOKUP_SHIFT[lower];
  } else {
    if (KRUTI_LOOKUP_NORMAL[key]) return KRUTI_LOOKUP_NORMAL[key];
    const lower = key.toLowerCase();
    if (KRUTI_LOOKUP_NORMAL[lower]) return KRUTI_LOOKUP_NORMAL[lower];
  }

  return key;
}

/**
 * Alt Codes table for UP Police Typing Exams
 * Directly extracted from the official candidate reference guide.
 */
export interface AltCodeItem {
  code: string;
  char: string;
  name: string;
  category: 'mangal' | 'kruti' | 'common';
}

export const OFFICIAL_ALT_CODES: AltCodeItem[] = [
  // Mangal / General Alt Codes
  { code: 'Alt + 033', char: '!', name: 'Exclamation Mark', category: 'common' },
  { code: 'Alt + 034', char: '"', name: 'Double Quote', category: 'common' },
  { code: 'Alt + 035', char: '#', name: 'Hash Symbol', category: 'common' },
  { code: 'Alt + 036', char: '$', name: 'Dollar Symbol', category: 'common' },
  { code: 'Alt + 037', char: '%', name: 'Percent Sign', category: 'common' },
  { code: 'Alt + 038', char: '&', name: 'Ampersand', category: 'common' },
  { code: 'Alt + 039', char: "'", name: 'Apostrophe', category: 'common' },
  { code: 'Alt + 040', char: '(', name: 'Left Parenthesis', category: 'common' },
  { code: 'Alt + 041', char: ')', name: 'Right Parenthesis', category: 'common' },
  { code: 'Alt + 042', char: '*', name: 'Asterisk', category: 'common' },
  { code: 'Alt + 043', char: '+', name: 'Plus Sign', category: 'common' },
  { code: 'Alt + 044', char: ',', name: 'Comma', category: 'common' },
  { code: 'Alt + 045', char: '-', name: 'Hyphen / Dash', category: 'common' },
  { code: 'Alt + 046', char: '.', name: 'Period / Dot', category: 'common' },
  { code: 'Alt + 047', char: '/', name: 'Slash', category: 'common' },
  { code: 'Alt + 058', char: ':', name: 'Colon', category: 'common' },
  { code: 'Alt + 059', char: ';', name: 'Semicolon', category: 'common' },
  { code: 'Alt + 060', char: '<', name: 'Less Than', category: 'common' },
  { code: 'Alt + 061', char: '=', name: 'Equals Sign', category: 'common' },
  { code: 'Alt + 062', char: '>', name: 'Greater Than', category: 'common' },
  { code: 'Alt + 063', char: '?', name: 'Question Mark', category: 'common' },
  { code: 'Alt + 064', char: '@', name: 'At Symbol', category: 'common' },
  { code: 'Alt + 091', char: '[', name: 'Left Bracket', category: 'common' },
  { code: 'Alt + 092', char: '\\', name: 'Backslash', category: 'common' },
  { code: 'Alt + 093', char: ']', name: 'Right Bracket', category: 'common' },
  { code: 'Alt + 094', char: '^', name: 'Caret', category: 'common' },
  { code: 'Alt + 095', char: '_', name: 'Underscore', category: 'common' },
  { code: 'Alt + 0123', char: '{', name: 'Left Curly Brace', category: 'common' },
  { code: 'Alt + 0124', char: '|', name: 'Pipe', category: 'common' },
  { code: 'Alt + 0125', char: '}', name: 'Right Curly Brace', category: 'common' },
  { code: 'Alt + 0145', char: '‘', name: 'Left Single Quote', category: 'common' },
  { code: 'Alt + 0146', char: '’', name: 'Right Single Quote', category: 'common' },
  { code: 'Alt + 0147', char: '“', name: 'Left Double Quote', category: 'common' },
  { code: 'Alt + 0148', char: '”', name: 'Right Double Quote', category: 'common' },
  { code: 'Alt + 0149', char: '•', name: 'Bullet Point', category: 'common' },
  { code: 'Alt + 0150', char: '–', name: 'En Dash', category: 'common' },
  { code: 'Alt + 0151', char: '—', name: 'Em Dash', category: 'common' },
  { code: 'Alt + 0152', char: '˜', name: 'Tilde', category: 'common' },
  { code: 'Alt + 0153', char: '™', name: 'Trademark', category: 'common' },
  { code: 'Alt + 0154', char: 'š', name: 'Latin Small s Caron', category: 'common' },
  { code: 'Alt + 0155', char: '›', name: 'Right Angle Quote', category: 'common' },
  { code: 'Alt + 0156', char: 'œ', name: 'Ligature oe', category: 'common' },
  { code: 'Alt + 0169', char: '©', name: 'Copyright', category: 'common' },
  { code: 'Alt + 0184', char: '¸', name: 'Cedilla', category: 'common' },
  { code: 'Alt + 0185', char: '¹', name: 'Superscript One', category: 'common' },
  { code: 'Alt + 0189', char: '½', name: 'Fraction 1/2', category: 'common' },
  { code: 'Alt + 0190', char: '¾', name: 'Fraction 3/4', category: 'common' },
  { code: 'Alt + 0215', char: '×', name: 'Multiplication Sign', category: 'common' },
  { code: 'Alt + 0216', char: 'Ø', name: 'O Stroke / Diameter', category: 'common' },
  { code: 'Alt + 0222', char: 'Þ', name: 'Thorn', category: 'common' },
  { code: 'Alt + 0223', char: 'ß', name: 'Sharp S', category: 'common' },
  { code: 'Alt + 0247', char: '÷', name: 'Division Sign', category: 'common' },

  // Kruti Dev 010 Special Conjuncts
  { code: 'Alt + 0161', char: 'द्व', name: 'द्व (द + ् + व) जैसे द्वार', category: 'kruti' },
  { code: 'Alt + 0163', char: 'ट्ट', name: 'ट्ट (ट + ् + ट) जैसे पट्टी', category: 'kruti' },
  { code: 'Alt + 0165', char: 'द्ध', name: 'द्ध (द + ् + ध) जैसे शुद्ध', category: 'kruti' },
  { code: 'Alt + 0170', char: 'द्य', name: 'द्य (द + ् + य) जैसे विद्या', category: 'kruti' },
  { code: 'Alt + 0174', char: 'क्त', name: 'क्त (क + ् + त) जैसे भक्त', category: 'kruti' },
  { code: 'Alt + 0178', char: 'ष्ठ', name: 'ष्ठ (ष + ् + ठ) जैसे पृष्ठ', category: 'kruti' },
  { code: 'Alt + 0180', char: 'ह्न', name: 'ह्न (ह + ् + न) जैसे चिन्ह', category: 'kruti' },
  { code: 'Alt + 0188', char: 'हृ', name: 'हृ (ह + ृ) जैसे हृदय', category: 'kruti' },
  { code: 'Alt + 0204', char: 'त्त', name: 'त्त (त + ् + त) जैसे उत्तर', category: 'kruti' },
  { code: 'Alt + 0205', char: 'ट्र', name: 'ट्र (ट + ्र) जैसे राष्ट्र', category: 'kruti' },
  { code: 'Alt + 0216', char: 'क्र', name: 'क्र (क + ्र) जैसे क्रम', category: 'kruti' },
  { code: 'Alt + 0221', char: 'द्द', name: 'द्द (द + ् + द) जैसे उद्देश्य', category: 'kruti' },
  { code: 'Alt + 0227', char: 'ह्म', name: 'ह्म (ह + ् + म) जैसे ब्राह्मण', category: 'kruti' },
];

/**
 * Unicode NFKC and Nukta normalizer
 * Matches TestMentor's reverse-engineered normalizer px() / D(e)
 */
export function normalizeHindiText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    // Canonicalize combined vowel signs
    .replace(/\u093E\u0945/g, 'ॉ')
    .replace(/\u0947\u093E/g, 'ो')
    .replace(/\u0947\u0948/g, 'ौ')
    .replace(/\u0947\u0945/g, 'ै')
    // Canonicalize Nukta consonants
    .replace(/\u0915\u093C/g, 'क़')
    .replace(/\u0916\u093C/g, 'ख़')
    .replace(/\u0917\u093C/g, 'ग़')
    .replace(/\u091C\u093C/g, 'ज़')
    .replace(/\u0921\u093C/g, 'ड़')
    .replace(/\u0922\u093C/g, 'ढ़')
    .replace(/\u092B\u093C/g, 'फ़')
    .replace(/\u092F\u093C/g, 'य़')
    // Strip invisible zero-width format characters and joiners
    .replace(/[\u200B-\u200D\uFE00-\uFE0F\uFEFF]/g, '')
    // Normalize double spaces to single spaces
    .replace(/[ \t]+/g, ' ');
}
