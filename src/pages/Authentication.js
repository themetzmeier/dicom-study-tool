import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

function Authentication({ auth, location }) {
    const [currentProfile, setCurrentProfile] = useState('');

    let pathname = location.pathname;

    // Check if user is already authenticated with Auth0
    let authenticated = auth.isAuthenticated();

    useEffect(() => {
        //Check for authenticated being true and callback route is hit
        if(authenticated && pathname === "/callback") {
            setCurrentProfile(auth.getProfile());
            //NEED to setup redirect route
        }
    }, [authenticated, pathname, auth]);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Polymorphism to handle callback, logout, and login uri all with this page.
        if(pathname === "/callback") {
            // Set title of webpage
            document.title = "Login";
            // Check to see if user actually authenticated with Auth0
            let authSuccess = auth.handleAuthentication();

            // If not authenticated redirect back to login page
            if(!authSuccess) {
                window.location.pathname = "/login/"
            }
        } else if (pathname === "/logout") {
            // Set title of webpage
            document.title = "Logout";

            // Auth0 Logout
            auth.logout();
        } else if (pathname === "/login" || pathname === "/register") {
            // Set title of webpage
            document.title = "Login";

            // Attempt Auth0 Login
            auth.login(window.location.href);
        }
    }, [pathname, auth]);

    return (
        <div className='container'>
            <div className='content' style={{ "textAlign": "center" }}>
                {currentProfile ? (
                    <p>
                        Hello {currentProfile.email}, you have been successfully
                        logged in! If you are not automatically redirected{" "}
                        <Link to="/forecast">Click here</Link>.
                    </p>
                ) : pathname === "/logout" ? (
                    <p>You are being logged out please wait for this page to redirect!</p>
                ) : (
                    <p>You are being securely logged in.</p>
                )}
            </div>
        </div>
    );
}

Authentication.propTypes = {
    auth: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default Authentication;