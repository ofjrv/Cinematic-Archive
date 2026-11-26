from django.urls import path
from . import views

app_name = "cards"

urlpatterns = [
    path("new/", views.card_create, name="card_create"),
    path("<int:card_id>/", views.card_detail, name="card_detail"),
    path("<int:card_id>/edit/", views.card_update, name="card_update"),  # 수정
]
