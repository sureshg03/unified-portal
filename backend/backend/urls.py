"""
Unified URL configuration combining CDOE LSC Portal and Student Admission Portal
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # CDOE LSC Portal URLs
    path('api/auth/', include('lsc_auth.urls', namespace='lsc_auth')),  # LSC authentication
    path('api/admissions/', include('admissions.urls')),  # LSC admissions
    
    # Student Admission Portal URLs (authentication & applications)
    # Note: This includes login, signup, send-otp, verify-otp, application pages, etc.
    path('api/', include('api.urls')),  # Student portal endpoints
    
    # LSC Portal URLs (programs, students, attendance, etc.)
    # Note: These endpoints don't conflict with Student Portal
    path('api/', include('portal.urls')),  # LSC portal management endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
