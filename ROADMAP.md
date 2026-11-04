# Exam Typing Project Roadmap 🗺️

This document outlines the development milestones, completed features, and future plans for **Exam Typing**.

---

## 🏁 Phase 1: Core Simulation Engine & Exam Bank (Completed ✅)

- [x] **129+ Government Typing Exam Profiles**: Curated benchmarks for UP Police (Computer Operator, ASI, SI), UPSSSC, SSC (CGL, CHSL DEST), RRB NTPC, High Courts (Allahabad, Delhi, Patna, MP, Bombay), MP CPCT, and State Secretariats.
- [x] **Bilingual Support & Hindi Engines**:
  - Unicode Mangal Inscript layout emulation.
  - Kruti Dev 010 Remington font mapping.
  - Unicode NFKC & Nukta normalizer.
- [x] **Authentic Scoring Models**:
  - UPPRPB standard deduction model.
  - Staff Selection Commission (SSC) DEST half/full mistake rules.
  - Allahabad High Court 50-mark model.
  - Delhi/Patna High Court 3% error tolerance model.
  - MP CPCT percentile and speed-band categorization.
- [x] **Exam Rigor Safeguards**:
  - Anti-cheat prevention (clipboard cut/copy/paste disabled).
  - Exact time limits (5, 10, 15, and 20-minute official blocks).
  - Configurable backspace restrictions (Full, Disabled, or Within-Word-Only).
- [x] **Diagnostic Analytics**:
  - Gross WPM, Net WPM, Accuracy %, Total Keystrokes, Full vs Half Mistakes.
  - Word-by-word side-by-side visual diff.
  - Targeted drill generator for miskeyed tokens.
- [x] **Emblem & Logo Integration**: 36+ verified exam emblems and logos for all exam series.

---

## ⚡ Phase 2: Community Standards & Open Source Maturity (Current 🚀)

- [x] **Open-Source License**: MIT License adoption.
- [x] **Community Governance**: `CONTRIBUTING.md`, Issue Templates, and PR workflows.
- [x] **GitHub Linguist Optimization**: `.gitattributes` for proper repository language statistics.
- [x] **Brand Independence**: Elimination of third-party trademark imitations and establishment of independent identity.
- [ ] **PWA Offline Mode Enhancement**: Full offline caching of all 1,000+ passage datasets via Workbox service worker.
- [ ] **Keyboard Sound Themes**: Additional mechanical switch audio profiles (Cherry MX Blue, Brown, Red, Topre).

---

## 🔮 Phase 3: Advanced Training Tools (Upcoming 🎯)

- [ ] **Custom Passage Importer**: Allow users to paste their own practice text or upload `.txt`/`.docx` files with auto-word counts.
- [ ] **Stenography / Audio Dictation Mode**: Audio-accompanied typing tests for High Court and SSC Steno candidates (80 WPM / 100 WPM dictation).
- [ ] **Printable Candidate Dossier**: One-click PDF generation of exam scorecard with candidate photo, roll number, and official pass/fail stamp.
- [ ] **Multiplayer Live Exam Rooms**: Real-time mock examination lobbies with synchronized timers and live candidate leaderboards.

---

## 🌐 Phase 4: Expansion & Accessibility (Future 🔭)

- [ ] **Regional Language Expansions**:
  - Marathi (APS-C-DV-Prakash / Unicode)
  - Punjabi (Raavi / Asees)
  - Bengali, Tamil, Telugu typing layouts.
- [ ] **Mobile & Tablet Native Builds**: Capacitor-based Android build for physical OTG keyboard practice on tablets and smartphones.
- [ ] **Detailed Analytics Dashboard**: Long-term speed progression charts, error heatmaps by keyboard row, and finger-weakness diagnostics.
