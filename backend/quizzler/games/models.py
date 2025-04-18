from django.db import models
from django.conf import settings    # To reference the CustomUser model
from django.core.validators import MinLengthValidator, MaxLengthValidator

#base class, settings and boolean fields import

#table definition for storing metadata, owner and visibility
class Game(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='games')
    title = models.CharField(max_length=255, validators=[MinLengthValidator(1), MaxLengthValidator(255)])
    description = models.CharField(max_length=5000, blank=True, default='', validators=[MinLengthValidator(1), MaxLengthValidator(5000)])
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    #custom string for admin or debugging
    def __str__(self):
        return f'Game {self.title}'


    #individual question storage for game
class Question(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField(max_length = 255, validators=[MinLengthValidator(1), MaxLengthValidator(50)])

    #object is printed as question text
    def __str__(self):
        return self.question_text


#this is for the answer options for a question

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length = 255, validators=[MinLengthValidator(1), MaxLengthValidator(50)])
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.choice_text
    #choice text shown 
