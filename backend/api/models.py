from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('urgent', 'Acil'),
    ]
    
    CATEGORY_CHOICES = [
        ('work', 'İş'),
        ('personal', 'Kişisel'),
        ('shopping', 'Alışveriş'),
        ('health', 'Sağlık'),
        ('finance', 'Finans'),
        ('other', 'Diğer'),
    ]

    title = models.CharField(max_length=200, verbose_name="Başlık")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    completed = models.BooleanField(default=False, verbose_name="Tamamlandı")
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        verbose_name="Öncelik"
    )
    category = models.CharField(
        max_length=10,
        choices=CATEGORY_CHOICES,
        default='other',
        verbose_name="Kategori"
    )
    due_date = models.DateTimeField(blank=True, null=True, verbose_name="Bitiş Tarihi")
    reminder_time = models.DateTimeField(blank=True, null=True, verbose_name="Hatırlatma Zamanı")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="Kullanıcı"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Görev"
        verbose_name_plural = "Görevler"

    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    @property
    def is_overdue(self):
        """Görev süresi geçmiş mi kontrol eder"""
        if self.due_date and not self.completed:
            from django.utils import timezone
            return self.due_date < timezone.now()
        return False
    
    @property
    def days_until_due(self):
        """Bitiş tarihine kaç gün kaldığını hesaplar"""
        if self.due_date:
            from django.utils import timezone
            delta = self.due_date - timezone.now()
            return delta.days
        return None

