*No longer maintained. For demonstration purposes only.*

# Grow Wave Web App 

This repository contains all the magic associated with running Grow Wave's Web App.


## Prerequisites

1. Install Node.js (bundled with npm) from [here](https://nodejs.org/en/).
2. Install the Firebase Command Line Interface from [here](https://firebase.google.com/docs/cli#install_the_firebase_cli) and log in to the Grow Wave  Google account.

## Installation

1. Clone this repository by running the following commands:

   ```git clone https://gitlab.com/grow-wave/web-app```

   ```cd web-app```

2. Install the dependecies required for the app by running the following commands:

   ```cd public```

   ```npm install```

## Updating the App

All the files related to the App's behavior are located in the ```public``` folder.

Modify ```.html```, ```.scss```, and ```.js``` files as needed. (```bundle.css``` and ```bundle.js``` are auto-generated, do not touch them). 

Run ```npm test``` in the ```public``` directory in order to view your changes in a realtime, local server.

When you are ready to deploy the app online, run ```npm compile``` to compile the code  for deployment.

In the root directory, run ```firebase deploy --only hosting``` to publish the app to the internet.


## Updating the Cloud the Functions

All the files related the the app's Cloud Functions are located in the ```functions``` folder.

Modify ```index.js``` as needed tp updated the cloud functions.

In the root directory, run ```firebase deploy --only functions``` to publish the functions online.

## Monitoring Accounts/Units with Firebase

1. Log in to the [firebase console](https://console.firebase.google.com) with the Grow Wave Google account.
2. Click on the Database tab to observe the database in realtime.
3. Click on the Authentification tab to view and manage the users that have created an account.
4. Click on the Functions tab, then logs to view the activity logs from all Grow Wave units.

Pro Tip: use the user ID in the Authentification tab to identify which units belong to whom in the Database tab.

## To-Do 
1. WRITE STRONGER SECURITY RULES FOR THE DATABASE.
2. Determine a way to tell if the unit is online and if a command has been acknowledged and applied.

## Useful Resources

1. The Grow Wave's Google account contains instruction manuals and other documents.
