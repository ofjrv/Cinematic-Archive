from django.db import models


class Movie(models.Model):
    movie_id = models.IntegerField(primary_key=True)
    movie_title = models.CharField(max_length=200)
    poster_url = models.URLField(max_length=500)
    release_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.movie_title