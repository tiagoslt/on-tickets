"""
URLs do app de analytics.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Resumo geral por status
    path('summary/', views.analytics_summary, name='analytics-summary'),

    # Desempenho por analista (TMR, SLA, volume)
    path('by-analyst/', views.analytics_by_analyst, name='analytics-by-analyst'),

    # Relatório de SLA
    path('sla/', views.analytics_sla, name='analytics-sla'),

    # Volume diário/semanal
    path('volume/', views.analytics_volume, name='analytics-volume'),
]
