import React, { useState } from "react";
import PropTypes from 'prop-types';

function HoverButton ({ normalIcon, hoverIcon, updateObject, type, updateParent, style }) {
    const [isHovered, setHovered] = useState(false);

    return(
        <button 
            onClick={() => {
                if(updateObject && type) {
                    updateParent(updateObject, type)
                } else {
                    updateParent();
                }
            }} 
            className="hidden-btn" 
            style={{ "display":"flex", "justifyContent":"center", "alignItems":"center", "marginLeft": "8px", "marginTop": "3px", ...style }} 
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        >
            {!isHovered ?(normalIcon) : (hoverIcon)}
        </button>
    );
};

HoverButton.propTypes = {
    normalIcon: PropTypes.element.isRequired,
    hoverIcon: PropTypes.element.isRequired,
    updateObject: PropTypes.object,
    type: PropTypes.string,
    updateParent: PropTypes.func.isRequired,
    style: PropTypes.object
};  

export default HoverButton;