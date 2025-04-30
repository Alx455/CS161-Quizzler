import random
import string
from live_game_session.models import GameSession

def generate_unique_session_code(length=6):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        if not GameSession.objects.filter(session_code=code).exists():
            return code
