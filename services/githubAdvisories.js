const GH_BASE = 'https://api.github.com';

/**
 * @typedef {Object} AdvisoryPackage
 * @property {string} name
 * @property {string} ecosystem     OSV-form ecosystem string (e.g. "PyPI", "npm")
 * @property {string|null} patchedVersion
 * @property {string|null} vulnerableRange
 */

/**
 * @typedef {Object} Advisory
 * @property {string} ghsaId
 * @property {string|null} cveId
 * @property {string} summary
 * @property {'critical'|'high'|'medium'|'low'|'unknown'} severity
 * @property {string} publishedAt
 * @property {number|null} cvssScore
 * @property {AdvisoryPackage[]} packages
 */

const GH_TO_OSV = {
  npm:       'npm',
  pip:       'PyPI',
  maven:     'Maven',
  rubygems:  'RubyGems',
  rust:      'crates.io',
  nuget:     'NuGet',
  composer:  'Packagist',
  go:        'Go',
};

/**
 * Map GitHub ecosystem string to OSV ecosystem string. Returns null for
 * ecosystems OSV doesn't cover the same way (actions, pub, swift, erlang, other).
 * @param {string} eco
 * @returns {string|null}
 */
export function ghEcosystemToOsv(eco) {
  return GH_TO_OSV[eco] ?? null;
}

const CACHE = new Map();
const ETAGS = new Map();
const TTL_MS = 10 * 60 * 1000;

/**
 * Fetch recent global security advisories from GitHub. Public, unauthenticated.
 * Sends `If-None-Match` when an ETag is known; on 304 returns cached value.
 * @param {{ severity?: 'critical'|'high'|'medium'|'low', perPage?: number, force?: boolean }} [opts]
 * @returns {Promise<Advisory[]>} empty array on first-time failure, last value on later failures
 */
export async function fetchRecentAdvisories({ severity = 'critical', perPage = 10, force = false } = {}) {
  const key = `${severity}|${perPage}`;
  const cached = CACHE.get(key);
  if (!force && cached && Date.now() - cached.ts < TTL_MS) return cached.value;

  const url = `${GH_BASE}/advisories?type=reviewed&sort=published&direction=desc&severity=${severity}&per_page=${perPage}`;
  const headers = { Accept: 'application/vnd.github+json' };
  const etag = ETAGS.get(key);
  if (etag && cached) headers['If-None-Match'] = etag;

  try {
    const res = await fetch(url, { headers });
    if (res.status === 304 && cached) {
      cached.ts = Date.now();
      return cached.value;
    }
    if (!res.ok) return cached?.value ?? [];
    const newEtag = res.headers.get('etag');
    if (newEtag) ETAGS.set(key, newEtag);
    const raw = await res.json();
    const advisories = raw
      .map(normalizeAdvisory)
      .filter(a => a.packages.length > 0);
    CACHE.set(key, { ts: Date.now(), value: advisories });
    return advisories;
  } catch {
    return cached?.value ?? [];
  }
}

/**
 * Poll the advisories endpoint at a fixed interval, calling onUpdate with each
 * fresh result. Uses ETag conditional requests; bypasses the in-memory TTL.
 * @param {{ severity?: string, perPage?: number }} opts
 * @param {(advisories: Advisory[]) => void} onUpdate
 * @param {number} [intervalMs] default 90_000 (stays under the 60/hr unauthenticated GitHub limit)
 * @returns {() => void} cleanup that stops the loop
 */
export function pollRecentAdvisories(opts, onUpdate, intervalMs = 90_000) {
  let stopped = false;
  let timer = null;

  async function tick() {
    if (stopped) return;
    const data = await fetchRecentAdvisories({ ...opts, force: true });
    if (stopped) return;
    onUpdate(data);
    timer = setTimeout(tick, intervalMs);
  }

  tick();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

/**
 * @param {Object} raw GitHub Advisory API entry
 * @returns {Advisory}
 */
function normalizeAdvisory(raw) {
  const packages = (raw.vulnerabilities ?? [])
    .map(v => {
      const osvEco = ghEcosystemToOsv(v.package?.ecosystem);
      if (!osvEco || !v.package?.name) return null;
      return {
        name: v.package.name,
        ecosystem: osvEco,
        patchedVersion: v.first_patched_version ?? null,
        vulnerableRange: v.vulnerable_version_range ?? null,
      };
    })
    .filter(Boolean);

  return {
    ghsaId: raw.ghsa_id,
    cveId: raw.cve_id ?? null,
    summary: raw.summary ?? '',
    severity: raw.severity ?? 'unknown',
    publishedAt: raw.published_at ?? '',
    cvssScore: raw.cvss?.score ?? null,
    packages,
  };
}
