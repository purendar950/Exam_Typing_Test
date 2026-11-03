import { ExamProfile, UnifiedExamPost, SubCategoryFilter } from '../types';

export { type ExamProfile, type UnifiedExamPost, type SubCategoryFilter };

export interface CategoryGroupInfo {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export const CATEGORY_GROUPS: CategoryGroupInfo[] = [
  {
    "id": "all",
    "title": "All Exams (129)",
    "icon": "\ud83c\udf1f",
    "description": "Complete pan-India typing examination catalog"
  },
  {
    "id": "up_govt",
    "title": "UP Police & UPPSC",
    "icon": "\ud83d\udc6e",
    "description": "UP Police CO, ASI, UPPSC & UPSSSC typing tests"
  },
  {
    "id": "judiciary",
    "title": "Courts & Judiciary",
    "icon": "\u2696\ufe0f",
    "description": "Supreme Court, Allahabad HC, Delhi HC, Patna HC & others"
  },
  {
    "id": "ssc",
    "title": "SSC CGL & CHSL",
    "icon": "\ud83c\udfe2",
    "description": "SSC CGL DEO, CHSL LDC/JSA and DEST modules"
  },
  {
    "id": "delhi_govt",
    "title": "Delhi & DSSSB",
    "icon": "\ud83d\udee1\ufe0f",
    "description": "Delhi Police HCM, DSSSB LDC/JA & DDA typing tests"
  },
  {
    "id": "defense",
    "title": "Defense & Paramilitary",
    "icon": "\ud83c\udf96\ufe0f",
    "description": "BSF HCM, SSB, Air Force Group C, Army Agniveer"
  },
  {
    "id": "bihar",
    "title": "Bihar Exams",
    "icon": "\ud83c\udfdb\ufe0f",
    "description": "Bihar Beltron DEO, BSSC, Vidhan Sabha & Jeevika"
  },
  {
    "id": "central_nta",
    "title": "Central & NTA",
    "icon": "\ud83c\udf93",
    "description": "KVS JSA, AIIMS, CBSE, NTA Central Universities, JNU"
  },
  {
    "id": "railways",
    "title": "Railways RRB",
    "icon": "\ud83d\ude86",
    "description": "RRB NTPC Senior Clerk, Typist & JAA exams"
  },
  {
    "id": "state_exams",
    "title": "State Commissions",
    "icon": "\ud83d\udccb",
    "description": "Rajasthan RSSB, UKPSC, MP CPCT, MPSC & Odisha OSSC"
  }
];

export const CATEGORY_SUB_FILTERS: Record<string, SubCategoryFilter[]> = {
  "all": [
    {
      "id": "all",
      "label": "All Posts"
    },
    {
      "id": "computer_operator",
      "label": "Computer Operator & DEO"
    },
    {
      "id": "asi",
      "label": "ASI & Ministerial (HCM)"
    },
    {
      "id": "court_jja",
      "label": "Court Reader & JJA"
    },
    {
      "id": "ro_aro",
      "label": "RO / ARO"
    },
    {
      "id": "assistant",
      "label": "Junior Assistant & LDC"
    },
    {
      "id": "steno",
      "label": "Stenographer"
    }
  ],
  "up_govt": [
    {
      "id": "all",
      "label": "All UP Posts"
    },
    {
      "id": "computer_operator",
      "label": "Computer Operator"
    },
    {
      "id": "asi",
      "label": "ASI & Accounts"
    },
    {
      "id": "ro_aro",
      "label": "RO / ARO"
    },
    {
      "id": "assistant",
      "label": "Junior Assistant & Clerk"
    }
  ],
  "judiciary": [
    {
      "id": "all",
      "label": "All Courts"
    },
    {
      "id": "court_jja",
      "label": "High Court Clerks & JJA"
    },
    {
      "id": "ro_aro",
      "label": "High Court RO / ARO"
    },
    {
      "id": "steno",
      "label": "PA & Stenographer"
    }
  ],
  "ssc": [
    {
      "id": "all",
      "label": "All SSC"
    },
    {
      "id": "deo",
      "label": "DEO & DEST"
    },
    {
      "id": "assistant",
      "label": "CHSL LDC / JSA"
    },
    {
      "id": "asi",
      "label": "State SSC / Police"
    }
  ],
  "delhi_govt": [
    {
      "id": "all",
      "label": "All Delhi"
    },
    {
      "id": "asi",
      "label": "Delhi Police HCM"
    },
    {
      "id": "assistant",
      "label": "DSSSB & DDA Assistant"
    },
    {
      "id": "steno",
      "label": "DSSSB Stenographer"
    }
  ],
  "defense": [
    {
      "id": "all",
      "label": "All Defense"
    },
    {
      "id": "asi",
      "label": "Paramilitary HCM (BSF / SSB)"
    },
    {
      "id": "assistant",
      "label": "Air Force & Army Clerk"
    },
    {
      "id": "computer_operator",
      "label": "Rajasthan RSSB IA"
    },
    {
      "id": "deo",
      "label": "RSSB NHM DEO"
    }
  ],
  "bihar": [
    {
      "id": "all",
      "label": "All Bihar"
    },
    {
      "id": "deo",
      "label": "Beltron DEO"
    },
    {
      "id": "assistant",
      "label": "BSSC & Vidhan Sabha"
    }
  ],
  "central_nta": [
    {
      "id": "all",
      "label": "All Central & NTA"
    },
    {
      "id": "assistant",
      "label": "JSA & Assistants (KVS/NVS/NTA)"
    }
  ],
  "railways": [
    {
      "id": "all",
      "label": "All Railways"
    },
    {
      "id": "assistant",
      "label": "RRB NTPC Typist"
    }
  ],
  "state_exams": [
    {
      "id": "all",
      "label": "All State Exams"
    },
    {
      "id": "computer_operator",
      "label": "MP CPCT"
    },
    {
      "id": "asi",
      "label": "MP Police ASI"
    },
    {
      "id": "ro_aro",
      "label": "UKPSC RO / ARO"
    },
    {
      "id": "assistant",
      "label": "Clerk & Junior Assistant"
    },
    {
      "id": "steno",
      "label": "UKPSC APS"
    }
  ]
};

export const UNIFIED_EXAM_POSTS: UnifiedExamPost[] = [
  {
    "id": "up-police-co-asi",
    "postTitle": "UP Police Computer Operator & SI/ASI",
    "categoryGroup": "up_govt",
    "examType": "computer_operator",
    "examTypeLabel": "Computer Operator & SI/ASI",
    "organization": "UPPBPB / UP Police",
    "variants": [
      {
        "id": "54",
        "slug": "up-police-si-asi-computer-operator-hindi-typing",
        "title": "UP Police SI/ASI/Computer Operator Hindi Typing",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 406,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "53",
        "slug": "up-police-si-asi-computer-operator-english-typing",
        "title": "UP Police SI/ASI/Computer Operator English Typing",
        "categoryGroup": "up_govt",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 510,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "up-psc-co-grade-b",
    "postTitle": "UPPSC Computer Operator Grade B",
    "categoryGroup": "up_govt",
    "examType": "computer_operator",
    "examTypeLabel": "Computer Operator",
    "organization": "UPPSC",
    "variants": [
      {
        "id": "1340",
        "slug": "uppsc-computer-operator-grade-b-hindi",
        "title": "UPPSC Hindi Computer Operator Grade B",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 350,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "1339",
        "slug": "uppsc-computer-operator-grade-b-english",
        "title": "UPPSC English Computer Operator Grade B",
        "categoryGroup": "up_govt",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "up-police-asi-accounts",
    "postTitle": "UP Police ASI (Accounts)",
    "categoryGroup": "up_govt",
    "examType": "asi",
    "examTypeLabel": "ASI (Accounts)",
    "organization": "UPPBPB / UP Police",
    "variants": [
      {
        "id": "1042",
        "slug": "up-police-asi-accounts-hindi-typing",
        "title": "UP Police ASI Accounts Hindi Typing",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 15,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "uppsc-ro-aro",
    "postTitle": "UPPSC RO / ARO (Review Officer)",
    "categoryGroup": "up_govt",
    "examType": "ro_aro",
    "examTypeLabel": "RO / ARO",
    "organization": "UPPSC",
    "variants": [
      {
        "id": "72",
        "slug": "uppsc-ro-aro-hindi-typing-test",
        "title": "UPPSC RO ARO Hindi Typing Test",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 125,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "71",
        "slug": "uppsc-ro-aro-english-typing-test",
        "title": "UPPSC RO ARO English Typing Test",
        "categoryGroup": "up_govt",
        "language": "english",
        "targetSpeed": 25,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 125,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "uppsc-computer-assistant",
    "postTitle": "UPPSC Computer Assistant",
    "categoryGroup": "up_govt",
    "examType": "assistant",
    "examTypeLabel": "Computer Assistant",
    "organization": "UPPSC",
    "variants": [
      {
        "id": "10",
        "slug": "uppsc-computer-assistant-hindi-typing",
        "title": "UPPSC Computer Assistant Hindi Typing",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 250,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "upsssc-assistants",
    "postTitle": "UPSSSC Junior Assistant / Typist",
    "categoryGroup": "up_govt",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "UPSSSC",
    "variants": [
      {
        "id": "57",
        "slug": "upsssc-assistants-hindi-typing-test",
        "title": "UPSSSC Assistants Hindi Typing Test",
        "categoryGroup": "up_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 5,
        "inputType": "character",
        "inputLimit": 1250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "56",
        "slug": "upsssc-assistants-english-typing-test",
        "title": "UPSSSC Assistants English Typing Test",
        "categoryGroup": "up_govt",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 5,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ahc-ro-aro",
    "postTitle": "Allahabad High Court RO / ARO (Samiksha Adhikari)",
    "categoryGroup": "judiciary",
    "examType": "ro_aro",
    "examTypeLabel": "RO / ARO",
    "organization": "Allahabad High Court",
    "variants": [
      {
        "id": "976",
        "slug": "allahabad-high-court-ro-aro-english-typing-ahc",
        "title": "Allahabad High Court RO/ ARO English Typing (AHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 25,
        "durationMinutes": 20,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ahc-group-c-clerk",
    "postTitle": "Allahabad High Court Group C Clerk & Typist",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Group C Clerk",
    "organization": "Allahabad High Court",
    "variants": [
      {
        "id": "318",
        "slug": "allahabad-high-court-hindi-typing-ahc",
        "title": "Allahabad High Court Hindi Typing (AHC)",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "319",
        "slug": "allahabad-high-court-english-typing-ahc",
        "title": "Allahabad High Court English Typing (AHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "aphc-typist",
    "postTitle": "Andhra Pradesh High Court Assistant & Typist (APHC)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Typist / Assistant",
    "organization": "Andhra Pradesh High Court",
    "variants": [
      {
        "id": "747",
        "slug": "andhra-pradesh-high-court-english-typing-aphc",
        "title": "Andhra Pradesh High Court English Typing (APHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 45,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 450,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bihar-civil-court-reader",
    "postTitle": "Bihar Civil Court Reader cum Deposition Writer",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Court Reader",
    "organization": "Bihar Civil Courts",
    "variants": [
      {
        "id": "66",
        "slug": "bihar-civil-court-hindi-typing-court-reader-cum-deposition-writer",
        "title": "Bihar Civil Court Hindi Typing Court Reader -cum- Deposition Writer",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "65",
        "slug": "bihar-civil-court-english-typing-court-reader-cum-deposition-writer",
        "title": "Bihar Civil Court English Typing Court Reader -cum- Deposition Writer",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bhc-clerk",
    "postTitle": "Bombay High Court Clerk",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Clerk",
    "organization": "Bombay High Court",
    "variants": [
      {
        "id": "382",
        "slug": "bombay-high-court-english-typing-clerk-bhc",
        "title": "Bombay High Court Clerk English Typing (BHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "cghc-jja-computer",
    "postTitle": "Chhattisgarh High Court JJA Computer Typist",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "JJA Computer",
    "organization": "Chhattisgarh High Court",
    "variants": [
      {
        "id": "1209",
        "slug": "chhattisgarh-high-court-jja-computer-english-typing-cghc",
        "title": "Chhattisgarh High Court JJA Computer English Typing (CGHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 25,
        "durationMinutes": 20,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "cghc-jja",
    "postTitle": "Chhattisgarh High Court Junior Judicial Assistant (JJA)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "JJA",
    "organization": "Chhattisgarh High Court",
    "variants": [
      {
        "id": "1208",
        "slug": "chhattisgarh-high-court-jja-hindi-typing-cghc",
        "title": "Chhattisgarh High Court JJA Hindi Typing (CGHC)",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "1207",
        "slug": "chhattisgarh-high-court-jja-english-typing-cghc",
        "title": "Chhattisgarh High Court JJA English Typing (CGHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dsssb-delhi-jja",
    "postTitle": "DSSSB Delhi District & Session Courts JJA",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Session Court JJA",
    "organization": "Delhi District Courts",
    "variants": [
      {
        "id": "25",
        "slug": "dsssb-delhi-jja-hindi-typing-session-court",
        "title": "DSSSB Delhi JJA Hindi Typing Session Court",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1800,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "24",
        "slug": "dsssb-delhi-jja-english-typing-session-court",
        "title": "DSSSB Delhi JJA English Typing Session Court",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2500,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dhc-jja",
    "postTitle": "Delhi High Court Junior Judicial Assistant (JJA)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "JJA",
    "organization": "Delhi High Court",
    "variants": [
      {
        "id": "1075",
        "slug": "delhi-high-court-jja-english-typing-dhc",
        "title": "Delhi High Court JJA English Typing (DHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3500,
        "isRetyping": false,
        "limitErrorPercentage": 3.0,
        "minAccuracy": 97.0
      }
    ]
  },
  {
    "id": "jhc-assistant",
    "postTitle": "Jharkhand High Court Assistant",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "High Court Assistant",
    "organization": "Jharkhand High Court",
    "variants": [
      {
        "id": "60",
        "slug": "jharkhand-high-court-jhc-assistant-clerk-english-hindi-typing",
        "title": "Jharkhand High Court Assistant English Hindi Typing (JHC)",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 20,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 100,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "jhc-deposition-writer",
    "postTitle": "Jharkhand High Court Deposition Writer / Typist",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Deposition Writer",
    "organization": "Jharkhand High Court",
    "variants": [
      {
        "id": "64",
        "slug": "jharkhand-high-court-jhc-deposition-writer-typist-hindi-typing",
        "title": "Jharkhand High Court (JHC) Deposition Writer / Typist Hindi Typing",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "63",
        "slug": "jharkhand-high-court-jhc-deposition-writer-typist-english-typing",
        "title": "Jharkhand High Court (JHC) Deposition Writer / Typist English Typing",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 200,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "mphc-assistant",
    "postTitle": "MP High Court Assistant Grade-3 / Typist",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Assistant Grade-3",
    "organization": "MP High Court Jabalpur",
    "variants": [
      {
        "id": "316",
        "slug": "mp-high-court-hindi-typing-jabalpur-mphc",
        "title": "MP High Court Hindi Typing, Jabalpur",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 350,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "317",
        "slug": "mp-high-court-english-typing-jabalpur-mphc",
        "title": "MP High Court English Typing, Jabalpur",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 350,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "patna-high-court",
    "postTitle": "Patna High Court Computer Operator / Assistant",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Assistant & Operator",
    "organization": "Patna High Court",
    "variants": [
      {
        "id": "1174",
        "slug": "patna-high-court-hindi-typing-test",
        "title": "Patna High Court Hindi Typing Test",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 310,
        "isRetyping": false,
        "limitErrorPercentage": 85.0,
        "minAccuracy": 15.0
      },
      {
        "id": "778",
        "slug": "patna-high-court-english-typing-test",
        "title": "Patna High Court English Typing Test",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 420,
        "isRetyping": false,
        "limitErrorPercentage": 10.0,
        "minAccuracy": 90.0
      }
    ]
  },
  {
    "id": "phhc-clerk",
    "postTitle": "Punjab & Haryana High Court Clerk & Typist (PHHC)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Clerk & Typist",
    "organization": "Punjab & Haryana High Court",
    "variants": [
      {
        "id": "1273",
        "slug": "punjab-haryana-high-court-english-typing-phhc",
        "title": "Punjab & Haryana High Court English Typing (PHHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 600,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "hcraj-ldc",
    "postTitle": "Rajasthan High Court Clerk & LDC (HCRAJ)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Clerk / LDC",
    "organization": "Rajasthan High Court",
    "variants": [
      {
        "id": "55",
        "slug": "rajasthan-high-court-hindi-typing-hcraj",
        "title": "Rajasthan High Court Hindi Typing (HCRAJ)",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2150,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "580",
        "slug": "rajasthan-high-court-english-typing-hcraj",
        "title": "Rajasthan High Court English Typing (HCRAJ)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3000,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "sci-jca",
    "postTitle": "Supreme Court Junior Court Assistant (SCI JCA)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Court Assistant",
    "organization": "Supreme Court of India",
    "variants": [
      {
        "id": "646",
        "slug": "supreme-court-of-india-english-typing-sci-jca",
        "title": "SCI JCA English Typing Skill Test (Supreme Court)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "tshc-typist",
    "postTitle": "Telangana High Court Typist (TSHC)",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "High Court Typist",
    "organization": "Telangana High Court",
    "variants": [
      {
        "id": "516",
        "slug": "telangana-high-court-english-typing-tshc",
        "title": "Telangana High Court English Typing (TSHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 45,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 700,
        "isRetyping": false,
        "limitErrorPercentage": 45.0,
        "minAccuracy": 55.0
      }
    ]
  },
  {
    "id": "ts-judicial-ministerial",
    "postTitle": "Telangana Judicial Ministerial Services",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "Judicial Ministerial",
    "organization": "Telangana Subordinate Courts",
    "variants": [
      {
        "id": "517",
        "slug": "telangana-judicial-ministerial-english-typing-tshc",
        "title": "Telangana Judicial Ministerial English Typing (TSHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 45,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 40.0,
        "minAccuracy": 60.0
      }
    ]
  },
  {
    "id": "uk-high-court",
    "postTitle": "Uttarakhand High Court Clerk / Assistant",
    "categoryGroup": "judiciary",
    "examType": "court_jja",
    "examTypeLabel": "High Court Assistant",
    "organization": "Uttarakhand High Court",
    "variants": [
      {
        "id": "68",
        "slug": "ukhcrec-uttarakhand-high-court-hindi-typing",
        "title": "Uttarakhand High Court Hindi Typing",
        "categoryGroup": "judiciary",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "67",
        "slug": "ukhcrec-uttarakhand-high-court-english-typing",
        "title": "Uttarakhand High Court English Typing",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bhc-pa",
    "postTitle": "Bombay High Court Personal Assistant (PA)",
    "categoryGroup": "judiciary",
    "examType": "steno",
    "examTypeLabel": "Personal Assistant",
    "organization": "Bombay High Court",
    "variants": [
      {
        "id": "613",
        "slug": "bombay-high-court-english-typing-pa-bhc",
        "title": "Bombay High Court PA English Typing (BHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 50,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 510,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dhc-pa-spa",
    "postTitle": "Delhi High Court PA / Senior PA (SPA)",
    "categoryGroup": "judiciary",
    "examType": "steno",
    "examTypeLabel": "PA / SPA",
    "organization": "Delhi High Court",
    "variants": [
      {
        "id": "1372",
        "slug": "delhi-high-court-pa-spa-english-typing-dhc",
        "title": "Delhi High Court PA SPA English Typing (DHC)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 4000,
        "isRetyping": false,
        "limitErrorPercentage": 3.0,
        "minAccuracy": 97.0
      }
    ]
  },
  {
    "id": "jhc-stenography",
    "postTitle": "Jharkhand High Court Stenographer",
    "categoryGroup": "judiciary",
    "examType": "steno",
    "examTypeLabel": "Stenographer",
    "organization": "Jharkhand High Court",
    "variants": [
      {
        "id": "80",
        "slug": "jharkhand-high-court-jhc-stenography-english-typing",
        "title": "Jharkhand High Court (JHC) Stenography English Typing",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "sci-spa-pa",
    "postTitle": "Supreme Court SPA / PA / Court Master",
    "categoryGroup": "judiciary",
    "examType": "steno",
    "examTypeLabel": "PA / SPA / CM",
    "organization": "Supreme Court of India",
    "variants": [
      {
        "id": "349",
        "slug": "supreme-court-of-india-english-typing-sci-spa-pa-cm",
        "title": "SCI SPA, PA, CM English Typing Skill Test (Supreme Court)",
        "categoryGroup": "judiciary",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2100,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bihar-police-bpssc",
    "postTitle": "Bihar Police BPSSC Typing Test",
    "categoryGroup": "ssc",
    "examType": "asi",
    "examTypeLabel": "Police Sub-Inspector / Steno",
    "organization": "BPSSC Bihar",
    "variants": [
      {
        "id": "482",
        "slug": "bihar-police-ssc-bpssc-hindi-typing",
        "title": "Bihar Police SSC (BPSSC) Hindi Typing",
        "categoryGroup": "ssc",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "481",
        "slug": "bihar-police-ssc-bpssc-english-typing",
        "title": "Bihar Police SSC (BPSSC) English Typing",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "odisha-ossc",
    "postTitle": "Odisha OSSC Junior Assistant / Clerk",
    "categoryGroup": "ssc",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "OSSC Odisha",
    "variants": [
      {
        "id": "416",
        "slug": "odisha-ossc-odia-typing",
        "title": "Odisha OSSC Odia Typing",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 16,
        "durationMinutes": 25,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "415",
        "slug": "odisha-ossc-english-typing",
        "title": "Odisha OSSC English Typing",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 37,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ssc-chsl-jsa-ldc",
    "postTitle": "SSC CHSL (LDC / JSA / DEO)",
    "categoryGroup": "ssc",
    "examType": "assistant",
    "examTypeLabel": "CHSL LDC / JSA",
    "organization": "Staff Selection Commission (SSC)",
    "variants": [
      {
        "id": "2",
        "slug": "ssc-chsl-jsa-ldc-hindi-typing-test",
        "title": "SSC CHSL JSA/LDC Hindi Typing Test",
        "categoryGroup": "ssc",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1550,
        "isRetyping": false,
        "limitErrorPercentage": 7.0,
        "minAccuracy": 93.0
      },
      {
        "id": "1",
        "slug": "ssc-chsl-jsa-ldc-english-typing-test",
        "title": "SSC CHSL JSA/LDC English Typing Test",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1800,
        "isRetyping": false,
        "limitErrorPercentage": 7.0,
        "minAccuracy": 93.0
      }
    ]
  },
  {
    "id": "ssc-cgl-deo",
    "postTitle": "SSC CGL Data Entry Operator (DEO)",
    "categoryGroup": "ssc",
    "examType": "deo",
    "examTypeLabel": "CGL DEO",
    "organization": "Staff Selection Commission (SSC)",
    "variants": [
      {
        "id": "3",
        "slug": "ssc-cgl-deo-english-typing-test",
        "title": "SSC CGL DEO English Typing Test",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 27,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 3750,
        "isRetyping": false,
        "limitErrorPercentage": 20.0,
        "minAccuracy": 80.0
      }
    ]
  },
  {
    "id": "ssc-dest-2000",
    "postTitle": "SSC DEST (Min. 2000 Key Depressions)",
    "categoryGroup": "ssc",
    "examType": "deo",
    "examTypeLabel": "DEST 2000",
    "organization": "Staff Selection Commission (SSC)",
    "variants": [
      {
        "id": "5",
        "slug": "ssc-dest-min-2000-key-english-typing",
        "title": "SSC DEST Min. 2000 Key English Typing",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 27,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 2200,
        "isRetyping": false,
        "limitErrorPercentage": 20.0,
        "minAccuracy": 80.0
      }
    ]
  },
  {
    "id": "ssc-dest-3750",
    "postTitle": "SSC DEST (Min. 3750 Key Depressions)",
    "categoryGroup": "ssc",
    "examType": "deo",
    "examTypeLabel": "DEST 3750",
    "organization": "Staff Selection Commission (SSC)",
    "variants": [
      {
        "id": "4",
        "slug": "ssc-dest-min-3750-key-english-typing",
        "title": "SSC DEST Min. 3750 Key English Typing",
        "categoryGroup": "ssc",
        "language": "english",
        "targetSpeed": 50,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 4000,
        "isRetyping": false,
        "limitErrorPercentage": 20.0,
        "minAccuracy": 80.0
      }
    ]
  },
  {
    "id": "delhi-police-hcm",
    "postTitle": "Delhi Police Head Constable Ministerial (HCM)",
    "categoryGroup": "delhi_govt",
    "examType": "asi",
    "examTypeLabel": "HCM",
    "organization": "Delhi Police",
    "variants": [
      {
        "id": "911",
        "slug": "delhi-police-hcm-hindi-typing-skill-test",
        "title": "Delhi Police HCM Hindi Typing Skill Test",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "910",
        "slug": "delhi-police-hcm-english-typing-skill-test",
        "title": "Delhi Police HCM English Typing Skill Test",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dda-aso",
    "postTitle": "DDA Assistant Section Officer (ASO)",
    "categoryGroup": "delhi_govt",
    "examType": "assistant",
    "examTypeLabel": "ASO",
    "organization": "Delhi Development Authority",
    "variants": [
      {
        "id": "185",
        "slug": "dda-aso-hindi-typing",
        "title": "DDA ASO Hindi Typing",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "184",
        "slug": "dda-aso-english-typing",
        "title": "DDA ASO English Typing",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 3250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dda-jsa",
    "postTitle": "DDA Junior Secretariat Assistant (JSA)",
    "categoryGroup": "delhi_govt",
    "examType": "assistant",
    "examTypeLabel": "JSA",
    "organization": "Delhi Development Authority",
    "variants": [
      {
        "id": "218",
        "slug": "dda-jsa-hindi-typing",
        "title": "DDA JSA Hindi Typing",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "217",
        "slug": "dda-jsa-english-typing",
        "title": "DDA JSA English Typing",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dsssb-ldc-ja",
    "postTitle": "DSSSB LDC / Junior Assistant & Investigator",
    "categoryGroup": "delhi_govt",
    "examType": "assistant",
    "examTypeLabel": "LDC & Junior Assistant",
    "organization": "DSSSB Delhi",
    "variants": [
      {
        "id": "21",
        "slug": "dsssb-hindi-typing-ldc-junior-assistant-investigator-2024",
        "title": "DSSSB Hindi Typing LDC, Junior Assistant & Investigator",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3250,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "20",
        "slug": "dsssb-english-typing-ldc-junior-assistant-investigator-2024",
        "title": "DSSSB English Typing LDC, Junior Assistant & Investigator",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 5000,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "delhi-jal-board-ja",
    "postTitle": "Delhi Jal Board Junior Assistant",
    "categoryGroup": "delhi_govt",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "Delhi Jal Board",
    "variants": [
      {
        "id": "75",
        "slug": "delhi-jal-board-dsssb-jr-asst-hindi-typing",
        "title": "Delhi Jal Board Jr. Asst. Hindi Typing",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1800,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "74",
        "slug": "delhi-jal-board-dsssb-jr-asst-english-typing",
        "title": "Delhi Jal Board Jr. Asst. English Typing",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2100,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "dsssb-stenographer",
    "postTitle": "DSSSB Stenographer Speed Test",
    "categoryGroup": "delhi_govt",
    "examType": "steno",
    "examTypeLabel": "Stenographer",
    "organization": "DSSSB Delhi",
    "variants": [
      {
        "id": "23",
        "slug": "dsssb-stenographer-hindi-typing",
        "title": "DSSSB Stenographer Hindi Typing",
        "categoryGroup": "delhi_govt",
        "language": "hindi_mangal",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2100,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "22",
        "slug": "dsssb-stenographer-english-typing",
        "title": "DSSSB Stenographer English Typing",
        "categoryGroup": "delhi_govt",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2500,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "rssb-ia-rajasthan",
    "postTitle": "RSSB Informatics Assistant (IA, Rajasthan)",
    "categoryGroup": "defense",
    "examType": "computer_operator",
    "examTypeLabel": "Informatics Assistant",
    "organization": "RSSB Rajasthan",
    "variants": [
      {
        "id": "82",
        "slug": "rssb-ia-hindi-typing-informatic-assistant-rajasthan",
        "title": "RSSB IA Hindi Typing (Informatic Assistant, Rajasthan)",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 20,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "81",
        "slug": "rssb-ia-english-typing-informatic-assistant-rajasthan",
        "title": "RSSB IA English Typing (Informatic Assistant, Rajasthan))",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 20,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bsf-all-forces-hcm",
    "postTitle": "BSF & All Paramilitary Forces HCM (CRPF / CISF / ITBP)",
    "categoryGroup": "defense",
    "examType": "asi",
    "examTypeLabel": "HCM & Ministerial",
    "organization": "Paramilitary Forces",
    "variants": [
      {
        "id": "86",
        "slug": "bsf-hcm-hindi-typing-test",
        "title": "BSF & All Forces HCM Hindi Typing Test",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2150,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "85",
        "slug": "bsf-hcm-english-typing-test",
        "title": "BSF & All Forces HCM English Typing Test",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ssb-hcm",
    "postTitle": "SSB Head Constable Ministerial (HCM)",
    "categoryGroup": "defense",
    "examType": "asi",
    "examTypeLabel": "HCM",
    "organization": "Sashastra Seema Bal (SSB)",
    "variants": [
      {
        "id": "1241",
        "slug": "ssb-hcm-hindi-typing-skill-test",
        "title": "SSB HCM Hindi Typing Skill Test",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2150,
        "isRetyping": false,
        "limitErrorPercentage": 5.0,
        "minAccuracy": 95.0
      },
      {
        "id": "1240",
        "slug": "ssb-hcm-english-typing-skill-test",
        "title": "SSB HCM English Typing Skill Test",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3750,
        "isRetyping": false,
        "limitErrorPercentage": 5.0,
        "minAccuracy": 95.0
      }
    ]
  },
  {
    "id": "air-force-group-c",
    "postTitle": "Indian Air Force Group C (Clerk / Typist)",
    "categoryGroup": "defense",
    "examType": "assistant",
    "examTypeLabel": "Group C Clerk",
    "organization": "Indian Air Force",
    "variants": [
      {
        "id": "152",
        "slug": "air-force-group-c-hindi-typing",
        "title": "Air Force Group C Hindi Typing",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "151",
        "slug": "air-force-group-c-english-typing",
        "title": "Air Force Group C English Typing",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "army-agniveer-ldc",
    "postTitle": "Indian Army Agniveer Clerk / Store Keeper Technical",
    "categoryGroup": "defense",
    "examType": "assistant",
    "examTypeLabel": "Agniveer Clerk",
    "organization": "Indian Army",
    "variants": [
      {
        "id": "73",
        "slug": "army-agniveer-ldc-store-keeper-english-typing",
        "title": "Army Agniveer LDC/ SKT English Typing",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "jkssb-typing",
    "postTitle": "JKSSB Junior Assistant / Typist (J&K)",
    "categoryGroup": "defense",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "JKSSB",
    "variants": [
      {
        "id": "877",
        "slug": "jkssb-english-typing-skill-test",
        "title": "JKSSB English Typing Skill Test",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 550,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "rssb-ldc-rajasthan",
    "postTitle": "RSSB LDC / Junior Assistant (Rajasthan)",
    "categoryGroup": "defense",
    "examType": "assistant",
    "examTypeLabel": "LDC / Junior Assistant",
    "organization": "RSSB Rajasthan",
    "variants": [
      {
        "id": "62",
        "slug": "rssb-ldc-jr-asst-hindi-typing-rajasthan",
        "title": "RSSB LDC/Jr. Asst. Hindi Typing (Rajasthan)",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "61",
        "slug": "rssb-ldc-jr-asst-english-typing-rajasthan",
        "title": "RSSB LDC/Jr. Asst. English Typing (Rajasthan)",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "rssb-nhm-deo-rajasthan",
    "postTitle": "RSSB NHM Data Entry Operator (Rajasthan)",
    "categoryGroup": "defense",
    "examType": "deo",
    "examTypeLabel": "NHM DEO",
    "organization": "RSSB Rajasthan",
    "variants": [
      {
        "id": "1010",
        "slug": "rssb-nhm-data-entry-operator-hindi-typing-rajasthan",
        "title": "RSSB NHM Data Entry Operator Hindi Typing (Rajasthan)",
        "categoryGroup": "defense",
        "language": "hindi_mangal",
        "targetSpeed": 35,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 1250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "1009",
        "slug": "rssb-nhm-data-entry-operator-english-typing-rajasthan",
        "title": "RSSB NHM Data Entry Operator English Typing (Rajasthan)",
        "categoryGroup": "defense",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 1250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bihar-bssc-inter-level",
    "postTitle": "BSSC 2nd Inter Level (LDC / Clerk)",
    "categoryGroup": "bihar",
    "examType": "assistant",
    "examTypeLabel": "Inter Level LDC",
    "organization": "BSSC Bihar",
    "variants": [
      {
        "id": "7",
        "slug": "bssc-2nd-inter-level-hindi-typing-bihar",
        "title": "BSSC 2nd Inter Level Hindi Typing (Bihar)",
        "categoryGroup": "bihar",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "6",
        "slug": "bssc-2nd-inter-level-english-typing-bihar",
        "title": "BSSC 2nd Inter Level English Typing (Bihar)",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 350,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bihar-jeevika",
    "postTitle": "Bihar Jeevika (BRLPS)",
    "categoryGroup": "bihar",
    "examType": "assistant",
    "examTypeLabel": "Jeevika Staff",
    "organization": "Bihar Rural Livelihoods",
    "variants": [
      {
        "id": "812",
        "slug": "bihar-jeevika-hindi-typing-brlps",
        "title": "Bihar Jeevika Hindi Typing (BRLPS)",
        "categoryGroup": "bihar",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 150,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      },
      {
        "id": "811",
        "slug": "bihar-jeevika-english-typing-brlps",
        "title": "Bihar Jeevika English Typing (BRLPS)",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 5,
        "inputType": "word",
        "inputLimit": 200,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      }
    ]
  },
  {
    "id": "bihar-vidhan-parishad",
    "postTitle": "Bihar Vidhan Parishad Reporter / Clerk",
    "categoryGroup": "bihar",
    "examType": "assistant",
    "examTypeLabel": "Vidhan Parishad",
    "organization": "Bihar Legislature",
    "variants": [
      {
        "id": "18",
        "slug": "bihar-vidhan-parishad-hindi-typing",
        "title": "Bihar Vidhan Parishad Hindi Typing",
        "categoryGroup": "bihar",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      },
      {
        "id": "19",
        "slug": "bihar-vidhan-parishad-english-typing",
        "title": "Bihar Vidhan Parishad English Typing",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      }
    ]
  },
  {
    "id": "bihar-vidhan-sabha",
    "postTitle": "Bihar Vidhan Sabha Assistant / Typist",
    "categoryGroup": "bihar",
    "examType": "assistant",
    "examTypeLabel": "Vidhan Sabha",
    "organization": "Bihar Assembly",
    "variants": [
      {
        "id": "16",
        "slug": "bihar-vidhan-sabha-hindi-typing-test",
        "title": "Bihar Vidhan Sabha Hindi Typing Test",
        "categoryGroup": "bihar",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      },
      {
        "id": "17",
        "slug": "bihar-vidhan-sabha-english-typing-test",
        "title": "Bihar Vidhan Sabha English Typing Test",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 1.5,
        "minAccuracy": 98.5
      }
    ]
  },
  {
    "id": "wbssc-clerkship",
    "postTitle": "WBSSC Clerkship Exam",
    "categoryGroup": "bihar",
    "examType": "assistant",
    "examTypeLabel": "Clerkship",
    "organization": "WBPSC / WBSSC",
    "variants": [
      {
        "id": "79",
        "slug": "wbssc-clerkship-english-typing-wbpsc",
        "title": "WBSSC Clerkship English Typing (WBPSC)",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 20,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bihar-beltron-deo",
    "postTitle": "Bihar Beltron DEO (Data Entry Operator)",
    "categoryGroup": "bihar",
    "examType": "deo",
    "examTypeLabel": "DEO",
    "organization": "Bihar Beltron",
    "variants": [
      {
        "id": "59",
        "slug": "bihar-beltron-deo-hindi-typing-test",
        "title": "Bihar Beltron DEO Hindi Typing Test",
        "categoryGroup": "bihar",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "58",
        "slug": "bihar-beltron-deo-english-typing-test",
        "title": "Bihar Beltron DEO English Typing Test",
        "categoryGroup": "bihar",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2000,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "aiims-cre",
    "postTitle": "AIIMS Common Recruitment Exam (CRE) Assistant",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Administrative Assistant",
    "organization": "AIIMS",
    "variants": [
      {
        "id": "547",
        "slug": "aiims-cre-hindi-typing-skill-test",
        "title": "AIIMS CRE Hindi Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "548",
        "slug": "aiims-cre-english-typing-skill-test",
        "title": "AIIMS CRE English Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 3750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "bhu-junior-clerk",
    "postTitle": "BHU Junior Clerk Typing Test",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Junior Clerk",
    "organization": "Banaras Hindu University",
    "variants": [
      {
        "id": "745",
        "slug": "bhu-junior-clerk-hindi-typing",
        "title": "BHU Junior Clerk Hindi Typing",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "746",
        "slug": "bhu-junior-clerk-english-typing",
        "title": "BHU Junior Clerk English Typing",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 600,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "cbse-junior-assistant",
    "postTitle": "CBSE Junior Assistant",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "CBSE India",
    "variants": [
      {
        "id": "515",
        "slug": "cbse-hindi-typing-skill-test",
        "title": "CBSE Hindi Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "514",
        "slug": "cbse-english-typing-skill-test",
        "title": "CBSE English Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "csir-jsa",
    "postTitle": "CSIR Junior Secretariat Assistant (JSA)",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "JSA",
    "organization": "CSIR India",
    "variants": [
      {
        "id": "713",
        "slug": "csir-jsa-hindi-typing-test",
        "title": "CSIR JSA Hindi Typing Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "712",
        "slug": "csir-jsa-english-typing-test",
        "title": "CSIR JSA English Typing Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "emrs-jsa",
    "postTitle": "EMRS Junior Secretariat Assistant (NESTS)",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "JSA",
    "organization": "Eklavya Model Residential Schools",
    "variants": [
      {
        "id": "77",
        "slug": "emrs-jsa-hindi-typing",
        "title": "EMRS JSA Hindi Typing",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "76",
        "slug": "emrs-jsa-english-typing",
        "title": "EMRS JSA English Typing",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2000,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "jnu-assistants",
    "postTitle": "JNU Junior Assistant & Non-Teaching",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "Jawaharlal Nehru University",
    "variants": [
      {
        "id": "1307",
        "slug": "jnu-assistants-hindi-typing-skill-test",
        "title": "JNU Assistants Hindi Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 3.0,
        "minAccuracy": 97.0
      },
      {
        "id": "1306",
        "slug": "jnu-assistants-english-typing-skill-test",
        "title": "JNU Assistants English Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 3.0,
        "minAccuracy": 97.0
      }
    ]
  },
  {
    "id": "kvs-jsa",
    "postTitle": "KVS Junior Secretariat Assistant (JSA)",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "JSA",
    "organization": "Kendriya Vidyalaya Sangathan",
    "variants": [
      {
        "id": "1109",
        "slug": "kvs-hindi-typing-skill-test",
        "title": "KVS Hindi Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2500,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "1108",
        "slug": "kvs-english-typing-skill-test",
        "title": "KVS English Typing Skill Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 3250,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "nta-central-university",
    "postTitle": "NTA Central Universities Non-Teaching Staff",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Non-Teaching Assistant",
    "organization": "National Testing Agency (NTA)",
    "variants": [
      {
        "id": "12",
        "slug": "nta-central-university-hindi-typing",
        "title": "NTA Central University Hindi Typing",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "11",
        "slug": "nta-central-university-english-typing",
        "title": "NTA Central University English Typing",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "nta-ignou-jat-steno",
    "postTitle": "NTA IGNOU Junior Assistant cum Typist (JAT) / Steno",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "JAT & Steno",
    "organization": "NTA / IGNOU",
    "variants": [
      {
        "id": "15",
        "slug": "nta-ignou-jat-hindi-typing-test",
        "title": "NTA IGNOU JAT/Steno Hindi Typing Test",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "14",
        "slug": "nta-ignou-jat-english-typing-test",
        "title": "NTA IGNOU JAT/Steno English Typing Test",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 45,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2000,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "nta-mgcu-library-assistant",
    "postTitle": "NTA MGCU Library Assistant",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Library Assistant",
    "organization": "NTA / MGCU",
    "variants": [
      {
        "id": "13",
        "slug": "nta-mgcu-library-assistant-english-typing",
        "title": "NTA MGCU Library Assistant English Typing",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "nta-visva-bharati",
    "postTitle": "NTA Visva Bharati Assistant",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "Non-Teaching",
    "organization": "NTA Visva Bharati",
    "variants": [
      {
        "id": "78",
        "slug": "nta-visva-bharati-english-typing",
        "title": "NTA Visva Bharati English Typing",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "nvs-jsa",
    "postTitle": "Navodaya Vidyalaya Samiti JSA (NVS)",
    "categoryGroup": "central_nta",
    "examType": "assistant",
    "examTypeLabel": "JSA",
    "organization": "Navodaya Vidyalaya Samiti",
    "variants": [
      {
        "id": "70",
        "slug": "navoday-jnv-jsa-hindi-typing-nvs",
        "title": "Navoday JNV JSA Hindi Typing (NVS)",
        "categoryGroup": "central_nta",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "69",
        "slug": "navoday-jnv-jsa-english-typing-nvs",
        "title": "Navoday JNV JSA English Typing (NVS)",
        "categoryGroup": "central_nta",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "rrb-ntpc",
    "postTitle": "RRB NTPC Typing Skill Test (Senior Clerk / Typist / JAA)",
    "categoryGroup": "railways",
    "examType": "assistant",
    "examTypeLabel": "Clerk & Typist",
    "organization": "Railway Recruitment Board (RRB)",
    "variants": [
      {
        "id": "285",
        "slug": "rrb-ntpc-hindi-typing-skill-test",
        "title": "RRB NTPC Hindi Typing Skill Test",
        "categoryGroup": "railways",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1250,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "286",
        "slug": "rrb-ntpc-english-typing-skill-test",
        "title": "RRB NTPC English Typing Skill Test",
        "categoryGroup": "railways",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": true,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "mp-cpct",
    "postTitle": "MP CPCT (Computer Proficiency Certification Test)",
    "categoryGroup": "state_exams",
    "examType": "computer_operator",
    "examTypeLabel": "CPCT Certification",
    "organization": "MP MAP_IT",
    "variants": [
      {
        "id": "1142",
        "slug": "mp-cpct-unicode-hindi-typing-skill-test",
        "title": "MP CPCT Unicode Hindi Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 20,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 550,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "1141",
        "slug": "mp-cpct-english-typing-skill-test",
        "title": "MP CPCT English Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "word",
        "inputLimit": 550,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "mp-police-asi-ldc",
    "postTitle": "MP Police ASI (LDC / Ministerial)",
    "categoryGroup": "state_exams",
    "examType": "asi",
    "examTypeLabel": "Police ASI LDC",
    "organization": "MP Police",
    "variants": [
      {
        "id": "1043",
        "slug": "mp-police-asi-ldc-hindi-typing",
        "title": "MP Police ASI LDC Hindi Typing",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 20,
        "durationMinutes": 30,
        "inputType": "word",
        "inputLimit": 600,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ukpsc-ro-aro",
    "postTitle": "UKPSC RO / ARO (Samiksha Adhikari, Uttarakhand)",
    "categoryGroup": "state_exams",
    "examType": "ro_aro",
    "examTypeLabel": "RO / ARO",
    "organization": "UKPSC Uttarakhand",
    "variants": [
      {
        "id": "679",
        "slug": "ukpsc-ro-aro-hindi-typing-uttarakhand",
        "title": "UKPSC RO ARO Hindi Typing (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "680",
        "slug": "ukpsc-ro-aro-english-typing-uttarakhand",
        "title": "UKPSC RO ARO English Typing (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "jssc-inter-level",
    "postTitle": "JSSC Inter Level Typist / Clerk (Jharkhand)",
    "categoryGroup": "state_exams",
    "examType": "assistant",
    "examTypeLabel": "Inter Level Clerk",
    "organization": "JSSC Jharkhand",
    "variants": [
      {
        "id": "118",
        "slug": "jsss-inter-level-hindi-typing",
        "title": "JSSC Inter Level Hindi Typing",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "jci-clerk",
    "postTitle": "Jute Corporation of India (JCI) Junior Assistant",
    "categoryGroup": "state_exams",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "JCI",
    "variants": [
      {
        "id": "250",
        "slug": "jci-english-typing-jute-corporation",
        "title": "JCI English Typing (Jute Corporation)",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 420,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "mpsc-group-c",
    "postTitle": "MPSC Group C Clerk Typist (Maharashtra)",
    "categoryGroup": "state_exams",
    "examType": "assistant",
    "examTypeLabel": "Clerk Typist",
    "organization": "MPSC Maharashtra",
    "variants": [
      {
        "id": "449",
        "slug": "mpsc-group-c-marathi-typing",
        "title": "MPSC Group C Marathi Typing",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 300,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "448",
        "slug": "mpsc-group-c-english-typing",
        "title": "MPSC Group C English Typing",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 35,
        "durationMinutes": 10,
        "inputType": "word",
        "inputLimit": 400,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "spmcil-igm",
    "postTitle": "SPMCIL India Government Mint (IGM) Junior Office Assistant",
    "categoryGroup": "state_exams",
    "examType": "assistant",
    "examTypeLabel": "Office Assistant",
    "organization": "SPMCIL",
    "variants": [
      {
        "id": "84",
        "slug": "spmcil-igm-hindi-typing-skill-test",
        "title": "SPMCIL IGM Hindi Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1575,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "83",
        "slug": "spmcil-igm-english-typing-skill-test",
        "title": "SPMCIL IGM English Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 40,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2100,
        "isRetyping": false,
        "limitErrorPercentage": 5.0,
        "minAccuracy": 95.0
      }
    ]
  },
  {
    "id": "uksssc-clerk",
    "postTitle": "UKSSSC Junior Assistant / Typist (Uttarakhand)",
    "categoryGroup": "state_exams",
    "examType": "assistant",
    "examTypeLabel": "Junior Assistant",
    "organization": "UKSSSC",
    "variants": [
      {
        "id": "284",
        "slug": "uksssc-hindi-typing-skill-test-uttarakhand",
        "title": "UKSSSC Hindi Typing Skill Test (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "283",
        "slug": "uksssc-english-typing-skill-test-uttarakhand",
        "title": "UKSSSC English Typing Skill Test (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 1750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "ukpsc-aps",
    "postTitle": "UKPSC Additional Private Secretary (APS)",
    "categoryGroup": "state_exams",
    "examType": "steno",
    "examTypeLabel": "APS",
    "organization": "UKPSC Uttarakhand",
    "variants": [
      {
        "id": "9",
        "slug": "ukpsc-aps-hindi-typing-uttarakhand",
        "title": "UKPSC APS Hindi Typing (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2500,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "8",
        "slug": "ukpsc-aps-english-typing-uttarakhand",
        "title": "UKPSC APS English Typing (Uttarakhand)",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 10,
        "inputType": "character",
        "inputLimit": 2750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  },
  {
    "id": "speed-marathon",
    "postTitle": "National Speed Typing Marathon (Endurance Test)",
    "categoryGroup": "state_exams",
    "examType": "other",
    "examTypeLabel": "Speed Marathon",
    "organization": "National Benchmark",
    "variants": [
      {
        "id": "943",
        "slug": "marathon-hindi-typing-skill-test",
        "title": "Marathon Hindi Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "hindi_mangal",
        "targetSpeed": 25,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 2250,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      },
      {
        "id": "844",
        "slug": "marathon-english-typing-skill-test",
        "title": "Marathon English Typing Skill Test",
        "categoryGroup": "state_exams",
        "language": "english",
        "targetSpeed": 30,
        "durationMinutes": 15,
        "inputType": "character",
        "inputLimit": 3750,
        "isRetyping": false,
        "limitErrorPercentage": 0.0,
        "minAccuracy": 85.0
      }
    ]
  }
];

export const ALL_EXAMS: ExamProfile[] = [
  {
    "id": "1372",
    "slug": "delhi-high-court-pa-spa-english-typing-dhc",
    "title": "Delhi High Court PA SPA English Typing (DHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 4000,
    "isRetyping": false,
    "limitErrorPercentage": 3.0,
    "minAccuracy": 97.0
  },
  {
    "id": "1340",
    "slug": "uppsc-computer-operator-grade-b-hindi",
    "title": "UPPSC Hindi Computer Operator Grade B",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 350,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1339",
    "slug": "uppsc-computer-operator-grade-b-english",
    "title": "UPPSC English Computer Operator Grade B",
    "categoryGroup": "up_govt",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1307",
    "slug": "jnu-assistants-hindi-typing-skill-test",
    "title": "JNU Assistants Hindi Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 3.0,
    "minAccuracy": 97.0
  },
  {
    "id": "1306",
    "slug": "jnu-assistants-english-typing-skill-test",
    "title": "JNU Assistants English Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 3.0,
    "minAccuracy": 97.0
  },
  {
    "id": "1273",
    "slug": "punjab-haryana-high-court-english-typing-phhc",
    "title": "Punjab & Haryana High Court English Typing (PHHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 600,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1241",
    "slug": "ssb-hcm-hindi-typing-skill-test",
    "title": "SSB HCM Hindi Typing Skill Test",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2150,
    "isRetyping": false,
    "limitErrorPercentage": 5.0,
    "minAccuracy": 95.0
  },
  {
    "id": "1240",
    "slug": "ssb-hcm-english-typing-skill-test",
    "title": "SSB HCM English Typing Skill Test",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3750,
    "isRetyping": false,
    "limitErrorPercentage": 5.0,
    "minAccuracy": 95.0
  },
  {
    "id": "1209",
    "slug": "chhattisgarh-high-court-jja-computer-english-typing-cghc",
    "title": "Chhattisgarh High Court JJA Computer English Typing (CGHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 25,
    "durationMinutes": 20,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1208",
    "slug": "chhattisgarh-high-court-jja-hindi-typing-cghc",
    "title": "Chhattisgarh High Court JJA Hindi Typing (CGHC)",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1207",
    "slug": "chhattisgarh-high-court-jja-english-typing-cghc",
    "title": "Chhattisgarh High Court JJA English Typing (CGHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1174",
    "slug": "patna-high-court-hindi-typing-test",
    "title": "Patna High Court Hindi Typing Test",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 310,
    "isRetyping": false,
    "limitErrorPercentage": 85.0,
    "minAccuracy": 15.0
  },
  {
    "id": "1142",
    "slug": "mp-cpct-unicode-hindi-typing-skill-test",
    "title": "MP CPCT Unicode Hindi Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 20,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 550,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1141",
    "slug": "mp-cpct-english-typing-skill-test",
    "title": "MP CPCT English Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 550,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1109",
    "slug": "kvs-hindi-typing-skill-test",
    "title": "KVS Hindi Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2500,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1108",
    "slug": "kvs-english-typing-skill-test",
    "title": "KVS English Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3250,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1075",
    "slug": "delhi-high-court-jja-english-typing-dhc",
    "title": "Delhi High Court JJA English Typing (DHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3500,
    "isRetyping": false,
    "limitErrorPercentage": 3.0,
    "minAccuracy": 97.0
  },
  {
    "id": "1043",
    "slug": "mp-police-asi-ldc-hindi-typing",
    "title": "MP Police ASI LDC Hindi Typing",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 20,
    "durationMinutes": 30,
    "inputType": "word",
    "inputLimit": 600,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1042",
    "slug": "up-police-asi-accounts-hindi-typing",
    "title": "UP Police ASI Accounts Hindi Typing",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 15,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1010",
    "slug": "rssb-nhm-data-entry-operator-hindi-typing-rajasthan",
    "title": "RSSB NHM Data Entry Operator Hindi Typing (Rajasthan)",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 35,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 1250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "1009",
    "slug": "rssb-nhm-data-entry-operator-english-typing-rajasthan",
    "title": "RSSB NHM Data Entry Operator English Typing (Rajasthan)",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 1250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "976",
    "slug": "allahabad-high-court-ro-aro-english-typing-ahc",
    "title": "Allahabad High Court RO/ ARO English Typing (AHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 25,
    "durationMinutes": 20,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "943",
    "slug": "marathon-hindi-typing-skill-test",
    "title": "Marathon Hindi Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "911",
    "slug": "delhi-police-hcm-hindi-typing-skill-test",
    "title": "Delhi Police HCM Hindi Typing Skill Test",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "910",
    "slug": "delhi-police-hcm-english-typing-skill-test",
    "title": "Delhi Police HCM English Typing Skill Test",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "877",
    "slug": "jkssb-english-typing-skill-test",
    "title": "JKSSB English Typing Skill Test",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 550,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "844",
    "slug": "marathon-english-typing-skill-test",
    "title": "Marathon English Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 3750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "812",
    "slug": "bihar-jeevika-hindi-typing-brlps",
    "title": "Bihar Jeevika Hindi Typing (BRLPS)",
    "categoryGroup": "bihar",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 150,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "811",
    "slug": "bihar-jeevika-english-typing-brlps",
    "title": "Bihar Jeevika English Typing (BRLPS)",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 200,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "778",
    "slug": "patna-high-court-english-typing-test",
    "title": "Patna High Court English Typing Test",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 420,
    "isRetyping": false,
    "limitErrorPercentage": 10.0,
    "minAccuracy": 90.0
  },
  {
    "id": "747",
    "slug": "andhra-pradesh-high-court-english-typing-aphc",
    "title": "Andhra Pradesh High Court English Typing (APHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 45,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 450,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "746",
    "slug": "bhu-junior-clerk-english-typing",
    "title": "BHU Junior Clerk English Typing",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 600,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "745",
    "slug": "bhu-junior-clerk-hindi-typing",
    "title": "BHU Junior Clerk Hindi Typing",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "713",
    "slug": "csir-jsa-hindi-typing-test",
    "title": "CSIR JSA Hindi Typing Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "712",
    "slug": "csir-jsa-english-typing-test",
    "title": "CSIR JSA English Typing Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "680",
    "slug": "ukpsc-ro-aro-english-typing-uttarakhand",
    "title": "UKPSC RO ARO English Typing (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "679",
    "slug": "ukpsc-ro-aro-hindi-typing-uttarakhand",
    "title": "UKPSC RO ARO Hindi Typing (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "646",
    "slug": "supreme-court-of-india-english-typing-sci-jca",
    "title": "SCI JCA English Typing Skill Test (Supreme Court)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "613",
    "slug": "bombay-high-court-english-typing-pa-bhc",
    "title": "Bombay High Court PA English Typing (BHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 50,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 510,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "580",
    "slug": "rajasthan-high-court-english-typing-hcraj",
    "title": "Rajasthan High Court English Typing (HCRAJ)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3000,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "548",
    "slug": "aiims-cre-english-typing-skill-test",
    "title": "AIIMS CRE English Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 3750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "547",
    "slug": "aiims-cre-hindi-typing-skill-test",
    "title": "AIIMS CRE Hindi Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "517",
    "slug": "telangana-judicial-ministerial-english-typing-tshc",
    "title": "Telangana Judicial Ministerial English Typing (TSHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 45,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 40.0,
    "minAccuracy": 60.0
  },
  {
    "id": "516",
    "slug": "telangana-high-court-english-typing-tshc",
    "title": "Telangana High Court English Typing (TSHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 45,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 700,
    "isRetyping": false,
    "limitErrorPercentage": 45.0,
    "minAccuracy": 55.0
  },
  {
    "id": "515",
    "slug": "cbse-hindi-typing-skill-test",
    "title": "CBSE Hindi Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "514",
    "slug": "cbse-english-typing-skill-test",
    "title": "CBSE English Typing Skill Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "482",
    "slug": "bihar-police-ssc-bpssc-hindi-typing",
    "title": "Bihar Police SSC (BPSSC) Hindi Typing",
    "categoryGroup": "ssc",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "481",
    "slug": "bihar-police-ssc-bpssc-english-typing",
    "title": "Bihar Police SSC (BPSSC) English Typing",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "449",
    "slug": "mpsc-group-c-marathi-typing",
    "title": "MPSC Group C Marathi Typing",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "448",
    "slug": "mpsc-group-c-english-typing",
    "title": "MPSC Group C English Typing",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "416",
    "slug": "odisha-ossc-odia-typing",
    "title": "Odisha OSSC Odia Typing",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 16,
    "durationMinutes": 25,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "415",
    "slug": "odisha-ossc-english-typing",
    "title": "Odisha OSSC English Typing",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 37,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "382",
    "slug": "bombay-high-court-english-typing-clerk-bhc",
    "title": "Bombay High Court Clerk English Typing (BHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "349",
    "slug": "supreme-court-of-india-english-typing-sci-spa-pa-cm",
    "title": "SCI SPA, PA, CM English Typing Skill Test (Supreme Court)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2100,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "319",
    "slug": "allahabad-high-court-english-typing-ahc",
    "title": "Allahabad High Court English Typing (AHC)",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "318",
    "slug": "allahabad-high-court-hindi-typing-ahc",
    "title": "Allahabad High Court Hindi Typing (AHC)",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "317",
    "slug": "mp-high-court-english-typing-jabalpur-mphc",
    "title": "MP High Court English Typing, Jabalpur",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 350,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "316",
    "slug": "mp-high-court-hindi-typing-jabalpur-mphc",
    "title": "MP High Court Hindi Typing, Jabalpur",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 350,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "286",
    "slug": "rrb-ntpc-english-typing-skill-test",
    "title": "RRB NTPC English Typing Skill Test",
    "categoryGroup": "railways",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "285",
    "slug": "rrb-ntpc-hindi-typing-skill-test",
    "title": "RRB NTPC Hindi Typing Skill Test",
    "categoryGroup": "railways",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1250,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "284",
    "slug": "uksssc-hindi-typing-skill-test-uttarakhand",
    "title": "UKSSSC Hindi Typing Skill Test (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "283",
    "slug": "uksssc-english-typing-skill-test-uttarakhand",
    "title": "UKSSSC English Typing Skill Test (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "250",
    "slug": "jci-english-typing-jute-corporation",
    "title": "JCI English Typing (Jute Corporation)",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 420,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "218",
    "slug": "dda-jsa-hindi-typing",
    "title": "DDA JSA Hindi Typing",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "217",
    "slug": "dda-jsa-english-typing",
    "title": "DDA JSA English Typing",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "185",
    "slug": "dda-aso-hindi-typing",
    "title": "DDA ASO Hindi Typing",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "184",
    "slug": "dda-aso-english-typing",
    "title": "DDA ASO English Typing",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 3250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "152",
    "slug": "air-force-group-c-hindi-typing",
    "title": "Air Force Group C Hindi Typing",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "151",
    "slug": "air-force-group-c-english-typing",
    "title": "Air Force Group C English Typing",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "118",
    "slug": "jsss-inter-level-hindi-typing",
    "title": "JSSC Inter Level Hindi Typing",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "86",
    "slug": "bsf-hcm-hindi-typing-test",
    "title": "BSF & All Forces HCM Hindi Typing Test",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2150,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "85",
    "slug": "bsf-hcm-english-typing-test",
    "title": "BSF & All Forces HCM English Typing Test",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "84",
    "slug": "spmcil-igm-hindi-typing-skill-test",
    "title": "SPMCIL IGM Hindi Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1575,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "83",
    "slug": "spmcil-igm-english-typing-skill-test",
    "title": "SPMCIL IGM English Typing Skill Test",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2100,
    "isRetyping": false,
    "limitErrorPercentage": 5.0,
    "minAccuracy": 95.0
  },
  {
    "id": "82",
    "slug": "rssb-ia-hindi-typing-informatic-assistant-rajasthan",
    "title": "RSSB IA Hindi Typing (Informatic Assistant, Rajasthan)",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 20,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "81",
    "slug": "rssb-ia-english-typing-informatic-assistant-rajasthan",
    "title": "RSSB IA English Typing (Informatic Assistant, Rajasthan))",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 20,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "80",
    "slug": "jharkhand-high-court-jhc-stenography-english-typing",
    "title": "Jharkhand High Court (JHC) Stenography English Typing",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "79",
    "slug": "wbssc-clerkship-english-typing-wbpsc",
    "title": "WBSSC Clerkship English Typing (WBPSC)",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 20,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "78",
    "slug": "nta-visva-bharati-english-typing",
    "title": "NTA Visva Bharati English Typing",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "77",
    "slug": "emrs-jsa-hindi-typing",
    "title": "EMRS JSA Hindi Typing",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "76",
    "slug": "emrs-jsa-english-typing",
    "title": "EMRS JSA English Typing",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2000,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "75",
    "slug": "delhi-jal-board-dsssb-jr-asst-hindi-typing",
    "title": "Delhi Jal Board Jr. Asst. Hindi Typing",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1800,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "74",
    "slug": "delhi-jal-board-dsssb-jr-asst-english-typing",
    "title": "Delhi Jal Board Jr. Asst. English Typing",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2100,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "73",
    "slug": "army-agniveer-ldc-store-keeper-english-typing",
    "title": "Army Agniveer LDC/ SKT English Typing",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "72",
    "slug": "uppsc-ro-aro-hindi-typing-test",
    "title": "UPPSC RO ARO Hindi Typing Test",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 125,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "71",
    "slug": "uppsc-ro-aro-english-typing-test",
    "title": "UPPSC RO ARO English Typing Test",
    "categoryGroup": "up_govt",
    "language": "english",
    "targetSpeed": 25,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 125,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "70",
    "slug": "navoday-jnv-jsa-hindi-typing-nvs",
    "title": "Navoday JNV JSA Hindi Typing (NVS)",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "69",
    "slug": "navoday-jnv-jsa-english-typing-nvs",
    "title": "Navoday JNV JSA English Typing (NVS)",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "68",
    "slug": "ukhcrec-uttarakhand-high-court-hindi-typing",
    "title": "Uttarakhand High Court Hindi Typing",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "67",
    "slug": "ukhcrec-uttarakhand-high-court-english-typing",
    "title": "Uttarakhand High Court English Typing",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "66",
    "slug": "bihar-civil-court-hindi-typing-court-reader-cum-deposition-writer",
    "title": "Bihar Civil Court Hindi Typing Court Reader -cum- Deposition Writer",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "65",
    "slug": "bihar-civil-court-english-typing-court-reader-cum-deposition-writer",
    "title": "Bihar Civil Court English Typing Court Reader -cum- Deposition Writer",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "64",
    "slug": "jharkhand-high-court-jhc-deposition-writer-typist-hindi-typing",
    "title": "Jharkhand High Court (JHC) Deposition Writer / Typist Hindi Typing",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "63",
    "slug": "jharkhand-high-court-jhc-deposition-writer-typist-english-typing",
    "title": "Jharkhand High Court (JHC) Deposition Writer / Typist English Typing",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 200,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "62",
    "slug": "rssb-ldc-jr-asst-hindi-typing-rajasthan",
    "title": "RSSB LDC/Jr. Asst. Hindi Typing (Rajasthan)",
    "categoryGroup": "defense",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "61",
    "slug": "rssb-ldc-jr-asst-english-typing-rajasthan",
    "title": "RSSB LDC/Jr. Asst. English Typing (Rajasthan)",
    "categoryGroup": "defense",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "60",
    "slug": "jharkhand-high-court-jhc-assistant-clerk-english-hindi-typing",
    "title": "Jharkhand High Court Assistant English Hindi Typing (JHC)",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 20,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 100,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "59",
    "slug": "bihar-beltron-deo-hindi-typing-test",
    "title": "Bihar Beltron DEO Hindi Typing Test",
    "categoryGroup": "bihar",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "58",
    "slug": "bihar-beltron-deo-english-typing-test",
    "title": "Bihar Beltron DEO English Typing Test",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2000,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "57",
    "slug": "upsssc-assistants-hindi-typing-test",
    "title": "UPSSSC Assistants Hindi Typing Test",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 5,
    "inputType": "character",
    "inputLimit": 1250,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "56",
    "slug": "upsssc-assistants-english-typing-test",
    "title": "UPSSSC Assistants English Typing Test",
    "categoryGroup": "up_govt",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 5,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "55",
    "slug": "rajasthan-high-court-hindi-typing-hcraj",
    "title": "Rajasthan High Court Hindi Typing (HCRAJ)",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2150,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "54",
    "slug": "up-police-si-asi-computer-operator-hindi-typing",
    "title": "UP Police SI/ASI/Computer Operator Hindi Typing",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 406,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "53",
    "slug": "up-police-si-asi-computer-operator-english-typing",
    "title": "UP Police SI/ASI/Computer Operator English Typing",
    "categoryGroup": "up_govt",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 15,
    "inputType": "word",
    "inputLimit": 510,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "25",
    "slug": "dsssb-delhi-jja-hindi-typing-session-court",
    "title": "DSSSB Delhi JJA Hindi Typing Session Court",
    "categoryGroup": "judiciary",
    "language": "hindi_mangal",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1800,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "24",
    "slug": "dsssb-delhi-jja-english-typing-session-court",
    "title": "DSSSB Delhi JJA English Typing Session Court",
    "categoryGroup": "judiciary",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2500,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "23",
    "slug": "dsssb-stenographer-hindi-typing",
    "title": "DSSSB Stenographer Hindi Typing",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2100,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "22",
    "slug": "dsssb-stenographer-english-typing",
    "title": "DSSSB Stenographer English Typing",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2500,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "21",
    "slug": "dsssb-hindi-typing-ldc-junior-assistant-investigator-2024",
    "title": "DSSSB Hindi Typing LDC, Junior Assistant & Investigator",
    "categoryGroup": "delhi_govt",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 3250,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "20",
    "slug": "dsssb-english-typing-ldc-junior-assistant-investigator-2024",
    "title": "DSSSB English Typing LDC, Junior Assistant & Investigator",
    "categoryGroup": "delhi_govt",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 5000,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "19",
    "slug": "bihar-vidhan-parishad-english-typing",
    "title": "Bihar Vidhan Parishad English Typing",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "18",
    "slug": "bihar-vidhan-parishad-hindi-typing",
    "title": "Bihar Vidhan Parishad Hindi Typing",
    "categoryGroup": "bihar",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "17",
    "slug": "bihar-vidhan-sabha-english-typing-test",
    "title": "Bihar Vidhan Sabha English Typing Test",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "16",
    "slug": "bihar-vidhan-sabha-hindi-typing-test",
    "title": "Bihar Vidhan Sabha Hindi Typing Test",
    "categoryGroup": "bihar",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 400,
    "isRetyping": false,
    "limitErrorPercentage": 1.5,
    "minAccuracy": 98.5
  },
  {
    "id": "15",
    "slug": "nta-ignou-jat-hindi-typing-test",
    "title": "NTA IGNOU JAT/Steno Hindi Typing Test",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 40,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "14",
    "slug": "nta-ignou-jat-english-typing-test",
    "title": "NTA IGNOU JAT/Steno English Typing Test",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 45,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2000,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "13",
    "slug": "nta-mgcu-library-assistant-english-typing",
    "title": "NTA MGCU Library Assistant English Typing",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "12",
    "slug": "nta-central-university-hindi-typing",
    "title": "NTA Central University Hindi Typing",
    "categoryGroup": "central_nta",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "11",
    "slug": "nta-central-university-english-typing",
    "title": "NTA Central University English Typing",
    "categoryGroup": "central_nta",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "10",
    "slug": "uppsc-computer-assistant-hindi-typing",
    "title": "UPPSC Computer Assistant Hindi Typing",
    "categoryGroup": "up_govt",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 5,
    "inputType": "word",
    "inputLimit": 250,
    "isRetyping": true,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "9",
    "slug": "ukpsc-aps-hindi-typing-uttarakhand",
    "title": "UKPSC APS Hindi Typing (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "hindi_mangal",
    "targetSpeed": 25,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2500,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "8",
    "slug": "ukpsc-aps-english-typing-uttarakhand",
    "title": "UKPSC APS English Typing (Uttarakhand)",
    "categoryGroup": "state_exams",
    "language": "english",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 2750,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "7",
    "slug": "bssc-2nd-inter-level-hindi-typing-bihar",
    "title": "BSSC 2nd Inter Level Hindi Typing (Bihar)",
    "categoryGroup": "bihar",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 300,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "6",
    "slug": "bssc-2nd-inter-level-english-typing-bihar",
    "title": "BSSC 2nd Inter Level English Typing (Bihar)",
    "categoryGroup": "bihar",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "word",
    "inputLimit": 350,
    "isRetyping": false,
    "limitErrorPercentage": 0.0,
    "minAccuracy": 85.0
  },
  {
    "id": "5",
    "slug": "ssc-dest-min-2000-key-english-typing",
    "title": "SSC DEST Min. 2000 Key English Typing",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 27,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 2200,
    "isRetyping": false,
    "limitErrorPercentage": 20.0,
    "minAccuracy": 80.0
  },
  {
    "id": "4",
    "slug": "ssc-dest-min-3750-key-english-typing",
    "title": "SSC DEST Min. 3750 Key English Typing",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 50,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 4000,
    "isRetyping": false,
    "limitErrorPercentage": 20.0,
    "minAccuracy": 80.0
  },
  {
    "id": "3",
    "slug": "ssc-cgl-deo-english-typing-test",
    "title": "SSC CGL DEO English Typing Test",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 27,
    "durationMinutes": 15,
    "inputType": "character",
    "inputLimit": 3750,
    "isRetyping": false,
    "limitErrorPercentage": 20.0,
    "minAccuracy": 80.0
  },
  {
    "id": "2",
    "slug": "ssc-chsl-jsa-ldc-hindi-typing-test",
    "title": "SSC CHSL JSA/LDC Hindi Typing Test",
    "categoryGroup": "ssc",
    "language": "hindi_mangal",
    "targetSpeed": 30,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1550,
    "isRetyping": false,
    "limitErrorPercentage": 7.0,
    "minAccuracy": 93.0
  },
  {
    "id": "1",
    "slug": "ssc-chsl-jsa-ldc-english-typing-test",
    "title": "SSC CHSL JSA/LDC English Typing Test",
    "categoryGroup": "ssc",
    "language": "english",
    "targetSpeed": 35,
    "durationMinutes": 10,
    "inputType": "character",
    "inputLimit": 1800,
    "isRetyping": false,
    "limitErrorPercentage": 7.0,
    "minAccuracy": 93.0
  }
];
