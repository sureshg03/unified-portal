from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import date

from .models import AdmissionSession
from .serializers import AdmissionSessionSerializer, AdmissionSessionListSerializer


class AdmissionSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing admission sessions
    Provides CRUD operations and status management
    """
    queryset = AdmissionSession.objects.all()
    serializer_class = AdmissionSessionSerializer
    permission_classes = [AllowAny]  # Allow access for now, can be restricted later
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AdmissionSessionListSerializer
        return AdmissionSessionSerializer
    
    def get_queryset(self):
        queryset = AdmissionSession.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by year
        year_filter = self.request.query_params.get('year', None)
        if year_filter:
            queryset = queryset.filter(admission_year__contains=year_filter)
        
        # Filter by type
        type_filter = self.request.query_params.get('type', None)
        if type_filter:
            queryset = queryset.filter(admission_type=type_filter)
        
        # Only active
        active_only = self.request.query_params.get('active_only', None)
        if active_only == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        # Set created_by from request user
        user = self.request.user
        created_by = getattr(user, 'lsc_code', None) or getattr(user, 'email', 'admin')
        serializer.save(created_by=str(created_by))
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle admission session status between OPEN and CLOSED"""
        admission = self.get_object()
        
        if admission.status == 'OPEN':
            admission.status = 'CLOSED'
            message = 'Admission session closed successfully'
        elif admission.status == 'CLOSED':
            # Check if dates are valid
            today = date.today()
            if admission.opening_date > today:
                return Response(
                    {'error': 'Cannot open admission before opening date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if admission.closing_date < today:
                return Response(
                    {'error': 'Cannot open admission after closing date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            admission.status = 'OPEN'
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
    def update_dates(self, request, pk=None):
        """Update opening and closing dates"""
        admission = self.get_object()
        opening_date = request.data.get('opening_date')
        closing_date = request.data.get('closing_date')
        
        if opening_date:
            admission.opening_date = opening_date
        if closing_date:
            admission.closing_date = closing_date
        
        # Validate dates
        if admission.closing_date <= admission.opening_date:
            return Response(
                {'error': 'Closing date must be after opening date'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admission.save()
        serializer = self.get_serializer(admission)
        return Response({
            'message': 'Dates updated successfully',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate admission session"""
        admission = self.get_object()
        admission.is_active = False
        admission.status = 'CLOSED'
        admission.save()
        
        serializer = self.get_serializer(admission)
        return Response({
            'message': 'Admission session deactivated',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate admission session"""
        admission = self.get_object()
        admission.is_active = True
        admission.save()
        
        serializer = self.get_serializer(admission)
        return Response({
            'message': 'Admission session activated',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def active_sessions(self, request):
        """Get all currently active and open admission sessions"""
        today = date.today()
        active = AdmissionSession.objects.filter(
            status='OPEN',
            is_active=True,
            opening_date__lte=today,
            closing_date__gte=today
        )
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get admission statistics"""
        total = AdmissionSession.objects.count()
        open_count = AdmissionSession.objects.filter(status='OPEN').count()
        closed_count = AdmissionSession.objects.filter(status='CLOSED').count()
        scheduled_count = AdmissionSession.objects.filter(status='SCHEDULED').count()
        expired_count = AdmissionSession.objects.filter(status='EXPIRED').count()
        
        return Response({
            'total_sessions': total,
            'open': open_count,
            'closed': closed_count,
            'scheduled': scheduled_count,
            'expired': expired_count,
        })
