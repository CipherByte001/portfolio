/**
 * fetch-cms.mjs — Build-time CMS snapshot.
 *
 * Runs automatically before every `npm run build` (see "prebuild" in package.json).
 *
 * What it does:
 *   1. Pulls every CMS endpoint the site uses into src/data/cms-snapshot.json
 *   2. Mirrors all CMS media (images, CV PDF) into public/cms-media/
 *   3. Rewrites media URLs so the built site serves them from its OWN host
 *
 * Why: Render's free tier sleeps after ~15 min idle and takes 30-60s to wake.
 * Without this, a first-time visitor hitting a cold CMS sees empty sections and
 * a CV download that hangs. With this, every byte needed for first paint is
 * already in the build — the CMS is only consulted to pick up edits made since.
 *
 * This never fails the build. If the CMS is unreachable, the previous snapshot
 * is kept as-is so you always ship the last known-good content.
 */

import { writeFile, readFile, mkdir, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'src', 'data', 'cms-snapshot.json');
const MEDIA_DIR = path.join(ROOT, 'public', 'cms-media');

const CMS_URL = (process.env.VITE_CMS_URL || 'https://portfolio-cms-rpmi.onrender.com').replace(/\/$/, '');

// Every path the running site asks for — keep in sync with src/lib/api.js
const PATHS = [
  '/projects?limit=100&sort=order',
  '/research?limit=100&sort=order',
  '/skills?limit=200&sort=order',
  '/achievements?limit=100&sort=order',
  '/recommendations?limit=100&sort=order',
  '/globals/about',
  '/globals/resume',
];

// Generous backoff — a build can afford to wait out a cold start, a visitor can't.
const RETRY_DELAYS_MS = [0, 3000, 6000, 10000, 15000, 20000, 30000];
const REQUEST_TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPath(apiPath) {
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i]) await sleep(RETRY_DELAYS_MS[i]);
    try {
      const res = await fetchWithTimeout(`${CMS_URL}/api${apiPath}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const last = i === RETRY_DELAYS_MS.length - 1;
      console.log(`  ${last ? 'x' : '·'} ${apiPath} — ${err.message}${last ? '' : ' (retrying, CMS may be waking up)'}`);
      if (last) return null;
    }
  }
  return null;
}

// ─── Media mirroring ─────────────────────────────────────────────────────────

/** Walk any CMS payload and collect every absolute media URL it references. */
function collectMediaUrls(node, found = new Set()) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    node.forEach((n) => collectMediaUrls(n, found));
    return found;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'url' && typeof value === 'string' && value.includes('/media/')) {
      found.add(value.startsWith('http') ? value : `${CMS_URL}${value}`);
    } else if (value && typeof value === 'object') {
      collectMediaUrls(value, found);
    }
  }
  return found;
}

async function mirrorMedia(urls) {
  if (!urls.size) return new Set();
  await mkdir(MEDIA_DIR, { recursive: true });

  const existing = new Map();
  try {
    for (const name of await readdir(MEDIA_DIR)) {
      existing.set(name, (await stat(path.join(MEDIA_DIR, name))).size);
    }
  } catch {}

  const mirrored = new Set();
  for (const url of urls) {
    const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
    if (!filename) continue;
    try {
      // Skip the download when we already hold a non-empty copy of this file.
      if (existing.has(filename) && existing.get(filename) > 0) {
        mirrored.add(filename);
        continue;
      }
      const res = await fetchWithTimeout(url, 60000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length) throw new Error('empty file');
      await writeFile(path.join(MEDIA_DIR, filename), buf);
      mirrored.add(filename);
      console.log(`  + mirrored ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`  ! could not mirror ${filename} — ${err.message} (will load from CMS instead)`);
    }
  }
  return mirrored;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n[cms] Snapshotting ${CMS_URL} …`);

  const data = {};
  let ok = 0;
  for (const p of PATHS) {
    const result = await fetchPath(p);
    if (result) {
      data[p] = result;
      ok++;
      const count = result?.docs?.length;
      console.log(`  ✓ ${p}${count === undefined ? '' : ` (${count} doc${count === 1 ? '' : 's'})`}`);
    }
  }

  if (!ok) {
    console.log('[cms] CMS unreachable — keeping the existing snapshot, build continues.\n');
    return;
  }

  const mediaUrls = collectMediaUrls(data);
  const mirrored = await mirrorMedia(mediaUrls);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    cmsUrl: CMS_URL,
    // Filenames we hold locally — the client prefers these over the CMS host.
    mirroredMedia: [...mirrored],
    data,
  };

  await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });

  // Merge rather than clobber: endpoints that failed this run keep their old data.
  try {
    const prev = JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'));
    snapshot.data = { ...(prev.data || {}), ...snapshot.data };
    snapshot.mirroredMedia = [...new Set([...(prev.mirroredMedia || []), ...snapshot.mirroredMedia])];
  } catch {}

  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`[cms] Snapshot written — ${ok}/${PATHS.length} endpoints, ${snapshot.mirroredMedia.length} media files local.\n`);
}

main().catch((err) => {
  console.log(`[cms] Snapshot step failed (${err.message}) — build continues with existing snapshot.\n`);
});
