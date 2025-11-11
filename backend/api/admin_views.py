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
from django.db import transaction
from datetime import datetime
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .models import Application, StudentDetails, ApplicationPayment, Student, MarksheetUpload

logger = logging.getLogger(__name__)


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
        applications = Application.objects.using('online_edu').select_related('user').all()

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
                # Get student details
                student_details = StudentDetails.objects.using('online_edu').filter(
                    user=app.user
                ).first()

                # Get payment information
                payment = ApplicationPayment.objects.using('online_edu').filter(
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
                    'name': app.name_initial or app.user.username,
                    'email': app.email,
                    'programme': app.programme_applied or 'N/A',
                    'course': app.course or 'N/A',
                    'community': app.community or 'N/A',
                    'payment_status': 'Paid' if app.payment_status == 'P' else 'Unpaid',
                    'payment_amount': float(payment.amount) if payment else 0.00,
                    'transaction_id': payment.transaction_id if payment else None,
                    'transaction_date': payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if payment and payment.transaction_date else None,
                    'applied_date': app.user.date_joined.strftime('%Y-%m-%d') if app.user.date_joined else None,
                    'lsc_code': app.application_id.split('/')[2] if app.application_id and '/' in app.application_id else None,
                    'has_documents': has_documents,
                    'eligibility_verified': hasattr(app, 'eligibility_verified') and app.eligibility_verified,
                    'eligibility_status': getattr(app, 'eligibility_status', None),
                    'enrollment_no': getattr(app, 'enrollment_no', None),
                    'admission_confirmed': getattr(app, 'admission_confirmed', False),
                    'phone': app.user.username if '@' not in app.user.username else None,
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
        # Fetch application
        application = Application.objects.using('online_edu').filter(
            application_id=application_id
        ).first()

        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get student details
        student_details = StudentDetails.objects.using('online_edu').filter(
            user=application.user
        ).first()

        # Get payment info
        payment = ApplicationPayment.objects.using('online_edu').filter(
            application_id=application_id
        ).first()

        # Get marksheet uploads
        marksheet_uploads = []
        if student_details:
            uploads = MarksheetUpload.objects.using('online_edu').filter(
                student=student_details
            )
            marksheet_uploads = [{
                'type': upload.qualification_type,
                'url': upload.file_url,
                'uploaded_at': upload.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')
            } for upload in uploads]

        # Build comprehensive response
        response_data = {
            'application_no': application.application_id,
            'applied_date': application.user.date_joined.strftime('%d-%m-%Y') if application.user.date_joined else None,
            'lsc_code': application.application_id.split('/')[2] if application.application_id and '/' in application.application_id else None,
            
            # Programme Information
            'programme_applied': application.programme_applied,
            'course': application.course,
            'medium': application.medium,
            'mode_of_study': application.mode_of_study,
            'academic_year': application.academic_year,
            
            # Personal Information
            'name': application.name_initial,
            'dob': application.dob.strftime('%d-%m-%Y') if application.dob else None,
            'gender': application.gender,
            'father_name': application.father_name,
            'mother_name': application.mother_name,
            'guardian_name': application.guardian_name,
            'nationality': application.nationality,
            'religion': application.religion,
            'community': application.community,
            'aadhaar_no': application.aadhaar_no,
            'name_as_aadhaar': application.name_as_aadhaar,
            'abc_id': application.abc_id,
            'deb_id': application.deb_id,
            'differently_abled': application.differently_abled,
            'blood_group': application.blood_group,
            'access_internet': application.access_internet,
            
            # Contact Information
            'email': application.email,
            'phone': application.user.username if '@' not in application.user.username else None,
            
            # Address Information
            'comm_address': {
                'town': application.comm_town,
                'district': application.comm_district,
                'state': application.comm_state,
                'pincode': application.comm_pincode,
                'country': application.comm_country,
                'area': application.comm_area
            },
            'perm_address': {
                'town': application.perm_town,
                'district': application.perm_district,
                'state': application.perm_state,
                'pincode': application.perm_pincode,
                'country': application.perm_country,
                'area': application.perm_area
            },
            
            # Education Qualifications
            'qualifications': student_details.qualifications if student_details else [],
            
            # Working Experience
            'current_designation': student_details.current_designation if student_details else None,
            'current_institute': student_details.current_institute if student_details else None,
            'years_experience': student_details.years_experience if student_details else 0,
            'annual_income': student_details.annual_income if student_details else 0,
            
            # Payment Information
            'payment_status': 'Paid' if application.payment_status == 'P' else 'Unpaid',
            'payment_details': {
                'order_id': payment.order_id if payment else None,
                'amount': float(payment.amount) if payment else 0.00,
                'transaction_id': payment.transaction_id if payment else None,
                'bank_transaction_id': payment.bank_transaction_id if payment else None,
                'transaction_date': payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if payment and payment.transaction_date else None,
                'payment_mode': payment.payment_mode if payment else None,
                'bank_name': payment.bank_name if payment else None,
                'status': payment.payment_status if payment else None
            },
            
            # Document URLs
            'documents': {
                'photo': student_details.photo_url if student_details else None,
                'signature': student_details.signature_url if student_details else None,
                'sslc_marksheet': student_details.sslc_marksheet_url if student_details else None,
                'hsc_marksheet': student_details.hsc_marksheet_url if student_details else None,
                'ug_marksheet': student_details.ug_marksheet_url if student_details else None,
                'community_certificate': student_details.community_certificate_url if student_details else None,
                'aadhaar_card': student_details.aadhaar_url if student_details else None,
                'transfer_certificate': student_details.transfer_certificate_url if student_details else None,
                'semester_marksheets': marksheet_uploads
            },
            
            # Verification Status
            'eligibility_verified': getattr(application, 'eligibility_verified', False),
            'eligibility_status': getattr(application, 'eligibility_status', None),
            'verification_remarks': getattr(application, 'verification_remarks', None),
            'verified_by': getattr(application, 'verified_by', None),
            'verified_date': getattr(application, 'verified_date', None),
            
            # Admission Status
            'admission_confirmed': getattr(application, 'admission_confirmed', False),
            'enrollment_no': getattr(application, 'enrollment_no', None),
            'rejection_reason': getattr(application, 'rejection_reason', None),
        }

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
        application = Application.objects.using('online_edu').filter(
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
        
        application.save(using='online_edu')

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
        application = Application.objects.using('online_edu').filter(
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
        existing_count = Application.objects.using('online_edu').filter(
            status='Completed'
        ).count()
        
        enrollment_no = f"PU/ODL/{year}/{program_code}/{str(existing_count + 1).zfill(5)}"
        
        # Update application status
        application.status = 'Completed'
        application.save(using='online_edu')

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
        application = Application.objects.using('online_edu').filter(
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
