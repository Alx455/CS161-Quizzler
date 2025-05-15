import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../context/WebSocketContext";

const ChatBox = () => {
    const { sendMessage, isConnected } = useWebSocket();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
  
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
        username: sessionStorage.getItem("playerName"),
        message,
      };
  
      sendMessage(chatMessage);
      setMessage("");
    };
  
    return (
      <div className="fixed bottom-16 right-4 w-80 bg-white shadow-lg rounded-lg p-4 z-50">
        <div className="h-70 overflow-y-scroll mb-1 border-b border-gray-300">
          {messages.map((msg, index) => (
            <div key={index} className="text-sm mb-1">
              <strong>{msg.username}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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