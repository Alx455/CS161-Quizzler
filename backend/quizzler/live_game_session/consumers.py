import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
from live_game_session.models import GameSession, Player
from games.models import Question, Choice
import logging
from .item_effects import ItemManager

logger = logging.getLogger('quizzler.live_game_session.consumers')
session_item_managers = {}



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
        
        # Create a new ItemManager if it doesn't exist for the session
        if self.session_code not in session_item_managers:
            session_item_managers[self.session_code] = ItemManager()
            logger.info(f"[CONNECT] New ItemManager created for session {self.session_code}")

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

        # Remove item_manager if group is empty
        group_channels = self.channel_layer.groups.get(self.room_group_name, [])
        if not group_channels:
            logger.info(f"[DISCONNECT] No more players in session {self.session_code}. Removing ItemManager.")
            session_item_managers.pop(self.session_code, None)




    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        logger.info(f'[RECEIVE] Message received: {message_type} | Data: {data}')

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'item_use':
            await self.handle_item_use(data)
        elif message_type == "start_game":
            # attempt to retrieve game session, return if fail
            try:
                session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
            except GameSession.DoesNotExist:
                return

            # Retrieve host username
            host_username = await sync_to_async(lambda: session.host.username)()

            # Retrieve game ID(of the game associated with session, not the session code), return if fail
            try:
                game_id = await sync_to_async(lambda: session.game.id)()
            except AttributeError:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Game ID not found."
                }))
                return

            # Only host can start the game
            if host_username != self.username:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Only the host can start the game."
                }))
                return

            # Broadcast to all players that the game has started and send game ID
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_started",
                    "game_id": game_id
                }
            )

            # Initialize the current question index in the session
            session.current_round = 0
            await sync_to_async(session.save)()

            # Send the first question
            await self.send_question(session, game_id, 0)

        elif message_type == "next_question":
            try:
                session = await sync_to_async(GameSession.objects.get)(session_code=self.session_code)
                game = await sync_to_async(lambda: session.game)()
                game_id = await sync_to_async(lambda: game.id)()

                current_index = session.current_round
                next_index = current_index + 1

                question_count = await sync_to_async(lambda: game.questions.count())()

                host_username = await sync_to_async(lambda: session.host.username)()
                # Ensure only the host can trigger the next question
                if self.username != host_username:
                    logger.warning(f"[NEXT_QUESTION] Non-host {self.username} attempted to trigger next_question. Ignoring.")
                    return

                

                # Retrieve the correct ItemManager
                item_manager = self.get_item_manager()

                # Apply item effects before moving to next question
                if item_manager:
                    await sync_to_async(item_manager.apply_queued_items)()

                # Grant items based on the new round index and send updated items to frontend
                if item_manager:
                    await sync_to_async(item_manager.grant_items)(session)
                    await self.send_player_items()

                # Check if there are more questions
                if next_index < question_count:
                    session.current_round = next_index
                    await sync_to_async(session.save)()
                    await self.send_question(session, game_id, next_index)
                else:
                    players = await sync_to_async(lambda: list(session.player_set.all()))()
                    scores = [{"username": player.username, "score": player.score} for player in players]

                    # End game if no more questions
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "game_ended",
                            "message": "Game Over",
                            "scores": scores,
                        }
                    )

            except GameSession.DoesNotExist:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Session not found."
                }))

        elif message_type == 'answer_submission':
            await self.handle_answer_submission(data)

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
        item_type = data.get("item")
        target_player_username = data.get("target")
        session_code = data.get("sessionCode")
        username = self.username

        logger.info(f"[ITEM_USE] Item: {item_type}, Target: {target_player_username}, User: {username}")

        try:
            session = await sync_to_async(GameSession.objects.get)(session_code=session_code)
            player = await sync_to_async(Player.objects.get)(session=session, username=username)
            player_id = player.id

            # Retrieve the correct ItemManager
            item_manager = self.get_item_manager()

            if not item_manager:
                logger.warning(f"[ITEM_USE] No ItemManager found for session {session_code}.")
                return

            # Verify item in player's inventory
            if item_type not in item_manager.player_items.get(player_id, []):
                logger.warning(f"[ITEM_USE] Player {username} does not have the item {item_type}.")
                return

            # Determine target player ID
            target_id = None
            target_player = None
            if item_type in ["Cannon", "Torpedo"] and target_player_username:
                try:
                    target_player = await sync_to_async(Player.objects.get)(session=session, username=target_player_username)
                    target_id = target_player.id
                except Player.DoesNotExist:
                    logger.warning(f"[ITEM_USE] Target player {target_player_username} not found.")
                    return

            # Use the item
            await sync_to_async(item_manager.use_item)(player_id, item_type, target_id)
            logger.info(f"[ITEM_USE] {item_type} used by {username} targeting {target_player_username}")

            # Broadcast the action to all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "item_used",
                    "item_type": item_type,
                    "player_id": player_id,
                    "target_id": target_id,
                    "source_username": player.username,
                    "target_username": target_player.username if target_player else None,
                }
            )

            # Send items to update frontend after an item is used(remove the item)
            await self.send_player_items()

        except GameSession.DoesNotExist:
            logger.warning(f"[ITEM_USE] Session {session_code} not found.")
        except Player.DoesNotExist:
            logger.warning(f"[ITEM_USE] Player {username} not found in session {session_code}.")
        except Exception as e:
            logger.error(f"[ITEM_USE] Error in handle_item_use: {str(e)}")




    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "username": event["username"],
            "message": event["message"],
        }))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_joined",
            "username": event["username"],
            "player_id": event["player_id"]
        }))

    async def game_started(self, event):
        game_id = event.get("game_id")

        if not game_id:
            logger.info("Error: `game_id` not provided in game_started event.")
            return

        await self.send(text_data=json.dumps({
            "type": "game_started",
            "game_id": game_id
        }))

    async def send_question(self, session, game_id, question_index):
        try:
            # Fetch the question
            questions = await sync_to_async(list)(session.game.questions.all())

            if question_index >= len(questions):
                logger.info(f"Invalid question index: {question_index}")
                return

            question = questions[question_index]
            choices = await sync_to_async(list)(question.choices.all())

            logger.info(f"Broadcasting question 0 for game {game_id}")

            # Broadcast question to all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "question_broadcast",
                    "question_index": question_index,
                    "question_data": {
                        "question_text": question.question_text,
                        "choices": [
                            {"choice_text": choice.choice_text, "is_correct": choice.is_correct}
                            for choice in choices
                        ]
                    }
                }
            )

        except Exception as e:
            logger.info(f"Error in sending question: {e}")


    async def question_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "question_broadcast",
            "question_index": event["question_index"],
            "question_data": event["question_data"]
        }))

    async def game_ended(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_ended",
            "message": event["message"],
            "scores": event.get("scores", [])
        }))


    async def handle_answer_submission(self, data):
        logger.info(f'handle_asnwer executing')
        question_index = data.get("questionIndex")
        selected_answer = data.get("selectedAnswer")
        session_code = data.get("sessionCode")
        username = self.username

        try:
            # Retrieve the session
            session = await sync_to_async(GameSession.objects.get)(session_code=session_code)

            game = await sync_to_async(lambda: session.game)()

            # Retrieve the question
            questions = await sync_to_async(lambda: list(game.questions.all()))()

            # Ensure index is within bounds
            if question_index < 0 or question_index >= len(questions):
                logger.warning(f"Invalid question index: {question_index}")
                return

            # Retrieve the question by index
            question = questions[question_index]

            # Determine if the answer is correct
            correct_choice = await sync_to_async(Choice.objects.get)(question=question, is_correct=True)
            is_correct = await sync_to_async(lambda: correct_choice.choice_text == selected_answer)()

            # Retrieve the player
            try:
                player = await sync_to_async(Player.objects.get)(session=session, username=username)
            except Player.DoesNotExist:
                logger.warning(f"[ANSWER_SUBMISSION] Player {username} not found in session {session_code}")
                return

            # Grant points if correct
            if is_correct:
                await sync_to_async(lambda: setattr(player, 'score', player.score + 100))()
                await sync_to_async(player.save)()

            # Broadcast updated scores to all players
            scores = await sync_to_async(list)(
                Player.objects.filter(session=session).values("username", "score")
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_scores",
                    "scores": scores
                }
            )

        except GameSession.DoesNotExist:
            logger.warning(f"[ANSWER_SUBMISSION] Session {session_code} not found.")
        except Question.DoesNotExist:
            logger.warning(f"[ANSWER_SUBMISSION] Question {question_index} not found.")
        except Choice.DoesNotExist:
            logger.warning(f"[ANSWER_SUBMISSION] Correct choice not found for question {question_index}.")
        except Exception as e:
            logger.error(f"[ANSWER_SUBMISSION] Error: {str(e)}")

    async def update_scores(self, event):
        await self.send(text_data=json.dumps({
            "type": "update_scores",
            "scores": event["scores"]
        }))

    async def item_used(self, event):
        await self.send(text_data=json.dumps({
            "type": "item_used",
            "item_type": event["item_type"],
            "player_id": event["player_id"],
            "target_id": event["target_id"],
            "source_username": event["source_username"],
            "target_username": event.get("target_username")
        }))

    async def send_player_items(self):
        item_manager = self.get_item_manager()

        if not item_manager:
            logger.warning(f"[ITEMS] No ItemManager found for session {self.session_code}.")
            return

        # Construct items payload
        player_items = {
            player_id: items
            for player_id, items in item_manager.player_items.items()
        }

        logger.info("Constructed items payload and broadcasting")

        # Broadcast items to all clients in the session
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_items",
                "items": player_items
            }
        )

    async def player_items(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_items",
            "items": event["items"]
        }))



    def get_item_manager(self):
        return session_item_managers.get(self.session_code)