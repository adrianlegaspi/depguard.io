import useSWR from 'swr';
import { scanPackage, scanPackages } from '../services/osv';

function mergeBatch(results, fallbackEcosystem) {
  return results.reduce(
    (acc, r) => {
      acc.vulns.push(...r.vulns.map(v => ({ ...v, _pkg: `${r.name}@${r.version}` })));
      acc.critical += r.critical;
      acc.high += r.high;
      acc.medium += r.medium;
      acc.low += r.low;
      acc.durationMs = Math.max(acc.durationMs, r.durationMs);
      return acc;
    },
    {
      name: `${results.length} packages`,
      version: '',
      ecosystem: results[0]?.ecosystem ?? fallbackEcosystem,
      vulns: [],
      critical: 0, high: 0, medium: 0, low: 0,
      durationMs: 0,
      scanId: results[0]?.scanId ?? '',
    }
  );
}

/**
 * SWR-backed package scan. Same cache key is shared between the list and the
 * detail page so navigating /results -> /results/[id] is instant when the
 * scan is already in cache, and falls back to a real OSV request when the
 * detail page is entered directly via URL.
 *
 * @param {{ name?: string, version?: string, ecosystem?: string, batchJson?: string }} params
 */
export function useScanPackage({ name, version, ecosystem, batchJson }) {
  const key = batchJson
    ? ['scan-batch', batchJson]
    : (name && ecosystem ? ['scan', ecosystem, name, version || ''] : null);

  return useSWR(key, async () => {
    if (batchJson) {
      const packages = JSON.parse(batchJson);
      const results = await scanPackages(packages);
      return mergeBatch(results, ecosystem);
    }
    return scanPackage(name, version || '', ecosystem);
  });
}
