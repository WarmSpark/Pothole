import os
import sys
import uuid
import json
import re
import urllib.request
import time

sys.path.append("/home/divyansh_1410/pothole-django")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pothole_backend.settings")
import django
django.setup()

from movies.models import Movie
from accounts.models import User

CATALOG_ITEMS = [
    # 13 Fileditch Master Movies
    {"imdb_id": "tt0816692", "title": "Interstellar", "trailer": "zSWdZVtXT7E", "type": "full"},
    {"imdb_id": "tt1375666", "title": "Inception", "trailer": "YoHD9XEInc0", "type": "full"},
    {"imdb_id": "tt1856101", "title": "Blade Runner 2049", "trailer": "gCcx85zbxz4", "type": "full"},
    {"imdb_id": "tt10838180", "title": "The Matrix Resurrections", "trailer": "9ix7TUGVYIo", "type": "full"},
    {"imdb_id": "tt0468569", "title": "The Dark Knight", "trailer": "EXeTwQWrcwY", "type": "full"},
    {"imdb_id": "tt2911666", "title": "John Wick", "trailer": "2AUmvWm5ZDQ", "type": "full"},
    {"imdb_id": "tt0137523", "title": "Fight Club", "trailer": "O1nDozs-96U", "type": "full"},
    {"imdb_id": "tt4154796", "title": "Avengers: Endgame", "trailer": "TcMBFSGVi1c", "type": "full"},
    {"imdb_id": "tt15398776", "title": "Oppenheimer", "trailer": "uYPbbksJxIg", "type": "full"},
    {"imdb_id": "tt2582802", "title": "Whiplash", "trailer": "7d_jQycdQGo", "type": "full"},
    {"imdb_id": "tt9362722", "title": "Spider-Man: Across the Spider-Verse", "trailer": "cqGjhVJWtEg", "type": "full"},
    {"imdb_id": "tt5311514", "title": "Your Name.", "trailer": "xU47nhruN-Q", "type": "full"},
    {"imdb_id": "tt16426378", "title": "Suzume", "trailer": "6c4as8nha5w", "type": "full"},

    # Additional Iconic Titles with Official Trailers
    {"imdb_id": "tt0133093", "title": "The Matrix", "trailer": "vKQi3bBA1y8", "type": "trailer"},
    {"imdb_id": "tt15239678", "title": "Dune: Part Two", "trailer": "Way9Dexny3w", "type": "trailer"},
    {"imdb_id": "tt1160419", "title": "Dune", "trailer": "8g18jFHCLXk", "type": "trailer"},
    {"imdb_id": "tt0372784", "title": "Batman Begins", "trailer": "neY2xCQGPUM", "type": "trailer"},
    {"imdb_id": "tt1877830", "title": "The Batman", "trailer": "mqqft2x_Aa4", "type": "trailer"},
    {"imdb_id": "tt0245429", "title": "Spirited Away", "trailer": "ByXuk9QqQkk", "type": "trailer"},
    {"imdb_id": "tt0110912", "title": "Pulp Fiction", "trailer": "tGpTpVyI_OQ", "type": "trailer"},
    {"imdb_id": "tt0111161", "title": "The Shawshank Redemption", "trailer": "PLl99DlL6b4", "type": "trailer"},
    {"imdb_id": "tt0068646", "title": "The Godfather", "trailer": "UaVTIH8mujA", "type": "trailer"},
    {"imdb_id": "tt0071562", "title": "The Godfather Part II", "trailer": "9O1Iy9od7-A", "type": "trailer"},
    {"imdb_id": "tt0482571", "title": "The Prestige", "trailer": "ijXruBfguBI", "type": "trailer"},
    {"imdb_id": "tt0172495", "title": "Gladiator", "trailer": "owK1qxDselE", "type": "trailer"},
    {"imdb_id": "tt1853728", "title": "Django Unchained", "trailer": "0fUCuvNlOCg", "type": "trailer"},
    {"imdb_id": "tt0361748", "title": "Inglourious Basterds", "trailer": "KnrRy6kSFF0", "type": "trailer"},
    {"imdb_id": "tt0099685", "title": "Goodfellas", "trailer": "2ilzidi_J8Q", "type": "trailer"},
    {"imdb_id": "tt0407887", "title": "The Departed", "trailer": "iojhqm0JTW4", "type": "trailer"},
    {"imdb_id": "tt0114369", "title": "Se7en", "trailer": "znmZoVkCjpI", "type": "trailer"},
    {"imdb_id": "tt0109830", "title": "Forrest Gump", "trailer": "bLvqoHBptjg", "type": "trailer"},
    {"imdb_id": "tt0102926", "title": "The Silence of the Lambs", "trailer": "W6Mm8Sbe__o", "type": "trailer"},
    {"imdb_id": "tt6751668", "title": "Parasite", "trailer": "5xH0RZE7t4g", "type": "trailer"},
    {"imdb_id": "tt1130884", "title": "Shutter Island", "trailer": "5iaYLCiq5RM", "type": "trailer"},
    {"imdb_id": "tt1392190", "title": "Mad Max: Fury Road", "trailer": "hEJnMQG938g", "type": "trailer"},
    {"imdb_id": "tt0499549", "title": "Avatar", "trailer": "5PSNL1qE6VY", "type": "trailer"},
    {"imdb_id": "tt1630029", "title": "Avatar: The Way of Water", "trailer": "d9MyW72ELq0", "type": "trailer"},
    {"imdb_id": "tt1745960", "title": "Top Gun: Maverick", "trailer": "giXco2JAZ_4", "type": "trailer"},
    {"imdb_id": "tt4633694", "title": "Spider-Man: Into the Spider-Verse", "trailer": "g4Hbz2jLxvQ", "type": "trailer"},
    {"imdb_id": "tt0119698", "title": "Princess Mononoke", "trailer": "4OiMOHRDs14", "type": "trailer"},
    {"imdb_id": "tt0347149", "title": "Howl's Moving Castle", "trailer": "iwROgK94zcM", "type": "trailer"},
    {"imdb_id": "tt2560140", "title": "Attack on Titan", "trailer": "MGRm4IzK1SQ", "type": "trailer"},
    {"imdb_id": "tt0169858", "title": "The End of Evangelion", "trailer": "IQrX6ZEx0sI", "type": "trailer"},
    {"imdb_id": "tt9426210", "title": "Weathering with You", "trailer": "Q6iK6DjV_iE", "type": "trailer"},
    {"imdb_id": "tt11032374", "title": "Demon Slayer: Mugen Train", "trailer": "bFwdl2PPPXM", "type": "trailer"},
    {"imdb_id": "tt14331144", "title": "Jujutsu Kaisen 0", "trailer": "2DoCEZzkZlA", "type": "trailer"},
    {"imdb_id": "tt2543164", "title": "Arrival", "trailer": "tFMo3UJ4B4g", "type": "trailer"},
    {"imdb_id": "tt0062622", "title": "2001: A Space Odyssey", "trailer": "oR_e9y-Ojek", "type": "trailer"},
    {"imdb_id": "tt0078748", "title": "Alien", "trailer": "LjLamj-b0I8", "type": "trailer"},
    {"imdb_id": "tt0090605", "title": "Aliens", "trailer": "bTCaVKKYSoc", "type": "trailer"},
    {"imdb_id": "tt0103064", "title": "Terminator 2: Judgment Day", "trailer": "CRRlbK5w8AE", "type": "trailer"},
    {"imdb_id": "tt0993846", "title": "The Wolf of Wall Street", "trailer": "iszwuX1AK6A", "type": "trailer"},
    {"imdb_id": "tt0477348", "title": "No Country for Old Men", "trailer": "38A__WT3-o0", "type": "trailer"},
    {"imdb_id": "tt0469494", "title": "There Will Be Blood", "trailer": "FeSLPELpMeM", "type": "trailer"},
    {"imdb_id": "tt1517268", "title": "Barbie", "trailer": "pBk4NYhWNMM", "type": "trailer"},
    {"imdb_id": "tt0118715", "title": "The Big Lebowski", "trailer": "cd-go0oBF4Y", "type": "trailer"},
    {"imdb_id": "tt0120737", "title": "The Lord of the Rings: The Fellowship of the Ring", "trailer": "V75dMMIW2B4", "type": "trailer"},
    {"imdb_id": "tt0167260", "title": "The Lord of the Rings: The Return of the King", "trailer": "r5X-hFf6Bwo", "type": "trailer"},
    {"imdb_id": "tt0107290", "title": "Jurassic Park", "trailer": "QWBKEmWWL38", "type": "trailer"},
    {"imdb_id": "tt0848228", "title": "The Avengers", "trailer": "eOrNdBpGMv8", "type": "trailer"}
]

