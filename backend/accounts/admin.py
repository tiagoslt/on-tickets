"""
Configuração do painel admin para o app de contas.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuração de administração do modelo de usuário customizado."""

    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['first_name', 'last_name']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações OPA', {
            'fields': ('role', 'avatar_url'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informações OPA', {
            'fields': ('email', 'first_name', 'last_name', 'role'),
        }),
    )
