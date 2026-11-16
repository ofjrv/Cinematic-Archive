from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import CardForm


# 로그인 안 한 사람은 user 앱의 로그인 페이지('login')로 보냄
@login_required(login_url="login")
def card_create(request):
    if request.method == "POST":  # 폼을 제출했을 때
        form = CardForm(request.POST)
        if form.is_valid():
            card = form.save(commit=False)  # 아직 DB에 저장하지 않음
            card.user = request.user  # 작성자 = 로그인한 사람
            card.save()  # 이제 저장
            # TODO: 상세 페이지가 생기면 그쪽으로 이동하도록 변경
            return redirect("cards:card_create")
    else:  # 처음 페이지에 들어왔을 때
        form = CardForm()

    return render(request, "cards/b_card_create.html", {"form": form})
