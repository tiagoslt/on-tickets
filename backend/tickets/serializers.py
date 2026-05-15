from rest_framework import serializers
from accounts.serializers import UserMinimalSerializer
from accounts.models import User
from .models import Ticket, TicketComment, TicketHistory, SLAConfig, Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SLAConfigSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = SLAConfig
        fields = ['id', 'priority', 'priority_display', 'sla_hours']


class TicketHistorySerializer(serializers.ModelSerializer):
    changed_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TicketHistory
        fields = ['id', 'field_changed', 'old_value', 'new_value', 'changed_by', 'changed_at']


class TicketCommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = TicketComment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class TicketListSerializer(serializers.ModelSerializer):
    assigned_to = UserMinimalSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    client = ClientSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    sla_breached = serializers.BooleanField(read_only=True)
    sla_remaining_hours = serializers.FloatField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description', 'ticket_link',
            'status', 'status_display', 'priority', 'priority_display',
            'assigned_to', 'created_by', 'client',
            'created_at', 'updated_at', 'resolved_at',
            'sla_deadline', 'sla_breached', 'sla_remaining_hours',
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    assigned_to = UserMinimalSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    client = ClientSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    sla_breached = serializers.BooleanField(read_only=True)
    sla_remaining_hours = serializers.FloatField(read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)
    history = TicketHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description', 'ticket_link',
            'status', 'status_display', 'priority', 'priority_display',
            'assigned_to', 'created_by', 'client',
            'created_at', 'updated_at', 'resolved_at',
            'sla_deadline', 'sla_breached', 'sla_remaining_hours',
            'comments', 'history',
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='analista'),
        source='assigned_to',
        required=False,
        allow_null=True,
    )
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.filter(is_active=True),
        source='client',
        required=True,
    )

    class Meta:
        model = Ticket
        fields = ['ticket_number', 'title', 'description', 'ticket_link', 'priority', 'client_id', 'assigned_to_id']

    def validate_ticket_number(self, value):
        if Ticket.objects.filter(ticket_number=value).exists():
            raise serializers.ValidationError('Já existe um ticket com esse número.')
        return value


class TicketUpdateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        required=False,
        allow_null=True,
    )
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.filter(is_active=True),
        source='client',
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'ticket_link', 'priority', 'client_id', 'assigned_to_id']


class TicketAssignSerializer(serializers.Serializer):
    analyst_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='analista'),
    )


class TicketStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = [
        ('aberto', 'Aberto'),
        ('em_andamento', 'Em Andamento'),
        ('aguardando_cliente', 'Aguardando Cliente'),
        ('resolvido', 'Resolvido'),
    ]
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    comment = serializers.CharField(required=False, allow_blank=True)
