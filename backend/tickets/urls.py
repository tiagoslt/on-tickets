"""
URLs do app de tickets.
"""
from django.urls import path
from . import views

urlpatterns = [
    # CRUD de tickets
    path('tickets/', views.TicketListCreateView.as_view(), name='tickets-list'),
    path('tickets/<int:pk>/', views.TicketDetailView.as_view(), name='tickets-detail'),

    # Ações específicas de tickets
    path('tickets/<int:pk>/assign/', views.ticket_assign, name='tickets-assign'),
    path('tickets/<int:pk>/status/', views.ticket_change_status, name='tickets-status'),

    # Comentários de tickets
    path('tickets/<int:pk>/comments/', views.TicketCommentListCreateView.as_view(), name='tickets-comments'),

    # Clientes
    path('clients/', views.ClientListCreateView.as_view(), name='clients-list'),
    path('clients/<int:pk>/', views.ClientDetailView.as_view(), name='clients-detail'),

    # Configurações de SLA
    path('sla-config/', views.SLAConfigListView.as_view(), name='sla-config-list'),
    path('sla-config/<int:pk>/', views.SLAConfigDetailView.as_view(), name='sla-config-detail'),
]
