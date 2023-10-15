import { WebAuth } from "auth0-js";
import jwtDecode from "jwt-decode";

export default class Auth {
    // Create Auth0 Web Auth Object 
    webAuth = new WebAuth({
        domain: process.env.REACT_APP_AUTH0_DOMAIN,
        clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
        redirectUri: `${process.env.REACT_APP_BASE_URL}/callback`,
        audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
        issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}`,
        responseType: "token id_token",
        scope: "openid email profile",
    });

    constructor() {
        //Bind Login function, allowing you to use this class outside of this class.
        this.login = this.login.bind(this);
    }
    
    login(location) {
        // Check to see if url is register or just normal login
        if(location && location.split("/").length > 1 && location.split("/")[location.split("/").length - 1] === "register") {
            // Redirect Auth0 to Register/Signup page
            this.webAuth.authorize({ action: "signup" });
        } else {
            // Direct Auth0 to Login page
            this.webAuth.authorize();
        }
    }
    
    handleAuthentication() {
        try {
            // Parse Auth0 Web Auth Hash Response
            this.webAuth.parseHash((err, authResults) => {
                // Check for proper response
                if(authResults && authResults.accessToken && authResults.idToken) {
                    // Set class variables based on results
                    this.accessToken = authResults.accessToken;
                    this.idToken = authResults.idToken;
                    this.expiresAt = authResults.expiresIn * 1000 + new Date().getTime();

                    // Remove hash from uri
                    window.location.hash = "";

                    return true;
                } else if (err) {
                    // console.log(err);
                    return false;
                }
            });
          return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    isAuthenticated() {
        // Check to see if Auth Token is expired or not
        return new Date().getTime() < this.expiresAt;
    }
    
    async renewTokens() {
        // Promise to renew tokens from Auth0
        return new Promise((resolve) => {
            // Check to see if Auth0 Web Auth session is still valid
            this.webAuth.checkSession({}, (err, authResult) => {
                // If it is still valid, check for proper response
                if (authResult && authResult.accessToken && authResult.idToken) {
                    // Set class variables based on results
                    this.accessToken = authResult.accessToken;
                    this.idToken = authResult.idToken;
                    this.expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

                    // Resolve Promise
                    resolve(true)
                } else if (err) {
                    console.log(err);
                    resolve(false);
                }
            });
        });
    }
    
    getProfile() {
        // If there is a current id token
        if (this.idToken) {
            // Decode JWT token
            return jwtDecode(this.idToken);
        } else {
            return false;
        }
    }
    
    logout() {
        // Redirect to Auth0 Logout endpoint after 1 second
        setTimeout(() => {
            window.location.href = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/v2/logout?returnTo=${process.env.REACT_APP_BASE_URL}/&client_id=${process.env.REACT_APP_AUTH0_CLIENT_ID}`;
        }, 1000);
    }
}
