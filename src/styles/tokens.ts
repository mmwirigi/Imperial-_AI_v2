/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Imperial AI Centralized Design Tokens
 * Light-theme first, enterprise SaaS design system.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Canvas & Surfaces
    background: 'bg-slate-50',
    surface: 'bg-white',
    surfaceSubtle: 'bg-slate-50/70',
    surfaceElevated: 'bg-white shadow-xs',
    surfaceHover: 'hover:bg-slate-50',

    // Borders
    border: 'border-slate-200',
    borderSubtle: 'border-slate-100',
    borderStrong: 'border-slate-300',
    borderFocus: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',

    // Typography
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    textInverse: 'text-white',

    // Brand Primary (Imperial AI Gold / Amber)
    primary: {
      base: 'bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400',
      light: 'bg-amber-50 text-amber-900 border border-amber-200',
      subtle: 'text-amber-600',
      ring: 'ring-amber-500/30'
    },

    // Semantic States
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    error: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    }
  },

  // Client Industry Accents
  industries: {
    Engineering: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      accent: 'text-amber-600',
      bar: 'bg-amber-500'
    },
    Security: {
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      accent: 'text-indigo-600',
      bar: 'bg-indigo-500'
    },
    Hospitality: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accent: 'text-emerald-600',
      bar: 'bg-emerald-500'
    },
    'Training / Resources': {
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
      accent: 'text-purple-600',
      bar: 'bg-purple-500'
    },
    'Foundation / Community': {
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      accent: 'text-rose-600',
      bar: 'bg-rose-500'
    },
    Default: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      accent: 'text-slate-600',
      bar: 'bg-slate-500'
    }
  }
};

/**
 * Returns the matching industry styling badge
 */
export function getIndustryBadge(industry: string = ''): { badge: string; accent: string; bar: string } {
  const normalized = industry.toLowerCase();
  if (normalized.includes('engineer') || normalized.includes('solar') || normalized.includes('machinery')) {
    return DESIGN_TOKENS.industries.Engineering;
  }
  if (normalized.includes('security') || normalized.includes('biometric')) {
    return DESIGN_TOKENS.industries.Security;
  }
  if (normalized.includes('hospitality') || normalized.includes('hotel') || normalized.includes('leisure')) {
    return DESIGN_TOKENS.industries.Hospitality;
  }
  if (normalized.includes('train') || normalized.includes('resource') || normalized.includes('advisory')) {
    return DESIGN_TOKENS.industries['Training / Resources'];
  }
  if (normalized.includes('foundation') || normalized.includes('community') || normalized.includes('non-profit')) {
    return DESIGN_TOKENS.industries['Foundation / Community'];
  }
  return DESIGN_TOKENS.industries.Default;
}
