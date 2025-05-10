import React, { useRef, useState, useEffect } from "react";

const WS_URL = import.meta.env.VITE_WS_URL;

const WebSocketTest = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [log, setLog] = useState([]);
  const pingIntervalRef = useRef(null);

  const connectWebSocket = () => {
    const sessionCode = "3RA1QP";
    const username = "test1";
    const wsURL = `${WS_URL}/ws/session/${sessionCode}/?username=${username}`;

    logMessage(`Connecting to WebSocket: ${wsURL}`);
    socketRef.current = new WebSocket(wsURL);

    socketRef.current.onopen = () => {
      logMessage("WebSocket connected");
      setIsConnected(true);

      // Start ping/pong mechanism
      startPing();
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "pong") {
        logMessage("Received pong from server");
      } else {
        logMessage(`Message received: ${event.data}`);
      }
    };

    socketRef.current.onclose = (event) => {
      logMessage(`WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
      setIsConnected(false);
      stopPing();
    };

    socketRef.current.onerror = (error) => {
      logMessage(`WebSocket error: ${error.message}`);
    };
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      logMessage("Manually disconnecting WebSocket...");
      socketRef.current.close();
    }
    stopPing();
  };

  const startPing = () => {
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        logMessage("Sending ping...");
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000); // Send ping every 25 seconds
  };

  const stopPing = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const logMessage = (message) => {
    const timestamp = new Date().toISOString();
    setLog((prevLog) => [...prevLog, `[${timestamp}] ${message}`]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>WebSocket Test Page</h2>
      <div>
        <button onClick={connectWebSocket} disabled={isConnected}>Connect</button>
        <button onClick={disconnectWebSocket} disabled={!isConnected}>Disconnect</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Log:</h3>
        <div style={{ background: "#f0f0f0", padding: "10px", maxHeight: "300px", overflowY: "scroll" }}>
          {log.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;
