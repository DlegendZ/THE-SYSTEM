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
    background: '#141414', primary: '#242424', accent: '#909090',
    text: '#d0d0d0', textSecondary: '#999999', borderStyle: 'cracked_stone',
    auraColor: null, particleType: 'dust', particleCount: 8,
    avatarFloat: false, screenGlow: false,
  },
  D: {
    background: '#160c00', primary: '#1e1000', accent: '#d4874a',
    text: '#e8c080', textSecondary: '#b07848', borderStyle: 'worn_iron',
    auraColor: '#d4874a', particleType: 'embers', particleCount: 12,
    avatarFloat: false, screenGlow: false,
  },
  C: {
    background: '#0e0a00', primary: '#140e00', accent: '#ffb800',
    text: '#ffd95a', textSecondary: '#d4a028', borderStyle: 'engraved_gold',
    auraColor: '#ffb800', particleType: 'gold_sparks', particleCount: 16,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#ffb80018',
  },
  B: {
    background: '#0a0700', primary: '#0e0a00', accent: '#ffdd00',
    text: '#fff8c8', textSecondary: '#ddbb00', borderStyle: 'gilded_ornate',
    auraColor: '#ffdd00', particleType: 'gold_streaks', particleCount: 24,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#ffdd0035',
  },
  A: {
    background: '#060408', primary: '#0a0610', accent: '#e880ff',
    text: '#f0d0ff', textSecondary: '#b855d4', borderStyle: 'celestial_rune',
    auraColor: '#e880ff', particleType: 'light_pillars', particleCount: 32,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#e880ff35',
  },
  S: {
    background: '#000000', primary: '#050505', accent: '#ffffff',
    text: '#ffffff', textSecondary: '#dddddd', borderStyle: 'divine_mandala',
    auraColor: '#ffffff', particleType: 'god_rays', particleCount: 48,
    avatarFloat: true, screenGlow: true, screenGlowColor: '#ffffff28',
    borderAnimated: true,
  },
};

export function getThemeForRank(rank: Rank): RankTheme {
  return RANK_THEMES[rank];
}
