from typing import Any, Dict, Optional

from rest_framework.authentication import get_authorization_header
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings

from .models import LSCAdmin, LSCUser


class LSCJWTAuthentication(JWTAuthentication):
    """JWT authentication that can resolve LSCAdmin/LSCUser across databases."""

    def get_user(self, validated_token: Dict[str, Any]):
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)

        if user_id is None:
            raise InvalidToken("Token contained no recognizable user identification")

        # Since we now use a unified database, check both LSCAdmin and LSCUser in the default database
        # First try LSCAdmin
        try:
            user = LSCAdmin.objects.get(pk=user_id)
            user._user_type = 'admin'
            user._database = 'default'
        except LSCAdmin.DoesNotExist:
            # If not found in LSCAdmin, try LSCUser
            try:
                user = LSCUser.objects.get(pk=user_id)
                user._user_type = 'user'
                user._database = 'default'
            except LSCUser.DoesNotExist as exc:
                raise AuthenticationFailed("User not found", code="user_not_found") from exc

        if not getattr(user, "is_active", False):
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        return user

    def authenticate(self, request):
        """Skip auth entirely if the request carries no Authorization header."""
        if not get_authorization_header(request):
            return None
        return super().authenticate(request)
