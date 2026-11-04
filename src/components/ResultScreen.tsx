import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { EvaluationResult } from '../types';

interface ResultScreenProps {
  result: EvaluationResult;
  onRetakeTest: () => void;
  onChooseAnother: () => void;
  onPracticeWrongWords: (words: string[]) => void;
  onOpenDashboard?: () => void;
  onOpenRules?: (examId?: string, categoryGroup?: string) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetakeTest,
  onChooseAnother,
  onPracticeWrongWords,
  onOpenDashboard,
  onOpenRules
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

      {/* Official 85% Passage Benchmark Rule Alert (UP Police) */}
      {(!result.calculationModel || result.calculationModel === 'upprpb') && result.completionRate < 85 && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong style={{ color: '#9f1239', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
              Official UPPRPB / Recruitment Board 85% Passage Accuracy Rule
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#881337', lineHeight: 1.55 }}>
              In official UP Police Computer Operator and SI/ASI exams, <strong>85% accuracy is strictly measured against the total words in the official passage ({result.totalOriginalWords} words)</strong>, not merely against the words you typed. You completed <strong>{result.completionRate}%</strong> ({result.totalTypedWords} words). To qualify, candidates must complete at least 85% of the passage correctly.
            </p>
          </div>
        </div>
      )}

      {/* SSC DEST Permissible Error Rule Alert */}
      {result.calculationModel === 'ssc_dest' && result.sscErrorPercentage !== undefined && result.sscErrorPercentage > (result.qualificationCriteria.examTitle?.includes('CHSL') ? 7 : 20) && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong style={{ color: '#9f1239', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
              Official SSC DEST Error Percentage Limit Exceeded
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#881337', lineHeight: 1.55 }}>
              In Staff Selection Commission DEST examinations, candidates are disqualified if total errors exceed the prescribed category cutoff ({result.qualificationCriteria.examTitle?.includes('CHSL') ? '7% for UR' : '20% for UR'}). Your recorded error rate was <strong>{result.sscErrorPercentage}%</strong> ({result.equivalentErrors} mistakes).
            </p>
          </div>
        </div>
      )}

      {/* Court 3% Error Tolerance Rule Alert */}
      {result.calculationModel === 'court_delhi' && (result.equivalentErrors / Math.max(1, result.totalTypedWords)) * 100 > 3.0 && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong style={{ color: '#9f1239', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
              Official High Court / Supreme Court 3.0% Error Limit Exceeded
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#881337', lineHeight: 1.55 }}>
              In High Court and Supreme Court typing tests, candidates are permitted a maximum of <strong>3.0% errors of typed words</strong>. Your error rate was <strong>{Math.round(((result.equivalentErrors / Math.max(1, result.totalTypedWords)) * 100) * 10) / 10}%</strong> ({result.equivalentErrors} mistakes in {result.totalTypedWords} words).
            </p>
          </div>
        </div>
      )}

      {/* Official Cutoff Verification Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Official {result.qualificationCriteria.examTitle || 'Recruitment'} Benchmark Verification
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenRules && (
              <button
                type="button"
                onClick={() => onOpenRules(undefined, result.category)}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Verify official speed requirements and formula instructions"
              >
                <span>📋</span>
                <span>Official Instructions & Formula</span>
              </button>
            )}
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
              {result.calculationModel === 'rrb_eduquity' ? 'RRB CBTST Standards' :
               result.calculationModel === 'ssc_dest' ? 'SSC DEST Guidelines' :
               result.calculationModel === 'court_delhi' || result.calculationModel === 'court_ahc' || result.calculationModel === 'court_phhc' ? 'Court & Judicial Rules' :
               result.calculationModel === 'mp_cpct' ? 'MP CPCT Scoring Model' :
               'UPPRPB & National Standards'}
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}>Parameter</th>
                <th style={{ padding: '12px 16px' }}>Official Benchmark</th>
                <th style={{ padding: '12px 16px' }}>Achieved Score</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Primary Speed Parameter */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {result.calculationModel === 'rrb_eduquity' ? 'RRB Net CBTST Speed' : 'Net Typing Speed'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {result.calculationModel === 'rrb_eduquity' ? '(Typed Words - Penalty Words) / Time' :
                     result.calculationModel === 'mp_cpct' ? 'Correct Words / Minutes' :
                     'Board Formula: Gross WPM - (Errors / Time)'}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>&ge; {result.qualificationCriteria.requiredSpeed} WPM</td>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: (result.rrbNetWpm || result.netWpm) >= result.qualificationCriteria.requiredSpeed ? '#16a34a' : '#dc2626' }}>
                  {result.calculationModel === 'rrb_eduquity' ? `${result.rrbNetWpm} WPM` : `${result.netWpm} WPM`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {(result.rrbNetWpm || result.netWpm) >= result.qualificationCriteria.requiredSpeed ? (
                    <span className="badge badge-green">PASSED</span>
                  ) : (
                    <span className="badge badge-red">FAILED</span>
                  )}
                </td>
              </tr>

              {/* Row 2: Accuracy or Error Metric */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {result.calculationModel === 'ssc_dest' ? 'DEST Error Percentage' :
                     result.calculationModel === 'court_delhi' ? 'Court Error Percentage' :
                     result.calculationModel === 'court_ahc' ? 'Allahabad HC Total Marks' :
                     result.calculationModel === 'rrb_eduquity' ? '5% Free Error Allowance' :
                     'Official Passage Accuracy'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {result.calculationModel === 'ssc_dest' ? `Total mistakes / Master words (${result.totalOriginalWords})` :
                     result.calculationModel === 'court_delhi' ? `Total mistakes / Attempted words (${result.totalTypedWords})` :
                     result.calculationModel === 'court_ahc' ? '50 Marks scale (0.1 mark deducted per mistake)' :
                     result.calculationModel === 'rrb_eduquity' ? '5% permissible mistake margin on typed words' :
                     `Calculated against total passage (${result.totalOriginalWords} words)`}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {result.calculationModel === 'ssc_dest' ? `≤ ${result.qualificationCriteria.examTitle?.includes('CHSL') ? 7 : 20}%` :
                   result.calculationModel === 'court_delhi' ? '≤ 3.0%' :
                   result.calculationModel === 'court_ahc' ? '≥ 25.0 / 50 Marks' :
                   result.calculationModel === 'rrb_eduquity' ? `${result.allowedErrors} Mistakes Allowed` :
                   `≥ ${result.qualificationCriteria.requiredAccuracy}%`}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: result.isQualified ? '#16a34a' : '#dc2626' }}>
                  {result.calculationModel === 'ssc_dest' ? `${result.sscErrorPercentage}%` :
                   result.calculationModel === 'court_delhi' ? `${Math.round(((result.equivalentErrors / Math.max(1, result.totalTypedWords)) * 100) * 10) / 10}%` :
                   result.calculationModel === 'court_ahc' ? `${result.courtMarks} / 50.0` :
                   result.calculationModel === 'rrb_eduquity' ? `${result.equivalentErrors} Mistakes Typed` :
                   `${result.accuracy}%`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {result.isQualified ? (
                    <span className="badge badge-green">PASSED</span>
                  ) : (
                    <span className="badge badge-red">FAILED</span>
                  )}
                </td>
              </tr>

              {/* Row 3: Diagnostic Precision & Keystrokes */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {result.calculationModel === 'ssc_dest' ? 'Total Keystrokes Depressed' : 'Raw Typing Precision'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {result.calculationModel === 'ssc_dest' ? `Standard 5 keystrokes = 1 word (${result.totalTypedWords} standard words)` :
                     `Precision on attempted words (${result.totalTypedWords} words)`}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {result.calculationModel === 'ssc_dest' ? '2,000 / 1,750 Target' : 'Diagnostic Metric'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                  {result.calculationModel === 'ssc_dest' ? `${result.totalKeystrokes} Keys` : `${result.typedAccuracy}%`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge badge-blue">
                    {result.calculationModel === 'ssc_dest' ? 'CAPTURED' : (result.typedAccuracy >= 85 ? 'HIGH PRECISION' : 'NEEDS PRACTICE')}
                  </span>
                </td>
              </tr>

              {/* Row 4: Completion or CPCT Tier */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {result.calculationModel === 'mp_cpct' ? 'CPCT Proficiency Grade' : 'Passage Completion Rate'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {result.calculationModel === 'mp_cpct' ? 'Official MPSEDC Certification Tier' :
                     `${result.totalTypedWords} typed / ${result.totalOriginalWords} in passage`}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {result.calculationModel === 'mp_cpct' ? 'Level 1-4' : '≥ 85.0% Recommended'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: result.completionRate >= 85 || result.cpctBand?.includes('Level') ? '#16a34a' : '#d97706' }}>
                  {result.calculationModel === 'mp_cpct' ? (result.cpctBand || 'Level 4') : `${result.completionRate}%`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge ${result.completionRate >= 85 || result.cpctBand?.includes('Level') ? 'badge-green' : 'badge-red'}`}>
                    {result.calculationModel === 'mp_cpct' ? 'CERTIFIED' : (result.completionRate >= 85 ? 'SUFFICIENT' : 'INCOMPLETE')}
                  </span>
                </td>
              </tr>

              {/* Row 5: Duration */}
              <tr>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Duration & Exam Font</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Official countdown & keyboard layout</div>
                </td>
                <td style={{ padding: '12px 16px' }}>{result.timeAllowedMinutes} Mins</td>
                <td style={{ padding: '12px 16px' }}>
                  {Math.round(result.timeTakenSeconds / 60 * 10) / 10} Mins / {result.language === 'hindi_mangal' ? 'Mangal Inscript' : result.language === 'hindi_kruti' ? 'Kruti Dev 010' : 'English'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge badge-blue">COMPLETED</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Exam Pattern Breakdown Simulator Card */}
      <div className="card" style={{ marginBottom: '28px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧮</span>
            <span>
              {result.calculationModel === 'rrb_eduquity' ? 'RRB NTPC CBTST & CAPF Error Allowance Model (5% Free Margin)' :
               result.calculationModel === 'ssc_dest' ? 'Staff Selection Commission DEST Scoring Breakdown' :
               result.calculationModel === 'court_ahc' ? 'Allahabad High Court 50 Marks Marking Model' :
               result.calculationModel === 'court_delhi' ? 'High Court & Supreme Court 3% Error Tolerance Model' :
               result.calculationModel === 'mp_cpct' ? 'MP CPCT Examination Speed & Band Breakdown' :
               'Eduquity & UPPRPB Error Deduction Engine (5% Free Margin Model)'}
            </span>
          </h3>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
            Official Exam Pattern Standard
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Equivalent Mistakes</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
              {result.equivalentErrors} Errors
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{result.fullMistakes} Full + {result.halfMistakes} Half (0.5×)</div>
          </div>

          <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
              {result.calculationModel === 'court_ahc' ? 'Mark Deduction' :
               result.calculationModel === 'ssc_dest' ? 'Permissible Error Cutoff' :
               '5% Free Error Allowance'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              {result.calculationModel === 'court_ahc' ? `-${Math.round(result.equivalentErrors * 0.1 * 10) / 10} M` :
               result.calculationModel === 'ssc_dest' ? `${result.qualificationCriteria.examTitle?.includes('CHSL') ? 7 : 20}%` :
               `${result.allowedErrors} Exempt`}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
              {result.calculationModel === 'court_ahc' ? '0.1 mark per mistake' :
               result.calculationModel === 'ssc_dest' ? 'Maximum allowed error %' :
               '5% permissible margin on typed words'}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>
              {result.calculationModel === 'ssc_dest' ? 'Your DEST Error Rate' : 'Excess Mistakes (Penalized)'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.excessMistakes > 0 || (result.sscErrorPercentage && result.sscErrorPercentage > 7) ? '#ea580c' : '#16a34a', marginTop: '2px' }}>
              {result.calculationModel === 'ssc_dest' ? `${result.sscErrorPercentage}%` : `${result.excessMistakes} Mistakes`}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#c2410c' }}>
              {result.calculationModel === 'ssc_dest' ? 'Mistakes / Total Words * 100' : 'Max(0, Total Mistakes - 5% Margin)'}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
              {result.calculationModel === 'court_ahc' ? 'Final Score Obtained' : 'Penalty Words Deducted'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.penaltyWords > 0 ? '#b91c1c' : '#16a34a', marginTop: '2px' }}>
              {result.calculationModel === 'court_ahc' ? `${result.courtMarks} / 50` : `-${result.penaltyWords} Words`}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>
              {result.calculationModel === 'court_ahc' ? 'Passing marks: 25.0 / 50' : 'Excess Mistakes × 10 Words'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.86rem', color: '#334155' }}>
            <strong>Board Net Speed:</strong> <span style={{ color: '#0284c7', fontWeight: 800 }}>{result.netWpm} WPM</span> &bull; <strong>Eduquity/RRB Net Speed:</strong> <span style={{ color: '#7c3aed', fontWeight: 800 }}>{result.eduquityNetWpm} WPM</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Verified against official recruitment board algorithms
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Net Speed (WPM)
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--primary)' }}>
            {result.netWpm}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cutoff: &ge; {result.qualificationCriteria.requiredSpeed} WPM</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Gross Speed
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a' }}>
            {result.grossWpm}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Strokes / 5 / Min</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Official Accuracy
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: result.accuracy >= 85 ? '#16a34a' : '#dc2626' }}>
            {result.accuracy}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Passage Cutoff: &ge; 85.0%</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Passage Completed
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: result.completionRate >= 85 ? '#0284c7' : '#ea580c' }}>
            {result.completionRate}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{result.totalTypedWords} / {result.totalOriginalWords} words</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Keystrokes
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#334155' }}>
            {result.totalKeystrokes}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Backspaces: {result.backspaceCount}</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Full Mistakes
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#dc2626' }}>
            {result.fullMistakes}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>1 Error Point Each</span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Half Mistakes
          </span>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#d97706' }}>
            {result.halfMistakes}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0.5 Error Point Each</span>
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
