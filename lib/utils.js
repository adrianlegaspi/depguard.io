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
