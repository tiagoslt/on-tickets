"""
Configuração ASGI para o projeto OPA.

Expõe o callable ASGI como variável de módulo chamada ``application``.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'on_tickets_backend.settings')

application = get_asgi_application()
