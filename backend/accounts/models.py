"""
Modelos de usuários e autenticação do sistema OPA.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modelo de usuário customizado com suporte a roles e OAuth do Google.
    """
    ROLES = [
        ('admin', 'Admin'),
        ('gestor', 'Gestor'),
        ('analista', 'Analista'),
    ]

    email = models.EmailField(
        unique=True,
        verbose_name='E-mail',
    )
    role = models.CharField(
        max_length=20,
        choices=ROLES,
        default='analista',
        verbose_name='Perfil',
    )
    avatar_url = models.URLField(
        blank=True,
        verbose_name='URL do Avatar',
    )

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return self.get_full_name() or self.email or self.username

    @property
    def is_admin(self):
        """Verifica se o usuário tem perfil de administrador."""
        return self.role == 'admin'

    @property
    def is_gestor(self):
        """Verifica se o usuário tem perfil de gestor."""
        return self.role == 'gestor'

    @property
    def is_analista(self):
        """Verifica se o usuário tem perfil de analista."""
        return self.role == 'analista'
