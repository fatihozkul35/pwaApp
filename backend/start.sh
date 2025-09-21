#!/usr/bin/env bash
set -o errexit

echo "=== Starting PWA Backend ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Django version: $(python -c 'import django; print(django.get_version())')"

echo "=== Checking DATABASE_URL ==="
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set"
else
    echo "ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "=== Running migrations ==="
python manage.py migrate --verbosity=2

echo "=== Creating superuser if not exists ==="
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
"

echo "=== Starting Gunicorn ==="
exec gunicorn pwa_backend.wsgi:application --bind 0.0.0.0:$PORT --timeout 120 --workers 2
