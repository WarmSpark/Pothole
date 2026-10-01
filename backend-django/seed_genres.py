import os
import sys
import uuid
import re
import requests
import django

sys.path.insert(0, '/home/divyansh_1410/togethr/backend-django')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pothole_backend.settings')
django.setup()

from movies.models import Movie

IMDB_IDS = [
    # Comedy
    'tt1119646', 'tt0829482', 'tt2278388', 'tt1431045', 'tt8946378',
    'tt0365748', 'tt0838283', 'tt0091042', 'tt0942385', 'tt0120812',
    'tt0377059', 'tt0119654',
    # Horror
    'tt1457767', 'tt7784604', 'tt6644200', 'tt5052448', 'tt1396484',
    'tt0081505', 'tt1591095', 'tt0070047', 'tt0078748', 'tt2197521',
    'tt2395427',
    # Thriller
    'tt0114369', 'tt1130884', 'tt0443706', 'tt6751668', 'tt1392214',
    'tt2267998', 'tt2872718', 'tt0102926', 'tt0477348', 'tt0482571',
    'tt0209144',
    # Romance
    'tt3783958', 'tt0120338', 'tt2194499', 'tt1022603', 'tt0332280',
    'tt0112471', 'tt0414387', 'tt1798709', 'tt0338013', 'tt0118842',
    # Mystery
    'tt0327056', 'tt1568346', 'tt0047396', 'tt0114814',
    # Fantasy / Adventure
    'tt0241527', 'tt0457430', 'tt0372784', 'tt0167261',
    # Animation
    'tt6587046', 'tt0245429', 'tt2380307', 'tt0435625', 'tt0317705', 'tt0114709'
]

def seed_movies():
    added = 0
    for imdb_id in set(IMDB_IDS):
        if Movie.objects.filter(imdb_id=imdb_id).exists():
            continue
        try:
            r = requests.get(f'http://www.omdbapi.com/?i={imdb_id}&apikey=thewdb', timeout=5)
            d = r.json()
            if d.get('Response') != 'True':
                continue

            raw_genres = d.get('Genre', 'Drama')
            genres = [g.strip() for g in raw_genres.split(',') if g.strip()]

            raw_cast = d.get('Actors', '')
            cast = [c.strip() for c in raw_cast.split(',') if c.strip()]

            y_str = re.search(r'\d{4}', str(d.get('Year', '2020')))
            year = int(y_str.group(0)) if y_str else 2020

            rt_str = re.search(r'\d+', str(d.get('Runtime', '110')))
            runtime = int(rt_str.group(0)) if rt_str else 110

            score_str = d.get('imdbRating')
            try:
                score = float(score_str) if score_str and score_str != 'N/A' else 8.0
            except Exception:
                score = 8.0

            poster = d.get('Poster')
            if not poster or poster == 'N/A':
                poster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'

            Movie.objects.create(
                id=str(uuid.uuid4()),
                title=d.get('Title', 'Untitled'),
                description=d.get('Plot', ''),
                genres=genres,
                release_year=year,
                duration_minutes=runtime,
                rating=d.get('Rated', 'PG-13') if d.get('Rated') != 'N/A' else 'PG-13',
                imdb_score=score,
                imdb_id=imdb_id,
                director=d.get('Director', 'Director'),
                cast=cast,
                tags=genres,
                stream_type='full',
                poster_url=poster,
                backdrop_url=poster,
                is_published=True
            )
            added += 1
            print(f"Added [{added}]: {d.get('Title')} ({year}) - {genres}")
        except Exception as e:
            print(f"Error seeding {imdb_id}: {e}")

    print(f"Seeding finished. Added {added} movies.")

if __name__ == '__main__':
    seed_movies()
