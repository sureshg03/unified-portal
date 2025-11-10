from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdmissionSessionViewSet

router = DefaultRouter()
router.register(r'sessions', AdmissionSessionViewSet, basename='admission-session')

urlpatterns = [
    path('', include(router.urls)),
]
