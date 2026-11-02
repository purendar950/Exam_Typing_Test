import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
            Official UP Police Computer Operator Typing Guidelines
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.925rem', lineHeight: 1.6 }}>
          <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
            <h4 style={{ fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>
              UPPRPB Official Cutoff Benchmarks
            </h4>
            <p>
              Candidates must qualify in both typing components (if opted) or as per post notification:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '6px' }}>
              <li><strong>Hindi Typing:</strong> Minimum <strong>25 Net Words Per Minute</strong> with at least <strong>85.0% Accuracy</strong>.</li>
              <li><strong>English Typing:</strong> Minimum <strong>30 Net Words Per Minute</strong> with at least <strong>85.0% Accuracy</strong>.</li>
              <li><strong>Test Duration:</strong> Official exam duration is <strong>15 Minutes</strong>.</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>1. Keyboard Layout & Fonts</h4>
            <p>
              The UP Police Computer Operator Grade-A and UPSSSC typing exams are conducted on computers:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
              <li><strong>Hindi Font:</strong> Unicode <strong>Mangal (Inscript Layout)</strong> is standard. Certain exams also allow <strong>Kruti Dev 010 (Remington Layout)</strong>.</li>
              <li><strong>English Font:</strong> Standard Times New Roman / Arial / Segoe UI on standard QWERTY keyboard.</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>2. Mistake Categorization & Deductions</h4>
            <p>
              Official exam evaluation classifies errors into two categories:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
              <li>
                <strong>Full Mistake (1 full word penalty):</strong>
                <br />- Every omission of a word or figure.
                <br />- Every substitution of a wrong word or figure.
                <br />- Every addition of a word not found in the original passage.
              </li>
              <li>
                <strong>Half Mistake (0.5 word penalty):</strong>
                <br />- Minor spacing errors (e.g. typing two words without space or adding double space).
                <br />- Punctuation errors or letter case mismatches in English.
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>3. Speed Calculation Formulas</h4>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              Gross Words = Total Keystrokes / 5
              <br />
              Equivalent Errors = Full Mistakes + (Half Mistakes &times; 0.5)
              <br />
              Net Speed (WPM) = Gross WPM - (Equivalent Errors / Time in Minutes)
              <br />
              Accuracy (%) = ((Total Words Typed - Errors) / Total Words Typed) &times; 100
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>4. Important Exam Tips</h4>
            <ul style={{ marginLeft: '20px' }}>
              <li>Backspace is permissible in UP Police exam software, but use it sparingly as backspacing reduces your Net WPM.</li>
              <li>Focus on maintaining above 90% accuracy in your practice; speed naturally follows precision.</li>
              <li>Keep your eyes glued to the source text on screen to avoid skipping entire sentences.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-primary">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
