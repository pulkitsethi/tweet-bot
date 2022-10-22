# Tweet Bot

Twitter does not allow you to tweet the exact same message. The code adds a unique ID to the end of message created, which allows you to tweet the exact same message (plus an ID) over and over again.

Originally used it for a contest that counted tweets with a particular hash tag, but could be used to tweet out the same message if needed.

# Installation

Dependencies:
- Node.js
- MongoDB - for user data

Clone or download this repository on your local environment.

# Config Files

There are configuration files under the config folder. 

1. Insert twitter client ID and client secret to config.js. You will need to register your app with Twitter and obtain client ID and client secret.
2. Insert mongoDB connection strings to services.js.
3. In app.js, change the message to be tweeted. It is defined in a variables named "tweet".

# How to Run

1. Open a terminal window and go to the root directory of the local repository
2. Run `node app`. You should see it running 
3. Open a browser and go to `http://localhost:3000`
5. Click the "Sign in with Twitter". This will take you to the twitter log in page. Enter your twitter credentials. It should redirect you back to the app and the user should see thier name on the page.
6. Click 'Send Tweet' to send out the message.
