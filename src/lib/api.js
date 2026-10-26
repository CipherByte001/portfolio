/**
 * api.js — Fetches all portfolio content from the Payload CMS REST API.
 *
 * The CMS base URL comes from the VITE_CMS_URL env variable:
 *   - In dev:        set in my-portfolio/.env.local  →  http://localhost:3001
 *   - In production: set in Vercel dashboard          →  https://your-cms.up.railway.app
 *
 * Every function has a static fallback (the original JS data files) so the site
 * NEVER breaks even if the CMS is unreachable or not yet deployed.
 */

import { projects as STATIC_PROJECTS } from '../data/projects.js';
import { research as STATIC_RESEARCH } from '../data/research.js';
import { achievements as STATIC_ACHIEVEMENTS } from '../data/achievements.js';

const CMS_URL = import.meta.env.VITE_CMS_URL || '';

// ─── Generic fetch helper ─────────────────────────────────────────────────────
async function cmsGet(path) {
  if (!CMS_URL) return null; // No CMS configured → use static fallback
  try {
    const res = await fetch(`${CMS_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`CMS ${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[CMS] Fetch failed, using static fallback:', err.message);
    return null;
  }
}

// ─── Helper: build full media URL from a Payload media object ────────────────
export function mediaUrl(mediaObj) {
  if (!mediaObj) return null;
  if (typeof mediaObj === 'string') return mediaObj;
  // Payload returns { url: '/media/file.jpg', ... }
  const url = mediaObj?.url || mediaObj?.sizes?.card?.url || '';
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${CMS_URL}${url}`;
}

// ─── Projects ────────────────────────────────────────────────────────────────
export async function fetchProjects() {
  const data = await cmsGet('/projects?limit=100&sort=order');

  // If no CMS data at all, return the original projects
  if (!data?.docs) return STATIC_PROJECTS;

  // Filter out drafts if _status is defined
  const publishedDocs = data.docs.filter((p) => !p._status || p._status === 'published');

  const cmsItems = publishedDocs.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    desc: p.desc,
    tags: (p.tags || []).map((t) => t.tag),
    components: (p.components || []).map((c) => c.component),
    link: p.link || '',
    media: buildMedia(p),
  }));

  // Merge: CMS projects appear first, plus original projects that aren't overwritten
  const cmsIds = new Set(cmsItems.map((p) => p.id));
  const remainingStatic = STATIC_PROJECTS.filter((p) => !cmsIds.has(p.id));

  return [...cmsItems, ...remainingStatic];
}

function buildMedia(p) {
  if (p.mediaType === 'youtube') {
    return {
      type: 'youtube',
      id: p.youtubeId || '',
      thumb: mediaUrl(p.thumbnail),
    };
  }
  if (p.mediaType === 'video') {
    return {
      type: 'video',
      src: mediaUrl(p.uploadedMedia),
      thumb: mediaUrl(p.thumbnail),
    };
  }
  // image
  return {
    type: 'image',
    src: mediaUrl(p.uploadedMedia) || mediaUrl(p.thumbnail),
  };
}

// ─── Research ────────────────────────────────────────────────────────────────
export async function fetchResearch() {
  const data = await cmsGet('/research?limit=100&sort=order');
  if (!data?.docs) return STATIC_RESEARCH;

  // Filter out drafts
  const publishedDocs = data.docs.filter((r) => !r._status || r._status === 'published');

  const cmsItems = publishedDocs.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    desc: r.desc,
    status: r.status,
    tags: (r.tags || []).map((t) => t.tag),
    thumbnail: mediaUrl(r.thumbnail),
    link: r.link || '',
  }));

  const cmsIds = new Set(cmsItems.map((r) => r.id));
  const remainingStatic = STATIC_RESEARCH.filter((r) => !cmsIds.has(r.id));

  return [...cmsItems, ...remainingStatic];
}

// ─── Skills ──────────────────────────────────────────────────────────────────
export async function fetchSkills() {
  const data = await cmsGet('/skills?limit=200&sort=order');
  if (!data?.docs?.length) return null;

  return data.docs.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    icon: s.iconUrl || mediaUrl(s.customIcon) || '',
  }));
}

// ─── Achievements ─────────────────────────────────────────────────────────────
export async function fetchAchievements() {
  const data = await cmsGet('/achievements?limit=100&sort=order');
  if (!data?.docs?.length) return STATIC_ACHIEVEMENTS;

  return data.docs.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    thumbnail: mediaUrl(a.thumbnail),
    images: (a.images || []).map((img) => mediaUrl(img.image)).filter(Boolean),
  }));
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export async function fetchRecommendations() {
  const data = await cmsGet('/recommendations?limit=100&sort=order');
  if (!data?.docs?.length) return [];

  return data.docs.map((r) => ({
    id: r.id,
    quote: r.quote,
    name: r.name,
    role: r.role,
    avatar: mediaUrl(r.avatar),
  }));
}

// ─── About (Global) ──────────────────────────────────────────────────────────
export async function fetchAbout() {
  const data = await cmsGet('/globals/about');
  if (!data) return null;

  return {
    photo: mediaUrl(data.photo),
    bio: (data.bio || []).map((b) => b.paragraph),
    researchInterests: (data.researchInterests || []).map((r) => r.interest),
    coreFocus: data.coreFocus,
    currentlyExploring: data.currentlyExploring,
  };
}

// ─── Resume / CV (Global) ────────────────────────────────────────────────────
export async function fetchResume() {
  const data = await cmsGet('/globals/resume');
  if (!data || !data.pdf) return null;

  return {
    url: mediaUrl(data.pdf),
    note: data.lastUpdatedNote || '',
  };
}

// ─── Send Message (Contact Form -> CMS Inbox) ────────────────────────────────
export async function sendMessageToCMS({ name, email, message }) {
  if (!CMS_URL) return false;
  try {
    const res = await fetch(`${CMS_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[CMS] Failed to save message in CMS inbox:', err);
    return false;
  }
}
