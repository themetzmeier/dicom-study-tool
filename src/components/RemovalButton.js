import React from "react";
import { IoCloseCircleOutline, IoCloseCircleSharp } from "react-icons/io5";
import HoverButton from "./HoverButton";
import PropTypes from 'prop-types';

function RemovalButton ({ deleteObject, updateParent }) {

    return(
        <HoverButton 
            normalIcon={<IoCloseCircleOutline style={{ "transform": "scale(1.5)"}} />} 
            hoverIcon={<IoCloseCircleSharp style={{ "transform": "scale(1.5)"}} />} 
            updateObject={deleteObject} 
            type={"delete"} 
            updateParent={updateParent} 
        />
    );
};

RemovalButton.propTypes = {
    deleteObject: PropTypes.object,
    updateParent: PropTypes.func.isRequired
};  

export default RemovalButton;