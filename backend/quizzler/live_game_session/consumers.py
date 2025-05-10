import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
from live_game_session.models import GameSession, Player
import logging

logger = logging.getLogger('quizzler.live_game_session.consumers')




class GameSessionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info(f"[CONNECT INIT] New connection attempt. Raw query string: {self.scope['query_string']}")

        self.session_code = self.scope["url_route"]["kwargs"]["session_code"]
        self.room_group_name = f"session_{self.session_code}"
        query_params = parse_qs(self.scope["query_string"].decode())
        self.username = query_params.get("username", [None])[0]

        logger.info(f"[CONNECT] Session Code: {self.session_code}, Username: {self.username}")

        # Check for missing username
        if not self.username:
            logger.warning("[CONNECT] No username provided. Closing connection.")
            await self.close()
            return
        
        # Check if this user is already connected
        group_channels = self.channel_layer.groups.get(self.room_group_name, [])
        for connection in group_channels:
            if connection == self.channel_name:
                logger.warning(f"[CONNECT] Duplicate connection attempt for {self.username}. Closing new connection.")
                await self.close()
                return


        # Retrieve session
        try:
            session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
            logger.info(f"[CONNECT] Session found: {session.session_code}, Active: {session.is_active}")
        except GameSession.DoesNotExist:
            logger.warning(f"[CONNECT] Session {self.session_code} not found in the database. Closing connection.")
            await self.close()
            return

        # Check session status
        if not session.is_active:
            logger.warning(f"[CONNECT] Session {self.session_code} is inactive. Closing connection.")
            await self.close()
            return

        # Attempt to join group
        try:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            logger.info(f"[CONNECT] Added to group: {self.room_group_name}")
        except Exception as e:
            logger.error(f"[CONNECT] Error joining group: {self.room_group_name}. Exception: {str(e)}")
            await self.close()
            return

        # Accept WebSocket connection
        try:
            await self.accept()
            logger.info(f"[CONNECT] WebSocket connection established for {self.username} in session {self.session_code}")
        except Exception as e:
            logger.error(f"[CONNECT] Error during WebSocket acceptance. Exception: {str(e)}")
            await self.close()
            return

        # Send player list to the newly connected client
        try:
            players = await sync_to_async(list)(
                Player.objects.filter(session=session).values("id", "username", "score")
            )
            await self.send(text_data=json.dumps({
                "type": "player_list",
                "players": players
            }))
            logger.info(f"[CONNECT] Player list sent to {self.username}")
        except Exception as e:
            logger.error(f"[CONNECT] Error sending player list to {self.username}. Exception: {str(e)}")
            await self.close()
            return

        # Notify others about the new player
        try:
            player = await sync_to_async(Player.objects.get)(
                session=session, username=self.username
            )
            logger.info(f"[CONNECT] Player {player.username} with ID {player.id} successfully retrieved.")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "player_joined",
                    "username": self.username,
                    "player_id": player.id
                }
            )
            logger.info(f"[CONNECT] Player joined message sent to group {self.room_group_name}")
            
        except Player.DoesNotExist:
            logger.warning(f"[CONNECT] Player {self.username} not found in session {self.session_code}. Closing connection.")
            await self.close()
            return
        except Exception as e:
            logger.error(f"[CONNECT] Error notifying group about player {self.username}. Exception: {str(e)}")
            await self.close()
            return







    async def disconnect(self, close_code):
        logger.info(f"[DISCONNECT] WebSocket closed with code: {close_code}")
        logger.info(f"[DISCONNECT] session_code: {self.session_code}")
        logger.info(f"[DISCONNECT] username: {self.username}")

        # Attempt to retrieve the session
        session = None
        try:
            session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
            if session.is_active:
                logger.info(f"[DISCONNECT] Session {session.session_code} is active.")
            else:
                logger.info(f"[DISCONNECT] Session {session.session_code} is inactive.")
        except GameSession.DoesNotExist:
            logger.warning(f"[DISCONNECT] Session {self.session_code} not found in database.")

        # Check if the player still exists
        try:
            if session:
                player = await sync_to_async(Player.objects.get)(
                    session=session,
                    username=self.username
                )
                logger.info(f"[DISCONNECT] Player found: {player.username} with ID {player.id}")

                # Mark player as inactive only if the session is still active
                if session.is_active:
                    player.is_active = False
                    await sync_to_async(player.save)()
                    logger.info(f"[DISCONNECT] Player {player.username} marked as inactive.")
        except Player.DoesNotExist:
            logger.warning(f"[DISCONNECT] Player {self.username} not found in session {self.session_code}.")

        # Remove from group
        try:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            logger.info(f"[DISCONNECT] Removed from group: {self.room_group_name}")
        except Exception as e:
            logger.error(f"[DISCONNECT] Error removing from group: {e}")




    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'item_use':
            await self.handle_item_use(data)
        elif message_type == "start_game":
            try:
                session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
            except GameSession.DoesNotExist:
                return

            host_username = await sync_to_async(lambda: session.host.username)()
            try:
                game_id = await sync_to_async(lambda: session.game.id)()
            except AttributeError:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Game ID not found."
                }))
                return

            if host_username != self.username:
                # Only host can start the game
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Only the host can start the game."
                }))
                return

            # Broadcast to all players that the game has started
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_started",
                    "game_id": game_id
                }
            )
        elif message_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
            
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
            "username": event["username"],
            "player_id": event["player_id"]
        }))

    async def game_started(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_started"
        }))