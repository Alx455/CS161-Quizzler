import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_code = self.scope["url_route"]["kwargs"]["session_code"]
        self.room_group_name = f"session_{self.session_code}"

        # Join group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Welcome message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to session {self.session_code}'
        }))


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
