from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

urlpatterns = [
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('register/', views.RegisterView.as_view(), name='register'),
    path('user/', views.UserProfileView.as_view(), name='user-profile'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]