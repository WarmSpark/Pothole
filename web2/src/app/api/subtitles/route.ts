import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!imdbId) return NextResponse.json({ subtitles: [] });

  let url = `https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`;
  if (season && episode) {
    url = `https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${season}:${episode}.json`;
  }

  try {
    const res = await fetch(url, {
        cache: 'no-store',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });
    
    if (!res.ok) {
       return NextResponse.json({ subtitles: [] });
    }
    
    const data = await res.json();
    
    if (!data.subtitles) {
        return NextResponse.json({ subtitles: [] });
    }
    
    // Filter only English subtitles and limit to top 5
    const englishSubs = data.subtitles
        .filter((sub: any) => sub.lang === 'eng' || sub.lang === 'English')
        .slice(0, 5)
        .map((sub: any, index: number) => ({
            id: sub.id,
            label: index === 0 ? 'English (Main)' : `English ${index + 1}`,
            // Proxy the URL to avoid CORS and convert SRT to VTT
            url: `/api/subtitles/proxy?url=${encodeURIComponent(sub.url)}`
        }));
        
    return NextResponse.json({ subtitles: englishSubs });
  } catch (error) {
    console.error('Subtitles API Error:', error);
    return NextResponse.json({ subtitles: [] });
  }
}
