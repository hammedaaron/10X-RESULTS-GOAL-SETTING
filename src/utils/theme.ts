import { ThemeMode, FontChoice } from '../types';

export interface ThemeStyles {
  bgApp: string;
  bgSurface: string;
  bgSubtle: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentBg: string;
  editorBg: string;
  statusBg: string;
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeStyles> = {
  dark_charcoal: {
    bgApp: 'bg-[#1f1f1f]',
    bgSurface: 'bg-[#282828]',
    bgSubtle: 'bg-[#202020]',
    bgHover: 'hover:bg-[#323232]',
    textPrimary: 'text-[#f3f4f6]',
    textSecondary: 'text-[#d1d5db]',
    textMuted: 'text-[#9ca3af]',
    border: 'border-[#383838]',
    borderSubtle: 'border-[#2d2d2d]',
    accent: 'text-[#60a5fa]',
    accentBg: 'bg-[#2563eb]',
    editorBg: 'bg-[#1f1f1f]',
    statusBg: 'bg-[#252526]',
  },
  light_notepad: {
    bgApp: 'bg-[#ffffff]',
    bgSurface: 'bg-[#f8f9fa]',
    bgSubtle: 'bg-[#f1f3f5]',
    bgHover: 'hover:bg-[#e9ecef]',
    textPrimary: 'text-[#1e293b]',
    textSecondary: 'text-[#475569]',
    textMuted: 'text-[#64748b]',
    border: 'border-[#e2e8f0]',
    borderSubtle: 'border-[#edf2f7]',
    accent: 'text-[#0284c7]',
    accentBg: 'bg-[#0284c7]',
    editorBg: 'bg-[#ffffff]',
    statusBg: 'bg-[#f8f9fa]',
  },
  warm_sepia: {
    bgApp: 'bg-[#fbf7f0]',
    bgSurface: 'bg-[#f2ece1]',
    bgSubtle: 'bg-[#ece3d4]',
    bgHover: 'hover:bg-[#e2d6c3]',
    textPrimary: 'text-[#292524]',
    textSecondary: 'text-[#57534e]',
    textMuted: 'text-[#78716c]',
    border: 'border-[#ded4c5]',
    borderSubtle: 'border-[#e8dfd2]',
    accent: 'text-[#c2410c]',
    accentBg: 'bg-[#c2410c]',
    editorBg: 'bg-[#fbf7f0]',
    statusBg: 'bg-[#f2ece1]',
  },
  oled_black: {
    bgApp: 'bg-[#000000]',
    bgSurface: 'bg-[#121212]',
    bgSubtle: 'bg-[#0a0a0a]',
    bgHover: 'hover:bg-[#1f1f1f]',
    textPrimary: 'text-[#fafafa]',
    textSecondary: 'text-[#d4d4d4]',
    textMuted: 'text-[#a3a3a3]',
    border: 'border-[#262626]',
    borderSubtle: 'border-[#1a1a1a]',
    accent: 'text-[#38bdf8]',
    accentBg: 'bg-[#0284c7]',
    editorBg: 'bg-[#000000]',
    statusBg: 'bg-[#121212]',
  },
};

export function getFontClass(font: FontChoice): string {
  switch (font) {
    case 'mono':
      return 'font-mono';
    case 'serif':
      return 'font-serif';
    case 'sans':
    default:
      return 'font-sans';
  }
}
