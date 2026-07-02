export interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image?: string;
  youtubeId?: string;
  isFacebookVideo?: boolean;
}

export async function fetchLinkPreview(url: string): Promise<LinkMetadata | null> {
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  const youtubeId = ytMatch ? ytMatch[1] : undefined;
  const isFacebookVideo = url.match(/(?:facebook\.com\/(?:reel|watch|.*\/videos)\/|fb\.watch\/)/i) !== null;

  try {
    // Basic URL validation
    new URL(url);
    
    // Use local Vercel proxy
    const proxyUrl = `/api/link-preview?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Proxy fetch failed');
    
    const htmlText = await response.text();

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const getMetaContent = (property: string) => {
      const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el ? el.getAttribute('content') : null;
    };

    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || doc.title || url;
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description') || '';
    const rawImage = getMetaContent('og:image') || getMetaContent('twitter:image') || '';
    const image = rawImage && (rawImage.startsWith('https://') || rawImage.startsWith('http://')) ? rawImage : undefined;

    const result: LinkMetadata = {
      url,
      title: title.trim(),
      description: description.trim()
    };
    if (image) result.image = image;
    if (youtubeId) result.youtubeId = youtubeId;
    if (isFacebookVideo) result.isFacebookVideo = true;
    return result;
  } catch (error) {
    if (youtubeId) {
      return {
        url,
        title: 'YouTube Video',
        description: '',
        youtubeId
      };
    }
    if (isFacebookVideo) {
      return {
        url,
        title: 'Facebook Video',
        description: '',
        isFacebookVideo: true
      };
    }
    console.error("Failed to fetch link preview:", error);
    return null;
  }
}
