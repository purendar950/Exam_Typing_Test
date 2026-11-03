import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { EvaluationResult } from '../types';

interface ResultScreenProps {
  result: EvaluationResult;
  onRetakeTest: () => void;
  onChooseAnother: () => void;
  onPracticeWrongWords: (words: string[]) => void;
  onOpenDashboard?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetakeTest,
  onChooseAnother,
  onPracticeWrongWords,
  onOpenDashboard
}) => {
  // Fire confetti if candidate qualified!
  useEffect(() => {
    if (result.isQualified) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore confetti failure if canvas not supported
      }
    }
  }, [result.isQualified]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      {/* Qualification Hero Banner */}
      <div
        className="card"
        style={{
          backgroundColor: result.isQualified ? '#f0fdf4' : '#fef2f2',
          borderColor: result.isQualified ? '#86efac' : '#fca5a5',
          textAlign: 'center',
          padding: '32px 20px',
          marginBottom: '28px'
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
          {result.isQualified ? '🎉' : '⚠️'}
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: result.isQualified ? '#15803d' : '#b91c1c',
            marginBottom: '8px'
          }}
        >
          {result.isQualified
            ? `QUALIFIED FOR ${result.qualificationCriteria.examTitle ? result.qualificationCriteria.examTitle.toUpperCase() : 'EXAMINATION'}`
            : 'DID NOT MEET QUALIFYING CUTOFF'}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: result.isQualified ? '#166534' : '#991b1b',
            maxWidth: '650px',
            margin: '0 auto 16px'
          }}
        >
          {result.isQualified
            ? `Congratulations! You successfully fulfilled the official standards for ${result.qualificationCriteria.examTitle || 'this examination'} with ${result.netWpm} Net WPM and ${result.accuracy}% accuracy.`
            : `To qualify for ${result.qualificationCriteria.examTitle || 'this examination'}, candidates require minimum ${result.qualificationCriteria.requiredSpeed} Net WPM with at least ${result.qualificationCriteria.requiredAccuracy}% accuracy.`}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRetakeTest} className="btn btn-primary">
            Retake Test
          </button>
          <button onClick={onChooseAnother} className="btn btn-secondary">
            Select Another Test
          </button>
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="btn btn-secondary no-print"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>📊 Candidate Records</span>
            </button>
          )}
          <button onClick={handlePrint} className="btn btn-secondary no-print">
            🖨️ Print Score Card
          </button>
        </div>
      </div>

      {/* Official Cutoff Verification Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
          Official {result.qualificationCriteria.examTitle || 'Recruitment'} Cutoff Verification
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}>Parameter</th>
                <th style={{ padding: '12px 16px' }}>Required Threshold</th>
                <th style={{ padding: '12px 16px' }}>Achieved Result</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Net Typing Speed</td>
                <td style={{ padding: '12px 16px' }}>&ge; {result.qualificationCriteria.requiredSpeed} WPM</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: result.netWpm >= result.qualificationCriteria.requiredSpeed ? '#16a34a' : '#dc2626' }}>
                  {result.netWpm} WPM
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {result.netWpm >= result.qualificationCriteria.requiredSpeed ? (
                    <span className="badge badge-green">PASSED</span>
                  ) : (
                    <span className="badge badge-red">FAILED</span>
                  )}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Accuracy Percentage</td>
                <td style={{ padding: '12px 16px' }}>&ge; {result.qualificationCriteria.requiredAccuracy}%</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: result.accuracy >= result.qualificationCriteria.requiredAccuracy ? '#16a34a' : '#dc2626' }}>
                  {result.accuracy}%
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {result.accuracy >= result.qualificationCriteria.requiredAccuracy ? (
                    <span className="badge badge-green">PASSED</span>
                  ) : (
                    <span className="badge badge-red">FAILED</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Duration & Font</td>
                <td style={{ padding: '12px 16px' }}>{result.timeAllowedMinutes} Mins / Mangal/Kruti</td>
                <td style={{ padding: '12px 16px' }}>
                  {Math.round(result.timeTakenSeconds / 60 * 10) / 10} Mins / {result.language}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge badge-blue">COMPLETED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Net Speed
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
            {result.netWpm}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Words Per Minute</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Gross Speed
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {result.grossWpm}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Strokes / 5 / Min</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Accuracy
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: result.accuracy >= 85 ? '#16a34a' : '#dc2626' }}>
            {result.accuracy}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cutoff: 85.0%</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Keystrokes
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {result.totalKeystrokes}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backspaces: {result.backspaceCount}</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Full Mistakes
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626' }}>
            {result.fullMistakes}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1 Word Penalty Each</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Half Mistakes
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#d97706' }}>
            {result.halfMistakes}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.5 Word Penalty Each</span>
        </div>
      </div>

      {/* Weak Keys & Error Diagnostic Section */}
      {result.weakKeys && result.weakKeys.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderColor: '#fde68a',
            borderWidth: '2px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                🔍 Weak Keys & Error Heatmap (कमजोर बटन विश्लेषण)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#b45309' }}>
                You made the most errors on these specific characters. Review their finger placements and key combinations:
              </p>
            </div>
            <span style={{ background: '#f59e0b', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
              {result.weakKeys.length} Weak Keys Identified
            </span>
          </div>

          {/* Weak Key Chips */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            {result.weakKeys.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    className={result.language === 'hindi_kruti' ? 'font-kruti' : ''}
                    style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}
                  >
                    {item.character}
                  </span>
                  <span
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {item.mistakeCount} {item.mistakeCount === 1 ? 'error' : 'errors'}
                  </span>
                </div>
                {item.keyCombo && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
                    Keys: <code>{item.keyCombo}</code>
                  </div>
                )}
                {item.fingerHint && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Finger: <strong>{item.fingerHint}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Launch 2-Minute Booster Drill */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '14px 18px',
              border: '1px solid #fef08a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <strong style={{ fontSize: '0.98rem', color: '#1e3a8a' }}>
                  Re-Test My Mistakes (2-Minute Booster Drill)
                </strong>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⏱️ 2 Mins
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Practice only your {result.wrongWordsList.length} mistyped words and weak characters to rapidly achieve 85%+ accuracy.
              </p>
            </div>

            <button
              onClick={() => onPracticeWrongWords(result.wrongWordsList)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                fontWeight: 800,
                padding: '10px 22px',
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              🎯 Start 2-Minute Mistakes Drill
            </button>
          </div>
        </div>
      )}

      {/* Detailed Side-by-Side Word Evaluation Diff */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Diagnostic Word-by-Word Analysis</h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#16a34a' }}></span> Correct
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#dc2626' }}></span> Full Mistake
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#ea580c' }}></span> Half Mistake
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#94a3b8' }}></span> Skipped
            </span>
          </div>
        </div>

        <div
          className={`diff-box ${result.language === 'hindi_kruti' ? 'font-kruti' : ''}`}
          dangerouslySetInnerHTML={{ __html: result.diffHtml }}
        />
      </div>
    </div>
  );
};
