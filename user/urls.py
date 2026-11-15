from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('check-id/', views.check_id_view, name='check_id'),
    path('delete/', views.delete_account_view, name='delete_account'),
    path('social/connect/<str:provider>/', views.social_connect_view, name='social_connect'),      # <-- 추가
    path('social/disconnect/<str:provider>/', views.social_disconnect_view, name='social_disconnect'),
]