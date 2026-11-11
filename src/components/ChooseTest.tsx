import React, { useState, useMemo, useEffect } from 'react';
import { Ico, EmojiIco } from './Ico';
import { Passage, Language, ExamCategory, TestSettings, EvaluationResult, UnifiedExamPost } from '../types';
import { ALL_EXAMS, CATEGORY_GROUPS, CATEGORY_SUB_FILTERS, UNIFIED_EXAM_POSTS, ExamProfile } from '../data/allExams';
import { UserProfile } from '../services/firebase';
import { isTestLocked, hasExamProAccess, isUserAdmin } from '../services/paymentService';
import { getFallbackDailyPassages } from '../services/aiGenerator';
import appLogo from '../assets/logo.webp';
import { ExamLogo, getExamTheme, CardWatermark } from '../utils/examLogos';
import { getExamBackspaceRule } from '../utils/examBackspaceRules';

interface ChooseTestProps {
  passages: Passage[];
  onStartTest: (passage: Passage, customDurationMinutes?: number, examProfile?: ExamProfile | null) => void;
  settings: TestSettings;
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void;
  currentUser?: UserProfile | null;
  history?: EvaluationResult[];
  onOpenAuth?: () => void;
  onOpenDashboard?: () => void;
  onOpenAiGenerator?: () => void;
  onOpenAdmin?: () => void;
  onOpenPayment?: (examId?: string) => void;
  onOpenRules?: (examId?: string, categoryGroup?: string) => void;
  dailyLivePassages?: Passage[];
}

// Level 1: Exam Definition Interface
interface ExamCourse {
  id: string;
  title: string;
  shortTitle: string;
  emblemEmoji: string;
  badge: string;
  passingBenchmark: string;
  categoryFilter?: ExamCategory | 'all' | 'drills' | 'mock15';
  description: string;
}

// Level 2: Mode Definition Interface
interface ExamMode {
  id: string;
  title: string;
  icon: string;
  bg: string;
  border: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  languageFilter?: Language | 'all';
  durationFilter?: number;
}

// Reusable Benchmark Test Card (Examination Grade Card Component)
interface ExamBenchmarkTestCardProps {
  emblem: string;
  logoIdentifier?: string;
  categoryGroup?: string;
  categoryOrOrg: string;
  language: string;
  title: string;
  targetSpeed: number;
  durationMinutes: number;
  minAccuracy: number;
  limitCount?: number;
  limitType?: 'Words' | 'Chars';
  extraBadge?: { text: string; bg: string; color: string; border?: string };
  pastAttempt?: {
    isQualified: boolean;
    bestSpeed: number;
    bestAcc: number;
    count: number;
  };
  onStartMock: () => void;
  onBrowse?: () => void;
  startBtnText?: string;
  browseBtnText?: string;
  isLocked?: boolean;
  isDemo?: boolean;
  onUnlock?: () => void;
}

const ExamBenchmarkTestCard: React.FC<ExamBenchmarkTestCardProps> = ({
  emblem,
  logoIdentifier,
  categoryGroup,
  categoryOrOrg,
  language,
  title,
  targetSpeed,
  durationMinutes,
  minAccuracy,
  limitCount = 350,
  limitType = 'Words',
  extraBadge,
  pastAttempt,
  onStartMock,
  onBrowse,
  startBtnText,
  browseBtnText = 'Browse',
  isLocked = false,
  isDemo = false,
  onUnlock
}) => {
  const getLanguagePill = (lang: string) => {
    if (lang === 'english') {
      return { label: 'English', bg: 'var(--bg-blue-50)', color: 'var(--fg-blue-700)', border: 'var(--bd-blue-200)' };
    }
    if (lang === 'hindi_mangal' || lang === 'mangal') {
      return { label: 'Mangal Inscript', bg: 'var(--bg-amber-100)', color: 'var(--fg-amber-700)', border: 'var(--bd-amber-200)' };
    }
    if (lang === 'hindi_kruti' || lang === 'kruti') {
      return { label: 'Kruti Dev', bg: 'var(--bg-fuchsia-100)', color: 'var(--fg-fuchsia-800)', border: 'var(--bd-fuchsia-200)' };
    }
    if (lang.startsWith('hindi')) {
      return { label: 'Mangal Inscript', bg: 'var(--bg-amber-100)', color: 'var(--fg-amber-700)', border: 'var(--bd-amber-200)' };
    }
    return { label: lang, bg: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)', border: 'var(--bd-slate-200)' };
  };

  const langStyle = getLanguagePill(language);

  const handleCardClick = () => {
    if (isLocked) {
      if (onUnlock) onUnlock();
    } else {
      onStartMock();
    }
  };

  const cardTheme = getExamTheme(logoIdentifier || '', categoryGroup);

  return (
    <div
      className="examportal-exam-card exam-card-hover benchmark-test-card"
      onClick={handleCardClick}
      style={{
        position: 'relative',
        isolation: 'isolate',
        background: cardTheme.bg,
        border: isLocked ? '1.5px solid var(--bd-orange-200)' : `1.5px solid ${cardTheme.border}`,
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: isLocked ? '0 2px 6px rgba(217, 119, 6, 0.06)' : '0 2px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.18s ease',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'left',
        alignItems: 'stretch'
      }}
    >
      <CardWatermark identifier={logoIdentifier || ''} categoryGroup={categoryGroup} />
      <div style={{ minWidth: 0 }}>
        {/* Top Header: Organization/Category on left + Language pill on right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '10px',
          gap: '8px',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
            {logoIdentifier ? (
              <ExamLogo identifier={logoIdentifier} categoryGroup={categoryGroup} size={26} />
            ) : (
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}><EmojiIco e={emblem} /></span>
            )}
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'var(--bg-slate-100)',
              color: 'var(--fg-slate-600)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {categoryOrOrg}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            minWidth: 0
          }}>
            {isDemo && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'var(--bg-green-100)',
                color: 'var(--fg-green-700)',
                border: '1px solid var(--bd-green-300)',
                whiteSpace: 'nowrap'
              }}>
                <Ico n="gift" /> FREE DEMO
              </span>
            )}
            {isLocked && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'var(--bg-amber-100)',
                color: 'var(--fg-amber-700)',
                border: '1px solid var(--bd-amber-200)',
                whiteSpace: 'nowrap'
              }}>
                <Ico n="lock" /> PRO TEST
              </span>
            )}
            {extraBadge && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: extraBadge.bg,
                color: extraBadge.color,
                border: extraBadge.border ? `1px solid ${extraBadge.border}` : 'none',
                whiteSpace: 'nowrap'
              }}>
                {extraBadge.text}
              </span>
            )}
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: langStyle.bg,
              color: langStyle.color,
              border: `1px solid ${langStyle.border}`,
              whiteSpace: 'nowrap'
            }}>
              {langStyle.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: 'var(--fg-slate-900)',
          margin: '0 0 10px 0',
          lineHeight: 1.35,
          minHeight: '40px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {title}
        </h3>

        {/* 4 Complete Benchmark Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', alignItems: 'center', minWidth: 0 }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-green-50)',
            color: 'var(--fg-green-600)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-green-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ico n="target" /> {targetSpeed} WPM Speed
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-slate-50)',
            color: 'var(--fg-slate-600)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-slate-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⏱️ {durationMinutes} Mins
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-amber-50)',
            color: 'var(--fg-amber-700)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-amber-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ico n="target" /> ≥ {minAccuracy}% Accuracy
          </span>

          <span style={{
            fontSize: '0.75rem',
            color: 'var(--fg-slate-500)',
            fontWeight: 600,
            padding: '3px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Ico n="ruler" /> {limitCount} {limitType}
          </span>
        </div>

        {/* Pro Lock Notice */}
        {isLocked && (
          <div style={{
            background: 'var(--bg-amber-50)',
            border: '1px solid var(--bd-amber-200)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--fg-amber-800)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            minWidth: 0
          }}>
            <span style={{ flexShrink: 0 }}><Ico n="lock" /></span>
            <span style={{ minWidth: 0, wordBreak: 'break-word' }}>
              Pro Test Series • Tests 1–7 Free Demo • Unlock with Pro Pass
            </span>
          </div>
        )}

        {/* Past Candidate Score if attempted */}
        {pastAttempt ? (
          <div style={{
            background: pastAttempt.isQualified ? 'var(--bg-green-50)' : 'var(--bg-amber-50)',
            border: `1px solid ${pastAttempt.isQualified ? 'var(--bd-green-200)' : 'var(--bd-amber-200)'}`,
            color: pastAttempt.isQualified ? 'var(--fg-green-700)' : 'var(--fg-amber-700)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '4px',
            minWidth: 0
          }}>
            <span><Ico n="check" /> {pastAttempt.isQualified ? 'Qualified' : 'Attempted'} • Best: {pastAttempt.bestSpeed} WPM ({pastAttempt.bestAcc}%)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{pastAttempt.count} {pastAttempt.count === 1 ? 'try' : 'tries'}</span>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid var(--bd-slate-100)',
          paddingTop: '12px',
          flexWrap: 'wrap',
          minWidth: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLocked ? (
          <>
            <button
              onClick={onUnlock}
              className="btn btn-warning"
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.875rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-amber-600) 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
              }}
              title="Unlock full official test series with Pro access"
            >
              <span><Ico n="lock" /></span>
              <span>Unlock with Pro</span>
            </button>

            <button
              onClick={onUnlock}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.875rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: 'var(--fg-amber-600)',
                borderColor: 'var(--bd-orange-200)'
              }}
              title="View pricing & plans"
            >
              <span><Ico n="gem" /> Plans</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStartMock}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title={`Start official ${durationMinutes}-minute test with ${targetSpeed} WPM speed cutoff`}
            >
              <Ico n={isDemo ? 'gift' : 'zap'} />
              <span>{startBtnText || (isDemo ? `Start Free Demo (${durationMinutes}m)` : `Start Mock (${durationMinutes}m)`)}</span>
            </button>

            <button
              onClick={onBrowse || onStartMock}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.875rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Browse exam passages"
            >
              <span>{browseBtnText}</span>
              <span>→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Component for an Exam Type Card (shows inside tests: English, Hindi, Live, Drills)
