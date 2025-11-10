from rest_framework import serializers
from .models import Student, MarksheetUpload, StudentDetails


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
from .models import ApplicationPayment, AllCourses

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
        model = AllCourses
        fields = ['degree', 'application_fee']