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

class GameSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Game
        fields = ['id', 'title', 'description', 'is_public', 'questions']




class CreateGameSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Game
        fields = ['title', 'description', 'is_public', 'questions']

    def validate_questions(self, questions):
        if not questions or len(questions) < 1:
            raise serializers.ValidationError("A game must have at least one question.")
        return questions

    def create(self, validated_data):
        # pop questions data, questions_data contains a list of dictionaries, where each index is a question formatted as a dicitonary
        questions_data = validated_data.pop('questions')
        # assuming user is logged in, the user data is retrieved from the JWT request header
        # this is done to ensure the logged in user is logged as owner of the game when created
        user = self.context['request'].user

        # Create game as an atomic transaction to avoid creating questions and choices without an parent game in case of failure/interruption
        with transaction.atomic():
            game = Game.objects.create(owner=user, **validated_data)

            for question in questions_data:
                # pop choices data, choices_data contains a list of dictionaries, where each index is a choice formatted as a dicitonary
                # eg. [{'choice_text': 'Obama', 'is_correct': True},{'choice_text': 'Washington', 'is_correct': False},{'choice_text': 'Rosevelt', 'is_correct': False}]
                choices_data = question.pop('choices')
                

                #  -- Validating Choices meet bounds --
                if (len(choices_data) < 2 or len(choices_data) > 4):
                    raise serializers.ValidationError("Question must only have between 2 and 4 choices.")

                # Count of ccorrect choices has to be 1 and only 1, raise error if not
                correct_count = 0
                for choice in choices_data:
                    if choice.get('is_correct'):
                        correct_count += 1
                if correct_count != 1:
                    raise serializers.ValidationError("Each question must have exactly one correct choice.")

                question = Question.objects.create(game=game, question_text=question['question_text'])

                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)

        return game
    


class GameUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['title', 'description', 'is_public']


class QuestionUpdateSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()

    class Meta:
        model = Question
        fields = ['id', 'question_text']


class ChoiceUpdateSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()

    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']
