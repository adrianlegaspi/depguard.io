/**
 * @typedef {Object} ParsedPackage
 * @property {string} name
 * @property {string} version
 * @property {string} ecosystem
 */

/**
 * Detect the lockfile type from its content.
 * @param {string} text
 * @returns {'npm'|'yarn'|'pnpm'|'pip'|'pipenv'|'poetry'|'cargo'|'go'|'unknown'}
 */
export function detectLockfileType(text) {
  if (text.includes('"lockfileVersion"') || text.includes('"node_modules"')) return 'npm';
  if (text.includes('# yarn lockfile')) return 'yarn';
  if (text.includes('lockfileVersion:')) return 'pnpm';
  if (text.includes('[package]') && text.includes('checksum')) return 'cargo';
  if (text.includes('go.sum') || /^[a-zA-Z0-9./]+\s+v\d+\.\d+\.\d+/m.test(text)) return 'go';
  if (text.includes('[[package]]') && text.includes('python')) return 'poetry';
  if (text.includes('Pipfile.lock') || (text.includes('"default"') && text.includes('"develop"'))) return 'pipenv';
  if (/^[a-zA-Z0-9_-]+==/m.test(text)) return 'pip';
  try {
    const j = JSON.parse(text);
    if (j && typeof j === 'object' && j.name && (j.dependencies || j.devDependencies) && !j.lockfileVersion && !j.packages) {
      return 'package_json';
    }
  } catch {}
  return 'unknown';
}

/**
 * Map a lockfile type to an OSV ecosystem string.
 * @param {string} lockfileType
 * @returns {string}
 */
export function lockfileTypeToEcosystem(lockfileType) {
  const map = {
    npm:     'npm',
    yarn:    'npm',
    pnpm:    'npm',
    pip:     'PyPI',
    pipenv:  'PyPI',
    poetry:  'PyPI',
    cargo:   'crates.io',
    go:      'Go',
  };
  return map[lockfileType] ?? 'npm';
}

/**
 * Parse a package-lock.json (npm) text.
 * @param {string} text
 * @returns {ParsedPackage[]}
 */
function parseNpmLock(text) {
  try {
    const json = JSON.parse(text);
    const pkgs = [];
    const deps = json.packages ?? json.dependencies ?? {};
    for (const [key, val] of Object.entries(deps)) {
      if (!val.version) continue;
      const name = key.replace(/^node_modules\//, '');
      if (!name || name.startsWith('node_modules/')) continue;
      pkgs.push({ name, version: val.version, ecosystem: 'npm' });
    }
    return pkgs;
  } catch {
    return [];
  }
}

/**
 * Parse a yarn.lock text.
 * @param {string} text
 * @returns {ParsedPackage[]}
 */
function parseYarnLock(text) {
  const pkgs = [];
  const blocks = text.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (!lines[0] || lines[0].startsWith('#')) continue;
    const headerMatch = lines[0].match(/^"?([^@"]+)@/);
    if (!headerMatch) continue;
    const name = headerMatch[1].trim();
    const versionLine = lines.find(l => l.trim().startsWith('version'));
    if (!versionLine) continue;
    const version = versionLine.match(/"([^"]+)"/)?.[1];
    if (name && version) pkgs.push({ name, version, ecosystem: 'npm' });
  }
  return pkgs;
}

/**
 * Parse a pnpm-lock.yaml text (simplified — extracts name@version).
 * @param {string} text
 * @returns {ParsedPackage[]}
 */
function parsePnpmLock(text) {
  const pkgs = [];
  const depSection = /^packages:\s*\n([\s\S]*?)(?=\n\S|$)/m.exec(text);
  const body = depSection ? depSection[1] : text;
  const re = /^\s+'?(@?[^@'\s]+)@([^:\s']+)/gm;
  let m;
  while ((m = re.exec(body)) !== null) {
    pkgs.push({ name: m[1], version: m[2], ecosystem: 'npm' });
  }
  return pkgs;
}

/**
 * Parse a pip requirements/freeze text (name==version lines).
 * @param {string} text
 * @returns {ParsedPackage[]}
 */
function parsePipFreeze(text) {
  const pkgs = [];
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^([A-Za-z0-9_.-]+)==([^\s]+)/);
    if (m) pkgs.push({ name: m[1], version: m[2], ecosystem: 'PyPI' });
  }
  return pkgs;
}

/**
 * Parse pasted lockfile text into a list of packages.
 * @param {string} text - Raw lockfile or freeze content
 * @returns {{ packages: ParsedPackage[], ecosystem: string, type: string, error: string|null }}
 */
export function parseLockfile(text) {
  const type = detectLockfileType(text);

  if (type === 'package_json') {
    return { packages: [], ecosystem: 'npm', type, error: 'package_json' };
  }

  const ecosystem = lockfileTypeToEcosystem(type);
  let packages = [];

  switch (type) {
    case 'npm':    packages = parseNpmLock(text); break;
    case 'yarn':   packages = parseYarnLock(text); break;
    case 'pnpm':   packages = parsePnpmLock(text); break;
    case 'pip':    packages = parsePipFreeze(text); break;
    case 'pipenv':
    case 'poetry': packages = parsePipFreeze(text); break;
    default:
      // Best-effort: try npm JSON, then pip lines
      packages = parseNpmLock(text).length ? parseNpmLock(text) : parsePipFreeze(text);
  }

  return { packages, ecosystem, type, error: null };
}
