import useSWR from 'swr';
import { fetchPackageHealth } from '../services/depsDev';

/**
 * SWR-backed hook for deps.dev package health data.
 * Deliberately separate from useScanPackage so a deps.dev failure
 * never affects the OSV scan result.
 *
 * @param {{ name?: string, version?: string, ecosystem?: string }} params
 */
export function usePackageHealth({ name, version, ecosystem }) {
  const key = name && ecosystem ? ['pkg-health', ecosystem, name, version || ''] : null;
  return useSWR(key, () => fetchPackageHealth(name, version || '', ecosystem));
}
