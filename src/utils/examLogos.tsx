import React, { useState } from 'react';

export interface ExamLogoInfo {
  logoUrl: string;
  fallbackEmoji: string;
  altText: string;
}

// 1. Group default logos
export const GROUP_DEFAULT_LOGOS: Record<string, { logoUrl: string; fallbackEmoji: string }> = {
  up_govt: { logoUrl: '/images/exam-logos/up-police.jpg', fallbackEmoji: '👮' },
  judiciary: { logoUrl: '/images/exam-logos/judiciary-seal.png', fallbackEmoji: '⚖️' },
  ssc: { logoUrl: '/images/exam-logos/ssc.png', fallbackEmoji: '🏢' },
  delhi_govt: { logoUrl: '/images/exam-logos/dsssb.png', fallbackEmoji: '🛡️' },
  defense: { logoUrl: '/images/exam-logos/capf-bsf.png', fallbackEmoji: '🎖️' },
  bihar: { logoUrl: '/images/exam-logos/bihar-govt.png', fallbackEmoji: '🏛️' },
  central_nta: { logoUrl: '/images/exam-logos/cbse.png', fallbackEmoji: '🎓' },
  railways: { logoUrl: '/images/exam-logos/railways-rrb.png', fallbackEmoji: '🚆' },
  state_exams: { logoUrl: '/images/exam-logos/mp-cpct.jpg', fallbackEmoji: '📋' }
};

// 2. Specific exam ID or slug mappings
export const EXAM_SPECIFIC_LOGOS: Record<string, string> = {
  // UP Govt
  'up-police-co-asi': '/images/exam-logos/up-police.jpg',
  'up-police-co': '/images/exam-logos/up-police.jpg',
  'up-police-asi': '/images/exam-logos/up-police.jpg',
  'up-police-asi-accounts': '/images/exam-logos/up-police.jpg',
  'up-police-radio': '/images/exam-logos/up-police.jpg',
  'up-psc-co-grade-b': '/images/exam-logos/uppsc.png',
  'uppsc-ro-aro': '/images/exam-logos/uppsc.png',
  'uppsc-computer-assistant': '/images/exam-logos/uppsc.png',
  'upsssc-assistants': '/images/exam-logos/upsssc.webp',

  // Railways
  'rrb-ntpc': '/images/exam-logos/railways-rrb.png',
  'rrb-ntpc-typing-test': '/images/exam-logos/railways-rrb.png',

  // Staff Selection Commission (SSC)
  'ssc-chsl-jsa-ldc': '/images/exam-logos/ssc-chsl.png',
  'ssc-chsl-typing-mock': '/images/exam-logos/ssc-chsl.png',
  'ssc-chsl-deo': '/images/exam-logos/ssc-deo.png',
  'ssc-chsl-deo-typing-test': '/images/exam-logos/ssc-deo.png',
  'ssc-chsl-pwbd': '/images/exam-logos/ssc-chsl-pwbd-typing-test.png',
  'ssc-cgl-deo': '/images/exam-logos/ssc.png',
  'ssc-cgl-typing-mock': '/images/exam-logos/ssc.png',
  'ssc-cgl-pwbd': '/images/exam-logos/ssc-cgl-mock-typing-pwbd.png',
  'ssc-dest-2000': '/images/exam-logos/ssc.png',
  'ssc-dest-3750': '/images/exam-logos/ssc-deo.png',
  'ssc': '/images/exam-logos/ssc.png',

  // Courts & Judiciary
  'ahc-ro-aro': '/images/exam-logos/allahabad-hc.jpg',
  'ahc-group-c-clerk': '/images/exam-logos/allahabad-hc.jpg',
  'dhc-jja': '/images/exam-logos/delhi-hc.webp',
  'dhc-pa-spa': '/images/exam-logos/delhi-hc.webp',
  'sci-jca': '/images/exam-logos/supreme-court.png',
  'sci-spa-pa': '/images/exam-logos/supreme-court.png',
  'phhc-clerk': '/images/exam-logos/phhc.png',
  'aphc-typist': '/images/exam-logos/aphc.png',
  'dsssb-delhi-jja': '/images/exam-logos/dsssb.png',

  // Delhi Govt
  'delhi-police-hcm': '/images/exam-logos/delhi-police.png',
  'delhi-police-hcm-2500': '/images/exam-logos/delhi-police-2500.png',
  'dsssb-ldc-ja': '/images/exam-logos/dsssb.png',
  'dsssb-stenographer': '/images/exam-logos/dsssb.png',
  'dsssb-5000-keystrokes': '/images/exam-logos/dsssb-5000.png',
  'dda-aso': '/images/exam-logos/dda.png',
  'dda-jsa': '/images/exam-logos/dda.png',
  'delhi-jal-board-ja': '/images/exam-logos/dsssb.png',

  // State Exams & Certifications
  'mp-cpct': '/images/exam-logos/mp-cpct.jpg',
  'mp-cpct-typing-test': '/images/exam-logos/mp-cpct.jpg',
  'rssb-ia-rajasthan': '/images/exam-logos/rssb.png',
  'rssb-ldc-rajasthan': '/images/exam-logos/rssb.png',
  'rssb-nhm-deo-rajasthan': '/images/exam-logos/rssb.png',
  'skau-typing-test': '/images/exam-logos/skau.png',
  'skau': '/images/exam-logos/skau.png',
  'wbssc-clerkship': '/images/exam-logos/wbpsc.png',

  // Paramilitary & Defense
  'bsf-all-forces-hcm': '/images/exam-logos/capf-bsf.png',
  'ssb-hcm': '/images/exam-logos/capf-bsf.png',
  'air-force-group-c': '/images/exam-logos/capf-bsf.png',
  'army-agniveer-ldc': '/images/exam-logos/capf-bsf.png',

  // Central NTA & Educational Bodies
  'kvs-jsa': '/images/exam-logos/kvs.png',
  'ncert-ldc': '/images/exam-logos/ncert.webp',
  'cbse-junior-assistant': '/images/exam-logos/cbse.png',
  'aiims-cre': '/images/exam-logos/aiims.png',
  'csir-jsa': '/images/exam-logos/csir.png',
  'bhu-junior-clerk': '/images/exam-logos/bhu.jpg',
  'emrs-jsa': '/images/exam-logos/emrs.jpg',
  'nvs-jsa': '/images/exam-logos/kvs.png',

  // Bihar
  'bihar-bssc-inter-level': '/images/exam-logos/bihar-govt.png',
  'bihar-beltron-deo': '/images/exam-logos/bihar-govt.png',
  'bihar-jeevika': '/images/exam-logos/bihar-govt.png',
  'bihar-vidhan-parishad': '/images/exam-logos/bihar-govt.png',
  'bihar-vidhan-sabha': '/images/exam-logos/bihar-govt.png',
  'bihar-civil-court-reader': '/images/exam-logos/bihar-govt.png'
};

