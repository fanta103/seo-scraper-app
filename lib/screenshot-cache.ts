export type CachedScreenshot = {
  data: string;
  mimeType: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __screenshotCache: Map<string, CachedScreenshot> | undefined;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

export function getScreenshotCache(): Map<string, CachedScreenshot> {
  if (!globalThis.__screenshotCache) {
    globalThis.__screenshotCache = new Map();
  }
  return globalThis.__screenshotCache;
}

export function cacheScreenshot(
  data: string,
  mimeType: string,
): { id: string; apiUrl: string } {
  const id = Math.random().toString(36).substring(7);
  getScreenshotCache().set(id, { data, mimeType });
  setTimeout(() => getScreenshotCache().delete(id), CACHE_TTL_MS);
  return { id, apiUrl: `/api/screenshot?id=${id}` };
}

export function getCachedScreenshot(id: string): CachedScreenshot | undefined {
  return getScreenshotCache().get(id);
}

export function parseScreenshotId(apiUrl: string): string | null {
  const match = apiUrl.match(/[?&]id=([^&]+)/);
  return match?.[1] ?? null;
}
