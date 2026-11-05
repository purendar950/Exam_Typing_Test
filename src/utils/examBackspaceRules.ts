export interface ExamBackspaceRule {
  status: 'allowed' | 'error_penalty' | 'strict_accuracy' | 'standard';
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  title: string;
  shortDesc: string;
  fullRule: string;
}

/**
 * Returns recruitment-board specific Backspace guidelines.
 */
export function getExamBackspaceRule(exam?: {
  calculationModel?: string;
  categoryGroup?: string;
  title?: string;
  slug?: string;
} | null): ExamBackspaceRule {
  const model = exam?.calculationModel || '';
  const group = exam?.categoryGroup || '';
  const title = (exam?.title || '').toLowerCase();
  const slug = (exam?.slug || '').toLowerCase();

  // 1. High Court & Judiciary (Allahabad HC, Delhi HC, Supreme Court, Patna HC)
  if (
    model === 'court_delhi' ||
    model === 'high_court_ahd' ||
    group === 'judiciary' ||
    title.includes('court') ||
    title.includes('judiciary') ||
    title.includes('high court') ||
    slug.includes('court')
  ) {
    return {
      status: 'error_penalty',
      badgeLabel: '⌫ Backspace: 3% Error Limit',
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      badgeBorder: '#fde68a',
      title: 'High Court / Judiciary 3% Error Limit Rule',
      shortDesc: 'Allowed with strict 3.0% maximum error tolerance',
      fullRule:
        'In High Court / Supreme Court typing tests, Backspace is permitted to correct errors. However, total errors must not exceed 3.0% of typed words (full & half mistake rules applied). Mistakes above 3% result in immediate disqualification.'
    };
  }

  // 2. Defense & Paramilitary (CRPF, CISF, BSF, ITBP, SSB HCM)
  if (
    group === 'defense' ||
    title.includes('crpf') ||
    title.includes('cisf') ||
    title.includes('bsf') ||
    title.includes('itbp') ||
    title.includes('ssb') ||
    title.includes('head constable') ||
    slug.includes('crpf') ||
    slug.includes('cisf') ||
    slug.includes('bsf')
  ) {
    return {
      status: 'strict_accuracy',
      badgeLabel: '⌫ Backspace: 95% Cutoff',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
      badgeBorder: '#fca5a5',
      title: 'Paramilitary HCM Strict 95% Accuracy Rule',
      shortDesc: 'Allowed, but requires min. 95% accuracy cutoff',
      fullRule:
        'In CRPF / CISF / BSF HCM typing tests, Backspace is technically available, but candidate accuracy must be at least 95% (only 5% total errors allowed). Repeated backspacing wastes precious seconds and drops your Net WPM below the 35 WPM qualification cutoff.'
    };
  }

  // 3. SSC DEST (SSC CGL, CHSL, MTS, Steno)
  if (
    model === 'ssc_dest' ||
    group === 'ssc' ||
    title.includes('ssc') ||
    title.includes('cgl') ||
    title.includes('chsl') ||
    title.includes('dest') ||
    slug.includes('ssc')
  ) {
    return {
      status: 'allowed',
      badgeLabel: '⌫ Backspace: Allowed (SSC DEST)',
      badgeBg: '#dcfce7',
      badgeText: '#15803d',
      badgeBorder: '#86efac',
      title: 'Official SSC DEST Backspace Guidelines',
      shortDesc: 'Fully enabled throughout the test duration',
      fullRule:
        'Staff Selection Commission officially permits full use of Backspace and navigation arrow keys throughout the master passage text. Candidates may edit and correct errors freely before final time expiry.'
    };
  }

  // 4. UP Police & UPPSC (UPPRPB Computer Operator, SI/ASI, UPPSC Grade B)
  if (
    model === 'upprpb' ||
    group === 'up_govt' ||
    title.includes('police') ||
    title.includes('upprpb') ||
    title.includes('uppsc') ||
    slug.includes('police')
  ) {
    return {
      status: 'allowed',
      badgeLabel: '⌫ Backspace: Allowed (UPPRPB Rule)',
      badgeBg: '#dcfce7',
      badgeText: '#15803d',
      badgeBorder: '#86efac',
      title: 'Official UP Police / UPPRPB Backspace Standard',
      shortDesc: 'Allowed freely; 85% accuracy benchmark enforced',
      fullRule:
        'UPPRPB rules permit Backspace for correcting errors. However, 85% accuracy is measured against total passage words. Unnecessary backspacing reduces typing momentum, so focus on smooth forward speed.'
    };
  }

  // 5. Default Standard Rule
  return {
    status: 'standard',
    badgeLabel: '⌫ Backspace: Allowed',
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    badgeBorder: '#cbd5e1',
    title: 'Standard Examination Backspace Rule',
    shortDesc: 'Backspace is enabled for practice and corrections',
    fullRule:
      'Backspace key is enabled for editing and error correction during typing. Maintain a steady pace to balance speed and accuracy.'
  };
}
