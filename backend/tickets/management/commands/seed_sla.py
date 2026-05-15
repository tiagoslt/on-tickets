"""
Comando de gerenciamento para criar as configurações padrão de SLA.
Uso: python manage.py seed_sla
"""
from django.core.management.base import BaseCommand
from tickets.models import SLAConfig, DEFAULT_SLA_HOURS


class Command(BaseCommand):
    help = 'Cria as configurações padrão de SLA para cada prioridade.'

    def handle(self, *args, **options):
        criados = 0
        atualizados = 0

        for priority, hours in DEFAULT_SLA_HOURS.items():
            config, created = SLAConfig.objects.get_or_create(
                priority=priority,
                defaults={'sla_hours': hours},
            )
            if created:
                criados += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  Criado SLA para prioridade "{priority}": {hours}h')
                )
            else:
                atualizados += 1
                self.stdout.write(
                    self.style.WARNING(f'  Já existe SLA para prioridade "{priority}": {config.sla_hours}h')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nConcluído: {criados} criados, {atualizados} já existentes.'
            )
        )
