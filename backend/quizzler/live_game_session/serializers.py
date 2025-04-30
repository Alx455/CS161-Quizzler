# live_game_session/serializers.py
from rest_framework import serializers

class JoinSessionSerializer(serializers.Serializer):
    session_code = serializers.CharField(min_length=6, max_length=6)
    username = serializers.CharField(min_length=1, max_length=50)


class HostGameSerializer(serializers.Serializer):
    game_id = serializers.IntegerField()