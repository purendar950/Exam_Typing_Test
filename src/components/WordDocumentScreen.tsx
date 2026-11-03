import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language } from '../types';
import { isWordCorrect, getSpellingSuggestions, addUserWord } from '../utils/spellingEngine';
import { audioEngine } from '../utils/audioEngine';
import { translateToMangalInscript, translateToKrutiDev, translateEnglishStringToHindi } from '../utils/hindiEngine';
import { BookLibraryModal } from './BookLibraryModal';
import { HindiHelperModal } from './HindiHelperModal';
import { HindiKeyboardLayout } from './HindiKeyboardLayout';
import { Book, BookChapter } from '../data/bookLibrary';

interface WordDocumentScreenProps {
  onBackToTests: () => void;
}

interface MisspelledContext {
  word: string;
  index: number;
  suggestions: string[];
  x: number;
  y: number;
}

export const WordDocumentScreen: React.FC<WordDocumentScreenProps> = ({ onBackToTests }) => {
  // Document state
  const [docTitle, setDocTitle] = useState<string>('My Book Manuscript - Word');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('up_book_draft_content');
      return saved || 'Chapter 1: The Beginning\n\nType your book here. Any misspelled or incorrect word will be underlined with a red wavy squiggly line, just like Microsoft Word.\n\nTry typing words like computr, goverment, or polise to see the red underline in action.';
    } catch {
      return 'Chapter 1: The Journey\n\nStart typing your book here...';
    }
  });

  // Formatting and editor controls
  const [fontFamily, setFontFamily] = useState<string>('Calibri');
  const [fontSize, setFontSize] = useState<number>(16);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [language, setLanguage] = useState<Language>('english');
  const [checkSpelling, setCheckSpelling] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'layout' | 'review'>('home');
  const [saveToast, setSaveToast] = useState<string>('');

  // Modals & Type-Along states
  const [isBookLibraryOpen, setIsBookLibraryOpen] = useState<boolean>(false);
  const [isHindiHelperOpen, setIsHindiHelperOpen] = useState<boolean>(false);
  const [isKeyboardMapOpen, setIsKeyboardMapOpen] = useState<boolean>(false);
  const [activeTypeAlong, setActiveTypeAlong] = useState<{
    bookTitle: string;
    chapterTitle: string;
    content: string;
  } | null>(null);

  // Context menu for spelling suggestions
  const [contextMenu, setContextMenu] = useState<MisspelledContext | null>(null);

  // Speed calculation
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keystrokes, setKeystrokes] = useState<number>(0);

  const [inscriptMappingEnabled, setInscriptMappingEnabled] = useState<boolean>(true);
  const isComposingRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('up_book_draft_content', content);
      localStorage.setItem('up_book_draft_title', docTitle);
    } catch {
      // Ignore
    }
  }, [content, docTitle]);

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && previewRef.current) {
      previewRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu]);

  // Word tokenization & Spell checking
  const { parsedWords, errorCount, wordCount, charCount, charNoSpaces } = useMemo(() => {
    const rawWords = content.match(/\S+|\s+/g) || [];
    let errors = 0;
    let wordsTotal = 0;
    let charsNoSp = 0;

    const parsed = rawWords.map((token, idx) => {
      const isWhitespace = /^\s+$/.test(token);
      if (isWhitespace) {
        return { text: token, isWhitespace: true, isError: false, tokenIndex: idx };
      }

      wordsTotal++;
      charsNoSp += token.length;

      const isCorrect = !checkSpelling || isWordCorrect(token, language);
      if (!isCorrect) {
        errors++;
      }

      return {
        text: token,
        isWhitespace: false,
        isError: !isCorrect,
        tokenIndex: idx
      };
    });

    return {
      parsedWords: parsed,
      errorCount: errors,
      wordCount: wordsTotal,
      charCount: content.length,
      charNoSpaces: charsNoSp
    };
  }, [content, language, checkSpelling]);

  // Live WPM calculation
  const liveWpm = useMemo(() => {
    if (!startTime || wordCount === 0) return 0;
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    if (elapsedMinutes < 0.05) return 0;
    return Math.round(wordCount / elapsedMinutes);
  }, [startTime, wordCount]);

  // Handle typing keystroke
  const insertTextAtCursor = (textToInsert: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    const next = current.substring(0, start) + textToInsert + current.substring(end);
    el.value = next;
    const newPos = start + textToInsert.length;
    el.selectionStart = el.selectionEnd = newPos;
    setContent(next);
  };

  const deleteCharacter = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    if (start === end) {
      if (start > 0) {
        const next = current.substring(0, start - 1) + current.substring(end);
        el.value = next;
        el.selectionStart = el.selectionEnd = start - 1;
        setContent(next);
      }
    } else {
      const next = current.substring(0, start) + current.substring(end);
      el.value = next;
      el.selectionStart = el.selectionEnd = start;
      setContent(next);
    }
  };

  // Handle typing keystroke
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (soundEnabled && !['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      audioEngine.playKeyClick();
    }

    if (!startTime) {
      setStartTime(Date.now());
    }
    setKeystrokes((prev) => prev + 1);

    const isMangalInscript = language === 'hindi_mangal' && inscriptMappingEnabled;

    // 1. If IME is composing and NOT in Mangal Inscript mapped mode, let native IME work
    if (!isMangalInscript && (isComposingRef.current || e.nativeEvent.isComposing || e.key === 'Process' || e.keyCode === 229)) {
      return;
    }

    if (e.key === 'Backspace' || e.code === 'Backspace') {
      if (isMangalInscript) {
        e.preventDefault();
        deleteCharacter();
      }
      return;
    }

    if (e.key === 'Enter' || e.code === 'Enter') {
      if (isMangalInscript) {
        e.preventDefault();
        insertTextAtCursor('\n');
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (isMangalInscript) {
        insertTextAtCursor('    ');
      }
      return;
    }

    if (isMangalInscript) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        insertTextAtCursor(' ');
        return;
      }

      const isPrintable =
        (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) ||
        (Boolean(e.code) && (
          e.code.startsWith('Key') ||
          e.code.startsWith('Digit') ||
          e.code.startsWith('Bracket') ||
          e.code === 'Backquote' ||
          e.code === 'Minus' ||
          e.code === 'Equal' ||
          e.code === 'Semicolon' ||
          e.code === 'Quote' ||
          e.code === 'Comma' ||
          e.code === 'Period' ||
          e.code === 'Slash' ||
          e.code === 'Backslash'
        ));

      if (isPrintable) {
        e.preventDefault();
        if (/^[\u0900-\u097F]$/.test(e.key)) {
          insertTextAtCursor(e.key);
          return;
        }

        const isShift =
          e.shiftKey ||
          (e.key >= 'A' && e.key <= 'Z') ||
          (typeof e.getModifierState === 'function' && e.getModifierState('CapsLock'));
        const hindiChar = translateToMangalInscript(e.key, isShift, e.code);
        insertTextAtCursor(hindiChar);
        return;
      }
    }
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (!nativeEvent) return;

    if (!startTime) {
      setStartTime(Date.now());
    }
    setKeystrokes((prev) => prev + 1);

    if (language === 'hindi_mangal' && inscriptMappingEnabled) {
      e.preventDefault();
      if (nativeEvent.data) {
        const translated = translateEnglishStringToHindi(nativeEvent.data, 'mangal');
        insertTextAtCursor(translated);
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    let nextVal = el.value;

    if (!startTime && nextVal.length > 0) {
      setStartTime(Date.now());
    }

    if (language === 'hindi_mangal' && inscriptMappingEnabled && /[a-zA-Z]/.test(nextVal)) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      nextVal = translateEnglishStringToHindi(nextVal, 'mangal');
      el.value = nextVal;
      if (start !== null && end !== null) {
        el.setSelectionRange(start, end);
      }
    }

    setContent(nextVal);
  };

  // Replace a misspelled word with a suggestion
  const handleApplySuggestion = (origWord: string, replacement: string, tokenIndex: number) => {
    const rawWords = content.match(/\S+|\s+/g) || [];
    if (tokenIndex < rawWords.length) {
      rawWords[tokenIndex] = replacement;
      setContent(rawWords.join(''));
    }
    setContextMenu(null);
  };

  // Add word to user dictionary
  const handleAddToDictionary = (word: string) => {
    addUserWord(word);
    setContextMenu(null);
    // Force re-evaluation by slightly touching content
    setContent((prev) => prev + '');
    showToast(`Added "${word}" to custom dictionary`);
  };

  // Handle click on error word
  const handleWordClick = (e: React.MouseEvent, word: string, tokenIndex: number) => {
    e.stopPropagation();
    const suggestions = getSpellingSuggestions(word, language);
    setContextMenu({
      word,
      index: tokenIndex,
      suggestions,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Save draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('up_book_draft_content', content);
      localStorage.setItem('up_book_draft_title', docTitle);
      showToast('Document saved successfully!');
    } catch {
      showToast('Failed to save document');
    }
  };

  // Export to .txt file
  const handleExportTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Document exported as .txt');
  };

  // Print document
  const handlePrint = () => {
    window.print();
  };

  // New blank document
  const handleNewDocument = () => {
    if (window.confirm('Create a new blank document? (Unsaved changes will be replaced)')) {
      setContent('');
      setStartTime(null);
      setKeystrokes(0);
      showToast('New blank document created');
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3000);
  };

  // Handle Type-Along selection
  const handleSelectChapterForTypeAlong = (book: Book, chapter: BookChapter) => {
    const lang: Language = book.language === 'hindi' ? 'hindi_mangal' : 'english';
    setLanguage(lang);
    if (book.language === 'hindi') {
      setFontFamily('Mangal');
    }
    setActiveTypeAlong({
      bookTitle: book.title,
      chapterTitle: chapter.title,
      content: chapter.content
    });
    setDocTitle(`${book.title} - ${chapter.title}`);
    setContent('');
    setStartTime(null);
    setKeystrokes(0);
    showToast(`Type-Along started: ${chapter.title}`);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Handle inserting book chapter into document
  const handleInsertChapterContent = (text: string, title: string) => {
    setDocTitle(title);
    setContent(text);
    showToast('Book chapter loaded into document');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Font family mapping
  const getComputedFontFamily = () => {
    switch (fontFamily) {
      case 'Times New Roman':
        return "'Times New Roman', Times, serif";
      case 'Arial':
        return 'Arial, Helvetica, sans-serif';
      case 'Georgia':
        return 'Georgia, serif';
      case 'Mangal':
        return "'Noto Sans Devanagari', Mangal, sans-serif";
      case 'Kruti Dev 010':
        return "'Kruti Dev 010', 'KrutiDev010', sans-serif";
      case 'Calibri':
      default:
        return "'Calibri', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    }
  };

  return (
    <div className="ms-word-window">
      {/* 1. BLUE MS WORD TITLE BAR */}
      <div className="ms-word-titlebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back button */}
          <button
            onClick={onBackToTests}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Back to Mock Tests
          </button>

          {/* Quick Save Icon */}
          <button
            onClick={handleSaveDraft}
            title="Save Document (Ctrl+S)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 6px'
            }}
          >
            💾
          </button>

          {/* Document Title (Editable) */}
          {isEditingTitle ? (
            <input
              type="text"
              value={docTitle}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onChange={(e) => setDocTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename document"
              style={{
                cursor: 'pointer',
                borderBottom: '1px dashed rgba(255,255,255,0.4)',
                padding: '2px 4px'
              }}
            >
              {docTitle} - Word
            </span>
          )}
        </div>

        {/* Right Titlebar actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveToast && (
            <span style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              {saveToast}
            </span>
          )}
          <button
            onClick={handleExportTxt}
            className="btn btn-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}
          >
            📥 Export .txt
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* 2. MS WORD RIBBON & TOOLBAR */}
      <div className="ms-word-ribbon">
        {/* Ribbon Tabs */}
        <div className="ms-word-ribbon-tabs">
          <button
            onClick={() => setActiveRibbonTab('home')}
            className={`ms-word-ribbon-tab ${activeRibbonTab === 'home' ? 'active' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveRibbonTab('layout')}
            className={`ms-word-ribbon-tab ${activeRibbonTab === 'layout' ? 'active' : ''}`}
          >
            Layout & Page
          </button>
          <button
            onClick={() => setActiveRibbonTab('review')}
            className={`ms-word-ribbon-tab ${activeRibbonTab === 'review' ? 'active' : ''}`}
          >
            Review & Spell Check
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="ms-word-toolbar">
          {/* File Operations */}
          <div className="ms-word-toolgroup">
            <button onClick={handleNewDocument} title="New Blank Document" className="ms-word-btn">
              📄 New
            </button>
            <button onClick={handleSaveDraft} title="Save to Browser Storage" className="ms-word-btn">
              💾 Save
            </button>
          </div>

          {/* Font Family & Size */}
          <div className="ms-word-toolgroup">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                color: '#1f2937'
              }}
            >
              <option value="Calibri">Calibri (Body)</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Mangal">Mangal (Devanagari)</option>
              <option value="Kruti Dev 010">Kruti Dev 010</option>
            </select>

            <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />

            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                color: '#1f2937',
                width: '54px'
              }}
            >
              {[12, 14, 16, 18, 20, 24, 28, 32].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} pt
                </option>
              ))}
            </select>
          </div>

          {/* Bold, Italic, Underline */}
          <div className="ms-word-toolgroup">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`ms-word-btn ${isBold ? 'active' : ''}`}
              title="Bold (Ctrl+B)"
              style={{ fontWeight: 800 }}
            >
              B
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`ms-word-btn ${isItalic ? 'active' : ''}`}
              title="Italic (Ctrl+I)"
              style={{ fontStyle: 'italic', fontWeight: 700 }}
            >
              I
            </button>
            <button
              onClick={() => setIsUnderline(!isUnderline)}
              className={`ms-word-btn ${isUnderline ? 'active' : ''}`}
              title="Underline (Ctrl+U)"
              style={{ textDecoration: 'underline', fontWeight: 700 }}
            >
              U
            </button>
          </div>

          {/* Text Alignment */}
          <div className="ms-word-toolgroup">
            <button
              onClick={() => setTextAlign('left')}
              className={`ms-word-btn ${textAlign === 'left' ? 'active' : ''}`}
              title="Align Left"
            >
              ⯸ Left
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`ms-word-btn ${textAlign === 'center' ? 'active' : ''}`}
              title="Center"
            >
              ≡ Center
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`ms-word-btn ${textAlign === 'right' ? 'active' : ''}`}
              title="Align Right"
            >
              ⯹ Right
            </button>
            <button
              onClick={() => setTextAlign('justify')}
              className={`ms-word-btn ${textAlign === 'justify' ? 'active' : ''}`}
              title="Justify"
            >
              ≣ Justify
            </button>
          </div>

          {/* Language Mode Selector */}
          <div className="ms-word-toolgroup">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                color: '#2563eb'
              }}
            >
              <option value="english">English (US)</option>
              <option value="hindi_mangal">Hindi (Mangal Inscript)</option>
              <option value="hindi_kruti">Hindi (Kruti Dev 010)</option>
            </select>
          </div>

          {/* MS Word Spell-Check (Red Wavy Underline) Toggle */}
          <div className="ms-word-toolgroup">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: checkSpelling ? '#dc2626' : '#64748b' }}>
              <input
                type="checkbox"
                checked={checkSpelling}
                onChange={(e) => setCheckSpelling(e.target.checked)}
                style={{ accentColor: '#dc2626' }}
              />
              <span style={{ textDecoration: checkSpelling ? 'underline wavy #ef4444' : 'none' }}>
                MS Word Red Underline
              </span>
            </label>
          </div>

          {/* Key Sound Toggle */}
          <div className="ms-word-toolgroup">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`ms-word-btn ${soundEnabled ? 'active' : ''}`}
              title="Typing Mechanical Click Sound"
            >
              {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
            </button>
          </div>

          {/* Book Library & Hindi Helper buttons */}
          <div className="ms-word-toolgroup">
            <button
              onClick={() => setIsBookLibraryOpen(true)}
              className="ms-word-btn"
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 800,
                border: '1px solid #7dd3fc',
                borderRadius: '4px'
              }}
              title="Classic Hindi & English Books Library (गोदान, कफ़न, Sherlock Holmes) to type along"
            >
              📚 Books Library
            </button>
            <button
              onClick={() => setIsHindiHelperOpen(true)}
              className="ms-word-btn"
              style={{
                background: '#fef3c7',
                color: '#b45309',
                fontWeight: 800,
                border: '1px solid #fde68a',
                borderRadius: '4px'
              }}
              title="Hindi Character & Conjuncts Helper (संयुक्ताक्षर गाइड)"
            >
              ⌨️ Hindi Helper
            </button>
            <button
              onClick={() => setIsKeyboardMapOpen(true)}
              className="ms-word-btn"
              style={{
                background: '#fef3c7',
                color: '#b45309',
                fontWeight: 800,
                border: '1px solid #fde68a',
                borderRadius: '4px'
              }}
              title="Interactive Hindi Keyboard Layout Map (Inscript & Kruti Dev)"
            >
              ⌨️ Layout Map
            </button>
          </div>

        </div>
      </div>

      {/* 3. A4 PAPER SHEET WORKSPACE (THE DESK) */}
      <div className="ms-word-desk" onClick={() => textareaRef.current?.focus()}>
        {/* Type-Along Reference Reading Pane (Split View) */}
        {activeTypeAlong && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              margin: '0 auto 16px auto',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
              overflow: 'hidden'
            }}
          >
            {/* Split view header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.88rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📖</span>
                <strong>{activeTypeAlong.bookTitle}</strong> &bull; <span>{activeTypeAlong.chapterTitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                  Words: {wordCount} typed
                </span>
                <button
                  onClick={() => setIsBookLibraryOpen(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  Change Chapter
                </button>
                <button
                  onClick={() => setActiveTypeAlong(null)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.85)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  ✕ Close Split View
                </button>
              </div>
            </div>

            {/* Split view content */}
            <div
              style={{
                padding: '14px 20px',
                maxHeight: '160px',
                overflowY: 'auto',
                fontSize: '0.98rem',
                lineHeight: 1.7,
                color: '#0f172a',
                fontFamily: language === 'hindi_kruti'
                  ? "'Kruti Dev 010', 'KrutiDev010', sans-serif"
                  : language.includes('hindi')
                  ? "'Noto Sans Devanagari', Mangal, sans-serif"
                  : 'Georgia, serif',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              {activeTypeAlong.content}
            </div>
          </div>
        )}

        {/* Top Inch Ruler */}
        <div className="ms-word-ruler">
          <span>0"</span>
          <span>1"</span>
          <span>2"</span>
          <span>3"</span>
          <span>4"</span>
          <span>5"</span>
          <span>6"</span>
          <span>7"</span>
          <span>8"</span>
        </div>

        {/* White A4 Document Sheet */}
        <div
          className="ms-word-sheet"
          style={{
            fontFamily: getComputedFontFamily(),
            fontSize: `${fontSize}px`,
            fontWeight: isBold ? 700 : 400,
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
            textAlign: textAlign,
            lineHeight: lineSpacing,
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
        >
          {/* Synchronized Word Highlighting Layer (Underlines typos with red wavy lines) */}
          <div
            ref={previewRef}
            style={{
              position: 'absolute',
              top: '56px',
              left: '64px',
              right: '64px',
              bottom: '56px',
              pointerEvents: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowY: 'hidden',
              color: 'transparent'
            }}
          >
            {parsedWords.map((token, i) => {
              if (token.isWhitespace) {
                return <span key={i}>{token.text}</span>;
              }
              if (token.isError) {
                return (
                  <span
                    key={i}
                    className="ms-word-error"
                    title={`Misspelled word: "${token.text}". Click for suggestions.`}
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => handleWordClick(e, token.text, token.tokenIndex)}
                  >
                    {token.text}
                  </span>
                );
              }
              return <span key={i}>{token.text}</span>;
            })}
          </div>

          {/* Actual Editable Typing Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            readOnly={language === 'hindi_mangal' && inscriptMappingEnabled}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              const el = e.target as HTMLTextAreaElement;
              let val = el.value;
              if (language === 'hindi_mangal' && inscriptMappingEnabled && /[a-zA-Z]/.test(val)) {
                val = translateEnglishStringToHindi(val, 'mangal');
                el.value = val;
              }
              setContent(val);
            }}
            onScroll={handleScroll}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder="Type your book here... (Words with typos will have a red wavy underline, exactly like MS Word)"
            style={{
              width: '100%',
              minHeight: '860px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              fontStyle: 'inherit',
              textAlign: 'inherit',
              lineHeight: 'inherit',
              color: '#0f172a',
              caretColor: '#0f172a',
              cursor: 'text',
              padding: 0,
              margin: 0
            }}
          />
        </div>
      </div>

      {/* 4. SPELLING SUGGESTIONS CONTEXT MENU (MS WORD STYLE) */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: '1px solid #cbd5e1',
            zIndex: 100,
            padding: '8px 0',
            minWidth: '200px',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ padding: '4px 12px', color: '#dc2626', fontWeight: 800, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚠️</span> Spelling: "{contextMenu.word}"
          </div>

          {/* Suggestions */}
          {contextMenu.suggestions.length > 0 ? (
            <div style={{ padding: '4px 0' }}>
              <div style={{ padding: '2px 12px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Suggestions:
              </div>
              {contextMenu.suggestions.map((sug, i) => (
                <div
                  key={i}
                  onClick={() => handleApplySuggestion(contextMenu.word, sug, contextMenu.index)}
                  style={{
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: '#1e40af',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {sug}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '6px 12px', color: '#94a3b8', fontStyle: 'italic' }}>
              No immediate suggestion
            </div>
          )}

          <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

          {/* Add to dictionary */}
          <div
            onClick={() => handleAddToDictionary(contextMenu.word)}
            style={{
              padding: '6px 14px',
              cursor: 'pointer',
              color: '#334155',
              fontWeight: 600
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ➕ Add to Dictionary
          </div>

          <div
            onClick={() => setContextMenu(null)}
            style={{
              padding: '6px 14px',
              cursor: 'pointer',
              color: '#64748b'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Ignore Once
          </div>
        </div>
      )}

      {/* 5. BLUE MS WORD STATUS BAR */}
      <div className="ms-word-statusbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Page 1 of 1</span>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {errorCount > 0 ? (
              <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                📖 ✕ {errorCount} spelling error{errorCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ color: '#86efac', fontWeight: 700 }}>
                📖 ✓ No spelling errors
              </span>
            )}
          </span>
          {liveWpm > 0 && <span>Speed: {liveWpm} WPM</span>}
        </div>

        {/* Right side status items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>
            {language === 'english' ? 'English (United States)' : language === 'hindi_mangal' ? 'Hindi (Mangal Inscript)' : 'Hindi (Kruti Dev 010)'}
          </span>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}
            >
              -
            </button>
            <span>{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Book Library Modal */}
      <BookLibraryModal
        isOpen={isBookLibraryOpen}
        onClose={() => setIsBookLibraryOpen(false)}
        onSelectChapterForTypeAlong={handleSelectChapterForTypeAlong}
        onInsertChapterContent={handleInsertChapterContent}
      />

      {/* Hindi Character & Conjuncts Helper Modal */}
      <HindiHelperModal
        isOpen={isHindiHelperOpen}
        onClose={() => setIsHindiHelperOpen(false)}
        defaultLayout={language === 'hindi_kruti' ? 'kruti' : 'mangal'}
      />

      {/* On-Screen Mapped Hindi Virtual Keyboard Modal */}
      {isKeyboardMapOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsKeyboardMapOpen(false);
            textareaRef.current?.focus();
          }}
          style={{ zIndex: 9999, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '1020px', maxHeight: '92vh', overflowY: 'auto' }}
          >
            <HindiKeyboardLayout
              layout={language === 'hindi_kruti' ? 'kruti' : 'mangal'}
              onInsertChar={(char) => {
                insertTextAtCursor(char);
                textareaRef.current?.focus();
              }}
              onClose={() => {
                setIsKeyboardMapOpen(false);
                textareaRef.current?.focus();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
