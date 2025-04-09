// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const Dashboard = () => {
  // This is just a placeholder - we'll add real functionality later
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
          <p className="text-gray-500 text-center py-4">
            You haven't created any quizzes yet. Click "Create New Quiz" to get started.
          </p>
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
    </Layout>
  );
};

export default Dashboard;