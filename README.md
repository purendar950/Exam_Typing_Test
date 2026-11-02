# Uttar Pradesh Computer Operator Typing Test Portal 🎯

An open-source, full-featured typing test simulation platform tailored for **UP Police Computer Operator Grade-A**, **UP Police Assistant Sub-Inspector (Clerk/Accounts)**, and **UPSSSC Junior Assistant** examinations.

Designed with the exact layout and user interface patterns of [TestMentor](https://testmentor.in/).

---

## ✨ Key Features

- **Official UP Exam Benchmarks**:
  - **Hindi Speed:** $\ge 25$ Net WPM (Mangal Inscript / Kruti Dev 010)
  - **English Speed:** $\ge 30$ Net WPM (Standard QWERTY)
  - **Accuracy Standard:** Minimum $85.0\%$ qualifying threshold
  - **Test Duration:** 15 Minutes (Practice modes for 5 & 10 mins)
- **Hindi Transliteration Engine**:
  - Full Mangal Unicode Inscript keymap with Shift layer
  - Kruti Dev 010 Remington mapping
  - Unicode NFKC & Nukta normalizer
- **Exam Environment Simulation**:
  - Active word highlighter and smooth auto-scrolling
  - Anti-cheat safeguards: copy, paste, cut, and context menu disabled
  - Backspace tracking with official penalty calculations
  - Typewriter mechanical sound synthesizer (Web Audio API)
  - Interactive on-screen keyboard with finger placement guides
- **Diagnostic Evaluation & Feedback**:
  - Net WPM, Gross WPM, Accuracy %, Total Keystrokes, Mistakes
  - Full vs Half mistake tokenization
  - Color-coded side-by-side diff
  - **Targeted Practice Mode**: One-click drill generation from mistyped words
  - Local test history tracking and printable score cards

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/purendar950/Typing-computer-operator-.git
cd Typing-computer-operator-

# Install dependencies using pnpm
pnpm install

# Start development server
pnpm dev
```

---

## 🌐 Deploying to GitHub Pages (Free)

1. Repository is already connected to `https://github.com/purendar950/Typing-computer-operator-.git`
2. Push to GitHub:
   ```bash
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. The site will automatically build and publish to:
   `https://purendar950.github.io/Typing-computer-operator-/`

---

## ☁️ Deploying to Vercel / Netlify (1-Click)

- **Vercel**: Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite and provides instant global CDN hosting.
- **Netlify**: Connect repository at [netlify.com](https://app.netlify.com/). Build command: `pnpm build`, publish directory: `dist`.
