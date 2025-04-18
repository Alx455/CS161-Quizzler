from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from .serializers import CreateGameSerializer, GameUpdateSerializer, QuestionUpdateSerializer, ChoiceUpdateSerializer
from .models import Game, Question, Choice

class CreateGameView(APIView):
    permission_classes = [IsAuthenticated] #only users that are logged in can access..

    def post(self, request):
      # 
        serializer = CreateGameSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            game = serializer.save()
            return Response({"game_id": game.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
'''
JSON body to create game is expected to be formatted as a nested structure such as the one below
{
  "title": "US Presidents Quiz",
  "description": "This is a quiz about presidents",
  "is_public": true,
  "questions": [
    {
      "question_text": "Who was the first president of the United States?",
      "choices": [
        { "choice_text": "George Washington", "is_correct": true },
        { "choice_text": "Abraham Lincoln", "is_correct": false },
        { "choice_text": "Thomas Jefferson", "is_correct": false }
      ]
    },
    {
      "question_text": "Who was the president during World War II?",
      "choices": [
        { "choice_text": "Franklin D. Roosevelt", "is_correct": true },
        { "choice_text": "John F. Kennedy", "is_correct": false },
        { "choice_text": "Harry Truman", "is_correct": false }
      ]
    }
  ]
}
'''

class UpdateGameView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, game_id):
        try:
            game = Game.objects.get(id=game_id, owner=request.user)
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)

        data = request.data
        updated_game = data.get('updated_game')
        updated_questions = data.get('updated_questions', [])
        updated_choices = data.get('updated_choices', [])
        deleted_questions = data.get('deleted_questions', [])
        deleted_choices = data.get('deleted_choices', [])

        # Update game (title and/or is public)
        if updated_game:
            serializer = GameUpdateSerializer(game, data=updated_game, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Update questions (textual content)
        for question_data in updated_questions:
            try:
                question = Question.objects.get(id=question_data['id'], game=game)
            except:
                return Response({'error': 'Question not found'}, status=404)
            serializer = QuestionUpdateSerializer(question, data=question_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Update choices (textual content)
        for choice_data in updated_choices:
            try:
                choice = Choice.objects.get(id=choice_data['id'])
            except:
                return Response({'error': 'Choice not found'})
            serializer = ChoiceUpdateSerializer(choice, data=choice_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Delete questions by id (remove questions)
        for question_id in deleted_questions:
            try:
                question = Question.objects.get(id=question_id, game=game)
                question.delete()
            except Question.DoesNotExist:
                continue

        # Delete choices by id (remove choices for a question)
        for choice_id in deleted_choices:
            try:
                choice = Choice.objects.get(id=choice_id)
                choice.delete()
            except Choice.DoesNotExist:
                continue

        return Response({'message': 'Game updated successfully'})
'''
{
  "updated_game": {
    "title": "Updated US Presidents Quiz",
    "is_public": true
  },
  "updated_questions": [
    {
      "id": 1,
      "question_text": "Who was the first U.S. President?"
    }
  ],
  "updated_choices": [
    {
      "id": 1,
      "choice_text": "George Washington",
      "is_correct": true
    },
    {
      "id": 2,
      "choice_text": "Alexander Hamilton",
      "is_correct": false
    }
  ],
  "deleted_questions": [2],
  "deleted_choices": [4, 5, 6]
}

'''


class RetrieveGameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        game = get_object_or_404(Game, id=game_id, owner=request.user)
        serializer = FullGameSerializer(game)
        return Response(serializer.data)