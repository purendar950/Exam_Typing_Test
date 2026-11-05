import { UNIFIED_EXAM_POSTS, ALL_EXAMS, UnifiedExamPost, ExamProfile } from '../data/allExams';
import { PaymentSubmission } from '../services/paymentService';

export interface ResolvedCourseDestination {
  level: 1 | 2 | 3;
  examPostId?: string;
  modeId?: string;
  categoryGroup?: string;
  hash: string;
  examTitle: string;
  postTitle?: string;
  badge?: string;
  emblemEmoji: string;
  matchedVariant?: ExamProfile;
  matchedPost?: UnifiedExamPost;
}

/**
 * Maps a categoryGroup string to a representative emoji
 */
export function getCategoryEmoji(group?: string): string {
  switch (group) {
    case 'judiciary':
      return '⚖️';
    case 'up_govt':
      return '👮';
    case 'ssc':
      return '🏢';
    case 'delhi_govt':
      return '🏛️';
    case 'defense':
      return '🛡️';
    case 'bihar':
      return '📜';
    case 'railways':
      return '🚆';
    case 'central_nta':
      return '🇮🇳';
    case 'state_exams':
      return '🏛️';
    default:
      return '🎯';
  }
}

/**
 * Resolves any PaymentSubmission into an exact app route/hash and target exam.
 */
export function resolveCourseDestination(course: PaymentSubmission): ResolvedCourseDestination {
  // 1. All Exams Mega Pass -> Level 1 (All 129 Exams)
  if (course.planType === 'all_exams_pass') {
    return {
      level: 1,
      hash: '#/exams',
      examTitle: course.planName || 'All 129 Exams Mega Pass',
      postTitle: 'All 129 Competitive Examinations',
      badge: 'All Exams Unlocked',
      emblemEmoji: '👑'
    };
  }

  // 2. Single Exam Pass -> Resolve exact UnifiedExamPost and variant
  const rawId = (course.selectedExamId || '').trim();
  const rawTitle = (course.selectedExamTitle || course.examTitle || '').trim().toLowerCase();

  let matchedPost: UnifiedExamPost | undefined;
  let matchedVariant: ExamProfile | undefined;

  // 2a. Match by Post ID directly
  if (rawId) {
    matchedPost = UNIFIED_EXAM_POSTS.find((p) => p.id === rawId);
  }

  // 2b. Match by Variant ID or Slug inside UNIFIED_EXAM_POSTS
  if (!matchedPost && rawId) {
    matchedPost = UNIFIED_EXAM_POSTS.find((p) =>
      p.variants.some((v) => {
        if (v.id === rawId || v.slug === rawId) {
          matchedVariant = v;
          return true;
        }
        return false;
      })
    );
  }

  // 2c. Match by Variant Title inside UNIFIED_EXAM_POSTS
  if (!matchedPost && rawTitle) {
    matchedPost = UNIFIED_EXAM_POSTS.find((p) =>
      p.variants.some((v) => {
        const vTitle = v.title.toLowerCase();
        if (vTitle.includes(rawTitle) || rawTitle.includes(vTitle)) {
          matchedVariant = v;
          return true;
        }
        return false;
      })
    );
  }

  // 2d. Match against ALL_EXAMS list
  if (!matchedPost && rawId) {
    const ep = ALL_EXAMS.find((e) => e.id === rawId || e.slug === rawId);
    if (ep) {
      matchedVariant = ep;
      matchedPost = UNIFIED_EXAM_POSTS.find(
        (p) =>
          p.categoryGroup === ep.categoryGroup &&
          p.variants.some((v) => v.id === ep.id || v.title === ep.title)
      ) || UNIFIED_EXAM_POSTS.find((p) => p.categoryGroup === ep.categoryGroup);
    }
  }

  // 2e. Match by Post Title
  if (!matchedPost && rawTitle) {
    matchedPost = UNIFIED_EXAM_POSTS.find((p) => {
      const pTitle = p.postTitle.toLowerCase();
      return pTitle.includes(rawTitle) || rawTitle.includes(pTitle);
    });
  }

  if (matchedPost) {
    const mode = matchedVariant
      ? matchedVariant.language
      : matchedPost.variants[0]?.language || 'english';

    const hash = matchedVariant
      ? `#/exam/${matchedPost.id}/${mode}`
      : `#/exam/${matchedPost.id}`;

    return {
      level: matchedVariant ? 3 : 2,
      examPostId: matchedPost.id,
      modeId: mode,
      categoryGroup: matchedPost.categoryGroup,
      hash,
      examTitle: matchedVariant?.title || matchedPost.postTitle,
      postTitle: matchedPost.postTitle,
      badge: matchedVariant ? `${matchedVariant.targetSpeed} WPM • ${matchedVariant.language}` : 'Dedicated Test Series',
      emblemEmoji: getCategoryEmoji(matchedPost.categoryGroup),
      matchedVariant,
      matchedPost
    };
  }

  // 3. Category Combo Pass
  if (course.planType === 'category_combo') {
    const text = `${course.planName} ${course.selectedExamTitle || ''} ${course.examTitle || ''}`.toLowerCase();
    let cat = 'up_govt';
    if (text.includes('court') || text.includes('judiciary') || text.includes('high court')) cat = 'judiciary';
    else if (text.includes('ssc') || text.includes('cgl') || text.includes('chsl')) cat = 'ssc';
    else if (text.includes('defense') || text.includes('crpf') || text.includes('bsf') || text.includes('cisf')) cat = 'defense';
    else if (text.includes('bihar') || text.includes('beltron')) cat = 'bihar';
    else if (text.includes('railway') || text.includes('rrb') || text.includes('ntpc')) cat = 'railways';
    else if (text.includes('delhi') || text.includes('dsssb')) cat = 'delhi_govt';

    return {
      level: 1,
      categoryGroup: cat,
      hash: '#/exams',
      examTitle: course.planName || 'Category Combo Pass',
      postTitle: 'Sector-Wide Examinations',
      badge: 'Sector Combo',
      emblemEmoji: getCategoryEmoji(cat)
    };
  }

  // 4. Fallback Default (e.g. UP Police CO/ASI)
  return {
    level: 2,
    examPostId: 'up-police-co-asi',
    modeId: 'english',
    categoryGroup: 'up_govt',
    hash: '#/exam/up-police-co-asi',
    examTitle: course.selectedExamTitle || course.planName || 'Typing Examination',
    postTitle: 'Computer Operator & SI/ASI',
    badge: 'Pro Member',
    emblemEmoji: '🎯'
  };
}

