// src/pages/GamePlay.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const API_URL = import.meta.env.VITE_API_URL;

const GamePlay = () => {

  const { id: sessionCode } = useParams();
  const storedGameId = sessionStorage.getItem("gameId");

  const [gameData, setGameData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  /**
   * Fetch game data on initial load
   */
  useEffect(() => {
    const fetchGameData = async () => {
      if (!storedGameId) return;

      try {
        const response = await fetch(`${API_URL}/games/${storedGameId}/retrieve/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (!response.ok) throw new Error("Failed to load game data");

        const data = await response.json();
        setGameData(data);
        setCurrentQuestion(data.questions[0]);
        setTimeRemaining(30);  // Default time limit per question
      } catch (error) {
        console.error("Error loading game data:", error);
      }
    };

    fetchGameData();
  }, [storedGameId]);

  /**
   * Listen for "questionBroadcast" and "gameEnded" events
   */
  useEffect(() => {
    const handleQuestionBroadcast = (e) => {
      const { question_index, question_data } = e.detail;
      console.log("Received Question:", question_data);

      setCurrentQuestion(question_data);
      setQuestionIndex(question_index);
      setTimeRemaining(30);  // Reset timer for each question
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
    };

    const handleGameEnded = (e) => {
      console.log("Game Ended Event Received:", e.detail);
      setScores(e.detail.scores);
      navigate("/dashboard");  // Navigate back to dashboard or show game summary
    };

    window.addEventListener("questionBroadcast", handleQuestionBroadcast);
    window.addEventListener("gameEnded", handleGameEnded);

    return () => {
      window.removeEventListener("questionBroadcast", handleQuestionBroadcast);
      window.removeEventListener("gameEnded", handleGameEnded);
    };
  }, [navigate]);

  /**
   * Handle Timer Logic
   */
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  /**
   * Handle Answer Selection
   */
  const handleSelectAnswer = (answerId) => {
    if (isAnswerSubmitted || timeRemaining === 0) return;

    setSelectedAnswer(answerId);
    setIsAnswerSubmitted(true);

    console.log(`Answer submitted: ${answerId}`);
    // TODO: Send answer to server via WebSocket
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Game Play</h1>

        {/* Question Timer and Progress */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
          <div className="font-medium">
            Question {questionIndex + 1} of {gameData ? gameData.questions.length : "Loading..."}
          </div>
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
            {timeRemaining} seconds
          </div>
        </div>

        {/* Question and Options */}
        {currentQuestion ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-6">{currentQuestion.question_text}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(choice.choice_text)}
                  className={`p-4 rounded-lg transition ${
                    selectedAnswer === choice.choice_text
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  } ${isAnswerSubmitted ? "pointer-events-none" : ""}`}
                  disabled={isAnswerSubmitted}
                >
                  {choice.choice_text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p>Loading question...</p>
        )}

        {/* Status Message */}
        {isAnswerSubmitted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            Answer submitted! Waiting for other players...
          </div>
        )}

        {timeRemaining === 0 && !isAnswerSubmitted && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
            Time's up! The correct answer will be revealed soon.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GamePlay;