// src/pages/GamePlay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ChatBox from '../components/layout/ChatBox';
import ItemBox from '../components/layout/ItemBox';
import { useWebSocket } from "../context/WebSocketContext";


const API_URL = import.meta.env.VITE_API_URL;

const GamePlay = () => {
  const timerRef = useRef(null);
  const { sessionCode } = useParams();

  const [items, setItems] = useState(["Cannon", "Shield"]);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const { sendMessage, isConnected, disconnectWebSocket, scores, playerName } = useWebSocket();
  const navigate = useNavigate();



  /**
   * Listen for "questionBroadcast" and "gameEnded" events
   */
  useEffect(() => {
    console.log("GamePlay.jsx useEffect mounted for questionBroadcast listener");

    const handleQuestionBroadcast = (e) => {
      const { question_index, question_data } = e.detail;
      console.log("Received Question:", question_data);

      setCurrentQuestion(question_data);
      setQuestionIndex(question_index);
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
      startTimer(30);

      console.log("Current Question Set:", question_data);
    };

    window.addEventListener("questionBroadcast", handleQuestionBroadcast);

    // Check for any pending question in sessionStorage
    const pendingQuestion = sessionStorage.getItem("pendingQuestion");
    if (pendingQuestion) {
      const { question_index, question_data } = JSON.parse(pendingQuestion);
      handleQuestionBroadcast({ detail: { question_index, question_data } });
      sessionStorage.removeItem("pendingQuestion");
    }



    const handleGameEnded = (e) => {
      console.log("Game Ended Event Received:", e.detail);
      const sessionCode = sessionStorage.getItem("sessionCode");
      disconnectWebSocket();
      navigate(`/results/${sessionCode}`);  // Navigate to game end screen
    };

    window.addEventListener("gameEnded", handleGameEnded);

    return () => {
      window.removeEventListener("questionBroadcast", handleQuestionBroadcast);
      window.removeEventListener("gameEnded", handleGameEnded);
    };
  }, [navigate]);

  /**
   * Handle Moving to Next Question
   */
  const handleNextQuestion = () => {
    console.log("Handling next question...");
    
    // Send "next_question" message through WebSocket
    const sessionCode = sessionStorage.getItem("sessionCode");
    if (sessionCode && isConnected) {
      const message = { type: "next_question" };
      sendMessage(message);
      console.log("Sent next_question message to backend:", message);
    }
  };

  /**
   * Start Timer
   */
  const startTimer = (duration) => {
    clearInterval(timerRef.current);

    let timeLeft = duration;
    setTimeRemaining(timeLeft);

    timerRef.current = setInterval(() => {
      timeLeft--;
      setTimeRemaining(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log("Timer ended, moving to next question");
        handleNextQuestion();
      }
    }, 1000);
  };

  /**
   * Handle Answer Selection
   */
  const handleSelectAnswer = (answerId) => {
    if (isAnswerSubmitted || timeRemaining === 0) return;

    setSelectedAnswer(answerId);
    setIsAnswerSubmitted(true);

    console.log(`Answer submitted: ${answerId}`);
    // Send the selected answer to the backend via WebSocket
    const sessionCode = sessionStorage.getItem("sessionCode");

    if (sessionCode && isConnected) {
      const message = {
        type: "answer_submission",
        questionIndex: questionIndex,
        selectedAnswer: answerId,
        sessionCode: sessionCode,
      };

      sendMessage(message);
      console.log("Sent answer_submission message to backend:", message);
    }
  };

  /**
   * Handle Item Use
   */
  const handleUseItem = (usedItem) => {
    console.log(`Item used: ${usedItem}`);

    let targetPlayer = null;
    console.log("Scores Array:", scores);
    console.log("Current Player Name:", playerName);

    // Determine target player based on the item
    switch (usedItem) {
      case "Shield":
        targetPlayer = playerName;
        break;

      case "Cannon":
        if (scores.length > 0) {
          const currentPlayerIndex = scores.findIndex(player => player.username === playerName);
          console.log("Current Player Index:", currentPlayerIndex);

          if (currentPlayerIndex > 0) {
            const targetIndex = currentPlayerIndex - 1;
            console.log("Target Player index:", targetIndex);
            targetPlayer = scores[targetIndex].username;  // Using name as target
          } else {
            console.log("no target player");
            targetPlayer = null; // No target if in first place
          }
        }
        break;

      case "Torpedo":
        targetPlayer = prompt("Select a player to target:"); // Simplified for demonstration
        break;

      default:
        console.warn("Unknown item type:", usedItem);
        return;
    }

    // Send the item use event to the backend
    if (isConnected) {
      const sessionCode = sessionStorage.getItem("sessionCode");
      //if (usedItem == "Torpedo") {// display a modal}
      const message = {
        type: "item_use",
        sessionCode,
        item: usedItem,
        targetPlayer,
      };
      sendMessage(message);
      console.log("WebSocket Message Sent:", message);
    }

    // Remove the used item from the items array
    setItems((prevItems) => prevItems.filter((item) => item !== usedItem));
  };

  return (
    <Layout>
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game Play</h1>

      {/* Question Timer and Progress */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
        <div className="font-medium">
          Question {questionIndex + 1}
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
      
      {/* ChatBox */}
      <div className="fixed bottom-4 right-4 z-10">
        <ChatBox />
      </div>

      {/* ItemBox - Positioned above ChatBox */}
      <div className="fixed bottom-75 right-20 z-20"> 
        <ItemBox items={items} onUseItem={handleUseItem} />
      </div>
    </div>
  </Layout>
);
};

export default GamePlay;