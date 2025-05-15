import React, { createContext, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [playerItems, setPlayerItems] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [sessionCode, setSessionCode] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [scores, setScores] = useState([]);
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
    stopPing();
  };

  /**
  * Start ping interval
  */
  const startPing = () => {
    stopPing();

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("Sending ping...");
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000); // Ping every 25 seconds
  };

  /**
   * Stop ping interval
   */
  const stopPing = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
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
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.warn("WebSocket is already open. Connection attempt aborted.");
        return;
      }

    const wsURL = `${WS_URL}/ws/session/${code}/?username=${username}`;
    console.log("Connecting to WebSocket:", wsURL);

    socketRef.current = new WebSocket(wsURL);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      // Start ping/pong mechanism
      startPing();

      
      sessionStorage.setItem("sessionCode", code);
      sessionStorage.setItem("playerName", username);
      sessionStorage.setItem("isHost", isHostFlag ? "true" : "false");

      setSessionCode(code);
      setPlayerName(username);
      setIsHost(isHostFlag);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socketRef.current.onclose = (event) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);

        setIsConnected(false);
        stopPing();
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
      case "pong":
        console.log("Received pong from server");
        break;
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
      case "question_broadcast":
        handleQuestionBroadcast(data);
        break;
      case "update_scores":
        handleUpdateScores(data);
        break;
      case "chat_message":
        handleChatMessage(data);
        break;
      case "player_items":
        handlePlayerItems(data);
        break;
      case "game_ended":
        handleGameEnded(data);
        break;
      case "item_used":
        handleItemUsed(data);
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
    //navigate("/dashboard");
  };

  /**
   * Handle player list
   */
  const handlePlayerList = (playersList) => {
    const storedUsername = sessionStorage.getItem("playerName");

    const player = playersList.find((p) => p.username === storedUsername);

    if (player) {
      sessionStorage.setItem("playerId", player.id);
    }

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
    const storedUsername = sessionStorage.getItem("playerName");

    // Set playerId if this is the current player
    if (username === storedUsername) {
      sessionStorage.setItem("playerId", player_id);
    }

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

    const storedSessionCode = sessionStorage.getItem("sessionCode");
    console.log("Starting game with session code:", storedSessionCode);
    navigate(`/game/${storedSessionCode}`);
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
   * Handle question broadcast
   */
  const handleQuestionBroadcast = (data) => {
    //console.log("Question Broadcast Received in Global WebSocketContext:", data);
    const { question_index, question_data } = data;

    sessionStorage.setItem("pendingQuestion", JSON.stringify({ question_index, question_data }));

    window.dispatchEvent(
      new CustomEvent("questionBroadcast", { detail: { question_index, question_data } })
    );
  };

  /**
   * Handle update scores
   */
  const handleUpdateScores = (data) => {
    const { scores } = data;
    console.log("Scores Updated:", scores);
    setScores(scores);
  };

  /**
   * Handle chat message
   */
  const handleChatMessage = (data) => {
    window.dispatchEvent(new CustomEvent("chatMessage", { detail: data }));
  };

  /**
   * Handle player items
   */
  const handlePlayerItems = (data) => {
    const { items } = data;
    console.log("Player Items Updated:", items);
    setPlayerItems(items);
  };

  /**
   * Handle item used
   */
  const handleItemUsed = (data) => {
    const { item_type, player_id, target_id, source_username, target_username } = data;
    console.log(`Item Used: ${item_type}, Source: ${source_username}, Target: ${target_username}`);

    window.dispatchEvent(
      new CustomEvent("itemUsed", {
        detail: {
          item_type,
          player_id,
          target_id,
          source_username,
          target_username,
        },
      })
    );
  };


  /**
   * Handle game ended
   */
  const handleGameEnded = (data) => {
    console.log("Game Ended:", data);
    const { scores } = data;

    window.dispatchEvent(
      new CustomEvent("gameEnded", { detail: { scores } })
    );
  };

  /**
   * Context value
   */
  return (
    <WebSocketContext.Provider value={{ connectWebSocket, sendMessage, disconnectWebSocket, players, isConnected, isHost, scores, playerName, playerItems }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => React.useContext(WebSocketContext);
