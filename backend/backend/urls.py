"""
Unified URL configuration combining CDOE LSC Portal and Student Admission Portal
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, FileResponse
from django.views.static import serve
import os
import mimetypes

def serve_media_with_headers(request, path):
    """Serve media files with proper headers for iframe embedding"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    if not os.path.exists(file_path):
        return HttpResponse("File not found", status=404)
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # Create response with file
    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    
    # Set headers to allow iframe embedding from same origin
    response['X-Frame-Options'] = 'SAMEORIGIN'
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return response

def serve_spa(request):
    """Serve the React SPA for all non-API routes"""
    if request.path.startswith('/api/') or request.path.startswith('/admin/') or request.path.startswith('/media/'):
        return HttpResponse("Not Found", status=404)
    try:
        with open(os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html'), 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse("Frontend not built. Please run 'npm run build' in the frontend directory.", status=404)

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
    
    # Serve media files (uploaded documents) with proper headers for iframe
    re_path(r'^media/(?P<path>.*)$', serve_media_with_headers),
    
    # Serve static files from frontend dist
    re_path(r'^(?P<path>.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$', 
            serve, 
            {'document_root': os.path.join(settings.BASE_DIR, 'frontend', 'dist')}),
    
    # Serve React SPA for all other routes (must be last)
    re_path(r'.*', serve_spa),
]
