// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import JoinGame from './pages/JoinGame';
import Lobby from './pages/Lobby';
import GamePlay from './pages/GamePlay';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/lobby/:id" element={<Lobby />} />
        <Route path="/game/:id" element={<GamePlay />} />
        <Route path="/results/:id" element={<Results />} />
        
        {/* These will be protected later */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
      </Routes>
    </Router>
  );
}

export default App;