# api/semester_payment_views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from .models import SemesterPayment, Application, Student
from .serializers import SemesterPaymentSerializer
import random
import string


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_semester_payment(request):
    """
    Process semester fee payment (dummy payment gateway simulation)
    Expected payload:
    {
        "semester": "SEM - 1",
        "semester_number": 1,
        "amount": 20000,
        "card_number": "1234567890123456",
        "card_holder_name": "John Doe",
        "expiry_month": "12",
        "expiry_year": "25",
        "cvv": "123"
    }
    """
    try:
        user = request.user
        data = request.data
        
        # Validate required fields
        required_fields = ['semester', 'semester_number', 'amount', 'card_number', 'card_holder_name']
        for field in required_fields:
            if field not in data:
                return Response({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already paid
        existing_payment = SemesterPayment.objects.filter(
            user=user,
            semester_number=data['semester_number'],
            payment_status='SUCCESS'
        ).first()
        
        if existing_payment:
            return Response({
                'status': 'error',
                'message': f'{data["semester"]} fee already paid',
                'receipt_number': existing_payment.receipt_number
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simulate payment processing (90% success rate)
        payment_success = random.random() > 0.1
        
        if not payment_success:
            return Response({
                'status': 'error',
                'message': 'Payment failed. Please try again or use a different card.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get student details
        student_email = user.email
        student_name = user.username
        application_id = None
        
        try:
            application = Application.objects.filter(user=user).first()
            if application:
                application_id = application.application_id
                student_name = application.name_initial or user.username
        except Exception as e:
            logger.warning(f"Error getting application for user {user.email}: {e}")
            pass
        
        try:
            student = Student.objects.filter(email=user.email).first()
            if student:
                student_name = student.name
        except Exception as e:
            logger.warning(f"Error getting student for {user.email}: {e}")
            pass
        
        # Generate transaction details
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        transaction_id = f"TXN-{timestamp}-{random.choice(string.ascii_uppercase)}{random.choice(string.ascii_uppercase)}"
        receipt_number = f"PU-{timestamp[:14]}"
        
        # Get last 4 digits of card
        card_last_four = data['card_number'][-4:] if len(data['card_number']) >= 4 else None
        
        # Create payment record
        payment = SemesterPayment.objects.create(
            user=user,
            application_id=application_id,
            student_email=student_email,
            student_name=student_name,
            semester=data['semester'],
            semester_number=data['semester_number'],
            amount=data['amount'],
            transaction_id=transaction_id,
            receipt_number=receipt_number,
            payment_method='Credit/Debit Card',
            payment_status='SUCCESS',
            card_last_four=card_last_four,
            payment_date=timezone.now()
        )
        
        serializer = SemesterPaymentSerializer(payment)
        
        return Response({
            'status': 'success',
            'message': f'{data["semester"]} fee payment successful',
            'payment': serializer.data,
            'first_semester_paid': SemesterPayment.has_paid_first_semester(user)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_semester_payments(request):
    """Get all semester payment records for the logged-in user"""
    try:
        user = request.user
        payments = SemesterPayment.objects.filter(user=user)
        serializer = SemesterPaymentSerializer(payments, many=True)
        
        return Response({
            'status': 'success',
            'payments': serializer.data,
            'first_semester_paid': SemesterPayment.has_paid_first_semester(user),
            'paid_semesters': SemesterPayment.get_paid_semesters(user)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_status(request):
    """Get payment status for the logged-in user"""
    try:
        user = request.user
        
        first_semester_paid = SemesterPayment.has_paid_first_semester(user)
        paid_semesters = SemesterPayment.get_paid_semesters(user)
        
        return Response({
            'status': 'success',
            'first_semester_paid': first_semester_paid,
            'paid_semesters': paid_semesters,
            'total_paid': len(paid_semesters)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_receipt(request, semester_number):
    """Get payment receipt for a specific semester"""
    try:
        user = request.user
        
        payment = SemesterPayment.objects.filter(
            user=user,
            semester_number=semester_number,
            payment_status='SUCCESS'
        ).first()
        
        if not payment:
            return Response({
                'status': 'error',
                'message': f'No payment found for semester {semester_number}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SemesterPaymentSerializer(payment)
        
        return Response({
            'status': 'success',
            'receipt': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_semester_payment(request, semester_number):
    """Check if a specific semester fee has been paid"""
    try:
        user = request.user
        
        is_paid = SemesterPayment.objects.filter(
            user=user,
            semester_number=semester_number,
            payment_status='SUCCESS'
        ).exists()
        
        return Response({
            'status': 'success',
            'semester_number': semester_number,
            'is_paid': is_paid
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
