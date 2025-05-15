// src/components/layout/SelectTargetModal.jsx
import React from 'react';

const SelectTargetModal = ({ players, currentPlayer, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-64">
        <h3 className="text-xl font-bold mb-4">Select Target</h3>
        <div className="space-y-2">
          {players.map((player, index) => (
            <button
              key={index}
              disabled={player.username === currentPlayer}
              className={`w-full p-2 rounded ${
                player.username === currentPlayer ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
              onClick={() => onSelect(player.username)}
            >
              {player.username}
            </button>
          ))}
        </div>
        <button
          className="mt-4 w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SelectTargetModal;
