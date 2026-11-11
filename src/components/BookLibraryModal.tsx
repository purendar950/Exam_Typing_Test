import React, { useState } from 'react';
import { BOOK_LIBRARY, Book, BookChapter } from '../data/bookLibrary';

interface BookLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapterForTypeAlong: (book: Book, chapter: BookChapter) => void;
  onInsertChapterContent: (text: string, title: string) => void;
}

export const BookLibraryModal: React.FC<BookLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectChapterForTypeAlong,
  onInsertChapterContent
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'hindi' | 'english'>('all');
  const [selectedBook, setSelectedBook] = useState<Book>(BOOK_LIBRARY[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredBooks = BOOK_LIBRARY.filter((b) => {
    if (selectedLanguage !== 'all' && b.language !== selectedLanguage) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q) ||
      (b.titleHindi && b.titleHindi.includes(q))
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-blue-900), var(--tw-sky-700))',
            color: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>📚</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Classic Book Library & Type-Along (पुस्तकालय एवं टाइपिंग अभ्यास)
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                Practice typing complete chapters of famous Hindi & English literature
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontWeight: 700
            }}
          >
            &times;
          </button>
        </div>

        {/* Toolbar: Language Filter & Search */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-slate-50)',
            borderBottom: '1px solid var(--bd-slate-200)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedLanguage('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                border: selectedLanguage === 'all' ? '1px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                background: selectedLanguage === 'all' ? 'var(--bg-sky-100)' : 'var(--surface)',
                color: selectedLanguage === 'all' ? 'var(--fg-sky-700)' : 'var(--fg-slate-600)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              All Books ({BOOK_LIBRARY.length})
            </button>
            <button
              onClick={() => setSelectedLanguage('hindi')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                border: selectedLanguage === 'hindi' ? '1px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                background: selectedLanguage === 'hindi' ? 'var(--bg-sky-100)' : 'var(--surface)',
                color: selectedLanguage === 'hindi' ? 'var(--fg-sky-700)' : 'var(--fg-slate-600)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              🇮🇳 Hindi Classics (प्रेमचंद)
            </button>
            <button
              onClick={() => setSelectedLanguage('english')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                border: selectedLanguage === 'english' ? '1px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                background: selectedLanguage === 'english' ? 'var(--bg-sky-100)' : 'var(--surface)',
                color: selectedLanguage === 'english' ? 'var(--fg-sky-700)' : 'var(--fg-slate-600)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              🇬🇧 English Classics (Sherlock Holmes, etc.)
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search books or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--bd-slate-300)',
                fontSize: '0.875rem'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tw-slate-400)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Main Body: Books List (Left) + Chapter Details (Right) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: '440px' }}>
          {/* Left: Books Grid / List */}
          <div
            style={{
              width: '42%',
              borderRight: '1px solid var(--bd-slate-200)',
              overflowY: 'auto',
              padding: '16px',
              background: 'var(--bg-slate-50)'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-500)', marginBottom: '12px' }}>
              Select a Book
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredBooks.map((book) => {
                const isSelected = selectedBook.id === book.id;
                return (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    style={{
                      background: isSelected ? 'var(--surface)' : 'var(--surface)',
                      border: isSelected ? '2px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Book spine/thumbnail */}
                    <div
                      style={{
                        width: '44px',
                        height: '62px',
                        borderRadius: 'var(--radius-sm)',
                        background: book.coverColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '1.4rem',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      📖
                    </div>
                    {/* Book text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg-slate-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                        {book.author}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-slate-100)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--fg-slate-600)' }}>
                          {book.language === 'hindi' ? 'हिंदी' : 'English'}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-slate-100)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--fg-slate-600)' }}>
                          {book.chapters.length} Chapters
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Book Chapters & Actions */}
          <div style={{ width: '58%', overflowY: 'auto', padding: '20px 24px', background: 'var(--surface)' }}>
            {selectedBook ? (
              <div>
                {/* Book Header Card */}
                <div
                  style={{
                    background: 'var(--bg-slate-50)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid var(--bd-slate-200)',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                        {selectedBook.title}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--fg-slate-600)', marginTop: '2px', fontWeight: 500 }}>
                        By {selectedBook.author} &bull; {selectedBook.genre}
                      </div>
                    </div>
                    <span
                      style={{
                        background: selectedBook.language === 'hindi' ? 'var(--bg-amber-100)' : 'var(--bg-indigo-100)',
                        color: selectedBook.language === 'hindi' ? 'var(--fg-amber-700)' : 'var(--fg-indigo-700)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      {selectedBook.language === 'hindi' ? 'Hindi Manuscript' : 'English Literature'}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.875rem', color: 'var(--fg-slate-500)', lineHeight: 1.5 }}>
                    {selectedBook.description}
                  </p>
                </div>

                {/* Chapters List */}
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '12px' }}>
                  Available Chapters
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedBook.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      style={{
                        border: '1px solid var(--bd-slate-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        background: 'var(--surface)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg-slate-800)' }}>
                          {chapter.title}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', fontWeight: 500 }}>
                          {chapter.wordCount} words
                        </span>
                      </div>

                      {/* Excerpt */}
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '0.8rem',
                          color: 'var(--fg-slate-500)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {chapter.content.slice(0, 150)}...
                      </p>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            onInsertChapterContent(chapter.content, `${selectedBook.title} - ${chapter.title}`);
                            onClose();
                          }}
                          style={{
                            background: 'var(--bg-slate-100)',
                            color: 'var(--fg-slate-700)',
                            border: '1px solid var(--bd-slate-300)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                          title="Load this chapter into the MS Word editor"
                        >
                          📄 Insert into Doc
                        </button>

                        <button
                          onClick={() => {
                            onSelectChapterForTypeAlong(selectedBook, chapter);
                            onClose();
                          }}
                          style={{
                            background: 'var(--tw-sky-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ✍️ Type Along (Split View)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
