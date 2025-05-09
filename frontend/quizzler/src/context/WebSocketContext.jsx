import React, { createContext, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionCode, setSessionCode] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const navigate = useNavigate();
  const WS_URL = import.meta.env.VITE_WS_URL;


  const clearSessionData = () => {
    sessionStorage.removeItem("sessionCode");
    sessionStorage.removeItem("playerName");
    sessionStorage.removeItem("isHost");
    sessionStorage.removeItem("gameId");
    setPlayers([]);
    setIsConnected(false);
    setSessionCode(null);
    setPlayerName(null);
    setIsHost(false);
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      console.log("Manually disconnecting WebSocket...");
      socketRef.current.close();
    }
  };

  /**
   * Establish WebSocket connection
   */
  const connectWebSocket = (code, username, isHostFlag = false) => {
    if (!code || !username) {
      console.warn("WebSocket connection aborted: Missing sessionCode or playerName");
      return;
    }

    const wsURL = `${WS_URL}/ws/session/${code}/?username=${username}`;
    console.log("Connecting to WebSocket:", wsURL);

    socketRef.current = new WebSocket(wsURL);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setSessionCode(code);
      setPlayerName(username);
      setIsHost(isHostFlag);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socketRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
      
        if (event.code !== 1000) {
          clearSessionData();
          navigate("/dashboard");
        }
      };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };


  /**
   * Handle WebSocket messages
   */
  const handleWebSocketMessage = (data) => {
    const { type } = data;

    switch (type) {
      case "session_ended":
        handleSessionEnded();
        break;
      case "player_list":
        handlePlayerList(data.players);
        break;
      case "player_joined":
        handlePlayerJoined(data);
        break;
      case "game_started":
        handleGameStarted(data);
        break;
      default:
        console.warn("Unhandled WebSocket message type:", type);
    }
  };

  /**
   * Handle session ended
   */
  const handleSessionEnded = () => {
    console.log("Session ended by host. Redirecting to dashboard...");
    clearSessionData();
    navigate("/dashboard");
  };

  /**
   * Handle player list
   */
  const handlePlayerList = (playersList) => {
    setPlayers(playersList.map((p) => ({
      id: p.id,
      name: p.username,
    })));
  };

  /**
   * Handle player joined
   */
  const handlePlayerJoined = (data) => {
    const { player_id, username } = data;
    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === player_id);
      return exists ? prev : [...prev, { id: player_id, name: username }];
    });
  };

    /**
   * Handle game start
   */
  const handleGameStarted = (data) => {
    const { game_id } = data;
    sessionStorage.setItem("gameId", game_id);
    navigate(`/game/${sessionCode}`);
  };

  /**
   * Send message through WebSocket
   */
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent:", message);
    }
  };

  /**
   * Context value
   */
  return (
    <WebSocketContext.Provider value={{ connectWebSocket, sendMessage, disconnectWebSocket, players, isConnected, isHost }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => React.useContext(WebSocketContext);
