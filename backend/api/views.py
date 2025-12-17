from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Görevleri getir ve filtrele"""
        queryset = Task.objects.all()
        
        # Tamamlanmamış ve süresi geçmiş görevleri önce göster
        if self.request.query_params.get('overdue_only'):
            queryset = queryset.filter(
                due_date__lt=timezone.now(),
                completed=False
            )
        
        return queryset

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Tamamlanan görevleri getir"""
        completed_tasks = Task.objects.filter(completed=True)
        serializer = self.get_serializer(completed_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Bekleyen görevleri getir"""
        pending_tasks = Task.objects.filter(completed=False)
        serializer = self.get_serializer(pending_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Süresi geçmiş görevleri getir"""
        overdue_tasks = Task.objects.filter(
            due_date__lt=timezone.now(),
            completed=False
        )
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def high_priority(self, request):
        """Yüksek öncelikli görevleri getir"""
        high_priority_tasks = Task.objects.filter(
            priority__in=['high', 'urgent'],
            completed=False
        )
        serializer = self.get_serializer(high_priority_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Kategoriye göre görevleri getir"""
        category = request.query_params.get('category')
        if category:
            tasks = Task.objects.filter(category=category)
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)
        return Response({'error': 'Category parameter is required'}, status=400)
    
    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        """Görev tamamlama durumunu değiştir"""
        task = self.get_object()
        task.completed = not task.completed
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Görev istatistiklerini getir"""
        total = Task.objects.count()
        completed = Task.objects.filter(completed=True).count()
        pending = Task.objects.filter(completed=False).count()
        overdue = Task.objects.filter(
            due_date__lt=timezone.now(),
            completed=False
        ).count()
        
        return Response({
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue,
            'completion_rate': round((completed / total * 100), 2) if total > 0 else 0
        })
    
    @action(detail=False, methods=['get'])
    def reminders(self, request):
        """Hatırlatma zamanı yaklaşan görevleri getir"""
        now = timezone.now()
        # Gelecek 24 saat içindeki hatırlatmaları getir
        from datetime import timedelta
        next_24_hours = now + timedelta(hours=24)
        
        reminder_tasks = Task.objects.filter(
            reminder_time__isnull=False,
            reminder_time__gte=now,
            reminder_time__lte=next_24_hours,
            completed=False
        ).order_by('reminder_time')
        
        serializer = self.get_serializer(reminder_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming_reminders(self, request):
        """Yaklaşan hatırlatmaları getir"""
        now = timezone.now()
        # Gelecek 7 gün içindeki hatırlatmaları getir
        from datetime import timedelta
        next_7_days = now + timedelta(days=7)
        
        upcoming_reminders = Task.objects.filter(
            reminder_time__isnull=False,
            reminder_time__gte=now,
            reminder_time__lte=next_7_days,
            completed=False
        ).order_by('reminder_time')
        
        serializer = self.get_serializer(upcoming_reminders, many=True)
        return Response(serializer.data)
