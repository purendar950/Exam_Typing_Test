import React from 'react';
import {
  BookOpen, Building2, CalendarDays, Check, Circle, CircleDot, ClipboardList, Crown, FileText, Files, Flame,
  Gem, Gift, GraduationCap, House, KeyRound, Landmark, Languages, LayoutGrid, Library, ListOrdered, Lock, Medal,
  Menu, Moon, Pin, Ruler, Scale, Search, Shield, ShieldCheck, Sparkles, Sun, Target, TrainFront, Trophy, User, Volume2, VolumeX, X, Zap,
  Award, ChevronRight, CircleCheck, Clock, Ellipsis, History, Info, Keyboard, LogIn, PenLine,
  type LucideIcon
} from 'lucide-react';

const ICONS = {
  book: BookOpen, building: Building2, calendar: CalendarDays, check: Check, clipboard: ClipboardList,
  crown: Crown, file: FileText, files: Files, flame: Flame, gem: Gem, gift: Gift, graduation: GraduationCap,
  home: House, key: KeyRound, landmark: Landmark, languages: Languages, grid: LayoutGrid, library: Library,
  numbered: ListOrdered, live: CircleDot, lock: Lock, medal: Medal, menu: Menu, pin: Pin, ruler: Ruler,
  scale: Scale, search: Search, shield: Shield, 'shield-check': ShieldCheck, sparkles: Sparkles, target: Target,
  train: TrainFront, trophy: Trophy, user: User, x: X, zap: Zap, sun: Sun, moon: Moon, volume: Volume2,
  mute: VolumeX, award: Award, chevron: ChevronRight, 'check-circle': CircleCheck, clock: Clock, more: Ellipsis,
  history: History, info: Info, keyboard: Keyboard, login: LogIn, pen: PenLine
} satisfies Record<string, LucideIcon>;

export type IcoName = keyof typeof ICONS | 'dot-green' | 'dot-yellow' | 'dot-red';

const DOTS: Record<string, string> = {
  'dot-green': 'var(--tw-green-500)',
  'dot-yellow': 'var(--tw-amber-400)',
  'dot-red': 'var(--tw-red-500)'
};

const EMOJI: Record<string, IcoName> = {
  '⚡': 'zap', '🎯': 'target', '🔒': 'lock', '📋': 'clipboard', '🎁': 'gift', '🔴': 'live', '🔥': 'flame',
  '🏛': 'landmark', '🛡': 'shield-check', '🔍': 'search', '📏': 'ruler', '📅': 'calendar', '🟢': 'dot-green',
  '🟡': 'dot-yellow', '📖': 'book', '💎': 'gem', '👮': 'shield', '👑': 'crown', '🏢': 'building', '🏠': 'home',
  '✕': 'x', '⚖': 'scale', '☰': 'menu', '🚆': 'train', '🗂': 'grid', '🔢': 'numbered', '🔑': 'key', '📝': 'file',
  '📚': 'library', '📑': 'files', '📌': 'pin', '👤': 'user', '🏆': 'trophy', '🎖': 'medal', '🎓': 'graduation',
  '✨': 'sparkles', '✓': 'check', '🇬🇧': 'languages', '🇮🇳': 'languages'
};

const base: React.CSSProperties = { display: 'inline-block', verticalAlign: '-0.14em', flexShrink: 0 };

export const Ico: React.FC<{ n: IcoName; size?: string | number; style?: React.CSSProperties }> = ({ n, size = '1.05em', style }) => {
  const dot = DOTS[n];
  if (dot) return <Circle aria-hidden size={size} fill={dot} stroke="none" style={{ ...base, transform: 'scale(0.7)', ...style }} />;
  const Cmp = ICONS[n as keyof typeof ICONS];
  return <Cmp aria-hidden size={size} strokeWidth={2.2} style={{ ...base, ...style }} />;
};

/** Renders an icon for data that still stores an emoji; unknown values are shown as they are. */
export const EmojiIco: React.FC<{ e: string; size?: string | number }> = ({ e, size }) => {
  const name = EMOJI[e.replace(/\uFE0F/g, '')];
  return name ? <Ico n={name} size={size} /> : <>{e}</>;
};
