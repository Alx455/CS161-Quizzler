// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import JoinGame from "./pages/JoinGame";
import Lobby from "./pages/Lobby";
import GamePlay from "./pages/GamePlay";
import Results from "./pages/Results";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/lobby/:sessionCode" element={<Lobby />} />
      <Route path="/game/:sessionCode" element={<GamePlay />} />
      <Route path="/results/:sessionCode" element={<Results />} />

      {/* Protected routes (to be implemented later) */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-quiz" element={<CreateQuiz />} />
      <Route path="/edit-quiz/:gameId" element={<EditQuiz />} />
    </Routes>
  );
}

export default App;
