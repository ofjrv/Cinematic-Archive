import html
import requests
from io import BytesIO
from PIL import Image, ImageStat
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import CardForm
from .models import Card, Music

# 유튜브 영상 검색 API 주소
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


# 유튜브에서 검색어로 음악 영상을 찾아 목록으로 돌려줌
def search_youtube(q):
    response = requests.get(
        YOUTUBE_SEARCH_URL,
        params={
            "part": "snippet",          # 제목, 채널, 썸네일 정보 받기
            "q": q,                     # 검색어
            "type": "video",            # 영상만 (채널, 재생목록 제외)
            "videoCategoryId": "10",    # 10 = 음악 카테고리
            "maxResults": 5,            # 5개만
            "key": settings.YOUTUBE_API_KEY,
        },
        timeout=10,
    )
    # API 요청 실패시 예외 발생
    response.raise_for_status()

    videos = []
    for item in response.json().get("items", []):
        snippet = item["snippet"]
        videos.append({
            "video_id": item["id"]["videoId"],
            "title": html.unescape(snippet["title"]),           # &amp; 같은 글자를 & 로 바꿈
            "channel": html.unescape(snippet["channelTitle"]),
            "thumbnail": snippet["thumbnails"]["medium"]["url"],
        })
    return videos


# 고화질 썸네일(1280x720)이 있으면 그 주소를, 없으면 원래 주소를 돌려줌
def best_thumbnail(video_id, fallback_url):
    url = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:  # 고화질 썸네일이 있는 영상
            return url
    except requests.RequestException:
        pass
    return fallback_url  # 없으면 검색 결과의 기본 썸네일(320x180)


# 앨범 커버만 띄워 놓은 영상(양옆이 단색 띠)이면 True
def is_square_thumbnail(thumbnail_url, channel=""):
    # 유튜브 자동 음악 채널(○○ - Topic)은 거의 다 앨범 커버형
    if channel.endswith(" - Topic"):
        return True

    try:
        response = requests.get(thumbnail_url, timeout=10)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("L")  # 밝기만 보려고 흑백으로
    except (requests.RequestException, OSError):
        return False  # 검사에 실패하면 그냥 16:9로

    width, height = image.size
    side = width // 8  # 양옆 끝 1/8 부분만 검사 (320px이면 40px)

    left = image.crop((0, 0, side, height))               # 왼쪽 끝
    right = image.crop((width - side, 0, width, height))  # 오른쪽 끝

    # 표준편차: 색이 얼마나 들쭉날쭉한지 (0에 가까울수록 한 가지 색)
    left_spread = ImageStat.Stat(left).stddev[0]
    right_spread = ImageStat.Stat(right).stddev[0]

    return left_spread < 10 and right_spread < 10


# 로그인 안 한 사람은 user 앱의 로그인 페이지('login')로 보냄
@login_required(login_url="login")
def card_create(request):
    q = request.GET.get("q", "").strip()
    videos = []
    error = ""

    if request.method == "POST":  # 폼을 제출했을 때
        form = CardForm(request.POST)
        video_id = request.POST.get("video_id", "")  # 라디오 버튼으로 고른 영상 번호

        if not video_id:
            error = "음악을 먼저 골라 주세요."
        elif form.is_valid():
            # 같은 영상이 이미 저장돼 있으면 그걸 쓰고, 없으면 새로 저장
            music, created = Music.objects.get_or_create(
                video_id=video_id,
                defaults={
                    "music_title": request.POST.get(f"title_{video_id}", "제목 없음"),
                    "artist": request.POST.get(f"channel_{video_id}", ""),
                    "cover_url": request.POST.get(f"thumbnail_{video_id}", ""),
                },
            )
            if created:  # 처음 저장하는 음악일 때만 고화질 썸네일 찾기 + 모양 검사
                music.cover_url = best_thumbnail(music.video_id, music.cover_url)
                music.is_square = is_square_thumbnail(music.cover_url, music.artist)
                music.save()
            card = form.save(commit=False)  # 아직 DB에 저장하지 않음
            card.user = request.user        # 작성자 = 로그인한 사람
            card.music = music              # 고른 음악 연결
            card.save()
            return redirect("cards:card_detail", card_id=card.id)
    else:
        form = CardForm()
        if q:  # 검색어가 있을 때만 유튜브 검색
            try:
                videos = search_youtube(q)
            except requests.RequestException:
                # 네트워크 오류, 하루 검색 횟수 초과 등
                error = "음악을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."

    return render(request, "cards/b_card_create.html", {
        "form": form,
        "q": q,
        "videos": videos,
        "error": error,
    })


@login_required(login_url="login")
def card_detail(request, card_id):
    # 카드 번호가 card_id이고, 작성자가 나인 카드만 찾음 (없으면 404)
    # TODO: 갤러리 공유 기능이 생기면 다른 사람도 볼 수 있게 조건 수정
    card = get_object_or_404(Card, id=card_id, user=request.user)
    return render(request, "cards/b_card_detail.html", {"card": card})
