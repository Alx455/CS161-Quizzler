import React, { useState } from "react";
import PropTypes from "prop-types";
import "./ItemBox.css";
import { useWebSocket } from "../../context/WebSocketContext";

const ItemBox = ({ items = [] }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const { sendMessage } = useWebSocket();

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleUseItem = () => {
    if (selectedItem) {
      // Send item use message through WebSocket
      sendMessage({
        type: "item_use",
        player_id: "123",  // Update with actual player ID
        item_type: selectedItem,
      });

      setSelectedItem(null); // Reset selection after use
    }
  };

  return (
    <div className="item-box">
      <h3>Your Items</h3>
      <div className="item-container">
        {items.length === 0 ? (
          <p>No items available</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className={`item ${selectedItem === item ? "selected" : ""}`}
              onClick={() => handleSelectItem(item)}
            >
              <div className="item-asset">{item}</div>
            </div>
          ))
        )}
      </div>

      <button
        className="use-item-button"
        onClick={handleUseItem}
        disabled={!selectedItem}
      >
        Use Item
      </button>
    </div>
  );
};

ItemBox.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ItemBox;
