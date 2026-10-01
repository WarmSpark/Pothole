import uuid
import re
import os
import math
import requests
from collections import defaultdict
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse, HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from django.db.models import Sum, Count

from .models import Movie, Contract, WatchHistory
from .serializers import MovieSerializer
from accounts.models import User
from royalties.models import RoyaltyLog

LOCAL_ASSET_PATHS = {
    "Avengers: Endgame": "/home/divyansh_1410/Downloads/Assestass/Avengers.Endgame.2019.Hindi-English.720p.10Bit.HEVC.BluRay.x265-1Vegamovies.tw.mp4",
    "Blade Runner 2049": "/home/divyansh_1410/Downloads/Assestass/Blade Runner 2049 (2017) {Hindi-English} 720p ESub Vegamovies.NL.mp4",
    "Fight Club": "/home/divyansh_1410/Downloads/Assestass/Fight.Club.1999.720p.Hindi-English.Vegamovies.is.mp4",
    "Inception": "/home/divyansh_1410/Downloads/Assestass/Inception.(2010).720p.Dual.Audio.(Hin-Eng).[Vegamovies.NL].mp4",
    "Interstellar": "/home/divyansh_1410/Downloads/Assestass/Interstellar.2014.BluRay.IMAX.720p.x265.HEVC.10bit.Hindi.English.AAC.5.1.ESub.Vegamovies.To.mp4",
    "John Wick": "/home/divyansh_1410/Downloads/Assestass/John.Wick.1.(2014).720p.(Hin.Eng)[MoviesFlix.in].mp4",
    "Oppenheimer": "/home/divyansh_1410/Downloads/Assestass/Oppenheimer.2023.720p.HEVC.BluRay.ORG.DUAL.AAC2.0.x265.ESub.Vegamovies.to.mp4",
    "Spider-Man: Across the Spider-Verse": "/home/divyansh_1410/Downloads/Assestass/Spider-Man.Across.the.Spider-Verse.2023.720p.10bit.BluRay.Hindi.English.ESubs.Vegamovies.to.mp4",
    "Suzume": "/home/divyansh_1410/Downloads/Assestass/Suzume.2022.WebDl.720P.Japanese..Vegamovies.to.mp4",
    "The Dark Knight": "/home/divyansh_1410/Downloads/Assestass/The.Dark.Knight.(2008).720p.Dual.Audio.(Hin-Eng).Vegamovies.NL.mp4",
    "The Matrix Resurrections": "/home/divyansh_1410/Downloads/Assestass/The.Matrix.Resurrections.2021.720p.10Bit.WEB-DL.Hindi.5.1-English.HEVC.x265-Vegamovies.NL.mp4",
    "Whiplash": "/home/divyansh_1410/Downloads/Assestass/Whiplash.2014.720p.BluRay.x264.(English With Subtitles).Vegamovies.NL.mp4",
    "Your Name": "/home/divyansh_1410/Downloads/Assestass/Your.Name.(2016).720p.Dual.Audio.(Hin-Eng).Vegamovies.NL.mp4"
}

