import uuid
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from .models import RoyaltyLog
from movies.models import Movie, Contract

def get_authenticated_user_id(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            token = AccessToken(auth_header.split(' ')[1])
            return str(token['sub']), token.get('role', 'viewer')
        except Exception:
            return None, None
    return None, None

@api_view(['POST'])
@permission_classes([AllowAny])
def record_heartbeat(request):
    data = request.data
    movie_id = data.get('movie_id')
    seconds_watched = int(data.get('seconds_watched', 10))
    resolution = data.get('playback_resolution', '1080p')
    country = data.get('user_country', 'IN')

    if not movie_id:
        return Response({'detail': 'movie_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    movie = Movie.objects.filter(id=movie_id).first()
    if not movie:
        movie = Movie.objects.filter(imdb_id=movie_id).first()

    if not movie or not movie.studio_id:
        return Response({
            'status': 'unclaimed_stream',
            'detail': 'Title is currently unclaimed or has no owning studio. No studio royalty accrued.',
            'accrued_amount': 0.0
        }, status=status.HTTP_200_OK)

    # Calculate micro-royalty
    hourly_rate = 0.15
    contract = Contract.objects.filter(movie_id=movie.id, status='active').first()
    if contract and contract.royalty_rate_per_hour:
        hourly_rate = contract.royalty_rate_per_hour

    accrued = round((hourly_rate / 3600.0) * seconds_watched, 6)

    user_id, _ = get_authenticated_user_id(request)
    client_ip = request.META.get('REMOTE_ADDR')

    log = RoyaltyLog.objects.create(
        id=str(uuid.uuid4()),
        movie_id=movie.id,
        user_id=user_id,
        studio_id=movie.studio_id,
        seconds_watched=seconds_watched,
        accrued_amount=accrued,
        playback_resolution=resolution,
        user_country=country,
        ip_address=client_ip,
        timestamp=timezone.now()
    )

    total_movie_earnings = RoyaltyLog.objects.filter(movie_id=movie.id).aggregate(
        total=Sum('accrued_amount')
    )['total'] or 0.0

    return Response({
        'status': 'success',
        'accrued_amount': accrued,
        'total_movie_earnings': round(total_movie_earnings, 4),
        'timestamp': log.timestamp.isoformat()
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def studio_accounting_summary(request):
    studio_id, role = get_authenticated_user_id(request)
    if not studio_id or role not in ['studio', 'admin']:
        return Response({'detail': 'Studio authentication required'}, status=status.HTTP_403_FORBIDDEN)

    studio_movies = Movie.objects.filter(studio_id=studio_id)
    movie_ids = [m.id for m in studio_movies]

    logs = RoyaltyLog.objects.filter(studio_id=studio_id)
    total_earnings = logs.aggregate(total=Sum('accrued_amount'))['total'] or 0.0
    total_seconds = logs.aggregate(total=Sum('seconds_watched'))['total'] or 0
    total_heartbeats = logs.count()

    # Per-movie breakdown
    movies_summary = []
    for m in studio_movies:
        m_logs = logs.filter(movie_id=m.id)
        m_earnings = m_logs.aggregate(total=Sum('accrued_amount'))['total'] or 0.0
        m_seconds = m_logs.aggregate(total=Sum('seconds_watched'))['total'] or 0
        movies_summary.append({
            'movie_id': m.id,
            'title': m.title,
            'stream_type': m.stream_type,
            'video_url': m.video_url,
            'poster_url': m.poster_url,
            'total_seconds_watched': m_seconds,
            'total_hours_watched': round(m_seconds / 3600.0, 2),
            'total_earnings': round(m_earnings, 4)
        })

    return Response({
        'studio_id': studio_id,
        'total_earnings_usd': round(total_earnings, 4),
        'total_hours_streamed': round(total_seconds / 3600.0, 3),
        'total_heartbeats_logged': total_heartbeats,
        'hosted_titles_count': studio_movies.count(),
        'movies': movies_summary
    })