export function getExamLogo(identifier: string, categoryGroup?: string): ExamLogoInfo {
  const cleanId = (identifier || '').toLowerCase();

  // 1. Check exact key in specific logos
  if (EXAM_SPECIFIC_LOGOS[cleanId]) {
    return {
      logoUrl: EXAM_SPECIFIC_LOGOS[cleanId],
      fallbackEmoji: GROUP_DEFAULT_LOGOS[categoryGroup || '']?.fallbackEmoji || '🏛️',
      altText: identifier
    };
  }

  // 2. Check partial key match
  for (const [key, url] of Object.entries(EXAM_SPECIFIC_LOGOS)) {
    if (cleanId.includes(key) || key.includes(cleanId)) {
      return {
        logoUrl: url,
        fallbackEmoji: GROUP_DEFAULT_LOGOS[categoryGroup || '']?.fallbackEmoji || '🏛️',
        altText: identifier
      };
    }
  }

  // 3. Fallback to category group default
  if (categoryGroup && GROUP_DEFAULT_LOGOS[categoryGroup]) {
    return {
      logoUrl: GROUP_DEFAULT_LOGOS[categoryGroup].logoUrl,
      fallbackEmoji: GROUP_DEFAULT_LOGOS[categoryGroup].fallbackEmoji,
      altText: categoryGroup
    };
  }

  // 4. Default national emblem
  return {
    logoUrl: '/images/exam-logos/judiciary-seal.png',
    fallbackEmoji: '📝',
    altText: identifier
  };
}

interface ExamLogoProps {
  identifier: string;
  categoryGroup?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const ExamLogo: React.FC<ExamLogoProps> = ({
  identifier,
  categoryGroup,
  size = 38,
  className = '',
  style = {}
}) => {
  const [hasError, setHasError] = useState(false);
  const logoInfo = getExamLogo(identifier, categoryGroup);
  const dimension = typeof size === 'number' ? `${size}px` : size;

  if (hasError || !logoInfo.logoUrl) {
    return (
      <span
        className={`exam-logo-emoji-fallback ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: dimension,
          height: dimension,
          fontSize: typeof size === 'number' ? `${size * 0.58}px` : '1.3rem',
          flexShrink: 0,
          userSelect: 'none',
          ...style
        }}
        title={logoInfo.altText}
      >
        {logoInfo.fallbackEmoji}
      </span>
    );
  }

  return (
    <img
      src={logoInfo.logoUrl}
      alt={logoInfo.altText}
      className={`exam-logo-img ${className}`}
      onError={() => setHasError(true)}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        objectFit: 'contain',
        background: '#ffffff',
        padding: '2px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        flexShrink: 0,
        ...style
      }}
      loading="lazy"
    />
  );
};
