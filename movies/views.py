import requests
from django.conf import settings
from django.shortcuts import render

# TMDB 영화 검색 API 주소
TMDB_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_DETAIL_URL = "https://api.themoviedb.org/3/movie"

# TMDB 장르 번호 한글 변환
GENRES = {
    28: "액션",
    12: "모험",
    16: "애니메이션",
    35: "코미디",
    80: "범죄",
    18: "드라마",
    14: "판타지",
    27: "공포",
    10402: "음악",
    9648: "미스터리",
    10749: "로맨스",
    878: "SF",
    53: "스릴러",
    10752: "전쟁",
}


# 영화 검색
def movie_search(request):
    query = request.GET.get("query", "").strip()

    movies = []
    error = ""

    if query:
        try:
            response = requests.get(
                TMDB_URL,
                headers={
                    "Authorization": f"Bearer {settings.TMDB_ACCESS_TOKEN}",
                    "accept": "application/json",
                },
                params={
                    "query": query,
                    "language": "ko-KR",
                    "include_adult": "false",
                },
                timeout=10,
            )

            response.raise_for_status()
            results = response.json().get("results", [])

            for movie in results:
                release_date = movie.get("release_date", "")
                genre_ids = movie.get("genre_ids", [])

                movies.append({
                    "id": movie.get("id"),
                    "title": movie.get("title", "제목 없음"),
                    "year": release_date[:4] if release_date else "개봉일 미정",
                    "genre": ", ".join(
                        GENRES[genre_id]
                        for genre_id in genre_ids
                        if genre_id in GENRES
                    ),
                    "poster_path": movie.get("poster_path"),
                    "overview": movie.get("overview", ""),
                })

        except requests.RequestException:
            error = "영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."

    return render(request, "search.html", {
        "query": query,
        "movies": movies,
        "error": error,
    })


# 영화 정보 조회
def movie_detail(request, movie_id):
    movie = None
    error = ""

    try:
        response = requests.get(
            f"{TMDB_DETAIL_URL}/{movie_id}",
            headers={
                "Authorization": f"Bearer {settings.TMDB_ACCESS_TOKEN}",
                "accept": "application/json",
            },
            params={"language": "ko-KR"},
            timeout=10,
        )

        response.raise_for_status()
        movie = response.json()

    except requests.RequestException as e:
        if e.response is not None and e.response.status_code == 404:
            error = "해당 영화를 찾을 수 없습니다."
        else:
            error = "영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."

    return render(request, "detail.html", {
        "movie": movie,
        "error": error,
    })
