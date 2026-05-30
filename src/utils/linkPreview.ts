export interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  image?: string;
}

export async function fetchLinkPreview(url: string): Promise<LinkMetadata | null> {
  try {
    // Basic URL validation
    new URL(url);
    
    // Use allorigins as a free CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.contents) return null;

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    const getMetaContent = (property: string) => {
      const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el ? el.getAttribute('content') : null;
    };

    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || doc.title || url;
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description') || '';
    const image = getMetaContent('og:image') || getMetaContent('twitter:image');

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      image: image || undefined
    };
  } catch (error) {
    console.error("Failed to fetch link preview:", error);
    return null;
  }
}
