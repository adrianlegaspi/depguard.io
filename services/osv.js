import { parseCvss, scoreToSeverity } from '../lib/cvss';

const OSV_BASE = 'https://api.osv.dev/v1';

/**
 * @typedef {Object} OsvPackage
 * @property {string} name
 * @property {string} ecosystem
 */

/**
 * @typedef {Object} OsvQuery
 * @property {OsvPackage} package
 * @property {string} [version]
 */

/**
 * @typedef {Object} CvssInfo
 * @property {string|null} vector
 * @property {number|null} score
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'NONE'} severity
 */

/**
 * @typedef {Object} AffectedRange
 * @property {'SEMVER'|'GIT'|'ECOSYSTEM'} type
 * @property {string} [introduced]
 * @property {string} [fixed]
 * @property {string} [last_affected]
 */

/**
 * @typedef {Object} NormalizedVuln
 * @property {string} id
 * @property {string} summary
 * @property {string} details
 * @property {string[]} aliases
 * @property {string} published
 * @property {string} modified
 * @property {CvssInfo} cvss
 * @property {string[]} cwes
 * @property {AffectedRange[]} ranges
 * @property {string|null} fixedVersion
 * @property {{ type: string, url: string }[]} references
 * @property {EpssScore|null} epss
 */

/**
 * @typedef {Object} EpssScore
 * @property {number|null} percentile   0–1, rank vs all scored CVEs
 * @property {number|null} probability  0–1, raw daily exploit probability
 * @property {string|null} date         "YYYY-MM-DD" — when source computed score
 * @property {'first.org'|'osv'|null} source
 */

/**
 * @typedef {Object} ScanResult
 * @property {string} name
 * @property {string} version
 * @property {string} ecosystem
 * @property {NormalizedVuln[]} vulns
 * @property {number} critical
 * @property {number} high
 * @property {number} medium
 * @property {number} low
 * @property {number} durationMs
 * @property {string} scanId
 */

/**
 * Extract the best CVSS info from an OSV vulnerability object.
 * @param {Object} vuln
 * @returns {CvssInfo}
 */
function extractCvss(vuln) {
  const severities = vuln.severity ?? [];

  // Prefer CVSS_V3, fall back to CVSS_V2
  const cvss3 = severities.find(s => s.type === 'CVSS_V3');
  const cvss2 = severities.find(s => s.type === 'CVSS_V2');
  const entry = cvss3 ?? cvss2;

  if (!entry) return { vector: null, score: null, severity: 'NONE' };

  // OSV puts the score in database_specific sometimes
  const dbScore = vuln.database_specific?.cvss?.score ?? null;
  const parsed = parseCvss(entry.score, dbScore);

  return { vector: entry.score, score: parsed.score, severity: parsed.severity };
}

/**
 * Normalize a raw OSV vuln object into our NormalizedVuln shape.
 * @param {Object} raw
 * @returns {NormalizedVuln}
 */
function normalizeVuln(raw) {
  const cvss = extractCvss(raw);

  // Collect affected ranges across all affected entries
  /** @type {AffectedRange[]} */
  const ranges = [];
  let fixedVersion = null;

  for (const aff of raw.affected ?? []) {
    for (const range of aff.ranges ?? []) {
      for (const event of range.events ?? []) {
        if (event.fixed) fixedVersion = event.fixed;
        ranges.push({
          type: range.type,
          introduced: event.introduced,
          fixed: event.fixed,
          last_affected: event.last_affected,
        });
      }
    }
  }

  // CWE extraction
  const cwes = [];
  for (const aff of raw.affected ?? []) {
    for (const cwe of aff.database_specific?.cwes ?? []) {
      if (cwe.cweId && !cwes.includes(cwe.cweId)) cwes.push(cwe.cweId);
    }
  }

  return {
    id: raw.id,
    summary: raw.summary ?? '',
    details: raw.details ?? '',
    aliases: raw.aliases ?? [],
    published: raw.published ?? '',
    modified: raw.modified ?? '',
    cvss,
    cwes,
    ranges,
    fixedVersion,
    references: (raw.references ?? []).map(r => ({ type: r.type ?? 'WEB', url: r.url })),
    epss: normalizeOsvEpss(raw.database_specific?.epss),
  };
}

