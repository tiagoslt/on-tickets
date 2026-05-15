"""
Configuração do painel admin para o app de tickets.
"""
from django.contrib import admin
from .models import Ticket, TicketComment, TicketHistory, SLAConfig, Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_by', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(SLAConfig)
class SLAConfigAdmin(admin.ModelAdmin):
    """Administração das configurações de SLA."""
    list_display = ['priority', 'sla_hours']
    ordering = ['priority']


class TicketCommentInline(admin.TabularInline):
    """Comentários exibidos inline no ticket."""
    model = TicketComment
    extra = 0
    readonly_fields = ['author', 'created_at']


class TicketHistoryInline(admin.TabularInline):
    """Histórico exibido inline no ticket."""
    model = TicketHistory
    extra = 0
    readonly_fields = ['changed_by', 'field_changed', 'old_value', 'new_value', 'changed_at']
    can_delete = False


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Administração dos tickets."""
    list_display = ['id', 'ticket_number', 'title', 'status', 'priority', 'client', 'assigned_to', 'created_by', 'created_at', 'sla_deadline']
    list_filter = ['status', 'priority', 'client', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at', 'sla_deadline']
    raw_id_fields = ['assigned_to', 'created_by']
    inlines = [TicketCommentInline, TicketHistoryInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('assigned_to', 'created_by')


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    """Administração dos comentários."""
    list_display = ['ticket', 'author', 'created_at']
    readonly_fields = ['created_at']
    raw_id_fields = ['ticket', 'author']


@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    """Administração do histórico de tickets."""
    list_display = ['ticket', 'field_changed', 'old_value', 'new_value', 'changed_by', 'changed_at']
    readonly_fields = ['changed_at']
    raw_id_fields = ['ticket', 'changed_by']
