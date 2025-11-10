from django.contrib import admin
from .models import Student, Application

# Register your models here.

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'lsc_code', 'lsc_name', 'is_verified', 'referral_date')
    list_filter = ('is_verified', 'lsc_code', 'referral_date')
    search_fields = ('name', 'email', 'phone', 'lsc_code', 'lsc_name')
    readonly_fields = ('referral_date',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone', 'password', 'is_verified')
        }),
        ('LSC Referral Information', {
            'fields': ('lsc_code', 'lsc_name', 'referral_date'),
            'description': 'Information about the LSC center that referred this student'
        }),
    )