/**
 * Executes a seamless navigation to the purchased course's tests:
 * 1. Closes any open modals
 * 2. Saves route to sessionStorage
 * 3. Sets window.location.hash
 * 4. Dispatches hashchange event so ChooseTest updates immediately
 * 5. Smooth-scrolls to the test material grid
 */
export function openPurchasedCourse(
  course: PaymentSubmission,
  callbacks?: {
    onBeforeNavigate?: () => void;
    onAfterNavigate?: () => void;
  }
) {
  if (callbacks?.onBeforeNavigate) {
    callbacks.onBeforeNavigate();
  }

  const dest = resolveCourseDestination(course);

  // 1. Save session navigation route
  try {
    sessionStorage.setItem(
      'up_exam_nav_route',
      JSON.stringify({
        level: dest.level,
        examId: dest.examPostId || 'up-police-co-asi',
        modeId: dest.modeId || 'english'
      })
    );
    if (dest.categoryGroup) {
      sessionStorage.setItem('up_exam_filter_group', dest.categoryGroup);
    }
  } catch (err) {
    console.warn('Could not save exam nav route to sessionStorage:', err);
  }

  // 2. Dispatch hashchange
  if (window.location.hash === dest.hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = dest.hash;
  }

  // 3. Smooth-scroll into view
  setTimeout(() => {
    const candidates = [
      document.getElementById('exam-test-view'),
      document.querySelector('.level3-mock-grid'),
      document.querySelector('.exam-mode-screen'),
      document.querySelector('.exam-main-panel'),
      document.querySelector('main')
    ];
    for (const el of candidates) {
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
    if (callbacks?.onAfterNavigate) {
      callbacks.onAfterNavigate();
    }
  }, 120);
}
