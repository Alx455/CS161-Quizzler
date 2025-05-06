import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
from live_game_session.models import GameSession, Player



class GameSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_code = self.scope["url_route"]["kwargs"]["session_code"]
        self.room_group_name = f"session_{self.session_code}"

        query_params = parse_qs(self.scope["query_string"].decode())
        self.username = query_params.get("username", [None])[0]

        if not self.username:
            await self.close()
            return

        try:
            session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
        except GameSession.DoesNotExist:
            await self.close()
            return
        
        # Join the group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send full player list to the newly connected client only
        players = await sync_to_async(list)(
            Player.objects.filter(session=session).values("id", "username", "score")
        )
        await self.send(text_data=json.dumps({
            "type": "player_list",
            "players": players
        }))

        player = await sync_to_async(Player.objects.get)(
            session=session, username=self.username
        )

        # Notify others that a new player has joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_joined",
                "username": self.username,
                "player_id": player.id
            }
        )


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)



    async def receive(self, text_data):
        data = json.loads(text_data)

        message_type = data.get('type')

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'item_use':
            await self.handle_item_use(data)
        else:
            # Optional: Handle unknown message types
            pass

    async def handle_chat_message(self, data):
        username = data['username']
        message = data['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "username": username,
                "message": message,
            }
        )

    async def handle_item_use(self, data):
        # Item use logic to be implemented later
        pass


    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "username": event["username"],
            "message": event["message"],
        }))

    async def game_session_ended(self, event):
        await self.send(text_data=json.dumps({
            "type": "session_ended",
            "message": event["message"],
        }))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_joined",
            "username": event["username"]
        }))