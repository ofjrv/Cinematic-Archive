from django import forms
from .models import Card


class CardForm(forms.ModelForm):
    class Meta:
        model = Card
        fields = ["music", "memo"]  # 사용자가 직접 입력하는 칸만
