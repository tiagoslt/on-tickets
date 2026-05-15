"""
Configuração de URLs principal do projeto OPA.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Painel administrativo do Django
    path('admin/', admin.site.urls),

    # Rotas de autenticação e usuários
    path('api/auth/', include('accounts.urls')),

    # Rotas de tickets
    path('api/', include('tickets.urls')),

    # Rotas de analytics
    path('api/analytics/', include('analytics.urls')),
]
