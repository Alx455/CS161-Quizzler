// src/pages/GamePlay.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const GamePlay = () => {
  const { id: gameId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  // In a real app, this would be handled via WebSockets
  useEffect(() => {
    // Simulate loading a question
    const mockQuestion = {
      id: 1,
      text: "What is the capital of France?",
      options: [
        { id: 'a', text: 'London' },
        { id: 'b', text: 'Berlin' },
        { id: 'c', text: 'Paris' },
        { id: 'd', text: 'Rome' }
      ],
      timeLimit: 20
    };
    
    setCurrentQuestion(mockQuestion);
    setTimeRemaining(mockQuestion.timeLimit);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleSelectAnswer = (answerId) => {
    if (isAnswerSubmitted || timeRemaining === 0) return;
    
    setSelectedAnswer(answerId);
    setIsAnswerSubmitted(true);
    
    // In a real app, we would send this to the server
    console.log(`Answer submitted: ${answerId}`);
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header with question counter and timer */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
          <div className="font-medium">
            Question {questionNumber} of {totalQuestions}
          </div>
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
            {timeRemaining} seconds
          </div>
        </div>
        
        {/* Question */}
        {currentQuestion && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-6">{currentQuestion.text}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedAnswer === option.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } ${isAnswerSubmitted || timeRemaining === 0 ? 'pointer-events-none' : ''}`}
                  disabled={isAnswerSubmitted || timeRemaining === 0}
                >
                  <span className="font-medium">{option.id.toUpperCase()}</span>. {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Status message */}
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