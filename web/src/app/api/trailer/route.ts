import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';

// In-memory cache to avoid redundant YouTube searches
const trailerCache = new Map<string, { videoId: string; title: string }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || searchParams.get('q');
  const year = searchParams.get('year') || '';

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const cacheKey = `${title.toLowerCase()}_${year}`.trim();
  if (trailerCache.has(cacheKey)) {
    return NextResponse.json(trailerCache.get(cacheKey));
  }

  try {
    const query = `${title} ${year} official trailer`.trim();
    const result = await ytSearch(query);
    const video = result.videos?.[0];

    if (!video || !video.videoId) {
      return NextResponse.json({ error: 'Trailer not found' }, { status: 404 });
    }

    const data = {
      videoId: video.videoId,
      title: video.title,
    };

    trailerCache.set(cacheKey, data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Trailer search error:', error);
    return NextResponse.json({ error: 'Failed to search trailer' }, { status: 500 });
  }
}
