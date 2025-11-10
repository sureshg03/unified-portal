from django.urls import path
from .views import send_otp, verify_otp, signup
from . import views
from .views import save_application_page1
from .views import get_academic_year_view
from .views import ApplicationPage3View,upload_marksheet
from .views import upload_documents
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('send-otp/', send_otp, name='send_otp'),
    path('current-user-email/', views.get_user_profile, name='get_current_user_email'), 
    path('user-profile/', views.get_user_profile, name='get_user_profile'),
    path('applications/', views.applications_view, name='applications'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('signup/', signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-reset-otp/', views.verify_reset_otp, name='verify_reset_otp'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('application/page1/', save_application_page1),
    path('academic-year/', get_academic_year_view, name='academic-year'),
    path('get-application/', views.get_application, name='get_application'),
    path('verify-dummy-payment/', views.verify_dummy_payment, name='verify_dummy_payment'),
    path('clear-payment/', views.clear_payment, name='clear_payment'),
    path('application-payment-data/', views.get_application_payment_data, name='get_application_payment_data'),
    path('application/page2/', views.save_application_page2, name='save_application_page2'),
    path('get-autofill-application/', views.get_autofill_application, name='get_autofill_application'),
    path('application/page3/', ApplicationPage3View.as_view(), name='application_page3'),
    path('upload-marksheet/', upload_marksheet, name='upload_marksheet'),
    path('upload-documents/', upload_documents, name='upload_documents'),
    path('application/preview/', views.get_application_preview, name='get_application_preview'),
    path('create-order/', views.create_order, name='create_order'),
    path('verify-payment/', views.verify_payment, name='verify_payment'),
    path('temp-image/<str:file_id>/', views.serve_temp_image, name='serve_temp_image'),
    #path('proxy-image/<str:file_id>/', views.proxy_google_drive_image, name='proxy_google_drive_image'),  
    path('proxy-image/<str:file_id>/', views.proxy_google_drive_image, name='proxy_google_drive_image'),
    path('proxy-file/<str:file_id>/', views.proxy_google_drive_file, name='proxy_google_drive_file'),
    path('student-details/', views.get_student_details, name='get_student_details'),
    path('application/confirm-preview/', views.confirm_preview, name='confirm_preview'),
    path('courses/', views.get_courses, name='get_courses'),  
    path('payment-status/', views.get_payment_status, name='payment_status'),
    path('initiate-payment/', views.initiate_payment, name='initiate_payment'),
    path('verify-payment/', views.verify_payment, name='verify_payment'),
    path('pgResponse/', views.payment_callback, name='payment_callback'),
    path('download-application/', views.download_application, name='download_application'),
    path('download-receipt/', views.download_receipt, name='download_receipt'),
    
  
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)