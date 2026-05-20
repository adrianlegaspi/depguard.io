const FIRST_BASE = 'https://api.first.org/data/v1/epss';
const CHUNK_SIZE = 80;
const TIMEOUT_MS = 5000;

/**
 * @typedef {Object} EpssRow
 * @property {number} epss        raw daily exploit probability, 0–1
 * @property {number} percentile  rank vs all scored CVEs, 0–1
 * @property {string} date        "YYYY-MM-DD"
 */

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchChunk(cveIds) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  const url = `${FIRST_BASE}?cve=${cveIds.join(',')}&envelope=true`;

  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) return new Map();
    const json = await res.json();
    if (json?.status !== 'OK' || !Array.isArray(json?.data)) return new Map();

    const map = new Map();
    for (const row of json.data) {
      if (!row?.cve) continue;
      const epss = Number(row.epss);
      const percentile = Number(row.percentile);
      if (!Number.isFinite(epss) || !Number.isFinite(percentile)) continue;
      map.set(row.cve, {
        epss,
        percentile,
        date: row.date ?? null,
      });
    }
    return map;
  } catch {
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Batch-fetch EPSS scores from FIRST.org. Chunks of CHUNK_SIZE fire in parallel
 * via Promise.allSettled — any chunk failure yields an empty Map for that
 * chunk, so partial results survive. Never throws.
 *
 * @param {string[]} cveIds  CVE IDs (CVE-YYYY-NNNN). Duplicates ignored.
 * @returns {Promise<Map<string, EpssRow>>}
 */
export async function fetchEpssBatch(cveIds) {
  const unique = [...new Set((cveIds ?? []).filter(id => /^CVE-/i.test(id)))];
  if (unique.length === 0) return new Map();

  const chunks = chunk(unique, CHUNK_SIZE);
  const settled = await Promise.allSettled(chunks.map(c => fetchChunk(c)));

  const merged = new Map();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const [k, v] of r.value) merged.set(k, v);
  }
  return merged;
}

/**
 * Pull CVE-prefixed aliases off a normalized vuln.
 * @param {{ aliases?: string[] }} vuln
 * @returns {string[]}
 */
export function extractCveAliases(vuln) {
  return (vuln?.aliases ?? []).filter(a => /^CVE-/i.test(a));
}

/**
 * Pick the worst-case EPSS row from a vuln's CVE aliases.
 * Highest `epss` probability wins; tiebreak by earliest CVE ID lexicographically.
 *
 * @param {string[]} cveIds
 * @param {Map<string, EpssRow>} epssMap
 * @returns {(EpssRow & { cve: string }) | null}
 */
export function pickBestCveEpss(cveIds, epssMap) {
  let best = null;
  for (const cve of cveIds) {
    const row = epssMap.get(cve);
    if (!row) continue;
    if (
      best == null ||
      row.epss > best.epss ||
      (row.epss === best.epss && cve < best.cve)
    ) {
      best = { ...row, cve };
    }
  }
  return best;
}
