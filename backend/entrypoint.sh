#!/bin/bash
set -e

# Em produção (Render) o banco já está disponível via DATABASE_URL
# Em desenvolvimento (Docker) aguarda o PostgreSQL subir
if [ -z "$DATABASE_URL" ]; then
  echo "Aguardando PostgreSQL em $DB_HOST:$DB_PORT..."
  until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        host=os.environ['DB_HOST'],
        port=os.environ['DB_PORT'],
        dbname=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "  PostgreSQL indisponível, aguardando 2s..."
    sleep 2
  done
  echo "PostgreSQL pronto."
fi

echo "Gerando migrações..."
python manage.py makemigrations --noinput

echo "Aplicando migrações..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "Populando configurações de SLA..."
python manage.py seed_sla

echo "Criando superuser admin..."
python manage.py shell -c "
import os
from accounts.models import User

email = os.environ.get('ADMIN_EMAIL', 'admin@ontickets.com')
password = os.environ.get('ADMIN_PASSWORD', 'admin123')

if not User.objects.filter(email=email).exists():
    username = email.split('@')[0]
    counter = 1
    base = username
    while User.objects.filter(username=username).exists():
        username = f'{base}{counter}'
        counter += 1
    u = User(username=username, email=email, first_name='Admin', role='admin', is_staff=True, is_superuser=True)
    u.set_password(password)
    u.save()
    print(f'Superuser criado: {email}')
else:
    print(f'Superuser já existe: {email}')
"

echo "Iniciando servidor..."
exec "$@"
