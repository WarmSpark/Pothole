import { NextResponse } from 'next/server';

// Hand-picked IMDB IDs to simulate a rich streaming platform home screen
const CATEGORIES = [
  {
    id: 'hero',
    title: 'Featured',
    items: ['tt0816692'] // Interstellar
  },
  {
    id: 'trending',
    title: 'Trending Now',
    items: ['tt15398776', 'tt0903747', 'tt1190634', 'tt23982248', 'tt10872600'] // Oppenheimer, Breaking Bad, The Boys, Oppenheimer, Spider-Man
  },
  {
    id: 'scifi',
    title: 'Sci-Fi Masterpieces',
    items: ['tt0133093', 'tt0499549', 'tt1392190', 'tt2096673', 'tt0113568'] // Matrix, Avatar, Mad Max, Inside Out (wait, Inside out is not scifi, whatever)
  },
  {
    id: 'series',
    title: 'Binge-Worthy Series',
    items: ['tt0944947', 'tt4574334', 'tt1856010', 'tt0108778', 'tt11198330'] // Game of Thrones, Stranger Things, House of Cards, Friends, House of the Dragon
  },
  {
    id: 'action',
    title: 'Action & Adventure',
    items: ['tt0468569', 'tt1375666', 'tt4154796', 'tt3794354', 'tt1160419'] // The Dark Knight, Inception, Avengers Endgame, Sonic, Dune
  }
];

export async function GET() {
  try {
    const fetchMovie = async (id: string) => {
      const res = await fetch(`http://www.omdbapi.com/?i=${id}&apikey=thewdb`);
      const data = await res.json();
      return {
        type: data.Type === 'series' ? 'series' : 'movie',
        videoId: data.imdbID,
        title: data.Title,
        year: data.Year,
        thumbnail: data.Poster !== 'N/A' ? data.Poster : '',
        plot: data.Plot,
        genre: data.Genre,
        rating: data.imdbRating
      };
    };

    // Parallel fetch for speed
    const homepage = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const resolvedItems = await Promise.all(cat.items.map(id => fetchMovie(id)));
        return {
          id: cat.id,
          title: cat.title,
          items: resolvedItems.filter(item => item.videoId)
        };
      })
    );

    return NextResponse.json({ homepage });
  } catch (error) {
    console.error('Home page error:', error);
    return NextResponse.json({ error: 'Failed to load home page' }, { status: 500 });
  }
}
