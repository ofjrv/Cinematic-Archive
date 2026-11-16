from django.shortcuts import render


# 임시 영화 데이터
MOVIES = [
    {
        "title": "기생충",
        "year": 2019,
        "genre": "드라마, 스릴러",
        "color": "poster-1"
    },
    {
        "title": "인터스텔라",
        "year": 2014,
        "genre": "SF, 드라마",
        "color": "poster-2"
    },
    {
        "title": "라라랜드",
        "year": 2016,
        "genre": "로맨스, 음악",
        "color": "poster-3"
    },
    {
        "title": "인셉션",
        "year": 2010,
        "genre": "SF, 액션",
        "color": "poster-4"
    },
    {
        "title": "너의 이름은",
        "year": 2016,
        "genre": "애니메이션, 로맨스",
        "color": "poster-5"
    },
]


def movie_search(request):
    query = request.GET.get("query", "").strip()

    if query:
        movies = [
            movie for movie in MOVIES
            if query.casefold() in movie["title"].casefold()
        ]
    else:
        movies = MOVIES

    return render(request, "movies/search.html", {
        "query": query,
        "movies": movies,
    })