from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 
        'priority', 
        'category', 
        'completed', 
        'due_date',
        'created_at',
        'user'
    ]
    list_filter = [
        'completed', 
        'priority', 
        'category',
        'created_at',
        'due_date',
        'user'
    ]
    search_fields = ['title', 'description']
    list_editable = ['completed', 'priority', 'category']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('title', 'description', 'user')
        }),
        ('Görev Detayları', {
            'fields': ('priority', 'category', 'due_date')
        }),
        ('Durum', {
            'fields': ('completed',)
        }),
    )
    
    def get_queryset(self, request):
        """Admin panelinde görevleri getir"""
        qs = super().get_queryset(request)
        return qs.select_related('user')
