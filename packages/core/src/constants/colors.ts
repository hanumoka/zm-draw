import type { StickyNoteColor, SectionColor, StampType } from '../types';

/** Sticky note color hex values (FigJam official) */
export const STICKY_COLORS: Record<StickyNoteColor, string> = {
  yellow: '#FFE299',
  orange: '#FFD3A8',
  red: '#FFB8A8',
  pink: '#FFA8DB',
  violet: '#D3BDFF',
  blue: '#A8DAFF',
  teal: '#B3F4EF',
  green: '#B3EFBD',
  gray: '#E6E6E6',
  white: '#FFFFFF',
};

/** Section color hex values (light backgrounds) */
export const SECTION_COLORS: Record<SectionColor, string> = {
  gray: '#f3f4f6',
  red: '#fee2e2',
  orange: '#ffedd5',
  yellow: '#fef9c3',
  green: '#dcfce7',
  blue: '#dbeafe',
  purple: '#f3e8ff',
};

/** Stamp emoji mapping */
export const STAMP_EMOJIS: Record<StampType, string> = {
  thumbsUp: '\u{1F44D}',
  thumbsDown: '\u{1F44E}',
  heart: '\u2764\uFE0F',
  star: '\u2B50',
  check: '\u2705',
  question: '\u2753',
  exclamation: '\u2757',
  celebration: '\u{1F389}',
};
