from django.contrib import admin
from .models import AdmissionSession

@admin.register(AdmissionSession)
class AdmissionSessionAdmin(admin.ModelAdmin):
    list_display = [
        'admission_code',
        'admission_type',
        'admission_year',
        'opening_date',
        'closing_date',
        'status',
        'current_applications',
        'max_applications',
        'is_active'
    ]
    list_filter = ['status', 'admission_type', 'admission_year', 'is_active']
    search_fields = ['admission_code', 'admission_key', 'admission_year']
    readonly_fields = ['created_at', 'updated_at', 'current_applications']
    
    fieldsets = (
        ('Admission Information', {
            'fields': ('admission_code', 'admission_type', 'admission_year', 'admission_key')
        }),
        ('Application Period', {
            'fields': ('opening_date', 'closing_date', 'status')
        }),
        ('Capacity & Applications', {
            'fields': ('max_applications', 'current_applications')
        }),
        ('Additional Details', {
            'fields': ('description', 'is_active', 'created_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
