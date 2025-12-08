from rest_framework import serializers
from .models import Student, MarksheetUpload, StudentDetails, SemesterPayment


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['name', 'email', 'phone', 'is_verified']  # Exclude 'password' and 'user'

from .models import Application

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'


class MarksheetUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarksheetUpload
        fields = ['qualification_type', 'file_url', 'uploaded_at']


class StudentDetailsSerializer(serializers.ModelSerializer):
    def validate_semester_marks(self, value):
        if not value:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError("semester_marks must be a list")
        for idx, semester in enumerate(value):
            if not isinstance(semester, dict):
                raise serializers.ValidationError(f"semester_marks[{idx}] must be an object")
            if "semester" not in semester or not semester["semester"]:
                raise serializers.ValidationError(f"semester_marks[{idx}].semester is required and cannot be empty")
            if "subjects" not in semester or not isinstance(semester["subjects"], list):
                raise serializers.ValidationError(f"semester_marks[{idx}].subjects must be a list")
            for sub_idx, subject in enumerate(semester["subjects"]):
                if not isinstance(subject, dict):
                    raise serializers.ValidationError(f"semester_marks[{idx}].subjects[{sub_idx}] must be an object")
                required_fields = ["subject_name", "category", "max_marks", "obtained_marks", "month_year"]
                for field in required_fields:
                    if field not in subject or subject[field] == "":
                        raise serializers.ValidationError(
                            f"semester_marks[{idx}].subjects[{sub_idx}].{field} is required and cannot be empty"
                        )
                try:
                    max_marks = float(subject["max_marks"])
                    obtained_marks = float(subject["obtained_marks"])
                    if max_marks <= 0:
                        raise serializers.ValidationError(
                            f"semester_marks[{idx}].subjects[{sub_idx}].max_marks must be positive"
                        )
                    if obtained_marks < 0 or obtained_marks > max_marks:
                        raise serializers.ValidationError(
                            f"semester_marks[{idx}].subjects[{sub_idx}].obtained_marks must be between 0 and max_marks"
                        )
                except (ValueError, TypeError):
                    raise serializers.ValidationError(
                        f"semester_marks[{idx}].subjects[{sub_idx}].max_marks and obtained_marks must be valid numbers"
                    )
        return value

    def validate_qualifications(self, value):
        if not value:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError("qualifications must be a list")
        courses = [qual.get('course') for qual in value if qual.get('course')]
        if 'S.S.L.C' not in courses:
            raise serializers.ValidationError("S.S.L.C (10th) qualification is mandatory")
        if 'HSC' not in courses:
            raise serializers.ValidationError("HSC (12th) qualification is mandatory")
        for idx, qual in enumerate(value):
            if not isinstance(qual, dict):
                raise serializers.ValidationError(f"qualifications[{idx}] must be an object")
            
            # Check if course is SSLC/HSC or UG
            course = qual.get('course', '')
            is_school = course in ['S.S.L.C', 'HSC']
            
            # Required fields vary based on course type
            required_fields = ["course", "institute_name", "subject_studied", "reg_no", "percentage", "month_year", "mode_of_study"]
            
            # board for SSLC/HSC, university for others
            if is_school:
                required_fields.append("board")
            else:
                required_fields.append("university")
            
            for field in required_fields:
                if field not in qual or qual[field] == "" or qual[field] is None:
                    raise serializers.ValidationError(f"qualifications[{idx}].{field} is required and cannot be empty for {course}")
            
            try:
                percentage = float(qual["percentage"])
                if percentage < 0 or percentage > 100:
                    raise serializers.ValidationError(
                        f"qualifications[{idx}].percentage must be between 0 and 100"
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"qualifications[{idx}].percentage must be a valid number")
            if not isinstance(qual.get("month_year", ""), str) or not qual["month_year"].strip():
                raise serializers.ValidationError(f"qualifications[{idx}].month_year is required and must be a string")
        return value

    def validate(self, data):
        # Ensure optional fields are set to None if empty
        optional_fields = ["current_designation", "current_institute", "cgpa", "overall_grade", "class_obtained", "photo_url", "signature_url", "community_certificate_url", "aadhaar_url", "transfer_certificate_url"]
        for field in optional_fields:
            if not data.get(field):
                data[field] = None

        # Validate numeric fields
        numeric_fields = ["years_experience", "annual_income", "total_max_marks", "total_obtained_marks", "percentage"]
        for field in numeric_fields:
            value = data.get(field)
            if value == "" or value is None:
                data[field] = None
            else:
                try:
                    data[field] = float(value)
                    if data[field] < 0:
                        raise ValueError("Value must be non-negative")
                except (ValueError, TypeError):
                    raise serializers.ValidationError({field: "Must be a valid non-negative number"})

        # Validate marksheet URLs based on qualifications
        if data.get("qualifications"):
            for qual in data["qualifications"]:
                course = qual.get("course")
                if course == "S.S.L.C" and not data.get("sslc_marksheet_url"):
                    raise serializers.ValidationError({"sslc_marksheet_url": "SSLC marksheet is required"})
                if course == "HSC" and not data.get("hsc_marksheet_url"):
                    raise serializers.ValidationError({"hsc_marksheet_url": "HSC marksheet is required"})
                if course not in ["S.S.L.C", "HSC"] and not data.get("ug_marksheet_url"):
                    raise serializers.ValidationError({"ug_marksheet_url": f"Marksheet for {course} is required"})

        # Validate semester marksheet
        if data.get("semester_marks") and len(data["semester_marks"]) > 0 and not data.get("semester_marksheet_url"):
            raise serializers.ValidationError({"semester_marksheet_url": "Semester marksheet is required when semester marks are provided"})
            
        return data

    class Meta:
        model = StudentDetails
        fields = '__all__'

