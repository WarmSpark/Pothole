import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';
import 'cheerio'; // Force next.js to trace this dependency

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type') || 'youtube';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    if (type === 'movie') {
      const r = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`);
      const data = await r.json();
      
      const videos = (data.data.movies || []).slice(0, 5).map((m: any) => ({
        isMovie: true,
        videoId: m.id.toString(), // We'll just use the ID here
        title: m.title,
        thumbnail: m.medium_cover_image,
        duration: `${m.runtime} mins`,
        author: `YTS • ${m.year} • ★${m.rating}`,
        torrents: m.torrents
      }));
      return NextResponse.json({ videos });
    } else {
      const r = await ytSearch(q);
      const videos = r.videos.slice(0, 5).map((v: any) => ({
        isMovie: false,
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.timestamp,
        author: v.author.name
      }));
      return NextResponse.json({ videos });
    }
  } catch (error) {
    console.error('search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
