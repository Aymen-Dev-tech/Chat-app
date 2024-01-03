# Chat app

A Real time Chatting app using socket.io and express/node.js

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites
If you are planing to run this project localy you need: 
```
Node.js at least v18
Google console account 
Facbook Developer tool account 
Hosted DB in Atlas 
```
Setup a .env file at the root level of your projet and specify these variables (PORT, URI(atlas),  FB_APP_ID, FB_APP_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, JWT_SECRET) 

### Running
Clone the repository 
```
~ git clone https://github.com/Aymen-Dev-tech/Chat-app.git
```
Navigate to the project directory
```
~ cd Chat-app
```

Start the server 
```
~ npm i && npm run startDev
```

## Built With

* [Node.js](https://nodejs.org/en) - JavaScript runtime environment
* [Express.js](https://expressjs.com/) -  Minimalist web framework for Node.js
* [Passport.js](https://www.passportjs.org/) - Used to authentication
* [MongoDB](https://www.passportjs.org/) - Used to authentication

## Authors

* **Aymen Bounnah** - [Aymen-Dev-tech](https://github.com/Aymen-Dev-tech)
