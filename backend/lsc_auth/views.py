from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from .models import LSCUser, LSCAdmin
from django.core.exceptions import ValidationError
import re
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class LSCUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = LSCUser
        fields = [
            'id', 'lsc_number', 'lsc_name', 'email', 'mobile', 'address',
            'is_active', 'is_staff', 'date_joined', 'password'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def validate_lsc_number(self, value):
        """Check if LSC number already exists"""
        if self.instance is None:  # Creating new instance
            if LSCUser.objects.filter(lsc_number=value).exists():
                raise serializers.ValidationError(f"LSC Center with code '{value}' already exists.")
        else:  # Updating existing instance
            if LSCUser.objects.filter(lsc_number=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(f"LSC Center with code '{value}' already exists.")
        return value
    
    def validate_email(self, value):
        """Check if email already exists"""
        if self.instance is None:  # Creating new instance
            if LSCUser.objects.filter(email=value).exists():
                raise serializers.ValidationError(f"LSC Center with email '{value}' already exists.")
        else:  # Updating existing instance
            if LSCUser.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(f"LSC Center with email '{value}' already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = LSCUser(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class LSCLoginSerializer(serializers.Serializer):
    lscNumber = serializers.CharField(required=False)
    lsc_number = serializers.CharField(required=False)
    lsc_code = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Extract the LSC code from any of the possible field names
        lsc_code = None
        if attrs.get('lscNumber'):
            lsc_code = attrs['lscNumber']
        elif attrs.get('lsc_number'):
            lsc_code = attrs['lsc_number']
        elif attrs.get('lsc_code'):
            lsc_code = attrs['lsc_code']
        elif attrs.get('username'):
            lsc_code = attrs['username']

        if not lsc_code:
            raise serializers.ValidationError({
                'lsc_number': 'LSC Code is required.'
            })

        password = attrs.get('password')
        if not password:
            raise serializers.ValidationError({
                'password': 'Password is required.'
            })

        # Authenticate using LSCAdminAuthBackend
        from django.contrib.auth import authenticate
        user = authenticate(
            self.context.get('request'),
            lsc_code=lsc_code,
            password=password
        )

        if not user:
            raise serializers.ValidationError({
                'detail': 'Invalid LSC Code or Password. Please check your credentials and try again.'
            })

        # Check if LSCAdmin (from lsc_admins table)
        if isinstance(user, LSCAdmin):
            if not user.is_active:
                raise serializers.ValidationError({
                    'detail': 'This account has been deactivated. Please contact the administrator.'
                })
        # Check if LSCUser (Django custom user)
        elif hasattr(user, 'is_active') and not user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account has been deactivated. Please contact the administrator.'
            })

        attrs['user'] = user
        attrs['lsc_code'] = lsc_code
        return attrs

class LSCLoginView(APIView):
    """
    Secure Login View with JWT Authentication
    Supports both LSC Admin (online_edu) and LSC User (lsc_portal_db) authentication
    """
    permission_classes = [AllowAny]
    throttle_scope = 'login'  # Rate limiting

    def post(self, request):
        serializer = LSCLoginSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response({
                'detail': 'Invalid credentials provided.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        lsc_code = serializer.validated_data['lsc_code']
        
        # Check if user is active
        if not getattr(user, 'is_active', True):
            return Response({
                'detail': 'Account is deactivated. Please contact administrator.',
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Generate JWT tokens
            # For LSCAdmin (from online_edu.lsc_admins)
            if isinstance(user, LSCAdmin):
                # Create custom token for LSCAdmin
                refresh = RefreshToken()
                refresh['user_id'] = user.id
                refresh['lsc_code'] = user.lsc_code
                refresh['lsc_name'] = user.lsc_name or user.center_name
                refresh['is_admin'] = user.is_admin
                refresh['email'] = user.email or ''
                refresh['user_type'] = 'admin'  # Mark as admin
                refresh['database'] = 'online_edu'
                refresh['iss'] = 'lsc-portal'  # Issuer claim
                
                # Log successful login (optional - add logging)
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Admin login successful: {user.lsc_code} - {user.admin_name}")
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'lsc_code': user.lsc_code,
                        'lsc_number': user.lsc_code,  # For frontend compatibility
                        'lsc_name': user.lsc_name or user.center_name,
                        'email': user.email or '',
                        'is_admin': user.is_admin,
                        'is_active': user.is_active,
                        'user_type': 'admin',  # Identify as admin/LSC center admin
                        'database': 'online_edu',
                        'center_name': user.center_name,
                        'mobile': user.mobile,
                        'admin_name': user.admin_name,
                    },
                    'message': f'Welcome {user.admin_name}! Logged in as LSC Admin.'
                }, status=status.HTTP_200_OK)
            
            # For LSCUser (from lsc_portal_db.lsc_auth_lscuser)
            elif isinstance(user, LSCUser):
                # Create custom token for LSCUser
                refresh = RefreshToken()
                refresh['user_id'] = user.id
                refresh['lsc_number'] = user.lsc_number
                refresh['lsc_name'] = user.lsc_name
                refresh['email'] = user.email
                refresh['user_type'] = 'user'
                refresh['database'] = 'default'
                refresh['iss'] = 'lsc-portal'  # Issuer claim
                
                # Log successful login (optional)
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"User login successful: {user.lsc_number} - {user.lsc_name}")
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'lsc_number': user.lsc_number,
                        'lsc_code': user.lsc_number,
                        'lsc_name': user.lsc_name,
                        'email': user.email,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                        'user_type': 'user',  # Identify as LSC center user
                        'database': 'lsc_portal_db',
                    },
                    'message': f'Welcome {user.lsc_name}! Logged in as LSC User.'
                }, status=status.HTTP_200_OK)
            
            else:
                # Unknown user type
                return Response({
                    'detail': 'Invalid user type. Authentication failed.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            # Log error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Login error for {lsc_code}: {str(e)}")
            
            return Response({
                'detail': 'Authentication failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LSCLogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

class ChangePasswordView(APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        old_password = request.data.get('oldPassword')
        new_password = request.data.get('newPassword')

        if not old_password or not new_password:
            return Response({'error': 'Old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate password strength
        if len(new_password) < 8 or not re.search(r'[A-Z]', new_password) or not re.search(r'[0-9]', new_password):
            return Response({'error': 'New password must be at least 8 characters long and include uppercase letters and numbers'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.check_password(old_password):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password changed successfully'})
        else:
            return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(APIView):
    """
    Custom token refresh view that works with our custom authentication
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'detail': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate and refresh the token
            from rest_framework_simplejwt.tokens import RefreshToken
            
            try:
                refresh = RefreshToken(refresh_token)
                
                # Get the new access token
                access_token = str(refresh.access_token)
                
                return Response({
                    'access': access_token,
                    'refresh': str(refresh)  # Optionally return new refresh token
                }, status=status.HTTP_200_OK)
                
            except Exception as token_error:
                return Response({
                    'detail': 'Invalid or expired refresh token.',
                    'code': 'token_not_valid'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Token refresh error: {str(e)}")
            
            return Response({
                'detail': 'Token refresh failed.'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LSCManagementView(APIView):
    """
    API endpoint for LSC Center management
    Provides CRUD operations for LSCUser model
    """
    
    def get(self, request):
        """List all LSC centers"""
        lsc_users = LSCUser.objects.all().order_by('lsc_number')
        serializer = LSCUserSerializer(lsc_users, many=True)
        return Response({
            'count': lsc_users.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new LSC center"""
        serializer = LSCUserSerializer(data=request.data)
        if serializer.is_valid():
            lsc_user = serializer.save()
            return Response({
                'message': f'LSC Center {lsc_user.lsc_name} created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'detail': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LSCManagementDetailView(APIView):
    """
    API endpoint for individual LSC center operations
    """
    
    def get(self, request, lsc_number):
        """Get LSC center details"""
        try:
            lsc_user = LSCUser.objects.get(lsc_number=lsc_number)
            serializer = LSCUserSerializer(lsc_user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except LSCUser.DoesNotExist:
            return Response({
                'detail': f'LSC Center with code {lsc_number} not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, lsc_number):
        """Update LSC center details"""
        try:
            lsc_user = LSCUser.objects.get(lsc_number=lsc_number)
            serializer = LSCUserSerializer(lsc_user, data=request.data, partial=True)
            if serializer.is_valid():
                updated_user = serializer.save()
                return Response({
                    'message': f'LSC Center {updated_user.lsc_name} updated successfully',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            return Response({
                'detail': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except LSCUser.DoesNotExist:
            return Response({
                'detail': f'LSC Center with code {lsc_number} not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, lsc_number):
        """Delete LSC center"""
        try:
            lsc_user = LSCUser.objects.get(lsc_number=lsc_number)
            lsc_name = lsc_user.lsc_name
            lsc_user.delete()
            return Response({
                'message': f'LSC Center {lsc_name} deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except LSCUser.DoesNotExist:
            return Response({
                'detail': f'LSC Center with code {lsc_number} not found'
            }, status=status.HTTP_404_NOT_FOUND)