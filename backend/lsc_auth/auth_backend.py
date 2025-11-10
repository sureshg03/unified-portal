from django.contrib.auth.backends import ModelBackend
from .models import LSCUser, LSCAdmin
from django.utils import timezone

class LSCAuthBackend(ModelBackend):
    """
    Authentication backend for LSCUser model
    Checks lsc_auth_lscuser table in lsc_portal_db database
    Used for regular LSC center users
    """
    def authenticate(self, request, lsc_number=None, lsc_code=None, password=None, **kwargs):
        username = lsc_number or lsc_code
        
        if not username or not password:
            return None
            
        try:
            # Query from default database (lsc_portal_db)
            user = LSCUser.objects.using('default').get(lsc_number=username)
            if user.check_password(password) and user.is_active:
                return user
        except LSCUser.DoesNotExist:
            return None
        
        return None

    def get_user(self, user_id):
        try:
            return LSCUser.objects.using('default').get(pk=user_id)
        except LSCUser.DoesNotExist:
            return None


class LSCAdminAuthBackend:
    """
    Custom authentication backend for LSCAdmin model
    Authenticates against the lsc_admins table in online_edu database
    Used for ADMIN (LC2101-CDOE) and LSC Center Admins
    """
    
    def authenticate(self, request, lsc_code=None, lsc_number=None, password=None, **kwargs):
        # Support both lsc_code and lsc_number parameter names
        username = lsc_code or lsc_number
        
        if not username or not password:
            return None
        
        try:
            # Try to fetch the admin from lsc_admins table in online_edu database
            admin = LSCAdmin.objects.using('online_edu').get(lsc_code=username)
            
            # Check if account is active
            if not admin.is_active:
                return None
            
            # Verify password
            if admin.check_password(password):
                # Mark as admin user for better identification
                admin._user_type = 'admin'
                return admin
            
        except LSCAdmin.DoesNotExist:
            # If not found in lsc_admins, return None
            return None
        
        return None
    
    def get_user(self, user_id):
        try:
            return LSCAdmin.objects.using('online_edu').get(pk=user_id)
        except LSCAdmin.DoesNotExist:
            return None


class DualDatabaseAuthBackend:
    """
    Master authentication backend that checks BOTH databases
    1. First checks online_edu.lsc_admins (for admin/LSC center admins)
    2. Then checks lsc_portal_db.lsc_auth_lscuser (for LSC center users)
    """
    
    def authenticate(self, request, lsc_code=None, lsc_number=None, password=None, **kwargs):
        username = lsc_code or lsc_number
        
        if not username or not password:
            return None
        
        # Step 1: Try LSCAdmin authentication (online_edu database)
        try:
            admin = LSCAdmin.objects.using('online_edu').get(lsc_code=username)
            if admin.is_active and admin.check_password(password):
                admin._user_type = 'admin'
                admin._database = 'online_edu'
                return admin
        except LSCAdmin.DoesNotExist:
            pass  # Continue to next check
        
        # Step 2: Try LSCUser authentication (default database - lsc_portal_db)
        try:
            user = LSCUser.objects.using('default').get(lsc_number=username)
            if user.is_active and user.check_password(password):
                user._user_type = 'user'
                user._database = 'default'
                return user
        except LSCUser.DoesNotExist:
            pass  # No match found
        
        return None
    
    def get_user(self, user_id):
        # Try both databases
        # First try LSCAdmin
        try:
            admin = LSCAdmin.objects.using('online_edu').get(pk=user_id)
            admin._user_type = 'admin'
            return admin
        except LSCAdmin.DoesNotExist:
            pass
        
        # Then try LSCUser
        try:
            user = LSCUser.objects.using('default').get(pk=user_id)
            user._user_type = 'user'
            return user
        except LSCUser.DoesNotExist:
            pass
        
        return None