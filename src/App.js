import './App.css';
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Auth from "./Auth";
import User from "./User";
import Authentication from './pages/Authentication';
import Profile from './pages/Profile';
import { updateProfile as updateAuth0Profile } from "./utils/utils.js";
import Error from './pages/Error';

// Instantiate class for Authentication
const auth = new Auth();

function App() {
    const [authenticated, setAuthenticated] = useState(auth.isAuthenticated());
    const [currentProfile, setCurrentProfile] = useState(null);

    useEffect(() => {
        if(authenticated && auth.getProfile()) {
            let profile = auth.getProfile();
            Object.assign(profile, { "accessToken": auth.accessToken });
            // console.log(profile);

            createProfile(profile);
        } else {
            auth.renewTokens().then((response) => {
                if(response) {
                    setAuthenticated(auth.isAuthenticated());
                }
            });
        }
    }, [authenticated]);


    const createProfile = (profile) => {
        let newCurrentProfile = new User(profile);
        // console.log(newCurrentProfile);

        setCurrentProfile(newCurrentProfile);
    };

    const updateProfile = async (profileChanges) => {
        let updatedProfile = await updateAuth0Profile(profileChanges, currentProfile);
        // console.log(updatedProfile);

        createProfile(updatedProfile);
    };


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
            <Navbar currentProfile={currentProfile} isMobile={isMobile} />
            <Routes>
                <Route exact path="/" element={<Home isMobile={isMobile} />} />
                <Route exact path="/profile" element={<Profile isMobile={isMobile} currentProfile={currentProfile} setCurrentProfile={updateProfile} />} />
                {['/login/', '/register/', '/callback/', '/logout/'].map((path, index) => <Route key={index} exact path={path} element={<Authentication auth={auth} location={location} />} />)}
                <Route path="*" element={<Error isMobile={isMobile} />} />
            </Routes>
            {/* <Footer /> */}
        </>
    );
}

export default App;
