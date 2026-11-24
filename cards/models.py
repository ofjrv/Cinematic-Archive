from django.db import models
from django.conf import settings


class Music(models.Model):
    music_title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    cover_url = models.URLField(max_length=500, blank=True)  # 앨범 커버 이미지 주소
    video_id = models.CharField(max_length=20, blank=True)   # 유튜브 영상 번호 (재생용)
    is_square = models.BooleanField(default=False)  # True: 앨범 커버형(정사각형), False: 뮤비형(16:9)

    def __str__(self):
        return f"{self.music_title} - {self.artist}"

class Card(models.Model):
    # 앞면 템플릿 선택지 (LP 모델과 같은 값)
    class TemplateChoices(models.TextChoices):
        MINIMAL = "minimal", "Minimal"
        CLASSIC = "classic", "Classic"
        BOLD = "bold", "Bold"

    # 작성자 (User 1 : N Card)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    # 음악 (Music 1 : N Card)
    music = models.ForeignKey(
        Music,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    # ---- LP 앞면 ----
    title = models.CharField(max_length=120, default="Untitled LP")
    cover_image = models.ImageField(upload_to="cards/covers/", blank=True)  # 직접 올린 표지 (없으면 음악 썸네일 사용)
    front_template = models.CharField(
        max_length=30,
        choices=TemplateChoices.choices,
        default=TemplateChoices.MINIMAL,
    )
    front_bg_color = models.CharField(max_length=20, default="#d9d9d9")
    front_text_color = models.CharField(max_length=20, default="#111111")

    # ---- LP 뒷면 ----
    memo = models.TextField(blank=True)  # YOUR MEMORY
    back_bg_color = models.CharField(max_length=20, default="#6e6e6e")
    back_text_color = models.CharField(max_length=20, default="#ffffff")

    # ---- 갤러리 ----
    is_public = models.BooleanField(default=True)       # True: 친구에게 보임
    order = models.PositiveIntegerField(default=0)      # 갤러리 순서

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]  # 순서대로, 같으면 최신순

    def __str__(self):
        return f"{self.user} - {self.title}"