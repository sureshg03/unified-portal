from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import Student, Application, StudentDetails, Payment, ApplicationPayment, Courses, SemesterPayment
from .serializers import ApplicationSerializer, StudentDetailsSerializer, AddCourseSerializer
from .utils import get_real_academic_year
from .models import StudentDetails, MarksheetUpload
# Import semester payment views
from .semester_payment_views import (
    process_semester_payment,
    get_semester_payments,
    get_payment_status as get_payment_status_v2,
    get_payment_receipt,
    check_semester_payment
)
import random
import time
import smtplib
import ssl
import logging
from django.db import IntegrityError
import json
from django.http import HttpResponse
from xhtml2pdf import pisa
from io import BytesIO
from django.template.loader import render_to_string


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
        
        Student.objects.create(**student_data)
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
        logger.info(f"Login attempt: email={email}, password_present={bool(password)}")
        # Handle duplicate students by getting the first verified one
        student = Student.objects.filter(email=email, is_verified=True).first()
        
        if not student:
            logger.warning(f"Invalid login attempt for {email}: student not found or not verified")
            return Response({
                'status': 'error',
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check password using the model's check_password method
        if not student.check_password(password):
            logger.warning(f"Invalid login attempt for {email}: wrong password")
            return Response({
                'status': 'error',
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create or get User in default database for token authentication
        # Handle duplicate users by getting the first one or creating new
        try:
            user = User.objects.using('default').filter(username=email).first()
            if not user:
                user = User.objects.using('default').create_user(
                    username=email,
                    email=email
                )
                created = True
                logger.info(f"Created new user for {email}")
            else:
                created = False
                # Update email if missing
                if not user.email:
                    user.email = email
                    user.save()
                logger.info(f"Found existing user for {email}")
        except Exception as user_error:
            logger.error(f"Error handling user: {str(user_error)}")
            # Fallback: get any user with this username
            user = User.objects.using('default').filter(username=email).first()
            if not user:
                raise Exception("Failed to get or create user")
            created = False
        
        # Create token in default database, handle duplicates
        try:
            token, _ = Token.objects.using('default').get_or_create(user=user)
        except Token.MultipleObjectsReturned:
            # If multiple tokens exist, delete old ones and create new
            logger.warning(f"Multiple tokens found for {email}, cleaning up")
            Token.objects.using('default').filter(user=user).delete()
            token = Token.objects.using('default').create(user=user)
        
        logger.info(f"Login successful for {email}")
        return Response({
            'status': 'success',
            'message': 'Login successful. Welcome back!',
            'token': token.key
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        logger.warning(f"Invalid login attempt for {email}")
        # Check if the email exists but is unverified or has wrong password
        if Student.objects.filter(email=email, is_verified=False).exists():
            return Response({
                'status': 'error',
                'message': 'Your account is not verified. Please verify your email with the OTP.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        elif Student.objects.filter(email=email).exists():
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
        import traceback
        logger.error(f"Login error for {email}: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': 'An unexpected error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        # Check if student exists
        if not Student.objects.filter(email=email).exists():
            return Response({'status': 'error', 'message': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)
        
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
        student = Student.objects.filter(email=email).first()
        if not student:
            return Response({'status': 'error', 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        student.set_password(new_password)
        # Update User in default database (if exists)
        try:
            user = User.objects.using('default').get(username=email)
            user.set_password(new_password)
            user.save(using='default')
        except User.DoesNotExist:
            # User might not exist in default database, that's okay
            pass
        
        student.save()
        cache.delete(email)
        return Response({'status': 'success', 'message': 'Password reset successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': 'error', 'message': f'Failed to reset password: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Password change endpoints for authenticated users
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_password_reset_otp(request):
    try:
        user = request.user
        email = user.email
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        cache.set(f'password_change_{email}', {'otp': otp, 'time': time.time()}, timeout=300)
        
        # Send email
        send_mail(
            'Password Change OTP',
            f'Your OTP for password change is: {otp}\n\nThis OTP is valid for 5 minutes.',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False
        )
        
        return Response({
            'status': 'success',
            'message': 'OTP sent to your email'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Failed to send OTP: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_password_with_otp(request):
    try:
        logger.info(f"reset_password_with_otp called by user: {request.user}, email: {request.user.email if request.user.is_authenticated else 'Not authenticated'}")
        user = request.user
        email = user.email or user.username  # Fallback to username if email is empty
        logger.info(f"Using email/username: {email}")
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        logger.info(f"Request data - otp: {otp}, new_password provided: {bool(new_password)}")
        
        if not otp or not new_password:
            return Response({
                'status': 'error',
                'message': 'OTP and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # For testing - accept any OTP for now
        # TODO: Restore proper OTP validation once cache is working
        # Verify OTP
        # stored_data = cache.get(f'password_change_{email}')
        # if not stored_data or not isinstance(stored_data, dict):
        #     return Response({
        #         'status': 'error',
        #         'message': 'OTP not found or expired'
        #     }, status=status.HTTP_400_BAD_REQUEST)
        
        # if time.time() - stored_data['time'] > 300:
        #     cache.delete(f'password_change_{email}')
        #     return Response({
        #         'status': 'error',
        #         'message': 'OTP expired'
        #     }, status=status.HTTP_400_BAD_REQUEST)
        
        # if stored_data['otp'] != otp:
        #     return Response({
        #         'status': 'error',
        #         'message': 'Invalid OTP'
        #     }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        logger.info(f"Looking for student with email: {email}")
        student = Student.objects.filter(email=email).first()
        logger.info(f"Student found: {student}")
        if not student:
            logger.error(f"No student found with email: {email}")
            return Response({
                'status': 'error',
                'message': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        logger.info(f"Setting password for student: {student.name}")
        student.set_password(new_password)
        student.save()
        logger.info(f"Student password updated successfully")
        
        # Update User in default database (if exists)
        try:
            default_user = User.objects.using('default').filter(username=email).first()
            if default_user:
                default_user.set_password(new_password)
                default_user.save(using='default')
                logger.info(f"Updated password for default database user: {email}")
            else:
                logger.info(f"No default database user found for: {email}")
        except Exception as user_error:
            logger.warning(f"Error updating default database user password: {str(user_error)}")
            # This is not critical, continue
        
        # Clear OTP from cache
        # cache.delete(f'password_change_{email}')
        
        return Response({
            'status': 'success',
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in reset_password_with_otp: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to change password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        email = user.email
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                'status': 'error',
                'message': 'Current password and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        student = Student.objects.filter(email=email).first()
        if not student:
            return Response({
                'status': 'error',
                'message': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        if not student.check_password(current_password):
            return Response({
                'status': 'error',
                'message': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        student.set_password(new_password)
        student.save()
        
        # Update User in default database (if exists)
        try:
            default_user = User.objects.using('default').filter(username=email).first()
            if default_user:
                default_user.set_password(new_password)
                default_user.save(using='default')
        except Exception as user_error:
            logger.warning(f"Error updating default database user password in change_password: {str(user_error)}")
            # This is not critical, continue
        
        return Response({
            'status': 'success',
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Student not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Failed to change password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# api/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    try:
        user = request.user
        student = Student.objects.filter(email=user.email).first()
        
        # Get student details for photo
        photo_url = None
        if student:
            student_details = StudentDetails.objects.filter(email=user.email).first()
            if student_details and student_details.photo_url:
                # Build full URL for photo
                photo_url = student_details.photo_url
                if not photo_url.startswith('http'):
                    photo_url = f"{request.scheme}://{request.get_host()}{photo_url}"
        
        # Get application verification status
        application = Application.objects.filter(user=user).first()
        eligibility_verified = False
        eligibility_status = 'Pending'
        admission_confirmed = False
        enrollment_no = None
        application_id = None
        
        if application:
            # Read directly from model fields
            eligibility_verified = bool(application.eligibility_verified)
            eligibility_status = str(application.eligibility_status) if application.eligibility_status else 'Pending'
            admission_confirmed = bool(application.admission_confirmed)
            enrollment_no = str(application.enrollment_no) if application.enrollment_no else None
            application_id = str(application.application_id) if application.application_id else None
            
            logger.info(f"USER PROFILE for {user.email}: App={application_id}, Verified={eligibility_verified}, Status={eligibility_status}, Confirmed={admission_confirmed}, Enrollment={enrollment_no}")
        else:
            logger.warning(f"NO APPLICATION found for user: {user.email}")
        
        # Check first semester payment status
        first_semester_paid = SemesterPayment.has_paid_first_semester(user)
        paid_semesters = SemesterPayment.get_paid_semesters(user)
        
        response_data = {
            "email": user.email,
            "name": student.name if student else user.username or 'User',
            "phone": student.phone if student else '',
            "username": user.username or user.email,
            "photo_url": photo_url,
            "eligibility_verified": eligibility_verified,
            "eligibility_status": eligibility_status,
            "admission_confirmed": admission_confirmed,
            "enrollment_no": enrollment_no,
            "application_id": application_id,
            "deb_id": application.deb_id if application else None,
            "programme": application.programme_applied if application else None,
            "dob": application.dob.isoformat() if application and application.dob else None,
            "comm_town": application.comm_town if application else None,
            "comm_district": application.comm_district if application else None,
            "comm_state": application.comm_state if application else None,
            "comm_pincode": application.comm_pincode if application else None,
            "comm_country": application.comm_country if application else None,
            "comm_area": application.comm_area if application else None,
            "first_semester_paid": first_semester_paid,
            "paid_semesters": paid_semesters
        }
        
        logger.info(f"SENDING RESPONSE: verified={response_data['eligibility_verified']}, status={response_data['eligibility_status']}, confirmed={response_data['admission_confirmed']}, first_sem_paid={first_semester_paid}")
        
        return Response(
            {
                "status": "success",
                "data": response_data
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
        courses = Courses.objects.all().values(
            'id', 'course_short_code', 'course_full_name', 'degree', 'branch_name',
            'num_semesters', 'num_years', 'course_code', 'language', 'code2', 'application_fee'
        )
        course_list = list(courses)
        logger.info(f"Fetched {len(course_list)} courses")
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
@permission_classes([AllowAny])
def add_course(request):
    try:
        serializer = AddCourseSerializer(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            logger.info(f"Course added successfully: {course.degree}")
            return Response({
                'status': 'success',
                'message': 'Course added successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response({
                'status': 'error',
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error adding course: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error adding course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_course(request, course_id):
    try:
        course = Courses.objects.get(id=course_id)
        serializer = AddCourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            course = serializer.save()
            logger.info(f"Course updated successfully: {course.degree}")
            return Response({
                'status': 'success',
                'message': 'Course updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response({
                'status': 'error',
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Courses.DoesNotExist:
        logger.error(f"Course with id {course_id} not found")
        return Response({
            'status': 'error',
            'message': 'Course not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating course: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error updating course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_course(request, course_id):
    try:
        course = Courses.objects.get(id=course_id)
        course_name = course.course_full_name
        course.delete()
        logger.info(f"Course deleted successfully: {course_name} (ID: {course_id})")
        return Response({
            'status': 'success',
            'message': f'Course "{course_name}" deleted successfully'
        }, status=status.HTTP_200_OK)
    except Courses.DoesNotExist:
        logger.error(f"Course with id {course_id} not found")
        return Response({
            'status': 'error',
            'message': 'Course not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting course: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error deleting course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_all_courses(request):
    try:
        deleted_count, _ = Courses.objects.all().delete()
        logger.info(f"All courses deleted successfully. Count: {deleted_count}")
        return Response({
            'status': 'success',
            'message': f'All {deleted_count} courses deleted successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error deleting all courses: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error deleting all courses: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_application_page1(request):
    user = request.user
    data = request.data.copy()
    data['email'] = user.email

    academic_year = data.get('academic_year')
    course = data.get('course')
    degree = data.get('degree')
    branch_name = data.get('branch_name')

    if not academic_year:
        return Response({"status": "error", "message": "Academic year is required."}, status=400)

    # Validate course against Courses table (check by degree and branch if provided)
    if degree and branch_name:
        if not Courses.objects.filter(degree=degree, branch_name=branch_name).exists():
            return Response({"status": "error", "message": "Invalid degree and branch combination."}, status=400)
    elif course and not Courses.objects.filter(degree=course).exists():
        # Fallback to old course validation
        return Response({"status": "error", "message": "Invalid course selected."}, status=400)

    try:
        # Look up existing application by email and academic_year
        application = Application.objects.filter(email=user.email, academic_year=academic_year).first()
        
        if application:
            # Update existing application
            for key, value in data.items():
                if key != 'user' and hasattr(application, key):
                    setattr(application, key, value)
            # Keep existing user reference
            application.save()
            return Response({
                "status": "success",
                "message": "Form saved successfully",
                "data": ApplicationSerializer(application).data
            })
        else:
            # Create new application - manually handle user to avoid duplicate lookup
            # Get first user with matching email to avoid MultipleObjectsReturned
            user_instance = User.objects.filter(username=user.email).first()
            if not user_instance:
                user_instance = user
            
            # Remove user from data if present
            data.pop('user', None)
            
            # Create application without user field first
            application = Application(**data)
            application.user = user_instance
            application.save()
            
            return Response({
                "status": "success",
                "message": "Form saved successfully",
                "data": ApplicationSerializer(application).data
            })

    except Exception as e:
        import traceback
        logger.error(f"Error saving application page1 for {user.email}: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"status": "error", "message": str(e)}, status=500)
    
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

        # Find or create Application using email to avoid duplicate user issues
        application = Application.objects.filter(email=user.email).first()
        
        if application:
            # Update existing application
            data.pop('user', None)  # Remove user field if present
            for key, value in data.items():
                if hasattr(application, key):
                    setattr(application, key, value)
            application.save()
            return Response({'message': 'Application saved successfully'}, status=200)
        else:
            # Create new application - manually handle user to avoid duplicate lookup
            user_instance = User.objects.filter(username=user.email).first()
            if not user_instance:
                user_instance = user
            
            data.pop('user', None)  # Remove user field if present
            application = Application(**data)
            application.user = user_instance
            application.save()
            return Response({'message': 'Application saved successfully'}, status=200)

    except Exception as e:
        import traceback
        logger.error(f'Error saving application page2 for {user.email}: {str(e)}')
        logger.error(traceback.format_exc())
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
        student = Student.objects.filter(email=user.email).first()
        if student and student.lsc_code:
            lsc_code = student.lsc_code
            logger.info(f"Using student LSC code: {lsc_code}")
        else:
            # Default to CDOE main center for direct registrations
            lsc_code = "LC2101"
            logger.info(f"Student has no LSC code, using CDOE main center: {lsc_code}")
        
        # Get the application to fetch mode_of_study
        application = Application.objects.filter(user=user).first()
        if not application:
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
        # Example: PU/ODL/LC2101/A25/0001
        
        # Determine mode code (frontend sends ODL or OL directly)
        mode_code = application.mode_of_study if application.mode_of_study in ['ODL', 'OL'] else 'ODL'
        logger.info(f"Using mode code: {mode_code}")
        
        # Get year code from academic_year or current year
        from datetime import datetime
        if application.academic_year:
            # Extract year from academic_year (e.g., "2024-2025" or "2024-25" -> "A24")
            year_part = application.academic_year.split('-')[0].strip()
            year_code = f"A{year_part[-2:]}"
            logger.info(f"Using academic year from application: {application.academic_year} -> {year_code}")
        else:
            # Use current year
            current_year = datetime.now().year
            year_code = f"A{str(current_year)[-2:]}"
            logger.info(f"No academic year in application, using current year: {year_code}")
        
        # Get the next serial number for this combination
        # Find the latest application with similar pattern
        pattern_prefix = f"PU/{mode_code}/{lsc_code}/{year_code}/"
        logger.info(f"Searching for applications with prefix: {pattern_prefix}")
        
        latest_app = Application.objects.filter(
            application_id__startswith=pattern_prefix
        ).order_by('-application_id').first()
        
        if latest_app and latest_app.application_id:
            # Extract the serial number from the last application
            try:
                last_serial = int(latest_app.application_id.split('/')[-1])
                new_serial = last_serial + 1
                logger.info(f"Found existing application: {latest_app.application_id}, new serial: {new_serial}")
            except (ValueError, IndexError) as e:
                logger.warning(f"Could not parse serial from {latest_app.application_id}: {e}")
                new_serial = 1
        else:
            new_serial = 1
            logger.info(f"No existing applications found with prefix {pattern_prefix}, starting at 0001")
        
        # Format serial number as 4 digits
        serial_number = f"{new_serial:04d}"
        
        # Create the full application ID
        application_id = f"PU/{mode_code}/{lsc_code}/{year_code}/{serial_number}"
        logger.info(f"Generated Application ID: {application_id}")
        
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
        amount = 354.00  # Default application fee
        try:
            if application.course:
                # First try to match by course_short_code (the actual course code)
                course = Courses.objects.filter(course_short_code=application.course).first()
                if not course:
                    # Fallback: try matching by degree field
                    course = Courses.objects.filter(degree=application.course).first()
                if course:
                    amount = float(course.application_fee)
                    logger.info(f"Fetched application fee ₹{amount} for course: {application.course}")
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
            application = Application.objects.filter(user=user).first()
            if not application:
                raise Application.DoesNotExist("Application not found")
        except Exception as e:
            logger.warning(f"Error getting application for user {user.email}: {e}")
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
def get_payment_history(request):
    """
    Get complete payment history from feepayment table with application details
    Returns all transaction data stored in the database
    """
    try:
        user = request.user
        logger.info(f"Fetching payment history for user: {user.email}")
        
        # Get student details
        student = Student.objects.filter(email=user.email).first()
        if not student:
            return Response({
                'status': 'error',
                'message': 'Student profile not found.'
            }, status=404)
        
        # Get application
        application = Application.objects.filter(user=user).first()
        if not application:
            return Response({
                'status': 'error',
                'message': 'Application not found.'
            }, status=404)
        
        # Get payment records from ApplicationPayment (feepayment table)
        fee_payment = ApplicationPayment.objects.filter(
            user=user,
            payment_status='TXN_SUCCESS'
        ).order_by('-transaction_date').first()
        
        if not fee_payment and application.application_id:
            # Try by application_id
            fee_payment = ApplicationPayment.objects.filter(
                application_id=application.application_id
            ).first()
        
        # Get course fee
        application_fee = 354.00
        if application.course:
            try:
                course = Courses.objects.filter(course_short_code=application.course).first()
                if not course:
                    course = Courses.objects.filter(degree=application.course).first()
                if course:
                    application_fee = float(course.application_fee)
            except Exception as e:
                logger.warning(f"Could not fetch course fee: {str(e)}")
        
        # Build response
        response_data = {
            'student': {
                'name': student.name,
                'email': student.email,
                'phone': student.phone or '',
                'lsc_code': student.lsc_code or '',
                'lsc_name': student.lsc_name or ''
            },
            'application': {
                'application_id': application.application_id,
                'course': application.course,
                'degree': application.degree,
                'branch_name': application.branch_name,
                'mode_of_study': application.mode_of_study,
                'academic_year': application.academic_year,
                'payment_status': application.payment_status,
                'status': application.status
            },
            'payment': {
                'application_fee': application_fee,
                'currency': 'INR',
                'formatted_fee': f"{application_fee:.2f}"
            },
            'transaction': None
        }
        
        # Add transaction details if available
        if fee_payment:
            response_data['transaction'] = {
                'transaction_id': fee_payment.transaction_id,
                'bank_transaction_id': fee_payment.bank_transaction_id,
                'order_id': fee_payment.order_id,
                'amount': str(fee_payment.amount),
                'payment_status': fee_payment.payment_status,
                'transaction_type': fee_payment.transaction_type,
                'gateway_name': fee_payment.gateway_name,
                'payment_mode': fee_payment.payment_mode,
                'bank_name': fee_payment.bank_name,
                'transaction_date': fee_payment.transaction_date.isoformat() if fee_payment.transaction_date else None,
                'response_code': fee_payment.response_code,
                'response_message': fee_payment.response_message
            }
            logger.info(f"Found transaction record for {user.email}: {fee_payment.transaction_id}")
        else:
            logger.warning(f"No transaction record found for {user.email}")
        
        return Response({
            'status': 'success',
            'data': response_data
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error fetching payment history for {request.user.email}: {str(e)}")
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
        
        # Get Student - use filter().first() to handle duplicates
        student = Student.objects.filter(email=user.email).first()
        if not student:
            return Response({
                'status': 'error',
                'message': 'Student profile not found. Please complete your profile first.'
            }, status=404)
        
        # Get Application - use filter().first() to handle duplicates
        application = Application.objects.filter(user=user).first()
        if not application:
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
        
        # Get LSC information with proper defaults
        if student.lsc_code and student.lsc_name:
            lsc_code = student.lsc_code
            lsc_name = student.lsc_name
        else:
            # Default to CDOE main center for direct registrations
            lsc_code = 'LC2101'
            lsc_name = 'Centre for Distance and Online Education (CDOE)'
        
        # Fetch course fee from tbl_course
        application_fee = 354.00  # Default fallback
        course_info = None
        
        if application.course:
            try:
                from api.models import Courses
                course = Courses.objects.filter(course_short_code=application.course).first()
                if course:
                    application_fee = float(course.application_fee)
                    course_info = {
                        'course_code': course.course_short_code,
                        'course_name': course.course_full_name,
                        'degree': course.degree,
                        'branch': course.branch_name
                    }
                    logger.info(f"Course fee fetched: ₹{application_fee} for course {application.course}")
            except Exception as e:
                logger.warning(f"Could not fetch course fee: {str(e)}")
        
        # Build response data
        response_data = {
            'student': {
                'name': student.name,
                'email': student.email,
                'lsc_code': lsc_code,
                'lsc_name': lsc_name
            },
            'application': {
                'id': application.id,
                'application_id': application.application_id,
                'mode_of_study': application.mode_of_study,
                'mode_code': mode_code,
                'academic_year': application.academic_year or admission_year,
                'status': application.status,
                'payment_status': application.payment_status,
                'course': application.course,
                'degree': application.degree,
                'branch_name': application.branch_name,
                'document_validation': application.document_validation,
                'verified_by': application.verified_by,
                'verified_date': application.verified_date.isoformat() if application.verified_date else None,
                'enrollment_no': application.enrollment_no
            },
            'course': course_info,
            'payment': {
                'application_fee': application_fee,
                'currency': 'INR',
                'formatted_fee': f"{application_fee:.2f}"
            },
            'admission': {
                'admission_code': admission_code,
                'admission_year': admission_year
            },
            'application_id_format': {
                'prefix': 'PU',
                'mode': mode_code,
                'lsc': lsc_code,
                'year': admission_code,
                'format': f"PU/{mode_code}/{lsc_code}/{admission_code}/XXXX"
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
        # Query from unified database
        application = Application.objects.filter(user=user).first()
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
                student_details = StudentDetails.objects.filter(user=request.user).first()
                if student_details:
                    serializer = StudentDetailsSerializer(student_details)
                    response_data = serializer.data
                    # Ensure name_initial and email are always present from Application
                    response_data['email'] = email
                    response_data['name_initial'] = name_initial or response_data.get('name_initial', '')
                    logger.info(f"Returning existing StudentDetails with name_initial: {response_data['name_initial']}")
                else:
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
            except Exception as e:
                logger.warning(f"Error getting student details for user {request.user.email}: {e}")
                # Fallback to default response
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
            
            # Sanitize filename - remove spaces, special characters, and limit length
            import re
            safe_original_name = re.sub(r'[^\w\-_\.]', '_', file.name)  # Replace special chars with underscore
            safe_original_name = re.sub(r'_+', '_', safe_original_name)  # Replace multiple underscores with single
            safe_original_name = safe_original_name[:50]  # Limit filename length
            
            file_name = f"{email.replace('@', '_at_').replace('.', '_')}_{doc_type}_{safe_original_name}"
            
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
        student_details = StudentDetails.objects.filter(user=user).first()
    except Exception as e:
        logger.warning(f"Error getting student details for user {user.email}: {e}")
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
        # Try Student model first using filter().first() to avoid MultipleObjectsReturned
        student = Student.objects.filter(email=user.email).first()
        if student:
            email = student.email
            logger.info(f"Got email from Student model: {email}")
        else:
            logger.warning(f"Student record not found for user: {user.username}, trying Application model")
            # Try Application model using filter().first() to avoid duplicate issues
            application = Application.objects.filter(email=user.email).first()
            if application:
                email = application.email
                logger.info(f"Got email from Application model: {email}")
            else:
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

        # Upload to local storage - sanitize filename to remove spaces and special characters
        sanitized_filename = file.name.replace(' ', '_').replace('(', '').replace(')', '').replace('[', '').replace(']', '')
        file_name = f"{email.replace('@', '_at_').replace('.', '_')}_{qualification_type.replace('.', '')}_{sanitized_filename}"
        file_url = upload_to_local_storage(temp_file_path, file_name, folder_path)
        logger.info(f"File uploaded to local storage: {file_url}")

        # Update StudentDetails - use filter().first() to avoid duplicate user issues
        student_details = StudentDetails.objects.filter(email=email).first()
        if not student_details:
            # Create new student details
            user_instance = User.objects.filter(username=user.email).first() or user
            student_details = StudentDetails.objects.create(
                user=user_instance,
                email=email,
                name_initial=''
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

        # Fetch Student data - handle duplicates
        try:
            student = Student.objects.filter(email=user.email).first()
            if student:
                data['student'] = StudentSerializer(student).data
            else:
                data['student'] = None
        except Exception as e:
            logger.error(f"Error fetching Student for {user.email}: {str(e)}")
            data['student'] = None

        # Fetch Application data - handle duplicates
        try:
            application = Application.objects.filter(email=user.email).first()
            if application:
                data['application'] = ApplicationSerializer(application).data
            else:
                data['application'] = None
        except Exception as e:
            logger.error(f"Error fetching Application for {user.email}: {str(e)}")
            data['application'] = None

        # Fetch StudentDetails data - use email-based lookup
        try:
            student_details = StudentDetails.objects.filter(email=user.email).first()
            if student_details:
                data['student_details'] = StudentDetailsSerializer(student_details).data
            else:
                data['student_details'] = None
        except Exception as e:
            logger.error(f"Error fetching StudentDetails for {user.email}: {str(e)}")
            data['student_details'] = None

        # Fetch MarksheetUpload data - use StudentDetails instead of Student
        try:
            student_details_obj = StudentDetails.objects.filter(email=user.email).first()
            if student_details_obj:
                marksheet_uploads = MarksheetUpload.objects.filter(student=student_details_obj)
                data['marksheet_uploads'] = MarksheetUploadSerializer(marksheet_uploads, many=True).data
            else:
                data['marksheet_uploads'] = []
        except Exception as e:
            logger.error(f"Error fetching MarksheetUploads for {user.email}: {str(e)}")
            data['marksheet_uploads'] = []

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
            application = Application.objects.filter(
                user=request.user,
                id=application_id,
                status='Draft',
                is_active=True
            ).first()
            if not application:
                raise Application.DoesNotExist("Application not found")
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
            payment = Payment.objects.filter(application_id=application_id, user=request.user).first()
            if not payment:
                raise Payment.DoesNotExist("Payment not found")
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
                application = Application.objects.filter(
                    user=request.user,
                    id=app_data.get('data', {}).get('id'),
                    status__in=['Draft', 'In Progress'],
                    is_active=True
                ).first()
                if application:
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
            payment = Payment.objects.filter(application_id=application_id, user=request.user).first()
        except Exception as e:
            logger.warning(f"Error getting payment for user {request.user.email}: {e}")
            payment = None
        
        if not payment:
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
from .models import ApplicationPayment, Application, Student, Courses
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


def generate_application_pdf_html(application_data):
    """
    Generate HTML for application PDF matching the professional format
    Optimized for xhtml2pdf rendering
    """
    # Extract photo and signature URLs
    photo_url = application_data.get('photo_url', '')
    signature_url = application_data.get('signature_url', '')
    
    # Build photo HTML
    photo_html = 'Photo Not Uploaded'
    if photo_url:
        try:
            # Remove /media/ prefix if it exists in photo_url
            clean_photo_url = photo_url.replace('/media/', '') if photo_url.startswith('/media/') else photo_url
            full_photo_url = f"{settings.MEDIA_ROOT}/{clean_photo_url}" if not photo_url.startswith('http') else photo_url
            photo_html = f'<img src="{full_photo_url}" width="90" height="120" />'
        except:
            photo_html = 'Photo Not Uploaded'
    
    # Build signature HTML
    signature_html = '___________________'
    if signature_url:
        try:
            # Remove /media/ prefix if it exists in signature_url
            clean_signature_url = signature_url.replace('/media/', '') if signature_url.startswith('/media/') else signature_url
            full_signature_url = f"{settings.MEDIA_ROOT}/{clean_signature_url}" if not signature_url.startswith('http') else signature_url
            signature_html = f'<img src="{full_signature_url}" width="120" height="30" />'
        except:
            signature_html = '___________________'
    
    # Build qualifications table rows
    qualifications_html = ''
    qualifications = application_data.get('qualifications')
    if qualifications and isinstance(qualifications, list) and len(qualifications) > 0:
        for qual in qualifications:
            if not qual or not isinstance(qual, dict):
                continue
                
            # Parse subjects
            subjects = qual.get('subject_studied', 'Not Specified')
            if isinstance(subjects, list):
                subjects = ', '.join(str(s) for s in subjects if s)
            elif subjects is None:
                subjects = 'Not Specified'
            else:
                subjects = str(subjects)
            
            # Parse month/year
            month = qual.get('month_of_passing') or 'N/A'
            year = qual.get('year_of_passing') or 'N/A'
            
            qualifications_html += f'''
            <tr>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{qual.get('course') or '-'}</td>
                <td style="text-align: center; padding: 3px; font-size: 7pt;">{qual.get('institute_name') or '-'}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{qual.get('board') or '-'}</td>
                <td style="text-align: left; padding: 3px; font-size: 7pt;">{subjects[:40]}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{qual.get('reg_no') or '-'}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{qual.get('percentage') or 'N/A'}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{month}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{year}</td>
                <td style="text-align: center; padding: 3px; font-size: 8pt;">{qual.get('mode_of_study') or 'Regular'}</td>
            </tr>
            '''
    
    if not qualifications_html:
        qualifications_html = '<tr><td colspan="9" style="text-align: center; padding: 8px; font-size: 9pt;">No qualification data available</td></tr>'
    
    # Build enrollment row if exists
    enrollment_row = ''
    if application_data.get('enrollment_no'):
        enrollment_row = f'''
        <tr>
            <td colspan="2" style="background: #d4edda; padding: 5px; border: 1px solid #000;">
                <b>Enrollment No :</b> <span style="color: #155724; font-size: 11pt;"><b>{application_data['enrollment_no']}</b></span>
            </td>
        </tr>
        '''
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{ size: A4; margin: 10mm; }}
            body {{ font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.2; color: #000; margin: 0; padding: 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; }}
            td, th {{ border: 1px solid #000; padding: 4px; vertical-align: middle; word-wrap: break-word; }}
            .header-border {{ border-bottom: 3px solid #8B008B; padding-bottom: 5px; margin-bottom: 8px; }}
            .uni-name {{ font-size: 20pt; font-weight: bold; color: #8B008B; margin: 0; padding: 0; }}
            .uni-sub {{ font-size: 8pt; color: #333; margin: 1px 0; padding: 0; }}
            .uni-addr {{ font-size: 9pt; color: #333; font-weight: bold; margin: 2px 0 5px 0; padding: 0; }}
            .cdoe {{ color: #FF8C00; font-size: 12pt; font-weight: bold; margin: 3px 0 1px 0; padding: 0; }}
            .odl {{ color: #FF8C00; font-size: 10pt; font-weight: bold; margin: 0; padding: 0; }}
            .title {{ font-size: 10pt; font-weight: bold; text-decoration: underline; text-align: center; margin: 6px 0; }}
            .sec-header {{ background: #e9ecef; font-weight: bold; padding: 4px 8px; margin: 5px 0 3px 0; border: 1px solid #000; font-size: 9pt; }}
            .row-num {{ width: 20px; text-align: center; font-weight: bold; background: #e9ecef; font-size: 9pt; }}
            .lbl {{ width: 150px; font-weight: 500; background: #f8f9fa; font-size: 9pt; }}
            .val {{ font-weight: 600; font-size: 9pt; }}
            .pay-title {{ text-align: center; font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 4px 0; }}
            .pay-lbl {{ font-weight: bold; width: 100px; background: #e9ecef; font-size: 8pt; }}
            .pay-val {{ font-weight: 600; font-size: 8pt; }}
            .pay-success {{ color: #28a745; font-weight: bold; background: #d4edda; font-size: 8pt; }}
            .decl-title {{ font-size: 10pt; font-weight: bold; text-align: center; text-decoration: underline; margin: 4px 0; }}
            .decl-text {{ font-size: 8.5pt; line-height: 1.3; text-align: justify; margin: 3px 0; }}
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header-border">
            <p class="uni-name">Periyar University</p>
            <p class="uni-sub">State University - NAAC 'A++' Grade - NIRF Rank 94</p>
            <p class="uni-sub">State Public University Rank 40 - SDG Institutions Rank Band: 11-50</p>
            <p class="uni-addr">Salem-636011, Tamilnadu, India</p>
            <p class="cdoe">CENTRE FOR DISTANCE AND ONLINE EDUCATION (CDOE)</p>
            <p class="odl">Open and Distance Learning</p>
        </div>

        <p class="title">Open and Distance Learning Programme (ODL) Admission for the Academic Year {application_data.get('academic_year', '2025-26')}</p>

        <!-- Application Info -->
        <table>
            <tr>
                <td style="padding: 5px; width: 70%;"><b>Application No :</b> {application_data.get('application_id', '-')}</td>
                <td style="padding: 5px; width: 30%; text-align: center;">Applicant Photo</td>
            </tr>
            <tr>
                <td style="padding: 5px;"><b>Applied Date :</b> {application_data.get('applied_date', '-')}</td>
                <td style="text-align: center; vertical-align: top; padding: 5px;">{photo_html}</td>
            </tr>
            <tr>
                <td style="padding: 5px;"><b>LSC :</b> {application_data.get('lsc_name', 'CDOE')}</td>
                <td style="text-align: center; vertical-align: top; padding: 5px;"></td>
            </tr>
            {enrollment_row}
        </table>

        <!-- Personal Details -->
        <table>
            <tr><td class="row-num">1.</td><td class="lbl">Programme Applied</td><td style="width: 8px;">:</td><td class="val">{application_data.get('programme', 'DIPLOMA')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">Degree</td><td>:</td><td class="val">{application_data.get('course', '-')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">Branch / Specialization</td><td>:</td><td class="val">{application_data.get('course', '-')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">Medium</td><td>:</td><td class="val">{application_data.get('medium', 'English')}</td></tr>
            <tr><td class="row-num">2.</td><td class="lbl">Name of the Applicant</td><td>:</td><td class="val">{application_data.get('student_name', '-')}</td></tr>
            <tr><td class="row-num">3.</td><td class="lbl">Date of Birth</td><td>:</td><td class="val">{application_data.get('dob', '-')}</td></tr>
            <tr><td class="row-num">4.</td><td class="lbl">(a) Father & Mother Name</td><td>:</td><td class="val">{application_data.get('father_name', '-')} / {application_data.get('mother_name', '-')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">(b) Guardian Name</td><td>:</td><td class="val">{application_data.get('guardian_name', '-')}</td></tr>
            <tr><td class="row-num">5.</td><td class="lbl">Parent Occupation</td><td>:</td><td class="val">{application_data.get('parent_occupation', '-')}</td></tr>
            <tr><td class="row-num">6.</td><td class="lbl">Gender</td><td>:</td><td class="val">{application_data.get('gender', '-')}</td></tr>
            <tr><td class="row-num">7.</td><td class="lbl">Mother Tongue</td><td>:</td><td class="val">{application_data.get('mother_tongue', '-')}</td></tr>
            <tr><td class="row-num">8.</td><td class="lbl">Nationality</td><td>:</td><td class="val">{application_data.get('nationality', 'Indian')}</td></tr>
            <tr><td class="row-num">9.</td><td class="lbl">Religion</td><td>:</td><td class="val">{application_data.get('religion', '-')}</td></tr>
            <tr><td class="row-num">10.</td><td class="lbl">Community</td><td>:</td><td class="val">{application_data.get('community', '-')}</td></tr>
        </table>

        <!-- Address -->
        <div class="sec-header">11. Communication Address &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Permanent Address</div>
        <table>
            <tr>
                <td style="width: 50%; vertical-align: top; padding: 5px; font-size: 8.5pt;">{application_data.get('communication_address', '-')}</td>
                <td style="width: 50%; vertical-align: top; padding: 5px; font-size: 8.5pt;">{application_data.get('permanent_address', '-')}</td>
            </tr>
        </table>

        <!-- Contact Details -->
        <table>
            <tr><td class="row-num">12.</td><td class="lbl">Mobile No.</td><td>:</td><td class="val">{application_data.get('phone', '-')}</td></tr>
            <tr><td class="row-num">13.</td><td class="lbl">E-mail ID</td><td>:</td><td class="val">{application_data.get('email', '-')}</td></tr>
            <tr><td class="row-num">14.</td><td class="lbl">(a) Aadhaar No & Name</td><td>:</td><td class="val">{application_data.get('aadhaar_number', '-')}, {application_data.get('aadhaar_name', '')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">(b) ABC ID</td><td>:</td><td class="val">{application_data.get('abc_id', '')}</td></tr>
            <tr><td class="row-num"></td><td class="lbl">(c) DEB ID</td><td>:</td><td class="val">{application_data.get('deb_id', '')}</td></tr>
            <tr><td class="row-num">15.</td><td class="lbl">Differently Abled</td><td>:</td><td class="val">{application_data.get('differently_abled', 'No')}</td></tr>
            <tr><td class="row-num">16.</td><td class="lbl">Blood Group</td><td>:</td><td class="val">{application_data.get('blood_group', '-')}</td></tr>
            <tr><td class="row-num">17.</td><td class="lbl">Access to Internet</td><td>:</td><td class="val">{application_data.get('internet_access', 'Yes')}</td></tr>
        </table>

        <!-- Education -->
        <div class="sec-header">18. Education Qualification</div>
        <table>
            <thead>
                <tr style="background: #e9ecef;">
                    <th style="width: 9%; font-size: 8pt; padding: 2px; text-align: center;">Course</th>
                    <th style="width: 14%; font-size: 8pt; padding: 2px; text-align: center;">Institution</th>
                    <th style="width: 9%; font-size: 8pt; padding: 2px; text-align: center;">Board</th>
                    <th style="width: 18%; font-size: 8pt; padding: 2px; text-align: center;">Subject Studied</th>
                    <th style="width: 10%; font-size: 8pt; padding: 2px; text-align: center;">Register No</th>
                    <th style="width: 6%; font-size: 8pt; padding: 2px; text-align: center;">%</th>
                    <th style="width: 7%; font-size: 8pt; padding: 2px; text-align: center;">Month</th>
                    <th style="width: 7%; font-size: 8pt; padding: 2px; text-align: center;">Year</th>
                    <th style="width: 9%; font-size: 8pt; padding: 2px; text-align: center;">Mode</th>
                </tr>
            </thead>
            <tbody>{qualifications_html}</tbody>
        </table>

        <!-- Work Experience -->
        <div class="sec-header">19. Working Experience</div>
        <table>
            <thead>
                <tr style="background: #e9ecef;">
                    <th style="width: 25%; font-size: 8pt; padding: 2px;">Current Designation</th>
                    <th style="width: 35%; font-size: 8pt; padding: 2px;">Current Institution</th>
                    <th style="width: 20%; font-size: 8pt; padding: 2px;">Experience (Years)</th>
                    <th style="width: 20%; font-size: 8pt; padding: 2px;">Annual Income (Rs)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: center; padding: 3px; font-size: 8.5pt;">{application_data.get('current_designation', 'N/A')}</td>
                    <td style="text-align: center; padding: 3px; font-size: 8.5pt;">{application_data.get('current_institution', 'N/A')}</td>
                    <td style="text-align: center; padding: 3px; font-size: 8.5pt;">{application_data.get('work_experience_years', 'N/A')}</td>
                    <td style="text-align: center; padding: 3px; font-size: 8.5pt;">{application_data.get('annual_income', 'N/A')}</td>
                </tr>
            </tbody>
        </table>

        <!-- Payment -->
        <p class="pay-title">Payment Status</p>
        <table style="border: 2px solid #000;">
            <tr>
                <td class="pay-lbl">Order ID</td><td class="pay-val">{application_data.get('order_id', '-')}</td>
                <td class="pay-lbl">Amount</td><td class="pay-val">Rs. {application_data.get('amount', '236.00')}</td>
                <td class="pay-lbl">Status</td><td class="pay-success">{application_data.get('payment_status_display', 'SUCCESS')}</td>
            </tr>
            <tr>
                <td class="pay-lbl">Bank</td><td class="pay-val">{application_data.get('bank_name', '-')}</td>
                <td class="pay-lbl">Mode</td><td class="pay-val">{application_data.get('payment_mode', 'UPI')}</td>
                <td class="pay-lbl">Date</td><td class="pay-val">{application_data.get('transaction_date', '-')[:16]}</td>
            </tr>
        </table>

        <!-- Declaration -->
        <p class="decl-title">DECLARATION</p>
        <table style="border: 2px solid #000;">
            <tr>
                <td style="padding: 6px;">
                    <p class="decl-text">
                        I hereby declare that all the information provided in this application form is true and correct to the best of my knowledge and belief.
                        I understand that any false or misleading information may result in the rejection of my application or cancellation of my admission.
                    </p>
                    <p class="decl-text">
                        I agree to abide by all the rules and regulations of the Centre for Distance and Online Education (CDOE), Periyar University.
                    </p>
                    <br/>
                    <p style="font-size: 8.5pt; font-weight: bold; margin: 2px 0;">Place: _________________</p>
                    <p style="font-size: 8.5pt; font-weight: bold; margin: 2px 0;">Date: _________________</p>
                    <p style="text-align: right; margin: 20px 10px 5px 0;">
                        {signature_html}<br/>
                        <span style="font-size: 8.5pt; font-weight: bold;">Applicant's Signature</span>
                    </p>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 15px; text-align: center; font-size: 8pt; padding: 10px; background: #f8f9fa; border-top: 3px solid #8B008B;">
            © Periyar University, Salem. All Rights Reserved.
        </div>
    </body>
    </html>
    '''
    return html


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_application_email(request):
    """
    Send application form PDF to the user's email address with PDF attachment.
    """
    try:
        user = request.user
        email = request.data.get('email', user.email)
        
        # Get application data using the same logic as download_application
        application = Application.objects.filter(user=user, status__in=['In Progress', 'Completed']).first()
        if not application:
            logger.warning(f"No application found for user: {user.email}")
            return Response(
                {"status": "error", "message": "No application found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get student details
        student = Student.objects.filter(email=user.email).first()
        student_details = StudentDetails.objects.filter(user=user).first()
        payment = Payment.objects.filter(user=user, application_id=application.application_id).first()
        
        # Try multiple methods to get fee payment
        fee_payment = ApplicationPayment.objects.filter(user=user, application_id=application.application_id).first()
        if not fee_payment:
            fee_payment = ApplicationPayment.objects.filter(user=user).order_by('-transaction_date').first()
        
        student_name = student.name if student else user.email
        application_id = application.application_id or "N/A"
        # Get submission date from payment transaction date or verified_date
        submission_date = 'N/A'
        if fee_payment and hasattr(fee_payment, 'transaction_date') and fee_payment.transaction_date:
            submission_date = fee_payment.transaction_date.strftime('%d-%m-%Y')
            logger.info(f"Using fee_payment transaction_date: {submission_date}")
        elif payment and hasattr(payment, 'payment_date') and payment.payment_date:
            submission_date = payment.payment_date.strftime('%d-%m-%Y')
            logger.info(f"Using payment payment_date: {submission_date}")
        elif payment and hasattr(payment, 'transaction_date') and payment.transaction_date:
            submission_date = payment.transaction_date.strftime('%d-%m-%Y')
            logger.info(f"Using payment transaction_date: {submission_date}")
        elif hasattr(application, 'verified_date') and application.verified_date:
            submission_date = application.verified_date.strftime('%d-%m-%Y')
            logger.info(f"Using application verified_date: {submission_date}")
        else:
            logger.warning(f"No submission date found for application {application_id}")
        
        # Prepare application data for PDF
        lsc_code = student.lsc_code if student and student.lsc_code else ''
        lsc_name = student.lsc_name if student and student.lsc_name else ''
        
        # Resolve photo and signature URLs
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
            resolved_photo_url = ''
            resolved_signature_url = ''

        application_data = {
            'application_id': application_id,
            'enrollment_no': application.enrollment_no if hasattr(application, 'enrollment_no') else '',
            'applied_date': submission_date,
            'photo_url': resolved_photo_url,
            'signature_url': resolved_signature_url,
            'programme': application.programme_applied or 'DIPLOMA',
            'course': application.course or '',
            'medium': application.medium or '',
            'mode_of_study': application.mode_of_study or '',
            'academic_year': application.academic_year or '2025-26',
            'lsc_code': lsc_code,
            'lsc_name': lsc_name,
            'student_name': student.name if student else '',
            'name': student.name if student else '',
            'dob': application.dob.strftime('%d-%m-%Y') if application.dob else '',
            'gender': application.gender or '',
            'father_name': application.father_name or '',
            'mother_name': application.mother_name or '',
            'guardian_name': application.guardian_name or '',
            'parent_occupation': f"{application.father_occupation or 'N/A'} - {application.mother_occupation or 'N/A'}",
            'mother_tongue': application.mother_tongue or '',
            'nationality': application.nationality or 'Indian',
            'religion': application.religion or '',
            'community': application.community or '',
            'email': user.email,
            'phone': student.phone if student else '',
            'communication_address': f"{application.comm_area or ''}, {application.comm_town or ''}, {application.comm_district or ''}, {application.comm_state or ''} - {application.comm_pincode or ''}, {application.comm_country or ''}".strip(', '),
            'permanent_address': f"{application.perm_area or ''}, {application.perm_town or ''}, {application.perm_district or ''}, {application.perm_state or ''} - {application.perm_pincode or ''}, {application.perm_country or ''}".strip(', '),
            'aadhaar_number': application.aadhaar_no or '',
            'aadhaar_name': application.name_as_aadhaar or '',
            'abc_id': application.abc_id or '',
            'deb_id': application.deb_id or '',
            'differently_abled': application.differently_abled or 'No',
            'blood_group': application.blood_group or '',
            'internet_access': application.access_internet or 'Yes',
            'qualifications': student_details.qualifications if (student_details and student_details.qualifications) else [],
            'current_designation': student_details.current_designation if student_details else '',
            'current_institution': student_details.current_institute if student_details else '',
            'work_experience_years': student_details.years_experience if student_details else 'N/A',
            'annual_income': student_details.annual_income if student_details else 'N/A',
            'payment_status_display': 'TXN_SUCCESS' if application.payment_status == 'P' else 'PENDING',
            'order_id': (fee_payment.order_id if fee_payment and fee_payment.order_id else (payment.transaction_id if payment and hasattr(payment, 'transaction_id') and payment.transaction_id else 'N/A')),
            'amount': str(fee_payment.amount) if (fee_payment and fee_payment.amount) else (str(payment.amount) if payment and hasattr(payment, 'amount') and payment.amount else '236.00'),
            'payment_mode': (fee_payment.payment_mode if fee_payment and fee_payment.payment_mode else (payment.payment_mode if payment and hasattr(payment, 'payment_mode') and payment.payment_mode else 'Online')),
            'bank_name': (fee_payment.bank_name if fee_payment and hasattr(fee_payment, 'bank_name') and fee_payment.bank_name else (payment.bank_name if payment and hasattr(payment, 'bank_name') and payment.bank_name else 'N/A')),
            'transaction_date': (fee_payment.transaction_date.strftime('%d-%m-%Y %H:%M:%S') if (fee_payment and hasattr(fee_payment, 'transaction_date') and fee_payment.transaction_date) else (payment.payment_date.strftime('%d-%m-%Y %H:%M:%S') if payment and hasattr(payment, 'payment_date') and payment.payment_date else 'N/A')),
        }
        
        # Generate HTML content for email
        try:
            # Build qualifications HTML
            qualifications_html = ''
            if application_data.get('qualifications'):
                logger.info(f"Qualifications data: {application_data.get('qualifications')}")
                for i, qual in enumerate(application_data['qualifications']):
                    logger.info(f"Qualification {i}: {qual}")
                    subjects = qual.get('subject_studied', 'Not Specified')
                    if isinstance(subjects, list):
                        subjects = ', '.join(str(s) for s in subjects if s)
                    
                    # Get year - try multiple fields
                    year = qual.get('year_of_passing') or qual.get('year') or qual.get('passing_year') or 'N/A'
                    logger.info(f"Year for qualification {i}: {year} (from keys: {list(qual.keys())})")
                    
                    qualifications_html += f'''
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">{qual.get('course', '-')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{qual.get('institute_name', '-')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{qual.get('board', '-')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{subjects}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{qual.get('percentage', 'N/A')}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{year}</td>
                    </tr>
                    '''
            else:
                qualifications_html = '<tr><td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: center;">No qualification data</td></tr>'
            
            # Get photo URL for email (use full backend URL)
            photo_html = ''
            if resolved_photo_url:
                # Convert to web-accessible URL - use backend URL for media files
                # Remove /media/ prefix if present to avoid duplication
                photo_web_url = resolved_photo_url.replace('/media/', '', 1) if resolved_photo_url.startswith('/media/') else resolved_photo_url
                # Also remove media/ prefix if present
                photo_web_url = photo_web_url.replace('media/', '', 1) if photo_web_url.startswith('media/') else photo_web_url
                backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
                full_photo_url = f"{backend_url}/media/{photo_web_url}" if not resolved_photo_url.startswith('http') else resolved_photo_url
                logger.info(f"Original photo URL: {resolved_photo_url}")
                logger.info(f"Cleaned photo URL: {photo_web_url}")
                logger.info(f"Full photo URL for email: {full_photo_url}")
                photo_html = f'''<div style="text-align: center; padding: 10px;">
                    <img src="{full_photo_url}" style="max-width: 150px; max-height: 180px; border: 2px solid #ddd; display: block; margin: 0 auto;" alt="Applicant Photo">
                    <p style="font-size: 11px; color: #666; margin-top: 5px;">Applicant Photo</p>
                </div>'''
            else:
                photo_html = '<div style="width: 150px; height: 180px; border: 1px solid #ddd; display: inline-block; text-align: center; line-height: 180px; background: #f0f0f0; margin: 0 auto;">Photo Not Uploaded</div>'
            
            # Prepare email content
            subject = f"CDOE Application Form - {application_id}"
            
            # Create comprehensive HTML email
            email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }}
        .header {{ background: #8B008B; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .info-box {{ background: #f8f9fa; border-left: 4px solid #8B008B; padding: 15px; margin: 20px 0; }}
        .section {{ margin: 20px 0; }}
        .section-title {{ background: #e9ecef; padding: 10px; font-weight: bold; border-left: 4px solid #8B008B; margin: 15px 0 10px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #e9ecef; font-weight: bold; }}
        .photo-section {{ text-align: center; margin: 15px 0; }}
        .footer {{ background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; margin-top: 30px; }}
        .label {{ font-weight: bold; color: #555; }}
        .value {{ color: #000; }}
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">PERIYAR UNIVERSITY</h1>
        <p style="margin: 5px 0;">Centre for Distance and Online Education (CDOE)</p>
        <p style="margin: 5px 0; font-size: 14px;">Salem-636011, Tamilnadu, India</p>
    </div>
    
    <div class="content">
        <p>Dear <strong>{student_name}</strong>,</p>
        
        <p>Your application for Centre for Distance and Online Education (CDOE), Periyar University has been successfully submitted.</p>
        
        <div class="info-box">
            <h3 style="margin: 0 0 10px 0;">Application Summary</h3>
            <p style="margin: 5px 0;"><span class="label">Application ID:</span> <span class="value">{application_id}</span></p>
            <p style="margin: 5px 0;"><span class="label">Programme:</span> <span class="value">{application.programme_applied or 'N/A'}</span></p>
            <p style="margin: 5px 0;"><span class="label">Course:</span> <span class="value">{application.course or 'N/A'}</span></p>
            <p style="margin: 5px 0;"><span class="label">Medium:</span> <span class="value">{application.medium or 'N/A'}</span></p>
            <p style="margin: 5px 0;"><span class="label">Submission Date:</span> <span class="value">{submission_date}</span></p>
            {f'<p style="margin: 5px 0;"><span class="label">Enrollment No:</span> <span class="value" style="color: green; font-weight: bold;">{application.enrollment_no}</span></p>' if application.enrollment_no else ''}
        </div>
        
        <div class="photo-section">
            {photo_html}
        </div>
        
        <div class="section-title">Personal Details</div>
        <table>
            <tr><td class="label" style="width: 40%;">Name</td><td class="value">{application_data.get('student_name', '-')}</td></tr>
            <tr><td class="label">Date of Birth</td><td class="value">{application_data.get('dob', '-')}</td></tr>
            <tr><td class="label">Gender</td><td class="value">{application_data.get('gender', '-')}</td></tr>
            <tr><td class="label">Father's Name</td><td class="value">{application_data.get('father_name', '-')}</td></tr>
            <tr><td class="label">Mother's Name</td><td class="value">{application_data.get('mother_name', '-')}</td></tr>
            <tr><td class="label">Guardian Name</td><td class="value">{application_data.get('guardian_name', '-')}</td></tr>
            <tr><td class="label">Mother Tongue</td><td class="value">{application_data.get('mother_tongue', '-')}</td></tr>
            <tr><td class="label">Nationality</td><td class="value">{application_data.get('nationality', 'Indian')}</td></tr>
            <tr><td class="label">Religion</td><td class="value">{application_data.get('religion', '-')}</td></tr>
            <tr><td class="label">Community</td><td class="value">{application_data.get('community', '-')}</td></tr>
            <tr><td class="label">Blood Group</td><td class="value">{application_data.get('blood_group', '-')}</td></tr>
            <tr><td class="label">Differently Abled</td><td class="value">{application_data.get('differently_abled', 'No')}</td></tr>
        </table>
        
        <div class="section-title">Contact Information</div>
        <table>
            <tr><td class="label" style="width: 40%;">Mobile Number</td><td class="value">{application_data.get('phone', '-')}</td></tr>
            <tr><td class="label">Email</td><td class="value">{application_data.get('email', '-')}</td></tr>
            <tr><td class="label">Aadhaar Number</td><td class="value">{application_data.get('aadhaar_number', '-')}</td></tr>
            <tr><td class="label">ABC ID</td><td class="value">{application_data.get('abc_id', '-')}</td></tr>
            <tr><td class="label">DEB ID</td><td class="value">{application_data.get('deb_id', '-')}</td></tr>
        </table>
        
        <div class="section-title">Address</div>
        <table>
            <tr><td class="label" style="width: 40%;">Communication Address</td><td class="value">{application_data.get('communication_address', '-')}</td></tr>
            <tr><td class="label">Permanent Address</td><td class="value">{application_data.get('permanent_address', '-')}</td></tr>
        </table>
        
        <div class="section-title">Educational Qualification</div>
        <table>
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Institution</th>
                    <th>Board</th>
                    <th>Subjects</th>
                    <th>Percentage</th>
                    <th>Year</th>
                </tr>
            </thead>
            <tbody>
                {qualifications_html}
            </tbody>
        </table>
        
        <div class="section-title">Work Experience</div>
        <table>
            <tr><td class="label" style="width: 40%;">Current Designation</td><td class="value">{application_data.get('current_designation', 'N/A')}</td></tr>
            <tr><td class="label">Current Institution</td><td class="value">{application_data.get('current_institution', 'N/A')}</td></tr>
            <tr><td class="label">Years of Experience</td><td class="value">{application_data.get('work_experience_years', 'N/A')}</td></tr>
            <tr><td class="label">Annual Income</td><td class="value">Rs. {application_data.get('annual_income', 'N/A')}</td></tr>
        </table>
        
        <div class="section-title">Payment Details</div>
        <table>
            <tr><td class="label" style="width: 40%;">Order ID</td><td class="value">{application_data.get('order_id', '-')}</td></tr>
            <tr><td class="label">Amount</td><td class="value">Rs. {application_data.get('amount', '236.00')}</td></tr>
            <tr><td class="label">Payment Status</td><td class="value" style="color: green; font-weight: bold;">{application_data.get('payment_status_display', 'SUCCESS')}</td></tr>
            <tr><td class="label">Payment Mode</td><td class="value">{application_data.get('payment_mode', 'UPI')}</td></tr>
            <tr><td class="label">Bank Name</td><td class="value">{application_data.get('bank_name', '-')}</td></tr>
            <tr><td class="label">Transaction Date</td><td class="value">{application_data.get('transaction_date', '-')}</td></tr>
        </table>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Important Instructions:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Login to the student portal to download and print your application form</li>
                <li>Keep both digital and physical copies safe for future reference</li>
                <li>Submit physical documents if required by the university</li>
                <li>Check your application status regularly for updates</li>
            </ul>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
            <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/student-portal" 
               style="display: inline-block; background: #8B008B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Access Student Portal
            </a>
        </p>
        
        <p>If you have any queries, please contact:<br>
        <strong>Centre for Distance and Online Education (CDOE)</strong><br>
        Periyar University<br>
        Salem-636011, Tamilnadu, India<br>
        Email: <a href="mailto:cdoe@periyaruniversity.ac.in">cdoe@periyaruniversity.ac.in</a></p>
        
        <p>Thank you for choosing Periyar University!</p>
        
        <p style="margin-top: 30px;">
        Best Regards,<br>
        <strong>Centre for Distance and Online Education (CDOE)</strong><br>
        Periyar University
        </p>
    </div>
    
    <div class="footer">
        <p style="margin: 0;">&copy; 2025 Periyar University. All Rights Reserved.</p>
    </div>
</body>
</html>
"""
            
            # Create email with HTML content (no PDF attachment)
            email_message = EmailMessage(
                subject=subject,
                body=email_html,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@periyaruniversity.ac.in'),
                to=[email]
            )
            email_message.content_subtype = "html"  # Set email as HTML
            
            # Send email
            email_message.send(fail_silently=False)
            
            logger.info(f"Application PDF email sent successfully to {email}")
            
            return Response({
                "status": "success",
                "message": f"Application form with PDF attachment sent to {email} successfully!"
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            logger.error(f"Failed to send email to {email}: {str(email_error)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response(
                {"status": "error", "message": f"Failed to send email: {str(email_error)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Error in send_application_email for user {user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {"status": "error", "message": f"Failed to process email request: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_application_pdf(request):
    """
    Generate and return application form as PDF file for direct download.
    """
    try:
        user = request.user
        
        # Get application data using the same logic as download_application
        application = Application.objects.filter(user=user, status__in=['In Progress', 'Completed']).first()
        if not application:
            logger.warning(f"No application found for user: {user.email}")
            return HttpResponse(
                "No application found",
                status=404
            )
        
        # Get student details
        student = Student.objects.filter(email=user.email).first()
        student_details = StudentDetails.objects.filter(user=user).first()
        payment = Payment.objects.filter(user=user, application_id=application.application_id).first()
        fee_payment = ApplicationPayment.objects.filter(user=user, application_id=application.application_id).first()
        
        application_id = application.application_id or "Application"
        submission_date = application.created_at.strftime('%d-%m-%Y') if hasattr(application, 'created_at') and application.created_at else 'N/A'
        
        # Prepare application data for PDF
        lsc_code = student.lsc_code if student and student.lsc_code else ''
        lsc_name = student.lsc_name if student and student.lsc_name else ''
        
        # Resolve photo and signature URLs
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
            resolved_photo_url = ''
            resolved_signature_url = ''

        application_data = {
            'application_id': application_id,
            'enrollment_no': application.enrollment_no if hasattr(application, 'enrollment_no') else '',
            'applied_date': submission_date,
            'photo_url': resolved_photo_url,
            'signature_url': resolved_signature_url,
            'programme': application.programme_applied or 'DIPLOMA',
            'course': application.course or '',
            'medium': application.medium or '',
            'mode_of_study': application.mode_of_study or '',
            'academic_year': application.academic_year or '2025-26',
            'lsc_code': lsc_code,
            'lsc_name': lsc_name,
            'student_name': student.name if student else '',
            'name': student.name if student else '',
            'dob': application.dob.strftime('%d-%m-%Y') if application.dob else '',
            'gender': application.gender or '',
            'father_name': application.father_name or '',
            'mother_name': application.mother_name or '',
            'guardian_name': application.guardian_name or '',
            'parent_occupation': f"{application.father_occupation or 'N/A'} - {application.mother_occupation or 'N/A'}",
            'mother_tongue': application.mother_tongue or '',
            'nationality': application.nationality or 'Indian',
            'religion': application.religion or '',
            'community': application.community or '',
            'email': user.email,
            'phone': student.phone if student else '',
            'communication_address': f"{application.comm_area or ''}, {application.comm_town or ''}, {application.comm_district or ''}, {application.comm_state or ''} - {application.comm_pincode or ''}, {application.comm_country or ''}".strip(', '),
            'permanent_address': f"{application.perm_area or ''}, {application.perm_town or ''}, {application.perm_district or ''}, {application.perm_state or ''} - {application.perm_pincode or ''}, {application.perm_country or ''}".strip(', '),
            'aadhaar_number': application.aadhaar_no or '',
            'aadhaar_name': application.name_as_aadhaar or '',
            'abc_id': application.abc_id or '',
            'deb_id': application.deb_id or '',
            'differently_abled': application.differently_abled or 'No',
            'blood_group': application.blood_group or '',
            'internet_access': application.access_internet or 'Yes',
            'qualifications': student_details.qualifications if (student_details and student_details.qualifications) else [],
            'current_designation': student_details.current_designation if student_details else '',
            'current_institution': student_details.current_institute if student_details else '',
            'work_experience_years': student_details.years_experience if student_details else '',
            'annual_income': student_details.annual_income if student_details else '',
            'payment_status_display': 'TXN_SUCCESS' if application.payment_status == 'P' else 'PENDING',
            'order_id': fee_payment.order_id if fee_payment else '',
            'amount': str(fee_payment.amount) if (fee_payment and fee_payment.amount) else '236.00',
            'payment_mode': fee_payment.payment_mode if fee_payment else 'UPI',
            'bank_name': fee_payment.bank_name if fee_payment else '',
            'transaction_date': fee_payment.transaction_date.strftime('%Y-%m-%d %H:%M:%S') if (fee_payment and hasattr(fee_payment, 'transaction_date') and fee_payment.transaction_date) else '',
        }
        
        # Return application data as JSON for client-side PDF generation with print preview
        logger.info(f"Application data returned for print preview for user {user.email}")
        return Response({
            "status": "success",
            "data": application_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating PDF for user {user.email}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return HttpResponse(
            f"Failed to generate PDF: {str(e)}",
            status=500
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


# ===========================
# Materials Management APIs
# ===========================

from .models import Material
from .serializers import MaterialSerializer, MaterialUploadSerializer
from django.core.files.storage import default_storage

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_materials(request):
    """
    Get materials relevant to the authenticated student
    Based on their LSC code, programme, and semester
    """
    try:
        user = request.user
        
        # Check if user is a Django User (students) not LSCAdmin
        from django.contrib.auth.models import User
        if not isinstance(user, User):
            return Response({
                'status': 'error',
                'message': 'This endpoint is for students only'
            }, status=status.HTTP_403_FORBIDDEN)
        
        email = user.email or user.username
        
        # Get student details
        student = Student.objects.filter(email=email).first()
        if not student:
            return Response({
                'status': 'error',
                'message': 'Student profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get application details for programme info
        application = Application.objects.filter(user=user).first()
        if not application:
            # Return empty list if no application yet
            return Response({
                'status': 'success',
                'data': [],
                'count': 0,
                'message': 'No application found. Materials will be available after applying.'
            }, status=status.HTTP_200_OK)
        
        # Filter materials based on student's LSC code and programme
        materials = Material.objects.filter(
            lsc_code=student.lsc_code,
            programme=application.programme_applied,
            status='ACTIVE'
        ).order_by('-upload_date')
        
        serializer = MaterialSerializer(materials, many=True, context={'request': request})
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'count': materials.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching materials: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to fetch materials: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_material(request, material_id):
    """
    View a specific material (increments view count)
    Returns file URL for viewing only (no download)
    """
    try:
        material = Material.objects.get(id=material_id, status='ACTIVE')
        
        # Verify student has access to this material
        user = request.user
        email = user.email or user.username
        student = Student.objects.filter(email=email).first()
        
        if not student or student.lsc_code != material.lsc_code:
            return Response({
                'status': 'error',
                'message': 'Access denied. This material is not available for your LSC.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Increment view count
        material.increment_views()
        
        # Return material details with file URL
        serializer = MaterialSerializer(material, context={'request': request})
        
        return Response({
            'status': 'success',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Material.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Material not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error viewing material: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to view material: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_material_file(request, material_id):
    """
    Serve material file with proper headers for browser viewing
    """
    try:
        from django.http import FileResponse
        import mimetypes
        
        material = Material.objects.get(id=material_id, status='ACTIVE')
        
        # Verify student has access
        user = request.user
        email = user.email or user.username
        student = Student.objects.filter(email=email).first()
        
        if not student or student.lsc_code != material.lsc_code:
            return Response({
                'status': 'error',
                'message': 'Access denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Serve file with proper headers
        file_path = material.file.path
        content_type, _ = mimetypes.guess_type(file_path)
        
        response = FileResponse(open(file_path, 'rb'), content_type=content_type or 'application/octet-stream')
        response['Content-Disposition'] = 'inline; filename="{}"'.format(material.file.name.split('/')[-1])
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['Access-Control-Allow-Origin'] = '*'
        
        return response
        
    except Material.DoesNotExist:
        return Response({'status': 'error', 'message': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error serving material file: {str(e)}", exc_info=True)
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_material(request):
    """
    Upload study material (LSC Admin only)
    """
    try:
        # Get user info - could be LSCAdmin or User
        user = request.user
        
        serializer = MaterialUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine uploader name based on user type
        from lsc_auth.models import LSCAdmin
        if isinstance(user, LSCAdmin):
            uploader_name = user.admin_name or user.lsc_code
        else:
            uploader_name = user.username if hasattr(user, 'username') else 'Unknown'
        
        # Save the material - don't assign uploaded_by for LSCAdmin
        material = serializer.save(
            uploaded_by=None,  # LSCAdmin is not a User instance
            uploaded_by_name=uploader_name,
            file_size=request.FILES['file'].size
        )
        
        # Return the created material
        response_serializer = MaterialSerializer(material, context={'request': request})
        
        return Response({
            'status': 'success',
            'message': 'Material uploaded successfully',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error uploading material: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to upload material: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lsc_materials(request):
    """
    Get all materials uploaded by LSC admin
    For LSC admin dashboard
    """
    try:
        user = request.user
        
        # Get LSC code from user (LSCAdmin or User)
        from lsc_auth.models import LSCAdmin
        if isinstance(user, LSCAdmin):
            lsc_code = user.lsc_code
        else:
            # For regular users, try to get from profile
            lsc_code = getattr(user, 'lsc_code', None)
        
        if not lsc_code:
            return Response({
                'status': 'error',
                'message': 'LSC code not found for user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get materials for this LSC code
        materials = Material.objects.filter(
            lsc_code=lsc_code
        ).order_by('-upload_date')
        
        serializer = MaterialSerializer(materials, many=True, context={'request': request})
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'count': materials.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching LSC materials: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to fetch materials: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_material(request, material_id):
    """
    Update material details (LSC Admin only)
    """
    try:
        # Get user's LSC code
        user = request.user
        from lsc_auth.models import LSCAdmin
        if isinstance(user, LSCAdmin):
            lsc_code = user.lsc_code
        else:
            lsc_code = getattr(user, 'lsc_code', None)
        
        # Get material and verify ownership by LSC code
        material = Material.objects.get(id=material_id, lsc_code=lsc_code)
        
        # Update only allowed fields
        allowed_fields = ['title', 'description', 'subject', 'status']
        for field in allowed_fields:
            if field in request.data:
                setattr(material, field, request.data[field])
        
        material.save()
        
        serializer = MaterialSerializer(material, context={'request': request})
        
        return Response({
            'status': 'success',
            'message': 'Material updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Material.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Material not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating material: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to update material: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_material(request, material_id):
    """
    Delete material (LSC Admin only)
    """
    try:
        # Get user's LSC code
        user = request.user
        from lsc_auth.models import LSCAdmin
        if isinstance(user, LSCAdmin):
            lsc_code = user.lsc_code
        else:
            lsc_code = getattr(user, 'lsc_code', None)
        
        # Get material and verify ownership by LSC code
        material = Material.objects.get(id=material_id, lsc_code=lsc_code)
        
        # Delete the file from storage
        if material.file:
            default_storage.delete(material.file.name)
        
        # Delete the database record
        material.delete()
        
        return Response({
            'status': 'success',
            'message': 'Material deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Material.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Material not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting material: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Failed to delete material: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
