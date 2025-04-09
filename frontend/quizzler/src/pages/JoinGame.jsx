// src/pages/JoinGame.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const JoinGame = () => {
  const [gamePin, setGamePin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!gamePin) {
      setError('Please enter a game PIN');
      return;
    }
    
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    
    // In a real app, we would validate the PIN with the backend here
    // For now, we'll just navigate to the lobby
    const gameId = gamePin; // In real app, server would return actual game ID
    
    // Store player name in sessionStorage
    sessionStorage.setItem('playerName', playerName);
    
    // Navigate to the lobby
    navigate(`/lobby/${gameId}`);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Join a Game</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="gamePin" className="block text-gray-700 font-medium mb-1">
              Game PIN
            </label>
            <input
              type="text"
              id="gamePin"
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter 6-digit PIN"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-gray-700 font-medium mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>
          
          <Button type="submit" variant="primary" fullWidth>
            Join
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default JoinGame;