from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .serializers import CreateGameSerializer

class CreateGameView(APIView):
    def post(self, request):
        serializer = CreateGameSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            game = serializer.save()
            return Response({"game_id": game.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
'''
JSON body to create game is expected to be formatted as a nested structure such as the one below
{
  "title": "US Presidents Quiz",
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