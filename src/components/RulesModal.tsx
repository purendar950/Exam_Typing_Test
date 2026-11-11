import React, { useState, useEffect, useMemo } from 'react';
import { OFFICIAL_EXAM_RULES, OfficialExamRule, getOfficialRuleForExam } from '../data/officialExamRules';
import { ExamLogo } from '../utils/examLogos';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExamId?: string;
  initialCategoryGroup?: string;
}

const CATEGORY_TABS = [
  { id: 'all_matrix', label: '📊 All Exams Matrix', icon: '📊' },
  { id: 'up_govt', label: 'UP Police & UPPSC', icon: '👮' },
  { id: 'railways', label: 'Railways RRB NTPC', icon: '🚂' },
  { id: 'ssc', label: 'SSC CGL & CHSL DEST', icon: '🏢' },
  { id: 'judiciary', label: 'Courts & Judiciary', icon: '⚖️' },
  { id: 'state_exams', label: 'MP CPCT & State', icon: '🎓' },
  { id: 'delhi_govt', label: 'Delhi & DSSSB', icon: '🛡️' },
  { id: 'defense', label: 'Paramilitary & Defense', icon: '🪖' },
  { id: 'central_nta', label: 'Central NTA & Univ', icon: '🏛️' },
  { id: 'bihar', label: 'Bihar BSSC & Beltron', icon: '🌾' }
];

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  initialExamId,
  initialCategoryGroup
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialCategoryGroup || 'up_govt');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(initialExamId || 'up-police-co-asi');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialExamId) {
      const rule = getOfficialRuleForExam(initialExamId, initialCategoryGroup);
      if (rule) {
        setSelectedRuleId(rule.id);
        setActiveTab(rule.categoryGroup);
      }
    } else if (initialCategoryGroup) {
      setActiveTab(initialCategoryGroup);
      const firstInGroup = OFFICIAL_EXAM_RULES.find((r) => r.categoryGroup === initialCategoryGroup);
      if (firstInGroup) {
        setSelectedRuleId(firstInGroup.id);
      }
    }
  }, [initialExamId, initialCategoryGroup, isOpen]);

  const activeRule = useMemo(() => {
    return OFFICIAL_EXAM_RULES.find((r) => r.id === selectedRuleId) || OFFICIAL_EXAM_RULES[0];
  }, [selectedRuleId]);

  const groupRules = useMemo(() => {
    if (activeTab === 'all_matrix') return OFFICIAL_EXAM_RULES;
    return OFFICIAL_EXAM_RULES.filter((r) => r.categoryGroup === activeTab);
  }, [activeTab]);

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return groupRules;
    const q = searchQuery.toLowerCase();
    return OFFICIAL_EXAM_RULES.filter((r) =>
      r.postTitle.toLowerCase().includes(q) ||
      r.organization.toLowerCase().includes(q) ||
      r.notificationRef.toLowerCase().includes(q) ||
      r.hindiFont.toLowerCase().includes(q) ||
      r.errorCutoff.toLowerCase().includes(q)
    );
  }, [groupRules, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000, padding: '16px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
          background: 'var(--surface)'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-slate-900) 0%, var(--tw-slate-800) 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--tw-sky-600)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📜</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--tw-slate-50)', letterSpacing: '-0.02em' }}>
                Official Examination Typing Guidelines & Speed Verification
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tw-slate-400)' }}>
                Verified recruitment board standards, qualifying speeds, calculation models, and exam day instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Category Navigation Ribbon & Search */}
        <div
          style={{
            background: 'var(--bg-slate-50)',
            borderBottom: '1px solid var(--bd-slate-200)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '75%' }}>
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'all_matrix') {
                      const firstInGrp = OFFICIAL_EXAM_RULES.find((r) => r.categoryGroup === tab.id);
                      if (firstInGrp) setSelectedRuleId(firstInGrp.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 800 : 600,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--tw-sky-600)' : 'var(--bd-slate-300)',
                    background: isActive ? 'var(--tw-sky-600)' : 'var(--surface)',
                    color: isActive ? '#ffffff' : 'var(--fg-slate-600)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search exam, font, rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 28px',
                fontSize: '0.8rem',
                borderRadius: '16px',
                border: '1px solid var(--bd-slate-300)',
                outline: 'none',
                background: 'var(--surface)'
              }}
            />
            <span style={{ position: 'absolute', left: '8px', top: '5px', fontSize: '0.8rem', color: 'var(--tw-slate-400)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {activeTab === 'all_matrix' ? (
            /* ============================================================ */
            /* VIEW 1: MASTER VERIFICATION MATRIX (ALL EXAMS TABLE)         */
            /* ============================================================ */
            <div>
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
                    Pan-India Official Typing Exam Speed & Criteria Matrix
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                    Authentic benchmarks extracted from gazette recruitment notifications
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-sky-600)', background: 'var(--bg-sky-100)', padding: '4px 8px', borderRadius: '4px' }}>
                  Total Verified Categories: {OFFICIAL_EXAM_RULES.length}
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--bd-slate-300)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-slate-100)', color: 'var(--fg-slate-800)', borderBottom: '2px solid var(--bd-slate-300)' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Examination & Post</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Authority</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Hindi Speed</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>English Speed</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Duration</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Allowed Font / Layout</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Cutoff / Formula</th>
                      <th style={{ padding: '8px 10px', fontWeight: 800 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule, idx) => (
                      <tr
                        key={rule.id}
                        style={{
                          background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg-slate-50)',
                          borderBottom: '1px solid var(--bd-slate-200)'
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ExamLogo identifier={rule.id} categoryGroup={rule.categoryGroup} size={24} />
                            <span>{rule.postTitle}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--fg-slate-600)' }}>
                          {rule.organization}
                        </td>
                        <td style={{ padding: '8px 10px', color: rule.hindiSpeed ? 'var(--fg-amber-700)' : 'var(--tw-slate-400)', fontWeight: 700 }}>
                          {rule.hindiSpeed ? `${rule.hindiSpeed} WPM` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', color: rule.englishSpeed ? 'var(--fg-sky-700)' : 'var(--tw-slate-400)', fontWeight: 700 }}>
                          {rule.englishSpeed ? `${rule.englishSpeed} WPM` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          {rule.durationMinutes} Mins
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--fg-slate-700)' }}>
                          {rule.hindiFont.split('(')[0]}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--fg-teal-700)', fontWeight: 600 }}>
                          {rule.errorCutoff}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <button
                            onClick={() => {
                              setSelectedRuleId(rule.id);
                              setActiveTab(rule.categoryGroup);
                            }}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'var(--bg-sky-100)',
                              color: 'var(--fg-sky-700)',
                              border: '1px solid var(--bd-sky-200)',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            View Details ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* VIEW 2: DEEP DIVE INTO SPECIFIC EXAM OFFICIAL INSTRUCTIONS   */
            /* ============================================================ */
            <div>
              {/* Exam Variant Switcher (if group has multiple) */}
              {groupRules.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {groupRules.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRuleId(r.id)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.8rem',
                        fontWeight: selectedRuleId === r.id ? 800 : 600,
                        background: selectedRuleId === r.id ? 'var(--tw-slate-900)' : 'var(--bg-slate-100)',
                        color: selectedRuleId === r.id ? '#ffffff' : 'var(--fg-slate-700)',
                        border: '1px solid',
                        borderColor: selectedRuleId === r.id ? 'var(--tw-slate-900)' : 'var(--bd-slate-300)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {r.postTitle}
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Notification Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--bg-sky-50) 0%, var(--bg-sky-100) 100%)',
                  border: '1.5px solid var(--bd-sky-300)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ExamLogo identifier={activeRule.id} categoryGroup={activeRule.categoryGroup} size={48} />
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-sky-700)', background: 'var(--bg-sky-200)', padding: '2px 8px', borderRadius: '4px' }}>
                        {activeRule.organization}
                      </span>
                      <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-sky-900)' }}>
                        {activeRule.postTitle}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fg-sky-700)', fontWeight: 600 }}>
                        📋 Official Reference: {activeRule.notificationRef}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'var(--tw-sky-600)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                      ⏱️ {activeRule.durationMinutes} Minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Key Benchmark Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}
              >
                {/* Hindi Speed */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-orange-200)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-orange-700)', textTransform: 'uppercase' }}>
                    🇮🇳 Hindi Qualifying Speed
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-orange-800)', marginTop: '2px' }}>
                    {activeRule.hindiSpeed ? `${activeRule.hindiSpeed} WPM` : 'Optional / N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-orange-900)', marginTop: '2px' }}>
                    {activeRule.hindiFont.split('(')[0]}
                  </div>
                </div>

                {/* English Speed */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-sky-200)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-sky-700)', textTransform: 'uppercase' }}>
                    🇬🇧 English Qualifying Speed
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-sky-800)', marginTop: '2px' }}>
                    {activeRule.englishSpeed ? `${activeRule.englishSpeed} WPM` : 'Optional / N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-900)', marginTop: '2px' }}>
                    Standard QWERTY layout
                  </div>
                </div>

                {/* Accuracy / Error Cutoff */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-green-200)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-green-700)', textTransform: 'uppercase' }}>
                    🎯 Official Error Cutoff
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-green-800)', marginTop: '2px' }}>
                    {activeRule.errorCutoff}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-900)', marginTop: '2px' }}>
                    Strict board threshold
                  </div>
                </div>

                {/* Scoring Model */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-slate-600)', textTransform: 'uppercase' }}>
                    🧮 Calculation Model
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fg-slate-800)', marginTop: '2px' }}>
                    {activeRule.calculationModel.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                    Integrated scoring engine
                  </div>
                </div>
              </div>

              {/* SECTION 1: Evaluation Formula & Mistakes Classification */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--bd-slate-300)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧮</span>
                  <span>Official Calculation Formula & Deduction Rules</span>
                </h4>
                <div
                  style={{
                    background: 'var(--bg-slate-50)',
                    borderLeft: '4px solid var(--tw-sky-600)',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: 'var(--fg-slate-900)',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                >
                  {activeRule.penaltyFormula}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Full Mistakes */}
                  <div style={{ background: 'var(--bg-red-50)', border: '1px solid var(--bd-red-200)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--fg-red-700)', marginBottom: '6px' }}>
                      ❌ Full Mistake (1 Full Penalty Word):
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--fg-red-900)', lineHeight: 1.5 }}>
                      {activeRule.fullMistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Half Mistakes */}
                  <div style={{ background: 'var(--bg-amber-50)', border: '1px solid var(--bd-amber-200)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--fg-amber-700)', marginBottom: '6px' }}>
                      ⚠️ Half Mistake (0.5 Penalty Word):
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--fg-amber-900)', lineHeight: 1.5 }}>
                      {activeRule.halfMistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Keyboard Layouts & Font Rules */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--bd-slate-300)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⌨️</span>
                  <span>Mandatory Keyboard Layout & Font Requirements</span>
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-700)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Hindi Layout:</strong> {activeRule.hindiFont}
                  </p>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>English Layout:</strong> {activeRule.englishFont}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fg-sky-700)', background: 'var(--bg-sky-50)', padding: '6px 10px', borderRadius: '4px' }}>
                    💡 Pro Tip: On our platform, switch seamlessly between <strong>Mangal Inscript</strong> and <strong>Kruti Dev 010</strong> anytime using the layout switcher!
                  </p>
                </div>
              </div>

              {/* SECTION 3: Software Interface Rules (Backspace & Retyping) */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--bd-slate-300)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🖥️</span>
                  <span>Official Exam Interface & Software Controls</span>
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-700)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: 700, minWidth: '130px', color: 'var(--fg-slate-800)' }}>Backspace Policy:</span>
                    <span>{activeRule.backspaceRule}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: 700, minWidth: '130px', color: 'var(--fg-slate-800)' }}>Re-typing Rule:</span>
                    <span style={{ color: activeRule.retypingRule.includes('MANDATORY') ? 'var(--fg-red-700)' : 'var(--fg-slate-700)', fontWeight: activeRule.retypingRule.includes('MANDATORY') ? 700 : 400 }}>
                      {activeRule.retypingRule}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Official Examination Day Checklist */}
              <div
                style={{
                  background: 'var(--bg-slate-50)',
                  border: '1.5px dashed var(--bd-slate-400)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✅</span>
                  <span>Official Examination Day Dos & Don'ts Checklist</span>
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--fg-slate-600)', lineHeight: 1.6 }}>
                  {activeRule.examChecklist.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {item}
                    </li>
                  ))}
                  <li>
                    Practice under exact timer pressure (10 or 15 mins) daily on our official passages to ensure finger stamina.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: 'var(--bg-slate-100)',
            borderTop: '1px solid var(--bd-slate-300)',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--fg-slate-500)'
          }}
        >
          <span>
            Verified against authentic recruitment notifications (UPPRPB, RRB Eduquity, SSC DEST, High Courts, MP CPCT).
          </span>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '6px 18px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
};
