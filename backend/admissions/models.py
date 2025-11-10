from django.db import models
from django.core.validators import RegexValidator

class AdmissionSession(models.Model):
    """Model to manage admission sessions and online application periods"""
    
    ADMISSION_STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('SCHEDULED', 'Scheduled'),
        ('EXPIRED', 'Expired'),
    ]
    
    ADMISSION_TYPE_CHOICES = [
        ('UG', 'Under Graduate'),
        ('PG', 'Post Graduate'),
        ('DIPLOMA', 'Diploma'),
        ('CERTIFICATE', 'Certificate'),
        ('PHD', 'PhD'),
        ('DISTANCE', 'Distance Education'),
        ('ONLINE', 'Online Program'),
        ('ACADEMIC_YEAR', 'Academic Year'),
        ('CALENDAR_YEAR', 'Calendar Year'),
    ]
    
    # Admission Information
    admission_code = models.CharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(regex=r'^[A-Z0-9]+$', message='Only uppercase letters and numbers allowed')],
        help_text='Admission Code (Ex: A24)'
    )
    
    admission_type = models.CharField(
        max_length=50,
        choices=ADMISSION_TYPE_CHOICES,
        help_text='Type of admission program'
    )
    
    admission_year = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\d{4}(-\d{2})?$', message='Format: YYYY or YYYY-YY')],
        help_text='Academic year (Ex: 2024-25 or 2025)'
    )
    
    admission_key = models.CharField(
        max_length=50,
        unique=True,
        help_text='Unique admission key for reference'
    )
    
    # Application Period
    opening_date = models.DateField(
        help_text='Date when online application opens'
    )
    
    closing_date = models.DateField(
        help_text='Date when online application closes'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=ADMISSION_STATUS_CHOICES,
        default='CLOSED',
        help_text='Current admission status'
    )
    
    # Additional Information
    description = models.TextField(
        blank=True,
        null=True,
        help_text='Additional details about this admission session'
    )
    
    max_applications = models.IntegerField(
        default=0,
        help_text='Maximum number of applications allowed (0 for unlimited)'
    )
    
    current_applications = models.IntegerField(
        default=0,
        help_text='Current number of applications received'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'admission_sessions'
        ordering = ['-admission_year', '-opening_date']
        verbose_name = 'Admission Session'
        verbose_name_plural = 'Admission Sessions'
    
    def __str__(self):
        return f"{self.admission_code} - {self.admission_type} ({self.admission_year})"
    
    def save(self, *args, **kwargs):
        # Auto-update status based on dates
        from datetime import date
        today = date.today()
        
        if self.opening_date > today:
            self.status = 'SCHEDULED'
        elif self.closing_date < today:
            self.status = 'EXPIRED'
        elif self.opening_date <= today <= self.closing_date and self.status == 'CLOSED':
            # Only auto-open if not explicitly closed by admin
            pass
        
        super().save(*args, **kwargs)
    
    @property
    def is_open(self):
        """Check if admission is currently open"""
        from datetime import date
        today = date.today()
        return (
            self.status == 'OPEN' and 
            self.opening_date <= today <= self.closing_date and
            self.is_active
        )
    
    @property
    def days_remaining(self):
        """Calculate days remaining until closing"""
        from datetime import date
        if self.closing_date >= date.today():
            return (self.closing_date - date.today()).days
        return 0
    
    @property
    def can_accept_applications(self):
        """Check if can accept more applications"""
        if self.max_applications == 0:
            return True
        return self.current_applications < self.max_applications