const ExamTypePostCard: React.FC<{
  post: UnifiedExamPost;
  onEnterExam: (post: UnifiedExamPost) => void;
  onQuickMode: (post: UnifiedExamPost, modeId: string, variant: ExamProfile) => void;
  onQuickStart: (post: UnifiedExamPost) => void;
  getEmblemForGroup: (group: string) => string;
  onOpenRules?: (examId?: string, categoryGroup?: string) => void;
}> = ({ post, onEnterExam, onQuickMode, onQuickStart, getEmblemForGroup, onOpenRules }) => {
  const engVariant = post.variants.find((v) => v.language === 'english');
  const mangalVariant = post.variants.find((v) => v.language.startsWith('hindi'));
  const hasEnglish = Boolean(engVariant);
  const hasHindi = Boolean(mangalVariant);
  const primaryVariant = engVariant || mangalVariant || post.variants[0];
  const duration = primaryVariant?.durationMinutes || 15;
  const minAcc = primaryVariant?.minAccuracy || 85;

  const speedText = useMemo(() => {
    if (mangalVariant && engVariant) {
      return `Hindi ${mangalVariant.targetSpeed} / Eng ${engVariant.targetSpeed}`;
    }
    if (mangalVariant) return `Hindi ${mangalVariant.targetSpeed}`;
    if (engVariant) return `English ${engVariant.targetSpeed}`;
    return `${post.variants[0]?.targetSpeed || 30}`;
  }, [mangalVariant, engVariant, post]);

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'computer_operator':
        return { bg: 'var(--bg-sky-100)', color: 'var(--fg-sky-700)', border: 'var(--bd-sky-200)' };
      case 'asi':
        return { bg: 'var(--bg-amber-100)', color: 'var(--fg-amber-700)', border: 'var(--bd-amber-200)' };
      case 'ro_aro':
        return { bg: 'var(--bg-purple-100)', color: 'var(--fg-purple-700)', border: 'var(--bd-purple-200)' };
      case 'court_jja':
        return { bg: 'var(--bg-emerald-50)', color: 'var(--fg-emerald-700)', border: 'var(--bd-emerald-200)' };
      case 'deo':
        return { bg: 'var(--bg-orange-100)', color: 'var(--fg-orange-700)', border: 'var(--bd-orange-200)' };
      case 'steno':
        return { bg: 'var(--bg-pink-100)', color: 'var(--fg-pink-700)', border: 'var(--bd-pink-200)' };
      default:
        return { bg: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)', border: 'var(--bd-slate-200)' };
    }
  };

  const badgeStyle = getTypeBadgeStyle(post.examType);
  const postTheme = getExamTheme(post.id, post.categoryGroup);

  return (
    <div
      className="examportal-exam-card exam-card-hover benchmark-test-card"
      onClick={() => onEnterExam(post)}
      style={{
        position: 'relative',
        isolation: 'isolate',
        background: postTheme.bg,
        border: `1.5px solid ${postTheme.border}`,
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.18s ease',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'left',
        alignItems: 'stretch'
      }}
    >
      <CardWatermark identifier={post.id} categoryGroup={post.categoryGroup} />
      <div style={{ minWidth: 0 }}>
        {/* Top Header: Organization & Exam Type Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '10px',
          gap: '8px',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
            <ExamLogo identifier={post.id} categoryGroup={post.categoryGroup} size={32} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'var(--bg-slate-50)',
              color: 'var(--fg-slate-700)',
              border: '1px solid var(--bd-slate-200)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {post.organization}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenRules && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRules(post.id, post.categoryGroup);
                }}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'var(--bg-sky-50)',
                  color: 'var(--fg-sky-700)',
                  border: '1px solid var(--bd-sky-200)',
                  cursor: 'pointer'
                }}
                title="View official recruitment notification typing speed & instructions"
              >
                <Ico n="clipboard" /> Rules
              </button>
            )}
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: badgeStyle.bg,
              color: badgeStyle.color,
              border: `1px solid ${badgeStyle.border}`,
              whiteSpace: 'nowrap'
            }}>
              {post.examTypeLabel}
            </span>
          </div>
        </div>

        {/* Post Title */}
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: 'var(--fg-slate-900)',
          margin: '0 0 10px 0',
          lineHeight: 1.35,
          minHeight: '44px'
        }}>
          {post.postTitle}
        </h3>

        {/* 4 Complete Benchmark Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-green-50)',
            color: 'var(--fg-green-600)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-green-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ico n="target" /> {speedText} WPM Speed
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-slate-50)',
            color: 'var(--fg-slate-600)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-slate-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⏱️ {duration} Mins
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-amber-50)',
            color: 'var(--fg-amber-700)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-amber-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ico n="target" /> ≥ {minAcc}% Accuracy
          </span>

          <span style={{
            fontSize: '0.75rem',
            color: 'var(--fg-slate-500)',
            fontWeight: 600,
            padding: '3px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Ico n="ruler" /> {primaryVariant?.inputType === 'character' ? `${primaryVariant.inputLimit} Chars` : `${primaryVariant?.inputLimit || 500} Words`}
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-emerald-50)',
            color: 'var(--fg-emerald-700)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--bd-emerald-200)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Ico n="gift" /> 7 Free Demo Tests
          </span>

          {/* Backspace Rule Badge */}
          {(() => {
            const bsRule = getExamBackspaceRule(post);
            return (
              <span
                title={`${bsRule.title}\n${bsRule.fullRule}`}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: bsRule.badgeBg,
                  color: bsRule.badgeText,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${bsRule.badgeBorder}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'help'
                }}
              >
                {bsRule.badgeLabel}
              </span>
            );
          })()}
        </div>

        {/* Available Tests Inside: English, Hindi, Live, Drills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {hasEnglish && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickMode(post, 'english', engVariant!);
              }}
              style={{
                fontSize: '0.75rem',
                background: 'var(--bg-blue-50)',
                color: 'var(--fg-blue-700)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid var(--bd-blue-200)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Open English test mode"
            >
              <span>🇬🇧</span>
              <span>English ({engVariant?.targetSpeed} WPM)</span>
            </button>
          )}

          {hasHindi && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickMode(post, 'hindi_mangal', mangalVariant!);
              }}
              style={{
                fontSize: '0.75rem',
                background: 'var(--bg-amber-100)',
                color: 'var(--fg-amber-700)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid var(--bd-amber-200)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Open Hindi Mangal test mode"
            >
              <span>🇮🇳</span>
              <span>Hindi ({mangalVariant?.targetSpeed} WPM)</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickMode(post, 'daily_live', post.variants[0]);
            }}
            style={{
              fontSize: '0.75rem',
              background: 'var(--bg-orange-50)',
              color: 'var(--fg-orange-700)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 700,
              border: '1px solid var(--bd-orange-200)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Open Daily Live Tests"
          >
            <span><Ico n="flame" /></span>
            <span>Live Tests</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickMode(post, 'drills', post.variants[0]);
            }}
            style={{
              fontSize: '0.75rem',
              background: 'var(--bg-purple-50)',
              color: 'var(--fg-purple-700)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 700,
              border: '1px solid var(--bd-purple-200)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Open Speed Drills"
          >
            <span><Ico n="zap" /></span>
            <span>Drills</span>
          </button>
        </div>
      </div>

      {/* Actions: Start Mock + Browse Hub */}
      <div
        style={{
          borderTop: '1px solid var(--bd-slate-100)',
          paddingTop: '12px',
          display: 'flex',
          gap: '8px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onQuickStart(post)}
          className="btn btn-primary"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title={`Start official ${duration}-min free demo test`}
        >
          <span><Ico n="gift" /></span>
          <span>Start Free Demo ({duration}m)</span>
        </button>

        <button
          onClick={() => onEnterExam(post)}
          className="btn btn-secondary"
          style={{
            padding: '8px 14px',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
          title="Explore all tests and modes (Tests 1-7 Free Demo)"
        >
          <span>Browse Tests</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export interface RouteInfo {
  level: 1 | 2 | 3 | 'classic_form';
  examId: string;
  modeId: string;
}

export function parseExamRouteFromHash(): RouteInfo | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  if (!hash || hash === '#/' || hash === '#/exams') {
    return { level: 1, examId: 'up-police-co-asi', modeId: 'english' };
  }
  if (hash === '#/classic') {
    return { level: 'classic_form', examId: 'up-police-co-asi', modeId: 'english' };
  }
  const matchMode = hash.match(/^#\/exam\/([^/]+)\/([^/]+)/);
  if (matchMode) {
    return { level: 3, examId: matchMode[1], modeId: matchMode[2] };
  }
  const matchExam = hash.match(/^#\/exam\/([^/]+)/);
  if (matchExam) {
    return { level: 2, examId: matchExam[1], modeId: 'english' };
  }
  return null;
}

export const ChooseTest: React.FC<ChooseTestProps> = ({
  passages,
  onStartTest,
  settings,
  onUpdateSettings,
  currentUser,
  history = [],
  onOpenAuth,
  onOpenDashboard,
  onOpenAiGenerator,
  onOpenAdmin,
  onOpenPayment,
  onOpenRules,
  dailyLivePassages = []
}) => {
  // Navigation: 1 (All Exams), 2 (Medium / Mode Selection), 3 (Test Material Grid), or 'classic_form'
  const initialRoute = parseExamRouteFromHash() || (() => {
    try {
      const saved = sessionStorage.getItem('up_exam_nav_route');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [navLevel, setNavLevelState] = useState<1 | 2 | 3 | 'classic_form'>(() => {
    return initialRoute?.level || 1;
  });
  const [activeExamId, setActiveExamId] = useState<string>(() => {
    return initialRoute?.examId || 'up-police-co-asi';
  });
  const [activeModeId, setActiveModeId] = useState<string>(() => {
    return initialRoute?.modeId || 'english';
  });
  const [modeCategoryFilter, setModeCategoryFilter] = useState<'all' | 'languages' | 'simulations' | 'boosters'>('all');

  const [selectedUnifiedPost, setSelectedUnifiedPost] = useState<UnifiedExamPost | null>(() => {
    const eid = initialRoute?.examId || 'up-police-co-asi';
    if (initialRoute && (initialRoute.level === 2 || initialRoute.level === 3)) {
      return UNIFIED_EXAM_POSTS.find((p) => p.id === eid) || UNIFIED_EXAM_POSTS[0];
    }
    return null;
  });

  const [selectedExamProfile, setSelectedExamProfile] = useState<ExamProfile | null>(() => {
    if (initialRoute && (initialRoute.level === 2 || initialRoute.level === 3)) {
      const post = UNIFIED_EXAM_POSTS.find((p) => p.id === initialRoute.examId) || UNIFIED_EXAM_POSTS[0];
      if (initialRoute.level === 3 && initialRoute.modeId) {
        return post.variants.find((v) => v.language === initialRoute.modeId || v.slug.includes(initialRoute.modeId)) || post.variants[0] || null;
      }
      return post.variants[0] || null;
    }
    return null;
  });

  // Central Router for Level 1, 2, 3, and Classic Form
  const setNavLevel = (target: 1 | 2 | 3 | 'classic_form', optExamId?: string, optModeId?: string) => {
    const nextExamId = optExamId || activeExamId;
    const nextModeId = optModeId || activeModeId;

    setNavLevelState(target);
    if (optExamId) setActiveExamId(optExamId);
    if (optModeId) setActiveModeId(optModeId);

    let newHash = '#/';
    if (target === 'classic_form') {
      newHash = '#/classic';
    } else if (target === 2) {
      newHash = `#/exam/${nextExamId}`;
    } else if (target === 3) {
      newHash = `#/exam/${nextExamId}/${nextModeId}`;
    }

    try {
      sessionStorage.setItem('up_exam_nav_route', JSON.stringify({
        level: target,
        examId: nextExamId,
        modeId: nextModeId
      }));
    } catch {}

    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  };

  // Synchronize browser Back / Forward buttons with Level 1, 2, 3
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseExamRouteFromHash();
      if (!route) return;

      setNavLevelState(route.level);
      setActiveExamId(route.examId);
      setActiveModeId(route.modeId);

      const post = UNIFIED_EXAM_POSTS.find((p) => p.id === route.examId) || UNIFIED_EXAM_POSTS[0];
      if (route.level === 2) {
        setSelectedUnifiedPost(post);
        setSelectedExamProfile(post.variants[0] || null);
      } else if (route.level === 3) {
        setSelectedUnifiedPost(post);
        const variant = post.variants.find((v) => v.language === route.modeId || v.slug.includes(route.modeId)) || post.variants[0] || null;
        setSelectedExamProfile(variant);
      } else if (route.level === 1) {
        setSelectedUnifiedPost(null);
        setSelectedExamProfile(null);
        try {
          const filterGroup = sessionStorage.getItem('up_exam_filter_group');
          if (filterGroup) {
            setSelectedExamCategory(filterGroup);
            sessionStorage.removeItem('up_exam_filter_group');
          }
        } catch {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Level 3 Filter states
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const [level3SortBy, setLevel3SortBy] = useState<'number' | 'date_desc' | 'difficulty'>('number');

  // Classic Form states
  const [classicLanguage, setClassicLanguage] = useState<Language>('english');
  const [classicDate, setClassicDate] = useState<string>('2026-10-26');
  const [classicPassageId, setClassicPassageId] = useState<string>('');
  const [classicDuration, setClassicDuration] = useState<number>(15);
  const [classicInputLimit, setClassicInputLimit] = useState<string>('Words');
  const [isClassicDropdownOpen, setIsClassicDropdownOpen] = useState<boolean>(false);
  const [isLoadingPassages, setIsLoadingPassages] = useState<boolean>(false);

  // 129 All Exams Explorer State
  const [level1ViewMode, setLevel1ViewMode] = useState<'posts' | 'individual'>('posts');
  const [selectedExamCategory, setSelectedExamCategory] = useState<string>(() => {
    try {
      return sessionStorage.getItem('up_exam_filter_group') || 'all';
    } catch {
      return 'all';
    }
  });
  const [selectedExamSubFilter, setSelectedExamSubFilter] = useState<string>('all');
  const [examSearchQuery, setExamSearchQuery] = useState<string>('');
  const [selectedExamLanguageFilter, setSelectedExamLanguageFilter] = useState<'all' | 'english' | 'hindi'>('all');
  const [visibleExamsCount, setVisibleExamsCount] = useState<number>(24);

  const getEmblemForGroup = (group: string) => {
    switch (group) {
      case 'up_govt': return '👮';
      case 'judiciary': return '⚖️';
      case 'ssc': return '🏢';
      case 'delhi_govt': return '🛡️';
      case 'defense': return '🎖️';
      case 'bihar': return '🏛️';
      case 'central_nta': return '🎓';
      case 'railways': return '🚆';
      case 'state_exams': return '📋';
      default: return '📝';
    }
  };

  const availableSubFilters = useMemo(() => {
    return CATEGORY_SUB_FILTERS[selectedExamCategory] || CATEGORY_SUB_FILTERS['all'] || [];
  }, [selectedExamCategory]);

  const filteredUnifiedPosts = useMemo(() => {
    return UNIFIED_EXAM_POSTS.filter((post) => {
      // 1. Category filter
      if (selectedExamCategory !== 'all' && post.categoryGroup !== selectedExamCategory) {
        return false;
      }

      // 2. Sub-filter / Post Type filter
      if (selectedExamSubFilter !== 'all') {
        const matchType = post.examType === selectedExamSubFilter;
        const matchAsi = selectedExamSubFilter === 'asi' && (
          post.examType === 'asi' ||
          post.examTypeLabel.toLowerCase().includes('asi') ||
          post.postTitle.toLowerCase().includes('asi') ||
          post.postTitle.toLowerCase().includes('hcm')
        );
        const matchCo = selectedExamSubFilter === 'computer_operator' && (
          post.examType === 'computer_operator' ||
          post.postTitle.toLowerCase().includes('operator') ||
          post.postTitle.toLowerCase().includes('informatic')
        );
        const matchDeo = selectedExamSubFilter === 'deo' && (
          post.examType === 'deo' ||
          post.postTitle.toLowerCase().includes('deo') ||
          post.postTitle.toLowerCase().includes('dest')
        );
        const matchRoAro = selectedExamSubFilter === 'ro_aro' && (
          post.examType === 'ro_aro' ||
          post.postTitle.toLowerCase().includes('ro / aro') ||
          post.postTitle.toLowerCase().includes('ro/ aro')
        );
        const matchAssistant = selectedExamSubFilter === 'assistant' && (
          post.examType === 'assistant' ||
          post.postTitle.toLowerCase().includes('assistant') ||
          post.postTitle.toLowerCase().includes('clerk') ||
          post.postTitle.toLowerCase().includes('ldc') ||
          post.postTitle.toLowerCase().includes('jsa')
        );
        const matchCourt = selectedExamSubFilter === 'court_jja' && (
          post.examType === 'court_jja' ||
          post.categoryGroup === 'judiciary'
        );
        const matchSteno = selectedExamSubFilter === 'steno' && (
          post.examType === 'steno' ||
          post.postTitle.toLowerCase().includes('steno') ||
          post.postTitle.toLowerCase().includes('pa') ||
          post.postTitle.toLowerCase().includes('aps')
        );

        if (!matchType && !matchAsi && !matchCo && !matchDeo && !matchRoAro && !matchAssistant && !matchCourt && !matchSteno) {
          return false;
        }
      }

      // 3. Language filter
      if (selectedExamLanguageFilter === 'english') {
        const hasEng = post.variants.some((v) => v.language === 'english');
        if (!hasEng) return false;
      } else if (selectedExamLanguageFilter === 'hindi') {
        const hasHindi = post.variants.some((v) => v.language.startsWith('hindi'));
        if (!hasHindi) return false;
      }

      // 4. Search query
      if (examSearchQuery.trim()) {
        const q = examSearchQuery.toLowerCase();
        const matchTitle = post.postTitle.toLowerCase().includes(q);
        const matchOrg = post.organization.toLowerCase().includes(q);
        const matchTypeLabel = post.examTypeLabel.toLowerCase().includes(q);
        const matchVariants = post.variants.some((v) => v.title.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q));
        if (!matchTitle && !matchOrg && !matchTypeLabel && !matchVariants) {
          return false;
        }
      }

      return true;
    });
  }, [selectedExamCategory, selectedExamSubFilter, selectedExamLanguageFilter, examSearchQuery]);

  const filteredAllExams = useMemo(() => {
    return ALL_EXAMS.filter((exam) => {
      // 1. Category group filter
      if (selectedExamCategory !== 'all' && exam.categoryGroup !== selectedExamCategory) {
        return false;
      }
      // 2. Language filter
      if (selectedExamLanguageFilter === 'english' && exam.language !== 'english') {
        return false;
      }
      if (selectedExamLanguageFilter === 'hindi' && !exam.language.startsWith('hindi')) {
        return false;
      }
      // 3. Search query
      if (examSearchQuery.trim()) {
        const q = examSearchQuery.toLowerCase();
        const matchTitle = exam.title.toLowerCase().includes(q);
        const matchSlug = exam.slug.toLowerCase().includes(q);
        const matchGroup = exam.categoryGroup.toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchGroup) {
          return false;
        }
      }
      return true;
    });
  }, [selectedExamCategory, selectedExamLanguageFilter, examSearchQuery]);

  const getPostCountForSubFilter = (subId: string) => {
    return UNIFIED_EXAM_POSTS.filter((post) => {
      if (selectedExamCategory !== 'all' && post.categoryGroup !== selectedExamCategory) {
        return false;
      }
      if (subId === 'all') return true;
      const matchType = post.examType === subId;
      const matchAsi = subId === 'asi' && (
        post.examType === 'asi' ||
        post.examTypeLabel.toLowerCase().includes('asi') ||
        post.postTitle.toLowerCase().includes('asi') ||
        post.postTitle.toLowerCase().includes('hcm')
      );
      const matchCo = subId === 'computer_operator' && (
        post.examType === 'computer_operator' ||
        post.postTitle.toLowerCase().includes('operator') ||
        post.postTitle.toLowerCase().includes('informatic')
      );
      const matchDeo = subId === 'deo' && (
        post.examType === 'deo' ||
        post.postTitle.toLowerCase().includes('deo') ||
        post.postTitle.toLowerCase().includes('dest')
      );
      const matchRoAro = subId === 'ro_aro' && (
        post.examType === 'ro_aro' ||
        post.postTitle.toLowerCase().includes('ro / aro') ||
        post.postTitle.toLowerCase().includes('ro/ aro')
      );
      const matchAssistant = subId === 'assistant' && (
        post.examType === 'assistant' ||
        post.postTitle.toLowerCase().includes('assistant') ||
        post.postTitle.toLowerCase().includes('clerk') ||
        post.postTitle.toLowerCase().includes('ldc') ||
        post.postTitle.toLowerCase().includes('jsa')
      );
      const matchCourt = subId === 'court_jja' && (
        post.examType === 'court_jja' ||
        post.categoryGroup === 'judiciary'
      );
      const matchSteno = subId === 'steno' && (
        post.examType === 'steno' ||
        post.postTitle.toLowerCase().includes('steno') ||
        post.postTitle.toLowerCase().includes('pa') ||
        post.postTitle.toLowerCase().includes('aps')
      );
      return matchType || matchAsi || matchCo || matchDeo || matchRoAro || matchAssistant || matchCourt || matchSteno;
    }).length;
  };

  const activePost = useMemo(() => {
    if (selectedUnifiedPost) return selectedUnifiedPost;
    return UNIFIED_EXAM_POSTS.find((p) => p.id === activeExamId) || UNIFIED_EXAM_POSTS[0];
  }, [selectedUnifiedPost, activeExamId]);

  const engVariant = useMemo(() => activePost?.variants.find((v) => v.language === 'english'), [activePost]);
  const mangalVariant = useMemo(() => activePost?.variants.find((v) => v.language.startsWith('hindi')), [activePost]);
  const krutiVariant = useMemo(() => activePost?.variants.find((v) => v.language === 'hindi_kruti'), [activePost]);

  const handleQuickStartPost = (post: UnifiedExamPost) => {
    setSelectedUnifiedPost(post);
    setActiveExamId(post.id);
    const primary = post.variants[0];
    if (primary) {
      handleQuickStartExam(primary);
    }
  };

  const handleEnterExam = (post: UnifiedExamPost) => {
    setSelectedUnifiedPost(post);
    setActiveExamId(post.id);
    setSelectedExamProfile(post.variants[0] || null);
    setNavLevel(2, post.id, post.variants[0]?.language || 'english');
  };

  const handleQuickMode = (post: UnifiedExamPost, modeId: string, variant: ExamProfile) => {
    setSelectedUnifiedPost(post);
    setActiveExamId(post.id);
    setSelectedExamProfile(variant);
    setActiveModeId(modeId);
    if (modeId === 'drills') {
      setSelectedDuration(5);
    } else {
      setSelectedDuration(variant.durationMinutes || 15);
    }
    setNavLevel(3, post.id, modeId);
  };

  const handleQuickStartExam = (exam: ExamProfile) => {
    setSelectedExamProfile(exam);
    let matchingPassage: Passage | undefined;

    // 1. Exact examSlug match
    matchingPassage = passages.find((p) => p.examSlug === exam.slug && p.language === exam.language);

    // 2. Category group & language match
    if (!matchingPassage && exam.categoryGroup) {
      matchingPassage = passages.find((p) => p.categoryGroup === exam.categoryGroup && p.language === exam.language);
    }

    // 3. Fallback to language match
    if (!matchingPassage) {
      if (exam.language === 'english') {
        matchingPassage = passages.find((p) => p.language === 'english') || passages[0];
      } else if (exam.language === 'hindi_mangal') {
        matchingPassage = passages.find((p) => p.language === 'hindi_mangal') || passages[0];
      } else {
        matchingPassage = passages.find((p) => p.language === 'hindi_kruti') || passages.find((p) => p.language.startsWith('hindi')) || passages[0];
      }
    }
    onStartTest(matchingPassage, exam.durationMinutes, exam);
  };

  const handleBrowseExamPassages = (exam: ExamProfile) => {
    setSelectedExamProfile(exam);
    setActiveExamId(exam.slug);
    let mId = 'english';
    if (exam.language === 'english') {
      mId = 'english';
    } else if (exam.language === 'hindi_kruti') {
      mId = 'hindi_kruti';
    } else {
      mId = 'hindi_mangal';
    }
    setActiveModeId(mId);
    setSelectedDuration(exam.durationMinutes);
    setNavLevel(3, exam.slug, mId);
  };

  // Date converter
  const toDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [dailyTab, setDailyTab] = useState<'all' | 'english' | 'hindi'>('all');

  const todayDailyLiveTests: Passage[] = useMemo(() => {
    if (dailyLivePassages && dailyLivePassages.length >= 8) {
      return dailyLivePassages;
    }
    return getFallbackDailyPassages(todayIso, passages);
  }, [dailyLivePassages, todayIso, passages]);

  const displayDailyLiveTests = useMemo(() => {
    if (dailyTab === 'english') {
      return todayDailyLiveTests.filter((p) => p.language === 'english');
    }
    if (dailyTab === 'hindi') {
      return todayDailyLiveTests.filter((p) => p.language.startsWith('hindi'));
    }
    return todayDailyLiveTests;
  }, [todayDailyLiveTests, dailyTab]);

  const englishLiveTests = useMemo(
    () => todayDailyLiveTests.filter((p) => p.language === 'english'),
    [todayDailyLiveTests]
  );

  const hindiMangalLiveTests = useMemo(
    () => todayDailyLiveTests.filter((p) => p.language === 'hindi_mangal'),
    [todayDailyLiveTests]
  );

  const krutiLiveTests = useMemo(
    () => passages.filter((p) => p.language === 'hindi_kruti').slice(0, 4),
    [passages]
  );

  // Dynamic actual passage statistics from database
  const coCount = useMemo(() => passages.filter((p) => p.category === 'up_police_co').length, [passages]);
  const asiCount = useMemo(() => passages.filter((p) => p.category === 'up_police_asi').length, [passages]);
  const engCount = useMemo(() => passages.filter((p) => p.language === 'english').length, [passages]);
  const mangalCount = useMemo(() => passages.filter((p) => p.language === 'hindi_mangal').length, [passages]);
  const krutiCount = useMemo(() => passages.filter((p) => p.language === 'hindi_kruti').length, [passages]);
  const mock15Count = useMemo(() => passages.filter((p) => p.duration >= 15 || p.wordCount >= 400).length, [passages]);
  const drillsCount = useMemo(() => passages.filter((p) => p.duration <= 5 || p.wordCount <= 300).length, [passages]);

  // Active exam/post filtered passage counts for mode badges
  const activePostPassages = useMemo(() => {
    const activeGroup = selectedExamProfile?.categoryGroup || (activePost ? activePost.categoryGroup : undefined);
    const activeSlug = selectedExamProfile?.slug || (activePost ? activePost.id : undefined);

    return passages.filter((p) => {
      if (activeSlug && p.examSlug && p.examSlug !== activeSlug) return false;
      if (activeGroup && p.categoryGroup && p.categoryGroup !== activeGroup) return false;
      return true;
    });
  }, [passages, selectedExamProfile, activePost]);

  const activeEngCount = useMemo(() => activePostPassages.filter((p) => p.language === 'english').length, [activePostPassages]);
  const activeMangalCount = useMemo(() => activePostPassages.filter((p) => p.language === 'hindi_mangal').length, [activePostPassages]);
  const activeKrutiCount = useMemo(() => activePostPassages.filter((p) => p.language === 'hindi_kruti').length, [activePostPassages]);

  // Exam Courses (Curated Examination Catalog with Official Benchmarks)
  const EXAM_COURSES: ExamCourse[] = useMemo(
    () => [
      {
        id: 'up_police_co',
        title: 'UP Police (UPPRPB) SI, ASI, Computer Operator Typing Tests',
        shortTitle: 'UP Police Computer Operator',
        emblemEmoji: '👮',
        badge: `${coCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'up_police_co',
        description: 'Official Grade-A & ASI test series on Mangal Inscript, Kruti Dev & English.'
      },
      {
        id: 'up_police_asi',
        title: 'UP Police ASI (Clerk, Accounts & Confidential) Typing Tests',
        shortTitle: 'UP Police ASI Ministerial',
        emblemEmoji: '📑',
        badge: `${asiCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'up_police_asi',
        description: 'Special administrative, legal and police clerical test passages.'
      },
      {
        id: 'upsssc',
        title: 'UPSSSC Junior Assistant Typing Skill Test Series',
        shortTitle: 'UPSSSC Junior Assistant',
        emblemEmoji: '🏛️',
        badge: `${mangalCount + engCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'all',
        description: 'Government Secretariat & Departmental clerical typing passages.'
      },
      {
        id: 'allahabad_hc',
        title: 'ALLAHABAD HC JA & Paid Apprentices & Steno Typing Tests',
        shortTitle: 'Allahabad High Court (RO/ARO/JA)',
        emblemEmoji: '⚖️',
        badge: `${krutiCount + engCount} Tests Available`,
        passingBenchmark: '25 WPM Hindi • 30 WPM English',
        categoryFilter: 'all',
        description: 'High Court legal judgment & gazette editorial typing practice.'
      },
      {
        id: 'ssc_chsl',
        title: 'SSC CHSL 2024-2025 Typing Test Series',
        shortTitle: 'SSC CHSL / CGL Tier-II',
        emblemEmoji: '🏢',
        badge: `${engCount} Tests Available`,
        passingBenchmark: '35 WPM English • 30 WPM Hindi',
        categoryFilter: 'all',
        description: 'Staff Selection Commission standard 10-min & 15-min speed test modules.'
      },
      {
        id: 'delhi_police',
        title: 'Delhi Police Typing Course Test Series',
        shortTitle: 'Delhi Police HCM / AWO',
        emblemEmoji: '🛡️',
        badge: `${passages.length} Tests Available`,
        passingBenchmark: '30 WPM English • 25 WPM Hindi',
        categoryFilter: 'all',
        description: 'Head Constable Ministerial & Wireless Operator typing evaluation.'
      },
      {
        id: 'mock15',
        title: 'UP Police Full Length 15-Minute Official Mocks',
        shortTitle: '15-Min Official Exam Mocks',
        emblemEmoji: '⏱️',
        badge: `${mock15Count} Full Mocks`,
        passingBenchmark: '15:00 Strict Timer • 85% Accuracy',
        categoryFilter: 'mock15',
        description: 'Official 15-minute simulated exam hall environment with real evaluation.'
      },
      {
        id: 'drills',
        title: '2-Min & 5-Min Rapid Weak-Keys & Speed Booster Drills',
        shortTitle: 'Speed & Accuracy Drills',
        emblemEmoji: '⚡',
        badge: `${drillsCount > 0 ? drillsCount : 24} Speed Drills`,
        passingBenchmark: 'High-frequency weak keys & error correction',
        categoryFilter: 'drills',
        description: 'Quick sprint drills designed to eliminate typos and boost finger agility.'
      }
    ],
    [coCount, asiCount, engCount, mangalCount, krutiCount, mock15Count, drillsCount, passages.length]
  );

  // Active Exam Object
  const currentExam = useMemo(() => {
    if (activePost) {
      const parts: string[] = [];
      if (mangalVariant) parts.push(`Hindi ${mangalVariant.targetSpeed} WPM`);
      if (engVariant) parts.push(`English ${engVariant.targetSpeed} WPM`);
      parts.push(`${activePost.variants[0]?.durationMinutes || 15} Mins`);
      parts.push(`≥${activePost.variants[0]?.minAccuracy || 85}% Acc`);

      return {
        id: activePost.id,
        title: activePost.postTitle,
        shortTitle: activePost.postTitle,
        emblemEmoji: getEmblemForGroup(activePost.categoryGroup),
        badge: `${activePost.variants.length} Mediums Available`,
        passingBenchmark: parts.join(' • '),
        categoryFilter: 'all' as ExamCategory | 'all',
        description: `Official ${activePost.organization} examination test series.`
      };
    }
    return EXAM_COURSES.find((e) => e.id === activeExamId) || EXAM_COURSES[0];
  }, [activePost, EXAM_COURSES, activeExamId, mangalVariant, engVariant]);

  // Level 2 Modes (English, Hindi Mangal, Hindi Kruti, Live Simulation, Practice Drills, Study Material)
  const EXAM_MODES: ExamMode[] = useMemo(() => {
    const modes: ExamMode[] = [];

    const hasEnglish = Boolean(engVariant) || !activePost || activePost.variants.length === 0 || activePost.variants.some(v => v.language === 'english');
    const hasHindi = Boolean(mangalVariant) || Boolean(krutiVariant) || activePost?.variants.some(v => v.language.startsWith('hindi'));

    // 1. English
    if (hasEnglish) {
      const spd = engVariant?.targetSpeed || 30;
      const dur = engVariant?.durationMinutes || 15;
      modes.push({
        id: 'english',
        title: 'English Typing Tests',
        icon: '🇬🇧',
        bg: 'var(--bg-blue-50)',
        border: 'var(--bd-blue-200)',
        badge: `${activeEngCount > 0 ? activeEngCount : engCount} Tests • ${spd} WPM Target`,
        badgeColor: 'var(--fg-blue-700)',
        badgeBg: 'var(--bg-blue-100)',
        description: `Official ${spd} WPM qualifying passages for ${activePost?.postTitle || 'Exam'}.`,
        languageFilter: 'english',
        durationFilter: dur
      });
    }

    // 2. Hindi Mangal
    if (hasHindi) {
      const spd = mangalVariant?.targetSpeed || 25;
      const dur = mangalVariant?.durationMinutes || 15;
      modes.push({
        id: 'hindi_mangal',
        title: 'हिंदी मंगल (Mangal Inscript)',
        icon: '🇮🇳',
        bg: 'var(--bg-amber-100)',
        border: 'var(--bd-amber-200)',
        badge: `${activeMangalCount > 0 ? activeMangalCount : mangalCount} Tests • ${spd} WPM Target`,
        badgeColor: 'var(--fg-amber-700)',
        badgeBg: 'var(--bg-amber-100)',
        description: `Official Mangal Inscript layout at ${spd} WPM benchmark speed.`,
        languageFilter: 'hindi_mangal',
        durationFilter: dur
      });

      // 3. Hindi Kruti Dev
      modes.push({
        id: 'hindi_kruti',
        title: 'हिंदी कृति देव (Kruti Dev 010)',
        icon: '🇮🇳',
        bg: 'var(--bg-green-50)',
        border: 'var(--bd-green-200)',
        badge: `${activeKrutiCount > 0 ? activeKrutiCount : krutiCount} Tests • ${spd} WPM Target`,
        badgeColor: 'var(--fg-green-700)',
        badgeBg: 'var(--bg-green-100)',
        description: 'Traditional Remington Hindi layout with authentic character codes.',
        languageFilter: 'hindi_kruti',
        durationFilter: dur
      });
    }

    // 4. Daily Live Tests
    const postDur = activePost?.variants[0]?.durationMinutes || 15;
    modes.push({
      id: 'daily_live',
      title: 'Daily Live Mock Tests (AI Engine)',
      icon: '🔥',
      bg: 'var(--bg-orange-50)',
      border: 'var(--bd-orange-200)',
      badge: '8 Live Tests Today (4 Eng + 4 Hindi)',
      badgeColor: 'var(--fg-orange-700)',
      badgeBg: 'var(--bg-orange-100)',
      description: `Daily fresh tests calibrated for ${activePost?.postTitle || 'Exam'} with Medium & Hard levels.`,
      languageFilter: 'all',
      durationFilter: postDur
    });

    // 5. Live Simulation
    modes.push({
      id: 'live_mock',
      title: 'Live Exam Hall Simulation',
      icon: '🔴',
      bg: 'var(--bg-red-50)',
      border: 'var(--bd-red-200)',
      badge: `${mock15Count} Full Mocks • ${postDur}:00 Strict`,
      badgeColor: 'var(--fg-red-700)',
      badgeBg: 'var(--bg-red-100)',
      description: `Full ${postDur}-minute countdown, strict evaluation formula & full-screen mode.`,
      languageFilter: 'all',
      durationFilter: postDur
    });

    // 6. Practice Drills
    modes.push({
      id: 'drills',
      title: 'Daily Practice & Speed Boosters',
      icon: '⚡',
      bg: 'var(--bg-purple-50)',
      border: 'var(--bd-purple-200)',
      badge: `${drillsCount > 0 ? drillsCount : 24} Speed Drills • 2 & 5 Min`,
      badgeColor: 'var(--fg-purple-700)',
      badgeBg: 'var(--bg-purple-100)',
      description: 'Short targeted drills focusing on weak keys, punctuation, and number rows.',
      languageFilter: 'all',
      durationFilter: 5
    });

    // 7. Study Material
    modes.push({
      id: 'study',
      title: 'Study Material & Special Key Codes',
      icon: '📖',
      bg: 'var(--bg-slate-50)',
      border: 'var(--bd-slate-300)',
      badge: 'Official Rules & Cutoffs',
      badgeColor: 'var(--fg-slate-700)',
      badgeBg: 'var(--bg-slate-200)',
      description: `Official ${activePost?.organization || 'Department'} evaluation rules & keyboard codes.`,
      languageFilter: 'all',
      durationFilter: postDur
    });

    return modes;
  }, [activePost, engVariant, mangalVariant, krutiVariant, engCount, mangalCount, krutiCount, mock15Count, drillsCount]);

  // Active Mode Object
  const currentMode = useMemo(() => {
    return EXAM_MODES.find((m) => m.id === activeModeId) || EXAM_MODES[0];
  }, [EXAM_MODES, activeModeId]);

  const languageModes = useMemo(
    () => EXAM_MODES.filter((m) => ['english', 'hindi_mangal', 'hindi_kruti'].includes(m.id)),
    [EXAM_MODES]
  );
  const simulationModes = useMemo(
    () => EXAM_MODES.filter((m) => ['live_mock', 'daily_live'].includes(m.id)),
    [EXAM_MODES]
  );
  const boosterModes = useMemo(
    () => EXAM_MODES.filter((m) => ['drills', 'study'].includes(m.id)),
    [EXAM_MODES]
  );

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const totalAttempted = history.length;
    if (totalAttempted === 0) {
      return { totalAttempted: 0, bestSpeed: 0, avgAccuracy: 0, isQualified: false, passedTestsCount: 0 };
    }
    const speeds = history.map((h) => h.netWpm || 0);
    const bestSpeed = Math.round(Math.max(...speeds) * 10) / 10;
    const avgAccuracy = Math.round(history.reduce((sum, h) => sum + (h.accuracy || 0), 0) / totalAttempted);
    const passedTestsCount = history.filter((h) => h.isQualified).length;
    return { totalAttempted, bestSpeed, avgAccuracy, isQualified: passedTestsCount > 0, passedTestsCount };
  }, [history]);

  // Past Attempts Map
  const pastAttemptsMap = useMemo(() => {
    const map = new Map<string, { bestSpeed: number; bestAcc: number; isQualified: boolean; count: number }>();
    history.forEach((h) => {
      const key = h.testId || h.testTitle;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { bestSpeed: h.netWpm, bestAcc: h.accuracy, isQualified: h.isQualified, count: 1 });
      } else {
        existing.bestSpeed = Math.max(existing.bestSpeed, h.netWpm);
        existing.bestAcc = Math.max(existing.bestAcc, h.accuracy);
        if (h.isQualified) existing.isQualified = true;
        existing.count += 1;
      }
    });
    return map;
  }, [history]);

  // Filtered passages for Level 3
  const filteredLevel3Passages = useMemo(() => {
    const activeGroup = selectedExamProfile?.categoryGroup || (activePost ? activePost.categoryGroup : undefined);
    const activeSlug = selectedExamProfile?.slug || (activePost ? activePost.id : undefined);

    const filtered = passages.filter((p) => {
      // 1. Exam Filter
      if (currentExam.categoryFilter === 'up_police_co') {
        if (p.category !== 'up_police_co') return false;
      } else if (currentExam.categoryFilter === 'up_police_asi') {
        if (p.category !== 'up_police_asi') return false;
      } else if (activeSlug && p.examSlug && p.examSlug !== activeSlug) {
        return false;
      } else if (activeGroup) {
        if (p.categoryGroup && p.categoryGroup !== activeGroup) {
          return false;
        }
      }

      if (currentExam.categoryFilter === 'drills' && (p.duration > 5 && p.wordCount > 250)) return false;
      if (currentExam.categoryFilter === 'mock15' && p.duration < 15 && p.wordCount < 400) return false;

      // 2. Mode Filter
      if (currentMode.languageFilter && currentMode.languageFilter !== 'all') {
        if (p.language !== currentMode.languageFilter) return false;
      }
      if (currentMode.id === 'drills' && p.duration > 5 && p.wordCount > 300) {
        return false;
      }
      if (currentMode.id === 'daily_live') {
        const isLive = p.id.includes('ar-live') || p.id.includes('live-') || (p.date && p.date === todayIso);
        if (!isLive) return false;
      }

      // 3. Difficulty Filter
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = p.testNumber !== undefined && (
          String(p.testNumber) === q ||
          `test #${p.testNumber}`.toLowerCase().includes(q) ||
          `test ${p.testNumber}`.toLowerCase().includes(q) ||
          `#${p.testNumber}` === q ||
          (p.testNumber < 100 && String(p.testNumber).padStart(2, '0') === q)
        );
        const titleMatch = p.title.toLowerCase().includes(q);
        const textMatch = p.text.toLowerCase().includes(q);
        const dateMatch = p.date ? p.date.includes(q) : false;
        if (!numMatch && !titleMatch && !textMatch && dateMatch === false) return false;
      }

      return true;
    });

    let resultList = filtered;
    if (resultList.length === 0) {
      resultList = passages.filter((p) => {
        if (currentMode.languageFilter && currentMode.languageFilter !== 'all') {
          if (p.language !== currentMode.languageFilter) return false;
        }
        return true;
      });
    }

    // 4b. Unique numbering: when two series are merged into one list (e.g. UP Police CO + ASI),
    // each test number appears twice (#01, #01, #02, #02 ...). Renumber sequentially so every
    // card has its own number. The same number drives the free-demo / Pro lock, so they stay consistent.
    if (currentMode.id !== 'daily_live') {
      const seenNums = new Set<number>();
      let hasDuplicateNumbers = false;
      for (const p of resultList) {
        if (p.testNumber === undefined) continue;
        if (seenNums.has(p.testNumber)) {
          hasDuplicateNumbers = true;
          break;
        }
        seenNums.add(p.testNumber);
      }
      if (hasDuplicateNumbers) {
        const ranked = [...resultList].sort(
          (a, b) =>
            (a.testNumber ?? 99999) - (b.testNumber ?? 99999) ||
            (a.category || '').localeCompare(b.category || '') ||
            (a.date || '').localeCompare(b.date || '') ||
            a.id.localeCompare(b.id)
        );
        const rankById = new Map<string, number>(ranked.map((p, i) => [p.id, i + 1]));
        resultList = resultList.map((p) => {
          const n = rankById.get(p.id) as number;
          const label = n < 100 ? String(n).padStart(2, '0') : String(n);
          return {
            ...p,
            testNumber: n,
            title: (p.title || '').replace(/^Test\s*#\s*\d+\s*[:\-–—]\s*/i, `Test #${label}: `)
          };
        });
      }
    }

    // 5. Sort passages by level3SortBy
    return [...resultList].sort((a, b) => {
      if (level3SortBy === 'number') {
        const numA = a.testNumber ?? 99999;
        const numB = b.testNumber ?? 99999;
        if (numA !== numB) return numA - numB;
        return (b.date || '').localeCompare(a.date || '');
      }
      if (level3SortBy === 'date_desc') {
        const dateCmp = (b.date || '').localeCompare(a.date || '');
        if (dateCmp !== 0) return dateCmp;
        return (a.testNumber ?? 99999) - (b.testNumber ?? 99999);
      }
      if (level3SortBy === 'difficulty') {
        const diffScore: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
        const diffA = diffScore[a.difficulty] || 2;
        const diffB = diffScore[b.difficulty] || 2;
        if (diffA !== diffB) return diffA - diffB;
        return (a.testNumber ?? 99999) - (b.testNumber ?? 99999);
      }
      return 0;
    });
  }, [passages, currentExam, currentMode, selectedDifficulty, searchQuery, level3SortBy, todayIso, selectedExamProfile, activePost]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(18);
  }, [activeExamId, activeModeId, selectedDifficulty, searchQuery, level3SortBy]);

  // Classic Form data helpers
  const classicLanguagePassages = useMemo(() => {
    return passages.filter((p) => p.language === classicLanguage);
  }, [passages, classicLanguage]);

  const classicAvailableDates = useMemo(() => {
    return Array.from(new Set(classicLanguagePassages.map((p) => p.date).filter((d): d is string => Boolean(d))))
      .sort()
      .reverse();
  }, [classicLanguagePassages]);

  useEffect(() => {
    if (classicAvailableDates.length > 0 && !classicAvailableDates.includes(classicDate)) {
      setClassicDate(classicAvailableDates[0] || '');
    }
  }, [classicAvailableDates, classicDate]);

  const classicActiveList = useMemo(() => {
    return classicLanguagePassages.filter((p) => p.date === classicDate);
  }, [classicLanguagePassages, classicDate]);

  const currentClassicSelectedPassage = useMemo(() => {
    if (!classicPassageId) return null;
    return classicActiveList.find((p) => p.id === classicPassageId) || null;
  }, [classicPassageId, classicActiveList]);

  const handleClassicLanguageChange = (newLang: Language) => {
    setIsLoadingPassages(true);
    setClassicLanguage(newLang);
    setClassicPassageId('');
    setTimeout(() => setIsLoadingPassages(false), 160);
  };

  const handleClassicDateChange = (newDate: string) => {
    setIsLoadingPassages(true);
    setClassicDate(newDate);
    setClassicPassageId('');
    setTimeout(() => setIsLoadingPassages(false), 160);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return { label: 'E', cls: 'ar-badge-e' };
      case 'hard':
        return { label: 'H', cls: 'ar-badge-h' };
      case 'medium':
      default:
        return { label: 'M', cls: 'ar-badge-m' };
    }
  };

  const renderLiveTestCard = (t: Passage, index: number = 0) => {
    const isHindi = t.language.startsWith('hindi');
    const isHard = t.difficulty === 'hard';
    const attempt = pastAttemptsMap.get(t.id) || pastAttemptsMap.get(t.title);
    const speed = selectedExamProfile?.targetSpeed || (isHindi ? (mangalVariant?.targetSpeed || 25) : (engVariant?.targetSpeed || 30));
    const acc = selectedExamProfile?.minAccuracy || 85;

    const access = isTestLocked(
      t.testNumber,
      index,
      currentUser,
      selectedExamProfile?.id || activePost?.id,
      selectedExamProfile?.categoryGroup || activePost?.categoryGroup
    );

    return (
      <ExamBenchmarkTestCard
        key={t.id}
        emblem={isHindi ? '🇮🇳' : '🇬🇧'}
        categoryOrOrg={t.category === 'up_police_asi' ? 'UP Police ASI' : 'UP Police CO'}
        language={t.language}
        title={t.title}
        targetSpeed={speed}
        durationMinutes={selectedExamProfile?.durationMinutes || 15}
        minAccuracy={acc}
        limitCount={t.wordCount}
        limitType="Words"
        extraBadge={{
          text: isHard ? 'HARD • Long Words' : 'MEDIUM',
          bg: isHard ? 'var(--bg-red-100)' : 'var(--bg-green-50)',
          color: isHard ? 'var(--fg-red-700)' : 'var(--fg-green-700)',
          border: isHard ? 'var(--bd-red-300)' : 'var(--bd-green-300)'
        }}
        pastAttempt={attempt}
        isLocked={access.isLocked}
        isDemo={access.isDemo}
        onUnlock={() => onOpenPayment?.(selectedExamProfile?.id || activePost?.id)}
        onStartMock={() => onStartTest(t, selectedExamProfile?.durationMinutes || 15, selectedExamProfile)}
        onBrowse={() => onStartTest(t, selectedExamProfile?.durationMinutes || 15, selectedExamProfile)}
        startBtnText={access.isDemo ? (attempt ? `Retest Demo (${selectedExamProfile?.durationMinutes || 15}m)` : `Start Demo (${selectedExamProfile?.durationMinutes || 15}m)`) : (attempt ? `Retest (${selectedExamProfile?.durationMinutes || 15}m)` : `Start Mock (${selectedExamProfile?.durationMinutes || 15}m)`)}
        browseBtnText={access.isDemo ? "Free Demo" : "Start Test"}
      />
    );
  };

  return (
    <div className="exam-portal-wrapper">
      <div className="container">

        {/* ========================================================
            LEVEL 1: "ALL COURSES" EXAM GRID & CATALOG
            ======================================================== */}
        {navLevel === 1 && (
          <div>
            {/* Top Brand & Stats Bar */}
            <div className="examportal-trust-bar">
          <div className="examportal-brand-info">
            <img
              src={appLogo}
              alt="Exam Typing"
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)',
                border: '2px solid var(--tw-sky-400)',
                flexShrink: 0
              }}
            />
            <div>
              <div className="examportal-brand-title">Exam Typing</div>
              <div className="examportal-brand-sub">
                Typing Practice for Competitive Exams • UP Police & Government Aspirants
              </div>
            </div>
          </div>

          <div className="examportal-metrics-row">
            <div className="examportal-metric-pill">
              <span style={{ fontSize: '1.25rem' }}><Ico n="library" /></span>
              <div>
                <div className="examportal-metric-val">{passages.length} Official Tests</div>
                <div className="examportal-metric-lbl">Passage Bank Available</div>
              </div>
            </div>

            <div className="examportal-metric-pill">
              <span style={{ fontSize: '1.25rem' }}><Ico n="target" /></span>
              <div>
                <div className="examportal-metric-val">
                  {kpiStats.totalAttempted > 0 ? `${kpiStats.totalAttempted} Attempted` : '85% Accuracy'}
                </div>
                <div className="examportal-metric-lbl">
                  {kpiStats.totalAttempted > 0 ? `${kpiStats.passedTestsCount} Tests Passed` : 'UPPRPB Benchmark'}
                </div>
              </div>
            </div>

            <div className="examportal-metric-pill">
              <span style={{ fontSize: '1.25rem' }}><Ico n="zap" /></span>
              <div>
                <div className="examportal-metric-val">
                  {kpiStats.bestSpeed > 0 ? `${kpiStats.bestSpeed} WPM Best` : '25 / 30 WPM'}
                </div>
                <div className="examportal-metric-lbl">
                  {kpiStats.bestSpeed > 0 ? `Avg: ${kpiStats.avgAccuracy}% Accuracy` : 'Hindi & English Pass'}
                </div>
              </div>
            </div>

            {/* Candidate profile or login trigger */}
            {currentUser ? (
              <div
                className="examportal-metric-pill"
                onClick={onOpenDashboard}
                style={{ cursor: 'pointer', background: 'var(--bg-green-50)', borderColor: 'var(--bd-green-300)' }}
                title="Click to view candidate statistics & examination dossier"
              >
                <span style={{ fontSize: '1.25rem' }}><Ico n="user" /></span>
                <div>
                  <div className="examportal-metric-val" style={{ color: 'var(--fg-green-800)' }}>
                    {currentUser.displayName}
                  </div>
                  <div className="examportal-metric-lbl" style={{ color: 'var(--fg-green-700)' }}>
                    Roll: {currentUser.rollNumber} • Dossier →
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-sm btn-primary"
                style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: 700 }}
              >
                Login / Sign In <Ico n="key" />
              </button>
            )}

            {/* Pro Subscription / Pricing Trigger */}
            {onOpenPayment && (
              currentUser?.is_subscribed ? (
                <div
                  className="examportal-metric-pill"
                  onClick={() => onOpenPayment()}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--bg-green-50)',
                    borderColor: 'var(--tw-green-500)',
                    boxShadow: '0 2px 6px rgba(34, 197, 94, 0.2)'
                  }}
                  title={`Pro Member: ${currentUser.subscriptionPlan || 'Active'} • Tap to view plan`}
                >
                  <span style={{ fontSize: '1.25rem' }}><Ico n="crown" /></span>
                  <div>
                    <div className="examportal-metric-val" style={{ color: 'var(--fg-green-700)' }}>
                      Pro Member
                    </div>
                    <div className="examportal-metric-lbl" style={{ color: 'var(--fg-green-600)' }}>
                      {currentUser.subscriptionPlan || 'Active Plan'} &bull; Details →
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onOpenPayment()}
                  style={{
                    background: 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-amber-600) 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                    whiteSpace: 'nowrap'
                  }}
                  title="Unlock Full 129 Exams, All Mock Tests, and Answer Keys"
                >
                  <span><Ico n="crown" /></span>
                  <span>Upgrade to Pro / Plans</span>
                </button>
              )
            )}

            {/* Classic Date Selector Toggle */}
            <button
              onClick={() => setNavLevel('classic_form')}
              className="btn btn-sm btn-secondary"
              style={{ borderRadius: '10px', padding: '8px 14px', fontWeight: 600, fontSize: '0.8rem' }}
              title="Switch to classic date-wise passage selector"
            >
              <Ico n="calendar" /> Classic Date Selector <Ico n="menu" />
            </button>
          </div>
        </div>
            {/* Candidate Performance KPI Strip */}
            <section className="exam-hero-banner" style={{ padding: '22px 26px', marginBottom: '24px' }}>
              <div className="exam-hero-top" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="exam-hero-title" style={{ fontSize: '1.25rem' }}>
                    <span><Ico n="target" /></span> Examination Performance Overview
                  </h2>
                  <div className="exam-hero-sub">
                    <span>Target: UP Police Computer Operator Grade-A & ASI (2024-2026)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setActiveModeId('daily_live');
                      setNavLevel(3);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--tw-green-800) 0%, var(--tw-green-700) 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(22, 101, 52, 0.25)'
                    }}
                    title="View Today's 8 AI Live Examination Tests"
                  >
                    <span><Ico n="flame" /></span>
                    <span>Today's Live Tests (8 Active) →</span>
                  </button>

                  {currentUser && isUserAdmin(currentUser) && onOpenAiGenerator && (
                    <button
                      onClick={onOpenAiGenerator}
                      style={{
                        background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                      }}
                      title="AI Test Generator (AR Typing Standard)"
                    >
                      <span><Ico n="zap" /></span>
                      <span>AI Generator</span>
                    </button>
                  )}

                  {currentUser && isUserAdmin(currentUser) && onOpenAdmin && (
                    <button
                      onClick={onOpenAdmin}
                      style={{
                        background: 'var(--tw-slate-900)',
                        color: 'var(--tw-sky-400)',
                        border: '1px solid var(--tw-slate-700)',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Enterprise Admin Control Panel"
                    >
                      <span><Ico n="shield-check" /></span>
                      <span>Admin Panel</span>
                    </button>
                  )}

                </div>
              </div>

              <div className="exam-kpi-grid">
                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Tests Attempted</div>
                  <div className="exam-kpi-value">{kpiStats.totalAttempted}</div>
                  <div className="exam-kpi-hint">
                    {kpiStats.totalAttempted > 0 ? `${kpiStats.passedTestsCount} qualified` : 'Start your first exam series'}
                  </div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Top Net Speed</div>
                  <div className="exam-kpi-value">
                    {kpiStats.bestSpeed > 0 ? `${kpiStats.bestSpeed} WPM` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Target: 25 Hindi / 30 English</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Avg. Accuracy</div>
                  <div className="exam-kpi-value">
                    {kpiStats.avgAccuracy > 0 ? `${kpiStats.avgAccuracy}%` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Passing standard: ≥ 85.0%</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">UPPRPB Status</div>
                  <div
                    className="exam-kpi-value"
                    style={{
                      fontSize: '1.1rem',
                      color: kpiStats.isQualified ? 'var(--tw-green-300)' : 'var(--tw-yellow-300)'
                    }}
                  >
                    {kpiStats.isQualified ? 'QUALIFIED' : kpiStats.totalAttempted > 0 ? 'PREPARING' : 'READY TO TEST'}
                  </div>
                  <div className="exam-kpi-hint">Official UPPRPB benchmark</div>
                </div>
              </div>
            </section>

            {/* "All 129 Exams" Header */}
            <div className="examportal-courses-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 className="examportal-courses-title">
                  <span><Ico n="landmark" /></span> All 129 Government Typing Examinations & Test Series
                </h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--fg-slate-500)', fontWeight: 600 }}>
                  Practice with exact official benchmarks: target speeds (15–50 WPM), 5–20 min timers, and error cutoffs
                </span>
              </div>
            </div>

            {/* Category Groups Filter Pills */}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '16px',
              scrollbarWidth: 'thin'
            }}>
              {CATEGORY_GROUPS.map((group) => {
                const isSelected = selectedExamCategory === group.id;
                const count = group.id === 'all'
                  ? UNIFIED_EXAM_POSTS.length
                  : UNIFIED_EXAM_POSTS.filter((p) => p.categoryGroup === group.id).length;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedExamCategory(group.id);
                      setSelectedExamSubFilter('all');
                      setVisibleExamsCount(24);
                    }}
                    style={{
                      background: isSelected ? 'var(--tw-sky-600)' : 'var(--surface)',
                      color: isSelected ? '#ffffff' : 'var(--fg-slate-700)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--bd-slate-300)',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 2px 5px rgba(2, 132, 199, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <EmojiIco e={group.icon} />
                    <span>{group.title}</span>
                    <span style={{
                      background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-slate-100)',
                      color: isSelected ? '#ffffff' : 'var(--fg-slate-500)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Post-Type / Sub-Category Filter Pills */}
            {availableSubFilters.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '16px',
                scrollbarWidth: 'thin'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--fg-slate-600)',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span><Ico n="pin" /></span>
                  <span>Exam Type:</span>
                </span>
                {availableSubFilters.map((sub) => {
                  const isSubActive = selectedExamSubFilter === sub.id;
                  const count = getPostCountForSubFilter(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedExamSubFilter(sub.id);
                        setVisibleExamsCount(24);
                      }}
                      style={{
                        background: isSubActive ? 'var(--tw-slate-900)' : 'var(--bg-slate-50)',
                        color: isSubActive ? '#ffffff' : 'var(--fg-slate-700)',
                        border: isSubActive ? '1px solid var(--tw-slate-900)' : '1px solid var(--bd-slate-200)',
                        padding: '5px 12px',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        fontWeight: isSubActive ? 700 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSubActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{sub.label}</span>
                      <span style={{
                        background: isSubActive ? 'rgba(255,255,255,0.22)' : 'var(--bg-slate-200)',
                        color: isSubActive ? '#ffffff' : 'var(--fg-slate-500)',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search and Language Filter Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '520px' }}>
                <input
                  type="text"
                  value={examSearchQuery}
                  onChange={(e) => {
                    setExamSearchQuery(e.target.value);
                    setVisibleExamsCount(24);
                  }}
                  placeholder="Search exam posts (e.g. Computer Operator, ASI, RO/ARO, Court...)"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    paddingLeft: '34px',
                    borderRadius: '8px',
                    border: '1px solid var(--bd-slate-300)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                  <Ico n="search" />
                </span>
                {examSearchQuery && (
                  <button
                    onClick={() => setExamSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--tw-slate-400)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <Ico n="x" />
                  </button>
                )}
              </div>

              {/* Language Medium & View Mode Controls */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* View Switcher */}
                <div style={{ display: 'flex', background: 'var(--bg-slate-100)', borderRadius: '8px', padding: '3px', border: '1px solid var(--bd-slate-200)' }}>
                  <button
                    onClick={() => setLevel1ViewMode('posts')}
                    style={{
                      padding: '5px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: level1ViewMode === 'posts' ? 'var(--tw-slate-900)' : 'transparent',
                      color: level1ViewMode === 'posts' ? '#ffffff' : 'var(--fg-slate-500)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Ico n="clipboard" /> Exam Posts ({filteredUnifiedPosts.length})
                  </button>
                  <button
                    onClick={() => setLevel1ViewMode('individual')}
                    style={{
                      padding: '5px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: level1ViewMode === 'individual' ? 'var(--tw-slate-900)' : 'transparent',
                      color: level1ViewMode === 'individual' ? '#ffffff' : 'var(--fg-slate-500)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Ico n="grid" /> All 129 Individual Cards ({filteredAllExams.length})
                  </button>
                </div>

                {/* Medium Filter */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', fontWeight: 600 }}>Medium:</span>
                  {(['all', 'english', 'hindi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedExamLanguageFilter(lang)}
                      style={{
                        background: selectedExamLanguageFilter === lang ? 'var(--tw-slate-900)' : 'var(--surface)',
                        color: selectedExamLanguageFilter === lang ? '#ffffff' : 'var(--fg-slate-600)',
                        border: '1px solid var(--bd-slate-300)',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'all' ? 'All' : lang === 'english' ? 'English' : 'Hindi'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Rendering: Either Exam Posts or All 129 Individual Exam Tests */}
            <div className="exam-grid" style={{ marginBottom: '24px' }}>
              {level1ViewMode === 'posts' ? (
                filteredUnifiedPosts.slice(0, visibleExamsCount).map((post) => (
                  <ExamTypePostCard
                    key={post.id}
                    post={post}
                    onEnterExam={handleEnterExam}
                    onQuickMode={handleQuickMode}
                    onQuickStart={handleQuickStartPost}
                    getEmblemForGroup={getEmblemForGroup}
                    onOpenRules={onOpenRules}
                  />
                ))
              ) : (
                filteredAllExams.slice(0, visibleExamsCount).map((exam) => (
                  <ExamBenchmarkTestCard
                    key={exam.id}
                    emblem={getEmblemForGroup(exam.categoryGroup)}
                    logoIdentifier={exam.slug || exam.id}
                    categoryGroup={exam.categoryGroup}
                    categoryOrOrg={CATEGORY_GROUPS.find((g) => g.id === exam.categoryGroup)?.title || 'Exam'}
                    language={exam.language}
                    title={exam.title}
                    targetSpeed={exam.targetSpeed}
                    durationMinutes={exam.durationMinutes}
                    minAccuracy={exam.minAccuracy}
                    limitCount={exam.inputLimit}
                    limitType={exam.inputType === 'character' ? 'Chars' : 'Words'}
                    isDemo={true}
                    onStartMock={() => handleQuickStartExam(exam)}
                    onBrowse={() => handleBrowseExamPassages(exam)}
                    startBtnText={`Start Free Demo (${exam.durationMinutes}m)`}
                    browseBtnText="Browse (7 Demo)"
                  />
                ))
              )}
            </div>

            {/* Load More Button */}
            {visibleExamsCount < (level1ViewMode === 'posts' ? filteredUnifiedPosts.length : filteredAllExams.length) && (
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <button
                  onClick={() => setVisibleExamsCount((prev) => prev + 24)}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                >
                  Load More ({ (level1ViewMode === 'posts' ? filteredUnifiedPosts.length : filteredAllExams.length) - visibleExamsCount } remaining) ↓
                </button>
              </div>
            )}

            {/* Yearly Pass / Feature Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--bg-green-50) 0%, var(--bg-green-100) 100%)',
                border: '1.5px solid var(--bd-green-300)',
                borderRadius: '16px',
                padding: '28px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--tw-green-800)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}
                >
                  <Ico n="trophy" /> UP POLICE COMPUTER OPERATOR (GRADE-A) TYPING PASS
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-green-900)', marginBottom: '6px' }}>
                  Complete Exam Hall Typing Preparation
                </h3>
                <p style={{ color: 'var(--fg-green-800)', fontSize: '0.875rem', maxWidth: '640px', lineHeight: 1.5 }}>
                  Practice real exam-hall passages in Hindi (Mangal Inscript & Kruti Dev 010) and English with instant
                  evaluation of Gross Speed, Net Speed, Full/Half Mistakes, and 85% Accuracy check.
                </p>
              </div>

              <button
                className="btn btn-success"
                onClick={() => {
                  const coPost = UNIFIED_EXAM_POSTS.find((p) => p.id === 'up-police-co-asi') || UNIFIED_EXAM_POSTS[0];
                  handleEnterExam(coPost);
                }}
                style={{ padding: '12px 28px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                Explore UP Police CO Series →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            LEVEL 2: EXAM HUB & MODE SELECTION (English, Hindi, Live, Practice)
            ======================================================== */}
        {navLevel === 2 && (
          <div>
            {/* Breadcrumb Bar */}
            <div className="level-breadcrumb-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="level-breadcrumb-link" onClick={() => setNavLevel(1)}>
                  <Ico n="home" /> All Exams & Courses
                </span>
                <span className="level-breadcrumb-sep">/</span>
                <span className="level-breadcrumb-current">{activePost.postTitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setNavLevel('classic_form')}
                  className="btn btn-sm btn-secondary"
                  style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}
                  title="Switch to classic date-based test selector"
                >
                  <Ico n="calendar" /> Classic Date Selector <Ico n="menu" />
                </button>
              </div>
            </div>

            {/* Exam Hero Card */}
            <div className="level2-hero-card">
              <div className="level2-exam-info">
                <div className="level2-exam-emblem">
                  <ExamLogo identifier={activePost.id} categoryGroup={activePost.categoryGroup} size={54} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                      <Ico n="landmark" /> {activePost.organization}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'var(--tw-sky-400)', color: 'var(--tw-slate-900)', border: '1px solid var(--bd-sky-300)' }}>
                      {activePost.examTypeLabel}
                    </span>
                  </div>
                  <h2 className="level2-exam-title">{activePost.postTitle}</h2>
                  <div className="level2-exam-benchmarks">
                    {engVariant && <span className="level2-bench-badge">🇬🇧 English: {engVariant.targetSpeed} WPM</span>}
                    {mangalVariant && <span className="level2-bench-badge">🇮🇳 Hindi: {mangalVariant.targetSpeed} WPM</span>}
                    <span className="level2-bench-badge">⏱️ {activePost.variants[0]?.durationMinutes || 15} Mins Duration</span>
                    <span className="level2-bench-badge"><Ico n="target" /> ≥{activePost.variants[0]?.minAccuracy || 85}% Accuracy Mandatory</span>
                    <span className="level2-bench-badge"><Ico n="ruler" /> {activePost.variants[0]?.inputType === 'character' ? `${activePost.variants[0]?.inputLimit} Chars` : `${activePost.variants[0]?.inputLimit} Words`}</span>
                    {(() => {
                      const bsRule = getExamBackspaceRule(activePost);
                      return (
                        <span
                          className="level2-bench-badge"
                          title={`${bsRule.title}\n${bsRule.fullRule}`}
                          style={{
                            background: bsRule.badgeBg,
                            color: bsRule.badgeText,
                            borderColor: bsRule.badgeBorder
                          }}
                        >
                          {bsRule.badgeLabel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {onOpenRules && (
                  <button
                    className="btn btn-sm"
                    onClick={() => onOpenRules(activePost.id, activePost.categoryGroup)}
                    style={{
                      background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      borderRadius: '10px',
                      padding: '10px 16px',
                      border: '1px solid var(--tw-sky-400)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                    }}
                    title="View official recruitment speed cutoff, calculation formula, and exam instructions"
                  >
                    <span><Ico n="clipboard" /></span>
                    <span>Official Instructions & Guidelines</span>
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  onClick={() => setNavLevel(1)}
                  style={{
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '10px 18px',
                    background: 'rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to All Exams
                </button>
              </div>
            </div>

            {/* Modes Header */}
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-slate-900)', marginBottom: '4px' }}>
                Select Medium or Practice Mode
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-500)', margin: 0 }}>
                Choose your qualifying language medium, exam-hall simulation, or targeted speed boosters for {activePost.postTitle}.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="mode-category-tabs">
              <button
                className={`mode-tab-btn ${modeCategoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setModeCategoryFilter('all')}
              >
                <span><Ico n="sparkles" /> All Practice Modes</span>
                <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>({EXAM_MODES.length})</span>
              </button>
              {languageModes.length > 0 && (
                <button
                  className={`mode-tab-btn ${modeCategoryFilter === 'languages' ? 'active' : ''}`}
                  onClick={() => setModeCategoryFilter('languages')}
                >
                  <span><Ico n="target" /> Qualifying Languages</span>
                  <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>({languageModes.length})</span>
                </button>
              )}
              {simulationModes.length > 0 && (
                <button
                  className={`mode-tab-btn ${modeCategoryFilter === 'simulations' ? 'active' : ''}`}
                  onClick={() => setModeCategoryFilter('simulations')}
                >
                  <span><Ico n="live" /> Exam Hall Simulations</span>
                  <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>({simulationModes.length})</span>
                </button>
              )}
              {boosterModes.length > 0 && (
                <button
                  className={`mode-tab-btn ${modeCategoryFilter === 'boosters' ? 'active' : ''}`}
                  onClick={() => setModeCategoryFilter('boosters')}
                >
                  <span><Ico n="zap" /> Speed Boosters & Keys</span>
                  <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>({boosterModes.length})</span>
                </button>
              )}
            </div>

            {/* Section 1: Core Qualifying Languages */}
            {(modeCategoryFilter === 'all' || modeCategoryFilter === 'languages') && languageModes.length > 0 && (
              <div className="mode-section-wrapper">
                <div className="mode-section-header">
                  <div className="mode-section-header-left">
                    <span className="mode-section-icon"><Ico n="target" /></span>
                    <div>
                      <h4 className="mode-section-title">Core Qualifying Mediums</h4>
                      <p className="mode-section-sub">Official examination passages calibrated to recruitment board syllabus & speed thresholds</p>
                    </div>
                  </div>
                  <span className="mode-section-tag">Official Syllabus</span>
                </div>
                <div className="level2-lang-grid">
                  {languageModes.map((mode) => {
                    const tag = mode.id === 'english' ? 'QWERTY • Official Passages' : mode.id === 'hindi_mangal' ? 'Unicode Inscript • 25 WPM' : 'Remington CBI • Kruti 010';
                    const cta = mode.id === 'english' ? 'Start English Practice →' : mode.id === 'hindi_mangal' ? 'Start Mangal Practice →' : 'Start Kruti Practice →';
                    return (
                      <div
                        key={mode.id}
                        className="level2-mode-card"
                        onClick={() => {
                          setActiveModeId(mode.id);
                          if (mode.id === 'english') {
                            const v = engVariant || activePost.variants[0];
                            setSelectedExamProfile(v);
                            setSelectedDuration(v.durationMinutes);
                          } else if (mode.id === 'hindi_mangal') {
                            const v = mangalVariant || activePost.variants[0];
                            setSelectedExamProfile(v);
                            setSelectedDuration(v.durationMinutes);
                          } else if (mode.id === 'hindi_kruti') {
                            const v = krutiVariant || mangalVariant || activePost.variants[0];
                            setSelectedExamProfile(v);
                            setSelectedDuration(v.durationMinutes);
                          }
                          setNavLevel(3, activePost.id, mode.id);
                        }}
                      >
                        <div>
                          <div className="level2-mode-top">
                            <div
                              className="level2-mode-icon"
                              style={{ background: mode.bg, border: `1.5px solid ${mode.border}` }}
                            >
                              <EmojiIco e={mode.icon} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <div className="level2-mode-title">{mode.title}</div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)' }}>
                                  {tag}
                                </span>
                              </div>
                              <div className="level2-mode-sub">{mode.description}</div>
                            </div>
                          </div>
                        </div>

                        <div className="level2-mode-footer">
                          <span
                            className="level2-mode-badge"
                            style={{ color: mode.badgeColor, background: mode.badgeBg }}
                          >
                            {mode.badge}
                          </span>
                          <span className="level2-mode-cta">
                            {cta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Authentic Exam Simulations & Daily Live Mocks */}
            {(modeCategoryFilter === 'all' || modeCategoryFilter === 'simulations') && simulationModes.length > 0 && (
              <div className="mode-section-wrapper">
                <div className="mode-section-header">
                  <div className="mode-section-header-left">
                    <span className="mode-section-icon"><Ico n="live" /></span>
                    <div>
                      <h4 className="mode-section-title">Exam Hall Simulation & Daily Live Mocks</h4>
                      <p className="mode-section-sub">Strict countdown timer, 85% accuracy cutoff, anti-cheat locks, and real-time live tests</p>
                    </div>
                  </div>
                  <span className="mode-section-tag live-tag">Strict Exam Condition</span>
                </div>
                <div className="level2-sim-grid">
                  {simulationModes.map((mode) => {
                    const tag = mode.id === 'live_mock' ? 'Strict 15:00 Countdown' : 'Daily Fresh Sets';
                    const cta = mode.id === 'live_mock' ? 'Enter Exam Simulation →' : 'Start Daily Live Test →';
                    return (
                      <div
                        key={mode.id}
                        className="level2-mode-card"
                        onClick={() => {
                          setActiveModeId(mode.id);
                          setSelectedExamProfile(activePost.variants[0]);
                          setSelectedDuration(activePost.variants[0]?.durationMinutes || 15);
                          setNavLevel(3, activePost.id, mode.id);
                        }}
                      >
                        <div>
                          <div className="level2-mode-top">
                            <div
                              className="level2-mode-icon"
                              style={{ background: mode.bg, border: `1.5px solid ${mode.border}` }}
                            >
                              <EmojiIco e={mode.icon} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <div className="level2-mode-title">{mode.title}</div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-red-100)', color: 'var(--fg-red-700)' }}>
                                  {tag}
                                </span>
                              </div>
                              <div className="level2-mode-sub">{mode.description}</div>
                            </div>
                          </div>
                        </div>

                        <div className="level2-mode-footer">
                          <span
                            className="level2-mode-badge"
                            style={{ color: mode.badgeColor, background: mode.badgeBg }}
                          >
                            {mode.badge}
                          </span>
                          <span className="level2-mode-cta">
                            {cta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Skill Boosters & Reference Guidelines */}
            {(modeCategoryFilter === 'all' || modeCategoryFilter === 'boosters') && boosterModes.length > 0 && (
              <div className="mode-section-wrapper">
                <div className="mode-section-header">
                  <div className="mode-section-header-left">
                    <span className="mode-section-icon"><Ico n="zap" /></span>
                    <div>
                      <h4 className="mode-section-title">Skill Boosters & Reference Materials</h4>
                      <p className="mode-section-sub">Targeted weak-key drills, number row practice, and official keyboard code tables</p>
                    </div>
                  </div>
                  <span className="mode-section-tag">Practice & Reference</span>
                </div>
                <div className="level2-sim-grid">
                  {boosterModes.map((mode) => {
                    const tag = mode.id === 'drills' ? '2 & 5 Min Speed Drills' : 'Alt Codes & Cutoffs';
                    const cta = mode.id === 'drills' ? 'Start Speed Booster →' : 'Open Key Reference →';
                    return (
                      <div
                        key={mode.id}
                        className="level2-mode-card"
                        onClick={() => {
                          setActiveModeId(mode.id);
                          if (mode.id === 'drills') {
                            setSelectedExamProfile(activePost.variants[0]);
                            setSelectedDuration(5);
                          } else {
                            setSelectedExamProfile(activePost.variants[0]);
                            setSelectedDuration(activePost.variants[0]?.durationMinutes || 15);
                          }
                          setNavLevel(3, activePost.id, mode.id);
                        }}
                      >
                        <div>
                          <div className="level2-mode-top">
                            <div
                              className="level2-mode-icon"
                              style={{ background: mode.bg, border: `1.5px solid ${mode.border}` }}
                            >
                              <EmojiIco e={mode.icon} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <div className="level2-mode-title">{mode.title}</div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)' }}>
                                  {tag}
                                </span>
                              </div>
                              <div className="level2-mode-sub">{mode.description}</div>
                            </div>
                          </div>
                        </div>

                        <div className="level2-mode-footer">
                          <span
                            className="level2-mode-badge"
                            style={{ color: mode.badgeColor, background: mode.badgeBg }}
                          >
                            {mode.badge}
                          </span>
                          <span className="level2-mode-cta">
                            {cta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            LEVEL 3: TEST MATERIAL & PRACTICE LIST
            ======================================================== */}
        {navLevel === 3 && (
          <div>
            {/* Breadcrumb Navigation */}
            <div className="level-breadcrumb-bar">
              <span className="level-breadcrumb-link" onClick={() => setNavLevel(1)}>
                <Ico n="home" /> All Exams
              </span>
              <span className="level-breadcrumb-sep">/</span>
              <span className="level-breadcrumb-link" onClick={() => setNavLevel(2)}>
                {activePost.postTitle}
              </span>
              <span className="level-breadcrumb-sep">/</span>
              <span className="level-breadcrumb-current">{currentMode.title}</span>
            </div>

            {/* Active Exam Profile Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--bg-blue-50) 0%, var(--bg-blue-100) 100%)',
                border: '1.5px solid var(--bd-blue-300)',
                borderRadius: '12px',
                padding: '14px 20px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ExamLogo identifier={activePost.id} categoryGroup={activePost.categoryGroup} size={42} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--fg-blue-800)', fontSize: '1rem' }}>{activePost.postTitle}</strong>
                    <span style={{ background: 'var(--tw-blue-500)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                      Active Target Exam
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--fg-blue-600)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>
                      Official Benchmark: <strong>{selectedExamProfile ? selectedExamProfile.targetSpeed : (engVariant?.targetSpeed || 30)} WPM Speed</strong> &bull; Timer: <strong>{selectedDuration} Mins</strong> &bull; Min Accuracy: <strong>{selectedExamProfile?.minAccuracy || 85}%</strong> &bull; Mode: <strong>{currentMode.title}</strong>
                    </span>
                    {(() => {
                      const bsRule = getExamBackspaceRule(selectedExamProfile || activePost);
                      return (
                        <span
                          title={`${bsRule.title}\n${bsRule.fullRule}`}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: bsRule.badgeBg,
                            color: bsRule.badgeText,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${bsRule.badgeBorder}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          {bsRule.badgeLabel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {onOpenRules && (
                  <button
                    onClick={() => onOpenRules(activePost.id, activePost.categoryGroup)}
                    className="btn btn-sm"
                    style={{
                      background: 'var(--tw-sky-600)',
                      color: '#ffffff',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                    }}
                    title="View official recruitment notification speed, formulas and exam day instructions"
                  >
                    <span><Ico n="clipboard" /></span>
                    <span>Official Instructions</span>
                  </button>
                )}
                <button
                  onClick={() => setNavLevel(2)}
                  className="btn btn-sm btn-secondary"
                  style={{ background: 'var(--surface)', fontWeight: 700, borderColor: 'var(--bd-blue-300)', color: 'var(--fg-blue-800)' }}
                >
                  Change Mode (English/Hindi/Live)
                </button>
                <button
                  onClick={() => {
                    setSelectedExamProfile(null);
                    setNavLevel(1);
                  }}
                  className="btn btn-sm btn-secondary"
                  style={{ background: 'var(--surface)', fontWeight: 700, borderColor: 'var(--bd-slate-300)', color: 'var(--fg-slate-600)' }}
                >
                  Change Exam (All 129)
                </button>
              </div>
            </div>

            {/* Mode Banner */}
            <div
              style={{
                background: currentMode.bg,
                border: `1.5px solid ${currentMode.border}`,
                borderRadius: '12px',
                padding: '18px 24px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2.1rem' }}><EmojiIco e={currentMode.icon} /></span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-slate-900)', marginBottom: '2px' }}>
                    {currentMode.title} - Test Material
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: 'var(--fg-slate-600)' }}>
                    {currentExam.shortTitle} • {currentMode.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setNavLevel(2)}
                  style={{ fontWeight: 700 }}
                >
                  ← Back to Modes
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setNavLevel(1)}
                  style={{ fontWeight: 700 }}
                >
                  All Courses
                </button>
              </div>
            </div>

            {/* SPECIAL MODE: STUDY MATERIAL & SPECIAL CODES (Mode 6) */}
            {currentMode.id === 'study' ? (
              <div
                className="card"
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '28px',
                  border: '1px solid var(--bd-slate-200)',
                  marginBottom: '24px'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-slate-900)', marginBottom: '14px' }}>
                  <Ico n="book" /> UP Police Computer Operator & ASI Typing Rules & Evaluation Formula
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ background: 'var(--bg-slate-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--bd-slate-200)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--fg-slate-900)', marginBottom: '6px' }}>
                      <Ico n="zap" /> Speed Calculation Formula
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-600)', lineHeight: 1.5 }}>
                      • <strong>Gross WPM</strong> = (Total Keystrokes / 5) / Time (Minutes)<br />
                      • <strong>Net WPM</strong> = Gross WPM - (Mistakes / Time)<br />
                      • <strong>Hindi Target</strong>: 25 Net WPM (Mangal Inscript or Kruti Dev)<br />
                      • <strong>English Target</strong>: 30 Net WPM
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-slate-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--bd-slate-200)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--fg-slate-900)', marginBottom: '6px' }}>
                      <Ico n="target" /> Accuracy & Penalty Rules
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-600)', lineHeight: 1.5 }}>
                      • <strong>Minimum Accuracy</strong>: 85.0% mandatory for qualification.<br />
                      • <strong>Full Mistakes</strong>: Missing words, substituted words, spelling errors.<br />
                      • <strong>Half Mistakes</strong>: Spacing errors, punctuation errors, capitalization errors.
                    </p>
                  </div>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-slate-900)', marginBottom: '10px' }}>
                  ⌨️ Frequent Kruti Dev 010 & Mangal Inscript Special ALT Codes:
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px',
                    fontSize: '0.875rem'
                  }}
                >
                  {[
                    { code: 'Alt + 0161', char: 'ह्न' },
                    { code: 'Alt + 0170', char: 'क्क' },
                    { code: 'Alt + 0179', char: 'ट्ट' },
                    { code: 'Alt + 0180', char: 'ट्ठ' },
                    { code: 'Alt + 0181', char: 'ड्ड' },
                    { code: 'Alt + 0182', char: 'ड्ढ' },
                    { code: 'Alt + 0188', char: 'द्ग' },
                    { code: 'Alt + 0204', char: 'त्त' },
                    { code: 'Alt + 0216', char: '्य' },
                    { code: 'Alt + 0227', char: 'ह्म' }
                  ].map((item) => (
                    <div
                      key={item.code}
                      style={{
                        background: 'var(--bg-slate-100)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ color: 'var(--fg-sky-600)' }}>{item.code}</span>
                      <span style={{ fontSize: '1.1rem', color: 'var(--fg-slate-900)' }}>{item.char}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveModeId('english');
                    }}
                  >
                    Start English Mock Test →
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setActiveModeId('hindi_mangal');
                    }}
                  >
                    Start Hindi Mangal Test →
                  </button>
                </div>
              </div>
            ) : (
              /* REGULAR TEST MATERIAL GRID */
              <div>
                {/* 1. DAILY LIVE TESTS SHOWCASE IN LIVE/DAILY MODES */}
                {(currentMode.id === 'daily_live' || currentMode.id === 'live_mock') && (
                  <section
                    style={{
                      background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-green-50) 100%)',
                      border: '1.5px solid var(--bd-green-300)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 15px -3px rgba(22, 101, 52, 0.08)',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid var(--bd-green-100)',
                        paddingBottom: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}><Ico n="flame" /></span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--fg-green-900)' }}>
                              Today's AI Live Examination Tests (दैनिक लाइव टेस्ट)
                            </h3>
                            <span
                              style={{
                                background: 'var(--bg-red-100)',
                                color: 'var(--fg-red-600)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--bd-red-300)'
                              }}
                            >
                              LIVE • {toDisplayDate(todayIso)}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-green-800)' }}>
                            8 Official Daily Tests calibrated to AR Typing Medium & Hard standards (4 English + 4 Hindi • 15:00 Strict Countdown)
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', background: 'var(--bg-green-100)', borderRadius: '8px', padding: '3px' }}>
                          <button
                            onClick={() => setDailyTab('all')}
                            style={{
                              padding: '4px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: dailyTab === 'all' ? 'var(--tw-green-800)' : 'transparent',
                              color: dailyTab === 'all' ? '#ffffff' : 'var(--fg-green-800)'
                            }}
                          >
                            All 8 Tests
                          </button>
                          <button
                            onClick={() => setDailyTab('english')}
                            style={{
                              padding: '4px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: dailyTab === 'english' ? 'var(--tw-green-800)' : 'transparent',
                              color: dailyTab === 'english' ? '#ffffff' : 'var(--fg-green-800)'
                            }}
                          >
                            🇬🇧 English (4)
                          </button>
                          <button
                            onClick={() => setDailyTab('hindi')}
                            style={{
                              padding: '4px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: dailyTab === 'hindi' ? 'var(--tw-green-800)' : 'transparent',
                              color: dailyTab === 'hindi' ? '#ffffff' : 'var(--fg-green-800)'
                            }}
                          >
                            🇮🇳 Hindi (4)
                          </button>
                        </div>

                        {currentUser && isUserAdmin(currentUser) && onOpenAiGenerator && (
                          <button
                            onClick={onOpenAiGenerator}
                            style={{
                              background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                            }}
                          >
                            <span><Ico n="zap" /></span>
                            <span>AI Generator</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="live-tests-grid">
                      {displayDailyLiveTests.map(renderLiveTestCard)}
                    </div>
                  </section>
                )}

                {/* 2. ENGLISH LIVE TESTS IN ENGLISH MODE */}
                {currentMode.id === 'english' && englishLiveTests.length > 0 && (
                  <section
                    style={{
                      background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-blue-50) 100%)',
                      border: '1.5px solid var(--bd-blue-300)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 15px -3px rgba(29, 78, 216, 0.08)',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid var(--bd-blue-100)',
                        paddingBottom: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🇬🇧</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--fg-blue-900)' }}>
                              Today's English AI Live Examination Tests (4 Live Tests)
                            </h3>
                            <span
                              style={{
                                background: 'var(--bg-blue-100)',
                                color: 'var(--fg-blue-700)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--bd-blue-200)'
                              }}
                            >
                              LIVE • {toDisplayDate(todayIso)}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-blue-700)' }}>
                            4 Official English Tests calibrated to AR Typing Medium & Hard standards (2 Medium + 2 Hard • 520–580 Words)
                          </p>
                        </div>
                      </div>

                      {currentUser && isUserAdmin(currentUser) && onOpenAiGenerator && (
                        <button
                          onClick={onOpenAiGenerator}
                          style={{
                            background: 'var(--tw-blue-700)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span><Ico n="zap" /></span>
                          <span>Generate Live Test</span>
                        </button>
                      )}
                    </div>

                    <div className="live-tests-grid">
                      {englishLiveTests.map(renderLiveTestCard)}
                    </div>
                  </section>
                )}

                {/* 3. HINDI MANGAL LIVE TESTS IN HINDI MANGAL MODE */}
                {currentMode.id === 'hindi_mangal' && hindiMangalLiveTests.length > 0 && (
                  <section
                    style={{
                      background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-amber-100) 100%)',
                      border: '1.5px solid var(--bd-amber-300)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 15px -3px rgba(180, 83, 9, 0.08)',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid var(--bd-amber-200)',
                        paddingBottom: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🇮🇳</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--fg-amber-900)' }}>
                              Today's हिंदी मंगल (Mangal Inscript) AI Live Tests (4 Live Tests)
                            </h3>
                            <span
                              style={{
                                background: 'var(--bg-amber-100)',
                                color: 'var(--fg-amber-700)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--bd-amber-200)'
                              }}
                            >
                              LIVE • {toDisplayDate(todayIso)}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-amber-800)' }}>
                            4 Official Hindi Mangal Inscript Tests calibrated to AR Typing Medium & Hard (25 WPM • 85% Accuracy)
                          </p>
                        </div>
                      </div>

                      {currentUser && isUserAdmin(currentUser) && onOpenAiGenerator && (
                        <button
                          onClick={onOpenAiGenerator}
                          style={{
                            background: 'var(--tw-amber-700)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span><Ico n="zap" /></span>
                          <span>Generate Live Test</span>
                        </button>
                      )}
                    </div>

                    <div className="live-tests-grid">
                      {hindiMangalLiveTests.map(renderLiveTestCard)}
                    </div>
                  </section>
                )}

                {/* 4. HINDI KRUTI LIVE TESTS IN HINDI KRUTI MODE */}
                {currentMode.id === 'hindi_kruti' && krutiLiveTests.length > 0 && (
                  <section
                    style={{
                      background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-green-50) 100%)',
                      border: '1.5px solid var(--bd-green-300)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 15px -3px rgba(22, 101, 52, 0.08)',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid var(--bd-green-100)',
                        paddingBottom: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🇮🇳</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--fg-green-900)' }}>
                              Today's हिंदी कुर्ती देव (Kruti Dev 010) Live Tests
                            </h3>
                            <span
                              style={{
                                background: 'var(--bg-green-100)',
                                color: 'var(--fg-green-800)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--bd-green-200)'
                              }}
                            >
                              FEATURED • Kruti Dev 010
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-green-800)' }}>
                            Remington Keyboard Layout • Authentic Kruti Dev 010 High-Difficulty Exam Tests (25 WPM Target)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="live-tests-grid">
                      {krutiLiveTests.map(renderLiveTestCard)}
                    </div>
                  </section>
                )}

                {/* Filters Toolbar */}
                <div className="exam-toolbar">
                  <div className="exam-toolbar-row">
                    {/* Difficulty Chips */}
                    <div className="exam-filter-group">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fg-slate-500)', marginRight: '4px' }}>
                        Difficulty:
                      </span>
                      <button
                        className={`exam-filter-chip ${selectedDifficulty === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty('all')}
                      >
                        All Difficulties
                      </button>
                      <button
                        className={`exam-filter-chip ${selectedDifficulty === 'easy' ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty('easy')}
                      >
                        <Ico n="dot-green" /> Easy
                      </button>
                      <button
                        className={`exam-filter-chip ${selectedDifficulty === 'medium' ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty('medium')}
                      >
                        <Ico n="dot-yellow" /> Moderate
                      </button>
                      <button
                        className={`exam-filter-chip ${selectedDifficulty === 'hard' ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty('hard')}
                      >
                        <Ico n="live" /> Hard
                      </button>
                    </div>

                    {/* Sort Order Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fg-slate-500)' }}>
                        Order:
                      </span>
                      <select
                        value={level3SortBy}
                        onChange={(e) => setLevel3SortBy(e.target.value as 'number' | 'date_desc' | 'difficulty')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--bd-slate-300)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--fg-slate-900)',
                          background: 'var(--surface)',
                          outline: 'none'
                        }}
                      >
                        <option value="number">Numbering (Test 1, 2, 3...)</option>
                        <option value="date_desc">Newest Date First</option>
                        <option value="difficulty">Difficulty (Easy → Hard)</option>
                      </select>
                    </div>

                    {/* Timer Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fg-slate-500)' }}>
                        Timer:
                      </span>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--bd-slate-300)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--fg-slate-900)',
                          background: 'var(--surface)',
                          outline: 'none'
                        }}
                      >
                        <option value={15}>15 Min (UPPRPB Official)</option>
                        <option value={10}>10 Min</option>
                        <option value={5}>5 Min (Speed Drill)</option>
                        <option value={2}>2 Min (Sprint)</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="exam-toolbar-row">
                    <div className="exam-search-box">
                      <svg
                        className="exam-search-icon"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="exam-search-input"
                        placeholder="Search by test number (e.g. 1, 15, 45), topic or keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--tw-slate-400)',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Ico n="x" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Free Demo & Pro Access Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--bg-green-50) 0%, var(--bg-green-100) 100%)',
                  border: '1.5px solid var(--bd-green-300)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      fontSize: '1.6rem',
                      background: 'var(--surface)',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      flexShrink: 0
                    }}>
                      <Ico n="gift" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--fg-green-800)', fontSize: '0.95rem' }}>
                        Free Demo Unlocked: Tests #01 to #07 are 100% FREE for Everyone
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--fg-green-700)', marginTop: '2px' }}>
                        Practice full exam timer & cutoffs with zero restriction. Tests #08+ are full official exam series unlocked with a Pro Pass.
                      </div>
                    </div>
                  </div>

                  {!hasExamProAccess(currentUser, selectedExamProfile?.id || activePost?.id, selectedExamProfile?.categoryGroup || activePost?.categoryGroup) && (
                    <button
                      type="button"
                      onClick={() => onOpenPayment?.(selectedExamProfile?.id || activePost?.id)}
                      className="btn btn-warning"
                      style={{
                        padding: '8px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-amber-600) 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span><Ico n="gem" /></span>
                      <span>Unlock All Tests (Pro)</span>
                    </button>
                  )}
                </div>

                {/* Available Tests Count */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--fg-slate-700)' }}>
                    Available Tests in {currentMode.title} ({filteredLevel3Passages.length})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                    Showing {Math.min(visibleCount, filteredLevel3Passages.length)} of {filteredLevel3Passages.length}
                  </div>
                </div>

                {/* Tests Grid */}
                {filteredLevel3Passages.length === 0 ? (
                  <div
                    style={{
                      background: 'var(--surface)',
                      borderRadius: '12px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      border: '1px solid var(--bd-slate-200)'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}><Ico n="search" /></div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg-slate-900)', marginBottom: '8px' }}>
                      No matching tests found in this category
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-500)', marginBottom: '16px' }}>
                      Try selecting another difficulty level or resetting your search keyword.
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedDifficulty('all');
                        setSearchQuery('');
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="exam-grid">
                    {filteredLevel3Passages.slice(0, visibleCount).map((passage, index) => {
                      const past = pastAttemptsMap.get(passage.id) || pastAttemptsMap.get(passage.title);
                      const cardSpeed = selectedExamProfile?.targetSpeed || (passage.language === 'english' ? (engVariant?.targetSpeed || 30) : (mangalVariant?.targetSpeed || 25));
                      const cardAcc = selectedExamProfile?.minAccuracy || (activePost.variants[0]?.minAccuracy || 85);
                      const cardLimit = selectedExamProfile?.inputType === 'character' ? selectedExamProfile.inputLimit : passage.wordCount;
                      const cardLimitType = selectedExamProfile?.inputType === 'character' ? 'Chars' : 'Words';
                      const cardCategory = selectedExamProfile
                        ? (CATEGORY_GROUPS.find((g) => g.id === selectedExamProfile.categoryGroup)?.title || activePost.organization)
                        : activePost.organization;
                      const cardEmblem = getEmblemForGroup(selectedExamProfile?.categoryGroup || activePost.categoryGroup);

                      const access = isTestLocked(
                        passage.testNumber,
                        index,
                        currentUser,
                        selectedExamProfile?.id || activePost.id,
                        selectedExamProfile?.categoryGroup || activePost.categoryGroup
                      );

                      const testNumberStr = passage.testNumber
                        ? `Test #${passage.testNumber < 100 ? String(passage.testNumber).padStart(2, '0') : passage.testNumber}`
                        : `Test #${String(index + 1).padStart(2, '0')}`;

                      return (
                        <ExamBenchmarkTestCard
                          key={passage.id}
                          emblem={cardEmblem}
                          logoIdentifier={selectedExamProfile?.id || activePost.id}
                          categoryGroup={selectedExamProfile?.categoryGroup || activePost.categoryGroup}
                          categoryOrOrg={cardCategory}
                          language={passage.language}
                          title={passage.title}
                          targetSpeed={cardSpeed}
                          durationMinutes={selectedDuration}
                          minAccuracy={cardAcc}
                          limitCount={cardLimit}
                          limitType={cardLimitType}
                          extraBadge={{
                            text: access.isDemo ? `${testNumberStr} • FREE DEMO` : (access.isLocked ? `${testNumberStr} • PRO` : testNumberStr),
                            bg: access.isDemo ? 'var(--bg-green-100)' : (access.isLocked ? 'var(--bg-amber-100)' : 'var(--bg-sky-100)'),
                            color: access.isDemo ? 'var(--fg-green-700)' : (access.isLocked ? 'var(--fg-amber-700)' : 'var(--fg-sky-700)'),
                            border: access.isDemo ? 'var(--bd-green-300)' : (access.isLocked ? 'var(--bd-amber-200)' : 'var(--bd-sky-200)')
                          }}
                          pastAttempt={past}
                          isLocked={access.isLocked}
                          isDemo={access.isDemo}
                          onUnlock={() => onOpenPayment?.(selectedExamProfile?.id || activePost.id)}
                          onStartMock={() => onStartTest(passage, selectedDuration, selectedExamProfile)}
                          onBrowse={() => onStartTest(passage, selectedDuration, selectedExamProfile)}
                          startBtnText={access.isDemo ? (past ? `Retest Demo (${selectedDuration}m)` : `Start Demo Test (${selectedDuration}m)`) : (past ? `Retest (${selectedDuration}m)` : `Start Mock (${selectedDuration}m)`)}
                          browseBtnText={access.isDemo ? "Free Demo" : "Start Test"}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Load More Button */}
                {visibleCount < filteredLevel3Passages.length && (
                  <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setVisibleCount((prev) => prev + 18)}
                      style={{
                        fontWeight: 700,
                        padding: '10px 28px',
                        borderRadius: '8px'
                      }}
                    >
                      Load More Tests ({filteredLevel3Passages.length - visibleCount} remaining) ↓
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE: CLASSIC DATE-WISE FORM (AR TYPING REPLICA)
            ======================================================== */}
        {navLevel === 'classic_form' && (
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setNavLevel(1)}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>←</span> Back to All Courses
              </button>
            </div>

            <div
              className="card"
              style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                padding: '32px 28px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--bd-slate-200)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                  onClick={() => setNavLevel(1)}
                  className="btn"
                  style={{
                    backgroundColor: 'var(--tw-sky-600)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '12px 28px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Explore All 129 Exam Courses
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                  margin: '20px 0',
                  color: 'var(--fg-slate-500)',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-slate-200)' }} />
                <span style={{ padding: '0 16px' }}>CLASSIC DATE-WISE PASSAGE SELECTOR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-slate-200)' }} />
              </div>

              {/* Difficulty Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  fontSize: '0.875rem',
                  color: 'var(--fg-slate-600)',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-b">B</span> - Basic
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-e">E</span> - Easy
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-m">M</span> - Moderate
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-h">H</span> - Hard (Long Words)
                </span>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Select Language */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--fg-slate-800)', fontSize: '0.95rem' }}>
                    Select Language:
                  </label>
                  <select
                    value={classicLanguage}
                    onChange={(e) => handleClassicLanguageChange(e.target.value as Language)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--bd-slate-300)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--surface)',
                      outline: 'none',
                      fontWeight: 600,
                      color: 'var(--fg-slate-900)'
                    }}
                  >
                    <option value="english">English (UP Police CO & ASI - 30+ WPM)</option>
                    <option value="hindi_mangal">हिंदी - मंगल इनस्क्रिप्ट (Mangal Inscript - 25+ WPM)</option>
                    <option value="hindi_kruti">हिंदी - कुर्ती देव (Kruti Dev 010 - 25+ WPM)</option>
                  </select>
                </div>

                {/* 2. Select Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--fg-slate-800)', fontSize: '0.95rem' }}>
                    Select Date:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={classicDate}
                      onChange={(e) => handleClassicDateChange(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--bd-slate-300)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        backgroundColor: 'var(--surface)',
                        outline: 'none',
                        fontWeight: 600,
                        color: 'var(--fg-slate-900)',
                        flex: '1 1 180px'
                      }}
                    />
                    <select
                      value={classicDate}
                      onChange={(e) => handleClassicDateChange(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--bd-slate-300)',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        backgroundColor: 'var(--bg-slate-50)',
                        outline: 'none',
                        fontWeight: 600,
                        color: 'var(--fg-slate-800)',
                        flex: '1 1 200px'
                      }}
                    >
                      {classicAvailableDates.map((d, idx) => (
                        <option key={d} value={d}>
                          {toDisplayDate(d)} {idx === 0 ? '(Latest Passage)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Select Passage */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'flex-start', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--fg-slate-800)', fontSize: '0.95rem', paddingTop: '10px' }}>
                    Select Passage:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={() => !isLoadingPassages && setIsClassicDropdownOpen(!isClassicDropdownOpen)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--bd-slate-300)',
                        fontSize: '0.95rem',
                        backgroundColor: isLoadingPassages ? 'var(--bg-slate-100)' : 'var(--surface)',
                        cursor: isLoadingPassages ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: currentClassicSelectedPassage ? 700 : 500,
                        color: currentClassicSelectedPassage ? 'var(--fg-slate-900)' : 'var(--fg-slate-500)',
                        boxShadow: isClassicDropdownOpen ? '0 0 0 2px rgba(2, 132, 199, 0.2)' : 'none'
                      }}
                    >
                      <span>
                        {isLoadingPassages
                          ? 'Loading passages...'
                          : currentClassicSelectedPassage
                          ? `${currentClassicSelectedPassage.title} (${currentClassicSelectedPassage.wordCount} words)`
                          : `Select Passage (${classicActiveList.length} available)`}
                      </span>
                      <span>▼</span>
                    </div>

                    {isClassicDropdownOpen && !isLoadingPassages && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'var(--surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--bd-slate-300)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          zIndex: 50,
                          maxHeight: '260px',
                          overflowY: 'auto'
                        }}
                      >
                        {classicActiveList.map((p, idx) => {
                          const badge = getDifficultyBadge(p.difficulty);
                          const access = isTestLocked(
                            p.testNumber,
                            idx,
                            currentUser,
                            selectedExamProfile?.id || activePost?.id,
                            selectedExamProfile?.categoryGroup || activePost?.categoryGroup
                          );
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (access.isLocked) {
                                  onOpenPayment?.(selectedExamProfile?.id || activePost?.id);
                                  return;
                                }
                                setClassicPassageId(p.id);
                                setIsClassicDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid var(--bd-slate-100)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: classicPassageId === p.id ? 'var(--bg-sky-50)' : (access.isLocked ? 'var(--bg-zinc-50)' : 'transparent')
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`ar-badge-difficulty ${badge.cls}`}>{badge.label}</span>
                                <span style={{ fontWeight: 600, color: access.isLocked ? 'var(--fg-amber-800)' : 'var(--fg-slate-800)' }}>
                                  {p.title}
                                </span>
                                {access.isDemo && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-green-100)', color: 'var(--fg-green-700)' }}>
                                    DEMO
                                  </span>
                                )}
                                {access.isLocked && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-amber-100)', color: 'var(--fg-amber-700)' }}>
                                    <Ico n="lock" /> PRO
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.875rem', color: 'var(--fg-slate-500)' }}>
                                {p.wordCount} words
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Select Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--fg-slate-800)', fontSize: '0.95rem' }}>
                    Select Duration:
                  </label>
                  <select
                    value={classicDuration}
                    onChange={(e) => setClassicDuration(Number(e.target.value))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--bd-slate-300)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--surface)',
                      outline: 'none',
                      fontWeight: 600,
                      color: 'var(--fg-slate-900)'
                    }}
                  >
                    <option value={15}>15:00 min (Official UP Police Benchmark)</option>
                    <option value={10}>10:00 min</option>
                    <option value={5}>05:00 min (Quick Drill)</option>
                  </select>
                </div>

                {/* 5. Input Limit */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: 'var(--fg-slate-800)', fontSize: '0.95rem' }}>
                    Input Limit:
                  </label>
                  <select
                    value={classicInputLimit}
                    onChange={(e) => setClassicInputLimit(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--bd-slate-300)',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--surface)',
                      outline: 'none',
                      fontWeight: 600,
                      color: 'var(--fg-slate-900)'
                    }}
                  >
                    <option value="Words">Words (Official Exam Mode)</option>
                    <option value="Full Passage">Full Passage</option>
                  </select>
                </div>

                {/* Start Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const passToStart = currentClassicSelectedPassage || classicActiveList[0];
                      if (passToStart) {
                        const passIdx = classicActiveList.findIndex((p) => p.id === passToStart.id);
                        const access = isTestLocked(
                          passToStart.testNumber,
                          passIdx >= 0 ? passIdx : 0,
                          currentUser,
                          selectedExamProfile?.id || activePost?.id,
                          selectedExamProfile?.categoryGroup || activePost?.categoryGroup
                        );
                        if (access.isLocked) {
                          onOpenPayment?.(selectedExamProfile?.id || activePost?.id);
                          return;
                        }
                        onStartTest(passToStart, classicDuration, selectedExamProfile);
                      }
                    }}
                    disabled={classicActiveList.length === 0}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 36px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px'
                    }}
                  >
                    {classicPassageId ? 'Start Typing Test →' : 'Start Latest Test →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
