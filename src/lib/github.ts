export interface GitHubRelease {
  id: number;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  isPrerelease: boolean;
}

const CACHE_KEY_LATEST = 'github_latest_release_cache';
const CACHE_KEY_ALL = 'github_all_releases_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

function getHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;

export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  if (!OWNER || !REPO) return null;

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY_LATEST);
    if (cachedStr) {
      const cached: CacheEntry<GitHubRelease> = JSON.parse(cachedStr);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const release: GitHubRelease = {
      id: data.id,
      tagName: data.tag_name,
      name: data.name,
      body: data.body,
      publishedAt: data.published_at,
      htmlUrl: data.html_url,
      isPrerelease: data.prerelease,
    };

    localStorage.setItem(
      CACHE_KEY_LATEST,
      JSON.stringify({ data: release, fetchedAt: Date.now() })
    );

    return release;
  } catch (error) {
    console.error('Error fetching latest release:', error);
    return null;
  }
}

export async function fetchAllReleases(): Promise<GitHubRelease[]> {
  if (!OWNER || !REPO) return [];

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY_ALL);
    if (cachedStr) {
      const cached: CacheEntry<GitHubRelease[]> = JSON.parse(cachedStr);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=10`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const releases: GitHubRelease[] = data
      .filter((r: any) => !r.prerelease)
      .map((r: any) => ({
        id: r.id,
        tagName: r.tag_name,
        name: r.name,
        body: r.body,
        publishedAt: r.published_at,
        htmlUrl: r.html_url,
        isPrerelease: r.prerelease,
      }));

    localStorage.setItem(
      CACHE_KEY_ALL,
      JSON.stringify({ data: releases, fetchedAt: Date.now() })
    );

    return releases;
  } catch (error) {
    console.error('Error fetching all releases:', error);
    return [];
  }
}

export function formatReleaseDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(isoString));
  } catch (e) {
    return isoString;
  }
}
