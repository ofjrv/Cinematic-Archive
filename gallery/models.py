import uuid

from django.conf import settings
from django.db import models


class LP(models.Model):
    class TemplateChoices(models.TextChoices):
        MINIMAL = "minimal", "Minimal"
        CLASSIC = "classic", "Classic"
        BOLD = "bold", "Bold"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lps",
    )
    title = models.CharField(max_length=120)
    cover_image = models.ImageField(upload_to="lp_covers/", blank=True, null=True)
    front_template = models.CharField(
        max_length=30,
        choices=TemplateChoices.choices,
        default=TemplateChoices.MINIMAL,
    )
    front_bg_color = models.CharField(max_length=20, default="#d9d9d9")
    front_text_color = models.CharField(max_length=20, default="#111111")
    memory_text = models.TextField(blank=True)
    back_bg_color = models.CharField(max_length=20, default="#6e6e6e")
    back_text_color = models.CharField(max_length=20, default="#ffffff")
    is_public = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class GalleryShareLink(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gallery_share_link",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} ({self.token})"