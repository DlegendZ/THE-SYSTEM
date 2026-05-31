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

// Solo Leveling "System" palette: deep navy-black backgrounds with glowing
// blue/cyan accents that intensify with rank, shifting toward violet-white at
// the top. Shared cool-white text keeps every screen on-brand.
export const RANK_THEMES: Record<Rank, RankTheme> = {
  E: {
    background: '#070b12', primary: '#0d1726', accent: '#4aa3e0',
    text: '#cfe4ff', textSecondary: '#6d87a8', borderStyle: 'system_panel',
    auraColor: '#4aa3e0', particleType: 'motes', particleCount: 12,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#4aa3e018',
  },
  D: {
    background: '#060a12', primary: '#0d1828', accent: '#2f93ff',
    text: '#d2e6ff', textSecondary: '#6f8ab0', borderStyle: 'system_panel',
    auraColor: '#2f93ff', particleType: 'motes', particleCount: 16,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#2f93ff22',
  },
  C: {
    background: '#050912', primary: '#0c1a2c', accent: '#18b4ff',
    text: '#d6ecff', textSecondary: '#6f93b8', borderStyle: 'system_panel',
    auraColor: '#18b4ff', particleType: 'sparks', particleCount: 20,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#18b4ff2a',
  },
  B: {
    background: '#04080f', primary: '#0a1828', accent: '#1fd4ff',
    text: '#ddf4ff', textSecondary: '#72a0c4', borderStyle: 'system_panel',
    auraColor: '#1fd4ff', particleType: 'sparks', particleCount: 26,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#1fd4ff33',
  },
  A: {
    background: '#060611', primary: '#0c1226', accent: '#8f9bff',
    text: '#e6ddff', textSecondary: '#8b8fc4', borderStyle: 'arcane_panel',
    auraColor: '#8f9bff', particleType: 'pillars', particleCount: 32,
    avatarFloat: false, screenGlow: true, screenGlowColor: '#8f9bff33',
  },
  S: {
    background: '#02040a', primary: '#060e1c', accent: '#aef2ff',
    text: '#ffffff', textSecondary: '#bfe6ff', borderStyle: 'monarch_panel',
    auraColor: '#aef2ff', particleType: 'god_rays', particleCount: 44,
    avatarFloat: true, screenGlow: true, screenGlowColor: '#aef2ff2a',
    borderAnimated: true,
  },
};

export function getThemeForRank(rank: Rank): RankTheme {
  return RANK_THEMES[rank];
}
