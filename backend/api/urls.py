from django.urls import path
from .views import send_otp, verify_otp, signup
from . import views
from .views import save_application_page1
from .views import get_academic_year_view
from .views import ApplicationPage3View,upload_marksheet
from .views import upload_documents
from django.conf import settings
from django.conf.urls.static import static
from . import admin_views  # Import admin views

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
    path('send-password-reset-otp/', views.send_password_reset_otp, name='send_password_reset_otp'),
    path('reset-password-with-otp/', views.reset_password_with_otp, name='reset_password_with_otp'),
    path('change-password/', views.change_password, name='change_password'),
    path('application/page1/', save_application_page1),
    path('academic-year/', get_academic_year_view, name='academic-year'),
    path('get-application/', views.get_application, name='get_application'),
    path('verify-dummy-payment/', views.verify_dummy_payment, name='verify_dummy_payment'),
    path('clear-payment/', views.clear_payment, name='clear_payment'),
    path('payment-history/', views.get_payment_history, name='get_payment_history'),
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
    path('courses/add/', views.add_course, name='add_course'),
    path('courses/<int:course_id>/', views.update_course, name='update_course'),
    path('courses/<int:course_id>/delete/', views.delete_course, name='delete_course'),
    path('courses/delete_all/', views.delete_all_courses, name='delete_all_courses'),  
    path('payment-status/', views.get_payment_status, name='payment_status'),
    path('initiate-payment/', views.initiate_payment, name='initiate_payment'),
    path('verify-payment/', views.verify_payment, name='verify_payment'),
    path('pgResponse/', views.payment_callback, name='payment_callback'),
    path('download-application/', views.download_application, name='download_application'),
    path('download-application-pdf/', views.download_application_pdf, name='download_application_pdf'),
    path('send-application-email/', views.send_application_email, name='send_application_email'),
    path('download-receipt/', views.download_receipt, name='download_receipt'),
    
    # LSC Admin - Student Admissions Management
    path('lsc-centers/', admin_views.get_lsc_centers, name='lsc_centers'),
    path('lsc-admin/student-admissions/', admin_views.get_student_admissions, name='lsc_student_admissions'),
    # Use path converter so application_id can contain slashes (e.g. PU/ODL/LC2101/A25/0001)
    path('lsc-admin/student-details/<path:application_id>/', admin_views.get_student_details, name='lsc_student_details'),
    path('lsc-admin/verify-eligibility/', admin_views.verify_eligibility, name='lsc_verify_eligibility'),
    path('lsc-admin/send-semester-fee-notification/', admin_views.send_semester_fee_notification, name='lsc_semester_fee_notification'),
    
    # Document Validation & Verification Endpoints
    path('lsc-admin/validate-document/', admin_views.validate_document, name='validate_document'),
    path('lsc-admin/generate-enrollment/', admin_views.generate_enrollment_number, name='generate_enrollment_number'),
    path('lsc-admin/save-verification/', admin_views.save_verification, name='save_verification'),
    
    # Invalid Document Notification & Resubmission
    path('lsc-admin/send-invalid-document-email/', admin_views.send_invalid_document_email, name='send_invalid_document_email'),
    path('lsc-admin/pending-revalidations/', admin_views.get_pending_revalidations, name='get_pending_revalidations'),
    path('resubmit-documents/verify/<str:token>/', admin_views.verify_resubmission_link, name='verify_resubmission_link'),
    path('resubmit-documents/submit/<str:token>/', admin_views.submit_resubmitted_documents, name='submit_resubmitted_documents'),
    
    # Semester Payment Endpoints
    path('semester-payments/process/', views.process_semester_payment, name='process_semester_payment'),
    path('semester-payments/', views.get_semester_payments, name='get_semester_payments'),
    path('semester-payments/status/', views.get_payment_status_v2, name='get_payment_status_v2'),
    path('semester-payments/receipt/<int:semester_number>/', views.get_payment_receipt, name='get_payment_receipt'),
    path('semester-payments/check/<int:semester_number>/', views.check_semester_payment, name='check_semester_payment'),
    
    # Materials Management Endpoints
    # Student endpoints
    path('materials/', views.get_student_materials, name='get_student_materials'),
    path('materials/<int:material_id>/view/', views.view_material, name='view_material'),
    path('materials/<int:material_id>/file/', views.serve_material_file, name='serve_material_file'),
    
    # LSC Admin endpoints
    path('lsc-admin/materials/', views.get_lsc_materials, name='get_lsc_materials'),
    path('lsc-admin/materials/upload/', views.upload_material, name='upload_material'),
    path('lsc-admin/materials/<int:material_id>/update/', views.update_material, name='update_material'),
    path('lsc-admin/materials/<int:material_id>/delete/', views.delete_material, name='delete_material'),
  
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)