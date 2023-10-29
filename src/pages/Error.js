import React from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

let errorImg = "https://reviewd-images.s3.us-east-2.amazonaws.com/brain_exploding.png";

function Error({ isMobile, text }) {
    let displayText = 'that page could not be found';
    if(text) {
        displayText = text;
    } else {
        document.title = 'Oops...'
    }

    return (
        <div className="container">
            <div className="card card-padding" style={{ "display": "flex", "justifyContent": "center" }}>
                <div>
                    <img style={{"width":"400px"}} src={errorImg} alt='404 Page not found' />
                    <h2><b>Hmmm, {displayText}...</b></h2>
                    <div style={{ "width": "100%", "textAlign": "center" }}>
                        <Link to="/">
                            <button className="button">
                                Back to Home
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

Error.propTypes = {
    isMobile: PropTypes.bool,
    text: PropTypes.string,
};
  
export default Error;