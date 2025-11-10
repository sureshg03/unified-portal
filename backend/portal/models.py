from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Program(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Student(models.Model):
    COMMUNITY_CHOICES = [
        ('General', 'General'),
        ('OBC', 'OBC'),
        ('SC', 'SC'),
        ('ST', 'ST'),
    ]

    PAYMENT_CHOICES = [
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
        ('Failed', 'Failed'),
    ]

    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Confirmed', 'Confirmed'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
    ]

    application_no = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    community = models.CharField(max_length=20, choices=COMMUNITY_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='Pending')
    admission_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    counsellor = models.ForeignKey('Counsellor', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.application_no} - {self.name}"

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('Active', 'Active'), ('Inactive', 'Inactive')], default='Active')
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.attendance_percentage}%"

class AssignmentMark(models.Model):
    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('Pending', 'Pending'),
        ('Graded', 'Graded'),
    ]

    reg_no = models.CharField(max_length=20, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    p_code = models.CharField(max_length=20)  # Paper code
    internal_marks = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reg_no} - {self.p_code} - {self.internal_marks}"

class Counsellor(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    counsellor_name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100)
    mother_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    aadhaar_card = models.CharField(max_length=12, unique=True)
    qualification = models.CharField(max_length=100)
    highest_qualification = models.CharField(max_length=100)
    programme_assigned = models.ForeignKey(Program, on_delete=models.CASCADE)
    mobile_number = models.CharField(max_length=10)
    alternate_number = models.CharField(max_length=10, blank=True)
    email_id = models.EmailField(max_length=150, unique=True)
    current_designation = models.CharField(max_length=100)
    working_experience = models.TextField()
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    address_line3 = models.CharField(max_length=255, blank=True)
    pincode = models.CharField(max_length=6)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.counsellor_name

class ApplicationSettings(models.Model):
    ADMISSION_STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('SCHEDULED', 'Scheduled'),
        ('EXPIRED', 'Expired'),
    ]
    
    ADMISSION_TYPE_CHOICES = [
        ('ACADEMIC_YEAR', 'Academic Year'),
        ('CALENDAR_YEAR', 'Calendar Year'),
        ('UG', 'Under Graduate'),
        ('PG', 'Post Graduate'),
        ('DIPLOMA', 'Diploma'),
        ('CERTIFICATE', 'Certificate'),
        ('PHD', 'PhD'),
        ('DISTANCE', 'Distance Education'),
        ('ONLINE', 'Online Program'),
    ]

    # Core Fields matching your admission form
    admission_code = models.CharField(max_length=20, unique=True, help_text='Admission Code (Ex: A24)')
    admission_type = models.CharField(max_length=50, choices=ADMISSION_TYPE_CHOICES, help_text='Type of admission program')
    admission_year = models.CharField(max_length=20, help_text='Academic year (Ex: 2024-25 or 2025)')
    admission_key = models.CharField(max_length=50, unique=True, help_text='Unique admission key for reference')
    
    # Status and Dates
    status = models.CharField(max_length=20, choices=ADMISSION_STATUS_CHOICES, default='CLOSED')
    is_active = models.BooleanField(default=True)
    opening_date = models.DateField(null=True, blank=True, help_text='Date when online application opens')
    closing_date = models.DateField(null=True, blank=True, help_text='Date when online application closes')
    
    # Manual override flags for admission status
    is_open = models.BooleanField(default=False, help_text='Manual override: Force admission to be open')
    is_close = models.BooleanField(default=True, help_text='Manual override: Force admission to be closed')
    
    # Application Limits
    max_applications = models.PositiveIntegerField(default=0, help_text='Maximum applications (0 for unlimited)')
    current_applications = models.PositiveIntegerField(default=0)
    
    # Additional Info
    description = models.TextField(blank=True, help_text='Additional details about this admission session')
    instructions = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'portal_applicationsettings'
        ordering = ['-admission_year', '-opening_date']
        verbose_name = 'Application Setting'
        verbose_name_plural = 'Application Settings'

    def __str__(self):
        return f"{self.admission_code} - {self.admission_type} ({'Open' if self.status == 'OPEN' else 'Closed'})"

    def save(self, *args, **kwargs):
        # Auto-update status based on dates and manual overrides
        from datetime import date
        today = date.today()
        
        # First, check manual override flags
        if self.is_open and not self.is_close:
            # Manual override to open
            self.status = 'OPEN'
        elif self.is_close and not self.is_open:
            # Manual override to close
            self.status = 'CLOSED'
        else:
            # No manual override, use date-based logic
            if self.opening_date and self.closing_date:
                if self.opening_date > today:
                    self.status = 'SCHEDULED'
                elif self.closing_date < today:
                    self.status = 'EXPIRED'
                else:
                    # Within date range, default to open if no manual override
                    if not self.is_open and not self.is_close:
                        self.status = 'OPEN'
        
        # Ensure is_open and is_close are mutually exclusive
        if self.is_open and self.is_close:
            # If both are set to True, prioritize is_open
            self.is_close = False
        elif not self.is_open and not self.is_close:
            # If both are False, default to closed
            self.is_close = True
        
        super().save(*args, **kwargs)

    @property
    def is_currently_open(self):
        """Check if admission is currently open based on dates and manual flags"""
        from datetime import date
        today = date.today()
        
        # First check manual override flags
        if self.is_open and not self.is_close:
            return True
        elif self.is_close and not self.is_open:
            return False
        
        # Fall back to date-based logic
        if not self.opening_date or not self.closing_date:
            return False
        return (
            self.status == 'OPEN' and 
            self.opening_date <= today <= self.closing_date and
            self.is_active
        )
    
    @property
    def days_remaining(self):
        """Calculate days remaining until closing"""
        from datetime import date
        if not self.closing_date:
            return 0
        if self.closing_date >= date.today():
            return (self.closing_date - date.today()).days
        return 0
    
    @property
    def can_accept_applications(self):
        """Check if can accept more applications"""
        if self.max_applications == 0:
            return True
        return self.current_applications < self.max_applications

    @property
    def is_within_deadline(self):
        from datetime import date
        today = date.today()
        if self.opening_date and self.closing_date:
            return self.opening_date <= today <= self.closing_date
        return self.status == 'OPEN'


class SystemSettings(models.Model):
    SETTING_TYPES = [
        ('GENERAL', 'General Settings'),
        ('NOTIFICATION', 'Notification Settings'),
        ('SECURITY', 'Security Settings'),
        ('MAINTENANCE', 'Maintenance Settings'),
    ]

    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES)
    key = models.CharField(max_length=100)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['setting_type', 'key']

    def __str__(self):
        return f"{self.setting_type}: {self.key}"

class NotificationSettings(models.Model):
    NOTIFICATION_TYPES = [
        ('EMAIL', 'Email Notifications'),
        ('SMS', 'SMS Notifications'),
        ('PUSH', 'Push Notifications'),
        ('SYSTEM', 'System Notifications'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'notification_type']

    def __str__(self):
        return f"{self.user.lsc_number} - {self.notification_type}"