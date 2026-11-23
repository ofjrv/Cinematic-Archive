import uuid

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .models import GalleryShareLink, LP


def _build_share_url(request, share_link):
    if not share_link.is_active:
        return ""
    share_path = reverse("gallery:shared_gallery", kwargs={"token": share_link.token})
    return request.build_absolute_uri(share_path)


@login_required
def my_gallery(request):
    lps = LP.objects.filter(user=request.user)
    share_link, _ = GalleryShareLink.objects.get_or_create(user=request.user)

    context = {
        "lps": lps,
        "share_link": share_link,
        "share_url": _build_share_url(request, share_link),
    }
    return render(request, "b_mygallery.html", context)


@login_required
@require_POST
def update_lp_order(request):
    order_ids = request.POST.getlist("order[]") or request.POST.getlist("lp_ids")
    for idx, lp_id in enumerate(order_ids):
        LP.objects.filter(id=lp_id, user=request.user).update(order=idx)
    return JsonResponse({"status": "ok"})


@login_required
@require_POST
def regenerate_share_link(request):
    share_link, _ = GalleryShareLink.objects.get_or_create(user=request.user)
    action = request.POST.get("action", "rotate")
    if action == "toggle":
        share_link.is_active = not share_link.is_active
    else:
        share_link.token = uuid.uuid4()
        share_link.is_active = True
    share_link.save()
    return redirect("gallery:my_gallery")


def shared_gallery(request, token):
    share_link = get_object_or_404(
        GalleryShareLink.objects.select_related("user"),
        token=token,
        is_active=True,
    )
    lps = LP.objects.filter(user=share_link.user, is_public=True)

    context = {
        "owner": share_link.user,
        "lps": lps,
        "share_link": share_link,
    }
    return render(request, "b_sheargallery.html", context)