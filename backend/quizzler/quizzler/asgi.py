import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from live_game_session.routing import websocket_urlpatterns  # adjust path if needed

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quizzler.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
