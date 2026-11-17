from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import CardForm
from .models import Card


# 로그인 안 한 사람은 user 앱의 로그인 페이지('login')로 보냄
@login_required(login_url="login")
def card_create(request):
    if request.method == "POST":  # 폼을 제출했을 때
        form = CardForm(request.POST)
        if form.is_valid():
            card = form.save(commit=False)  # 아직 DB에 저장하지 않음
            card.user = request.user  # 작성자 = 로그인한 사람
            card.save()  # 이제 저장
            return redirect("cards:card_detail", card_id=card.id)  # 방금 만든 카드의 상세 페이지로
    else:  # 처음 페이지에 들어왔을 때
        form = CardForm()

    return render(request, "cards/b_card_create.html", {"form": form})


@login_required(login_url="login")
def card_detail(request, card_id):
    # 카드 번호가 card_id이고, 작성자가 나인 카드만 찾음 (없으면 404)
    # TODO: 갤러리 공유 기능이 생기면 다른 사람도 볼 수 있게 조건 수정
    card = get_object_or_404(Card, id=card_id, user=request.user)
    return render(request, "cards/b_card_detail.html", {"card": card})
