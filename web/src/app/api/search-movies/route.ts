import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // 1. Fetch metadata from OMDB API without restricting the type so we get both Movies and TV Series
    const omdbRes = await fetch(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=thewdb`);
    const omdbData = await omdbRes.json();

    if (!omdbData.Search || omdbData.Search.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Map OMDB results to our frontend format
    const results = omdbData.Search.slice(0, 10).map((item: any) => ({
      type: item.Type === 'series' ? 'series' : 'movie',
      videoId: item.imdbID, // IMDB ID
      title: item.Title,
      year: item.Year,
      thumbnail: item.Poster !== 'N/A' ? item.Poster : '',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
