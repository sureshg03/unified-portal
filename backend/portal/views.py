from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Sum, Avg
from .models import Program, Student, Attendance, AssignmentMark, Counsellor, ApplicationSettings, SystemSettings, NotificationSettings
from .serializers import (
    ProgramSerializer, StudentSerializer, AttendanceSerializer,
    AssignmentMarkSerializer, CounsellorSerializer, ApplicationSettingsSerializer,
    SystemSettingsSerializer, NotificationSettingsSerializer
)

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_program(self, request):
        program_id = request.query_params.get('program_id')
        if program_id:
            students = self.queryset.filter(program_id=program_id)
            serializer = self.get_serializer(students, many=True)
            return Response(serializer.data)
        return Response({"error": "program_id required"}, status=400)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

class AssignmentMarkViewSet(viewsets.ModelViewSet):
    queryset = AssignmentMark.objects.all()
    serializer_class = AssignmentMarkSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_program(self, request):
        program_id = request.query_params.get('program_id')
        if program_id:
            marks = self.queryset.filter(program_id=program_id)
            serializer = self.get_serializer(marks, many=True)
            return Response(serializer.data)
        return Response({"error": "program_id required"}, status=400)

class CounsellorViewSet(viewsets.ModelViewSet):
    queryset = Counsellor.objects.all()
    serializer_class = CounsellorSerializer
    permission_classes = [IsAuthenticated]

class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_applications = Student.objects.count()
        confirmed_admissions = Student.objects.filter(admission_status='Confirmed').count()
        pending_payments = Student.objects.filter(payment_status='Pending').count()
        total_revenue = Student.objects.filter(payment_status='Paid').count() * 1000  # Assuming ₹1000 per student

        data = {
            'total_applications': total_applications,
            'confirmed_admissions': confirmed_admissions,
            'pending_payments': pending_payments,
            'revenue_generated': total_revenue,
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def application_report(self, request):
        students = Student.objects.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unpaid_report(self, request):
        students = Student.objects.filter(payment_status='Pending')
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def confirmed_report(self, request):
        students = Student.objects.filter(admission_status='Confirmed')
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

class ApplicationSettingsViewSet(viewsets.ModelViewSet):
    queryset = ApplicationSettings.objects.all()
    serializer_class = ApplicationSettingsSerializer
    permission_classes = [AllowAny]  # Allow access for now

    def perform_create(self, serializer):
        # Set created_by from request user
        user = self.request.user
        created_by = getattr(user, 'lsc_code', None) or getattr(user, 'email', 'admin')
        serializer.save(created_by=str(created_by))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug print
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle admission session status between OPEN and CLOSED"""
        admission = self.get_object()
        
        if admission.status == 'OPEN':
            # Closing admission
            admission.status = 'CLOSED'
            admission.is_open = False
            admission.is_close = True
            message = 'Admission session closed successfully'
        elif admission.status == 'CLOSED':
            # Opening admission - check dates first
            from datetime import date
            today = date.today()
            if admission.opening_date and admission.opening_date > today:
                return Response(
                    {'error': 'Cannot open admission before opening date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if admission.closing_date and admission.closing_date < today:
                return Response(
                    {'error': 'Cannot open admission after closing date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Opening admission
            admission.status = 'OPEN'
            admission.is_open = True
            admission.is_close = False
            message = 'Admission session opened successfully'
        else:
            return Response(
                {'error': f'Cannot toggle status when current status is {admission.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admission.save()
        serializer = self.get_serializer(admission)
        return Response({
            'message': message,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def update_deadlines(self, request, pk=None):
        setting = self.get_object()
        opening_date = request.data.get('opening_date')
        closing_date = request.data.get('closing_date')

        if opening_date:
            setting.opening_date = opening_date
        if closing_date:
            setting.closing_date = closing_date

        setting.save()
        serializer = self.get_serializer(setting)
        return Response(serializer.data)

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        setting_type = request.query_params.get('type')
        if setting_type:
            settings = self.queryset.filter(setting_type=setting_type, is_active=True)
            serializer = self.get_serializer(settings, many=True)
            return Response(serializer.data)
        return Response({"error": "type parameter required"}, status=400)

class NotificationSettingsViewSet(viewsets.ModelViewSet):
    queryset = NotificationSettings.objects.all()
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        user = request.user
        data = request.data

        for notification_type in ['EMAIL', 'SMS', 'PUSH', 'SYSTEM']:
            settings, created = NotificationSettings.objects.get_or_create(
                user=user,
                notification_type=notification_type,
                defaults={
                    'is_enabled': data.get(f'{notification_type.lower()}_enabled', True),
                    'email_notifications': data.get('email_notifications', True),
                    'sms_notifications': data.get('sms_notifications', False),
                    'push_notifications': data.get('push_notifications', True),
                    'system_notifications': data.get('system_notifications', True),
                }
            )
            if not created:
                settings.is_enabled = data.get(f'{notification_type.lower()}_enabled', settings.is_enabled)
                settings.email_notifications = data.get('email_notifications', settings.email_notifications)
                settings.sms_notifications = data.get('sms_notifications', settings.sms_notifications)
                settings.push_notifications = data.get('push_notifications', settings.push_notifications)
                settings.system_notifications = data.get('system_notifications', settings.system_notifications)
                settings.save()

        return Response({"message": "Notification settings updated successfully"})