import type { Video } from '../types/video';

const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';

interface YouTubeSearchThumbnail {
  url?: string;
}

interface YouTubeSearchSnippet {
  title?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnails?: {
    default?: YouTubeSearchThumbnail;
    medium?: YouTubeSearchThumbnail;
    high?: YouTubeSearchThumbnail;
    standard?: YouTubeSearchThumbnail;
    maxres?: YouTubeSearchThumbnail;
  };
}

interface YouTubeSearchId {
  videoId?: string;
}

interface YouTubeSearchItem {
  id?: YouTubeSearchId;
  snippet?: YouTubeSearchSnippet;
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  nextPageToken?: string;
  error?: {
    message?: string;
  };
}

interface YouTubeVideoContentDetails {
  duration?: string;
}

interface YouTubeVideoItem {
  id?: string;
  contentDetails?: YouTubeVideoContentDetails;
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
  error?: {
    message?: string;
  };
}

export interface FetchYouTubeVideosOptions {
  maxResults?: number;
  minDurationSeconds?: number;
  regionCode?: string;
  pageToken?: string;
  signal?: AbortSignal;
}

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function getApiKey() {
  return API_KEY?.trim() ?? '';
}

function pickThumbnail(snippet?: YouTubeSearchSnippet) {
  return (
    snippet?.thumbnails?.maxres?.url ||
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.standard?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url
  );
}

function parseIsoDurationToSeconds(duration?: string) {
  if (!duration) {
    return 0;
  }

  const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);

  if (!match) {
    return 0;
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

async function fetchVideoDurations(videoIds: string[], apiKey: string, signal?: AbortSignal) {
  if (videoIds.length === 0) {
    return new Map<string, number>();
  }

  const url = new URL(YOUTUBE_VIDEOS_ENDPOINT);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), { signal });
  const data = (await response.json()) as YouTubeVideosResponse;

  if (!response.ok) {
    const apiMessage = data.error?.message?.trim();
    throw new Error(apiMessage || `YouTube videos request failed (${response.status})`);
  }

  const durations = new Map<string, number>();

  for (const item of data.items ?? []) {
    const videoId = item.id?.trim();
    const durationSeconds = parseIsoDurationToSeconds(item.contentDetails?.duration);

    if (videoId && durationSeconds > 0) {
      durations.set(videoId, durationSeconds);
    }
  }

  return durations;
}

export async function fetchYouTubeVideos(
  query: string,
  options: FetchYouTubeVideosOptions = {},
): Promise<{ videos: Video[]; nextPageToken?: string }> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('Missing VITE_YOUTUBE_API_KEY; using fallback videos.');
    return { videos: [] };
  }

  const url = new URL(YOUTUBE_SEARCH_ENDPOINT);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('order', 'date');
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', String(Math.max(options.maxResults ?? 12, 50)));
  url.searchParams.set('relevanceLanguage', 'en');
  url.searchParams.set('key', apiKey);

  if (options.regionCode) {
    url.searchParams.set('regionCode', options.regionCode);
  }

  if (options.pageToken) {
    url.searchParams.set('pageToken', options.pageToken);
  }

  const response = await fetch(url.toString(), {
    signal: options.signal,
  });

  const data = (await response.json()) as YouTubeSearchResponse;
  if (!response.ok) {
    const apiMessage = data.error?.message?.trim();
    throw new Error(apiMessage || `YouTube API request failed (${response.status})`);
  }

  const candidateVideos = (data.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId?.trim();
    const title = item.snippet?.title?.trim();

    if (!videoId || !title) {
      return [];
    }

    const thumbnail = pickThumbnail(item.snippet);
    const channelTitle = item.snippet?.channelTitle?.trim();
    const publishedAt = item.snippet?.publishedAt;

    const video: Video = {
      id: videoId,
      title,
      ...(thumbnail ? { thumbnail } : {}),
      ...(channelTitle ? { channelTitle } : {}),
      ...(publishedAt ? { publishedAt } : {}),
    };

    return [video];
  });

  const minDurationSeconds = options.minDurationSeconds ?? 0;

  if (minDurationSeconds <= 0 || candidateVideos.length === 0) {
    return {
      videos: candidateVideos.slice(0, options.maxResults ?? 12),
      nextPageToken: data.nextPageToken,
    };
  }

  const durations = await fetchVideoDurations(
    candidateVideos.map((video) => video.id),
    apiKey,
    options.signal,
  );

  const filteredVideos = candidateVideos.filter((video) => {
    const durationSeconds = durations.get(video.id) ?? 0;
    return durationSeconds >= minDurationSeconds;
  });

  return {
    videos: filteredVideos.slice(0, options.maxResults ?? 12),
    nextPageToken: data.nextPageToken,
  };
}
