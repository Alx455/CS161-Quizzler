// src/pages/Lobby.jsx
import React, { useState, useEffect } from 'react';
import {useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

const Lobby = () => {
  const { id: gameId } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerName = sessionStorage.getItem('playerName');
  const isHost = sessionStorage.getItem('isHost') === 'true';
  const [showConfirmModal, setShowConfirmModal] = useState(false);



  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we would connect to WebSocket here and get real-time updates
    // For demo purposes, we'll simulate some players joining
    setLoading(true);
    
    setTimeout(() => {
      setPlayers([
        { id: 1, name: playerName || 'You' },
        { id: 2, name: 'Player 2' },
        { id: 3, name: 'Player 3' }
      ]);
      setLoading(false);
    }, 1000);
  }, [playerName]);

  const handleEndSession = async () => {
    try {
      const response = await fetch(`${API_URL}/live-game-session/end-session/${gameId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
  
      if (response.ok) {
        alert("Session ended.");
        sessionStorage.removeItem('isHost');
        navigate('/dashboard'); 
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to end session.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Game Lobby</h1>
          <p className="text-gray-600">Share PIN: <span className="font-bold text-lg">{gameId}</span></p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2">Connecting to game...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Players in Lobby ({players.length})</h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                {players.map(player => (
                  <div key={player.id} className="py-2 border-b border-gray-200 last:border-b-0">
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">Waiting for the host to start the game...</p>
              {isHost && (
                <>
                  <Button variant="primary">
                    Start Game
                  </Button>
                  <Button variant="danger" className="mt-2" onClick={() => setShowConfirmModal(true)}>
                    End Session
                  </Button>
                </>
              )}
            </div>

          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 shadow-md w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">End Game Session?</h2>
            <p className="mb-4 text-sm text-gray-600">
              This will permanently close the lobby and remove all players.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="danger" onClick={handleEndSession}>
                End Session
              </Button>
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Lobby;