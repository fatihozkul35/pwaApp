from rest_framework import serializers
from .models import Task, Note


class TaskSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 
            'title', 
            'description', 
            'completed',
            'priority',
            'priority_display',
            'category',
            'category_display',
            'due_date',
            'created_at', 
            'updated_at',
            'is_overdue',
            'days_until_due',
            'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at']
