from django.db import models
from authentication.models import CustomUser
from games.models import Game
from datetime import timedelta
from django.utils import timezone

from django.core.validators import MinLengthValidator, MaxLengthValidator

def get_default_expiration():
    return timezone.now() + timedelta(hours=2)

class GameSession(models.Model):
    host = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    session_code = models.CharField(max_length=6, unique=True, validators=[MinLengthValidator(6), MaxLengthValidator(6)], db_collation='utf8mb4_bin')
    is_active = models.BooleanField(default=True)
    current_round = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=get_default_expiration)

class Player(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    username = models.CharField(max_length=50, validators=[MinLengthValidator(1), MaxLengthValidator(50)])
    score = models.IntegerField(default=0)
    shield_active = models.BooleanField(default=False)    

