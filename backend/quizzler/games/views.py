from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from .serializers import CreateGameSerializer, GameUpdateSerializer, QuestionUpdateSerializer, ChoiceUpdateSerializer, GameSerializer
from .models import Game, Question, Choice

class CreateGameView(APIView):
    permission_classes = [IsAuthenticated] #only users that are logged in can access..

    def post(self, request):
        serializer = CreateGameSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            game = serializer.save()
            return Response({"game_id": game.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            
        # Create new questions and choices
        new_questions = data.get('new_questions', [])
        for question_data in new_questions:
            if 'question_text' not in question_data:
                return Response({'error': 'Each question must have a question_text.'}, status=400)

            choices_data = question_data.pop('choices', [])
            if len(choices_data) != 4:
                return Response({'error': 'Each question must have exactly 4 choices.'}, status=400)

            correct_count = 0
            for choice in choices_data:
                if choice.get('is_correct'):
                    correct_count += 1
            if correct_count != 1:
                return Response({'error': 'Only one correct choice is allowed'})
            
            # Create the question
            question = Question.objects.create(game=game, question_text=question_data['question_text'])

            # Create the associated choices
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)

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

class RetrieveUserGamesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # set of games that whose owner field is the current users id
        games = Game.objects.filter(owner=request.user)
        serializer = GameSerializer(games, many=True)
        return Response(serializer.data)

class RetrieveSingleGameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only allow if game is public OR if user is the owner
        # In other words, deny the request if the game is not public and the user requesting it is not the owner
        if (not game.is_public) and (game.owner != request.user):
            return Response({'error': 'You do not have permission to access this game.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GameSerializer(game)
        return Response(serializer.data)

class DeleteGameView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, game_id):
        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)
        # Ensure only the owner can deletethe quiz
        if game.owner != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        # Delete game from DB
        game.delete()
        return Response({'message': 'Game deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
