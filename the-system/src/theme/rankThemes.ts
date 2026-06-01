import type { Rank } from '../types';

export interface RankTheme {
  background: string;
  primary: string;
  accent: string;
  text: string;
  textSecondary: string;
  borderStyle: string;
  auraColor: string | null;
  particleType: string;
  particleCount: number;
  avatarFloat: boolean;
  screenGlow: boolean;
  screenGlowColor?: string;
  borderAnimated?: boolean;
}

// Claude palette: warm-charcoal dark mode with a coral/clay accent that
// deepens E→S, warming toward gold at the top. Shared warm off-white text.
export const RANK_THEMES: Record<Rank, RankTheme> = {
  E: {
    background: '#222220', primary: '#2C2B28', accent: '#B98E78',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#B98E78', particleType: 'motes', particleCount: 7,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#B98E7818',
  },
  D: {
    background: '#252320', primary: '#2F2D29', accent: '#C68F70',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#C68F70', particleType: 'motes', particleCount: 9,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#C68F7022',
  },
  C: {
    background: '#262624', primary: '#30302E', accent: '#D97757',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#D97757', particleType: 'motes', particleCount: 11,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#D9775726',
  },
  B: {
    background: '#272421', primary: '#322E29', accent: '#E07F54',
    text: '#EDEAE0', textSecondary: '#9A968B', borderStyle: 'system_panel',
    auraColor: '#E07F54', particleType: 'sparks', particleCount: 13,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#E07F5430',
  },
  A: {
    background: '#2A2622', primary: '#34302A', accent: '#E88A5A',
    text: '#F2EFE6', textSecondary: '#A8A395', borderStyle: 'arcane_panel',
    auraColor: '#E3B341', particleType: 'sparks', particleCount: 15,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#E88A5A30',
  },
  S: {
    background: '#2C2722', primary: '#36302A', accent: '#F0A368',
    text: '#FBF8F0', textSecondary: '#C4BCA8', borderStyle: 'monarch_panel',
    auraColor: '#E3B341', particleType: 'god_rays', particleCount: 18,
    avatarFloat: true, screenGlow: true, screenGlowColor: '#E3B34128',
    borderAnimated: true,
  },
};

export function getThemeForRank(rank: Rank): RankTheme {
  return RANK_THEMES[rank];
}
