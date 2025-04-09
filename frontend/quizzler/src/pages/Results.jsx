// src/pages/Results.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const Results = () => {
  const { id: gameId } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, we would fetch results from the server
    // For now, we'll simulate some results
    setTimeout(() => {
      setScores([
        { id: 1, name: 'Player 1', score: 4200, correct: 5 },
        { id: 2, name: 'You', score: 3800, correct: 4 },
        { id: 3, name: 'Player 3', score: 2500, correct: 3 },
        { id: 4, name: 'Player 4', score: 1200, correct: 2 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Game Results</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2">Loading results...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-indigo-600 text-white px-4 py-2">
                <h2 className="font-semibold">Leaderboard</h2>
              </div>
              
              <div>
                {scores.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`flex items-center px-4 py-3 border-b last:border-b-0 ${
                      player.name === 'You' ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <div className="w-10 text-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 font-medium">
                      {player.name} {player.name === 'You' && '(You)'}
                    </div>
                    <div className="text-gray-600 mr-4">
                      {player.correct} correct
                    </div>
                    <div className="font-bold text-indigo-600">
                      {player.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <Link to="/">
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