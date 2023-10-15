Welcome to the ReviewD Repo

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and is run using the Netlify CLI.

## Setup Development Environment Guide

1. Make sure Node, Npm, and your IDE of choice is installed on your computer.
2. Clone this Github Repo.
4. Open a terminal and navigate to the repo folder on your computer.
3. Run `npm install`
    - If `node_modules` is already present in your project, please delete the folder before running this command.
    - If you are having trouble deleting your `node_modules` folder please kill the dev envronment, and if that doesn't work restart your computer.
4. Make sure you get the updated version of these file(s)
    - `.env.development`
5. Build cert files for SSL
    - Make sure you are in the repo directory and run `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`
    - You should just be able to leave all the questions blank, and after the command executes you should see a `key.pem` and `cert.pem` file in the repo directory.
6. Finally, start the development environment by running `npm run netlify`
7. Navigate to [https://localhost:8888](https://localhost:8888) to view it in the browser.

## Available Scripts:

In this project directory, you can run:

### `npm run netlify`

Runs the app in the development mode.\
Open [https://localhost:8888](https://localhost:8888) to view it in the browser.

This will also make the accompanying Netlify (Lambda) functions accessible at [https://localhost:3001](https://localhost:3001).
The page will reload if you make edits.

### `npm run stop`

Command for killing any npm processes in your terminal, may be required if receiving weird bugs when trying to run the development server.