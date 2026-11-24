from django import forms
from .models import Card


class CardForm(forms.ModelForm):
    class Meta:
        model = Card
        fields = ["memo"]  # 음악은 유튜브 검색 결과에서 골라 view에서 넣음
