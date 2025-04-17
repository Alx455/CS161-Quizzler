from django.urls import path
#path function for URL patterns
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
#import JSON webtoken authentification


from .views import RegisterView, LoginView
#import for hadling new user group and log in for custom serializer

#All routes Django will recognize
urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Registration api
    path('register/', RegisterView.as_view(), name='register'),
    # Login Api
    path('login/', LoginView.as_view(), name='login'),
]