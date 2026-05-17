const DEPS_DEV_BASE = 'https://api.deps.dev/v3';

/**
 * @typedef {Object} ScorecardCheck
 * @property {string} name
 * @property {number} score   0–10
 * @property {string} reason
 */

/**
 * @typedef {Object} PackageHealth
 * @property {string|null} license
 * @property {string|null} publishedAt
 * @property {string|null} repoUrl
 * @property {string|null} homepageUrl
 * @property {string|null} latestVersion
 * @property {boolean} isLatest
 * @property {{ score: number, checks: ScorecardCheck[] }|null} scorecard
 */

const ECO_MAP = {
  npm:        'NPM',
  PyPI:       'PYPI',
  Go:         'GO',
  Maven:      'MAVEN',
  'crates.io':'CARGO',
  NuGet:      'NUGET',
};

/**
 * Map OSV ecosystem string to deps.dev SYSTEM string.
 * Returns null for unsupported ecosystems (RubyGems, Packagist).
 * @param {string} eco
 * @returns {string|null}
 */
export function osvEcosystemToDepsDev(eco) {
  return ECO_MAP[eco] ?? null;
}

const CACHE = new Map();
const TTL_MS = 10 * 60 * 1000;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`deps.dev ${res.status}`);
  return res.json();
}

/**
 * Fetch package health data from deps.dev.
 * Chains: version-info → (optional) scorecard lookup via project key.
 * Returns null for unsupported ecosystems or total fetch failure.
 * Partial data (no scorecard) is returned if only the project lookup fails.
 *
 * @param {string} name
 * @param {string} version  pass '' or omit to use the default/latest version
 * @param {string} osvEcosystem
 * @returns {Promise<PackageHealth|null>}
 */
export async function fetchPackageHealth(name, version, osvEcosystem) {
  const system = osvEcosystemToDepsDev(osvEcosystem);
  if (!system) return null;

  const cacheKey = `${system}|${name}|${version || '__default__'}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;

  try {
    const enc = encodeURIComponent(name);

    // Fetch package listing (for latest version) and, if version provided, version info in parallel
    const [packageData, explicitVersionData] = await Promise.all([
      fetchJson(`${DEPS_DEV_BASE}/systems/${system}/packages/${enc}`),
      version
        ? fetchJson(`${DEPS_DEV_BASE}/systems/${system}/packages/${enc}/versions/${encodeURIComponent(version)}`).catch(() => null)
        : Promise.resolve(null),
    ]);

    const versions = packageData?.versions ?? [];
    const defaultEntry = versions.find(v => v.isDefault) ?? versions[0] ?? null;
    const latestVersion = defaultEntry?.versionKey?.version ?? null;

    // Resolve which version-info object to use
    let versionData = explicitVersionData;
    if (!versionData && defaultEntry) {
      versionData = await fetchJson(
        `${DEPS_DEV_BASE}/systems/${system}/packages/${enc}/versions/${encodeURIComponent(defaultEntry.versionKey.version)}`
      ).catch(() => null);
    }

    const publishedAt = versionData?.publishedAt ?? null;
    const licenses    = versionData?.licenses ?? [];
    const license     = licenses[0] ?? null;

    const links = versionData?.links ?? [];
    const rawRepoUrl = links.find(l => l.label === 'SOURCE_REPO')?.url
      ?? links.find(l => l.label === 'ORIGIN' && l.url?.includes('github.com'))?.url
      ?? null;
    const repoUrl = rawRepoUrl
      ? rawRepoUrl.replace(/^git\+/, '').replace(/\.git$/, '')
      : null;
    const homepageUrl = links.find(l => l.label === 'HOMEPAGE')?.url ?? null;

    const isLatest = !version || !latestVersion || version === latestVersion;

    // Scorecard via first related project
    const projectId = (versionData?.relatedProjects ?? [])[0]?.projectKey?.id ?? null;
    let scorecard = null;
    if (projectId) {
      try {
        const proj = await fetchJson(`${DEPS_DEV_BASE}/projects/${encodeURIComponent(projectId)}`);
        if (proj?.scorecard?.overallScore != null) {
          scorecard = {
            score: proj.scorecard.overallScore,
            checks: (proj.scorecard.checks ?? []).map(c => ({
              name:   c.name,
              score:  c.score ?? -1,
              reason: c.reason ?? '',
            })),
          };
        }
      } catch {
        // Scorecard unavailable — return partial data
      }
    }

    const result = { license, publishedAt, repoUrl, homepageUrl, latestVersion, isLatest, scorecard };
    CACHE.set(cacheKey, { ts: Date.now(), value: result });
    return result;
  } catch {
    return null;
  }
}

/**
 * Liveness check for deps.dev. Aborts after 3 s.
 * @returns {Promise<boolean>}
 */
export async function checkDepsDevHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${DEPS_DEV_BASE}/systems/NPM/packages/lodash`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
