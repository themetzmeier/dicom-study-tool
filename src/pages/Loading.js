import React from "react";
import PropTypes from 'prop-types';

function Loading({ isMobile, text, override }) {
    return (
        <div className="container" >
            <div className="content" >
                <div style={{ "maxWidth": "650px", "marginTop": "25vh" }}>
                    {override ? (
                        <h3>{override}</h3>
                    ) : (
                        <h3>Loading {text}...</h3>
                    )}
                </div>
            </div>
        </div>
    );
}

Loading.propTypes = {
    isMobile: PropTypes.bool,
    text: PropTypes.string,
    override: PropTypes.string
};
  
export default Loading;