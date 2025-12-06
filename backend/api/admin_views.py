"""
LSC Admin Views for Student Admissions Management
Handles student verification, document validation, and enrollment processes
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction, connections
from datetime import datetime
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .models import Application, StudentDetails, ApplicationPayment, Student, MarksheetUpload
from .send_invalid_document_email import (
    send_invalid_document_notification,
    verify_resubmission_token,
    mark_resubmission_complete
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_lsc_centers(request):
    """
    Fetch all LSC centers from lsc_auth_lscuser table in lsc_portal database
    """
    try:
        from django.db import connections
        
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT lsc_number, lsc_name 
                FROM lsc_auth_lscuser 
                WHERE lsc_number IS NOT NULL AND lsc_name IS NOT NULL
                ORDER BY lsc_number
            """)
            rows = cursor.fetchall()
            
            lsc_centers = [
                {
                    'lsc_code': row[0],
                    'lsc_name': row[1]
                }
                for row in rows
            ]
            
        return Response({
            'status': 'success',
            'count': len(lsc_centers),
            'data': lsc_centers
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching LSC centers: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to fetch LSC centers: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # TODO: Add LSC Admin authentication
def get_student_admissions(request):
    """
    Fetch all registered students with their application and payment details
    Query Parameters:
        - lsc_code: Filter by LSC center code
        - admission_batch: Filter by admission batch/year
        - programme: Filter by programme
        - payment_status: Filter by payment status (paid/unpaid)
        - eligibility_status: Filter by eligibility status
    """
    try:
        # Get query parameters
        lsc_code = request.GET.get('lsc_code', None)
        admission_batch = request.GET.get('admission_batch', None)
        programme = request.GET.get('programme', None)
        payment_status_filter = request.GET.get('payment_status', None)
        eligibility_status = request.GET.get('eligibility_status', None)

        # Fetch applications with payment info
        applications = Application.objects.select_related('user').all()
        
        logger.info(f"Total applications found: {applications.count()}")

        # Apply filters
        if lsc_code:
            applications = applications.filter(application_id__contains=f'/LC{lsc_code}/')
        if admission_batch:
            applications = applications.filter(application_id__contains=f'/A{admission_batch}/')
        if programme:
            applications = applications.filter(programme_applied=programme)
        if payment_status_filter:
            if payment_status_filter.lower() == 'paid':
                applications = applications.filter(payment_status='P')
            elif payment_status_filter.lower() == 'unpaid':
                applications = applications.filter(payment_status='N')

        # Build response data
        student_list = []
        for idx, app in enumerate(applications, 1):
            try:
                # Get user information safely
                user_obj = None
                username = 'N/A'
                user_date_joined = None
                try:
                    user_obj = app.user
                    username = user_obj.username if user_obj else 'N/A'
                    user_date_joined = user_obj.date_joined if user_obj else None
                except:
                    pass

                # Get student details
                student_details = None
                if user_obj:
                    try:
                        student_details = StudentDetails.objects.filter(
                            user=user_obj
                        ).first()
                    except:
                        pass

                # Get payment information
                payment = ApplicationPayment.objects.filter(
                    application_id=app.application_id
                ).first()

                # Check for uploaded documents
                has_documents = False
                if student_details:
                    has_documents = any([
                        student_details.sslc_marksheet_url,
                        student_details.hsc_marksheet_url,
                        student_details.ug_marksheet_url,
                        student_details.community_certificate_url,
                        student_details.aadhaar_url,
                        student_details.transfer_certificate_url
                    ])

                student_data = {
                    'sno': idx,
                    'application_no': app.application_id or 'N/A',
                    'name': app.name_initial or username,
                    'email': app.email,
                    'programme': app.programme_applied or 'N/A',
                    'course': app.course or 'N/A',
                    'community': app.community or 'N/A',
                    'payment_status': 'Paid' if app.payment_status == 'P' else 'Unpaid',
                    'payment_amount': float(payment.amount) if payment else 0.00,
                    'transaction_id': payment.transaction_id if payment else None,
                    'transaction_date': payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if payment and payment.transaction_date else None,
                    'applied_date': user_date_joined.strftime('%Y-%m-%d') if user_date_joined else None,
                    'lsc_code': app.application_id.split('/')[2] if app.application_id and '/' in app.application_id else None,
                    'has_documents': has_documents,
                    'eligibility_verified': hasattr(app, 'eligibility_verified') and app.eligibility_verified,
                    'eligibility_status': getattr(app, 'eligibility_status', None),
                    'enrollment_no': getattr(app, 'enrollment_no', None),
                    'admission_confirmed': getattr(app, 'admission_confirmed', False),
                    'phone': username if username and '@' not in username else None,
                    'dob': app.dob.strftime('%Y-%m-%d') if app.dob else None,
                    'gender': app.gender,
                    'aadhaar_no': app.aadhaar_no,
                    'medium': app.medium,
                    'academic_year': app.academic_year,
                }

                student_list.append(student_data)

            except Exception as e:
                logger.error(f"Error processing application {app.application_id}: {str(e)}")
                continue

        return Response({
            'status': 'success',
            'count': len(student_list),
            'data': student_list
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching student admissions: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to fetch student admissions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_details(request, application_id):
    """
    Get detailed information for a specific student including all documents
    """
    try:
        logger.info(f"Fetching student details for application_id: {application_id}")
        
        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            logger.warning(f"Application not found: {application_id}")
            return Response({
                'status': 'error',
                'message': f'Application not found with ID: {application_id}'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get student details - query by user_id instead of user relationship
        student_details = None
        if application and application.user_id:
            student_details = StudentDetails.objects.filter(
                user_id=application.user_id
            ).first()

        # Get payment info
        payment = ApplicationPayment.objects.filter(
            application_id=application_id
        ).first()

        # Get marksheet uploads
        marksheet_uploads = []
        if student_details:
            uploads = MarksheetUpload.objects.filter(
                student=student_details
            )
            marksheet_uploads = [{
                'type': upload.qualification_type,
                'url': upload.file_url,
                'uploaded_at': upload.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')
            } for upload in uploads]

        # Get user information safely
        user_obj = None
        user_date_joined = None
        try:
            if application and application.user_id:
                from django.contrib.auth.models import User
                user_obj = User.objects.filter(id=application.user_id).first()
                if user_obj:
                    user_date_joined = user_obj.date_joined
        except Exception as e:
            logger.warning(f"Error fetching user for application {application_id}: {e}")
            user_obj = None

        # Extract contact information
        email = getattr(application, 'email', None) or (user_obj.email if user_obj else None) or 'N/A'
        phone = getattr(student_details, 'phone', None) or getattr(application, 'phone', None) or 'N/A'

        # Build comprehensive response
        response_data = {
            'application_id': application.application_id,
            'application_no': application.application_id,
            'applied_date': user_date_joined.strftime('%d-%m-%Y') if user_date_joined else None,
            'lsc_code': application.application_id.split('/')[2] if application.application_id and '/' in application.application_id else 'N/A',
            'lsc_name': f"CDOE - Centre for Distance and Online Education ({application.application_id.split('/')[2]})" if application.application_id and '/' in application.application_id else None,
            
            # Programme Information
            'programme': application.programme_applied or 'N/A',
            'programme_applied': application.programme_applied or 'N/A',
            'course': getattr(application, 'course', None),
            'medium': getattr(application, 'medium', None),
            'mode_of_study': getattr(application, 'mode_of_study', None),
            'academic_year': getattr(application, 'academic_year', None),
            
            # Personal Information
            'name': application.name_initial or 'N/A',
            'student_name': application.name_initial or 'N/A',
            'name_initial': application.name_initial or 'N/A',
            'dob': application.dob.strftime('%d-%m-%Y') if application.dob else None,
            'gender': getattr(application, 'gender', None),
            'father_name': getattr(application, 'father_name', None),
            'mother_name': getattr(application, 'mother_name', None),
            'guardian_name': getattr(application, 'guardian_name', None),
            'parent_occupation': getattr(application, 'parent_occupation', None),
            'father_occupation': getattr(application, 'father_occupation', None),
            'mother_tongue': getattr(application, 'mother_tongue', None),
            'nationality': getattr(application, 'nationality', 'Indian'),
            'religion': getattr(application, 'religion', None),
            'community': getattr(application, 'community', None),
            'aadhaar_no': getattr(application, 'aadhaar_no', None),
            'aadhaar_number': getattr(application, 'aadhaar_no', None),
            'aadhaar_name': getattr(application, 'name_as_aadhaar', None),
            'name_as_aadhaar': getattr(application, 'name_as_aadhaar', None),
            'abc_id': getattr(application, 'abc_id', None),
            'deb_id': getattr(application, 'deb_id', None),
            'differently_abled': 'Yes' if getattr(application, 'differently_abled', False) else 'No',
            'blood_group': getattr(application, 'blood_group', None),
            'internet_access': getattr(application, 'access_internet', 'Yes'),
            'access_internet': getattr(application, 'access_internet', 'Yes'),
            
            # Contact Information
            'email': email,
            'phone': phone,
            'mobile': phone,
            
            # Address Information - Flat structure
            'comm_area': getattr(application, 'comm_area', None),
            'comm_town': getattr(application, 'comm_town', None),
            'comm_district': getattr(application, 'comm_district', None),
            'comm_state': getattr(application, 'comm_state', None),
            'comm_pincode': getattr(application, 'comm_pincode', None),
            'comm_country': getattr(application, 'comm_country', None),
            'perm_area': getattr(application, 'perm_area', None),
            'perm_town': getattr(application, 'perm_town', None),
            'perm_district': getattr(application, 'perm_district', None),
            'perm_state': getattr(application, 'perm_state', None),
            'perm_pincode': getattr(application, 'perm_pincode', None),
            'perm_country': getattr(application, 'perm_country', None),
            
            # Education Qualifications
            'qualifications': student_details.qualifications if student_details and hasattr(student_details, 'qualifications') else [],
            'tenth_percentage': None,
            'twelfth_percentage': None,
            'graduation_percentage': None,
            
            # Working Experience
            'current_designation': student_details.current_designation if student_details and hasattr(student_details, 'current_designation') else None,
            'current_institute': student_details.current_institute if student_details and hasattr(student_details, 'current_institute') else None,
            'years_experience': student_details.years_experience if student_details and hasattr(student_details, 'years_experience') else 0,
            'years_of_experience': student_details.years_experience if student_details and hasattr(student_details, 'years_experience') else 0,
            'annual_income': student_details.annual_income if student_details and hasattr(student_details, 'annual_income') else 0,
            
            # Payment Information - Flat structure
            'payment_status': 'Paid' if application.payment_status == 'P' else 'Unpaid',
            'order_id': payment.order_id if payment else None,
            'amount': float(payment.amount) if payment and payment.amount else 236.00,
            'payment_amount': float(payment.amount) if payment and payment.amount else 236.00,
            'transaction_id': payment.transaction_id if payment else None,
            'bank_ref_no': payment.bank_transaction_id if payment else None,
            'transaction_date': payment.transaction_date.strftime('%d-%m-%Y %H:%M') if payment and payment.transaction_date else None,
            'payment_date': payment.transaction_date.strftime('%d-%m-%Y') if payment and payment.transaction_date else None,
            'payment_mode': payment.payment_mode if payment else 'Online',
            'payment_method': payment.payment_mode if payment else 'Online',
            
            # Document URLs - Direct fields
            'photo_url': student_details.photo_url if student_details and hasattr(student_details, 'photo_url') else None,
            'signature_url': student_details.signature_url if student_details and hasattr(student_details, 'signature_url') else None,
            'sslc_marksheet_url': student_details.sslc_marksheet_url if student_details and hasattr(student_details, 'sslc_marksheet_url') else None,
            'hsc_marksheet_url': student_details.hsc_marksheet_url if student_details and hasattr(student_details, 'hsc_marksheet_url') else None,
            'ug_marksheet_url': student_details.ug_marksheet_url if student_details and hasattr(student_details, 'ug_marksheet_url') else None,
            'community_certificate_url': student_details.community_certificate_url if student_details and hasattr(student_details, 'community_certificate_url') else None,
            'aadhaar_url': student_details.aadhaar_url if student_details and hasattr(student_details, 'aadhaar_url') else None,
            'transfer_certificate_url': student_details.transfer_certificate_url if student_details and hasattr(student_details, 'transfer_certificate_url') else None,
            
            # Verification Status
            'eligibility_verified': getattr(application, 'eligibility_verified', False),
            'eligibility_status': getattr(application, 'eligibility_status', 'Pending'),
            'verification_remarks': getattr(application, 'verification_remarks', None),
            'verified_by': getattr(application, 'verified_by', None),
            'verified_date': getattr(application, 'verified_date', None),
            
            # Document Validation (includes resubmitted documents)
            'document_validation': getattr(application, 'document_validation', {}),
            
            # Admission Status
            'admission_confirmed': getattr(application, 'admission_confirmed', False),
            'enrollment_no': getattr(application, 'enrollment_no', None),
            'rejection_reason': getattr(application, 'rejection_reason', None),
        }

        logger.info(f"Successfully fetched details for application: {application_id}")
        return Response({
            'status': 'success',
            'data': response_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching student details for {application_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to fetch student details: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def verify_eligibility(request):
    """
    Verify student eligibility and update status
    Body parameters:
        - application_id: Application ID
        - eligibility_status: 'ELIGIBLE' or 'NOT_ELIGIBLE'
        - verification_remarks: Optional remarks
        - verified_by: LSC Admin user name/ID
    """
    try:
        application_id = request.data.get('application_id')
        eligibility_status = request.data.get('eligibility_status')
        verification_remarks = request.data.get('verification_remarks', '')
        verified_by = request.data.get('verified_by')

        if not application_id or not eligibility_status:
            return Response({
                'status': 'error',
                'message': 'application_id and eligibility_status are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update application with eligibility info (add these fields to model if not exist)
        # For now, we'll use a workaround by updating status
        if eligibility_status == 'ELIGIBLE':
            application.status = 'Completed'
        else:
            application.status = 'Cancelled'
        
        application.save()

        # Send email notification
        send_eligibility_email(application, eligibility_status, verification_remarks)

        return Response({
            'status': 'success',
            'message': f'Eligibility verification completed. Status: {eligibility_status}',
            'data': {
                'application_id': application_id,
                'eligibility_status': eligibility_status,
                'verified_by': verified_by,
                'verified_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error verifying eligibility for {application_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to verify eligibility: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def generate_enrollment_id(request):
    """
    Generate enrollment ID for eligible students
    Body parameters:
        - application_id: Application ID
        - generated_by: LSC Admin user name/ID
    """
    try:
        application_id = request.data.get('application_id')
        generated_by = request.data.get('generated_by')

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Generate enrollment number
        # Format: PU/ODL/YEAR/PROGRAM/NUMBER
        year = datetime.now().year
        program_code = application.programme_applied[:3].upper() if application.programme_applied else 'GEN'
        
        # Get count of existing enrollments for this year
        existing_count = Application.objects.filter(
            status='Completed'
        ).count()
        
        enrollment_no = f"PU/ODL/{year}/{program_code}/{str(existing_count + 1).zfill(5)}"
        
        # Update application status
        application.status = 'Completed'
        application.save()

        # Send enrollment notification email
        send_enrollment_email(application, enrollment_no)

        return Response({
            'status': 'success',
            'message': 'Enrollment ID generated successfully',
            'data': {
                'application_id': application_id,
                'enrollment_no': enrollment_no,
                'generated_by': generated_by,
                'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error generating enrollment ID for {application_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to generate enrollment ID: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def send_eligibility_email(application, eligibility_status, remarks=''):
    """Send email notification for eligibility verification"""
    try:
        student_email = application.email
        student_name = application.name_initial or 'Student'
        application_id = application.application_id

        if eligibility_status == 'ELIGIBLE':
            subject = '🎉 Congratulations! Your Application is Eligible - Periyar University'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .highlight {{ background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Eligibility Verified!</h1>
                    </div>
                    <div class="content">
                        <p>Dear {student_name},</p>
                        
                        <p>Congratulations! We are pleased to inform you that your application has been successfully verified and you are <strong>ELIGIBLE</strong> for admission.</p>
                        
                        <div class="highlight">
                            <strong>Application ID:</strong> {application_id}<br>
                            <strong>Status:</strong> <span style="color: #4caf50;">✓ Eligible</span><br>
                            <strong>Programme:</strong> {application.programme_applied or 'N/A'}
                        </p>
                        </div>
                        
                        <h3>📋 Next Steps:</h3>
                        <ol>
                            <li>Wait for the first semester fee payment notification</li>
                            <li>Complete the fee payment within the specified deadline</li>
                            <li>Your enrollment ID will be generated upon fee payment</li>
                            <li>ID card will be issued after enrollment confirmation</li>
                        </ol>
                        
                        <p><strong>Note:</strong> You will receive a separate email with payment details for the first semester fee.</p>
                        
                        <p>If you have any questions, please contact our admissions office.</p>
                        
                        <div class="footer">
                            <p>Centre for Distance and Online Education (CDOE)<br>
                            Periyar University, Salem - 636011<br>
                            Email: pridedirector@periyaruniversity.ac.in | Phone: 0427-2345918</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        else:
            subject = 'Application Status Update - Periyar University'
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f57c00 0%, #e65100 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .highlight {{ background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Application Status Update</h1>
                    </div>
                    <div class="content">
                        <p>Dear {student_name},</p>
                        
                        <p>Thank you for your interest in Periyar University's programmes.</p>
                        
                        <div class="highlight">
                            <strong>Application ID:</strong> {application_id}<br>
                            <strong>Status:</strong> Not Eligible<br>
                            <strong>Remarks:</strong> {remarks or 'Please contact the admissions office for details'}
                        </div>
                        
                        <p>For further clarification or to discuss alternative options, please contact our admissions office.</p>
                        
                        <div class="footer">
                            <p>Centre for Distance and Online Education (CDOE)<br>
                            Periyar University, Salem - 636011<br>
                            Email: pridedirector@periyaruniversity.ac.in | Phone: 0427-2345918</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

        # Send email using SMTP
        context = ssl._create_unverified_context()
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = student_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)

        logger.info(f"Eligibility email sent to {student_email}")

    except Exception as e:
        logger.error(f"Error sending eligibility email: {str(e)}")


def send_enrollment_email(application, enrollment_no):
    """Send email notification with enrollment number"""
    try:
        student_email = application.email
        student_name = application.name_initial or 'Student'
        application_id = application.application_id

        subject = '🎊 Enrollment Successful - Your Enrollment Number - Periyar University'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .enrollment-box {{ background: white; padding: 20px; border: 2px dashed #1e88e5; border-radius: 10px; text-align: center; margin: 20px 0; }}
                .enrollment-no {{ font-size: 24px; font-weight: bold; color: #1e88e5; letter-spacing: 2px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #1e88e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Welcome to Periyar University!</h1>
                </div>
                <div class="content">
                    <p>Dear {student_name},</p>
                    
                    <p>Congratulations! Your enrollment has been successfully completed.</p>
                    
                    <div class="enrollment-box">
                        <p style="margin: 0; font-size: 14px; color: #666;">Your Enrollment Number</p>
                        <p class="enrollment-no">{enrollment_no}</p>
                        <p style="margin: 0; font-size: 12px; color: #999;">Keep this number safe for future reference</p>
                    </div>
                    
                    <p><strong>Application ID:</strong> {application_id}</p>
                    <p><strong>Programme:</strong> {application.programme_applied or 'N/A'}</p>
                    
                    <h3>📋 What's Next?</h3>
                    <ul>
                        <li>Your ID card will be prepared and issued shortly</li>
                        <li>You will receive course materials and study schedule</li>
                        <li>Access to online learning platform will be granted</li>
                        <li>Keep checking your email for further updates</li>
                    </ul>
                    
                    <p>We are excited to have you as part of our academic community!</p>
                    
                    <div class="footer">
                        <p>Centre for Distance and Online Education (CDOE)<br>
                        Periyar University, Salem - 636011<br>
                        Email: pridedirector@periyaruniversity.ac.in | Phone: 0427-2345918</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # Send email using SMTP
        context = ssl._create_unverified_context()
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = student_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)

        logger.info(f"Enrollment email sent to {student_email}")

    except Exception as e:
        logger.error(f"Error sending enrollment email: {str(e)}")


@api_view(['POST'])
@permission_classes([AllowAny])
def send_semester_fee_notification(request):
    """
    Send first semester fee payment notification
    Body parameters:
        - application_id: Application ID
        - fee_amount: Fee amount
        - due_date: Payment due date
    """
    try:
        application_id = request.data.get('application_id')
        fee_amount = request.data.get('fee_amount', 5000)  # Default fee amount
        due_date = request.data.get('due_date')

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        student_email = application.email
        student_name = application.name_initial or 'Student'

        subject = '💳 First Semester Fee Payment Notification - Periyar University'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .fee-box {{ background: white; padding: 20px; border: 2px solid #43a047; border-radius: 10px; margin: 20px 0; }}
                .amount {{ font-size: 32px; font-weight: bold; color: #43a047; text-align: center; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #43a047; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                .important {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💳 Fee Payment Notification</h1>
                </div>
                <div class="content">
                    <p>Dear {student_name},</p>
                    
                    <p>Congratulations on being eligible for admission! To confirm your enrollment, please complete the first semester fee payment.</p>
                    
                    <div class="fee-box">
                        <p style="margin: 0; text-align: center; color: #666;">First Semester Fee</p>
                        <p class="amount">₹{fee_amount}/-</p>
                        <hr style="border: none; border-top: 1px dashed #ddd; margin: 15px 0;">
                        <p style="margin: 0; text-align: center;"><strong>Application ID:</strong> {application_id}</p>
                        {f'<p style="margin: 0; text-align: center;"><strong>Payment Due Date:</strong> {due_date}</p>' if due_date else ''}
                    </div>
                    
                    <div class="important">
                        <strong>⚠️ Important:</strong> Please complete the payment before the due date to confirm your enrollment and avoid cancellation.
                    </div>
                    
                    <h3>Payment Instructions:</h3>
                    <ol>
                        <li>Login to your student portal</li>
                        <li>Navigate to the "Payments" section</li>
                        <li>Select "First Semester Fee" payment option</li>
                        <li>Complete the payment using online payment gateway</li>
                        <li>Download the receipt for your records</li>
                    </ol>
                    
                    <p>Once payment is confirmed, your enrollment ID will be generated and ID card will be processed.</p>
                    
                    <div class="footer">
                        <p>Centre for Distance and Online Education (CDOE)<br>
                        Periyar University, Salem - 636011<br>
                        Email: pridedirector@periyaruniversity.ac.in | Phone: 0427-2345918</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # Send email using SMTP
        context = ssl._create_unverified_context()
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = student_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)

        logger.info(f"Semester fee notification sent to {student_email}")

        return Response({
            'status': 'success',
            'message': 'Semester fee notification sent successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error sending semester fee notification: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Failed to send notification: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# Add these new endpoints to the end of admin_views.py


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_document(request):
    """
    Validate or invalidate a specific document
    """
    try:
        application_id = request.data.get('application_id')
        document_type = request.data.get('document_type')
        is_valid = request.data.get('is_valid')
        logger.info(f"Validate Document API called with: application_id={application_id}, document_type={document_type}, is_valid={is_valid}")

        if not all([application_id, document_type is not None, is_valid is not None]):
            return Response({
                'status': 'error',
                'message': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update document validation status
        doc_validation = getattr(application, 'document_validation', {}) or {}
        doc_validation[document_type] = is_valid
        application.document_validation = doc_validation
        application.save()

        logger.info(f"Document {document_type} validated as {is_valid} for {application_id}")

        return Response({
            'status': 'success',
            'message': 'Document validation updated'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error validating document: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_enrollment_number(request):
    """
    Generate enrollment number: A25PBA2101000
    - A25: From portal_applicationsettings.admission_code in lsc_admin database
    - PBA: From programme (currently hardcoded, can be made dynamic)
    - 2101: From api_application.lsc_code (extract numbers only)
    - 0001: Sequential number
    """
    try:
        from django.db import connections
        application_id = request.data.get('application_id')
        logger.info(f"Generate Enrollment API called with: application_id={application_id}")

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Extract LSC code (remove LC prefix, keep only numbers)
        lsc_code_full = application.application_id.split('/')[2] if '/' in application.application_id else 'LC2101'
        lsc_code = lsc_code_full.replace('LC', '')  # Remove LC, keep 2101

        # Get admission code from portal_applicationsettings in lsc_admin database
        admission_code = 'A25'  # Default
        try:
            with connections['lsc_admin'].cursor() as cursor:
                cursor.execute("""
                    SELECT admission_code 
                    FROM portal_applicationsettings 
                    WHERE is_open = TRUE 
                    ORDER BY id DESC 
                    LIMIT 1
                """)
                row = cursor.fetchone()
                if row and row[0]:
                    admission_code = row[0]
        except Exception as e:
            logger.warning(f"Could not fetch admission_code from lsc_admin: {e}")

        # Get course code from tbl_course table based on the course applied
        programme_code = 'PBA'  # Default fallback
        course_name = application.course  # Get course from application (e.g., "MASTER OF COMPUTER APPLICATIONS - COMPUTER APPLICATION")
        
        if course_name:
            try:
                with connections['default'].cursor() as cursor:
                    # Try exact match first
                    cursor.execute("""
                        SELECT course_code 
                        FROM tbl_course 
                        WHERE course_short_code = %s OR course_full_name = %s OR degree = %s
                        LIMIT 1
                    """, [course_name, course_name, course_name])
                    row = cursor.fetchone()
                    
                    # If no exact match, try partial match using LIKE
                    if not row:
                        # Extract keywords for matching (e.g., "MCA" from "MASTER OF COMPUTER APPLICATIONS")
                        if 'COMPUTER APPLICATION' in course_name.upper():
                            search_term = 'M.C.A'
                        elif 'BUSINESS ADMINISTRATION' in course_name.upper() or 'MBA' in course_name.upper():
                            search_term = 'M.B.A'
                        elif 'COMMERCE' in course_name.upper():
                            search_term = 'M.COM'
                        elif 'MATHEMATICS' in course_name.upper():
                            search_term = 'M.SC'
                        elif 'ENGLISH' in course_name.upper():
                            search_term = 'M.A'
                        elif 'HISTORY' in course_name.upper():
                            search_term = 'M.A'
                        elif 'SOCIOLOGY' in course_name.upper():
                            search_term = 'M.A'
                        elif 'ECONOMICS' in course_name.upper():
                            search_term = 'M.A'
                        elif 'TAMIL' in course_name.upper():
                            search_term = 'M.A'
                        elif 'DIPLOMA' in course_name.upper():
                            search_term = 'DIPLOMA'
                        elif 'CERTIFICATE' in course_name.upper():
                            search_term = 'Certificate'
                        else:
                            search_term = None
                        
                        if search_term:
                            cursor.execute("""
                                SELECT course_code 
                                FROM tbl_course 
                                WHERE course_short_code = %s OR degree LIKE %s OR course_full_name LIKE %s
                                LIMIT 1
                            """, [search_term, f'%{search_term}%', f'%{search_term}%'])
                            row = cursor.fetchone()
                    
                    if row and row[0]:
                        programme_code = row[0]
                        logger.info(f"Found course_code: {programme_code} for course: {course_name}")
                    else:
                        logger.warning(f"No course_code found for course: {course_name}, using default: {programme_code}")
            except Exception as e:
                logger.error(f"Error fetching course_code: {e}")

        # Get the next sequential number for this specific LSC code only
        # Each LSC should have its own sequence starting from 0001
        # Example: A25PCA2101 should count only enrollments with A25PCA2101
        #          A25PCA2102 should count only enrollments with A25PCA2102
        enrollment_prefix = f"{admission_code}{programme_code}{lsc_code}"
        
        count = Application.objects.filter(
            enrollment_no__startswith=enrollment_prefix,
            enrollment_no__isnull=False
        ).exclude(
            enrollment_no=''
        ).count()

        sequential_number = str(count + 1).zfill(4)  # Pad with zeros: 0001, 0002, etc.
        
        logger.info(f"Generating enrollment for LSC {lsc_code}: Found {count} existing enrollments with prefix {enrollment_prefix}, next will be {sequential_number}")

        # Generate final enrollment number
        enrollment_no = f"{admission_code}{programme_code}{lsc_code}{sequential_number}"

        logger.info(f"Generated enrollment number: {enrollment_no} for {application_id}")

        return Response({
            'status': 'success',
            'enrollment_no': enrollment_no
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error generating enrollment number: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def save_verification(request):
    """
    Save complete verification details including eligibility, admission status, and enrollment number
    """
    try:
        application_id = request.data.get('application_id')
        logger.info(f"Save Verification API called with: application_id={application_id}, payload_fields={list(request.data.keys())}")
        eligibility_status = request.data.get('eligibility_status')
        eligibility_reason = request.data.get('eligibility_reason', '')
        admission_status = request.data.get('admission_status')
        admission_reason = request.data.get('admission_reason', '')
        enrollment_no = request.data.get('enrollment_no', '')
        document_validation = request.data.get('document_validation', {})

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch application
        application = Application.objects.filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update eligibility status
        if eligibility_status:
            application.eligibility_status = eligibility_status
            application.eligibility_verified = (eligibility_status == 'Eligible')
            if eligibility_reason:
                application.verification_remarks = eligibility_reason

        # Update admission status
        if admission_status:
            application.admission_confirmed = (admission_status == 'Confirmed')
            if admission_reason:
                application.rejection_reason = admission_reason

        # Update enrollment number (only if confirmed and eligible)
        if enrollment_no and application.eligibility_verified and application.admission_confirmed:
            application.enrollment_no = enrollment_no

        # Update document validation
        if document_validation:
            application.document_validation = document_validation

        # Set verification date and user
        application.verified_date = datetime.now()
        application.verified_by = 'LSC Admin'  # You can pass actual admin user

        application.save()

        logger.info(f"Verification saved for application: {application_id}")

        return Response({
            'status': 'success',
            'message': 'Verification details saved successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error saving verification: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_invalid_document_email(request):
    """
    Send email notification to student when documents are marked invalid
    Creates a resubmission link for student to upload correct documents
    """
    try:
        application_id = request.data.get('application_id')
        logger.info(f"Send Invalid Document Email API called with: application_id={application_id}, invalid_documents={request.data.get('invalid_documents')}")
        invalid_documents = request.data.get('invalid_documents', [])
        verified_by = request.data.get('verified_by', 'LSC Admin')

        if not application_id:
            return Response({
                'status': 'error',
                'message': 'application_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not invalid_documents:
            return Response({
                'status': 'error',
                'message': 'No invalid documents specified'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send email notification
        result = send_invalid_document_notification(
            application_id=application_id,
            invalid_documents=invalid_documents,
            verified_by=verified_by
        )

        if result['status'] == 'success':
            logger.info(f"Invalid document email sent for application: {application_id}")
            return Response(result, status=status.HTTP_200_OK)
        else:
            logger.error(f"Failed to send email: {result['message']}")
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error(f"Error sending invalid document email: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_resubmission_link(request, token):
    """
    Verify if resubmission token is valid and return application details
    """
    try:
        data, error = verify_resubmission_token(token)
        
        if error:
            return Response({
                'status': 'error',
                'message': error
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get application details using raw query
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT application_id, name_as_aadhaar, email, course, programme_applied
                FROM api_application
                WHERE application_id = %s
            """, [data['application_id']])
            
            result = cursor.fetchone()
            
            if not result:
                return Response({
                    'status': 'error',
                    'message': 'Application not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            app_id, student_name, email, course, programme = result

        return Response({
            'status': 'success',
            'data': {
                'application_id': app_id,
                'name': student_name,
                'email': email,
                'phone': '',  # Phone not in api_application table
                'programme_name': f"{programme} - {course}" if programme and course else (programme or course or 'N/A'),
                'invalid_documents': data['invalid_documents'],
                'expires_at': data['expires_at']
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error verifying resubmission link: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_resubmitted_documents(request, token):
    """
    Handle resubmitted documents from student
    """
    try:
        # Verify token first
        data, error = verify_resubmission_token(token)
        
        if error:
            return Response({
                'status': 'error',
                'message': error
            }, status=status.HTTP_400_BAD_REQUEST)

        application_id = data['application_id']
        
        # Check if application exists
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT application_id, document_validation
                FROM api_application
                WHERE application_id = %s
            """, [application_id])
            
            result = cursor.fetchone()
            
            if not result:
                return Response({
                    'status': 'error',
                    'message': 'Application not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            app_id, doc_validation_json = result

        # Get uploaded file from request
        if 'document' not in request.FILES:
            return Response({
                'status': 'error',
                'message': 'No file uploaded'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'document_type' not in request.POST:
            return Response({
                'status': 'error',
                'message': 'Document type not specified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = request.FILES['document']
        doc_type = request.POST['document_type']
        
        # Validate that this document type is in the invalid documents list
        if doc_type not in data['invalid_documents']:
            return Response({
                'status': 'error',
                'message': f'Document type {doc_type} is not marked for resubmission'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save resubmitted document
        from django.core.files.storage import default_storage
        import os
        import json
        
        # Create resubmit directory if not exists
        upload_dir = f'resubmitted_documents/{application_id}'
        os.makedirs(os.path.join(settings.MEDIA_ROOT, upload_dir), exist_ok=True)
        
        # Save file with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'{doc_type}_{timestamp}_{file_obj.name}'
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        saved_path = default_storage.save(file_path, file_obj)
        
        # Update application with resubmitted document info
        current_validation = json.loads(doc_validation_json) if doc_validation_json else {}
        if 'resubmitted' not in current_validation:
            current_validation['resubmitted'] = {}
        
        current_validation['resubmitted'][doc_type] = {
            'filename': filename,
            'path': saved_path,
            'uploaded_at': datetime.now().isoformat(),
            'status': 'pending_review'
        }
        
        # Update database with raw SQL
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                UPDATE api_application
                SET document_validation = %s
                WHERE application_id = %s
            """, [json.dumps(current_validation), application_id])
            connections['default'].commit()
        
        # Check if all invalid documents have been resubmitted
        all_resubmitted = all(
            doc in current_validation.get('resubmitted', {})
            for doc in data['invalid_documents']
        )
        
        # Only mark token as completed if all documents are resubmitted
        if all_resubmitted:
            mark_resubmission_complete(token)

        logger.info(f"Document {doc_type} resubmitted for application: {application_id}")

        return Response({
            'status': 'success',
            'message': f'{doc_type} uploaded successfully. Your application will be reviewed within 2-3 business days.',
            'document_type': doc_type,
            'all_documents_submitted': all_resubmitted
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error submitting resubmitted documents: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_pending_revalidations(request):
    """
    Get list of students who have resubmitted documents and are pending re-validation
    """
    try:
        from django.db import connections
        
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.application_id,
                    a.name,
                    a.email,
                    a.phone,
                    a.programme_name,
                    a.lsc_code,
                    a.document_validation,
                    a.verified_date
                FROM api_application a
                WHERE JSON_CONTAINS_PATH(a.document_validation, 'one', '$.resubmitted')
                AND NOT JSON_CONTAINS_PATH(a.document_validation, 'one', '$.resubmitted_verified')
                ORDER BY a.verified_date DESC
            """)
            
            rows = cursor.fetchall()
            
            revalidation_list = []
            for row in rows:
                import json
                doc_validation = json.loads(row[6]) if row[6] else {}
                resubmitted = doc_validation.get('resubmitted', {})
                
                revalidation_list.append({
                    'application_id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'phone': row[3],
                    'programme_name': row[4],
                    'lsc_code': row[5],
                    'resubmitted_documents': list(resubmitted.keys()),
                    'resubmitted_date': resubmitted.get(list(resubmitted.keys())[0], {}).get('uploaded_at') if resubmitted else None
                })

        return Response({
            'status': 'success',
            'count': len(revalidation_list),
            'revalidations': revalidation_list
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching pending revalidations: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
