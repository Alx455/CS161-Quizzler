// src/pages/Results.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

const Results = () => {
  const { sessionCode } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch(`${API_URL}/live-game-session/final-scores/${sessionCode}/`);

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setScores(data.scores);
      } catch (err) {
        console.error("Error fetching scores:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [sessionCode]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Game Results</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2">Loading results...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <>
            {scores.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="bg-indigo-600 text-white px-4 py-2">
                  <h2 className="font-semibold">Leaderboard</h2>
                </div>
                
                <div>
                  {scores.map((player, index) => (
                    <div 
                      key={player.username}
                      className={`flex items-center px-4 py-3 border-b last:border-b-0 ${
                        player.username === sessionStorage.getItem("playerName") ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <div className="w-10 text-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 font-medium">
                        {player.username} {player.username === sessionStorage.getItem("playerName") ? '(You)' : ''}
                      </div>
                      <div className="font-bold text-indigo-600">
                        {player.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No scores available.</p>
              </div>
            )}
            
            <div className="text-center">
              <Link to="/dashboard">
                <Button variant="primary">Back to Home</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Results;