from .models import Player
import random
import logging

logger = logging.getLogger('quizzler.live_game_session.item_effects')

class ItemManager:
    MAX_ITEMS = 2

    # Updated Item Types
    ITEM_TYPES = ["Cannon", "Torpedo", "Shield"]
    GRANT_ROUND_INTERVAL = 2

    def __init__(self):
        self.player_items = {}
        self.item_queue = []

    def assign_item(self, player_id, item_type):
        """
        Assigns an item to a player, maintaining a max of 2 items.
        """
        if player_id not in self.player_items:
            self.player_items[player_id] = []

        # Enforce item limit
        if len(self.player_items[player_id]) >= self.MAX_ITEMS:
            self.player_items[player_id].pop(0)

        self.player_items[player_id].append(item_type)
        print(f"Assigned {item_type} to player {player_id}")

    def use_item(self, player_id, item_type, target_id=None):
        """
        Queues item effects except for SHIELD, which is applied immediately.
        """
        logger.info(f"use_item entered in item_effects.py with player_id: {player_id}, item_type: {item_type}, target_id: {target_id}")
        logger.info(f"Current player_items: {self.player_items}")

        # Check if player exists in player_items and if the item is present
        if player_id not in self.player_items:
            logger.warning(f"Player {player_id} not found in player_items. Current state: {self.player_items}")
            return

        if item_type not in self.player_items[player_id]:
            logger.warning(f"Item {item_type} not found for player {player_id}. Current items: {self.player_items[player_id]}")
            return
        

        if item_type in self.player_items.get(player_id, []):
            self.player_items[player_id].remove(item_type)

            if item_type == "SHIELD":
                self.apply_shield(player_id)
            else:
                self.item_queue.append({
                    "player_id": player_id,
                    "item_type": item_type,
                    "target_id": target_id
                })

    def apply_queued_items(self):
        """
        Apply all queued items at the end of the round and reset shields.
        """
        logger.info("apply_queued_items entered in item_efects.py")
        while self.item_queue:
            item_data = self.item_queue.pop(0)
            self.apply_effect(
                item_data["item_type"],
                item_data["player_id"],
                item_data["target_id"]
            )

        # Reset shields
        Player.objects.filter(shield_active=True).update(shield_active=False)

    def apply_effect(self, item_type, player_id, target_id):
        """
        Applies the effect of the item.
        """
        logger.info(f'apply_effect entered in item_efects.py, {player_id} hits {target_id} with {item_type}')
        if item_type == "Cannon":
            self.apply_cannon(player_id, target_id)
        elif item_type == "Torpedo":
            self.apply_torpedo(player_id, target_id)

    def apply_cannon(self, player_id, target_id):
        """
        Applies the Cannon effect: 75-point deduction.
        """
        logger.info(f'apply_cannon entered in item_efects.py, {player_id} againts {target_id}')
        try:
            target_player = Player.objects.get(id=target_id)

            if not target_player.shield_active:
                target_player.score -= 75
                target_player.save()
                print(f"Cannon hit {target_player.username} for -75 points")
            else:
                print(f"Cannon blocked by shield on {target_player.username}")

        except Player.DoesNotExist:
            pass

    def apply_torpedo(self, player_id, target_id):
        """
        Applies the Torpedo effect: 50-point deduction.
        """
        try:
            target_player = Player.objects.get(id=target_id)

            if not target_player.shield_active:
                target_player.score -= 50
                target_player.save()
                print(f"Torpedo hit {target_player.username} for -50 points")
            else:
                print(f"Torpedo blocked by shield on {target_player.username}")

        except Player.DoesNotExist:
            pass

    def apply_shield(self, player_id):
        """
        Activates a shield for the current round.
        """
        try:
            player = Player.objects.get(id=player_id)
            player.shield_active = True
            player.save()
            print(f"Shield activated for {player.username}")
        except Player.DoesNotExist:
            pass

    def grant_items(self, session):
        logger.info("grant_items entered in item_efects.py")
        """
        Grants 1 item to all players in the session every 3 rounds, 
        but only if they have less than 2 items.
        """
        if session.current_round % self.GRANT_ROUND_INTERVAL == 0:
            players = Player.objects.filter(session=session)
            for player in players:
                # Check if player has less than MAX_ITEMS
                if len(self.player_items.get(player.id, [])) < self.MAX_ITEMS:
                    item_type = random.choice(self.ITEM_TYPES)
                    self.assign_item(player.id, item_type)
