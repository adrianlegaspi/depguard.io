import useSWR from 'swr';
import { fetchRecommendations } from '../services/recommendations';

/**
 * SWR-backed AI recommendations fetcher. Cached by vuln id (server side cache
 * is also keyed by id, so client + server caches stay aligned).
 *
 * @param {import('../services/osv').NormalizedVuln|null|undefined} vuln
 * @param {{ name: string, ecosystem: string }|null|undefined} packageInfo
 */
export function useVulnRecommendations(vuln, packageInfo) {
  const key = vuln?.id ? ['vuln-rec', vuln.id] : null;
  return useSWR(
    key,
    () => fetchRecommendations(vuln, packageInfo),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
      shouldRetryOnError: false,
    }
  );
}
