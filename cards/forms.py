from django import forms
from .models import Card


class CardForm(forms.ModelForm):
    class Meta:
        model = Card
        # 사용자가 LP Editor에서 직접 입력하는 칸 (음악은 view에서 넣음)
        fields = [
            "title",
            "is_public",
            "cover_image",
            "front_template",
            "front_bg_color",
            "front_text_color",
            "memo",
            "back_bg_color",
            "back_text_color",
        ]
        # 색상 칸은 색 고르는 입력칸으로 보여 주기
        widgets = {
            "front_bg_color": forms.TextInput(attrs={"type": "color"}),
            "front_text_color": forms.TextInput(attrs={"type": "color"}),
            "back_bg_color": forms.TextInput(attrs={"type": "color"}),
            "back_text_color": forms.TextInput(attrs={"type": "color"}),
        }