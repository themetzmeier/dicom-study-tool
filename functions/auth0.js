const express = require("express");
const serverless = require("serverless-http");
const ManagementClient = require('auth0').ManagementClient;

let app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use((req, res, next) => {
    let header = process.env.REACT_APP_BASE_URL;
    res.append(
        "Access-Control-Allow-Origin",
        header
    );
    res.append(
        "Access-Control-Allow-Methods",
        "GET,POST"
    );
    res.append(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );
    next();
});
let router = express.Router();

router.post("/update-profile", async (req, res) => {
    // Get request data
    let body = req.body.data;

    // Get userId from request data
    let userId = body.userId;
    console.log(`Updating User ${userId}`);

    // Get updated metadata from request data
    let updatedMetaData = body.updatedMetaData;

    // Get access token from request data
    let accessToken = body.accessToken;
    
    // Try to open Management Client connection and update user's metadata
    try {
        // Open new Auth0 Management Client Connection
        let management = new ManagementClient({
            token: accessToken,
            domain: process.env.REACT_APP_AUTH0_DOMAIN,
            clientId: process.env.REACT_APP_AUTH0_BACKEND_CLIENT_ID,
            clientSecret: process.env.REACT_APP_AUTH0_BACKEND_CLIENT_SECRET
        });

        // Update User Metadata through Auth0 Management Connection
        management.updateUserMetadata({ "id": userId }, updatedMetaData, async (err, user) => {
            if (err) {
                console.log(err);
                res.status(500);
                res.send();
            }
          
            // Return the updated user to client
            res.send(user);
        });
    } catch(error) {
        console.log(error);
        res.status(500);
        res.send();
    }
});

//console.log(`Listening on port ${port}.`);
//app.listen(port);
app.use("/.netlify/functions/auth0", router);

module.exports.handler = serverless(app);