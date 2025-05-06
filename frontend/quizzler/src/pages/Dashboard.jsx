// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  

  const handleDeleteClick = (gameId) => {
    setQuizToDelete(gameId);
    setShowConfirm(true);
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${API_URL}/games/my-games/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGames(data);
        } else {
          console.error('Failed to fetch games');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleHostGame = async (gameId) => {
    try {
      const response = await fetch(`${API_URL}/live-game-session/host-game/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ game_id: gameId }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.error || 'Failed to host game');
        return;
      }
  
      sessionStorage.setItem('isHost', 'true');
      navigate(`/lobby/${data.session_code}`);
    } catch (err) {
      alert('Network error. Could not host game.');
      console.error(err);
    }
  };
  

  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Link to="/create-quiz">
                <Button variant="primary">Create New Quiz</Button>
            </Link>
    </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">My Quizzes</h2>
        
        <div className="border-t border-gray-200 pt-4">
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading your quizzes...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-4">{error}</p>
          ) : games.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              You haven't created any quizzes yet. Click "Create New Quiz" to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {games.map((game) => (
                <li key={game.id} className="border rounded p-4">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold">{game.title}</h3>
                    <p className="text-gray-600 text-sm">{game.description}</p>
                    <p className="text-sm text-indigo-600">
                      {game.is_public ? 'Public' : 'Private'}
                    </p>
                    <div className="flex gap-2 mt-3">
                    <Link to={`/edit-quiz/${game.id}`}>
                      <Button variant="primary">
                        Edit
                      </Button>
                    </Link>
                      <Button variant="danger" onClick={() => handleDeleteClick(game.id)}>
                        Delete
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => handleHostGame(game.id)}
                      >
                        Host
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Join a Game</h2>
        
        <div className="flex">
          <input
            type="text"
            placeholder="Enter game code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button className="rounded-l-none">Join</Button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 shadow-md w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this quiz?</h2>
            <div className="flex justify-center gap-4">
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/games/${quizToDelete}/delete/`, {
                      method: 'DELETE',
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                      },
                    });

                    if (response.ok) {
                      setGames(games.filter((g) => g.id !== quizToDelete));
                    } else {
                      alert("Failed to delete quiz.");
                    }
                  } catch (err) {
                    alert("An error occurred.");
                    console.error(err);
                  } finally {
                    setShowConfirm(false);
                    setQuizToDelete(null);
                  }
                }}
              >
                Yes
              </Button>
              <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Dashboard;