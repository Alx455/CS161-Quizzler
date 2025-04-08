from rest_framework import serializers
from .models import Game, Question, Choice
from django.db import transaction


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['choice_text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ['question_text', 'choices']


class CreateGameSerializer(serializers.ModelSerializer):
    