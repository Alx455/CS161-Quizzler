// src/pages/GamePlay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ChatBox from '../components/layout/ChatBox';
import ItemBox from '../components/layout/ItemBox';
import SelectTargetModal from '../components/layout/SelectTargetModal';
import { useWebSocket } from "../context/WebSocketContext";


const API_URL = import.meta.env.VITE_API_URL;

const GamePlay = () => {
  const timerRef = useRef(null);
  const { sessionCode } = useParams();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);

  const NOTIFICATION_TIMEOUT = 5000; // 5 seconds




  const { sendMessage, isConnected, disconnectWebSocket, scores, playerName, playerItems } = useWebSocket();
  const navigate = useNavigate();

  //const [items, setItems] = useState(["Cannon", "Shield"]);

  // Retrieve player items with player ID
  const playerId = sessionStorage.getItem("playerId");
  const items = playerItems[playerId] || [];


  
  
  



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




    const handleItemUsed = (e) => {
      const { item_type, player_id, target_id, source_username, target_username } = e.detail;
      console.log(`Item Used: ${item_type}, Source: ${source_username}, Target: ${target_username}`);
      const storedUsername = sessionStorage.getItem("playerName");
  
      let message = "";
      let type = "info";
  
      if (source_username === storedUsername && target_username) {
        message = `You used ${item_type} on ${target_username}`;
      } 
      else if (target_username === storedUsername) {
        message = `${source_username} used ${item_type} on you!`;
        type = "warning";
      } 
      else if (source_username === storedUsername && !target_username) {
        message = `You used ${item_type}`;
      }
  
      if (message) {
        console.log(`Notification: ${message}`);
      }
    };
    window.addEventListener("itemUsed", handleItemUsed);


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

    if (usedItem === "Torpedo") {
      setShowTargetModal(true);
      return;  // Do not proceed with WebSocket message yet
    }

    let targetPlayer = null;
    console.log("Scores Array:", scores);
    console.log("Current Player Name:", playerName);

    switch (usedItem) {
      case "Shield":
        targetPlayer = playerName;
        break;

      case "Cannon":
        if (scores.length > 0) {
          const sortedScores = [...scores].sort((a, b) => b.score - a.score);
          const currentPlayerIndex = sortedScores.findIndex(player => player.username === playerName);

          if (currentPlayerIndex > 0) {
            targetPlayer = sortedScores[currentPlayerIndex - 1].username;
          }
        }
        break;

      default:
        console.warn("Unknown item type:", usedItem);
        return;
    }

    sendItemUseMessage(usedItem, targetPlayer);
  };


  /**
   * Send WebSocket Message for Item Use
   */
  const sendItemUseMessage = (item, target) => {
    if (isConnected) {
      const sessionCode = sessionStorage.getItem("sessionCode");

      console.log("Preparing to send item use message:");
      console.log("Session Code:", sessionCode);
      console.log("User:", playerName);
      console.log("Item:", item);
      console.log("Target:", target);
      const message = {
        type: "item_use",
        sessionCode,
        user: playerName,
        item,
        target,
      };

      sendMessage(message);
      console.log("WebSocket Message Sent:", message);
    }
  };

  /**
   * Handle Target Selection for Torpedo
   */
  const handleSelectTarget = (targetPlayer) => {
    setShowTargetModal(false);

    if (targetPlayer) {
      console.log(`Target selected for Torpedo: ${targetPlayer}`);
      sendItemUseMessage("Torpedo", targetPlayer);
    } else {
      console.log("No target selected.");
    }
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

      {showTargetModal && (
          <SelectTargetModal
            players={scores}
            currentPlayer={playerName}
            onSelect={handleSelectTarget}
            onClose={() => setShowTargetModal(false)}
          />
        )}
    </div>
  </Layout>
);
};

export default GamePlay;