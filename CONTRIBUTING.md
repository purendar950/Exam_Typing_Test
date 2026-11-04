# Contributing to Exam Typing 🚀

Thank you for your interest in contributing to **Exam Typing**! This project is an open-source typing simulation and assessment platform built for government examination candidates across India (UP Police, SSC, UPSSSC, RRB, High Courts, MP CPCT, and more).

Whether you are fixing a bug, adding new exam benchmarks, contributing educational typing passages, or improving accessibility, your contributions are welcome.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later
- **pnpm**: v8.0.0 or later (preferred package manager)
- **Git**

### Installation

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/Exam_Typing_Test.git
   cd Exam_Typing_Test
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Start the local development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Verify build before submitting**:
   ```bash
   pnpm build
   ```

---

## 🎯 How to Contribute

### 1. Adding or Updating Exam Benchmarks
Exam configurations reside in [`src/data/allExams.ts`](src/data/allExams.ts). Each exam profile defines:
- Target speed (Net WPM)
- Minimum accuracy percentage
- Test duration (minutes)
- Permissible backspace rules
- Official scoring model (`upprpb`, `ssc_dest`, `court_ahc`, `court_delhi`, `mp_cpct`, `tcs_strict`)
- Applicable Hindi fonts (`Mangal Inscript`, `Kruti Dev 010`, or `Remington CBI`)

When updating or adding an exam profile:
- Cite the official recruitment board notification or syllabus in your pull request description.
- Ensure speed and accuracy calculations conform to the recruitment board's published rules.

### 2. Contributing Practice Passages
Passages are organized in [`src/data/passages.ts`](src/data/passages.ts).
- Passages must consist of educational content, public domain transcripts, or original practice text.
- Do not submit copyrighted materials or unverified exam papers.
- For Hindi passages, ensure proper Unicode Devanagari normalization (NFC) or standard Kruti Dev character encoding.

### 3. Improving Typing Engines & Evaluation
- **Hindi Inscript & Kruti Dev Mapping**: [`src/utils/hindiEngine.ts`](src/utils/hindiEngine.ts)
- **Evaluation & Scoring Logic**: [`src/utils/evaluator.ts`](src/utils/evaluator.ts)
- Always run `pnpm build` to verify TypeScript typing integrity.

---

## 📋 Pull Request Guidelines

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Write clean, readable code and maintain existing docstrings and comments.
3. Test your changes locally across both Hindi and English modes.
4. Run `pnpm build` to ensure 0 build or lint errors.
5. Commit with descriptive commit messages following Conventional Commits (e.g., `feat: add Patna High Court typing profile`, `fix: correct half-mistake scoring for SSC DEST`).
6. Push to your branch and open a Pull Request against `main`.

---

## 📄 License
By contributing to Exam Typing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
