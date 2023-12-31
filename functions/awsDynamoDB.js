const express = require("express");
const serverless = require("serverless-http");
const AWS = require('aws-sdk');
const { expressjwt: jwt } = require('express-jwt');
const { expressJwtSecret } = require('jwks-rsa');
AWS.config.update({ signatureVersion: 'v4', accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY, secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY, region: process.env.REACT_APP_AWS_REGION });
const ddb = new AWS.DynamoDB.DocumentClient();

let app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
    res.append(
        "Access-Control-Allow-Headers",
        "Authorization"
    );
    next();
});
app.use(
    jwt({
        secret: expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
        }),
        issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
        audience: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/`,
        algorithms: ['RS256']
    })
);
let router = express.Router();

router.post("/get-state", async (req, res) => {
    let body = req.body.data;

    ddb.query({ KeyConditionExpression: "#id = :id", TableName: process.env.REACT_APP_AWS_TABLE_STATES, ExpressionAttributeNames: { "#id": "id" }, ExpressionAttributeValues: { ":id": body.id } }).promise().then(async (data) => {
        // console.log(data.Items);
        res.send(data.Items);
    }).catch((error) => {
        res.status(500);
        res.end(`Error: ${error}`);
        console.log(error);
    });
});

router.post("/add-state", async (req, res) => {
    let body = req.body.data;
    let dicomState = JSON.parse(body.dicomState);
    
    ddb.put({ TableName: process.env.REACT_APP_AWS_TABLE_STATES, Item: dicomState }).promise().then(async (data) => {
        res.send(data);
    }).catch((error) => {
        res.status(500);
        res.end(`Error: ${error}`);
        console.log(error);
    });
});

router.post("/get-activities", async (req, res) => {
    let body = req.body.data;
    ddb.query({ KeyConditionExpression: "#userId = :userId", TableName: process.env.REACT_APP_AWS_TABLE_ACTIVITIES, ExpressionAttributeNames: { "#userId": "userId" }, ExpressionAttributeValues: { ":userId": body.userId } }).promise().then(async (data) => {
        res.send(data.Items);
    }).catch((error) => {
        res.status(500);
        res.end(`Error: ${error}`);
        console.log(error);
    });
});

router.get("/get-public-activities", async (req, res) => {
    ddb.scan({ TableName: process.env.REACT_APP_AWS_TABLE_ACTIVITIES }).promise().then(async(data) => {
        // console.log(data.Items);
        let databaseItems = data.Items;
        if(databaseItems && databaseItems.length > 0) {
            databaseItems = databaseItems.filter((item) => item.private == false);
        }
        res.send(databaseItems);
    }).catch((error) => {
        res.status(500);
        res.end(`Error: ${error}`);
        console.log(error);
    });
});

router.post("/add-activity", async (req, res) => {
    let body = req.body.data;
    let dicomActivity = body.dicomActivity;
    
    ddb.put({ TableName: process.env.REACT_APP_AWS_TABLE_ACTIVITIES, Item: dicomActivity }).promise().then(async (data) => {
        res.send(data);
    }).catch((error) => {
        res.status(500);
        res.end(`Error: ${error}`);
        console.log(error);
    });
});

//console.log(`Listening on port ${port}.`);
//app.listen(port);
app.use("/.netlify/functions/awsDynamoDB", router);

module.exports.handler = serverless(app);