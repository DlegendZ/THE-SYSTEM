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

export const RANK_THEMES: Record<Rank, RankTheme> = {
  E: {
    background: '#1a1a1a', primary: '#2a2a2a', accent: '#666666',
    text: '#aaaaaa', textSecondary: '#777777', borderStyle: 'cracked_stone',
    auraColor: null, particleType: 'dust', particleCount: 8,
    avatarFloat: false, screenGlow: false,
  },
  D: {
    background: '#1a0f00', primary: '#1a0f00', accent: '#b87333',
    text: '#d4a96a', textSecondary: '#9a6a3a', borderStyle: 'worn_iron',
    auraColor: '#b87333', particleType: 'embers', particleCount: 12,
    avatarFloat: false, screenGlow: false,
  },
  C: {
    background: '#0d0900', primary: '#0d0900', accent: '#f0a500',
    text: '#f5c842', textSecondary: '#c49020', borderStyle: 'engraved_gold',
    auraColor: '#f0a500', particleType: 'gold_sparks', particleCount: 16,
    avatarFloat: false, screenGlow: false,
  },
  B: {
    background: '#080600', primary: '#080600', accent: '#ffd700',
    text: '#fff4b0', textSecondary: '#ccaa00', borderStyle: 'gilded_ornate',
    auraColor: '#ffd700', particleType: 'gold_streaks', particleCount: 24,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#ffd70030',
  },
  A: {
    background: '#050406', primary: '#050406', accent: '#ffe566',
    text: '#ffffff', textSecondary: '#ccb84d', borderStyle: 'celestial_rune',
    auraColor: '#ffe566', particleType: 'light_pillars', particleCount: 32,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#ffe56640',
  },
  S: {
    background: '#000000', primary: '#000000', accent: '#ffffff',
    text: '#ffffff', textSecondary: '#cccccc', borderStyle: 'divine_mandala',
    auraColor: '#ffffff', particleType: 'god_rays', particleCount: 48,
    avatarFloat: true, screenGlow: true, screenGlowColor: '#ffffff20',
    borderAnimated: true,
  },
};

export function getThemeForRank(rank: Rank): RankTheme {
  return RANK_THEMES[rank];
}