def fetch_omdb_metadata(imdb_id):
    url = f"http://www.omdbapi.com/?i={imdb_id}&plot=full&apikey=thewdb"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get("Response") == "False":
                return None
            return data
    except Exception as e:
        print(f"Error fetching {imdb_id}: {e}")
        return None

def clean_runtime(runtime_str):
    if not runtime_str:
        return 120
    m = re.search(r'(\d+)', runtime_str)
    return int(m.group(1)) if m else 120

def clean_year(year_str):
    if not year_str:
        return 2024
    m = re.search(r'(\d{4})', year_str)
    return int(m.group(1)) if m else 2024

def run():
    print(f"Starting OMDb catalog expansion ({len(CATALOG_ITEMS)} titles)...")
    success_count = 0
    
    for item in CATALOG_ITEMS:
        imdb_id = item["imdb_id"]
        meta = fetch_omdb_metadata(imdb_id)
        if not meta:
            print(f"Skipping {imdb_id} - no metadata found")
            continue

        title = meta.get("Title") or item["title"]
        genres = [g.strip() for g in meta.get("Genre", "Action").split(",") if g.strip()]
        actors = [a.strip() for a in meta.get("Actors", "").split(",") if a.strip()]
        director = meta.get("Director") or "Director"
        plot = meta.get("Plot") or ""
        year = clean_year(meta.get("Year"))
        duration = clean_runtime(meta.get("Runtime"))
        rating = meta.get("Rated") or "PG-13"
        imdb_score = float(meta.get("imdbRating")) if meta.get("imdbRating") and meta.get("imdbRating") != "N/A" else 8.0
        poster = meta.get("Poster")
        if not poster or poster == "N/A":
            poster = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500"

        # Check if movie already exists by imdb_id or title
        existing = Movie.objects.filter(imdb_id=imdb_id).first()
        if not existing:
            # Try case-insensitive title match for existing seeded titles
            clean_title = title.replace(".", "").strip()
            existing = Movie.objects.filter(title__icontains=clean_title).first()

        if existing:
            # Update metadata and poster, but preserve fileditch video_url and studio_id
            existing.imdb_id = imdb_id
            existing.title = title
            existing.description = plot
            existing.genres = genres
            existing.release_year = year
            existing.duration_minutes = duration
            existing.rating = rating
            existing.imdb_score = imdb_score
            existing.director = director
            existing.cast = actors
            existing.poster_url = poster
            # If current backdrop is an unsplash photo or missing, upgrade to poster or backdrop
            if not existing.backdrop_url or "unsplash" in existing.backdrop_url:
                existing.backdrop_url = poster
            if item.get("trailer") and not existing.trailer_youtube_id:
                existing.trailer_youtube_id = item["trailer"]
            existing.save()
            print(f"[UPDATED] {title} ({year}) | Poster: {poster[:35]}...")
            success_count += 1
        else:
            # Create new catalog trailer entry
            new_id = str(uuid.uuid4())
            Movie.objects.create(
                id=new_id,
                title=title,
                description=plot,
                genres=genres,
                release_year=year,
                duration_minutes=duration,
                rating=rating,
                imdb_score=imdb_score,
                imdb_id=imdb_id,
                director=director,
                cast=actors,
                tags=genres + ["Official Trailer", "4K", "IMDb"],
                stream_type="trailer",
                trailer_youtube_id=item.get("trailer", "EXeTwQWrcwY"),
                poster_url=poster,
                backdrop_url=poster,
                video_url=None,
                studio_id=None,
                is_published=True
            )
            print(f"[CREATED] {title} ({year}) | Trailer: {item.get('trailer')} | Poster: {poster[:35]}...")
            success_count += 1

        time.sleep(0.05) # Polite delay

    total = Movie.objects.count()
    print(f"\n==========================================")
    print(f"OMDb Catalog Seeding Complete!")
    print(f"Processed: {success_count} movies")
    print(f"Total Movies in Database: {total}")
    print(f"==========================================")

if __name__ == "__main__":
    run()
