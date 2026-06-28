import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!imdbId) return NextResponse.json({ streams: [] });

  let url = `https://torrentio.strem.fun/stream/movie/${imdbId}.json`;
  if (season && episode) {
    url = `https://torrentio.strem.fun/stream/series/${imdbId}:${season}:${episode}.json`;
  }

  try {
    const res = await fetch(url, {
        cache: 'no-store',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!res.ok) {
       console.error(`Torrentio returned status: ${res.status}`);
       return NextResponse.json({ streams: [] });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Torrent API Error:', error);
    return NextResponse.json({ streams: [] });
  }
}
