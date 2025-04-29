from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/session/(?P<session_code>\w{6})/$', consumers.GameSessionConsumer.as_asgi()),
]
