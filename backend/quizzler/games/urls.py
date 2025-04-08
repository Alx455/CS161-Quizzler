from django.urls import path
from .views import CreateGameView


urlpatterns = [
    # Create game API
    path('create-game/', CreateGameView.as_view(), name='create-game'),
]