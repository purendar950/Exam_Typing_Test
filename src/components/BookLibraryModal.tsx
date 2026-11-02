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
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a, #0369a1)',
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
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Classic Book Library & Type-Along (पुस्तकालय एवं टाइपिंग अभ्यास)
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
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
              fontSize: '1.2rem',
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
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
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
                borderRadius: '20px',
                border: selectedLanguage === 'all' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: selectedLanguage === 'all' ? '#e0f2fe' : '#ffffff',
                color: selectedLanguage === 'all' ? '#0369a1' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              All Books ({BOOK_LIBRARY.length})
            </button>
            <button
              onClick={() => setSelectedLanguage('hindi')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedLanguage === 'hindi' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: selectedLanguage === 'hindi' ? '#e0f2fe' : '#ffffff',
                color: selectedLanguage === 'hindi' ? '#0369a1' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🇮🇳 Hindi Classics (प्रेमचंद)
            </button>
            <button
              onClick={() => setSelectedLanguage('english')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedLanguage === 'english' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: selectedLanguage === 'english' ? '#e0f2fe' : '#ffffff',
                color: selectedLanguage === 'english' ? '#0369a1' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
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
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
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
              borderRight: '1px solid #e2e8f0',
              overflowY: 'auto',
              padding: '16px',
              background: '#f8fafc'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
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
                      background: isSelected ? '#ffffff' : '#ffffff',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '10px',
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
                        borderRadius: '4px',
                        background: book.coverColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '1.4rem',
                        flexShrink: 0,
                        boxShadow: '1px 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      📖
                    </div>
                    {/* Book text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {book.author}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>
                          {book.language === 'hindi' ? 'हिंदी' : 'English'}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>
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
          <div style={{ width: '58%', overflowY: 'auto', padding: '20px 24px', background: '#ffffff' }}>
            {selectedBook ? (
              <div>
                {/* Book Header Card */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedBook.title}
                      </h3>
                      <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                        By {selectedBook.author} &bull; {selectedBook.genre}
                      </div>
                    </div>
                    <span
                      style={{
                        background: selectedBook.language === 'hindi' ? '#fef3c7' : '#e0e7ff',
                        color: selectedBook.language === 'hindi' ? '#b45309' : '#4338ca',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px'
                      }}
                    >
                      {selectedBook.language === 'hindi' ? 'Hindi Manuscript' : 'English Literature'}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                    {selectedBook.description}
                  </p>
                </div>

                {/* Chapters List */}
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Available Chapters
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedBook.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px',
                        background: '#ffffff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                          {chapter.title}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          {chapter.wordCount} words
                        </span>
                      </div>

                      {/* Excerpt */}
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '0.82rem',
                          color: '#64748b',
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
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
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
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
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
