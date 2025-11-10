from rest_framework import serializers
from .models import Program, Student, Attendance, AssignmentMark, Counsellor, ApplicationSettings, SystemSettings, NotificationSettings, ApplicationSettings, SystemSettings, NotificationSettings

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    counsellor_name = serializers.CharField(source='counsellor.counsellor_name', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    application_no = serializers.CharField(source='student.application_no', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'

class AssignmentMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = AssignmentMark
        fields = '__all__'

class CounsellorSerializer(serializers.ModelSerializer):
    programme_assigned_name = serializers.CharField(source='programme_assigned.name', read_only=True)

    class Meta:
        model = Counsellor
        fields = '__all__'

class ApplicationSettingsSerializer(serializers.ModelSerializer):
    is_currently_open = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    can_accept_applications = serializers.ReadOnlyField()

    class Meta:
        model = ApplicationSettings
        fields = '__all__'
        read_only_fields = ['current_applications', 'created_at', 'updated_at']

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'

class NotificationSettingsSerializer(serializers.ModelSerializer):
    user_lsc_number = serializers.CharField(source='user.lsc_number', read_only=True)

    class Meta:
        model = NotificationSettings
        fields = '__all__'