import type { SpotifyMeta } from '../types';

export function extractPlaylistId(url: string): string | null {
  try {
    if (url.startsWith('spotify:playlist:')) {
      const parts = url.split(':');
      return parts[2] || null;
    }
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'open.spotify.com') return null;
    const pathParts = parsedUrl.pathname.split('/');
    if (pathParts[1] !== 'playlist') return null;
    return pathParts[2] || null;
  } catch {
    return null;
  }
}

export function isValidSpotifyPlaylistUrl(url: string): boolean {
  return extractPlaylistId(url) !== null;
}

export function getEmbedUrl(playlistId: string): string {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
}

export async function fetchPlaylistMeta(playlistUrl: string): Promise<SpotifyMeta> {
  try {
    const encodedUrl = encodeURIComponent(playlistUrl);
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodedUrl}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return {
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
      providerName: data.provider_name,
    };
  } catch (error) {
    throw new Error('Could not load playlist. Make sure it is public.', { cause: error });
  }
}
