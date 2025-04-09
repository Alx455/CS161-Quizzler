from django.urls import path
from .views import CreateGameView, UpdateGameView


urlpatterns = [
    # Create game API
    path('create-game/', CreateGameView.as_view(), name='create-game'),
    path('<int:game_id>/update-game/', UpdateGameView.as_view(), name='update-game'),
]