"""
Modelos de tickets, comentários e histórico do sistema OPA.
"""
from django.db import models
from django.utils import timezone
from accounts.models import User


# Opções de prioridade
PRIORITY_CHOICES = [
    ('baixa', 'Baixa'),
    ('media', 'Média'),
    ('alta', 'Alta'),
    ('critica', 'Crítica'),
]

# Horas de SLA padrão por prioridade
DEFAULT_SLA_HOURS = {
    'baixa': 72,
    'media': 48,
    'alta': 24,
    'critica': 4,
}


class Client(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name='Nome')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='clients_created', verbose_name='Criado por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['name']

    def __str__(self):
        return self.name


class SLAConfig(models.Model):
    """
    Configuração de SLA por prioridade.
    Define quantas horas o ticket pode ficar aberto antes de violar o SLA.
    """
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        unique=True,
        verbose_name='Prioridade',
    )
    sla_hours = models.IntegerField(
        verbose_name='Horas de SLA',
    )

    class Meta:
        verbose_name = 'Configuração de SLA'
        verbose_name_plural = 'Configurações de SLA'
        ordering = ['priority']

    def __str__(self):
        return f'SLA {self.get_priority_display()}: {self.sla_hours}h'

    @classmethod
    def get_sla_hours(cls, priority):
        """Retorna as horas de SLA para uma prioridade. Usa o padrão se não configurado."""
        try:
            config = cls.objects.get(priority=priority)
            return config.sla_hours
        except cls.DoesNotExist:
            return DEFAULT_SLA_HOURS.get(priority, 48)


class Ticket(models.Model):
    """
    Modelo principal de ticket de suporte.
    """
    STATUS_CHOICES = [
        ('aberto', 'Aberto'),
        ('em_andamento', 'Em Andamento'),
        ('aguardando_cliente', 'Aguardando Cliente'),
        ('resolvido', 'Resolvido'),
    ]

    ticket_number = models.CharField(
        max_length=100,
        default='',
        verbose_name='Número do Ticket',
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Título',
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descrição',
    )
    ticket_link = models.URLField(
        blank=True,
        verbose_name='Link do Ticket',
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='aberto',
        verbose_name='Status',
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='media',
        verbose_name='Prioridade',
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='Responsável',
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_tickets',
        verbose_name='Criado por',
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name='Cliente',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criado em',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Atualizado em',
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Resolvido em',
    )
    sla_deadline = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Prazo do SLA',
    )

    class Meta:
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.pk} - {self.title}'

    @property
    def sla_breached(self):
        """Verifica se o SLA foi violado."""
        if not self.sla_deadline:
            return False
        if self.status == 'resolvido' and self.resolved_at:
            return self.resolved_at > self.sla_deadline
        if self.status != 'resolvido':
            return timezone.now() > self.sla_deadline
        return False

    @property
    def sla_remaining_hours(self):
        """Retorna as horas restantes até o prazo do SLA (negativo se violado)."""
        if not self.sla_deadline:
            return None
        now = self.resolved_at if self.status == 'resolvido' and self.resolved_at else timezone.now()
        delta = self.sla_deadline - now
        return delta.total_seconds() / 3600

    def save(self, *args, **kwargs):
        """
        Sobrescreve save para:
        1. Calcular sla_deadline na criação
        2. Registrar resolved_at ao mudar status para 'resolvido'
        3. Registrar histórico de mudanças
        """
        # Verifica se é uma instância nova
        is_new = self.pk is None

        if is_new:
            # Calcula o prazo do SLA na criação
            # sla_deadline será calculado após o save pois created_at usa auto_now_add
            super().save(*args, **kwargs)
            sla_hours = SLAConfig.get_sla_hours(self.priority)
            from datetime import timedelta
            self.sla_deadline = self.created_at + timedelta(hours=sla_hours)
            # Atualiza sem criar histórico novamente
            Ticket.objects.filter(pk=self.pk).update(sla_deadline=self.sla_deadline)
            return

        # Para instâncias existentes, rastreia mudanças
        try:
            old = Ticket.objects.get(pk=self.pk)
        except Ticket.DoesNotExist:
            super().save(*args, **kwargs)
            return

        # Registra resolved_at quando status muda para 'resolvido'
        if old.status != 'resolvido' and self.status == 'resolvido':
            if not self.resolved_at:
                self.resolved_at = timezone.now()
        elif self.status != 'resolvido':
            self.resolved_at = None

        # Recalcula SLA se prioridade mudou
        if old.priority != self.priority:
            sla_hours = SLAConfig.get_sla_hours(self.priority)
            from datetime import timedelta
            self.sla_deadline = self.created_at + timedelta(hours=sla_hours)

        super().save(*args, **kwargs)


class TicketComment(models.Model):
    """
    Comentário em um ticket.
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Ticket',
    )
    author = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='comments',
        verbose_name='Autor',
    )
    content = models.TextField(verbose_name='Conteúdo')
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criado em',
    )

    class Meta:
        verbose_name = 'Comentário'
        verbose_name_plural = 'Comentários'
        ordering = ['created_at']

    def __str__(self):
        return f'Comentário de {self.author} no ticket #{self.ticket_id}'


class TicketHistory(models.Model):
    """
    Histórico de alterações de um ticket.
    Registra cada mudança de campo com valor anterior e novo.
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Ticket',
    )
    changed_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        verbose_name='Alterado por',
    )
    field_changed = models.CharField(
        max_length=100,
        verbose_name='Campo alterado',
    )
    old_value = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Valor anterior',
    )
    new_value = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Novo valor',
    )
    changed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Alterado em',
    )

    class Meta:
        verbose_name = 'Histórico de Ticket'
        verbose_name_plural = 'Históricos de Tickets'
        ordering = ['-changed_at']

    def __str__(self):
        return f'Ticket #{self.ticket_id}: {self.field_changed} alterado por {self.changed_by}'
