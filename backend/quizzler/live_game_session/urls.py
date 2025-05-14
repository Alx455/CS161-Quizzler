from django.urls import path
from .views import JoinSessionView, HostGameView, EndGameSessionView, GetFinalScoresView

urlpatterns = [
    path('host-game/', HostGameView.as_view(), name='host-game'),
    path('end-session/<str:session_code>/', EndGameSessionView.as_view(), name='end-session'),
    path('join-session/', JoinSessionView.as_view(), name='join-session'),
    path('final-scores/<str:session_code>/', GetFinalScoresView.as_view(), name='final-scores'),
]