from rest_framework import serializers
from .models import ApplicationPayment, Courses

class PaymentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationPayment
        fields = [
            'application_id', 'transaction_id', 'bank_transaction_id', 'order_id',
            'amount', 'course', 'payment_status', 'transaction_date', 'payment_type',
            'response_code', 'response_message', 'bank_name', 'payment_mode'
        ]

class CoursesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courses
        fields = ['degree', 'application_fee']

class AddCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courses
        fields = ['course_short_code', 'course_full_name', 'branch_name', 'num_semesters', 'num_years', 'course_code', 'degree', 'application_fee', 'language', 'code2']


class SemesterPaymentSerializer(serializers.ModelSerializer):
    """Serializer for semester payment records"""
    class Meta:
        model = SemesterPayment
        fields = [
            'id', 'application_id', 'student_email', 'student_name',
            'semester', 'semester_number', 'amount', 'transaction_id',
            'receipt_number', 'payment_method', 'payment_status',
            'card_last_four', 'payment_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


from .models import Material

class MaterialSerializer(serializers.ModelSerializer):
    """Serializer for study materials"""
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Material
        fields = [
            'id', 'title', 'description', 'material_type', 'file_url',
            'file_size', 'programme', 'semester', 'subject',
            'lsc_code', 'lsc_name', 'uploaded_by_name', 'status',
            'views_count', 'upload_date', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by_name', 'file_url', 'views_count', 'upload_date', 'updated_at']
    
    def get_uploaded_by_name(self, obj):
        # First check if uploaded_by_name field is set (for LSC Admins)
        if obj.uploaded_by_name:
            return obj.uploaded_by_name
        # Fallback to uploaded_by User if available
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return 'Unknown'
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MaterialUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading materials (LSC Admin)"""
    class Meta:
        model = Material
        fields = [
            'title', 'description', 'material_type', 'file',
            'programme', 'semester', 'subject', 'lsc_code', 'lsc_name'
        ]
    
    def validate_file(self, value):
        # Validate file size (max 30MB)
        max_size = 30 * 1024 * 1024  # 30MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(f"File size exceeds 30MB limit. Current size: {value.size / (1024*1024):.2f}MB")
        
        # Validate file type
        allowed_extensions = ['pdf', 'ppt', 'pptx']
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError("Only PDF and PPT/PPTX files are allowed")
        
        return value
    
    def validate_semester(self, value):
        if value < 1 or value > 6:
            raise serializers.ValidationError("Semester must be between 1 and 6")
        return value


from .models import Feedback

class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for student feedback"""
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'student_name', 'student_email', 'lsc_code',
            'category', 'rating', 'title', 'message',
            'status', 'is_flagged', 'admin_notes', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'is_flagged', 'admin_notes', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Feedback message must be at least 10 characters long")
        return value


class FeedbackAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin feedback management"""
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']