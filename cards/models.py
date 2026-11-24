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

    # 감상 메모
    memo = models.TextField(blank=True)

    # 완성된 카드 이미지 (나중에 만들어지므로 비워둘 수 있게)
    card_image = models.ImageField(upload_to="cards/", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.music}"