import uuid
import bcrypt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from .models import User
from .serializers import UserSerializer

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
            return True
    except Exception:
        pass
    try:
        import passlib.hash
        return passlib.hash.bcrypt.verify(password, hashed)
    except Exception:
        pass
    return False

def generate_user_token(user):
    token = AccessToken()
    token['sub'] = str(user.id)
    token['email'] = user.email
    token['role'] = user.role
    return str(token)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '')
    role = data.get('role', 'viewer')

    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'detail': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

    hashed = hash_password(password)
    user = User.objects.create(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hashed,
        full_name=full_name or email.split('@')[0],
        role=role if role in ['viewer', 'studio', 'admin'] else 'viewer',
        subscription_tier='standard'
    )

    access_token = generate_user_token(user)
    return Response({
        'access_token': access_token,
        'token_type': 'bearer',
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if not verify_password(password, user.hashed_password):
        return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    access_token = generate_user_token(user)
    return Response({
        'access_token': access_token,
        'token_type': 'bearer',
        'user': UserSerializer(user).data
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'detail': 'Authorization token required'}, status=status.HTTP_401_UNAUTHORIZED)

    token_str = auth_header.split(' ')[1]
    try:
        token = AccessToken(token_str)
        user_id = token['sub']
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)
    except Exception as e:
        return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
