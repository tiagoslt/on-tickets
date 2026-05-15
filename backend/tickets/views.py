"""
Views para gerenciamento de tickets, comentários e histórico.
"""
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Ticket, TicketComment, TicketHistory, SLAConfig, Client
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateSerializer,
    TicketAssignSerializer,
    TicketStatusSerializer,
    TicketCommentSerializer,
    SLAConfigSerializer,
    ClientSerializer,
)


def record_history(ticket, user, field, old_val, new_val):
    """Registra uma alteração no histórico do ticket."""
    if str(old_val) != str(new_val):
        TicketHistory.objects.create(
            ticket=ticket,
            changed_by=user,
            field_changed=field,
            old_value=str(old_val) if old_val is not None else '',
            new_value=str(new_val) if new_val is not None else '',
        )


def get_ticket_queryset_for_user(user):
    """
    Retorna o queryset de tickets conforme o perfil do usuário:
    - Admin/Gestor: todos os tickets
    - Analista: apenas tickets atribuídos a ele ou criados por ele
    """
    if user.role in ('admin', 'gestor'):
        return Ticket.objects.all().select_related('assigned_to', 'created_by')
    return Ticket.objects.filter(
        Q(assigned_to=user) | Q(created_by=user)
    ).select_related('assigned_to', 'created_by')


class TicketListCreateView(generics.ListCreateAPIView):
    """
    GET: Lista tickets conforme permissões do usuário.
    POST: Cria um novo ticket.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TicketCreateSerializer
        return TicketListSerializer

    def get_queryset(self):
        queryset = get_ticket_queryset_for_user(self.request.user)

        # Filtros opcionais
        status_filter = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        analyst_id = self.request.query_params.get('analyst_id')
        client_id = self.request.query_params.get('client_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        search = self.request.query_params.get('search')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority:
            queryset = queryset.filter(priority=priority)
        if analyst_id and self.request.user.role in ('admin', 'gestor'):
            queryset = queryset.filter(assigned_to_id=analyst_id)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save(created_by=request.user)
        TicketHistory.objects.create(
            ticket=ticket,
            changed_by=request.user,
            field_changed='status',
            old_value='',
            new_value='aberto',
        )
        return Response(TicketDetailSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Detalhes do ticket com comentários e histórico.
    PATCH: Atualiza campos do ticket.
    DELETE: Remove o ticket (somente admin).
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return TicketUpdateSerializer
        return TicketDetailSerializer

    def get_queryset(self):
        return get_ticket_queryset_for_user(self.request.user).prefetch_related(
            'comments__author',
            'history__changed_by',
        )

    def perform_update(self, serializer):
        ticket = self.get_object()
        old_data = {
            'title': ticket.title,
            'description': ticket.description,
            'priority': ticket.priority,
            'client': ticket.client,
            'assigned_to': ticket.assigned_to,
            'ticket_link': ticket.ticket_link,
        }
        updated = serializer.save()
        for field, old_val in old_data.items():
            new_val = getattr(updated, field)
            old_str = str(old_val) if old_val else ''
            new_str = str(new_val) if new_val else ''
            record_history(updated, self.request.user, field, old_str, new_str)

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Apenas administradores podem excluir tickets.')
        instance.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_assign(request, pk):
    """
    Atribui o ticket a um analista.
    Restrito a gestores e administradores.
    """
    if request.user.role not in ('admin', 'gestor'):
        return Response(
            {'erro': 'Apenas gestores e administradores podem atribuir tickets.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        ticket = Ticket.objects.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({'erro': 'Ticket não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TicketAssignSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    analyst = serializer.validated_data['analyst_id']
    old_assigned = ticket.assigned_to

    ticket.assigned_to = analyst
    ticket.save()

    record_history(
        ticket,
        request.user,
        'assigned_to',
        str(old_assigned) if old_assigned else '',
        str(analyst),
    )

    return Response(TicketDetailSerializer(ticket).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_change_status(request, pk):
    """
    Muda o status de um ticket.
    - Admin/Gestor: pode mudar status de qualquer ticket
    - Analista: pode mudar status dos seus tickets
    """
    queryset = get_ticket_queryset_for_user(request.user)
    try:
        ticket = queryset.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({'erro': 'Ticket não encontrado ou sem permissão.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TicketStatusSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_status = serializer.validated_data['status']
    comment_text = serializer.validated_data.get('comment', '')
    old_status = ticket.status

    ticket.status = new_status
    ticket.save()

    record_history(ticket, request.user, 'status', old_status, new_status)

    # Adiciona comentário sobre a mudança de status se fornecido
    if comment_text:
        TicketComment.objects.create(
            ticket=ticket,
            author=request.user,
            content=comment_text,
        )

    return Response(TicketDetailSerializer(ticket).data)


class TicketCommentListCreateView(generics.ListCreateAPIView):
    """
    GET: Lista comentários do ticket.
    POST: Adiciona comentário ao ticket.
    """
    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        ticket_id = self.kwargs['pk']
        # Verifica se o usuário tem acesso ao ticket
        get_ticket_queryset_for_user(self.request.user).get(pk=ticket_id)
        return TicketComment.objects.filter(ticket_id=ticket_id).select_related('author')

    def perform_create(self, serializer):
        ticket_id = self.kwargs['pk']
        try:
            ticket = get_ticket_queryset_for_user(self.request.user).get(pk=ticket_id)
        except Ticket.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Ticket não encontrado ou sem permissão.')
        serializer.save(ticket=ticket, author=self.request.user)


class ClientListCreateView(generics.ListCreateAPIView):
    """Lista clientes (todos autenticados) ou cria novo (gestor/admin)."""
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Client.objects.all()
        if self.request.query_params.get('active_only', 'true') == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method == 'POST' and request.user.role not in ('admin', 'gestor'):
            self.permission_denied(request, message='Apenas gestores e administradores podem cadastrar clientes.')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalhe, atualização e remoção de cliente (gestor/admin)."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and request.user.role not in ('admin', 'gestor'):
            self.permission_denied(request, message='Apenas gestores e administradores podem editar clientes.')


class SLAConfigListView(generics.ListAPIView):
    """Lista configurações de SLA."""
    queryset = SLAConfig.objects.all()
    serializer_class = SLAConfigSerializer
    permission_classes = [IsAuthenticated]


class SLAConfigDetailView(generics.RetrieveUpdateAPIView):
    """Atualiza uma configuração de SLA (somente admin)."""
    queryset = SLAConfig.objects.all()
    serializer_class = SLAConfigSerializer
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ('GET', 'HEAD', 'OPTIONS') and request.user.role != 'admin':
            self.permission_denied(request, message='Apenas administradores podem alterar configurações de SLA.')
