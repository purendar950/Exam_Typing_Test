export interface HindiCharacterHelper {
  id: string;
  character: string;
  name: string;
  category: 'conjunct' | 'ref_paden' | 'nukta' | 'special_alt' | 'matra';
  mangalKeys: string;
  mangalExplanation: string;
  krutiDevKeys: string;
  krutiDevExplanation: string;
  exampleWords: string[];
}

export const HINDI_CHARACTERS: HindiCharacterHelper[] = [
  // 1. CONJUNCTS (संयुक्ताक्षर)
  {
    id: 'ksha',
    character: 'क्ष',
    name: 'क्ष (क + ् + ष)',
    category: 'conjunct',
    mangalKeys: 'Shift + 7  (या  k + d + Shift+R)',
    mangalExplanation: 'Mangal Inscript में Shift के साथ 7 दबाएँ, अथवा क (k) + हलन्त (d) + ष (Shift+R) टाइप करें।',
    krutiDevKeys: 'Shift + K  (या  Alt + 0216)',
    krutiDevExplanation: 'Kruti Dev 010 में Shift के साथ K दबाएँ या Alt+0216 का उपयोग करें।',
    exampleWords: ['परीक्षा', 'क्षेत्र', 'क्षमता', 'शिक्षक', 'सुरक्षा']
  },
  {
    id: 'tra',
    character: 'त्र',
    name: 'त्र (त + ् + र)',
    category: 'conjunct',
    mangalKeys: 'Shift + 6  (या  l + d + j)',
    mangalExplanation: 'Mangal Inscript में Shift के साथ 6 दबाएँ, अथवा त (l) + हलन्त (d) + र (j) टाइप करें।',
    krutiDevKeys: 'Shift + 1  (या  1 + Z)',
    krutiDevExplanation: 'Kruti Dev में Shift के साथ 1 दबाएँ, अथवा 1 (त्) के साथ Z (र) दबाएँ।',
    exampleWords: ['चरित्र', 'पत्र', 'मित्र', 'छात्र', 'मंत्रालय']
  },
  {
    id: 'gya',
    character: 'ज्ञ',
    name: 'ज्ञ (ज + ् + ञ)',
    category: 'conjunct',
    mangalKeys: 'Shift + 5  (या  p + d + Shift+})',
    mangalExplanation: 'Mangal Inscript में Shift के साथ 5 दबाएँ, अथवा ज (p) + हलन्त (d) + ञ (Shift+}) टाइप करें।',
    krutiDevKeys: 'Shift + K  (या  Alt + 0217)',
    krutiDevExplanation: 'Kruti Dev में Shift के साथ K या Shift+} दबाएँ।',
    exampleWords: ['ज्ञान', 'विज्ञान', 'आज्ञा', 'प्रतिज्ञा', 'जिज्ञासा']
  },
  {
    id: 'shra',
    character: 'श्र',
    name: 'श्र (श + ् + र)',
    category: 'conjunct',
    mangalKeys: 'Shift + 8  (या  Shift+M + d + j)',
    mangalExplanation: 'Mangal Inscript में Shift के साथ 8 दबाएँ, अथवा श (Shift+M) + हलन्त (d) + र (j) टाइप करें।',
    krutiDevKeys: 'Shift + Z  (Z key)',
    krutiDevExplanation: 'Kruti Dev 010 में Shift के साथ Z दबाएँ।',
    exampleWords: ['श्री', 'श्रम', 'विश्राम', 'श्रमिक', 'आश्रम']
  },
  {
    id: 'ddha',
    character: 'द्ध',
    name: 'द्ध (द + ् + ध)',
    category: 'conjunct',
    mangalKeys: 'o + d + Shift+E',
    mangalExplanation: 'Mangal Inscript में द (o) + हलन्त (d) + ध (Shift+E) टाइप करें।',
    krutiDevKeys: 'Alt + 0161',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0161 टाइप करें।',
    exampleWords: ['शुद्ध', 'बुद्धि', 'युद्ध', 'प्रसिद्ध', 'वृद्धि']
  },
  {
    id: 'dva',
    character: 'द्व',
    name: 'द्व (द + ् + व)',
    category: 'conjunct',
    mangalKeys: 'o + d + b',
    mangalExplanation: 'Mangal Inscript में द (o) + हलन्त (d) + व (b) टाइप करें।',
    krutiDevKeys: 'Alt + 0227',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0227 टाइप करें।',
    exampleWords: ['द्वारा', 'द्वितीय', 'विद्वान', 'द्वंद्व', 'द्वार']
  },
  {
    id: 'dya',
    character: 'द्य',
    name: 'द्य (द + ् + य)',
    category: 'conjunct',
    mangalKeys: 'o + d + ;',
    mangalExplanation: 'Mangal Inscript में द (o) + हलन्त (d) + य (;) टाइप करें।',
    krutiDevKeys: 'Alt + 0228',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0228 टाइप करें।',
    exampleWords: ['विद्या', 'विद्यार्थी', 'विद्यालय', 'उद्योग', 'पद्य']
  },
  {
    id: 'hma',
    character: 'ह्म',
    name: 'ह्म (ह + ् + म)',
    category: 'conjunct',
    mangalKeys: 'u + d + c',
    mangalExplanation: 'Mangal Inscript में ह (u) + हलन्त (d) + म (c) टाइप करें।',
    krutiDevKeys: 'Alt + 0225',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0225 टाइप करें।',
    exampleWords: ['ब्रह्मा', 'ब्राह्मण', 'ब्रह्मांड']
  },
  {
    id: 'hna',
    character: 'ह्न',
    name: 'ह्न (ह + ् + न)',
    category: 'conjunct',
    mangalKeys: 'u + d + v',
    mangalExplanation: 'Mangal Inscript में ह (u) + हलन्त (d) + न (v) टाइप करें।',
    krutiDevKeys: 'Alt + 0224',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0224 टाइप करें।',
    exampleWords: ['चिह्न', 'अपराह्न', 'पूर्वाह्न']
  },
  {
    id: 'tta',
    character: 'ट्ट',
    name: 'ट्ट (ट + ् + ट)',
    category: 'conjunct',
    mangalKeys: "' + d + '",
    mangalExplanation: "Mangal Inscript में ट (') + हलन्त (d) + ट (') टाइप करें।",
    krutiDevKeys: 'Alt + 0179',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0179 टाइप करें।',
    exampleWords: ['छुट्टी', 'लट्टू', 'खट्टा', 'पट्टी']
  },
  {
    id: 'ththa',
    character: 'ठ्ठ',
    name: 'ठ्ठ (ठ + ् + ठ)',
    category: 'conjunct',
    mangalKeys: 'Shift+" + d + Shift+"',
    mangalExplanation: 'Mangal Inscript में ठ (Shift+") + हलन्त (d) + ठ (Shift+") टाइप करें।',
    krutiDevKeys: 'Alt + 0180',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0180 टाइप करें।',
    exampleWords: ['गट्ठर', 'चिट्ठी', 'मुट्ठी']
  },
  {
    id: 'dda',
    character: 'ड्ड',
    name: 'ड्ड (ड + ् + ड)',
    category: 'conjunct',
    mangalKeys: '[ + d + [',
    mangalExplanation: 'Mangal Inscript में ड ([) + हलन्त (d) + ड ([) टाइप करें।',
    krutiDevKeys: 'Alt + 0182',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0182 टाइप करें।',
    exampleWords: ['गुड्डा', 'लड्डू', 'अड्डा']
  },
  {
    id: 'kta',
    character: 'क्त',
    name: 'क्त (क + ् + त)',
    category: 'conjunct',
    mangalKeys: 'k + d + l',
    mangalExplanation: 'Mangal Inscript में क (k) + हलन्त (d) + त (l) टाइप करें।',
    krutiDevKeys: 'Alt + 0216  (या  d + ] + l)',
    krutiDevExplanation: 'Kruti Dev 010 में d (क) + ] (्) + l (स/त) या Alt+0216 का उपयोग करें।',
    exampleWords: ['संयुक्त', 'भक्ति', 'शक्ति', 'मुक्ति', 'पंक्ति']
  },

  // 2. REF & PADEN R (रेफ 'र्' एवं पदेन '्र')
  {
    id: 'ref_ra',
    character: 'र्',
    name: "रेफ 'र्' (ऊपर लगने वाला र)",
    category: 'ref_paden',
    mangalKeys: 'j + d + (अगला अक्षर)',
    mangalExplanation: 'Mangal Inscript में जिस अक्षर के ऊपर रेफ लगाना हो, उससे पहले र (j) + हलन्त (d) दबाएँ। उदाहरण: धर्म = ध + र + ् + म।',
    krutiDevKeys: 'Shift + A  (या  Z key)',
    krutiDevExplanation: 'Kruti Dev 010 में अक्षर टाइप करने के बाद Shift + A दबाएँ।',
    exampleWords: ['धर्म', 'कर्म', 'सूर्य', 'मार्ग', 'निर्णय']
  },
  {
    id: 'paden_ra_slash',
    character: '्र',
    name: "पदेन '्र' (तिरछी रेखा: प्र, क्र, ग्र)",
    category: 'ref_paden',
    mangalKeys: '(पहला अक्षर) + d + j  (या  Shift + 3)',
    mangalExplanation: 'Mangal Inscript में अक्षर + हलन्त (d) + र (j) दबाएँ, अथवा अक्षर के बाद Shift + 3 दबाएँ। उदाहरण: प्र = h + d + j।',
    krutiDevKeys: 'z (lowercase z)',
    krutiDevExplanation: 'Kruti Dev 010 में अक्षर टाइप करने के तुरंत बाद z दबाएँ। जैसे: p + z = प्र।',
    exampleWords: ['प्रकाश', 'क्रम', 'ग्राम', 'भ्राता', 'प्रथम']
  },
  {
    id: 'paden_ra_cap',
    character: '्र',
    name: "पदेन '्र' (उल्टा v: ट्र, ड्र, राष्ट्र)",
    category: 'ref_paden',
    mangalKeys: "' + d + j  (ट + ् + र)  या  [ + d + j",
    mangalExplanation: "Mangal Inscript में गोल पेंदे वाले अक्षरों (ट, ड, ढ) के बाद हलन्त (d) + र (j) दबाएँ। जैसे ट्र = ' + d + j।",
    krutiDevKeys: 'Alt + 0170  (या  Alt + 0212)',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0170 टाइप करें।',
    exampleWords: ['ट्रक', 'ट्रेन', 'ड्राइवर', 'राष्ट्र', 'ड्रामा']
  },

  // 3. NUKTA CHARACTERS (नुक्ता वर्ण: ़)
  {
    id: 'nukta_key',
    character: '़',
    name: 'नुक्ता चिन्ह (़)',
    category: 'nukta',
    mangalKeys: '] (Close Square Bracket)',
    mangalExplanation: 'Mangal Inscript में किसी भी अक्षर के बाद ] दबाने पर नीचे नुक्ता लग जाता है।',
    krutiDevKeys: '+ key  (या  Alt + 0188)',
    krutiDevExplanation: 'Kruti Dev 010 में + कुंजी दबाएँ या Alt+0188 का प्रयोग करें।',
    exampleWords: ['सड़क', 'पढ़ाई', 'ज़रूरी', 'फ़िल्म', 'ग़लत']
  },
  {
    id: 'nukta_da',
    character: 'ड़',
    name: 'ड़ (ड + ़)',
    category: 'nukta',
    mangalKeys: '[ + ]',
    mangalExplanation: 'Mangal Inscript में ड ([) दबाएँ और तुरंत नुक्ता (]) दबाएँ।',
    krutiDevKeys: 'Alt + 0233',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0233 दबाएँ।',
    exampleWords: ['सड़क', 'पेड़', 'घोड़ा', 'बड़ा', 'लड़का']
  },
  {
    id: 'nukta_dha',
    character: 'ढ़',
    name: 'ढ़ (ढ + ़)',
    category: 'nukta',
    mangalKeys: 'Shift+{ + ]',
    mangalExplanation: 'Mangal Inscript में ढ (Shift+{) दबाएँ और तुरंत नुक्ता (]) दबाएँ।',
    krutiDevKeys: 'Alt + 0234',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0234 दबाएँ।',
    exampleWords: ['पढ़ाई', 'सीढ़ी', 'गढ़', 'चढ़ना', 'दाढ़ी']
  },
  {
    id: 'nukta_za',
    character: 'ज़',
    name: 'ज़ (ज + ़)',
    category: 'nukta',
    mangalKeys: 'p + ]',
    mangalExplanation: 'Mangal Inscript में ज (p) दबाएँ और तुरंत नुक्ता (]) दबाएँ।',
    krutiDevKeys: 'Alt + 0232',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0232 दबाएँ।',
    exampleWords: ['ज़रूर', 'ज़िन्दगी', 'काग़ज़', 'आज़ादी', 'ज़मीन']
  },
  {
    id: 'nukta_fa',
    character: 'फ़',
    name: 'फ़ (फ + ़)',
    category: 'nukta',
    mangalKeys: 'Shift+H + ]',
    mangalExplanation: 'Mangal Inscript में फ (Shift+H) दबाएँ और तुरंत नुक्ता (]) दबाएँ।',
    krutiDevKeys: 'Alt + 0235',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0235 दबाएँ।',
    exampleWords: ['फ़िल्म', 'साफ़', 'फ़ोन', 'फ़ैसला', 'फ़ायदा']
  },

  // 4. SPECIAL & VOWELS (ऋ, हलन्त, पूर्ण विराम)
  {
    id: 'ri_vowel',
    character: 'ऋ',
    name: 'ऋ (ऋषि वाला स्वर)',
    category: 'matra',
    mangalKeys: 'Shift + =',
    mangalExplanation: 'Mangal Inscript में Shift के साथ = दबाएँ।',
    krutiDevKeys: 'Alt + 0214',
    krutiDevExplanation: 'Kruti Dev 010 में Alt दबाकर Numpad पर 0214 दबाएँ।',
    exampleWords: ['ऋषि', 'ऋतु', 'ऋण', 'ऋग्वेद']
  },
  {
    id: 'ri_matra',
    character: 'ृ',
    name: 'ृ (ऋ की मात्रा)',
    category: 'matra',
    mangalKeys: '= (Equal Key)',
    mangalExplanation: 'Mangal Inscript में किसी अक्षर के बाद सीधे = (Equal) कुंजी दबाएँ। जैसे कृ = k + =।',
    krutiDevKeys: 'Shift + -  (या  Shift + _)',
    krutiDevExplanation: 'Kruti Dev 010 में अक्षर के बाद Shift + - दबाएँ।',
    exampleWords: ['कृपा', 'कृषि', 'हृदय', 'वृक्ष', 'मातृ']
  },
  {
    id: 'halant',
    character: '्',
    name: 'हलन्त / विसर्ग (्)',
    category: 'special_alt',
    mangalKeys: 'd (हलन्त)  /  Shift + - (विसर्ग ः)',
    mangalExplanation: 'Mangal Inscript में किसी भी अक्षर को आधा करने हेतु तुरंत d दबाएँ।',
    krutiDevKeys: '] (हलन्त)  /  % (विसर्ग)',
    krutiDevExplanation: 'Kruti Dev 010 में ] कुंजी से हलन्त लगता है।',
    exampleWords: ['अर्थात्', 'विद्यार्थी', 'अतः', 'पुनः']
  },
  {
    id: 'purna_viram',
    character: '।',
    name: 'पूर्ण विराम (।)',
    category: 'special_alt',
    mangalKeys: 'Shift + >  (या  Shift + .)',
    mangalExplanation: 'Mangal Inscript में Shift के साथ . (Period) दबाएँ।',
    krutiDevKeys: 'Shift + A  (या  Alt + 0161)',
    krutiDevExplanation: 'Kruti Dev 010 में Shift + A अथवा . दबाएँ।',
    exampleWords: ['राम जाता है।', 'परीक्षा समाप्त हुई।']
  },
  {
    id: 'chandrabindu',
    character: 'ँ',
    name: 'चन्द्रबिन्दु (ँ)',
    category: 'matra',
    mangalKeys: 'Shift + X',
    mangalExplanation: 'Mangal Inscript में Shift के साथ X दबाएँ।',
    krutiDevKeys: 'Shift + W',
    krutiDevExplanation: 'Kruti Dev 010 में Shift के साथ W दबाएँ।',
    exampleWords: ['हँसना', 'आँख', 'गाँव', 'चाँद', 'पाँच']
  }
];
