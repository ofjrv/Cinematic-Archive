from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse

User = get_user_model()

# 1. 회원가입
def signup_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        name = request.POST.get('name', '')
        email = request.POST.get('email', '')
        password = request.POST.get('password')
        password_confirm = request.POST.get('password_confirm')

        if password != password_confirm:
            messages.error(request, "비밀번호가 일치하지 않습니다.")
            return render(request, 'b_signup.html')

        if len(password) < 8:
            messages.error(request, "비밀번호는 8자 이상이어야 합니다.")
            return render(request, 'b_signup.html')

        if User.objects.filter(username=username).exists():
            messages.error(request, "이미 존재하는 아이디입니다.")
            return render(request, 'b_signup.html')

        # 커스텀 유저 생성 및 세션 로그인
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            name=name
        )
        login(request, user)
        return redirect('login')  # 로그인 후 My Account 화면으로 이동

    return render(request, 'b_signup.html')


# 2. 아이디 중복 확인 (CHECK 버튼용)
def check_id_view(request):
    username = request.GET.get('username', '')
    is_taken = User.objects.filter(username=username).exists()
    return JsonResponse({'is_taken': is_taken})


# 3. 로그인 (세션 처리)
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('login')  # 로그인 성공 상태 반영된 화면으로 이동
        else:
            messages.error(request, "아이디 또는 비밀번호가 올바르지 않습니다.")

    return render(request, 'b_login.html')


# 4. 로그아웃
def logout_view(request):
    logout(request)
    return redirect('login')


# 5. 회원 탈퇴 (시안 04번 모달 연동)
@login_required
def delete_account_view(request):
    if request.method == 'POST':
        confirm_text = request.POST.get('confirm_text')
        password = request.POST.get('password')

        if confirm_text == 'DELETE' and request.user.check_password(password):
            request.user.delete()
            logout(request)
            return redirect('signup')
        else:
            messages.error(request, "DELETE 문구 또는 비밀번호가 일치하지 않습니다.")
    return redirect('login')

# user/views.py에 추가

@login_required
def social_connect_view(request, provider):
    if provider == 'google':
        request.user.google_email = f"{request.user.username}@gmail.com"
    elif provider == 'kakao':
        request.user.kakao_connected = True
    elif provider == 'apple':
        request.user.apple_connected = True
    
    request.user.save()
    messages.success(request, f"{provider.capitalize()} 계정이 연결되었습니다.")
    return redirect('login')


@login_required
def social_disconnect_view(request, provider):
    if provider == 'google':
        request.user.google_email = None
    elif provider == 'kakao':
        request.user.kakao_connected = False
    elif provider == 'apple':
        request.user.apple_connected = False
    
    request.user.save()
    messages.success(request, f"{provider.capitalize()} 계정 연동이 해제되었습니다.")
    return redirect('login')