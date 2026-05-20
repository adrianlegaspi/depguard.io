/**
 * @typedef {Object} VulnRecommendations
 * @property {string} prevention
 * @property {string} considerations
 * @property {string} remediation
 * @property {string} generatedAt   ISO 8601
 * @property {boolean} cached
 */

const DEFAULT_ENDPOINT = '/api/recommendations';

function endpoint() {
  const url = process.env.EXPO_PUBLIC_RECOMMENDATIONS_API_URL;
  if (!url || url.length === 0) return DEFAULT_ENDPOINT;
  // Defensive: a localhost URL baked into the bundle is useless once deployed.
  // If we're running on the web and the page isn't on localhost, fall back to
  // the same-origin relative endpoint.
  if (typeof window !== 'undefined' && /^https?:\/\/localhost/i.test(url)) {
    const host = window.location?.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return DEFAULT_ENDPOINT;
    }
  }
  return url;
}

/**
 * Fetch AI-generated recommendations for a single vulnerability.
 *
 * @param {import('./osv').NormalizedVuln} vuln
 * @param {{ name: string, ecosystem: string }} packageInfo
 * @returns {Promise<VulnRecommendations>}
 */
export async function fetchRecommendations(vuln, packageInfo) {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: vuln.id,
      summary: vuln.summary,
      details: vuln.details,
      severity: vuln.cvss?.severity ?? 'UNKNOWN',
      cwes: vuln.cwes ?? [],
      package: {
        name: packageInfo?.name ?? 'unknown',
        ecosystem: packageInfo?.ecosystem ?? 'unknown',
      },
      fixedVersion: vuln.fixedVersion ?? null,
    }),
  });
  if (!res.ok) {
    let msg = `recommendations ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
