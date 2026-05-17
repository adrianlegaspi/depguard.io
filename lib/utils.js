import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names safely.
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a download count into a human-readable string.
 * @param {number} n
 * @returns {string}
 */
export function fmtDownloads(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Format an ISO date string to a short human-readable date.
 * @param {string|undefined} iso
 * @returns {string}
 */
export function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Generate a short random scan ID.
 * @returns {string}
 */
export function genScanId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Severity level to color token mapping.
 * @param {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|string} severity
 * @returns {string} Tailwind color class prefix key
 */
export function severityColor(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'critical';
    case 'HIGH':     return 'high';
    case 'MEDIUM':   return 'medium';
    case 'LOW':      return 'low';
    default:         return 'muted';
  }
}

const SEV_GLYPH_MAP = {
  CRITICAL: '■',
  HIGH:     '▲',
  MEDIUM:   '◆',
  LOW:      '●',
  NONE:     '○',
};

/**
 * Severity-redundant glyph mark (so color is never the only signal).
 * Accepts upper or lowercase severity strings.
 * @param {string|null|undefined} severity
 * @returns {string}
 */
export function severityGlyph(severity) {
  if (!severity) return SEV_GLYPH_MAP.NONE;
  return SEV_GLYPH_MAP[severity.toUpperCase()] ?? SEV_GLYPH_MAP.NONE;
}

/**
 * Convert a deps.dev OpenSSF Scorecard overallScore (0–10) to a letter grade.
 * @param {number|null|undefined} score10
 * @returns {'A+'|'A'|'B'|'C'|'D'|'F'|'—'}
 */
export function scorecardGrade(score10) {
  if (score10 == null) return '—';
  if (score10 >= 9)  return 'A+';
  if (score10 >= 8)  return 'A';
  if (score10 >= 7)  return 'B';
  if (score10 >= 6)  return 'C';
  if (score10 >= 5)  return 'D';
  return 'F';
}

/**
 * Format a scorecard grade to a Tailwind color token key.
 * @param {'A+'|'A'|'B'|'C'|'D'|'F'|'—'} grade
 * @returns {string}
 */
export function scorecardGradeColor(grade) {
  if (grade === 'A+' || grade === 'A') return 'success';
  if (grade === 'B')                   return 'low';
  if (grade === 'C' || grade === 'D')  return 'high';
  if (grade === 'F')                   return 'critical';
  return 'muted';
}

/**
 * Format an ISO date as a human-readable relative time string.
 * e.g. "18 months ago", "3 years ago", "2 days ago".
 * Falls back to fmtDate on very recent dates.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function fmtRelativeTime(iso) {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 1)   return 'today';
    if (days < 7)   return `${days}d ago`;
    if (days < 30)  return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    const yrs = Math.floor(days / 365);
    return `${yrs}yr${yrs > 1 ? 's' : ''} ago`;
  } catch {
    return iso;
  }
}
