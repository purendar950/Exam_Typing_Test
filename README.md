# Exam Typing (ExamTyping.in) 🎯

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg?logo=vite)](https://vitejs.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **High-Performance Typing Test Simulation & Assessment Platform for Competitive Government Examinations**  
> Tailored for UP Police (Computer Operator Grade-A, ASI Clerk/Accounts, SI), UPSSSC Junior Assistant, SSC (CGL, CHSL DEST), RRB NTPC, High Courts, and State Secretariats.

🌐 **Live Demo:** [https://purendar950.github.io/Typing-computer-operator-/](https://purendar950.github.io/Typing-computer-operator-/)  
*(If renamed to `Exam_Typing_Test`: `https://purendar950.github.io/Exam_Typing_Test/`)*

---

## 📌 Non-Affiliation Disclaimer

> **IMPORTANT LEGAL NOTICE**: **Exam Typing** is an independent, community-driven, open-source educational platform created solely for typing practice, speed benchmarking, and candidate self-assessment. It is **not affiliated with, associated with, endorsed by, or in any way officially connected** with the Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB), Uttar Pradesh Subordinate Services Selection Commission (UPSSSC), Staff Selection Commission (SSC), Railway Recruitment Boards (RRB), High Courts, Tata Consultancy Services (TCS), Eduquity Technologies, or any other government authority or examination agency. All exam names, logos, emblems, and criteria are referenced solely for identification and educational purposes under fair use.

---

## ✨ Features & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EXAM TYPING PLATFORM                            │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│   129+ Exam Series  │  Dual Hindi Engines      │   Official Scoring    │
│  • UP Police CO/ASI │  • Mangal Inscript       │  • UPPRPB 85% Cutoff  │
│  • SSC CGL/CHSL DEST│  • Kruti Dev 010 (Rem.)  │  • SSC Full/Half Pen. │
│  • High Courts & RRB│  • Unicode NFKC Normal.  │  • HC 50-Mark System  │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│   Exam Safeguards   │  Diagnostic Analytics    │   Local & Cloud Sync  │
│  • Anti-Cheat Guard │  • Side-by-Side Diff     │  • Candidate Dossier  │
│  • Real-Time Timer  │  • Targeted Mistake Drill│  • LocalStorage & DB  │
│  • Backspace Modes  │  • WPM / Accuracy Graphs │  • Printable Cards    │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

### 1. 🏛️ Curated Exam Profiles & Realistic Benchmarks
Benchmarks are based on published recruitment board notifications and syllabus standards:
- **UP Police Computer Operator Grade-A & ASI (Clerk / Accounts)**:
  - Hindi: $\ge 25$ Net WPM on Mangal Inscript with $85.0\%$ qualifying accuracy (15 mins).
  - English: $\ge 30$ Net WPM with $85.0\%$ qualifying accuracy (15 mins).
- **UPSSSC Junior Assistant & Steno**: 25 Net WPM Hindi (Mangal or Kruti Dev 010) + 30 Net WPM English (5 mins each).
- **SSC CHSL & CGL (DEST)**: 35 WPM English (10,500 KDPH) or 30 WPM Hindi (9,000 KDPH) with official 5%–7% error deduction.
- **Allahabad & Patna High Courts**: 25–30 WPM with strict 50-mark model and 3% error tolerance limits.
- **MP CPCT**: Speed and score-band percentile matrix for both languages.

### 2. ⌨️ Bilingual Input & Transliteration Engine
- **Mangal Unicode Inscript Layout**: Native browser-level Inscript character and conjunct assembly with full Shift and AltGr emulation.
- **Kruti Dev 010 Legacy Layout**: Real-time Remington mapping translating standard keystrokes to authentic Kruti Dev glyphs without external software.
- **Unicode Normalizer**: NFKC and Nukta standardization prevents false character penalties between decomposed characters.

### 3. 🔒 Exam-Condition Simulation & Anti-Cheat Guards
- Automatic blocking of clipboard operations (`cut`, `copy`, `paste`).
- Disabled right-click context menu and browser navigation intercepts during active tests.
- Configurable backspace restriction modes:
  - **Full Backspace** (Standard practice)
  - **Word-Level Backspace Only** (Current word editing only)
  - **Disabled Backspace** (High Court & strict examination pattern)
- Mechanical switch audio feedback synthesized via Web Audio API.

### 4. 📊 Detailed Evaluation & Diagnostic Diff
- Real-time Net WPM, Gross WPM, Accuracy %, Total Keystrokes, and Mistake count.
- Full vs Half mistake tokenization using Levenshtein distance sequence alignment.
- **Color-Coded Visual Diff**: Green for accurate entries, red for substitutions, strikethrough for omissions, and blue for insertions.
- **Targeted Practice Mode**: Auto-generate customized drills instantly targeting your specific mistyped words.

---

## 📖 Educational Content & Fair-Use Notice

The typing passages included in this repository consist of:
1. Publicly accessible educational articles, historical summaries, and general knowledge digests.
2. Open public government notification transcripts and non-copyrighted civic texts.
3. User-contributed community typing drills.

No confidential, proprietary, or copyrighted commercial examination question papers are hosted or distributed. If you believe any passage infringes upon your copyright, please open an issue or pull request for immediate review or removal.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later)
- [pnpm](https://pnpm.io/) (preferred package manager)

```bash
# 1. Clone the repository
git clone https://github.com/purendar950/Typing-computer-operator-.git
cd Typing-computer-operator-

# 2. Install dependencies
pnpm install

# 3. Start local development server
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
# Build production bundle to /dist
pnpm build

# Preview production build locally
pnpm preview
```

---

## 🌐 Deployment

### GitHub Pages (Automated via GitHub Actions)
1. Fork or push this repository to your GitHub account.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. The site will automatically build and publish to your GitHub Pages URL.

### Vercel / Netlify
- **Vercel**: Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Framework preset is auto-detected as Vite.
- **Netlify**: Connect the repository at [app.netlify.com](https://app.netlify.com). Build command: `pnpm build`, publish directory: `dist`.

---

## 🏷️ Recommended GitHub Topics & Metadata

For optimal discoverability on GitHub, configure your repository **About** settings with:

- **Description:** `⚡ High-performance examination typing test simulator for UP Police Computer Operator, ASI, UPSSSC, SSC DEST, RRB & High Courts with Mangal Inscript, Kruti Dev & real-time evaluation.`
- **Website:** `https://purendar950.github.io/Typing-computer-operator-/`
- **Topics:**
  `typing-test`, `hindi-typing`, `mangal-inscript`, `krutidev`, `upprpb`, `computer-operator`, `react`, `typescript`, `vite`, `pwa`, `exam-preparation`

---

## 💡 How to Rename Repository on GitHub

If you wish to rename the repository from `Typing-computer-operator-` to `Exam_Typing_Test`:

1. On GitHub, navigate to your repository: `https://github.com/purendar950/Typing-computer-operator-`
2. Click **Settings** (top right tab).
3. Under **General** → **Repository name**, enter `Exam_Typing_Test` (or `exam-typing-test`).
4. Click **Rename**.
5. Update your local git remote:
   ```bash
   git remote set-url origin https://github.com/purendar950/Exam_Typing_Test.git
   ```
*(Note: GitHub automatically redirects traffic from the old URL to the new one).*

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on proposing new exam benchmarks, submitting passages, or reporting bugs.

See our [ROADMAP.md](ROADMAP.md) for current milestones and upcoming features.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
