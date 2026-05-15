"""
Views de analytics e KPIs do sistema OPA.
"""
from datetime import timedelta
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField, Q
from django.db.models.functions import TruncDay, TruncWeek
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from tickets.models import Ticket
from accounts.models import User


def get_date_filters(request):
    """
    Extrai e valida os parâmetros de filtro de data da request.
    Retorna (start_date, end_date) ou (None, None) se não fornecidos.
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    return start_date, end_date


def apply_date_filter(queryset, start_date, end_date, date_field='created_at'):
    """Aplica filtro de data ao queryset."""
    if start_date:
        queryset = queryset.filter(**{f'{date_field}__date__gte': start_date})
    if end_date:
        queryset = queryset.filter(**{f'{date_field}__date__lte': end_date})
    return queryset


def check_analytics_permission(request):
    """Verifica se o usuário tem permissão para acessar analytics."""
    return request.user.role in ('admin', 'gestor')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    """
    Resumo geral de tickets por status.
    Filtros: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    """
    start_date, end_date = get_date_filters(request)

    # Base queryset conforme perfil do usuário
    if request.user.role in ('admin', 'gestor'):
        queryset = Ticket.objects.all()
    else:
        queryset = Ticket.objects.filter(
            Q(assigned_to=request.user) | Q(created_by=request.user)
        )

    queryset = apply_date_filter(queryset, start_date, end_date)

    # Contagem por status
    by_status = queryset.values('status').annotate(total=Count('id'))
    status_counts = {item['status']: item['total'] for item in by_status}

    total = queryset.count()
    resolvidos_hoje = queryset.filter(
        resolved_at__date=timezone.now().date()
    ).count()

    # Tickets com SLA em risco (não resolvidos e prazo próximo ou vencido)
    agora = timezone.now()
    sla_em_risco = queryset.filter(
        ~Q(status='resolvido'),
        sla_deadline__isnull=False,
        sla_deadline__lte=agora + timedelta(hours=4),
    ).count()

    return Response({
        'total': total,
        'por_status': {
            'aberto': status_counts.get('aberto', 0),
            'em_andamento': status_counts.get('em_andamento', 0),
            'aguardando_cliente': status_counts.get('aguardando_cliente', 0),
            'resolvido': status_counts.get('resolvido', 0),
        },
        'resolvidos_hoje': resolvidos_hoje,
        'sla_em_risco': sla_em_risco,
        'periodo': {
            'inicio': start_date,
            'fim': end_date,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_by_analyst(request):
    """
    Desempenho por analista.
    Retorna: total, resolvidos, % conformidade SLA, TMR (tempo médio de resolução).
    Restrito a gestores e administradores.
    """
    if not check_analytics_permission(request):
        return Response(
            {'erro': 'Apenas gestores e administradores podem acessar este relatório.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    start_date, end_date = get_date_filters(request)
    queryset = Ticket.objects.all()
    queryset = apply_date_filter(queryset, start_date, end_date)

    # Agrupa por analista
    analysts = User.objects.filter(role='analista', is_active=True)
    result = []

    for analyst in analysts:
        analyst_tickets = queryset.filter(assigned_to=analyst)
        total = analyst_tickets.count()
        resolvidos = analyst_tickets.filter(status='resolvido').count()

        # Tickets resolvidos dentro do SLA
        resolvidos_no_sla = analyst_tickets.filter(
            status='resolvido',
            resolved_at__isnull=False,
            sla_deadline__isnull=False,
            resolved_at__lte=F('sla_deadline'),
        ).count()

        # Conformidade SLA (%)
        sla_compliance = round((resolvidos_no_sla / resolvidos * 100), 1) if resolvidos > 0 else 0.0

        # Tempo médio de resolução (TMR) em horas
        tmr_data = analyst_tickets.filter(
            status='resolvido',
            resolved_at__isnull=False,
        ).annotate(
            resolution_time=ExpressionWrapper(
                F('resolved_at') - F('created_at'),
                output_field=DurationField(),
            )
        ).aggregate(avg_resolution=Avg('resolution_time'))

        avg_resolution = tmr_data['avg_resolution']
        tmr_hours = round(avg_resolution.total_seconds() / 3600, 1) if avg_resolution else None

        # Tickets ativos por status
        abertos = analyst_tickets.filter(status='aberto').count()
        em_andamento = analyst_tickets.filter(status='em_andamento').count()

        result.append({
            'analista': {
                'id': analyst.id,
                'nome': analyst.get_full_name() or analyst.email,
                'email': analyst.email,
                'avatar_url': analyst.avatar_url,
            },
            'total': total,
            'resolvidos': resolvidos,
            'abertos': abertos,
            'em_andamento': em_andamento,
            'sla_compliance_pct': sla_compliance,
            'tmr_horas': tmr_hours,
        })

    # Ordena por total decrescente
    result.sort(key=lambda x: x['total'], reverse=True)

    return Response({
        'analistas': result,
        'periodo': {'inicio': start_date, 'fim': end_date},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_sla(request):
    """
    Relatório de conformidade e violações de SLA.
    Restrito a gestores e administradores.
    """
    if not check_analytics_permission(request):
        return Response(
            {'erro': 'Apenas gestores e administradores podem acessar este relatório.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    start_date, end_date = get_date_filters(request)
    queryset = Ticket.objects.filter(sla_deadline__isnull=False)
    queryset = apply_date_filter(queryset, start_date, end_date)

    total_com_sla = queryset.count()
    agora = timezone.now()

    # Tickets resolvidos dentro do SLA
    resolvidos_no_sla = queryset.filter(
        status='resolvido',
        resolved_at__isnull=False,
        resolved_at__lte=F('sla_deadline'),
    ).count()

    # Tickets resolvidos com SLA violado
    resolvidos_fora_sla = queryset.filter(
        status='resolvido',
        resolved_at__isnull=False,
        resolved_at__gt=F('sla_deadline'),
    ).count()

    # Tickets abertos com SLA já vencido
    abertos_com_sla_vencido = queryset.filter(
        ~Q(status='resolvido'),
        sla_deadline__lt=agora,
    ).count()

    # Tickets abertos com SLA em risco (vence em até 4h)
    abertos_sla_em_risco = queryset.filter(
        ~Q(status='resolvido'),
        sla_deadline__gte=agora,
        sla_deadline__lte=agora + timedelta(hours=4),
    ).count()

    # Conformidade geral (apenas tickets resolvidos)
    total_resolvidos = resolvidos_no_sla + resolvidos_fora_sla
    conformidade_geral = round(
        (resolvidos_no_sla / total_resolvidos * 100), 1
    ) if total_resolvidos > 0 else 0.0

    # SLA por prioridade
    sla_por_prioridade = []
    for priority in ['critica', 'alta', 'media', 'baixa']:
        pq = queryset.filter(priority=priority)
        p_total_resolvidos = pq.filter(status='resolvido', resolved_at__isnull=False).count()
        p_no_sla = pq.filter(
            status='resolvido',
            resolved_at__isnull=False,
            resolved_at__lte=F('sla_deadline'),
        ).count()
        p_compliance = round((p_no_sla / p_total_resolvidos * 100), 1) if p_total_resolvidos > 0 else 0.0

        sla_por_prioridade.append({
            'prioridade': priority,
            'total_resolvidos': p_total_resolvidos,
            'dentro_do_sla': p_no_sla,
            'compliance_pct': p_compliance,
        })

    return Response({
        'total_com_sla': total_com_sla,
        'resolvidos_no_sla': resolvidos_no_sla,
        'resolvidos_fora_sla': resolvidos_fora_sla,
        'abertos_com_sla_vencido': abertos_com_sla_vencido,
        'abertos_sla_em_risco': abertos_sla_em_risco,
        'conformidade_geral_pct': conformidade_geral,
        'por_prioridade': sla_por_prioridade,
        'periodo': {'inicio': start_date, 'fim': end_date},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_volume(request):
    """
    Volume de tickets criados por dia ou semana.
    Filtros: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&agrupamento=dia|semana
    """
    start_date, end_date = get_date_filters(request)
    agrupamento = request.query_params.get('agrupamento', 'dia')

    if request.user.role in ('admin', 'gestor'):
        queryset = Ticket.objects.all()
    else:
        queryset = Ticket.objects.filter(
            Q(assigned_to=request.user) | Q(created_by=request.user)
        )

    # Aplica filtro de datas (padrão: últimos 30 dias)
    if not start_date and not end_date:
        queryset = queryset.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        )
    else:
        queryset = apply_date_filter(queryset, start_date, end_date)

    # Agrupa por período
    if agrupamento == 'semana':
        volume_data = queryset.annotate(
            periodo=TruncWeek('created_at')
        ).values('periodo').annotate(
            total=Count('id'),
            resolvidos=Count('id', filter=Q(status='resolvido')),
        ).order_by('periodo')
    else:
        volume_data = queryset.annotate(
            periodo=TruncDay('created_at')
        ).values('periodo').annotate(
            total=Count('id'),
            resolvidos=Count('id', filter=Q(status='resolvido')),
        ).order_by('periodo')

    dados = [
        {
            'periodo': item['periodo'].strftime('%Y-%m-%d') if item['periodo'] else None,
            'total': item['total'],
            'resolvidos': item['resolvidos'],
        }
        for item in volume_data
    ]

    return Response({
        'agrupamento': agrupamento,
        'dados': dados,
        'periodo': {'inicio': start_date, 'fim': end_date},
    })
