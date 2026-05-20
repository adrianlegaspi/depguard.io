import { useMemo } from 'react';
import useSWR from 'swr';
import { scanPackage, scanPackages } from '../services/osv';
import { fetchEpssBatch, extractCveAliases, pickBestCveEpss } from '../services/epss';

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

function collectAllCves(vulns) {
  const set = new Set();
  for (const v of vulns) {
    for (const cve of extractCveAliases(v)) set.add(cve);
  }
  return [...set].sort();
}

/**
 * SWR-backed package scan with FIRST.org EPSS enrichment.
 *
 * Two cache layers:
 *   1. scan: ['scan', ecosystem, name, version] or ['scan-batch', batchJson]
 *   2. epss: ['epss', <sorted comma-joined CVE list>]  — shared across scans
 *
 * EPSS layer is independent: if FIRST.org times out, the scan still renders
 * with whatever OSV's embed gave us (or null).
 *
 * @param {{ name?: string, version?: string, ecosystem?: string, batchJson?: string }} params
 */
export function useScanPackage({ name, version, ecosystem, batchJson }) {
  const scanKey = batchJson
    ? ['scan-batch', batchJson]
    : (name && ecosystem ? ['scan', ecosystem, name, version || ''] : null);

  const scan = useSWR(scanKey, async () => {
    if (batchJson) {
      const packages = JSON.parse(batchJson);
      const results = await scanPackages(packages);
      return mergeBatch(results, ecosystem);
    }
    return scanPackage(name, version || '', ecosystem);
  });

  const cveList = scan.data ? collectAllCves(scan.data.vulns) : [];
  const epssKey = cveList.length > 0 ? ['epss', cveList.join(',')] : null;

  const epss = useSWR(
    epssKey,
    async ([, joined]) => fetchEpssBatch(joined.split(',')),
    {
      dedupingInterval: 43_200_000,
      revalidateOnFocus: false,
    }
  );

  const merged = useMemo(() => {
    if (!scan.data) return scan.data;
    if (!epss.data || epss.data.size === 0) return scan.data;
    return {
      ...scan.data,
      vulns: scan.data.vulns.map(v => {
        const cves = extractCveAliases(v);
        const best = pickBestCveEpss(cves, epss.data);
        if (!best) return v;
        return {
          ...v,
          epss: {
            percentile: best.percentile,
            probability: best.epss,
            date: best.date,
            source: 'first.org',
          },
        };
      }),
    };
  }, [scan.data, epss.data]);

  return {
    ...scan,
    data: merged,
    epssEnriching: epss.isLoading,
  };
}
