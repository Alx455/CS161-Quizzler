from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from live_game_session.models import GameSession, Player
from live_game_session.serializers import JoinSessionSerializer, HostGameSerializer
from live_game_session.utils import generate_unique_session_code
from games.models import Game
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class HostGameView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = HostGameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        game_id = serializer.validated_data['game_id']
        game = Game.objects.filter(id=game_id, owner=request.user).first()

        if not game:
            return Response({'error': 'Game not found or not owned by user'}, status=404)

        session_code = generate_unique_session_code()
        session = GameSession.objects.create(
            host=request.user,
            game=game,
            session_code=session_code
        )

        Player.objects.create(session=session, username=request.user.username)

        return Response({'session_code': session.session_code, 'session_id': session.id})
    
class EndGameSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_code):
        try:
            session = GameSession.objects.get(session_code=session_code, host=request.user)
        except GameSession.DoesNotExist:
            return Response({'error': 'Session not found or unauthorized'}, status=404)

        # send message to entire lobby through channels
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"session_{session_code}",
            {
                "type": "game.session_ended",
                "message": "The host has ended the session."
            }
        )

        session.delete()
        return Response({'message': 'Game session ended and deleted.'})

class JoinSessionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = JoinSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        session_code = serializer.validated_data['session_code']
        username = serializer.validated_data['username']

        try:
            session = GameSession.objects.get(session_code=session_code)
        except GameSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if Player.objects.filter(session=session, username=username).exists():
            return Response({'error': 'Username already taken in this session'}, status=409)

        player = Player.objects.create(session=session, username=username)

        return Response({'player_id': player.id})