def get_authenticated_user_id(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            token = AccessToken(auth_header.split(' ')[1])
            return str(token['sub']), token.get('role', 'viewer')
        except Exception:
            return None, None
    return None, None

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def movies_collection(request):
    if request.method == 'GET':
        genre = request.GET.get('genre')
        stream_type = request.GET.get('stream_type')
        search = request.GET.get('search')

        qs = Movie.objects.filter(is_published=True).order_by('-created_at')

        if stream_type:
            qs = qs.filter(stream_type=stream_type)

        if search:
            qs = qs.filter(title__icontains=search)

        movies = list(qs)

        # In-memory filter for JSON genres
        if genre:
            genre_lower = genre.lower()
            movies = [m for m in movies if any(g.lower() == genre_lower for g in (m.genres or []))]

        data = MovieSerializer(movies, many=True).data

        # Ensure video_url points to our streaming proxy while exposing direct_video_url for high-speed client playback
        for item in data:
            if item.get('stream_type') == 'full' and item.get('video_url'):
                item['direct_video_url'] = item.get('video_url')
                item['video_url'] = request.build_absolute_uri(f"/api/movies/{item['id']}/stream")

        return Response(data)

    elif request.method == 'POST':
        user_id, role = get_authenticated_user_id(request)
        if not user_id or role not in ['studio', 'admin']:
            return Response({'detail': 'Studio partner authentication required'}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data
        movie = Movie.objects.create(
            id=str(uuid.uuid4()),
            title=payload.get('title'),
            description=payload.get('description'),
            genres=payload.get('genres', []),
            release_year=payload.get('release_year', 2024),
            duration_minutes=payload.get('duration_minutes', 120),
            rating=payload.get('rating', 'PG-13'),
            imdb_score=payload.get('imdb_score', 8.0),
            imdb_id=payload.get('imdb_id'),
            director=payload.get('director'),
            cast=payload.get('cast', []),
            tags=payload.get('tags', []),
            stream_type=payload.get('stream_type', 'full'),
            trailer_youtube_id=payload.get('trailer_youtube_id'),
            poster_url=payload.get('poster_url'),
            backdrop_url=payload.get('backdrop_url'),
            video_url=payload.get('video_url'),
            studio_id=user_id,
            is_published=True
        )

        res_data = MovieSerializer(movie).data
        if movie.stream_type == 'full' and movie.video_url:
            res_data['direct_video_url'] = movie.video_url
            res_data['video_url'] = request.build_absolute_uri(f"/api/movies/{movie.id}/stream")

        return Response(res_data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def movie_detail(request, movie_id):
    movie = get_object_or_404(Movie, id=movie_id)
    data = MovieSerializer(movie).data
    if movie.stream_type == 'full' and movie.video_url:
        data['direct_video_url'] = movie.video_url
        data['video_url'] = request.build_absolute_uri(f"/api/movies/{movie.id}/stream")
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def movie_recommendations(request, movie_id):
    target = get_object_or_404(Movie, id=movie_id)
    target_genres = set(g.lower() for g in (target.genres or []))

    all_movies = Movie.objects.exclude(id=movie_id).filter(is_published=True)
    scored = []
    for m in all_movies:
        score = 0
        m_genres = set(g.lower() for g in (m.genres or []))
        shared = target_genres.intersection(m_genres)
        score += len(shared) * 3
        if target.director and m.director and target.director.lower() == m.director.lower():
            score += 4
        if target.stream_type == m.stream_type:
            score += 1
        scored.append((score, m))

    scored.sort(key=lambda x: x[0], reverse=True)
    recs = [item[1] for item in scored[:6]]
    data = MovieSerializer(recs, many=True).data
    for item in data:
        if item.get('stream_type') == 'full' and item.get('video_url'):
            item['direct_video_url'] = item.get('video_url')
            item['video_url'] = request.build_absolute_uri(f"/api/movies/{item['id']}/stream")
    return Response(data)

def stream_movie(request, movie_id):
    """
    HTTP 206 Byte-Range Streaming Engine (RFC 7233).
    Proxies Fileditch or local master MP4 seamlessly while shielding the direct URL.
    """
    movie = get_object_or_404(Movie, id=movie_id)
    range_header = request.META.get('HTTP_RANGE', '').strip()

    # 1. Check if local MP4 file exists first for zero-latency local playback
    local_path = LOCAL_ASSET_PATHS.get(movie.title)
    if local_path and os.path.exists(local_path):
        file_size = os.path.getsize(local_path)
        if not range_header:
            def file_iter():
                with open(local_path, 'rb') as f:
                    while chunk := f.read(1024 * 1024):
                        yield chunk
            resp = StreamingHttpResponse(file_iter(), content_type="video/mp4")
            resp['Content-Length'] = str(file_size)
            resp['Accept-Ranges'] = 'bytes'
            return resp

        # Parse Range: bytes=start-end
        match = re.match(r'bytes=(\d+)-(\d+)?', range_header)
        if not match:
            return HttpResponse(status=416)

        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else file_size - 1
        chunk_window = 4 * 1024 * 1024 # 4MB
        end = min(end, start + chunk_window - 1)
        content_length = end - start + 1

        def range_iter():
            with open(local_path, 'rb') as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    read_len = min(128 * 1024, remaining)
                    buf = f.read(read_len)
                    if not buf:
                        break
                    remaining -= len(buf)
                    yield buf

        resp = StreamingHttpResponse(range_iter(), status=206, content_type="video/mp4")
        resp['Content-Range'] = f"bytes {start}-{end}/{file_size}"
        resp['Accept-Ranges'] = 'bytes'
        resp['Content-Length'] = str(content_length)
        return resp

    # 2. Proxy Fileditch Upstream Stream
    fileditch_url = movie.video_url
    if not fileditch_url or not fileditch_url.startswith('http'):
        return HttpResponse("Media stream asset not configured", status=404)

    req_headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://fileditch.com/',
    }
    if range_header:
        req_headers['Range'] = range_header

    try:
        upstream = requests.get(fileditch_url, headers=req_headers, stream=True, timeout=15)
        # If .st failed or challenged, attempt mirror .me
        if (upstream.status_code >= 400 or 'text/html' in upstream.headers.get('Content-Type', '')) and 'fileditchfiles.st' in fileditch_url:
            mirror_url = fileditch_url.replace('fileditchfiles.st', 'fileditchfiles.me')
            try:
                mirror_resp = requests.get(mirror_url, headers=req_headers, stream=True, timeout=10)
                if mirror_resp.status_code < 400:
                    upstream = mirror_resp
            except Exception:
                pass
        
        def upstream_iter():
            for chunk in upstream.iter_content(chunk_size=128 * 1024):
                if chunk:
                    yield chunk

        resp = StreamingHttpResponse(
            upstream_iter(),
            status=upstream.status_code,
            content_type=upstream.headers.get('Content-Type', 'video/mp4')
        )
        for h in ['Content-Range', 'Accept-Ranges', 'Content-Length']:
            if h in upstream.headers:
                resp[h] = upstream.headers[h]
        return resp

    except Exception as e:
        return HttpResponse(f"Upstream stream error: {str(e)}", status=502)

@api_view(['GET'])
@permission_classes([AllowAny])
def omdb_search(request):
    """
    OMDb Universal Movie Gateway:
    Proxies OMDb to search any movie worldwide with real IMDb posters and metadata.
    Enriches results with live studio claim/licensing status.
    """
    query = request.GET.get('q', '').strip()
    imdb_id = request.GET.get('i', '').strip()

    if imdb_id:
        url = f"http://www.omdbapi.com/?i={imdb_id}&plot=full&apikey=thewdb"
    elif query:
        url = f"http://www.omdbapi.com/?s={requests.utils.quote(query)}&apikey=thewdb"
    else:
        return Response({'results': []})

    # Build lookup of claimed movies
    claimed_movies = {m.imdb_id: m for m in Movie.objects.filter(is_published=True) if m.imdb_id}
    studios = {str(u.id): u.full_name for u in User.objects.filter(role='studio')}

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        if 'Search' in data:
            results = []
            for item in data['Search'][:12]:
                iid = item.get('imdbID')
                existing = claimed_movies.get(iid)
                studio_owner = None
                is_claimed = False
                if existing and existing.studio_id:
                    is_claimed = True
                    studio_owner = studios.get(str(existing.studio_id), 'Production Studio')

                results.append({
                    'imdbID': iid,
                    'title': item.get('Title'),
                    'year': item.get('Year'),
                    'poster': item.get('Poster') if item.get('Poster') != 'N/A' else 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
                    'type': item.get('Type', 'movie'),
                    'is_claimed': is_claimed,
                    'studio_owner': studio_owner,
                    'studio_id': str(existing.studio_id) if (existing and existing.studio_id) else None
                })
            return Response({'results': results})
        return Response(data)
    except Exception as e:
        return Response({'error': str(e), 'results': []}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def claim_movie(request):
    """
    Production Studio Rights Licensing:
    Allows an authenticated production studio to claim exclusive distribution rights for a movie.
    If already claimed by another studio, strictly returns 409 Conflict.
    """
    user_id, role = get_authenticated_user_id(request)
    if not user_id or role not in ['studio', 'admin']:
        return Response({'detail': 'Production studio authentication required to license titles'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    imdb_id = (data.get('imdb_id') or data.get('imdbID') or '').strip()
    title = (data.get('title') or data.get('Title') or '').strip()

    if not imdb_id and not title:
        return Response({'detail': 'imdb_id or title is required to claim a movie'}, status=status.HTTP_400_BAD_REQUEST)

    current_studio = User.objects.filter(id=user_id).first()
    current_studio_name = current_studio.full_name if current_studio else "Your Studio"

    # 1. Check if movie already exists in database
    movie = None
    if imdb_id:
        movie = Movie.objects.filter(imdb_id=imdb_id).first()
    if not movie and title:
        movie = Movie.objects.filter(title__iexact=title).first()

    if movie:
        # Check if already assigned to a studio
        if movie.studio_id:
            if str(movie.studio_id) == str(user_id):
                return Response({
                    'status': 'already_owned',
                    'message': f"'{movie.title}' is already in your studio portfolio.",
                    'movie': MovieSerializer(movie).data
                }, status=status.HTTP_200_OK)
            else:
                owner = User.objects.filter(id=movie.studio_id).first()
                owner_name = owner.full_name if (owner and owner.full_name) else "Another Production Studio"
                return Response({
                    'detail': f"'{movie.title}' is exclusively licensed to {owner_name}. You cannot add it to your production.",
                    'studio_name': owner_name,
                    'studio_id': str(movie.studio_id)
                }, status=status.HTTP_409_CONFLICT)

        # Exists but unclaimed -> assign to current studio
        movie.studio_id = user_id
        if not movie.imdb_id and imdb_id:
            movie.imdb_id = imdb_id
        movie.save()
        return Response({
            'status': 'claimed',
            'message': f"Successfully acquired exclusive distribution rights for '{movie.title}'!",
            'movie': MovieSerializer(movie).data
        }, status=status.HTTP_200_OK)

    # 2. Movie not in database -> Create new title and assign to current studio
    new_id = str(uuid.uuid4())
    poster = data.get('poster_url') or data.get('poster') or data.get('Poster') or 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'
    if poster == 'N/A':
        poster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'

    raw_genres = data.get('genres') or data.get('Genre') or ['Drama']
    if isinstance(raw_genres, str):
        genres = [g.strip() for g in raw_genres.split(',') if g.strip()]
    else:
        genres = list(raw_genres)

    raw_cast = data.get('cast') or data.get('Actors') or []
    if isinstance(raw_cast, str):
        cast = [c.strip() for c in raw_cast.split(',') if c.strip()]
    else:
        cast = list(raw_cast)

    year_str = str(data.get('release_year') or data.get('Year') or '2024')
    m_year = re.search(r'(\d{4})', year_str)
    year = int(m_year.group(1)) if m_year else 2024

    runtime_str = str(data.get('duration_minutes') or data.get('Runtime') or '120')
    m_run = re.search(r'(\d+)', runtime_str)
    duration = int(m_run.group(1)) if m_run else 120

    new_movie = Movie.objects.create(
        id=new_id,
        title=title or 'Untitled Feature',
        description=data.get('description') or data.get('Plot') or 'Production licensed asset.',
        genres=genres,
        release_year=year,
        duration_minutes=duration,
        rating=data.get('rating') or data.get('Rated') or 'PG-13',
        imdb_score=float(data.get('imdb_score') or 8.0) if data.get('imdb_score') else 8.0,
        imdb_id=imdb_id,
        director=data.get('director') or data.get('Director') or 'Director',
        cast=cast,
        tags=genres,
        stream_type='full',
        poster_url=poster,
        backdrop_url=poster,
        studio_id=user_id,
        is_published=True
    )

    return Response({
        'status': 'claimed',
        'message': f"Successfully acquired exclusive distribution rights for '{new_movie.title}'!",
        'movie': MovieSerializer(new_movie).data
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def studio_portfolio(request):
    """
    Returns all movies owned by the authenticated Production Studio along with real-time accrued revenue.
    """
    user_id, role = get_authenticated_user_id(request)
    if not user_id or role not in ['studio', 'admin']:
        return Response({'detail': 'Production studio authentication required'}, status=status.HTTP_403_FORBIDDEN)

    movies = Movie.objects.filter(studio_id=user_id).order_by('-created_at')
    data = MovieSerializer(movies, many=True).data

    total_portfolio_earnings = 0.0
    for item in data:
        logs = RoyaltyLog.objects.filter(movie_id=item['id'])
        earnings = logs.aggregate(total=Sum('accrued_amount'))['total'] or 0.0
        seconds = logs.aggregate(total=Sum('seconds_watched'))['total'] or 0
        streams_count = logs.count()
        item['total_earnings'] = round(earnings, 4)
        item['total_seconds_watched'] = seconds
        item['total_hours_watched'] = round(seconds / 3600.0, 2)
        item['total_streams'] = streams_count
        total_portfolio_earnings += earnings

    return Response({
        'studio_id': user_id,
        'total_portfolio_earnings_usd': round(total_portfolio_earnings, 4),
        'titles_count': len(data),
        'movies': data
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def claimed_status_map(request):
    """
    Returns a lookup table of all claimed titles so the frontend can immediately show availability badges.
    """
    claimed = Movie.objects.filter(studio_id__isnull=False, is_published=True)
    studios = {str(u.id): u.full_name for u in User.objects.filter(role='studio')}

    lookup = {}
    for m in claimed:
        s_name = studios.get(str(m.studio_id), 'Production Studio')
        entry = {
            'claimed': True,
            'studio_id': str(m.studio_id),
            'studio_name': s_name,
            'movie_id': str(m.id),
            'title': m.title
        }
        if m.imdb_id:
            lookup[m.imdb_id] = entry
        lookup[m.title.lower()] = entry

    return Response(lookup)


# ─────────────────────────────────────────────────────────────────────────────
# WATCH HISTORY — per-user, stored in DB
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def watch_history(request):
    """
    GET  → returns the authenticated user's watch history (most recent first)
    POST → logs / updates a watched movie entry (upsert on user_id+movie_id)
    DELETE ?movie_id=X → remove one entry; no body → clear all history
    """
    user_id, _ = get_authenticated_user_id(request)
    if not user_id:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        entries = WatchHistory.objects.filter(user_id=user_id).order_by('-watched_at')[:50]
        data = [{
            'id': e.id,
            'movie_id': e.movie_id,
            'title': e.title,
            'poster_url': e.poster_url,
            'imdb_id': e.imdb_id,
            'genres': e.genres or [],
            'director': e.director,
            'cast': e.cast or [],
            'release_year': e.release_year,
            'progress_seconds': e.progress_seconds,
            'watched_at': e.watched_at.isoformat(),
        } for e in entries]
        return Response(data)

    elif request.method == 'POST':
        d = request.data
        movie_id = d.get('movie_id', '').strip()
        title = d.get('title', '').strip()
        if not movie_id or not title:
            return Response({'detail': 'movie_id and title required'}, status=400)

        entry, created = WatchHistory.objects.update_or_create(
            user_id=user_id,
            movie_id=movie_id,
            defaults={
                'title': title,
                'poster_url': d.get('poster_url'),
                'imdb_id': d.get('imdb_id'),
                'genres': d.get('genres', []),
                'director': d.get('director'),
                'cast': d.get('cast', []),
                'release_year': d.get('release_year'),
                'progress_seconds': d.get('progress_seconds', 0),
                'watched_at': timezone.now(),
            }
        )
        return Response({'status': 'ok', 'created': created}, status=201 if created else 200)

    elif request.method == 'DELETE':
        movie_id = request.GET.get('movie_id')
        if movie_id:
            WatchHistory.objects.filter(user_id=user_id, movie_id=movie_id).delete()
            return Response({'status': 'removed'})
        WatchHistory.objects.filter(user_id=user_id).delete()
        return Response({'status': 'cleared'})


# ─────────────────────────────────────────────────────────────────────────────
# ML RECOMMENDATION ENGINE
# Content-Based TF-IDF + Collaborative Filtering (watch-history co-occurrence)
# ─────────────────────────────────────────────────────────────────────────────

def _tfidf_cosine(vec_a: dict, vec_b: dict) -> float:
    """Cosine similarity between two TF-IDF dicts without numpy."""
    shared = set(vec_a) & set(vec_b)
    dot = sum(vec_a[t] * vec_b[t] for t in shared)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values())) or 1e-9
    norm_b = math.sqrt(sum(v * v for v in vec_b.values())) or 1e-9
    return dot / (norm_a * norm_b)


def _build_tfidf(docs: list[str]) -> list[dict]:
    """Build TF-IDF vectors for a list of text documents (pure Python)."""
    tokenized = [d.lower().split() for d in docs]
    # IDF
    n = len(tokenized)
    df: dict[str, int] = defaultdict(int)
    for tokens in tokenized:
        for t in set(tokens):
            df[t] += 1
    idf = {t: math.log((n + 1) / (c + 1)) + 1 for t, c in df.items()}
    # TF-IDF
    vectors = []
    for tokens in tokenized:
        tf: dict[str, float] = defaultdict(float)
        for t in tokens:
            tf[t] += 1
        total = len(tokens) or 1
        vectors.append({t: (cnt / total) * idf.get(t, 1.0) for t, cnt in tf.items()})
    return vectors


def _movie_doc(m) -> str:
    """Create a text bag-of-words document for a movie."""
    parts = []
    parts += (m.genres or [])
    parts += (m.tags or [])
    if m.director:
        parts += m.director.replace(' ', '_').split(',')
    if m.cast:
        parts += [c.replace(' ', '_') for c in (m.cast or [])[:5]]
    if m.release_year:
        decade = f"decade_{(m.release_year // 10) * 10}"
        parts.append(decade)
    return ' '.join(parts)


def _collaborative_boost(user_history_ids: set, all_users_history: dict) -> dict:
    """
    Simple user-based collaborative filtering:
    Find users whose history overlaps most with this user,
    then score movies they watched that this user hasn't.
    """
    overlap: dict[str, int] = defaultdict(int)     # other_user_id → overlap count
    for other_uid, other_ids in all_users_history.items():
        shared = len(user_history_ids & other_ids)
        if shared > 0:
            overlap[other_uid] = shared

    # Aggregate scores for unseen movies from similar users (weighted by overlap)
    movie_scores: dict[str, float] = defaultdict(float)
    for other_uid, sim in overlap.items():
        for mid in all_users_history[other_uid] - user_history_ids:
            movie_scores[mid] += sim

    return movie_scores


@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations_for_me(request):
    """
    Personalised ML recommendation endpoint.

    Algorithm:
      1. Pull user's watch history from DB
      2. Content-based TF-IDF cosine similarity against all movies in DB
      3. Collaborative boost: upweight movies watched by similar-taste users
      4. Merge scores, exclude already-watched, return top-N
      5. Fallback to trending (highest IMDB) if no history

    Also returns: trending (top IMDB score), and per-genre shelves.
    """
    user_id, _ = get_authenticated_user_id(request)

    all_movies = list(Movie.objects.filter(is_published=True))
    movie_index = {str(m.id): m for m in all_movies}
    imdb_index  = {m.imdb_id: m for m in all_movies if m.imdb_id}

    def serialize_movie(m):
        return {
            'id': str(m.id),
            'title': m.title,
            'poster_url': m.poster_url,
            'backdrop_url': m.backdrop_url,
            'imdb_id': m.imdb_id,
            'genres': m.genres or [],
            'release_year': m.release_year,
            'imdb_score': m.imdb_score,
            'director': m.director,
            'cast': m.cast or [],
            'description': m.description,
            'trailer_youtube_id': m.trailer_youtube_id,
            'stream_type': m.stream_type,
            'duration_minutes': m.duration_minutes,
            'rating': m.rating,
            'studio_id': str(m.studio_id) if m.studio_id else None,
        }

    # ── Trending: top 20 by IMDB score ────────────────────────────────────
    trending = sorted(all_movies, key=lambda m: (m.imdb_score or 0), reverse=True)[:20]
    trending_data = [serialize_movie(m) for m in trending]

    # ── Genre shelves ──────────────────────────────────────────────────────
    genre_map: dict[str, list] = defaultdict(list)
    for m in sorted(all_movies, key=lambda m: (m.imdb_score or 0), reverse=True):
        for g in (m.genres or []):
            if len(genre_map[g]) < 20:
                genre_map[g].append(serialize_movie(m))

    PREFERRED_GENRES = [
        'Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Horror',
        'Romance', 'Crime', 'Animation', 'Adventure', 'Mystery', 'Fantasy'
    ]
    genre_shelves = {}
    for g in PREFERRED_GENRES:
        if g in genre_map and len(genre_map[g]) >= 4:
            genre_shelves[g] = genre_map[g]
    for g, movies in genre_map.items():
        if g not in genre_shelves and len(movies) >= 4:
            genre_shelves[g] = movies

    # ── If not logged in → return trending + genres only ──────────────────
    if not user_id:
        return Response({
            'personalised': [],
            'trending': trending_data,
            'genres': genre_shelves,
            'history': [],
        })

    # ── User history ──────────────────────────────────────────────────────
    user_entries = list(WatchHistory.objects.filter(user_id=user_id).order_by('-watched_at')[:30])
    history_data = [{
        'id': e.id,
        'movie_id': e.movie_id,
        'title': e.title,
        'poster_url': e.poster_url,
        'imdb_id': e.imdb_id,
        'genres': e.genres or [],
        'director': e.director,
        'progress_seconds': e.progress_seconds,
        'watched_at': e.watched_at.isoformat(),
    } for e in user_entries]

    if not user_entries:
        return Response({
            'personalised': [],
            'trending': trending_data,
            'genres': genre_shelves,
            'history': [],
        })

    # ── Resolve watched movie IDs ──────────────────────────────────────────
    watched_ids: set[str] = set()
    for e in user_entries:
        watched_ids.add(e.movie_id)
        if e.imdb_id:
            watched_ids.add(e.imdb_id)

    # ── Build TF-IDF for all DB movies ───────────────────────────────────
    docs = [_movie_doc(m) for m in all_movies]
    tfidf_vecs = _build_tfidf(docs)
    movie_vec_map = {str(all_movies[i].id): tfidf_vecs[i] for i in range(len(all_movies))}

    # ── Build user preference vector (avg of watched movie vectors) ───────
    user_vec: dict[str, float] = defaultdict(float)
    matched = 0
    for e in user_entries:
        m_obj = movie_index.get(e.movie_id) or imdb_index.get(e.imdb_id or '')
        if m_obj:
            for term, val in movie_vec_map.get(str(m_obj.id), {}).items():
                user_vec[term] += val
            matched += 1
    if matched > 0:
        user_vec = {t: v / matched for t, v in user_vec.items()}

    # ── Content-based scores ───────────────────────────────────────────────
    cb_scores: dict[str, float] = {}
    for m in all_movies:
        mid = str(m.id)
        if mid in watched_ids or (m.imdb_id and m.imdb_id in watched_ids):
            continue
        cb_scores[mid] = _tfidf_cosine(user_vec, movie_vec_map.get(mid, {}))

    # ── Collaborative boost ───────────────────────────────────────────────
    all_history_qs = WatchHistory.objects.exclude(user_id=user_id).values('user_id', 'movie_id')
    all_users_hist: dict[str, set] = defaultdict(set)
    for row in all_history_qs:
        all_users_hist[row['user_id']].add(row['movie_id'])

    collab_scores = _collaborative_boost(watched_ids, all_users_hist)

    # ── Merge: content_based * 0.7 + collab * 0.3 (normalised) ──────────
    max_collab = max(collab_scores.values(), default=1) or 1
    final_scores: dict[str, float] = {}
    for mid, cb in cb_scores.items():
        collab = collab_scores.get(mid, 0) / max_collab
        final_scores[mid] = cb * 0.7 + collab * 0.3

    # ── Sort and return top 20 ─────────────────────────────────────────────
    top_ids = sorted(final_scores, key=lambda x: final_scores[x], reverse=True)[:20]
    personalised = [serialize_movie(movie_index[mid]) for mid in top_ids if mid in movie_index]

    return Response({
        'personalised': personalised,
        'trending': trending_data,
        'genres': genre_shelves,
        'history': history_data,
    })
