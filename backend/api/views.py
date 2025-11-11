from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import Student, Application, StudentDetails, Courses, Payment, ApplicationPayment, AllCourses
from .serializers import ApplicationSerializer, StudentDetailsSerializer
from .utils import get_real_academic_year
from .models import StudentDetails, MarksheetUpload
import random
import time
import smtplib
import ssl
import logging
from django.db import IntegrityError
import json


logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    otp = str(random.randint(100000, 999999))
    cache.set(email, otp, timeout=300)

    try:
        logger.info(f"Sending OTP to {email}: {otp}")
        context = ssl._create_unverified_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.sendmail(
                settings.DEFAULT_FROM_EMAIL,
                email,
                f"Subject: Your OTP Code\n\nYour OTP code is {otp}"
            )
        logger.info(f"OTP sent successfully to {email}")
        return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Failed to send OTP to {email}: {str(e)}")
        return Response({'error': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    if not all([email, otp]):
        logger.warning(f"Missing fields in verify_otp: email={email}, otp={otp}")
        return Response({'status': 'error', 'message': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    cached_otp = cache.get(email)
    logger.info(f"Verifying OTP for {email}: cached={cached_otp}, provided={otp}")
    if cached_otp == otp:
        cache.set(email, 'VERIFIED', timeout=300)
        logger.info(f"OTP verified for {email}, set cache to VERIFIED")
        return Response({'status': 'success', 'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
    logger.warning(f"Invalid OTP for {email}: cached={cached_otp}, provided={otp}")
    return Response({'status': 'error', 'message': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    name = request.data.get('name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    password = request.data.get('password')
    
    # Get LSC referral information
    lsc_code = request.data.get('lsc_code')
    lsc_name = request.data.get('lsc_name')
    
    if not all([name, email, phone, password]):
        missing_fields = [field for field, value in [('name', name), ('email', email), ('phone', phone), ('password', password)] if not value]
        logger.warning(f"Missing fields in signup: {', '.join(missing_fields)} for email: {email}")
        return Response({
            'status': 'error',
            'message': f"Please provide all required fields: {', '.join(missing_fields)}"
        }, status=status.HTTP_400_BAD_REQUEST)

    if cache.get(email) != 'VERIFIED':
        logger.warning(f"OTP not verified for email: {email}")
        return Response({
            'status': 'error',
            'message': 'Please verify your email with the OTP sent to you'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        student_data = {
            'name': name,
            'email': email,
            'phone': phone,
            'password': password,  # Note: Storing plain-text passwords is insecure; consider hashing
            'is_verified': True
        }
        
        # Add LSC information if provided
        if lsc_code:
            student_data['lsc_code'] = lsc_code
            student_data['lsc_name'] = lsc_name
            logger.info(f"Student signup via LSC: {lsc_code} - {lsc_name}")
        
        Student.objects.using('online_edu').create(**student_data)
        cache.delete(email)
        logger.info(f"Signup successful for email: {email}")
        return Response({
            'status': 'success',
            'message': 'Account created successfully. You can now log in.'
        }, status=status.HTTP_200_OK)
    except IntegrityError as e:
        logger.error(f"Integrity error during signup for {email}: {str(e)}")
        # Check if error is due to email or phone uniqueness
        if 'email' in str(e).lower():
            return Response({
                'status': 'error',
                'message': 'This email is already registered. Please use a different email or log in.'
            }, status=status.HTTP_400_BAD_REQUEST)
        elif 'phone' in str(e).lower():
            return Response({
                'status': 'error',
                'message': 'This phone number is already registered. Please use a different phone number.'
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'status': 'error',
                'message': 'Unable to create account. Please try again later.'
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Signup error for {email}: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'An unexpected error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not all([email, password]):
        missing_fields = [field for field, value in [('email', email), ('password', password)] if not value]
        logger.warning(f"Missing fields in login: {', '.join(missing_fields)} for email: {email}")
        return Response({
            'status': 'error',
            'message': f"Please provide {', '.join(missing_fields)}"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = Student.objects.using('online_edu').get(email=email, password=password, is_verified=True)
        
        # Create or get User in default database for token authentication
        user, created = User.objects.using('default').get_or_create(
            username=email, 
            defaults={'email': email}
        )
        
        # Create token in default database
        token, _ = Token.objects.using('default').get_or_create(user=user)
        
        logger.info(f"Login successful for {email}")
        return Response({
            'status': 'success',
            'message': 'Login successful. Welcome back!',
            'token': token.key
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        logger.warning(f"Invalid login attempt for {email}")
        # Check if the email exists but is unverified or has wrong password
        if Student.objects.using('online_edu').filter(email=email, is_verified=False).exists():
            return Response({
                'status': 'error',
                'message': 'Your account is not verified. Please verify your email with the OTP.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        elif Student.objects.using('online_edu').filter(email=email).exists():
            return Response({
                'status': 'error',
                'message': 'Incorrect password. Please try again or reset your password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                'status': 'error',
                'message': 'No account found with this email. Please sign up or check your email.'
            }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Login error for {email}: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'An unexpected error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        Student.objects.using('online_edu').get(email=email)
        otp = str(random.randint(100000, 999999))
        cache.set(email, {'otp': otp, 'time': time.time()}, timeout=300)
        send_mail(
            'Password Reset OTP',
            f'Your OTP is {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False
        )
        return Response({'status': 'success', 'message': 'OTP sent'}, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'status': 'error', 'message': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    stored_data = cache.get(email)
    if stored_data and isinstance(stored_data, dict):
        if time.time() - stored_data['time'] > 300:
            cache.delete(email)
            return Response({'status': 'error', 'message': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
        if stored_data['otp'] == otp:
            cache.set(email, 'VERIFIED', timeout=300)
            return Response({'status': 'success', 'message': 'OTP verified'}, status=status.HTTP_200_OK)
    return Response({'status': 'error', 'message': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if new_password != confirm_password:
        return Response({'status': 'error', 'message': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    if cache.get(email) != 'VERIFIED':
        return Response({'status': 'error', 'message': 'OTP not verified'}, status=status.HTTP_403_FORBIDDEN)

    try:
        student = Student.objects.using('online_edu').get(email=email)
        student.set_password(new_password)
        # Update User in default database
        user = User.objects.using('default').get(username=email)
        user.set_password(new_password)
        user.save(using='default')
        student.save(using='online_edu')
        cache.delete(email)
        return Response({'status': 'success', 'message': 'Password reset successful'}, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'status': 'error', 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# api/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    try:
        user = request.user
        student = Student.objects.using('online_edu').filter(email=user.email).first()
        return Response(
            {
                "status": "success",
                "data": {
                    "email": user.email,
                    "name": student.name if student else user.username or 'User',
                    "phone": student.phone if student else '',
                    "username": user.username or user.email
                }
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        return Response(
            {"status": "error", "message": "An error occurred while fetching profile"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def applications_view(request):
    user = request.user
    active_apps = Application.objects.filter(user=user, is_active=True, status='In Progress')
    opened_apps = Application.objects.filter(user=user, is_active=True, status='Draft')
    closed_apps = Application.objects.filter(user=user, is_active=False, status='Completed')
    cancelled_apps = Application.objects.filter(user=user, is_active=False, status='Cancelled')

    active_serializer = ApplicationSerializer(active_apps, many=True)
    opened_serializer = ApplicationSerializer(opened_apps, many=True)
    closed_serializer = ApplicationSerializer(closed_apps, many=True)
    cancelled_serializer = ApplicationSerializer(cancelled_apps, many=True)

    return Response({
        "status": "success",
        "data": {
            "active": active_serializer.data,
            "opened": opened_serializer.data,
            "closed": closed_serializer.data,
            "cancelled": cancelled_serializer.data
        }
    }, status=200)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_academic_year_view(request):
    academic_year = get_real_academic_year()
    return Response({"academic_year": academic_year}, status=status.HTTP_200_OK)



import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_courses(request):
    try:
        courses = Courses.objects.all().values('degree')
        course_list = list(courses)
        logger.info(f"Fetched {len(course_list)} courses: {[course['degree'] for course in course_list]}")
        return Response({
            'status': 'success',
            'data': course_list
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching courses: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error fetching courses: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_application_page1(request):
    user = request.user
    data = request.data.copy()
    data['user'] = user.id
    data['email'] = user.email

    academic_year = data.get('academic_year')
    course = data.get('course')

    if not academic_year:
        return Response({"status": "error", "message": "Academic year is required."}, status=400)

    # Validate course against Courses table
    if course and not Courses.objects.filter(degree=course).exists():
        return Response({"status": "error", "message": "Invalid course selected."}, status=400)

    try:
        application = Application.objects.get(user=user, academic_year=academic_year)
        serializer = ApplicationSerializer(application, data=data, partial=True)
    except Application.DoesNotExist:
        serializer = ApplicationSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response({
            "status": "success",
            "message": "Form saved successfully",
            "data": serializer.data
        })

    return Response({"status": "error", "errors": serializer.errors}, status=400)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_application_page2(request):
    user = request.user
    data = request.data.copy()
    data['email'] = user.email

    try:
        # Convert all empty strings to None
        for key, value in data.items():
            if value == '' or value is None:
                data[key] = None

        # Explicit logic to nullify unused fields
        if data.get('parent_selected') in ['true', True, 'True']:
            data['guardian_name'] = None
            data['guardian_occupation'] = None
        elif data.get('guardian_selected') in ['true', True, 'True']:
            data['father_name'] = None
            data['father_occupation'] = None
            data['mother_name'] = None
            data['mother_occupation'] = None

        if data.get('same_as_comm') in ['true', True, 'True']:
            data['perm_pincode'] = data.get('comm_pincode')
            data['perm_district'] = data.get('comm_district')
            data['perm_state'] = data.get('comm_state')
            data['perm_country'] = data.get('comm_country')
            data['perm_town'] = data.get('comm_town')
            data['perm_area'] = data.get('comm_area')

        # Special handling for disability_type
        if data.get('differently_abled') != 'Yes':
            data['disability_type'] = None

        # Save or update Application
        instance, created = Application.objects.get_or_create(
            user=user,
            defaults={'email': user.email}
        )

        serializer = ApplicationSerializer(instance, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Application saved successfully'}, status=200)
        else:
            print('Serializer errors:', serializer.errors)
            return Response(serializer.errors, status=400)

    except Exception as e:
        print('Exception:', str(e))
        return Response({'error': str(e)}, status=400)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import Student, Application, StudentDetails, MarksheetUpload, Payment
from .serializers import ApplicationSerializer, StudentDetailsSerializer, StudentSerializer, MarksheetUploadSerializer
from .utils import get_real_academic_year
import random
import time
import smtplib
import ssl
import logging
import json
import os
import tempfile
from PIL import Image
from django.http import HttpResponse, FileResponse, Http404
from urllib.parse import quote
import razorpay
import hmac
import hashlib
import uuid
from django.db import connection
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime

logger = logging.getLogger(__name__)

# Existing views (send_otp, verify_otp, signup, login_view, etc.) remain unchanged
# ... [Previous views unchanged]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application(request):
    try:
        user = request.user
        logger.debug(f"Fetching payments for user: {user.email} (ID: {user.id})")
        
        # Fetch payments by user
        payments = Payment.objects.filter(user=user)
        logger.debug(f"Payments found by user: {payments.count()}")

        # Fallback: Fetch by email if no payments found
        if not payments.exists():
            payments = Payment.objects.filter(email=user.email)
            logger.debug(f"Payments found by email {user.email}: {payments.count()}")

        def serialize_payment(payment):
            return {
                'id': payment.application_id,
                'status': payment.payment_status,
                'email': payment.email,
                'name': payment.user_name or user.get_full_name() or user.username,
                'course': payment.course or 'N/A',
                'transaction_id': payment.transaction_id or None,
                'amount_paid': float(payment.amount) if payment.amount else None,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
            }

        # Group payments by status
        response_data = {
            'active': [serialize_payment(p) for p in payments if p.payment_status == 'created'],
            'closed': [serialize_payment(p) for p in payments if p.payment_status == 'success'],
            'opened': [serialize_payment(p) for p in payments if p.payment_status == 'created'],
            'cancelled': [serialize_payment(p) for p in payments if p.payment_status == 'cancelled'],
            'failed': [serialize_payment(p) for p in payments if p.payment_status == 'failed'],
        }

        logger.debug(f"Response data: {response_data}")
        return Response({'status': 'success', 'data': response_data})
    except Exception as e:
        logger.error(f"Error fetching applications for user {request.user.email}: {str(e)}")
        return Response({'status': 'error', 'message': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_dummy_payment(request):
    """
    Dummy payment verification endpoint
    Generates Application ID in format: PU/ODL/LC2101/A24/0001
    """
    try:
        user = request.user
        logger.info(f"Processing dummy payment for user: {user.email}")
        
        # Get the student to fetch LSC code
        try:
            student = Student.objects.get(email=user.email)
            lsc_code = student.lsc_code or "LC0000"  # Default if no LSC code
        except Student.DoesNotExist:
            lsc_code = "LC0000"
            logger.warning(f"Student not found for {user.email}, using default LSC code")
        
        # Get the application to fetch mode_of_study
        try:
            application = Application.objects.get(user=user)
        except Application.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Application not found. Please complete your application first.'
            }, status=404)
        
        # Check if application already has an ID
        if application.application_id:
            return Response({
                'status': 'error',
                'message': 'Payment already completed for this application.',
                'application_id': application.application_id
            }, status=400)
        
        # Generate Application ID
        # Format: PU/MODE/LSC_CODE/YEAR/NUMBER
        # Example: PU/ODL/LC2101/A24/0001
        
        # Determine mode code
        mode_mapping = {
            'Online': 'ODL',
            'Distance': 'DL',
            'Regular': 'REG',
            'Part-Time': 'PT'
        }
        mode_code = mode_mapping.get(application.mode_of_study, 'ODL')
        
        # Get year code from academic_year or current year
        from datetime import datetime
        if application.academic_year:
            # Extract year from academic_year (e.g., "2024-25" -> "A24")
            year_part = application.academic_year.split('-')[0]
            year_code = f"A{year_part[-2:]}"
        else:
            # Use current year
            current_year = datetime.now().year
            year_code = f"A{str(current_year)[-2:]}"
        
        # Get the next serial number for this combination
        # Find the latest application with similar pattern
        pattern_prefix = f"PU/{mode_code}/{lsc_code}/{year_code}/"
        latest_app = Application.objects.filter(
            application_id__startswith=pattern_prefix
        ).order_by('-application_id').first()
        
        if latest_app and latest_app.application_id:
            # Extract the serial number from the last application
            last_serial = int(latest_app.application_id.split('/')[-1])
            new_serial = last_serial + 1
        else:
            new_serial = 1
        
        # Format serial number as 4 digits
        serial_number = f"{new_serial:04d}"
        
        # Create the full application ID
        application_id = f"PU/{mode_code}/{lsc_code}/{year_code}/{serial_number}"
        
        # Update application
        application.application_id = application_id
        application.payment_status = 'P'  # Paid
        application.status = 'Completed'
        application.save()
        
        # Generate transaction details
        from django.utils import timezone
        now = timezone.now()
        txn_id = f"TXN{now.strftime('%Y%m%d%H%M%S')}"
        bank_txn_id = f"BANK{now.strftime('%Y%m%d%H%M%S%f')[:20]}"
        order_id = f"ORDER{now.strftime('%Y%m%d%H%M%S')}"
        
        # Get amount from course or default
        amount = 236.00  # Default application fee
        try:
            if application.course:
                course = AllCourses.objects.filter(degree=application.course).first()
                if course:
                    amount = float(course.application_fee)
        except Exception as e:
            logger.warning(f"Could not fetch course fee: {str(e)}")
        
        # Create ApplicationPayment record (feepayment table)
        try:
            fee_payment = ApplicationPayment.objects.create(
                user=user,
                application_id=application_id,
                user_name=application.name_initial or student.name,
                email=user.email,
                phone=student.phone if student else '',
                transaction_id=txn_id,
                bank_transaction_id=bank_txn_id,
                order_id=order_id,
                amount=amount,
                course=application.course,
                payment_status='TXN_SUCCESS',
                transaction_type='DEBIT',
                gateway_name='DUMMY_GATEWAY',
                response_code='01',
                response_message='Txn Success',
                bank_name='TEST_BANK',
                payment_mode='DUMMY',
                refund_amount='0',
                mid='MERCHANT001',
                transaction_date=now,
                payment_type='APPLICATION_FEE'
            )
            logger.info(f"Created feepayment record with ID: {fee_payment.id} for application: {application_id}")
        except Exception as e:
            logger.warning(f"Could not create feepayment record: {str(e)}")
        
        # Create/Update Payment record in online_edu.payments table
        try:
            payment, created = Payment.objects.update_or_create(
                user=user,
                application_id=application_id,
                defaults={
                    'user_name': application.name_initial or student.name,
                    'email': user.email,
                    'phone': student.phone if student else '',
                    'transaction_id': txn_id,
                    'amount': amount,
                    'course': application.course,
                    'payment_status': 'success'
                }
            )
            action = "Created" if created else "Updated"
            logger.info(f"{action} Payment record in online_edu.payments for {user.email} with transaction_id: {txn_id}")
        except Exception as e:
            logger.warning(f"Could not create/update payment record in online_edu.payments: {str(e)}")
        
        logger.info(f"Generated Application ID: {application_id} for user: {user.email}")
        
        return Response({
            'status': 'success',
            'message': 'Payment verified successfully!',
            'application_id': application_id,
            'data': {
                'application_id': application_id,
                'mode_of_study': application.mode_of_study,
                'lsc_code': lsc_code,
                'year_code': year_code,
                'serial_number': serial_number,
                'student_name': application.name_initial or student.name,
                'email': user.email,
                'transaction_id': txn_id,
                'bank_transaction_id': bank_txn_id,
                'order_id': order_id,
                'amount': str(amount),
                'payment_mode': 'DUMMY_GATEWAY',
                'transaction_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'status': 'SUCCESS'
            }
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error verifying dummy payment for {request.user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_payment(request):
    """
    Clear payment and reset application to allow new application.
    This will:
    1. Reset the application to Draft status
    2. Clear application_id
    3. Reset payment_status to Not Paid
    4. Delete any pending payments
    """
    try:
        user = request.user
        logger.info(f"Clearing payment for user: {user.email}")
        
        # Get the application
        try:
            application = Application.objects.get(user=user)
        except Application.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Application not found.'
            }, status=404)
        
        # Reset application
        application.application_id = None
        application.payment_status = 'N'  # Not Paid
        application.status = 'Draft'
        application.save()
        
        # Delete pending payments from old Payment table
        Payment.objects.filter(user=user, payment_status='created').delete()
        
        # Delete ApplicationPayment records (feepayment table)
        try:
            ApplicationPayment.objects.filter(user=user).delete()
            logger.info(f"Deleted ApplicationPayment records for user: {user.email}")
        except Exception as e:
            logger.warning(f"Could not delete ApplicationPayment records: {str(e)}")
        
        # Delete completed payments (optional - comment out if you want to keep history)
        # Payment.objects.filter(user=user).delete()
        
        logger.info(f"Payment cleared successfully for user: {user.email}")
        
        return Response({
            'status': 'success',
            'message': 'Payment cleared successfully. You can now start a new application.'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error clearing payment for {request.user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application_payment_data(request):
    """
    Get application data for payment page including:
    - Student details (name, lsc_code)
    - Application details (mode_of_study, academic_year, application_id, payment_status)
    - Current admission settings (admission_code)
    """
    try:
        user = request.user
        logger.info(f"Fetching application payment data for user: {user.email}")
        
        # Get Student
        try:
            student = Student.objects.get(email=user.email)
        except Student.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Student profile not found. Please complete your profile first.'
            }, status=404)
        
        # Get Application
        try:
            application = Application.objects.get(user=user)
        except Application.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Application not found. Please complete your application first.'
            }, status=404)
        
        # Get Active Admission Settings from lsc_admindb (portal_applicationsettings)
        from portal.models import ApplicationSettings
        try:
            admission_settings = ApplicationSettings.objects.filter(
                is_active=True,
                status='OPEN'
            ).first()
            
            if admission_settings:
                admission_code = admission_settings.admission_code
                admission_year = admission_settings.admission_year
            else:
                # Fallback to application's academic_year
                if application.academic_year:
                    # Extract year code from academic_year (e.g., "2024-25" -> "A24")
                    year_part = application.academic_year.split('-')[0][-2:]
                    admission_code = f"A{year_part}"
                    admission_year = application.academic_year
                else:
                    admission_code = "A25"
                    admission_year = "2025-26"
        except Exception as e:
            logger.warning(f"Could not fetch admission settings: {str(e)}")
            # Fallback
            if application.academic_year:
                year_part = application.academic_year.split('-')[0][-2:]
                admission_code = f"A{year_part}"
                admission_year = application.academic_year
            else:
                admission_code = "A25"
                admission_year = "2025-26"
        
        # Get mode mapping
        mode_mapping = {
            'Online': 'ODL',
            'Distance': 'DL',
            'Regular': 'REG',
            'Part-Time': 'PT'
        }
        mode_code = mode_mapping.get(application.mode_of_study, 'ODL')
        
        # Build response data
        response_data = {
            'student': {
                'name': student.name,
                'email': student.email,
                'lsc_code': student.lsc_code or 'LSC001',
                'lsc_name': student.lsc_name or 'Default Center'
            },
            'application': {
                'id': application.id,
                'application_id': application.application_id,
                'mode_of_study': application.mode_of_study,
                'mode_code': mode_code,
                'academic_year': application.academic_year or admission_year,
                'status': application.status,
                'payment_status': application.payment_status
            },
            'admission': {
                'admission_code': admission_code,
                'admission_year': admission_year
            },
            'application_id_format': {
                'prefix': 'PU',
                'mode': mode_code,
                'lsc': student.lsc_code or 'LSC001',
                'year': admission_code,
                'format': f"PU/{mode_code}/{student.lsc_code or 'LSC001'}/{admission_code}/XXXX"
            }
        }
        
        logger.info(f"Application payment data retrieved successfully for {user.email}")
        
        return Response({
            'status': 'success',
            'data': response_data
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error fetching application payment data for {request.user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=500)

        
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Application
from .serializers import ApplicationSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_autofill_application(request):
    user = request.user

    try:
        # Query from online_edu database
        application = Application.objects.using('online_edu').filter(user=user).first()
        if not application:
            return Response({
                'status': 'success',
                'message': 'No application data found',
                'data': None
            }, status=200)

        serializer = ApplicationSerializer(application)
        return Response({
            'status': 'success',
            'message': 'Data retrieved successfully',
            'data': serializer.data
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_autofill_application: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


class ApplicationPage3View(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info(f"Received token: {request.headers.get('Authorization')}")
        logger.info(f"Authenticated user: {request.user}")
        try:
            application = Application.objects.filter(user=request.user).first()
            email = application.email if application else request.user.email
            name_initial = application.name_initial if application else ''
            
            logger.info(f"Fetched from Application - email: {email}, name_initial: {name_initial}")
            
            try:
                student_details = StudentDetails.objects.get(user=request.user)
                serializer = StudentDetailsSerializer(student_details)
                response_data = serializer.data
                # Ensure name_initial and email are always present from Application
                response_data['email'] = email
                response_data['name_initial'] = name_initial or response_data.get('name_initial', '')
                logger.info(f"Returning existing StudentDetails with name_initial: {response_data['name_initial']}")
            except StudentDetails.DoesNotExist:
                logger.info(f"StudentDetails not found, creating default response with name_initial: {name_initial}")
                response_data = {
                    'email': email,
                    'name_initial': name_initial,
                    'qualifications': [],
                    'semester_marks': [],
                    'current_designation': '',
                    'current_institute': '',
                    'years_experience': '',
                    'annual_income': ''
                }
            return Response({'status': 'success', 'data': response_data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in GET /api/application/page3/: {str(e)}")
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            application = Application.objects.filter(user=request.user).first()
            email = application.email if application else request.user.email
            name_initial = application.name_initial if application else ''

            logger.info(f"POST data: {request.data}")
            
            # Prepare data ensuring email and name_initial from Application
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['email'] = email
            data['name_initial'] = name_initial

            student_details, created = StudentDetails.objects.get_or_create(
                user=request.user,
                defaults={'email': email, 'name_initial': name_initial}
            )
            
            logger.info(f"StudentDetails {'created' if created else 'found'} for user: {request.user.username}")
            
            serializer = StudentDetailsSerializer(student_details, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Page 3 saved successfully for user: {request.user.username}")
                return Response({
                    'status': 'success',
                    'message': 'Page 3 submitted successfully'
                }, status=status.HTTP_200_OK)
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response({
                'status': 'error',
                'message': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in POST /api/application/page3/: {str(e)}")
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import StudentDetails, MarksheetUpload
from .serializers import StudentDetailsSerializer
from .utils import get_real_academic_year
# Duplicate imports removed - already imported at top of file
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_documents(request):
    logger.info(f"Received document upload request: FILES={list(request.FILES.keys())}, POST={request.POST}")
    user = request.user
    email = request.data.get('email')

    if not email:
        logger.warning("Email is required")
        return Response({
            'status': 'error',
            'message': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if email != user.email:
        logger.warning(f"Email mismatch: provided={email}, user={user.email}")
        return Response({
            'status': 'error',
            'message': 'Provided email does not match authenticated user'
        }, status=status.HTTP_403_FORBIDDEN)

    document_types = [
        ('photo', ['image/jpeg', 'image/jpg'], 30 * 1024, None),  # 30 KB
        ('signature', ['image/jpeg', 'image/jpg'], 20 * 1024, None),  # 20 KB
        ('community_certificate', ['image/jpeg', 'image/jpg', 'application/pdf'], 300 * 1024, None),  # 300 KB
        ('aadhar_card', ['image/jpeg', 'image/jpg', 'application/pdf'], 300 * 1024, None),  # 300 KB
        ('transfer_certificate', ['image/jpeg', 'image/jpg', 'application/pdf'], 300 * 1024, None),  # 300 KB
    ]

    temp_files = []
    uploaded_urls = {}
    try:
        logger.info(f"Creating/getting folder for email: {email}")
        # Import local storage utility
        from .utils import create_user_folder_structure, upload_to_local_storage
        
        # Create folder structure for user
        folder_paths = create_user_folder_structure(email)

        for doc_type, valid_types, max_size, dimensions in document_types:
            file = request.FILES.get(doc_type)
            if not file:
                logger.warning(f"No file provided for {doc_type}")
                continue

            if file.content_type not in valid_types:
                logger.warning(f"Invalid file type for {doc_type}: {file.content_type}")
                return Response({
                    'status': 'error',
                    'message': f'Invalid file type for {doc_type}. Allowed: {", ".join(valid_types)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            if file.size > max_size:
                logger.warning(f"File size too large for {doc_type}: {file.size} bytes")
                return Response({
                    'status': 'error',
                    'message': f'File size for {doc_type} exceeds {max_size // 1024 // 1024}MB limit'
                }, status=status.HTTP_400_BAD_REQUEST)

            file_extension = file.name.split('.')[-1].lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
                temp_files.append(temp_file_path)

            if dimensions and file.content_type.startswith('image/'):
                try:
                    with Image.open(temp_file_path) as img:
                        width, height = img.size
                        if (width, height) != dimensions:
                            logger.warning(f"Invalid dimensions for {doc_type}: got {width}x{height}, expected {dimensions[0]}x{dimensions[1]}")
                            return Response({
                                'status': 'error',
                                'message': f'Invalid dimensions for {doc_type}. Required: {dimensions[0]}x{dimensions[1]}px, Got: {width}x{height}px'
                            }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    logger.error(f"Failed to validate dimensions for {doc_type}: {str(e)}")
                    return Response({
                        'status': 'error',
                        'message': f'Failed to validate image dimensions for {doc_type}: {str(e)}'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Map document type to folder name
            folder_mapping = {
                'photo': 'Photo',
                'signature': 'Signature',
                'community_certificate': 'Community_Certificate',
                'aadhar_card': 'Aadhar_Card',
                'transfer_certificate': 'Transfer_Certificate',
            }
            folder_name = folder_mapping[doc_type]
            file_name = f"{email.replace('@', '_at_').replace('.', '_')}_{doc_type}_{file.name}"
            
            try:
                # Upload to local storage
                file_url = upload_to_local_storage(temp_file_path, file_name, folder_paths[folder_name])
                logger.info(f"Uploaded {doc_type} to local storage: {file_url}")
                uploaded_urls[doc_type] = file_url
            except Exception as e:
                logger.error(f"Failed to upload {doc_type}: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': f'Failed to upload {doc_type} to local storage: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not uploaded_urls:
            logger.warning("No documents were uploaded")
            return Response({
                'status': 'error',
                'message': 'No valid documents were provided for upload'
            }, status=status.HTTP_400_BAD_REQUEST)

        student_details, created = StudentDetails.objects.get_or_create(
            user=user,
            defaults={'email': email, 'name_initial': ''}
        )

        url_mapping = {
            'photo': 'photo_url',
            'signature': 'signature_url',
            'community_certificate': 'community_certificate_url',
            'aadhar_card': 'aadhaar_url',
            'transfer_certificate': 'transfer_certificate_url',
        }

        for doc_type, url in uploaded_urls.items():
            setattr(student_details, url_mapping[doc_type], url)
        
        student_details.save()
        logger.info(f"Updated StudentDetails with document URLs for {email}")

        return Response({
            'status': 'success',
            'message': 'Documents uploaded successfully',
            'urls': uploaded_urls
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error uploading documents: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Error uploading documents: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        for temp_file_path in temp_files:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"Cleaned up temporary file: {temp_file_path}")
                except Exception as e:
                    logger.error(f"Error cleaning up temporary file: {str(e)}")

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def educational_details(request):
    user = request.user
    try:
        student_details = StudentDetails.objects.get(user=user)
    except StudentDetails.DoesNotExist:
        student_details = None

    if request.method == 'GET':
        if student_details:
            serializer = StudentDetailsSerializer(student_details)
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)
        return Response({'status': 'success', 'data': {}}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data.copy()
        data['user'] = user.id
        data['email'] = user.email
        data['academic_year'] = get_real_academic_year()

        serializer = StudentDetailsSerializer(instance=student_details, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_200_OK)
        return Response({'status': 'error', 'message': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_marksheet(request):
    logger.info(f"Received upload request: FILES={request.FILES}, POST={request.POST}")
    logger.info(f"Request data: {request.data}")
    logger.info(f"Content-Type: {request.content_type}")
    
    user = request.user
    file = request.FILES.get('file')
    qualification_type = request.POST.get('qualification_type') or request.data.get('qualification_type')
    
    # Get email from frontend or from authenticated user's records
    email = request.POST.get('email') or request.data.get('email')
    if not email:
        logger.info(f"Email not in request, looking up for user: {user.username}")
        try:
            # Try Student model first
            student = Student.objects.using('online_edu').get(email=user.email)
            email = student.email
            logger.info(f"Got email from Student model: {email}")
        except Student.DoesNotExist:
            logger.warning(f"Student record not found for user: {user.username}, trying Application model")
            try:
                # Try Application model
                application = Application.objects.get(user=user)
                email = application.email
                logger.info(f"Got email from Application model: {email}")
            except Application.DoesNotExist:
                logger.error(f"No Student or Application record found for user: {user.username}")
                return Response({
                    'status': 'error',
                    'message': 'User email not found. Please complete your profile first.'
                }, status=status.HTTP_400_BAD_REQUEST)

    logger.info(f"Parsed values - file: {file}, qualification_type: {qualification_type}, email: {email}")

    # Validate inputs
    if not all([file, qualification_type, email]):
        logger.warning(f"Missing required fields - file: {file is not None}, qualification_type: {qualification_type}, email: {email}")
        return Response({
            'status': 'error',
            'message': 'File, qualification type, and email are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate file extension
    allowed_extensions = ['pdf', 'jpg', 'jpeg']
    file_extension = file.name.split('.')[-1].lower()
    if file_extension not in allowed_extensions:
        logger.warning(f"Invalid file extension: {file_extension}")
        return Response({
            'status': 'error',
            'message': 'Only PDF, JPG, or JPEG files are allowed'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size
    max_size = 10 * 1024 * 1024 if qualification_type == 'Semester' else 5 * 1024 * 1024
    if file.size > max_size:
        logger.warning(f"File size too large: {file.size} bytes")
        return Response({
            'status': 'error',
            'message': f'File size exceeds {max_size // 1024 // 1024}MB limit'
        }, status=status.HTTP_400_BAD_REQUEST)

    temp_file_path = None
    try:
        # Import local storage utility
        from .utils import create_user_folder_structure, upload_to_local_storage
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        logger.info(f"Temporary file saved: {temp_file_path}")

        # Get or create folder structure
        logger.info(f"Creating/getting folder for email: {email}")
        folder_paths = create_user_folder_structure(email)

        # Map qualification types to folders
        folder_mapping = {
            'S.S.L.C': 'SSLC',
            'HSC': 'HSC',
            'Semester': 'Semester',
            'UG Provisional': 'UG',
        }
        folder_name = folder_mapping.get(qualification_type, 'UG')
        folder_path = folder_paths[folder_name]
        logger.info(f"Uploading to folder: {folder_name} for qualification_type: {qualification_type}")

        # Upload to local storage
        file_name = f"{email.replace('@', '_at_').replace('.', '_')}_{qualification_type}_{file.name}"
        file_url = upload_to_local_storage(temp_file_path, file_name, folder_path)
        logger.info(f"File uploaded to local storage: {file_url}")

        # Update StudentDetails
        student_details, _ = StudentDetails.objects.get_or_create(
            user=user,
            defaults={'email': email, 'name_initial': ''}
        )
        url_field = {
            'S.S.L.C': 'sslc_marksheet_url',
            'HSC': 'hsc_marksheet_url',
            'Semester': 'semester_marksheet_url',
            'UG Provisional': 'ug_marksheet_url',
        }.get(qualification_type, 'ug_marksheet_url')
        setattr(student_details, url_field, file_url)
        student_details.save()
        logger.info(f"Updated StudentDetails with {url_field}: {file_url}")

        # Save to MarksheetUpload model
        MarksheetUpload.objects.create(
            student=student_details,
            email=email,
            qualification_type=qualification_type,
            file_url=file_url
        )
        logger.info(f"Created MarksheetUpload entry for {qualification_type}")

        return Response({
            'status': 'success',
            'message': 'File uploaded successfully',
            'file_url': file_url
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Error uploading file: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temporary file: {str(e)}")

import os
import tempfile
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import StudentDetails
import logging




from django.http import FileResponse, Http404
import requests
def serve_temp_image(request, file_id):
    try:
        image_url = f"https://drive.google.com/file_id={file_id}"
        response = requests.get(image_url, stream=True, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0'
            })
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'image/jpeg')
            return FileResponse(response.raw(), content_type=content_type)
        else:
            raise Http404(f"Image not found: Status {response.status_code}")
    except Exception as e:
        logger.error(f"Error serving temp image {file_id}: {str(e)}")
        raise Http404



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Student, Application, StudentDetails, MarksheetUpload
from .serializers import StudentSerializer, ApplicationSerializer, StudentDetailsSerializer, MarksheetUploadSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_application_preview(request):
    try:
        user = request.user
        data = {}

        # Fetch Student data
        try:
            student = Student.objects.using('online_edu').get(email=user.email)
            data['student'] = StudentSerializer(student).data
        except Student.DoesNotExist:
            data['student'] = None

        # Fetch Application data
        try:
            application = Application.objects.using('online_edu').get(email=user.email)
            data['application'] = ApplicationSerializer(application).data
        except Application.DoesNotExist:
            data['application'] = None

        # Fetch StudentDetails data
        try:
            student_details = StudentDetails.objects.get(user=user)
            data['student_details'] = StudentDetailsSerializer(student_details).data
        except StudentDetails.DoesNotExist:
            data['student_details'] = None

        # Fetch MarksheetUpload data
        marksheet_uploads = MarksheetUpload.objects.filter(student__user=user)
        data['marksheet_uploads'] = MarksheetUploadSerializer(marksheet_uploads, many=True).data

        return Response({
            'status': 'success',
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching preview data for user {user.email}: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.http import HttpResponse, FileResponse
import requests
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)

def proxy_google_drive_image(request, file_id):
    """
    Proxy an image file from Google Drive.
    Handles images (JPEG, PNG) for preview purposes.
    """
    try:
        # Construct the direct download URL for Google Drive
        image_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        logger.info(f"Proxying image: {image_url}")
        
        # Stream the file from Google Drive
        response = requests.get(image_url, stream=True, timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'image/jpeg')
            # Validate content type for images
            if not content_type.startswith('image/'):
                logger.warning(f"Unexpected content type for image: {content_type}")
                content_type = 'image/jpeg'  # Fallback to JPEG
            content_disposition = response.headers.get('content-disposition', '')
            
            # Create Django response
            django_response = HttpResponse(
                content=response.content,
                content_type=content_type,
            )
            
            if content_disposition:
                django_response['Content-Disposition'] = content_disposition
            else:
                django_response['Content-Disposition'] = 'inline; filename="image.jpg"'
                
            logger.info(f"Successfully proxied image: {file_id}")
            return django_response
        else:
            logger.error(f"Google Drive returned status {response.status_code} for file_id {file_id}")
            return HttpResponse(status=404, content=f"File not found: Status {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Error proxying image {file_id}: {str(e)}")
        return HttpResponse(status=500, content=f"Error fetching file: {str(e)}")

def proxy_google_drive_file(request, file_id):
    """
    Proxy a file (e.g., PDF) from Google Drive for download or preview.
    Ensures proper content type and disposition for PDFs.
    """
    try:
        # Construct the direct download URL for Google Drive
        file_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        logger.info(f"Proxying file: {file_url}")
        
        # Stream the file from Google Drive
        response = requests.get(file_url, stream=True, timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'application/pdf')
            # Force PDF content type if not correctly set
            if content_type == 'application/octet-stream' or not content_type.startswith('application/pdf'):
                logger.warning(f"Correcting content type from {content_type} to application/pdf")
                content_type = 'application/pdf'
            # Set filename for download
            filename = quote(f"document_{file_id}.pdf")
            content_disposition = response.headers.get('content-disposition', f'inline; filename="{filename}"')
            
            # Create Django response for streaming
            django_response = FileResponse(
                response.raw,
                content_type=content_type,
                as_attachment=False,  # Inline for preview
            )
            
            django_response['Content-Disposition'] = content_disposition
            django_response['Content-Length'] = response.headers.get('content-length', '')
            
            logger.info(f"Successfully proxied file: {file_id}")
            return django_response
        else:
            logger.error(f"Google Drive returned status {response.status_code} for file_id {file_id}")
            return HttpResponse(status=404, content=f"File not found: Status {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Error proxying file {file_id}: {str(e)}")
        return HttpResponse(status=500, content=f"Error fetching file: {str(e)}")






from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import razorpay
import hmac
import hashlib
import logging
import uuid
import requests
from django.conf import settings
from django.db import connection
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# Custom Razorpay client with timeout and retries
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import Student, Application, StudentDetails, MarksheetUpload
from .serializers import ApplicationSerializer, StudentSerializer, StudentDetailsSerializer, MarksheetUploadSerializer
from .utils import get_real_academic_year
import random
import time
import smtplib
import ssl
import logging
import json
import os
import tempfile
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from PIL import Image
from django.http import HttpResponse, FileResponse, Http404
import requests
from urllib.parse import quote
import razorpay
import hmac
import hashlib
import uuid
from django.db import connection
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime

logger = logging.getLogger(__name__)

# Existing imports and code up to get_student_details remain unchanged
# ... [All previous code from your views.py up to get_student_details]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_preview(request):
    """
    Updates the application status to 'In Progress' when the user confirms the preview.
    Expects application_id in the request data.
    """
    try:
        application_id = request.data.get('application_id')
        if not application_id:
            logger.warning(f"Missing application_id for user: {request.user.email}")
            return Response(
                {"status": "error", "message": "Application ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            application = Application.objects.get(
                user=request.user,
                id=application_id,
                status='Draft',
                is_active=True
            )
            application.status = 'In Progress'
            application.save()
            logger.info(f"Application {application_id} status updated to 'In Progress' for user: {request.user.email}")
            return Response(
                {
                    "status": "success",
                    "message": "Application status updated to In Progress",
                    "application_id": application_id
                },
                status=status.HTTP_200_OK
            )
        except Application.DoesNotExist:
            logger.warning(f"No active Draft application found with ID {application_id} for user: {request.user.email}")
            return Response(
                {"status": "error", "message": "No active Draft application found with the provided ID"},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        logger.error(f"Error in confirm_preview for user {request.user.email}: {str(e)}")
        return Response(
            {"status": "error", "message": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def get_razorpay_client():
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    client.session = session
    return client




@api_view(['POST'])
@permission_classes([IsAuthenticated])
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout)),
    before_sleep=lambda retry_state: logger.warning(f"Retrying create_order: attempt {retry_state.attempt_number}")
)
def create_order(request):
    try:
        amount = request.data.get('amount')  # In paise
        currency = request.data.get('currency', 'INR')
        if not amount or int(amount) <= 0:
            logger.warning(f"Invalid amount provided: {amount}")
            return Response(
                {"status": "error", "message": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_razorpay_client()
        order_data = {
            'amount': int(amount),
            'currency': currency,
            'payment_capture': 1
        }
        order = client.order.create(data=order_data, timeout=10)
        logger.info(f"Order created: {order['id']} for user: {request.user.email}")

        # Generate unique application ID
        application_id = f"PU/PA/{datetime.now().year}/{str(uuid.uuid4())[:6].upper()}"

        # Fetch student and application data
        student = Student.objects.filter(user=request.user).first()
        application = Application.objects.filter(user=request.user, status__in=['Draft', 'In Progress']).first()
        course = application.course if application else 'Unknown'
        user_name = student.name if student else request.user.username or 'Unknown'
        phone = student.phone if student else ''

        # Save payment entry
        try:
            payment = Payment.objects.create(
                user=request.user,
                application_id=application_id,
                user_name=user_name,
                email=request.user.email,
                phone=phone,
                transaction_id=order['id'],  # Store order_id initially
                amount=float(amount) / 100,  # Convert paise to rupees
                course=course,
                payment_status='created'
            )
            logger.info(f"Created payment entry with application_id: {application_id}, status: created, payment_id: {payment.id}")
        except Exception as db_error:
            logger.error(f"Database error creating payment entry: {str(db_error)}")
            return Response(
                {"status": "error", "message": f"Failed to save payment: {str(db_error)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "status": "success",
                "order_id": order['id'],
                "amount": order['amount'],
                "currency": order['currency'],
                "application_id": application_id
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error creating order for user {request.user.email}: {str(e)}")
        return Response(
            {"status": "error", "message": f"Failed to create order: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        application_id = request.data.get('application_id')
        payment_status = request.data.get('payment_status', 'unknown')

        if not all([razorpay_payment_id, razorpay_order_id, application_id]):
            logger.warning(f"Missing required fields: payment_id={razorpay_payment_id}, order_id={razorpay_order_id}, application_id={application_id}")
            return Response(
                {"status": "error", "message": "Missing payment details or application ID"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch student and application data
        token = request.headers.get('Authorization').split()[1]
        headers = {'Authorization': f'Token {token}'}
        student_response = requests.get('http://localhost:8000/api/student-details/', headers=headers, timeout=5)
        student_response.raise_for_status()
        student_data = student_response.json()
        if student_data.get('status') != 'success' or not student_data.get('data'):
            raise Exception("Failed to fetch student details")

        app_response = requests.get('http://localhost:8000/api/get-autofill-application/', headers=headers, timeout=5)
        app_response.raise_for_status()
        app_data = app_response.json()
        course = app_data.get('data', {}).get('course', 'Unknown') if app_data.get('status') == 'success' else 'Unknown'

        # Fetch payment entry
        try:
            payment = Payment.objects.get(application_id=application_id, user=request.user)
        except Payment.DoesNotExist:
            logger.warning(f"No payment found for application_id: {application_id}")
            return Response(
                {"status": "error", "message": "No payment found for the provided application ID"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check Razorpay payment status
        client = get_razorpay_client()
        try:
            razorpay_payment = client.payment.fetch(razorpay_payment_id)
            razorpay_status = razorpay_payment.get('status', 'unknown')
            logger.info(f"Razorpay payment status for {razorpay_payment_id}: {razorpay_status}")
        except Exception as e:
            logger.error(f"Failed to fetch Razorpay payment status for {razorpay_payment_id}: {str(e)}")
            razorpay_status = payment_status

        # Map Razorpay status to Payments table status
        status_mapping = {
            'captured': 'success',
            'failed': 'failed',
            'cancelled': 'cancelled',
            'created': 'created',
            'authorized': 'created',
            'unknown': payment_status
        }
        payment_status = status_mapping.get(razorpay_status, 'failed')

        # Verify signature for successful payments
        if razorpay_status == 'captured' and razorpay_signature:
            generated_signature = hmac.new(
                key=settings.RAZORPAY_KEY_SECRET.encode(),
                msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
                digestmod=hashlib.sha256
            ).hexdigest()
            if generated_signature != razorpay_signature:
                logger.warning(f"Invalid signature for payment {razorpay_payment_id}")
                payment_status = 'failed'

        # Update application status for successful payments
        if payment_status == 'success':
            try:
                application = Application.objects.get(
                    user=request.user,
                    id=app_data.get('data', {}).get('id'),
                    status__in=['Draft', 'In Progress'],
                    is_active=True
                )
                application.status = 'Completed'
                application.is_active = False
                application.save()
                logger.info(f"Application {application.id} status updated to 'Completed' for user: {request.user.email}")
            except Application.DoesNotExist:
                logger.warning(f"No active Draft or In Progress application found for user: {request.user.email}")
                return Response(
                    {"status": "error", "message": "No active application found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Update payment entry
        payment.transaction_id = razorpay_payment_id
        payment.payment_status = payment_status
        payment.user_name = student_data['data'].get('name', 'Unknown')
        payment.email = student_data['data'].get('email', request.user.email)
        payment.phone = student_data['data'].get('phone', '')
        payment.course = course
        payment.amount = float(razorpay_payment.get('amount', 23400)) / 100 if razorpay_status != 'unknown' else 234.00
        payment.save()
        logger.info(f"Updated payment {application_id} with status: {payment_status}")

        return Response(
            {
                "status": "success",
                "application_id": application_id,
                "transaction_id": razorpay_payment_id,
                "payment_status": payment_status,
                "message": f"Payment {payment_status} and saved"
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Payment verification error for user {request.user.email}: {str(e)}")
        try:
            payment = Payment.objects.get(application_id=application_id, user=request.user)
        except Payment.DoesNotExist:
            payment = Payment(
                user=request.user,
                application_id=application_id,
                user_name='Unknown',
                email=request.user.email,
                phone='',
                course='Unknown',
                amount=234.00,
                transaction_id=razorpay_payment_id or f"FAILED-{str(uuid.uuid4())[:6].upper()}",
                payment_status='failed'
            )
        payment.payment_status = 'failed'
        payment.save()
        logger.info(f"Saved failed payment for application_id: {application_id}")
        return Response(
            {"status": "error", "message": f"Payment verification failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



# api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Student
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_details(request):
    logger.info(f"Authenticated user: {request.user.email}, ID: {request.user.id}")
    try:
        # Try to get Student by user
        student = Student.objects.filter(user=request.user).first()
        if not student:
            # If no Student linked to user, try by email
            student = Student.objects.filter(email=request.user.email).first()
            if student:
                # Link existing Student to user
                student.user = request.user
                student.save()
            else:
                # Create new Student
                student = Student.objects.create(
                    user=request.user,
                    email=request.user.email,
                    name=request.user.username or 'User',
                    phone='',
                    is_verified=True,
                )
                logger.info(f"Created new Student profile for user: {request.user.email}")
        
        return Response(
            {
                "status": "success",
                "data": {
                    "email": student.email,
                    "name": student.name or 'User',
                    "phone": student.phone or ''
                }
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error fetching student details: {str(e)}")
        return Response(
            {"status": "error", "message": f"An error occurred while fetching student details: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ApplicationPayment, Application, Student, AllCourses, Courses
from .serializers import PaymentsSerializer
import logging
from datetime import datetime
import uuid
import hashlib
import base64
import requests
from django.conf import settings
from django.http import FileResponse
import pdfkit
import os
from django.template.loader import render_to_string
from django.utils import timezone
logger = logging.getLogger(__name__)

# Paytm Checksum Utility Functions
import hashlib
import base64
import hmac
import hmac

def generate_checksum(param_dict, merchant_key):
    """
    Generate Paytm form CHECKSUMHASH using the exact algorithm Paytm expects.
    Creates a pipe-separated string of sorted key=value pairs, then SHA256 hash.
    """
    params_string = ""
    for key in sorted(param_dict.keys()):
        if key == "CHECKSUMHASH":
            continue
        value = str(param_dict[key]) if param_dict[key] is not None else ""
        params_string += f"{key}={value}|"
    
    # Append merchant key at the end
    params_string += merchant_key
    
    # Log the string being hashed (first 100 chars for security)
    logger.debug(f"Checksum string (first 100 chars): {params_string[:100]}...")
    
    # Generate SHA256 hash
    checksum_hash = hashlib.sha256(params_string.encode('utf-8')).hexdigest()
    
    # Return as uppercase (Paytm expects uppercase hex)
    return checksum_hash.upper()

def verify_checksum(param_dict, merchant_key, checksumhash):
    """
    Verify Paytm form CHECKSUMHASH by regenerating it and comparing.
    """
    params_string = ""
    for key in sorted(param_dict.keys()):
        if key == "CHECKSUMHASH":
            continue
        value = str(param_dict[key]) if param_dict[key] is not None else ""
        params_string += f"{key}={value}|"
    
    # Append merchant key at the end
    params_string += merchant_key
    
    # Generate SHA256 hash
    generated_checksum = hashlib.sha256(params_string.encode('utf-8')).hexdigest().upper()
    
    return generated_checksum == checksumhash.upper()

def generate_v3_signature(body_str, merchant_key: str) -> str:
    """
    Generate Paytm v3 signature: base64(HMAC_SHA256(JSON.stringify(body), merchantKey))
    """
    digest = hmac.new(merchant_key.encode('utf-8'), body_str.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(digest).decode('utf-8')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_status(request):
    try:
        user = request.user
        
        # Try to get student from api.Student model
        student = Student.objects.filter(email=user.email).first()
        if not student:
            # Try to get from User model
            student_name = user.get_full_name() or user.username or user.email
            logger.info(f"No api.Student profile found for user: {user.email}, using User model")
        else:
            student_name = student.name

        application = Application.objects.filter(user=user).first()
        if not application:
            logger.warning(f"No application found for user: {user.email}")
            return Response(
                {"status": "error", "message": "No application found. Please fill out the application form first."},
                status=status.HTTP_404_NOT_FOUND
            )

        # If application is in Draft status or course not selected, return no payment pending
        if application.status == 'Draft' or not application.course:
            logger.info(f"Application in Draft status or no course selected for user: {user.email}")
            return Response(
                {"status": "success",
                 "data": {
                     "student_name": student_name,
                     "name_initial": application.name_initial or '',
                     "application_number": application.id,
                     "course": application.course or '',
                     "application_fee": 236.00,
                     "payment_status": 'Not Started',
                     "payments": [],
                     "message": "Please complete your application form before proceeding to payment."
                 }
                }, status=status.HTTP_200_OK)

        course = Courses.objects.filter(degree=application.course).first()
        if not course:
            logger.warning(f"Course {application.course} not found for user: {user.email}")
            # If course not found in Courses, try fallback with default fee
            return Response(
                {"status": "success",
                 "data": {
                     "student_name": student_name,
                     "name_initial": application.name_initial or '',
                     "application_number": application.id,
                     "course": application.course,
                     "application_fee": 236.00,  # Default fee
                     "payment_status": 'Completed' if application.payment_status == 'P' else 'Not Paid',
                     "payments": []
                 }
                }, status=status.HTTP_200_OK)

        payments = ApplicationPayment.objects.filter(user=user, course=application.course)
        payment_data = PaymentsSerializer(payments, many=True).data

        return Response({
            "status": "success",
            "data": {
                "student_name": student_name,
                "name_initial": application.name_initial or '',
                "application_number": application.id,
                "course": course.degree,
                "application_fee": float(course.application_fee),
                "payment_status": 'Completed' if application.payment_status == 'P' else 'Not Paid',
                "payments": payment_data
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching payment status for user {user.email}: {str(e)}")
        return Response(
            {"status": "error", "message": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    try:
        user = request.user
        
        # Check if test mode is requested
        test_mode = request.data.get('test_mode', False)
        
        if test_mode:
            # DUMMY TEST PAYMENT - Auto-success without Paytm
            application = Application.objects.filter(user=user, status__in=['Draft', 'In Progress']).first()
            if not application:
                return Response(
                    {"status": "error", "message": "No active application found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            course = Courses.objects.filter(degree=application.course).first()
            application_fee = course.application_fee if course else 236.00
            
            order_id = f"TEST{int(datetime.now().timestamp())}"
            application_id = f"PU/PA/{datetime.now().year}/{str(uuid.uuid4())[:6].upper()}"
            
            # Create payment record with success status
            payment = ApplicationPayment.objects.create(
                user=user,
                application_id=application_id,
                user_name=user.username,
                email=user.email,
                phone='',
                order_id=order_id,
                transaction_id=f"TEST_TXN_{order_id}",
                bank_transaction_id=f"TEST_BANK_{order_id}",
                amount=application_fee,
                course=application.course,
                payment_status='TXN_SUCCESS',
                payment_type='APPLICATION_FEE',
                transaction_date=timezone.now(),
                payment_mode='TEST',
                bank_name='TEST_BANK',
                response_code='01',
                response_message='Test payment - Auto approved',
                mid='TEST_MID'
            )
            
            # Mark application as completed
            application.payment_status = 'P'
            application.status = 'Completed'
            application.save()
            
            logger.info(f"TEST PAYMENT created for user {user.email}: {order_id}")
            
            return Response({
                "status": "success",
                "test_mode": True,
                "data": {
                    "application_id": application_id,
                    "order_id": order_id,
                    "transaction_id": payment.transaction_id,
                    "amount": float(application_fee),
                    "payment_status": "TXN_SUCCESS",
                    "message": "Test payment successful - Application completed!"
                }
            }, status=status.HTTP_200_OK)
        
        # Normal Paytm flow
        application = Application.objects.filter(user=user, status__in=['Draft', 'In Progress']).first()
        if not application:
            logger.warning(f"No active application found for user: {user.email}")
            return Response(
                {"status": "error", "message": "No active application found"},
                status=status.HTTP_404_NOT_FOUND
            )

        course = Courses.objects.filter(degree=application.course).first()
        if not course:
            logger.warning(f"Course {application.course} not found for user: {user.email}")
            # Use default fee if course not found
            application_fee = 236.00
        else:
            application_fee = course.application_fee

        student = Student.objects.filter(email=user.email).first()
        if not student:
            logger.warning(f"No student profile found for user: {user.email}")
            return Response(
                {"status": "error", "message": "Student profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        order_id = f"PUCDOE{int(datetime.now().timestamp())}"
        application_id = f"PU/PA/{datetime.now().year}/{str(uuid.uuid4())[:6].upper()}"

        # Build payment data matching the exact structure from working PHP code
        payment_data = {
            "MID": settings.PAYTM_MERCHANT_MID,
            "ORDER_ID": order_id,
            "CUST_ID": str(application.id),
            "INDUSTRY_TYPE_ID": "PrivateEducation",
            "CHANNEL_ID": "WEB",
            "TXN_AMOUNT": str(application_fee),
            "WEBSITE": settings.PAYTM_MERCHANT_WEBSITE,
            "CALLBACK_URL": settings.PAYTM_CALLBACK_URL,
            # Note: EMAIL and MSISDN are commented out in working PHP - Paytm doesn't require them
        }

        # Validate Paytm gateway URL to avoid mis-redirects
        paytm_url = settings.PAYTM_TXN_URL
        if not paytm_url or 'paytm.in' not in paytm_url:
            logger.error(f"Invalid PAYTM_TXN_URL configured: {paytm_url}")
            return Response({
                "status": "error",
                "message": "Payment gateway is not configured correctly. Please contact support.",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Generate checksum BEFORE adding it to payment_data
        checksum = generate_checksum(payment_data, settings.PAYTM_MERCHANT_KEY)
        logger.info(f"Generated CHECKSUMHASH for order {payment_data['ORDER_ID']}: {checksum[:20]}...")

        payment = ApplicationPayment.objects.create(
            user=user,
            application_id=application_id,
            user_name=student.name,
            email=student.email,
            phone=student.phone or '',
            order_id=order_id,
            amount=application_fee,
            course=application.course,
            payment_status='CREATED',
            payment_type='APPLICATION_FEE',
            transaction_date=timezone.now(),
            mid=getattr(settings, 'PAYTM_MERCHANT_MID', '') or ''
        )

        logger.info(f"Initiated payment for user {user.email}: order_id={order_id}, paytm_url={paytm_url}, website={settings.PAYTM_MERCHANT_WEBSITE}, env={settings.PAYTM_ENVIRONMENT}")
        return Response({
            "status": "success",
            "data": {
                "payment_url": paytm_url,
                "payment_data": {**payment_data, "CHECKSUMHASH": checksum},
                "application_id": application_id
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error initiating payment for user {user.email}: {str(e)}")
        return Response(
            {"status": "error", "message": f"Failed to initiate payment: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def payment_callback(request):
    """Paytm payment callback - receives POST data from Paytm"""
    try:
        param_list = request.POST.dict()
        checksum = param_list.get("CHECKSUMHASH", "")
        
        is_valid_checksum = verify_checksum(param_list, settings.PAYTM_MERCHANT_KEY, checksum)

        if not is_valid_checksum:
            logger.error("Checksum verification failed")
            return render(request, 'payment_response.html', {
                'status': 'error',
                'message': 'Checksum verification failed. Transaction is suspicious.'
            })

        order_id = param_list.get("ORDERID")
        payment = ApplicationPayment.objects.filter(order_id=order_id).first()
        
        if not payment:
            logger.warning(f"Payment record not found for order_id: {order_id}")
            # Create a new payment record if not exists
            payment = ApplicationPayment.objects.create(order_id=order_id)

        # Update payment record with Paytm response
        payment.transaction_id = param_list.get("TXNID", "")
        payment.bank_transaction_id = param_list.get("BANKTXNID", "")
        payment.amount = param_list.get("TXNAMOUNT", payment.amount)
        payment.payment_status = param_list.get("STATUS", "PENDING")
        payment.transaction_type = param_list.get("TXNTYPE", "")
        payment.gateway_name = param_list.get("GATEWAYNAME", "")
        payment.response_code = param_list.get("RESPCODE", "")
        payment.response_message = param_list.get("RESPMSG", "")
        payment.bank_name = param_list.get("BANKNAME", "UPI")
        payment.payment_mode = param_list.get("PAYMENTMODE", "")
        payment.refund_amount = param_list.get("REFUNDAMT", "0")
        payment.mid = param_list.get("MID", "")
        payment.transaction_date = param_list.get("TXNDATE", timezone.now())
        payment.save()

        # Update application status if payment successful
        if payment.payment_status == "TXN_SUCCESS":
            try:
                # Get application from user
                if payment.user:
                    application = Application.objects.filter(user=payment.user).first()
                    if application:
                        application.payment_status = 'P'
                        application.status = 'Completed'
                        application.save()
                        logger.info(f"Updated application status to Completed for user: {payment.user.email}")
            except Exception as app_error:
                logger.error(f"Error updating application status: {str(app_error)}")

        logger.info(f"Payment callback processed - order_id: {order_id}, status: {payment.payment_status}")
        
        # Return HTML response showing payment status
        context = {
            'status': 'success' if payment.payment_status == 'TXN_SUCCESS' else 'failure',
            'message': 'PAYMENT SUCCESSFUL' if payment.payment_status == 'TXN_SUCCESS' else 'PAYMENT FAILURE',
            'payment_status': payment.payment_status,
            'response_message': payment.response_message,
            'order_id': order_id,
            'transaction_id': payment.transaction_id,
            'amount': payment.amount,
        }
        return render(request, 'payment_response.html', context)

    except Exception as e:
        logger.error(f"Error processing payment callback: {str(e)}")
        return render(request, 'payment_response.html', {
            'status': 'error',
            'message': f'Failed to process payment: {str(e)}'
        })

from django.utils import timezone
import requests

from django.utils import timezone
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        user = request.user
        order_id = request.data.get('order_id')
        application_id = request.data.get('application_id')

        if not order_id or not application_id:
            logger.error(f"Missing order_id or application_id for user {user.email}")
            return Response(
                {"status": "error", "message": "Order ID and Application ID are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Verifying payment - order_id: {order_id}, application_id: {application_id}")

        payment = ApplicationPayment.objects.filter(
            user=user, order_id=order_id, application_id=application_id
        ).first()
        if not payment:
            logger.error(f"No payment found for order_id: {order_id}")
            return Response(
                {"status": "error", "message": "Payment record not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        logger.info(f"Payment verification requested for order_id: {order_id}, application_id: {application_id}")
        logger.info(f"Current payment status: {payment.payment_status}")

        # If already successful via callback, return immediately
        if payment.payment_status == 'TXN_SUCCESS':
            return Response({
                "status": "success",
                "data": {
                    "payment_status": "TXN_SUCCESS",
                    "transaction_id": payment.transaction_id,
                    "amount": payment.amount,
                    "payment_mode": payment.payment_mode or "N/A",
                    "message": "Payment already verified as successful"
                }
            }, status=status.HTTP_200_OK)

        # Attempt Paytm v3 order status query for non-success statuses
        try:
            mid_value = getattr(settings, 'PAYTM_MERCHANT_MID', None) or getattr(payment, 'mid', None)
            if not mid_value:
                logger.warning("PAYTM_MERCHANT_MID not configured - returning current payment status")
                # Return current status instead of error (for dummy/test payments)
                return Response({
                    "status": "success",
                    "message": "Payment verification not available (Paytm not configured). Use dummy payment instead.",
                    "data": {
                        "payment_status": payment.payment_status,
                        "order_id": order_id,
                        "application_id": application_id,
                        "amount": float(payment.amount) if payment.amount else 0,
                    }
                }, status=status.HTTP_200_OK)

            paytm_body = {"mid": mid_value, "orderId": order_id}
            body_str = json.dumps(paytm_body, separators=(',', ':'))
            signature = generate_v3_signature(body_str, settings.PAYTM_MERCHANT_KEY)
            payload = {"body": paytm_body, "head": {"signature": signature}}
            headers = {"Content-Type": "application/json"}

            # Prefer v3 order status endpoint even if legacy URL is configured
            status_url = settings.PAYTM_STATUS_QUERY_URL
            if 'merchant-status' in (status_url or '').lower():
                status_url = 'https://securegw.paytm.in/v3/order/status' if getattr(settings, 'PAYTM_ENVIRONMENT', 'PROD') == 'PROD' else 'https://securegw-stage.paytm.in/v3/order/status'

            logger.info(f"Querying Paytm status at {status_url} for order_id={order_id}")
            resp = requests.post(status_url, json=payload, headers=headers, timeout=12)
            logger.info(f"Paytm status HTTP {resp.status_code}: {resp.text[:500]}")

            resp_json = resp.json() if resp.content else {}
            body = resp_json.get('body', {})
            result_info = body.get('resultInfo', {})
            result_status = result_info.get('resultStatus')
            result_code = result_info.get('resultCode')
            result_msg = result_info.get('resultMsg')

            # Map response to our payment record
            if result_status == 'TXN_SUCCESS':
                payment.transaction_id = body.get('txnId') or payment.transaction_id
                payment.bank_transaction_id = body.get('bankTxnId') or payment.bank_transaction_id
                payment.amount = float(body.get('txnAmount') or payment.amount or 0)
                payment.payment_status = 'TXN_SUCCESS'
                payment.payment_mode = body.get('paymentMode') or payment.payment_mode
                payment.bank_name = body.get('bankName') or payment.bank_name or 'UPI'
                payment.response_code = result_code or payment.response_code
                payment.response_message = result_msg or payment.response_message
                payment.transaction_date = body.get('txnDate') or payment.transaction_date
                payment.save()

                # Optionally mark application completed
                try:
                    application = Application.objects.filter(user=user).first()
                    if application:
                        application.payment_status = 'P'
                        application.status = 'Completed'
                        application.save()
                except Exception as app_err:
                    logger.warning(f"Failed to update application state post success: {app_err}")

                return Response({
                    "status": "success",
                    "data": {
                        "payment_status": payment.payment_status,
                        "transaction_id": payment.transaction_id,
                        "amount": payment.amount,
                        "payment_mode": payment.payment_mode or "N/A",
                        "message": "Payment verified with Paytm"
                    }
                }, status=status.HTTP_200_OK)

            # Pending-like statuses
            if result_status in ['PENDING', 'PENDING_VERIFICATION']:
                payment.payment_status = result_status
                payment.response_code = result_code or payment.response_code
                payment.response_message = result_msg or payment.response_message
                payment.save()
                return Response({
                    "status": "info",
                    "message": result_msg or "Payment is pending. Please wait and try again.",
                    "data": {
                        "payment_status": payment.payment_status,
                        "order_id": order_id
                    }
                }, status=status.HTTP_200_OK)

            # Failures or unexpected responses - fallback to legacy merchant-status GET if 1007 or similar
            if result_code in ['1007', '1001', '400'] or (resp.status_code >= 400):
                try:
                    legacy_url = 'https://securegw.paytm.in/merchant-status/getTxnStatus' if getattr(settings, 'PAYTM_ENVIRONMENT', 'PROD') == 'PROD' else 'https://securegw-stage.paytm.in/merchant-status/getTxnStatus'
                    params = {'MID': mid_value, 'ORDERID': order_id}
                    # Some environments require checksum; include if available
                    try:
                        legacy_checksum = generate_checksum({'MID': mid_value, 'ORDERID': order_id}, settings.PAYTM_MERCHANT_KEY)
                        params['CHECKSUMHASH'] = legacy_checksum
                    except Exception as _:
                        pass
                    logger.info(f"Fallback querying legacy Paytm status at {legacy_url} with params {list(params.keys())}")
                    legacy_resp = requests.get(legacy_url, params=params, timeout=12)
                    logger.info(f"Legacy Paytm status HTTP {legacy_resp.status_code}: {legacy_resp.text[:500]}")
                    legacy_json = legacy_resp.json() if legacy_resp.content else {}
                    legacy_status = legacy_json.get('STATUS')
                    if legacy_status == 'TXN_SUCCESS':
                        payment.transaction_id = legacy_json.get('TXNID') or payment.transaction_id
                        payment.bank_transaction_id = legacy_json.get('BANKTXNID') or payment.bank_transaction_id
                        payment.amount = float(legacy_json.get('TXNAMOUNT') or payment.amount or 0)
                        payment.payment_status = 'TXN_SUCCESS'
                        payment.payment_mode = legacy_json.get('PAYMENTMODE') or payment.payment_mode
                        payment.bank_name = legacy_json.get('BANKNAME') or payment.bank_name or 'UPI'
                        payment.response_code = legacy_json.get('RESPCODE') or payment.response_code
                        payment.response_message = legacy_json.get('RESPMSG') or payment.response_message
                        payment.transaction_date = legacy_json.get('TXNDATE') or payment.transaction_date
                        payment.save()
                        try:
                            application = Application.objects.filter(user=user).first()
                            if application:
                                application.payment_status = 'P'
                                application.status = 'Completed'
                                application.save()
                        except Exception as app_err:
                            logger.warning(f"Failed to update application state post success (legacy): {app_err}")
                        return Response({
                            "status": "success",
                            "data": {
                                "payment_status": payment.payment_status,
                                "transaction_id": payment.transaction_id,
                                "amount": payment.amount,
                                "payment_mode": payment.payment_mode or "N/A",
                                "message": "Payment verified with Paytm (legacy)"
                            }
                        }, status=status.HTTP_200_OK)

                    if legacy_status in ['PENDING', 'PENDING_VERIFICATION']:
                        payment.payment_status = legacy_status
                        payment.response_code = legacy_json.get('RESPCODE') or payment.response_code
                        payment.response_message = legacy_json.get('RESPMSG') or payment.response_message
                        payment.save()
                        return Response({
                            "status": "info",
                            "message": legacy_json.get('RESPMSG') or "Payment is pending. Please wait and try again.",
                            "data": {"payment_status": payment.payment_status, "order_id": order_id}
                        }, status=status.HTTP_200_OK)
                except Exception as legacy_err:
                    logger.error(f"Legacy Paytm status fallback failed: {legacy_err}")

            # Failures or unexpected responses (final)
            payment.payment_status = 'TXN_FAILURE' if result_status else payment.payment_status
            payment.response_code = result_code or payment.response_code
            payment.response_message = result_msg or payment.response_message
            payment.save()
            return Response({
                "status": "error",
                "message": result_msg or f"Payment status: {payment.payment_status}. Please try again.",
                "data": {
                    "payment_status": payment.payment_status,
                    "order_id": order_id
                }
            }, status=status.HTTP_200_OK)

        except Exception as paytm_err:
            logger.error(f"Error querying Paytm status for order {order_id}: {paytm_err}")
            # Fall back to local status without changing it
            if payment.payment_status in ['CREATED', 'PENDING', 'PENDING_VERIFICATION']:
                return Response({
                    "status": "info",
                    "message": "Unable to reach Paytm for status. Please retry after a minute.",
                    "data": {
                        "payment_status": payment.payment_status,
                        "order_id": order_id
                    }
                }, status=status.HTTP_200_OK)

            return Response({
                "status": "error",
                "message": f"Payment status: {payment.payment_status}. {payment.response_message or 'Please try a new payment.'}",
                "data": {
                    "payment_status": payment.payment_status,
                    "order_id": order_id
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Unexpected error in verify_payment: {str(e)}", exc_info=True)
        return Response(
            {"status": "error", "message": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_application(request):
    """
    Returns complete application data as JSON for client-side PDF generation.
    Includes all details from Page 1, Page 2, Page 3, and Payment information.
    """
    try:
        user = request.user
        application = Application.objects.filter(user=user, status__in=['In Progress', 'Completed']).first()
        if not application:
            logger.warning(f"No application found for user: {user.email}")
            return Response(
                {"status": "error", "message": "No application found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get student details
        student = Student.objects.filter(email=user.email).first()
        
        # Get student details (Page 3 data)
        student_details = StudentDetails.objects.filter(user=user).first()
        
        # Get payment details
        payment = Payment.objects.filter(user=user, application_id=application.application_id).first()
        fee_payment = ApplicationPayment.objects.filter(user=user, application_id=application.application_id).first()
        
        # Extract LSC code from application_id if student doesn't have it
        lsc_code = student.lsc_code if student and student.lsc_code else ''
        lsc_name = student.lsc_name if student and student.lsc_name else ''
        
        # Try to extract LSC code from application_id as fallback (format: PU/MODE/LSC_CODE/YEAR/NUMBER)
        if not lsc_code and application.application_id:
            try:
                parts = application.application_id.split('/')
                if len(parts) >= 3:
                    lsc_code = parts[2]  # LSC code is the 3rd part
            except Exception as e:
                logger.warning(f"Could not extract LSC code from application_id: {e}")
        
        # Prepare complete application data
        # Resolve photo_url: prefer StudentDetails.photo_url, fall back to Application.photo_url if present
        resolved_photo_url = ''
        resolved_signature_url = ''
        try:
            if student_details and getattr(student_details, 'photo_url', None):
                resolved_photo_url = student_details.photo_url or ''
            elif hasattr(application, 'photo_url') and getattr(application, 'photo_url', None):
                resolved_photo_url = application.photo_url or ''
            
            if student_details and getattr(student_details, 'signature_url', None):
                resolved_signature_url = student_details.signature_url or ''
        except Exception:
            # Be defensive: don't let photo/signature resolution break the endpoint
            resolved_photo_url = ''
            resolved_signature_url = ''

        application_data = {
            # Basic Info
            'application_id': application.application_id or '',
            'enrollment_no': application.enrollment_no if hasattr(application, 'enrollment_no') else '',
            'applied_date': application.created_at.strftime('%d-%m-%Y') if hasattr(application, 'created_at') else '',
            'photo_url': resolved_photo_url,
            'signature_url': resolved_signature_url,
            
            # Page 1 - Programme Details
            'programme_applied': application.programme_applied or '',
            'programme': application.programme_applied or 'DIPLOMA',
            'course': application.course or '',
            'medium': application.medium or '',
            'mode_of_study': application.mode_of_study or '',
            'academic_year': application.academic_year or '',
            
            # LSC Details
            'lsc_code': lsc_code,
            'lsc_name': lsc_name,
            
            # Page 2 - Personal Details
            'name_initial': application.name_initial or '',
            'student_name': student.name if student else '',
            'name': student.name if student else '',
            'dob': application.dob.strftime('%d-%m-%Y') if application.dob else '',
            'gender': application.gender or '',
            'father_name': application.father_name or '',
            'mother_name': application.mother_name or '',
            'guardian_name': application.guardian_name or '',
            'father_occupation': application.father_occupation or '',
            'mother_occupation': application.mother_occupation or '',
            'parent_occupation': f"{application.father_occupation or 'N/A'} - {application.mother_occupation or 'N/A'}",
            'guardian_occupation': application.guardian_occupation or '',
            'mother_tongue': application.mother_tongue or '',
            'nationality': application.nationality or 'Indian',
            'religion': application.religion or '',
            'community': application.community or '',
            'community_certificate': bool(application.community_certificate) if hasattr(application, 'community_certificate') else False,
            
            # Contact Details
            'email': user.email,
            'phone': student.phone if student else '',
            'mobile': student.phone if student else '',
            
            # Address - Communication (formatted)
            'comm_pincode': application.comm_pincode or '',
            'comm_district': application.comm_district or '',
            'comm_state': application.comm_state or '',
            'comm_country': application.comm_country or '',
            'comm_town': application.comm_town or '',
            'comm_area': application.comm_area or '',
            'communication_address': f"{application.comm_area or ''}, {application.comm_town or ''}, {application.comm_district or ''}, {application.comm_state or ''} - {application.comm_pincode or ''}, {application.comm_country or ''}".strip(', '),
            'communication_city': application.comm_district or '',
            'communication_state': application.comm_state or '',
            'communication_pincode': application.comm_pincode or '',
            'communication_country': application.comm_country or '',
            
            # Address - Permanent (formatted)
            'perm_pincode': application.perm_pincode or '',
            'perm_district': application.perm_district or '',
            'perm_state': application.perm_state or '',
            'perm_country': application.perm_country or '',
            'perm_town': application.perm_town or '',
            'perm_area': application.perm_area or '',
            'permanent_address': f"{application.perm_area or ''}, {application.perm_town or ''}, {application.perm_district or ''}, {application.perm_state or ''} - {application.perm_pincode or ''}, {application.perm_country or ''}".strip(', '),
            'permanent_city': application.perm_district or '',
            'permanent_state': application.perm_state or '',
            'permanent_pincode': application.perm_pincode or '',
            'permanent_country': application.perm_country or '',
            
            # Other Details
            'aadhaar_no': application.aadhaar_no or '',
            'aadhaar_number': application.aadhaar_no or '',
            'name_as_aadhaar': application.name_as_aadhaar or '',
            'aadhaar_name': application.name_as_aadhaar or '',
            'aadhaar_document': bool(hasattr(application, 'aadhaar_document') and application.aadhaar_document),
            'abc_id': application.abc_id or '',
            'deb_id': application.deb_id or '',
            'differently_abled': application.differently_abled or 'No',
            'disability_type': application.disability_type or '',
            'blood_group': application.blood_group or '',
            'access_internet': application.access_internet or 'Yes',
            'internet_access': application.access_internet or 'Yes',
            
            # Page 3 - Education & Experience
            'qualifications': student_details.qualifications if student_details else [],
            'current_designation': student_details.current_designation if student_details else '',
            'current_institute': student_details.current_institute if student_details else '',
            'current_institution': student_details.current_institute if student_details else '',
            'years_experience': student_details.years_experience if student_details else '',
            'work_experience_years': student_details.years_experience if student_details else '',
            'annual_income': student_details.annual_income if student_details else '',
            
            # Payment Details
            'payment_status': 'Paid' if application.payment_status == 'P' else 'Not Paid',
            'payment_status_display': 'TXN_SUCCESS' if application.payment_status == 'P' else 'PENDING',
            'transaction_id': fee_payment.transaction_id if fee_payment else (payment.transaction_id if payment else ''),
            'bank_transaction_id': fee_payment.bank_transaction_id if fee_payment else '',
            'order_id': fee_payment.order_id if fee_payment else '',
            'amount': str(fee_payment.amount) if fee_payment else (str(payment.amount) if payment else '236.00'),
            'payment_mode': fee_payment.payment_mode if fee_payment else 'UPI',
            'bank_name': fee_payment.bank_name if fee_payment else '',
            'gateway_name': fee_payment.gateway_name if fee_payment else '',
            'response_code': fee_payment.response_code if fee_payment else '',
            'response_message': fee_payment.response_message if fee_payment else '',
            'mid': fee_payment.mid if fee_payment else '',
            'transaction_date': fee_payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if fee_payment and fee_payment.transaction_date else '',
            'payment_response': fee_payment.payment_status if fee_payment else (payment.payment_status if payment else ''),
            
            # Additional payment fields for course fee (if any)
            'course_fee_order_id': '',
            'course_fee_amount': '',
            'course_fee_status': '',
            'course_fee_bank': '',
            'course_fee_mode': '',
            'course_fee_date': '',
            
            # Application Status
            'status': application.status,
            
            # University Details
            'university': 'Periyar University',
            'university_address': 'Salem, Tamil Nadu, India',
        }

        logger.info(f"Returning complete application data for user {user.email}")
        return Response({
            "status": "success",
            "data": application_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching application data for user {user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {"status": "error", "message": f"Failed to fetch application data: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_receipt(request):
    """
    Returns payment receipt data as JSON for client-side PDF generation.
    Includes all transaction details from payments and feepayment tables.
    """
    try:
        user = request.user
        application = Application.objects.filter(user=user, payment_status='P').first()
        
        if not application:
            logger.warning(f"No paid application found for user: {user.email}")
            return Response(
                {"status": "error", "message": "No payment receipt found. Please complete payment first."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get student details
        student = Student.objects.filter(email=user.email).first()
        
        # Get payment details from Payment table (online_edu.payments)
        payment = Payment.objects.filter(user=user, application_id=application.application_id).first()
        
        # Get fee payment details from ApplicationPayment table (feepayment)
        # Try multiple query methods to find the payment record
        fee_payment = ApplicationPayment.objects.filter(application_id=application.application_id).first()
        
        if not fee_payment:
            # Try by user if not found by application_id
            fee_payment = ApplicationPayment.objects.filter(user=user).first()
        
        if not fee_payment:
            # Try by email
            fee_payment = ApplicationPayment.objects.filter(email=user.email).first()
        
        # Log the fee payment details for debugging
        if fee_payment:
            logger.info(f"Found fee_payment for {user.email}: TXN={fee_payment.transaction_id}, Bank TXN={fee_payment.bank_transaction_id}, Order={fee_payment.order_id}")
        else:
            logger.warning(f"No fee_payment record found for {user.email} with application_id={application.application_id}")
        
        # Extract LSC code from application_id if student doesn't have it
        lsc_code = student.lsc_code if student and student.lsc_code else ''
        lsc_name = student.lsc_name if student and student.lsc_name else ''
        
        # Try to extract LSC code from application_id as fallback (format: PU/MODE/LSC_CODE/YEAR/NUMBER)
        if not lsc_code and application.application_id:
            try:
                parts = application.application_id.split('/')
                if len(parts) >= 3:
                    lsc_code = parts[2]  # LSC code is the 3rd part
            except Exception as e:
                logger.warning(f"Could not extract LSC code from application_id: {e}")
        
        # Prepare receipt data
        receipt_data = {
            'application_id': application.application_id,
            'student_name': student.name if student else user.get_full_name(),
            'email': user.email,
            'phone': student.phone if student else '',
            'course': application.course or '',
            'mode_of_study': application.mode_of_study or '',
            'academic_year': application.academic_year or '',
            'lsc_code': lsc_code,
            'lsc_name': lsc_name,
            
            # Transaction details from feepayment table
            'transaction_id': fee_payment.transaction_id if fee_payment else (payment.transaction_id if payment else ''),
            'bank_transaction_id': fee_payment.bank_transaction_id if fee_payment else '',
            'order_id': fee_payment.order_id if fee_payment else '',
            'amount': str(fee_payment.amount) if fee_payment else (str(payment.amount) if payment else '236.00'),
            'payment_status': fee_payment.payment_status if fee_payment else (payment.payment_status if payment else 'success'),
            'transaction_type': fee_payment.transaction_type if fee_payment else '',
            'gateway_name': fee_payment.gateway_name if fee_payment else '',
            'response_code': fee_payment.response_code if fee_payment else '',
            'response_message': fee_payment.response_message if fee_payment else '',
            'bank_name': fee_payment.bank_name if fee_payment else '',
            'payment_mode': fee_payment.payment_mode if fee_payment else '',
            'mid': fee_payment.mid if fee_payment else '',
            'transaction_date': fee_payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if fee_payment and fee_payment.transaction_date else '',
            'payment_type': fee_payment.payment_type if fee_payment else 'APPLICATION_FEE',
            
            # Additional info
            'receipt_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'university': 'Periyar University',
            'university_address': 'Salem, Tamil Nadu, India'
        }

        # Log the complete receipt data being returned
        logger.info(f"Returning receipt data for user {user.email}, Application ID: {application.application_id}")
        logger.info(f"Receipt data transaction_id: {receipt_data.get('transaction_id')}")
        logger.info(f"Receipt data bank_transaction_id: {receipt_data.get('bank_transaction_id')}")
        logger.info(f"Receipt data order_id: {receipt_data.get('order_id')}")
        
        return Response({
            "status": "success",
            "data": receipt_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching receipt data for user {user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {"status": "error", "message": f"Failed to fetch receipt data: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )