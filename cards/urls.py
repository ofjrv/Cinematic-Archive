from django.urls import path
from . import views

app_name = "cards"

urlpatterns = [
    path("new/", views.card_create, name="card_create"),
    path("<int:card_id>/", views.card_detail, name="card_detail"),
]
