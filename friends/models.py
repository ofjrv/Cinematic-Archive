from django.db import models
from django.conf import settings


class FriendRequest(models.Model):
    # 신청 보낸 사람
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_requests",
    )
    # 신청 받은 사람
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_requests",
    )
    is_accepted = models.BooleanField(default=False)  # False: 대기 중, True: 친구
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        state = "친구" if self.is_accepted else "대기 중"
        return f"{self.from_user} → {self.to_user} ({state})"