import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../context/WebSocketContext";

const ChatBox = () => {
  const { sendMessage, isConnected } = useWebSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const playerName = sessionStorage.getItem("playerName");

  useEffect(() => {
    const handleChatMessage = (e) => {
      const { username, message } = e.detail;
      setMessages((prev) => [...prev, { username, message }]);
    };

    window.addEventListener("chatMessage", handleChatMessage);

    return () => {
      window.removeEventListener("chatMessage", handleChatMessage);
    };
  }, []);

  const handleSendMessage = () => {
    if (!message.trim() || !isConnected) return;

    const chatMessage = {
      type: "chat_message",
      username: playerName,
      message,
    };

    sendMessage(chatMessage);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-16 right-4 w-80 bg-white shadow-lg rounded-lg p-4 z-50">
      <div className="h-70 overflow-y-scroll mb-1 border-b border-gray-300 max-h-64 pr-2">
        {messages.map((msg, index) => {
          const isOwn = msg.username === playerName;
          return (
            <div
              key={index}
              className={`mb-2 text-sm flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
             <div
  className={`px-3 py-2 rounded-lg break-words whitespace-pre-wrap w-fit max-w-[75%] ${
    isOwn
      ? "bg-indigo-100 text-indigo-800 self-end"
      : "bg-gray-200 text-gray-800 self-start"
  }`}
>

                {!isOwn && <strong className="block mb-0.5">{msg.username}</strong>}
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 p-2 rounded-lg"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg ml-2"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;

