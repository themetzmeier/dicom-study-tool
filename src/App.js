import './App.css';
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Auth from "./Auth";
import Authentication from './pages/Authentication';

// Instantiate class for Authentication
const auth = new Auth();

function App() {
    let location = useLocation();

    // Start of Hook for mobile styling
    const isMobileThreshold = 768; // value in px
    const [isMobile, setIsMobile] = useState(window.innerWidth <= isMobileThreshold);
  
    function handleWindowSizeChange() {
        setIsMobile(window.innerWidth <= isMobileThreshold);
    }
  
    useEffect(() => {
        // Add Event Listener for resize of window
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            // Remove the Event Listener for resize of window when component finishes
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);
    // End of Hook for mobile styling

    return (
        <>
            <Navbar isMobile={isMobile} />
            <Routes>
                <Route exact path="/" element={<Home isMobile={isMobile} />} />
                {['/login/', '/register/', '/callback/', '/logout/'].map((path, index) => <Route key={index} exact path={path} element={<Authentication auth={auth} location={location} />} />)}
            </Routes>
            {/* <Footer /> */}
        </>
    );
}

export default App;
