import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./ItemBox.css";
import Torpedo from "../../assets/items/Torpedo.png";
import Cannon from "../../assets/items/Cannon.png";
import Shield from "../../assets/items/Shield.png";

const itemAssets = {
  Torpedo: Torpedo,
  Cannon: Cannon,
  Shield: Shield,
};

const ItemBox = ({ items = [], onUseItem }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const itemBoxRef = useRef(null);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleUseItem = () => {
    if (selectedItem) {
      onUseItem(selectedItem);
      setSelectedItem(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemBoxRef.current && !itemBoxRef.current.contains(event.target)) {
        setSelectedItem(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="item-box" ref={itemBoxRef}>
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
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <img src={itemAssets[item]} alt={item} className="item-asset" />
              {hoveredItem === item && <div className="tooltip">{item}</div>}
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
  onUseItem: PropTypes.func.isRequired,
};

export default ItemBox;
