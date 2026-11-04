import { CalculationModel } from '../types';

export interface OfficialExamRule {
  id: string;
  categoryGroup: string;
  postTitle: string;
  organization: string;
  notificationRef: string;
  hindiSpeed?: number;
  englishSpeed?: number;
  durationMinutes: number;
  hindiFont: string;
  englishFont: string;
  calculationModel: CalculationModel;
  errorCutoff: string;
  penaltyFormula: string;
  fullMistakes: string[];
  halfMistakes: string[];
  backspaceRule: string;
  retypingRule: string;
  examChecklist: string[];
}

export const OFFICIAL_EXAM_RULES: OfficialExamRule[] = [
  // 1. UP GOVT & UP POLICE
  {
    id: 'up-police-co-asi',
    categoryGroup: 'up_govt',
    postTitle: 'UP Police Computer Operator Grade-A & SI/ASI',
    organization: 'Uttar Pradesh Police Recruitment & Promotion Board (UPPRPB)',
    notificationRef: 'UPPRPB Direct Recruitment Guidelines (Computer Operator & Sub-Inspector/ASI)',
    hindiSpeed: 25,
    englishSpeed: 30,
    durationMinutes: 15,
    hindiFont: 'Unicode Mangal Font (Inscript Keyboard Layout mandatory, Kruti Dev 010 in select exams)',
    englishFont: 'Standard QWERTY (Times New Roman / Arial)',
    calculationModel: 'upprpb',
    errorCutoff: 'Strict 85.0% whole-passage accuracy benchmark',
    penaltyFormula: 'Accuracy = (Net Correct Words / Total Master Passage Words) × 100. Must type at least 85% of total passage words correctly.',
    fullMistakes: [
      'Omission of any word or figure present in master text',
      'Substitution of a wrong word or figure',
      'Addition of any extraneous word not found in the original passage',
      'Spelling mistakes or incorrect matras/conjuncts in Hindi'
    ],
    halfMistakes: [
      'Spacing errors (two words combined or double space between words)',
      'Punctuation errors or English letter-case mismatches'
    ],
    backspaceRule: 'Permissible within the active 15-minute test session. Text highlighting is disabled in official TCS/UPPRPB software.',
    retypingRule: 'Not required. Candidates type the official passage once and review before auto-submission at 15:00.',
    examChecklist: [
      'Verify physical keyboard condition (Spacebar, Enter, Backspace) during the 5-minute mock trial.',
      'Maintain steady typing cadence—stopping to backspace excessively lowers your Net WPM.',
      'Ensure Inscript layout knowledge: use Halant key (D) to form conjunct characters (e.g. क + D + ष = क्ष).'
    ]
  },
  {
    id: 'up-police-asi-accounts',
    categoryGroup: 'up_govt',
    postTitle: 'UP Police Assistant Sub-Inspector (Accounts)',
    organization: 'UPPRPB Lucknow',
    notificationRef: 'UP Police Clerk, Accounts & Confidential Service Cadre Rules',
    hindiSpeed: 15,
    durationMinutes: 15,
    hindiFont: 'Unicode Mangal Font (Inscript Keyboard Layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'upprpb',
    errorCutoff: '85.0% Accuracy on master passage',
    penaltyFormula: 'Net WPM = (Total Correct Words / 15 Minutes). Accuracy must be ≥ 85.0%.',
    fullMistakes: [
      'Omission of words, financial figures, or tabular headings',
      'Substitution of wrong numerical figures or Hindi words',
      'Addition of words'
    ],
    halfMistakes: [
      'Spacing errors and punctuation mismatches'
    ],
    backspaceRule: 'Backspace allowed throughout the test.',
    retypingRule: 'Single master passage typing with auto-submission.',
    examChecklist: [
      'Accuracy is paramount since required speed is only 15 WPM.',
      'Pay close attention to numerical digits and financial terminologies.'
    ]
  },
  {
    id: 'upsssc-assistants',
    categoryGroup: 'up_govt',
    postTitle: 'UPSSSC Junior Assistant / Junior Clerk / Typist',
    organization: 'Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)',
    notificationRef: 'UPSSSC Combined Subordinate Junior Assistant Examination Rules',
    hindiSpeed: 25,
    englishSpeed: 30,
    durationMinutes: 5,
    hindiFont: 'Unicode Mangal (Inscript) OR Kruti Dev 010 (Candidate Choice)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'upprpb',
    errorCutoff: 'Minimum 25 WPM Hindi AND 30 WPM English (Both Qualifying)',
    penaltyFormula: 'Net WPM = (Total Correct Words / 5 Minutes). Both languages must qualify independently.',
    fullMistakes: [
      'Omission, substitution, or addition of words',
      'Incorrect Hindi character or matra'
    ],
    halfMistakes: [
      'Spacing and capitalization errors'
    ],
    backspaceRule: 'Backspace is functional and allowed.',
    retypingRule: '5-minute sprint; accuracy over speed ensures clearance.',
    examChecklist: [
      'Both Hindi and English tests are conducted on the same day with a short break.',
      'Select your preferred Hindi layout (Mangal or Kruti Dev) during candidate registration.'
    ]
  },
  {
    id: 'uppsc-ro-aro',
    categoryGroup: 'up_govt',
    postTitle: 'UPPSC RO / ARO (Samiksha Adhikari)',
    organization: 'Uttar Pradesh Public Service Commission (UPPSC)',
    notificationRef: 'UPPSC Samiksha Adhikari / Sahayak Samiksha Adhikari Examination Rules',
    hindiSpeed: 25,
    englishSpeed: 25,
    durationMinutes: 5,
    hindiFont: 'Kruti Dev 010 (Remington Layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'upprpb',
    errorCutoff: 'Minimum 25 WPM with 85% Accuracy',
    penaltyFormula: 'Official UPPSC 5-minute qualifying test on Kruti Dev 010.',
    fullMistakes: ['Omissions, substitutions, and incorrect Alt-code characters'],
    halfMistakes: ['Spacing and punctuation errors'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single attempt on given paragraph.',
    examChecklist: [
      'Master essential Kruti Dev Alt codes (Alt+0216 for क्र, Alt+0161 for द्व, Alt+0170 for त्र).'
    ]
  },

  // 2. RAILWAYS RRB NTPC CBTST
  {
    id: 'rrb-ntpc',
    categoryGroup: 'railways',
    postTitle: 'RRB NTPC CBTST (Senior Clerk / JAA / Junior Clerk)',
    organization: 'Railway Recruitment Boards (RRB) / Ministry of Railways',
    notificationRef: 'RRB CEN 01/2019 Computer Based Typing Skill Test (CBTST) Eduquity Guidelines',
    hindiSpeed: 25,
    englishSpeed: 30,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Inscript or Remington Gail Layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'rrb_eduquity',
    errorCutoff: '5% Permissible Error Allowance on Typed Words',
    penaltyFormula: 'Net WPM = [Total Words Typed - (Excess Mistakes beyond 5% × 10)] / 10 Minutes',
    fullMistakes: [
      'Every omission of a word or figure from original master passage',
      'Every substitution of a wrong word or figure',
      'Every addition of a word not found in the original passage'
    ],
    halfMistakes: [
      'Spacing errors (two words combined without space or multiple spaces)',
      'Punctuation errors (omitted or wrongly placed commas, full stops)',
      'Capitalization errors (wrong case in English letters)'
    ],
    backspaceRule: 'Backspace and arrow keys are fully functional and allowed throughout the 10-minute test.',
    retypingRule: 'MANDATORY RETYPING: If you finish typing the 300 words (English) or 250 words (Hindi) passage before 10:00, press Spacebar/Enter and RE-TYPE the passage from the beginning. Leaving incomplete time reduces your Net WPM.',
    examChecklist: [
      'Test Structure: 1 min warm-up mock, 10 min break, then 10 min actual evaluated CBTST.',
      'Do not stop typing when you reach the end of the passage—retype immediately to maximize gross words.',
      'Stay under the 5% error limit: e.g., if you type 360 words, you get 18 free mistakes without penalty.'
    ]
  },

  // 3. STAFF SELECTION COMMISSION (SSC)
  {
    id: 'ssc-chsl-jsa-ldc',
    categoryGroup: 'ssc',
    postTitle: 'SSC CHSL Typing Test (LDC / JSA)',
    organization: 'Staff Selection Commission (SSC)',
    notificationRef: 'SSC Combined Higher Secondary Level (10+2) Examination Guidelines',
    hindiSpeed: 30,
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Inscript layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'ssc_dest',
    errorCutoff: 'Maximum 7% Mistakes for UR; Maximum 10% for Reserved Categories',
    penaltyFormula: 'Error % = (Total Equivalent Mistakes / Total Master Words) × 100. Standard 5 keystrokes = 1 word.',
    fullMistakes: [
      'Omission of word/figure',
      'Substitution of wrong word/figure',
      'Addition of extraneous word not present in passage'
    ],
    halfMistakes: [
      'Spacing errors between words',
      'Capitalization errors in English',
      'Punctuation errors'
    ],
    backspaceRule: 'Backspace is allowed. Highlight of current word is disabled in official TCS-SSC test interface.',
    retypingRule: 'Typing master text once completely (1,750 keystrokes for English / 1,500 keystrokes for Hindi).',
    examChecklist: [
      '1,750 Key Depressions (English) and 1,500 Key Depressions (Hindi) must be completed in 10 minutes.',
      'Check entire typed text before submitting if you finish early.'
    ]
  },
  {
    id: 'ssc-cgl-deo',
    categoryGroup: 'ssc',
    postTitle: 'SSC CGL Data Entry Skill Test (DEST / Tax Assistant)',
    organization: 'Staff Selection Commission (SSC)',
    notificationRef: 'SSC CGL Tier-II DEST Notification (8,000 Key Depressions per Hour)',
    englishSpeed: 27,
    durationMinutes: 15,
    hindiFont: 'Unicode Mangal Font',
    englishFont: 'Standard QWERTY',
    calculationModel: 'ssc_dest',
    errorCutoff: 'Maximum 20% Mistakes for UR; Maximum 30% for Reserved Categories',
    penaltyFormula: 'Total Master Keystrokes = 2,000 in 15 Minutes (8,000 KDPH). Error Rate must be ≤ 20.0%.',
    fullMistakes: ['Omissions, substitutions, additions of words'],
    halfMistakes: ['Spacing, capitalization, punctuation'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single master passage typing (2,000 key depressions).',
    examChecklist: [
      'DEST is qualifying for Tax Assistant (CBDT & CBIC), UDC, and other executive posts.',
      'Relaxed error margin (20%) allows steady, accurate typing without rush.'
    ]
  },
  {
    id: 'ssc-chsl-deo',
    categoryGroup: 'ssc',
    postTitle: 'SSC CHSL DEO Grade-A (CAG / Ministries)',
    organization: 'Staff Selection Commission (SSC)',
    notificationRef: 'SSC CHSL DEO High-Speed Scheme (15,000 KDPH)',
    englishSpeed: 50,
    durationMinutes: 15,
    hindiFont: 'Unicode Mangal Font',
    englishFont: 'Standard QWERTY',
    calculationModel: 'ssc_dest',
    errorCutoff: 'Maximum 5.0% Mistakes',
    penaltyFormula: '3,750 Key Depressions in 15 Minutes (15,000 KDPH = 50 WPM). Permissible Error ≤ 5%.',
    fullMistakes: ['Omission, substitution, addition of words'],
    halfMistakes: ['Spacing, capitalization, punctuation'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Complete 3,750 keystrokes passage within 15 minutes.',
    examChecklist: [
      'Demanding high-speed standard: 50 Net WPM required for DEO Grade A.'
    ]
  },

  // 4. COURTS & JUDICIARY
  {
    id: 'ahc-group-c-clerk',
    categoryGroup: 'judiciary',
    postTitle: 'Allahabad High Court Group C Clerk & Typist',
    organization: 'High Court of Judicature at Allahabad (AHC)',
    notificationRef: 'AHC Uttar Pradesh Civil Court Staff Centralized Recruitment Rules',
    hindiSpeed: 25,
    englishSpeed: 30,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal (Inscript) Font',
    englishFont: 'Standard QWERTY',
    calculationModel: 'court_ahc',
    errorCutoff: 'Minimum 25.0 Marks out of 50.0 Total Marks (50% Pass Cutoff)',
    penaltyFormula: 'Score = 50.0 - (Total Mistakes × 0.1 Mark). Passing mark is 25.0 / 50.0.',
    fullMistakes: [
      'Every omitted word',
      'Every substituted or wrong word',
      'Every additional word'
    ],
    halfMistakes: [
      'Minor spelling, spacing, or punctuation error (penalized at 0.05 mark)'
    ],
    backspaceRule: 'Backspace allowed throughout the test.',
    retypingRule: 'Single official passage attempt.',
    examChecklist: [
      'Both Hindi and English typing are scored out of 50 marks each.',
      'Every mistake directly reduces 0.1 mark from your merit score.'
    ]
  },
  {
    id: 'dhc-jja',
    categoryGroup: 'judiciary',
    postTitle: 'Delhi High Court Junior Judicial Assistant (JJA)',
    organization: 'High Court of Delhi (DHC)',
    notificationRef: 'Delhi High Court Establishment Examination Guidelines (JJA / Restorer)',
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Not applicable (English test mandatory)',
    englishFont: 'Standard QWERTY (Times New Roman / Arial)',
    calculationModel: 'court_delhi',
    errorCutoff: 'STRICT 3.0% MAXIMUM ERROR LIMIT (Zero Tolerance Above 3%)',
    penaltyFormula: 'Error % = (Equivalent Mistakes / Attempted Words) × 100. Any score > 3.0% fails automatically.',
    fullMistakes: [
      'Omission of legal terms, numbers, or words',
      'Substitution of wrong words',
      'Addition of extraneous words'
    ],
    halfMistakes: [
      'Spacing errors, missing capitalization of proper nouns or legal terms',
      'Punctuation errors (commas, semicolons, quotes)'
    ],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single test passage.',
    examChecklist: [
      'One of the strictest accuracy standards in India: only 3 errors allowed per 100 words typed.',
      'Legal passages contain semicolons, capitalized citations (e.g. "Hon\'ble Supreme Court"), and Latin maxims.'
    ]
  },
  {
    id: 'sci-jca',
    categoryGroup: 'judiciary',
    postTitle: 'Supreme Court Junior Court Assistant (SCI JCA)',
    organization: 'Supreme Court of India (SCI)',
    notificationRef: 'Supreme Court of India JCA Typing Test Regulations',
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Not applicable',
    englishFont: 'Standard QWERTY',
    calculationModel: 'court_delhi',
    errorCutoff: 'Maximum 3.0% Mistakes Allowed',
    penaltyFormula: 'Net WPM must be ≥ 35 WPM with error percentage ≤ 3.0%.',
    fullMistakes: ['Omission, substitution, addition of words'],
    halfMistakes: ['Spacing, capitalization, punctuation'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single 10-minute legal test passage.',
    examChecklist: [
      'Strict legal formatting: maintain proper paragraph breaks and capitalization.'
    ]
  },
  {
    id: 'phhc-clerk',
    categoryGroup: 'judiciary',
    postTitle: 'Punjab & Haryana High Court Clerk & Typist (PHHC)',
    organization: 'High Court of Punjab and Haryana at Chandigarh (S.S.S.C.)',
    notificationRef: 'Society for Centralized Recruitment of Staff in Subordinate Courts (S.S.S.C.)',
    englishSpeed: 30,
    durationMinutes: 10,
    hindiFont: 'Punjabi Gurmukhi (select posts) / Hindi Mangal',
    englishFont: 'Standard QWERTY',
    calculationModel: 'court_phhc',
    errorCutoff: 'Maximum 8.0% Permissible Mistakes',
    penaltyFormula: 'Minimum 30 Net WPM with mistakes not exceeding 8% of total typed words.',
    fullMistakes: ['Omissions, substitutions, additions'],
    halfMistakes: ['Spacing, punctuation, capitalization'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: '10-minute test.',
    examChecklist: [
      'Passage is typically legal or court proceedings narrative.'
    ]
  },

  // 5. MP CPCT & STATE EXAMS
  {
    id: 'mp-cpct',
    categoryGroup: 'state_exams',
    postTitle: 'MP CPCT (Computer Proficiency Certification Test)',
    organization: 'Madhya Pradesh Agency for Promotion of Information Technology (MAP_IT)',
    notificationRef: 'MP CPCT Official Certification Framework & Scorecard Bands',
    hindiSpeed: 20,
    englishSpeed: 30,
    durationMinutes: 15,
    hindiFont: 'Unicode Mangal (Inscript Layout) OR Remington Gail Layout',
    englishFont: 'Standard QWERTY',
    calculationModel: 'mp_cpct',
    errorCutoff: 'Hindi: ≥ 20 Net WPM | English: ≥ 30 Net WPM (Level 4 minimum)',
    penaltyFormula: 'Net WPM = Correct Words Typed / 15 Minutes. Classified into Official MP CPCT Certification Bands.',
    fullMistakes: [
      'Incorrect word typed',
      'Skipped word',
      'Incorrect Hindi conjunct or character'
    ],
    halfMistakes: ['Punctuation and spacing errors'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: '15-minute steady typing test for each language.',
    examChecklist: [
      'Official Scorecard Bands: Level 1 (≥50 WPM), Level 2 (40-49.9 WPM), Level 3 (30-39.9 WPM), Level 4 (20-29.9 WPM).',
      'CPCT score is mandatory for all MP Govt clerk, patwari, and data entry recruitments.'
    ]
  },

  // 6. DELHI GOVT & DSSSB
  {
    id: 'dsssb-ldc-ja',
    categoryGroup: 'delhi_govt',
    postTitle: 'DSSSB LDC / Junior Assistant & Stenographer',
    organization: 'Delhi Subordinate Services Selection Board (DSSSB)',
    notificationRef: 'DSSSB Combined Skill Test Scheme for Group C Clerical Posts',
    hindiSpeed: 30,
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Inscript layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'rrb_eduquity',
    errorCutoff: 'Minimum 35 WPM English or 30 WPM Hindi (10 Minutes)',
    penaltyFormula: 'Evaluated under standard mistake deduction model with 5% tolerance.',
    fullMistakes: ['Omission, substitution, addition'],
    halfMistakes: ['Spacing, capitalization, punctuation'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: '5,000 keystroke passage practice recommended.',
    examChecklist: [
      'Speed and rhythm are essential to cover the full passage in 10 minutes.'
    ]
  },
  {
    id: 'delhi-police-hcm',
    categoryGroup: 'delhi_govt',
    postTitle: 'Delhi Police Head Constable Ministerial (HCM)',
    organization: 'Delhi Police / SSC',
    notificationRef: 'Delhi Police HCM Recruitment Standing Order (Typing Test on Computer)',
    hindiSpeed: 25,
    englishSpeed: 30,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font',
    englishFont: 'Standard QWERTY',
    calculationModel: 'standard',
    errorCutoff: 'Minimum 30 WPM (English) or 25 WPM (Hindi) to qualify for 10 marks',
    penaltyFormula: 'Awarded up to 25 Marks: 30 WPM = 10 Marks, 35 WPM = 12 Marks, 40 WPM = 15 Marks, 45 WPM = 18 Marks, 50+ WPM = 25 Marks.',
    fullMistakes: ['Omissions, substitutions, additions'],
    halfMistakes: ['Spacing, punctuation, capitalization'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: '2,500 keystrokes passage.',
    examChecklist: [
      'Higher speed translates directly to higher competitive marks added to your written exam total.'
    ]
  },

  // 7. DEFENSE & PARAMILITARY HCM
  {
    id: 'bsf-all-forces-hcm',
    categoryGroup: 'defense',
    postTitle: 'CRPF / CISF / BSF / ITBP / SSB Head Constable Ministerial',
    organization: 'Central Armed Police Forces (CAPF / MHA)',
    notificationRef: 'CAPF Head Constable (Ministerial) & ASI Steno Common Recruitment Scheme',
    hindiSpeed: 30,
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Inscript layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'rrb_eduquity',
    errorCutoff: '5% Permissible Error Margin (Excess Mistakes Deduct 10 Words Each)',
    penaltyFormula: 'Net WPM = [Total Words Typed - (Excess Mistakes beyond 5% × 10)] / 10 Minutes. English ≥ 35 WPM, Hindi ≥ 30 WPM.',
    fullMistakes: ['Omission of word', 'Substitution of wrong word', 'Addition of extraneous word'],
    halfMistakes: ['Spacing, punctuation, and capitalization errors'],
    backspaceRule: 'Backspace functional.',
    retypingRule: 'Complete 350 words (English) or 300 words (Hindi) within 10 minutes.',
    examChecklist: [
      'CRPF HCM typing test is known for strict rejection: maintain high accuracy (≥95%).'
    ]
  },

  // 8. CENTRAL NTA & UNIVERSITIES
  {
    id: 'central-nta-all',
    categoryGroup: 'central_nta',
    postTitle: 'KVS / NVS / EMRS / CBSE / AIIMS / NCERT Junior Assistant',
    organization: 'National Testing Agency (NTA) & Autonomous Central Bodies',
    notificationRef: 'NTA Non-Teaching Recruitment Typing Guidelines',
    hindiSpeed: 30,
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Inscript layout)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'rrb_eduquity',
    errorCutoff: 'English: 35 WPM | Hindi: 30 WPM in 10 Minutes',
    penaltyFormula: 'Standard 5-keystroke word division with 5% error allowance.',
    fullMistakes: ['Omission, substitution, addition'],
    halfMistakes: ['Spacing, punctuation, capitalization'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single master passage typing.',
    examChecklist: [
      'Used across Kendriya Vidyalaya (KVS), Navodaya (NVS), Eklavya (EMRS), and NCERT.'
    ]
  },

  // 9. BIHAR EXAMS
  {
    id: 'bihar-bssc-inter-level',
    categoryGroup: 'bihar',
    postTitle: 'BSSC 2nd Inter Level (Clerk / LDC) & Bihar Beltron DEO',
    organization: 'Bihar Staff Selection Commission (BSSC) / Bihar Beltron',
    notificationRef: 'BSSC 2nd Inter Level Typing Guidelines & Beltron DEO Standard',
    hindiSpeed: 30,
    englishSpeed: 35,
    durationMinutes: 10,
    hindiFont: 'Unicode Mangal Font (Remington Gail / Inscript)',
    englishFont: 'Standard QWERTY',
    calculationModel: 'ssc_dest',
    errorCutoff: 'Hindi 30 WPM (Beltron: 25 WPM) & English 35 WPM (Beltron: 30 WPM)',
    penaltyFormula: 'Standard error evaluation; Hindi typing conducted on Mangal font.',
    fullMistakes: ['Omission, substitution, addition of words'],
    halfMistakes: ['Spacing and punctuation errors'],
    backspaceRule: 'Backspace allowed.',
    retypingRule: 'Single 10-minute evaluation test.',
    examChecklist: [
      'Remington Gail and Inscript layouts are both widely practiced in Bihar typing tests.'
    ]
  }
];

export const getOfficialRuleForExam = (examIdOrSlug: string, categoryGroup?: string): OfficialExamRule => {
  // 1. Exact id match
  const exact = OFFICIAL_EXAM_RULES.find((r) => r.id === examIdOrSlug);
  if (exact) return exact;

  // 2. Partial id or slug match
  const slugMatch = OFFICIAL_EXAM_RULES.find((r) => 
    examIdOrSlug.includes(r.id) || r.id.includes(examIdOrSlug)
  );
  if (slugMatch) return slugMatch;

  // 3. Category group match
  if (categoryGroup) {
    const groupMatch = OFFICIAL_EXAM_RULES.find((r) => r.categoryGroup === categoryGroup);
    if (groupMatch) return groupMatch;
  }

  // 4. Fallback to UP Police / UPPRPB
  return OFFICIAL_EXAM_RULES[0];
};
