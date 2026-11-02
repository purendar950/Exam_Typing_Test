/**
 * Hindi Transliteration & Normalization Engine
 * Supports Mangal (Inscript layout) and Kruti Dev 010 (Remington layout)
 * Integrated with reverse-engineered Unicode NFKC Nukta normalizer.
 */

// Base QWERTY keyboard characters
const QWERTY_KEYS = [
  "`","1","2","3","4","5","6","7","8","9","0","-","=",
  "q","w","e","r","t","y","u","i","o","p","[","]","\\",
  "a","s","d","f","g","h","j","k","l",";","'",
  "z","x","c","v","b","n","m",",",".","/"
];

// Mangal Inscript Normal Layer
const MANGAL_NORMAL = [
  "ॊ","1","2","3","4","5","6","7","8","9","0","-","ृ",
  "ौ","ै","ा","ी","ू","ब","ह","ग","द","ज","ड","़",
  "ो","े","्","ि","ु","प","र","क","त","च","ट",
  "ॆ","ं","म","न","व","ल","स",",",".","य"
];

// Mangal Inscript Shift Layer
const MANGAL_SHIFT = [
  "ऒ","ऍ","ॅ","्र","र्","ज्ञ","त्र","क्ष","श्र","(",")","ः","ऋ",
  "औ","ऐ","आ","ई","ऊ","भ","ङ","घ","ध","झ","ढ","ञ",
  "ओ","ए","अ","इ","उ","फ","ऱ","ख","थ","छ","ठ",
  "ऎ","ँ","ण","ऩ","ऴ","ळ","श","ष","।","य़"
];

// Kruti Dev 010 Remington character mappings
const KRUTI_DEV_MAP: Record<string, string> = {
  "k": "ा", "l": "स", "m": "उ", "n": "द", "o": "व", "p": "च", "q": "ु", "r": "प", "s": "क", "t": "ी",
  "u": "ह", "v": "न", "w": "ू", "x": "ग", "y": "ब", "z": "्र",
  "a": "ं", "b": "इ", "c": "म", "d": "क", "e": "म", "f": "ि", "g": "ह", "h": "ी", "i": "प", "j": "र",
  "K": "ा", "L": "श", "M": "ऊ", "N": "ध", "O": "व", "P": "झ", "Q": "ु", "R": "फ", "S": "क्", "T": "ी",
  "U": "ह", "V": "न्", "W": "ू", "X": "ग्", "Y": "भ", "Z": "र्",
  "A": "ँ", "B": "ई", "C": "म्", "D": "ध्", "E": "म्", "F": "ँ", "G": "ह्", "H": "ी", "I": "प्", "J": "र्",
  "1": "१", "2": "२", "3": "३", "4": "४", "5": "५", "6": "६", "7": "७", "8": "८", "9": "९", "0": "०",
  "[": "ख्", "]": "्", ";": "य", "'": "श", "/": "ध्", ",": "ए", ".": "ण्"
};

/**
 * Translates a single physical keystroke to Mangal Inscript
 */
export function translateToMangalInscript(key: string, isShift: boolean): string {
  const index = QWERTY_KEYS.indexOf(key.toLowerCase());
  if (index === -1) return key;

  if (isShift) {
    return MANGAL_SHIFT[index] || key;
  }
  return MANGAL_NORMAL[index] || key;
}

/**
 * Translates key to Kruti Dev representation
 */
export function translateToKrutiDev(key: string): string {
  return KRUTI_DEV_MAP[key] || key;
}

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
