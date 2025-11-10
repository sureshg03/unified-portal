from typing import Any, Dict, Optional

from rest_framework.authentication import get_authorization_header
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings

from .models import LSCAdmin, LSCUser


class LSCJWTAuthentication(JWTAuthentication):
    """JWT authentication that can resolve LSCAdmin/LSCUser across databases."""

    def get_user(self, validated_token: Dict[str, Any]):
        database = validated_token.get("database")
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)

        if user_id is None:
            raise InvalidToken("Token contained no recognizable user identification")

        # Resolve user based on which database issued the token.
        if database == "online_edu":
            try:
                user = LSCAdmin.objects.using("online_edu").get(pk=user_id)
            except LSCAdmin.DoesNotExist as exc:
                raise AuthenticationFailed("Admin user not found", code="user_not_found") from exc
        elif database in {"default", "lsc_portal_db", None}:  # default to LSCUser for legacy tokens
            try:
                user = LSCUser.objects.using("default").get(pk=user_id)
            except LSCUser.DoesNotExist as exc:
                raise AuthenticationFailed("LSC user not found", code="user_not_found") from exc
        else:
            # Unknown database marker – fall back to default behaviour
            return super().get_user(validated_token)

        if not getattr(user, "is_active", False):
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        # Stash metadata for downstream code if needed
        user._user_type = validated_token.get("user_type", getattr(user, "_user_type", None))
        user._database = database or getattr(user, "_database", None)

        return user

    def authenticate(self, request):
        """Skip auth entirely if the request carries no Authorization header."""
        if not get_authorization_header(request):
            return None
        return super().authenticate(request)
