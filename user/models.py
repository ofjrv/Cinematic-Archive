from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    name = models.CharField(max_length=50, blank=True, verbose_name="이름")
    
    google_email = models.EmailField(blank=True, null=True, verbose_name="구글 연동 이메일")
    kakao_connected = models.BooleanField(default=False, verbose_name="카카오 연동 여부")
    apple_connected = models.BooleanField(default=False, verbose_name="애플 연동 여부")

    def __str__(self):
        return self.username