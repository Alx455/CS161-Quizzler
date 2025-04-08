from django.db import models
from django.conf import settings    # To reference the CustomUser model
from django.core.validators import MinLengthValidator, MaxLengthValidator


class Game(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='games')
    title = models.CharField(max_length=255, validators=[MinLengthValidator(1), MaxLengthValidator(255)])
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Game {self.title}'



class Question(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField(max_length = 255, validators=[MinLengthValidator(1), MaxLengthValidator(50)])

    def __str__(self):
        return self.question_text



class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length = 255, validators=[MinLengthValidator(1), MaxLengthValidator(50)])
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.choice_text
