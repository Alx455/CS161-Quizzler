// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const Home = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Welcome to Quizzler
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Create interactive quizzes, join live games, and have fun while learning!
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/join">
            <Button variant="primary" size="lg">Join a Game</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" size="lg">Create Quizzes</Button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Join Games</h3>
            <p className="text-gray-600">
              Enter a game PIN and your name to join — no registration required!
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Create Quizzes</h3>
            <p className="text-gray-600">
              Register to create your own interactive quizzes for others to play.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3">Learn & Have Fun</h3>
            <p className="text-gray-600">
              Compete in real-time with friends and see who tops the leaderboard!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;