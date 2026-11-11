import React, { useEffect, useState } from 'react';
import { Ico, IcoName } from './Ico';

interface BottomNavProps {
  currentTab: 'tests' | 'learn' | 'book';
  isLoggedIn: boolean;
  onSelectTab: (tab: 'tests' | 'learn' | 'book') => void;
  onOpenMyCourses: () => void;
  onOpenAccount: () => void;
  onOpenPayment: () => void;
  onOpenHindiHelper: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenLeaderboard: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  isLoggedIn,
  onSelectTab,
  onOpenMyCourses,
  onOpenAccount,
  onOpenPayment,
  onOpenHindiHelper,
  onOpenRules,
  onOpenHistory,
  onOpenLeaderboard
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const pick = (fn: () => void) => () => {
    setMoreOpen(false);
    fn();
  };

  const more: { icon: IcoName; label: string; run: () => void }[] = [
    { icon: 'gem', label: 'Plans and pricing', run: onOpenPayment },
    { icon: 'pen', label: 'Book practice (MS Word)', run: () => onSelectTab('book') },
    { icon: 'keyboard', label: 'Hindi keyboard help', run: onOpenHindiHelper },
    { icon: 'info', label: 'Exam rules', run: onOpenRules },
    { icon: 'history', label: 'My test history', run: onOpenHistory },
    { icon: 'award', label: 'Leaderboard', run: onOpenLeaderboard }
  ];

  return (
    <>
      <div className="bottom-nav-spacer" aria-hidden />
      {moreOpen && (
        <div className="bottom-sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="bottom-sheet" role="dialog" aria-label="More options" onClick={(e) => e.stopPropagation()}>
            {more.map((m) => (
              <button key={m.label} type="button" className="bottom-sheet-item" onClick={pick(m.run)}>
                <Ico n={m.icon} size={20} />
                <span>{m.label}</span>
                <Ico n="chevron" size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </button>
            ))}
          </div>
        </div>
      )}
      <nav className="bottom-nav" aria-label="Main">
        <button type="button" className={currentTab === 'tests' && !moreOpen ? 'active' : ''} onClick={pick(() => onSelectTab('tests'))}>
          <Ico n="clipboard" size={22} />
          <span>Tests</span>
        </button>
        <button type="button" className={currentTab === 'learn' && !moreOpen ? 'active' : ''} onClick={pick(() => onSelectTab('learn'))}>
          <Ico n="book" size={22} />
          <span>Learn</span>
        </button>
        <button type="button" onClick={pick(onOpenMyCourses)}>
          <Ico n="graduation" size={22} />
          <span>Courses</span>
        </button>
        <button type="button" onClick={pick(onOpenAccount)}>
          <Ico n={isLoggedIn ? 'user' : 'login'} size={22} />
          <span>{isLoggedIn ? 'Account' : 'Login'}</span>
        </button>
        <button type="button" className={moreOpen ? 'active' : ''} aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
          <Ico n="more" size={22} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
