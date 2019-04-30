# Grow Wave Web App [Almost Complete]

This repository contains all the magic associated with running Grow Wave's Web App.

## Prerequisites

1. Download and install Node.js and npm [here](https://nodejs.org/en/)
2. Firebase CLI
2. Install and initialise the Google Cloud SDK by following the instructions [here](https://cloud.google.com/sdk/docs/quickstart-windows).

Note: the Google account associated with the Grow Wave project is *chrisfalconi@growwave.ca*.

## Installation

1. Download this repository and navigate into it using a terminal.
2. Install the  Firebase Command Line Interface by following the instructions [here](https://codelabs.developers.google.com/codelabs/firestore-web/#3).
3. Install project dependecies by running ```npm install```.

## Updating the Web App

1. Modify the neccessary html, scss, and js files (bundle.css and bundle.js are auto-generated, do not touch them). 
2. Run ```npm start``` in the public directory to compile the modified code.
3. Run ```firebase deploy --only hosting``` to update the app online.


## Updating the Cloud the Functions

1. In the functions directory, modify ```index.js```
2. Run ```firebase deploy --only functions```.

## Monitoring Accounts/Units with Firebase

1. Log in to the [firebase console] (https://console.firebase.google.com) with the Grow Wave Google Account
2. Click on the Database tab to observe the database in realtime
3. Click on the accounts tab to view and manage the accounts that have been created on the Web App.
4. Click on function, then logs to view the activity logs from all the units and functions.

Pro Tip: use tha account ID in the accounts tab to identify which units belong to whom.

## To-Do 
1. WRITE STRONGER SECURITY RULES FOR THE DATABASE.
2. Determine a way to tell if the unit is online and if a command has been acknowledged and applied.

## Useful Resources

1. The Grow Wave's google account contains instruction manuals and ither documents.
