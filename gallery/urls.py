from django.urls import path
from . import views

app_name = "gallery"

urlpatterns = [
    path("my/", views.my_gallery, name="my_gallery"),
    path("order/", views.update_lp_order, name="update_lp_order"),
    path("share/manage/", views.regenerate_share_link, name="regenerate_share_link"),
    path("share/<uuid:token>/", views.shared_gallery, name="shared_gallery"),
]