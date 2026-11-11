import React from 'react';
import { EvaluationResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: EvaluationResult[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            Your Test History & Performance Record
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            &times;
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No previous typing test attempts recorded yet.</p>
            <p style={{ fontSize: '0.875rem' }}>Take your first mock test to begin tracking your speed and accuracy trajectory.</p>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-slate-50)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Test Title</th>
                    <th style={{ padding: '10px 12px' }}>Net Speed</th>
                    <th style={{ padding: '10px 12px' }}>Accuracy</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.testTitle}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>
                        {h.netWpm} WPM
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: h.accuracy >= 85 ? 'var(--fg-green-600)' : 'var(--fg-red-600)' }}>
                        {h.accuracy}%
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${h.isQualified ? 'badge-green' : 'badge-red'}`}>
                          {h.isQualified ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={onClearHistory} className="btn btn-secondary btn-sm" style={{ color: 'var(--fg-red-600)' }}>
                Clear All Records
              </button>
              <button onClick={onClose} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
