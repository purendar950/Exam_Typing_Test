import React, { useState, useMemo } from 'react';
import { HINDI_CHARACTERS, HindiCharacterHelper } from '../data/hindiCharacters';

interface HindiHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLayout?: 'mangal' | 'kruti';
}

export const HindiHelperModal: React.FC<HindiHelperModalProps> = ({
  isOpen,
  onClose,
  defaultLayout = 'mangal'
}) => {
  const [activeLayout, setActiveLayout] = useState<'mangal' | 'kruti'>(defaultLayout);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCharacters = useMemo(() => {
    return HINDI_CHARACTERS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.character.includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.mangalKeys.toLowerCase().includes(q) ||
        item.krutiDevKeys.toLowerCase().includes(q) ||
        item.exampleWords.some((w) => w.includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = (char: string, id: string) => {
    try {
      navigator.clipboard.writeText(char);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '900px',
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
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            color: '#ffffff',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>⌨️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Hindi Character & Conjuncts Helper (संयुक्ताक्षर गाइड)
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                Quick reference for difficult Hindi keystrokes (Mangal Inscript & Kruti Dev 010)
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

        {/* Toolbar: Layout Tabs & Search */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Layout Switcher */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setActiveLayout('mangal')}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeLayout === 'mangal' ? '#ffffff' : 'transparent',
                color: activeLayout === 'mangal' ? '#1e3a8a' : '#64748b',
                boxShadow: activeLayout === 'mangal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🇮🇳 Mangal (Inscript)
            </button>
            <button
              onClick={() => setActiveLayout('kruti')}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeLayout === 'kruti' ? '#ffffff' : 'transparent',
                color: activeLayout === 'kruti' ? '#1e3a8a' : '#64748b',
                boxShadow: activeLayout === 'kruti' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ⚙️ Kruti Dev 010 (Remington)
            </button>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search letter, key or word (e.g. क्ष, द्ध, ksha, 0161)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            >
              🔍
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            padding: '10px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'all', label: 'सभी (All)' },
            { id: 'conjunct', label: 'संयुक्ताक्षर (Conjuncts)' },
            { id: 'ref_paden', label: "रेफ 'र्' एवं पदेन '्र'" },
            { id: 'nukta', label: 'नुक्ता वर्ण (़)' },
            { id: 'matra', label: 'मात्राएँ एवं ऋ' },
            { id: 'special_alt', label: 'विशेष चिन्ह व हलन्त' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: selectedCategory === cat.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: selectedCategory === cat.id ? '#eff6ff' : '#f8fafc',
                color: selectedCategory === cat.id ? '#1d4ed8' : '#475569',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Body: Character Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            background: '#f8fafc'
          }}
        >
          {filteredCharacters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>कोई अक्षर नहीं मिला</p>
              <p style={{ fontSize: '0.85rem' }}>कृपया दूसरा खोज शब्द आज़माएँ।</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              {filteredCharacters.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    {/* Top row: Character & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 800,
                            color: '#1e293b',
                            lineHeight: 1
                          }}
                        >
                          {item.character}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.character, item.id)}
                        title="Copy character"
                        style={{
                          background: copiedId === item.id ? '#10b981' : '#f1f5f9',
                          color: copiedId === item.id ? '#ffffff' : '#64748b',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === item.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {/* Key Combination Tag */}
                    <div style={{ marginBottom: '8px' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '3px'
                        }}
                      >
                        {activeLayout === 'mangal' ? 'Mangal Inscript Keys' : 'Kruti Dev 010 Keys'}
                      </div>
                      <div
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          border: '1px solid #bfdbfe',
                          fontFamily: 'monospace'
                        }}
                      >
                        {activeLayout === 'mangal' ? item.mangalKeys : item.krutiDevKeys}
                      </div>
                    </div>

                    {/* Explanation */}
                    <p style={{ fontSize: '0.82rem', color: '#475569', margin: '6px 0 10px 0', lineHeight: 1.4 }}>
                      {activeLayout === 'mangal' ? item.mangalExplanation : item.krutiDevExplanation}
                    </p>
                  </div>

                  {/* Examples */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                      उदाहरण (Examples):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.exampleWords.map((word, idx) => (
                        <span
                          key={idx}
                          onClick={() => setScratchpadText((prev) => (prev ? prev + ' ' + word : word))}
                          title="Click to add to test scratchpad"
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Practice Scratchpad */}
        <div
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              📝 Quick Practice Scratchpad (टाइपिंग टेस्ट यहाँ करके देखें):
            </div>
            <input
              type="text"
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="यहाँ टाइप करके देखें कि आपका कीबोर्ड सही अक्षर बना रहा है..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>
          {scratchpadText && (
            <button
              onClick={() => setScratchpadText('')}
              style={{
                marginTop: '18px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
