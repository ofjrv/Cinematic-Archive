from django.urls import path
from . import views

app_name = "cards"

urlpatterns = [
    path("new/", views.card_create, name="card_create"),
]
