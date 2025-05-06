// src/pages/EditQuiz.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL;

const EditQuiz = () => {
  const { gameId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);



  const navigate = useNavigate();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`${API_URL}/games/${gameId}/retrieve/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title);
          setDescription(data.description);
          setQuestions(
            data.questions.map((q) => ({
              id: q.id,
              question: q.question_text,
              options: q.choices.map((c) => c.choice_text),
              answer: q.choices.findIndex((c) => c.is_correct),
              choiceIds: q.choices.map((c) => c.id),
            }))
          );
        } else {
          console.error('Failed to load game');
        }
      } catch (err) {
        console.error('Error fetching game:', err);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    if (field === 'question') {
      updated[index].question = value;
    } else {
      updated[index].options[field] = value;
    }
    setQuestions(updated);
  };

  const handleAnswerChange = (index, value) => {
    const updated = [...questions];
    updated[index].answer = parseInt(value);
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        answer: 0,
        choiceIds: [null, null, null, null],
      },
    ]);
  };

  const handleDeleteQuestion = (indexToDelete) => {
    setQuestions((prev) => {
      if (prev.length <= 1) return prev;
  
      const questionToDelete = prev[indexToDelete];
      if (questionToDelete.id) {
        setDeletedQuestionIds((prevDeleted) => [...prevDeleted, questionToDelete.id]);
      }
  
      return prev.filter((_, i) => i !== indexToDelete);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || questions.length === 0) {
      setModalMessage('Cannot save: a required field is empty.');
      setShowModal(true);
      return;
    }
    
    for (const q of questions) {
      if (!q.question.trim()) {
        setModalMessage('Cannot save: a question field is left empty.');
        setShowModal(true);
        return;
      }
      for (const option of q.options) {
        if (!option.trim()) {
          setModalMessage('Cannot save: a choice field is left empty.');
          setShowModal(true);
          return;
        }
      }
    }
    
    const newQuestions = questions.filter((q) => q.id == null);
  
    const payload = {
      updated_game: {
        title,
        description,
        is_public: false,     // toggle feature later
      },
      updated_questions: questions
        .filter(q => q.id != null)
        .map((q) => ({
          id: q.id,
          question_text: q.question,
        })),
      updated_choices: questions.flatMap((q) =>
      q.choiceIds.map((choiceId, i) => {
        if (choiceId == null) return null;
        return {
        id: choiceId,
        choice_text: q.options[i],
        is_correct: q.answer === i,
        };
      }).filter(Boolean)
      ),
      new_questions: newQuestions.map((q) => ({
        question_text: q.question,
        choices: q.options.map((option, i) => ({
          choice_text: option,
          is_correct: q.answer === i,
        })),
      })),
      deleted_questions: deletedQuestionIds,
    };
      
  
    try {
      const response = await fetch(`${API_URL}/games/${gameId}/update-game/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        navigate('/dashboard');
      } else {
        const err = await response.json();
        console.error('Update failed:', err);
      }
    } catch (error) {
      console.error('Error submitting update:', error);
    }
  };
  

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
            />
          </div>

          {questions.map((q, index) => (
            <div key={index} className="relative bg-gray-50 p-4 rounded-md border">
              <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
              <input
                type="text"
                value={q.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                placeholder="Enter the question"
                className="w-full mb-3 px-3 py-2 border rounded-md"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {q.options.map((option, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) => handleQuestionChange(index, i, e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  />
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <select
                value={q.answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
                <option value={3}>Option 4</option>
              </select>
              <button
                type="button"
                onClick={() => handleDeleteQuestion(index)}
                className="absolute top-2 right-2 text-red-600 text-xs hover:underline"
              >
                ✕
              </button>

            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={handleAddQuestion}>
              Add Question
            </Button>
            <Button 
            type="submit"
            variant="primary"
            disabled={questions.length === 0}
            className={questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Save Quiz
            </Button>
            <Button type="button" variant="danger" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md w-80 text-center">
            <p className="mb-4 text-gray-800">{modalMessage}</p>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              onClick={() => setShowModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EditQuiz;
