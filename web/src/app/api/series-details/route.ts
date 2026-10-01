import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');
  const season = searchParams.get('season') || '1';

  if (!imdbId) {
    return NextResponse.json({ error: 'imdbId is required' }, { status: 400 });
  }

  try {
    // 1. Fetch main series metadata to get total seasons and thumbnail
    const mainRes = await fetch(`http://www.omdbapi.com/?i=${imdbId}&apikey=thewdb`);
    const mainData = await mainRes.json();

    if (mainData.Response === 'False') {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const totalSeasons = parseInt(mainData.totalSeasons) || 1;

    // 2. Fetch specific season data
    const seasonRes = await fetch(`http://www.omdbapi.com/?i=${imdbId}&Season=${season}&apikey=thewdb`);
    const seasonData = await seasonRes.json();

    const episodes = seasonData.Episodes ? seasonData.Episodes.map((ep: any) => ({
      episodeNumber: parseInt(ep.Episode),
      title: ep.Title,
      released: ep.Released,
      imdbRating: ep.imdbRating
    })) : [];

    return NextResponse.json({
      title: mainData.Title,
      thumbnail: mainData.Poster !== 'N/A' ? mainData.Poster : null,
      totalSeasons,
      currentSeason: parseInt(season),
      episodes
    });

  } catch (error) {
    console.error('Series details error:', error);
    return NextResponse.json({ error: 'Failed to fetch series details' }, { status: 500 });
  }
}
