const CACHE_NAME = "hero-video-cache-v1";
const CACHE_KEY = "hero-bg-video";

export const getCachedHeroVideo = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedRes = await cache.match(CACHE_KEY);

    if (cachedRes) {
      const blob = await cachedRes.blob();
      return URL.createObjectURL(blob);
    }

    return null;
  } catch (err) {
    console.error("Error reading video cache:", err);
    return null;
  }
};

export const cacheHeroVideo = async (videoSrcPath: string) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedRes = await cache.match(CACHE_KEY);

    if (cachedRes) return;

    const res = await fetch(videoSrcPath);
    const blob = await res.blob();

    const customRes = new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
      },
    });

    await cache.put(CACHE_KEY, customRes);
  } catch (err) {
    console.error("Failed to cache video background:", err);
  }
};
