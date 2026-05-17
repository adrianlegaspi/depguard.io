/**
 * @typedef {Object} CvssBreakdown
 * @property {string} vector - Full CVSS vector string
 * @property {number|null} score - Numeric score (0–10)
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'NONE'} severity
 * @property {Record<string, string>} parts - Parsed key→value pairs
 */

const CVSS3_LABELS = {
  AV:  { label: 'Attack Vector',       N:'Network',    A:'Adjacent',     L:'Local',    P:'Physical' },
  AC:  { label: 'Attack Complexity',   L:'Low',        H:'High' },
  PR:  { label: 'Privileges Required', N:'None',       L:'Low',          H:'High' },
  UI:  { label: 'User Interaction',    N:'None',       R:'Required' },
  S:   { label: 'Scope',               U:'Unchanged',  C:'Changed' },
  C:   { label: 'Confidentiality',     N:'None',       L:'Low',          H:'High' },
  I:   { label: 'Integrity',           N:'None',       L:'Low',          H:'High' },
  A:   { label: 'Availability',        N:'None',       L:'Low',          H:'High' },
};

/**
 * Parse a CVSS v3.x vector string and derive score + breakdown.
 * @param {string|undefined} vector - e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
 * @param {number|undefined} rawScore - Pre-computed score from OSV (preferred)
 * @returns {CvssBreakdown}
 */
export function parseCvss(vector, rawScore) {
  if (!vector) {
    return { vector: '', score: rawScore ?? null, severity: scoreToSeverity(rawScore), parts: {} };
  }

  /** @type {Record<string, string>} */
  const parts = {};
  const segments = vector.split('/');

  for (const seg of segments) {
    const colon = seg.indexOf(':');
    if (colon === -1) continue;
    const key = seg.slice(0, colon);
    const val = seg.slice(colon + 1);
    if (key !== 'CVSS') parts[key] = val;
  }

  const score = rawScore ?? null;

  return {
    vector,
    score,
    severity: scoreToSeverity(score),
    parts,
  };
}

/**
 * Convert a numeric CVSS score to a severity label.
 * @param {number|null|undefined} score
 * @returns {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'NONE'}
 */
export function scoreToSeverity(score) {
  if (score == null) return 'NONE';
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score > 0)    return 'LOW';
  return 'NONE';
}

/**
 * Get human-readable label for a CVSS metric key+value pair.
 * @param {string} key
 * @param {string} val
 * @returns {{ metricLabel: string, valueLabel: string }}
 */
export function cvssMetricLabel(key, val) {
  const meta = CVSS3_LABELS[key];
  if (!meta) return { metricLabel: key, valueLabel: val };
  return {
    metricLabel: meta.label,
    valueLabel: meta[val] ?? val,
  };
}

/**
 * Ordered list of CVSS metric keys for display in the 8-cell grid.
 */
export const CVSS_METRIC_ORDER = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
