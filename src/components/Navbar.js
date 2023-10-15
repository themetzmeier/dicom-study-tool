import React, { useState } from "react";
import { Link } from "react-router-dom";

const Logo = "https://reviewd-images.s3.us-east-2.amazonaws.com/brain.png";

export default function Navbar({ isMobile, currentProfile }) {
  const [isOpen, setIsOpen] = useState(false);

    const handleToggle =() => {
        if(isMobile) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <nav className="default-bcg card" style={{ "position": "fixed", "width": "99.15%", "zIndex": "3", "padding": "8px", "overflow": "hidden", "letterSpacing": "2px", "top": "0" }}>
            <div style={{ "display": "flex", "alignItems": "center", "paddingLeft": "16px" }}>
                <div style={{ "display": "flex", "alignItems": "center", }}>
                    <Link to="/" className='hidden-link' >
                        <img
                            src={Logo}
                            style={{ "maxWidth": "50px" }}
                            alt="Logo"
                        />
                    </Link>
                    <Link to="/" className='hidden-link' style={{ "marginLeft": "8px" }}>REVIEWD</Link>
                </div>
                <div style={{ "marginLeft": "auto", "display": "flex", "alignItems": "center", "height": "100%", "paddingRight": "16px" }}>
                    <Link to="/login" className="hidden-link" onClick={() => handleToggle()}>Login</Link>
                </div>
                
            </div>
        </nav>
    );
}