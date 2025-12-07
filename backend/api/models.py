from django.db import models
from django.contrib.auth.models import User  # Import User
from django.contrib.auth.hashers import make_password, check_password



class Student(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=191, unique=True)
    phone = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)
    password = models.CharField(max_length=128)  # For hashed passwords
    
    # LSC Referral Information
    lsc_code = models.CharField(max_length=50, blank=True, null=True, help_text="LSC Center Code")
    lsc_name = models.CharField(max_length=200, blank=True, null=True, help_text="LSC Center Name")
    referral_date = models.DateTimeField(auto_now_add=True, null=True, blank=True, help_text="Date when student signed up via LSC")

    def __str__(self):
        return self.name

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

def get_academic_year():
    current_year = datetime.now().year
    return f"{current_year}-{current_year + 1}"


from django.db import models
from django.contrib.auth.models import User

class Application(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  
    email = models.EmailField(max_length=191, unique=True)
    
    # Application ID: PU/ODL/LC2101/A24/0001
    application_id = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="Format: PU/MODE/LSC_CODE/YEAR/NUMBER")
    
    # Page 1 fields
    mode_of_study = models.CharField(max_length=50, blank=True, null=True)
    programme_applied = models.CharField(max_length=50, blank=True, null=True)
    degree = models.CharField(max_length=100, blank=True, null=True)
    branch_name = models.CharField(max_length=100, blank=True, null=True)
    course = models.CharField(max_length=50, blank=True, null=True)
    medium = models.CharField(max_length=50, blank=True, null=True)
    academic_year = models.CharField(max_length=50, blank=True, null=True)
    # Page 2 fields 
    deb_id = models.CharField(max_length=100, blank=True, null=True)
    abc_id = models.CharField(max_length=100, blank=True, null=True)
    name_initial = models.CharField(max_length=100, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=[('Male', 'Male'), ('Female', 'Female'), ('Transgender', 'Transgender')], blank=True, null=True)
    aadhaar_no = models.CharField(max_length=12, blank=True, null=True)
    name_as_aadhaar = models.CharField(max_length=200, blank=True, null=True)
    parent_selected = models.BooleanField(default=True)
    guardian_selected = models.BooleanField(default=False)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    father_occupation = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True)
    mother_occupation = models.CharField(max_length=100, blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_occupation = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    religion = models.CharField(max_length=100, blank=True, null=True)
    community = models.CharField(max_length=100, blank=True, null=True)
    mother_tongue = models.CharField(max_length=100, blank=True, null=True)
    differently_abled = models.CharField(max_length=10, blank=True, null=True)
    disability_type = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    access_internet = models.CharField(max_length=100, blank=True, null=True)
    comm_pincode = models.CharField(max_length=10, blank=True, null=True)
    comm_district = models.CharField(max_length=100, blank=True, null=True)
    comm_state = models.CharField(max_length=100, blank=True, null=True)
    comm_country = models.CharField(max_length=100, blank=True, null=True)
    comm_town = models.CharField(max_length=100, blank=True, null=True)
    comm_area = models.CharField(max_length=10, choices=[('Rural', 'Rural'), ('Urban', 'Urban')], blank=True, null=True)
    same_as_comm = models.BooleanField(default=False)
    perm_pincode = models.CharField(max_length=10, blank=True, null=True)
    perm_district = models.CharField(max_length=100, blank=True, null=True)
    perm_state = models.CharField(max_length=100, blank=True, null=True)
    perm_country = models.CharField(max_length=100, blank=True, null=True)
    perm_town = models.CharField(max_length=100, blank=True, null=True)
    perm_area = models.CharField(max_length=10, choices=[('Rural', 'Rural'), ('Urban', 'Urban')], blank=True, null=True)

    payment_status = models.CharField(
        max_length=1,
        choices=[('N', 'Not Paid'), ('P', 'Paid')],
        default='N'
     )
    status = models.CharField(
        max_length=20,
        choices=[
            ('Draft', 'Draft'),
            ('In Progress', 'In Progress'),
            ('Completed', 'Completed'),
            ('Cancelled', 'Cancelled'),
        ],
        default='Draft'
    )
    is_active = models.BooleanField(default=True)
    
    # Document Validation & Verification fields
    document_validation = models.JSONField(blank=True, null=True, help_text="Stores document validation status")
    eligibility_status = models.CharField(max_length=50, blank=True, null=True, help_text="Eligibility status: Eligible, Not Eligible, Pending")
    eligibility_verified = models.BooleanField(default=False, help_text="Whether eligibility has been verified")
    verification_remarks = models.TextField(blank=True, null=True, help_text="Remarks for eligibility verification")
    admission_confirmed = models.BooleanField(default=False, help_text="Whether admission has been confirmed")
    rejection_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection if not confirmed")
    verified_date = models.DateTimeField(blank=True, null=True, help_text="Date when verification was completed")
    verified_by = models.CharField(max_length=255, blank=True, null=True, help_text="Name/ID of person who verified")
    enrollment_no = models.CharField(max_length=50, blank=True, null=True, help_text="Generated enrollment number (e.g., A25PBA21010001)")
    
    def __str__(self):
        return f"{self.user.email} - Application"

from django.db import models
from django.contrib.auth.models import User

class StudentDetails(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_details')
    email = models.EmailField(max_length=191)
    name_initial = models.CharField(max_length=255)
    qualifications = models.JSONField(default=list)
    semester_marks = models.JSONField(default=list)
    total_max_marks = models.FloatField(null=True, blank=True)
    total_obtained_marks = models.FloatField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    cgpa = models.CharField(max_length=10, null=True, blank=True)
    overall_grade = models.CharField(max_length=50, null=True, blank=True)
    class_obtained = models.CharField(max_length=50, null=True, blank=True)
    current_designation = models.CharField(max_length=255, null=True, blank=True)
    current_institute = models.CharField(max_length=255, null=True, blank=True)
    years_experience = models.FloatField(null=True, blank=True)
    annual_income = models.FloatField(null=True, blank=True)
    sslc_marksheet_url = models.CharField(max_length=500, null=True, blank=True)
    hsc_marksheet_url = models.CharField(max_length=500, null=True, blank=True)
    ug_marksheet_url = models.CharField(max_length=500, null=True, blank=True)
    semester_marksheet_url = models.CharField(max_length=500, null=True, blank=True)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    signature_url = models.CharField(max_length=500, null=True, blank=True)
    community_certificate_url = models.CharField(max_length=500, null=True, blank=True)
    aadhaar_url = models.CharField(max_length=500, null=True, blank=True)
    transfer_certificate_url = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        db_table = 'api_studentdetails'

    def __str__(self):
        return f"{self.email} - {self.name_initial}"
        
class MarksheetUpload(models.Model):
    student = models.ForeignKey(StudentDetails, on_delete=models.CASCADE, related_name='marksheet_uploads')
    email = models.EmailField(max_length=191)
    qualification_type = models.CharField(max_length=50)  
    file_url = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_marksheet_uploads'

    def __str__(self):
        return f"{self.email} - {self.qualification_type}"



from django.db import models
from django.contrib.auth.models import User

class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Allow null for existing data
    application_id = models.CharField(max_length=20, blank=True, null=True)
    user_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    transaction_id = models.CharField(max_length=50, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    course = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled'),
            ('created', 'Created'),
        ],
        default='created',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'  # Map to the 'payments' table

    def __str__(self):
        return f"{self.application_id} - {self.payment_status}"

class Courses(models.Model):
    id = models.AutoField(primary_key=True)
    course_short_code = models.CharField(max_length=50)
    course_full_name = models.CharField(max_length=200)
    branch_name = models.CharField(max_length=100)
    num_semesters = models.IntegerField()
    num_years = models.IntegerField()
    course_code = models.CharField(max_length=50)
    degree = models.CharField(max_length=100)
    application_fee = models.DecimalField(max_digits=10, decimal_places=2, default=236.00)
    language = models.CharField(max_length=50, blank=True, null=True)
    code2 = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'tbl_course'

    def __str__(self):
        return self.degree



# api/models.py
class ApplicationPayment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    application_id = models.CharField(max_length=20)
    user_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(max_length=191)
    phone = models.CharField(max_length=15, blank=True, null=True)
    transaction_id = models.CharField(max_length=1000, blank=True, null=True)
    bank_transaction_id = models.CharField(max_length=1000, blank=True, null=True)
    order_id = models.CharField(max_length=1000)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    course = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('TXN_SUCCESS', 'Success'),
            ('TXN_FAILURE', 'Failed'),
            ('PENDING', 'Pending'),
            ('CREATED', 'Created'),
        ],
        default='CREATED',
    )
    transaction_type = models.CharField(max_length=1000, blank=True, null=True)
    gateway_name = models.CharField(max_length=1000, blank=True, null=True)
    response_code = models.CharField(max_length=1000, blank=True, null=True)
    response_message = models.CharField(max_length=1000, blank=True, null=True)
    bank_name = models.CharField(max_length=1000, blank=True, null=True)
    payment_mode = models.CharField(max_length=1000, blank=True, null=True)
    refund_amount = models.CharField(max_length=1000, blank=True, null=True, default='0')
    mid = models.CharField(max_length=1000, blank=True, null=True)
    transaction_date = models.DateTimeField(blank=True, null=True)
    payment_type = models.CharField(max_length=45, blank=True, null=True)

    class Meta:
        db_table = 'feepayment'

    def __str__(self):
        return f"{self.application_id} - {self.payment_status}"


