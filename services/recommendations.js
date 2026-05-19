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
  return url && url.length > 0 ? url : DEFAULT_ENDPOINT;
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
