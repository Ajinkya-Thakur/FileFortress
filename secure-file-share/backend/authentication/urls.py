from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet

router = DefaultRouter()
router.register('', AuthViewSet, basename='auth')  # Empty prefix as we already have api/auth/

urlpatterns = [
    path('', include(router.urls)),
] 