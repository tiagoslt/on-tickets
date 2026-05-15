from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, UserRoleUpdateSerializer,
    LoginSerializer, ChangePasswordSerializer, AdminPasswordResetSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'erro': 'E-mail ou senha incorretos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.check_password(password):
        return Response(
            {'erro': 'E-mail ou senha incorretos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {'erro': 'Usuário desativado. Entre em contato com o administrador.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    tokens = get_tokens_for_user(user)
    return Response({
        'tokens': tokens,
        'usuario': UserSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['current_password']):
        return Response(
            {'erro': 'Senha atual incorreta.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'mensagem': 'Senha alterada com sucesso.'})


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        # Gestor pode listar usuários (para atribuição de tickets), mas não criar
        if request.method == 'POST' and request.user.role != 'admin':
            self.permission_denied(request, message='Apenas administradores podem criar usuários.')
        elif request.method == 'GET' and request.user.role not in ('admin', 'gestor'):
            self.permission_denied(request, message='Acesso negado.')

    def get_queryset(self):
        queryset = User.objects.all().order_by('first_name', 'last_name')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return UserRoleUpdateSerializer
        return UserSerializer

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method in ('PATCH', 'PUT') and request.user.role != 'admin':
            self.permission_denied(request, message='Apenas administradores podem alterar perfis.')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reset_password(request, pk):
    if request.user.role != 'admin':
        return Response(
            {'erro': 'Apenas administradores podem redefinir senhas.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'erro': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminPasswordResetSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'mensagem': 'Senha redefinida com sucesso.'})
