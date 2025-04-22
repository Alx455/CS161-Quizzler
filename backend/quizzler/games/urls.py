from django.urls import path
from .views import CreateGameView, UpdateGameView, RetrieveUserGamesView, DeleteGameView


urlpatterns = [
    # Create game API
    path('create-game/', CreateGameView.as_view(), name='create-game'),
    # Update game API
    path('<int:game_id>/update-game/', UpdateGameView.as_view(), name='update-game'),
    # Retrieve user games API
    path('my-games/', RetrieveUserGamesView.as_view(), name='my-games'),
    # Delete game API
    path('<int:game_id>/delete/', DeleteGameView.as_view(), name='delete-game'),

]