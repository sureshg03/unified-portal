from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)

class CustomTokenAuthentication(TokenAuthentication):
    """
    Custom token authentication that handles duplicate tokens gracefully.
    If multiple tokens exist for the same key, it uses the most recent one
    and deletes the older duplicates.
    """
    
    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            # Try normal get first
            token = model.objects.select_related('user').get(key=key)
        except model.MultipleObjectsReturned:
            logger.warning(f"Multiple tokens found for key. Cleaning up duplicates.")
            # Get all tokens with this key
            tokens = model.objects.select_related('user').filter(key=key).order_by('-created')
            
            if not tokens.exists():
                logger.error("No tokens found after filter")
                raise self.authentication_failed('Invalid token.')
            
            # Use the most recent token
            token = tokens.first()
            user = token.user
            
            # Delete older duplicate tokens
            duplicate_count = tokens.exclude(pk=token.pk).delete()[0]
            logger.info(f"Deleted {duplicate_count} duplicate tokens for user {user.username}")
            
        except model.DoesNotExist:
            raise self.authentication_failed('Invalid token.')

        if not token.user.is_active:
            raise self.authentication_failed('User inactive or deleted.')

        return (token.user, token)
    
    def authentication_failed(self, msg):
        from rest_framework import exceptions
        raise exceptions.AuthenticationFailed(msg)