/**
 * Build an EpssScore from OSV's embedded `database_specific.epss` block.
 * OSV's embed includes `score` (raw probability) and `percentile` but no date.
 * Returns null when neither field is present — keeps null state explicit.
 * @param {{ score?: number|string, percentile?: number|string } | undefined} embed
 * @returns {import('./osv').EpssScore | null}
 */
function normalizeOsvEpss(embed) {
  if (!embed) return null;
  const probability = embed.score != null ? Number(embed.score) : null;
  const percentile = embed.percentile != null ? Number(embed.percentile) : null;
  if (probability == null && percentile == null) return null;
  if (probability != null && !Number.isFinite(probability)) return null;
  if (percentile != null && !Number.isFinite(percentile)) return null;
  return {
    percentile: percentile ?? null,
    probability: probability ?? null,
    date: null,
    source: 'osv',
  };
}

/**
 * Count vulns by severity bucket.
 * @param {NormalizedVuln[]} vulns
 */
function countBySeverity(vulns) {
  let critical = 0, high = 0, medium = 0, low = 0;
  for (const v of vulns) {
    switch (v.cvss.severity) {
      case 'CRITICAL': critical++; break;
      case 'HIGH':     high++;     break;
      case 'MEDIUM':   medium++;   break;
      case 'LOW':      low++;      break;
    }
  }
  return { critical, high, medium, low };
}

/**
 * POST /v1/query — returns full Vulnerability objects (unlike /querybatch which
 * only returns {id, modified} stubs and would require CORS-blocked /v1/vulns/{id}
 * follow-ups). This is the right endpoint for browser apps.
 * @param {string} name
 * @param {string} ecosystem
 * @param {string} [version]
 * @returns {Promise<Object[]>} raw vuln objects
 */
async function queryOne(name, ecosystem, version) {
  const body = version
    ? { package: { name, ecosystem }, version }
    : { package: { name, ecosystem } };

  const res = await fetch(`${OSV_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`OSV API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.vulns ?? [];
}

/**
 * Scan a single package for vulnerabilities via OSV.dev.
 * @param {string} name
 * @param {string} version
 * @param {string} ecosystem
 * @returns {Promise<ScanResult>}
 */
export async function scanPackage(name, version, ecosystem) {
  const t0 = Date.now();
  const scanId = Math.random().toString(36).slice(2, 10).toUpperCase();

  const rawVulns = await queryOne(name, ecosystem, version);
  const vulns = rawVulns.map(normalizeVuln);
  const counts = countBySeverity(vulns);

  return {
    name,
    version,
    ecosystem,
    vulns,
    ...counts,
    durationMs: Date.now() - t0,
    scanId,
  };
}

/**
 * Batch scan multiple packages — fan out to N parallel /v1/query calls
 * (each returns full data, unlike /querybatch).
 * @param {{ name: string, version: string, ecosystem: string }[]} packages
 * @returns {Promise<ScanResult[]>}
 */
export async function scanPackages(packages) {
  const t0 = Date.now();

  const results = await Promise.all(
    packages.map(async (pkg) => {
      try {
        const rawVulns = await queryOne(pkg.name, pkg.ecosystem, pkg.version);
        const vulns = rawVulns.map(normalizeVuln);
        const counts = countBySeverity(vulns);
        return {
          name: pkg.name,
          version: pkg.version,
          ecosystem: pkg.ecosystem,
          vulns,
          ...counts,
          durationMs: Date.now() - t0,
          scanId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        };
      } catch {
        return {
          name: pkg.name,
          version: pkg.version,
          ecosystem: pkg.ecosystem,
          vulns: [],
          critical: 0, high: 0, medium: 0, low: 0,
          durationMs: Date.now() - t0,
          scanId: Math.random().toString(36).slice(2, 10).toUpperCase(),
        };
      }
    })
  );

  return results;
}

/**
 * Check if the OSV API is reachable. Uses /v1/query (CORS-enabled) instead of
 * /v1/vulns/{id} (CORS-blocked from browsers). A non-existent package returns
 * an empty 200 quickly, which is exactly what we want for a liveness check.
 * @returns {Promise<boolean>}
 */
export async function checkOsvHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${OSV_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: { name: '__depguard_healthcheck__', ecosystem: 'npm' } }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
