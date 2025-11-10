from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password

class LSCUserManager(BaseUserManager):
    def create_user(self, lsc_number, password=None, **extra_fields):
        if not lsc_number:
            raise ValueError('The LSC Number must be set')
        user = self.model(lsc_number=lsc_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, lsc_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(lsc_number, password, **extra_fields)

class LSCUser(AbstractBaseUser):
    """
    Model for LSC center users stored in lsc_portal_db database
    This is for regular LSC center staff/users (not admins)
    Database: lsc_portal_db (default)
    """
    lsc_number = models.CharField(max_length=10, unique=True)
    lsc_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    mobile = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = LSCUserManager()

    USERNAME_FIELD = 'lsc_number'
    REQUIRED_FIELDS = ['lsc_name', 'email']

    class Meta:
        db_table = 'lsc_auth_lscuser'  # Explicit table name
        permissions = [
            ("can_view_student_data", "Can view student data"),
            ("can_edit_student_data", "Can edit student data"),
        ]

    def __str__(self):
        return self.lsc_number


class LSCAdmin(models.Model):
    """
    Model mapping to existing lsc_admins table in online_edu database
    This table contains LSC codes and passwords for ADMIN and LSC Center authentication
    Database: online_edu
    """
    id = models.AutoField(primary_key=True, db_column='id')
    lsc_code = models.CharField(max_length=50, unique=True, db_column='lsc_code')
    center_name = models.CharField(max_length=200, db_column='center_name')
    admin_email = models.EmailField(max_length=254, db_column='admin_email')
    admin_password = models.CharField(max_length=256, db_column='admin_password')
    admin_name = models.CharField(max_length=100, db_column='admin_name')
    mobile = models.CharField(max_length=15, db_column='mobile')
    address = models.TextField(db_column='address')
    district = models.CharField(max_length=100, db_column='district')
    state = models.CharField(max_length=100, db_column='state')
    pincode = models.CharField(max_length=10, db_column='pincode')
    is_active = models.BooleanField(default=True, db_column='is_active')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    updated_at = models.DateTimeField(auto_now=True, db_column='updated_at')
    created_by = models.CharField(max_length=254, db_column='created_by')

    class Meta:
        db_table = 'lsc_admins'  # Map to existing table
        managed = False  # Don't let Django manage this table's schema
        app_label = 'lsc_auth'
    
    # Specify which database to use for this model
    @classmethod
    def _get_database(cls):
        return 'online_edu'

    def __str__(self):
        return f"{self.lsc_code} - {self.center_name}"

    def check_password(self, raw_password):
        """
        Check if the provided password matches
        Supports Django hashed passwords (pbkdf2_sha256, bcrypt, argon2)
        """
        # If password starts with standard Django hash prefixes, check as hashed
        if self.admin_password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            from django.contrib.auth.hashers import check_password
            return check_password(raw_password, self.admin_password)
        # Otherwise, compare as plain text (for migration/testing only)
        return self.admin_password == raw_password

    def set_password(self, raw_password):
        """Set password with Django's hashing"""
        self.admin_password = make_password(raw_password)

    @property
    def is_authenticated(self):
        """Always return True for authenticated users"""
        return True

    @property
    def is_anonymous(self):
        """Always return False"""
        return False
    
    @property
    def lsc_name(self):
        """Alias for center_name for compatibility"""
        return self.center_name
    
    @property
    def email(self):
        """Alias for admin_email for compatibility"""
        return self.admin_email
    
    @property
    def is_admin(self):
        """Check if this is the main admin (LC2101-CDOE)"""
        return self.lsc_code == 'LC2101' or 'CDOE' in self.center_name.upper()