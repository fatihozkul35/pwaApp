#!/usr/bin/env python
"""
Django development server runner
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pwa_backend.settings')
    django.setup()
    
    # Create superuser if it doesn't exist
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Admin user created: username=admin, password=admin123")
    
    # Run migrations
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Run server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
