from rest_framework import serializers
from .models import AdmissionSession

class AdmissionSessionSerializer(serializers.ModelSerializer):
    is_open = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    can_accept_applications = serializers.ReadOnlyField()
    
    class Meta:
        model = AdmissionSession
        fields = [
            'id',
            'admission_code',
            'admission_type',
            'admission_year',
            'admission_key',
            'opening_date',
            'closing_date',
            'status',
            'description',
            'max_applications',
            'current_applications',
            'created_at',
            'updated_at',
            'created_by',
            'is_active',
            'is_open',
            'days_remaining',
            'can_accept_applications',
        ]
        read_only_fields = ['created_at', 'updated_at', 'current_applications']
    
    def validate(self, data):
        """Validate admission session data"""
        opening_date = data.get('opening_date')
        closing_date = data.get('closing_date')
        
        if opening_date and closing_date:
            if closing_date <= opening_date:
                raise serializers.ValidationError({
                    'closing_date': 'Closing date must be after opening date'
                })
        
        return data
    
    def validate_admission_code(self, value):
        """Validate admission code format"""
        if not value.isupper():
            raise serializers.ValidationError('Admission code must be in uppercase')
        return value


class AdmissionSessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    is_open = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    can_accept_applications = serializers.ReadOnlyField()
    
    class Meta:
        model = AdmissionSession
        fields = [
            'id',
            'admission_code',
            'admission_type',
            'admission_year',
            'opening_date',
            'closing_date',
            'status',
            'max_applications',
            'current_applications',
            'is_active',
            'is_open',
            'days_remaining',
            'can_accept_applications',
        ]