class SemesterPayment(models.Model):
    """Model for tracking semester-wise fee payments"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    application_id = models.CharField(max_length=100, blank=True, null=True)
    student_email = models.EmailField(max_length=191)
    student_name = models.CharField(max_length=200, blank=True, null=True)
    semester = models.CharField(max_length=20)  # e.g., "SEM - 1", "SEM - 2"
    semester_number = models.IntegerField()  # 1, 2, 3, 4, 5, 6
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=100, unique=True)
    receipt_number = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, default='Credit/Debit Card')
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('SUCCESS', 'Success'),
            ('FAILED', 'Failed'),
            ('REFUNDED', 'Refunded'),
        ],
        default='PENDING',
    )
    card_last_four = models.CharField(max_length=4, blank=True, null=True)
    payment_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'semester_payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['user', 'semester_number']),
            models.Index(fields=['student_email', 'payment_status']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f"{self.student_email} - {self.semester} - {self.payment_status}"

    @classmethod
    def has_paid_first_semester(cls, user):
        """Check if user has paid first semester fee"""
        return cls.objects.filter(
            user=user,
            semester_number=1,
            payment_status='SUCCESS'
        ).exists()

    @classmethod
    def get_paid_semesters(cls, user):
        """Get list of paid semester numbers for a user"""
        return list(cls.objects.filter(
            user=user,
            payment_status='SUCCESS'
        ).values_list('semester_number', flat=True))


class Material(models.Model):
    """Study materials uploaded by LSC Admin for students"""
    MATERIAL_TYPES = [
        ('PDF', 'PDF Document'),
        ('PPT', 'PowerPoint Presentation'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
    ]
    
    # Material Information
    title = models.CharField(max_length=255, help_text="Title of the material")
    description = models.TextField(blank=True, null=True, help_text="Description of the material")
    material_type = models.CharField(max_length=10, choices=MATERIAL_TYPES, default='PDF')
    file = models.FileField(upload_to='materials/%Y/%m/', max_length=500, help_text="Upload PDF or PPT file (Max 30MB)")
    file_size = models.IntegerField(help_text="File size in bytes")
    
    # Targeting Information
    programme = models.CharField(max_length=100, help_text="Target programme (e.g., BBA, MBA)")
    semester = models.IntegerField(help_text="Target semester (1-6)")
    subject = models.CharField(max_length=200, blank=True, null=True, help_text="Subject name")
    
    # LSC Information
    lsc_code = models.CharField(max_length=50, help_text="LSC Center Code")
    lsc_name = models.CharField(max_length=200, help_text="LSC Center Name")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_materials')
    uploaded_by_name = models.CharField(max_length=200, blank=True, null=True, help_text="Name of uploader")
    
    # Status and Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    views_count = models.IntegerField(default=0, help_text="Number of times viewed")
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'materials'
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['lsc_code', 'programme', 'semester']),
            models.Index(fields=['status', 'upload_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.programme} (Sem {self.semester})"
    
    def increment_views(self):
        """Increment the view count"""
        self.views_count += 1
        self.save(update_fields=['views_count'])