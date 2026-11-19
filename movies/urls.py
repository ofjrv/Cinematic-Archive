from django.urls import path
from . import views

app_name = "movies"

urlpatterns = [
    path("", views.movie_search, name="movie_search"),
    path("<int:movie_id>/", views.movie_detail, name="movie_detail"),
]