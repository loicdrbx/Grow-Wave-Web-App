// Import the Firebase SDK for Google Cloud Functions.
const functions = require('firebase-functions');

// Import and initialize the Firebase Admin SDK
// with our firebase service account credentials 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Import IoT core Service account credentials
serviceAccount = require('./serviceAccount.json');

// Create a reference to our Realtime Database
const db = admin.database();

// Google APIs needed to update device configuration
const  {google} = require('googleapis');

// Device configuration constants
const VERSION = 0;
const REGION = 'us-central1';
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const REGISTRY = 'gw-registry';
const API_VERSION = 'v1';
const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';

/**
 * Update Realtime Database with any data that 
 * our pubsbub topic revieces from a gwave unit
 */
exports.receiveTelemetry = functions.pubsub
  .topic('gw-topic')
  .onPublish((message) => {
    // Get sender's deviceId and parse its message into a JSON object
    const deviceId = message.attributes.deviceId;
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    console.log("Data recieved from " + deviceId + ":\n" + message.data);
    // Update database with recieved data
    return db.ref(`/devices/${deviceId}`).update(data);
});

/** Update device configuration when data is updated on the app */
exports.updateDeviceConfig = functions.https.onRequest((req, res) => {
  // Extract update information from request
  const reqBody = JSON.parse(req.body);
  const setting = Object.keys(reqBody)[0];
  const data = reqBody[setting];
  const deviceId = reqBody["deviceId"];
  const device_name = `projects/${PROJECT_ID}/locations/${REGION}/registries/${REGISTRY}/devices/${deviceId}`;
  // Create new configruation
  var newConfig = new Object();
  newConfig[setting] = data;
  newConfig = JSON.stringify(newConfig);
  const binaryData = Buffer.from(newConfig).toString('base64');
  // Construct update request for IoT core
  const request = {
    name: device_name,
    version_to_update: VERSION,
    binary_data: binaryData
  };
  // Send device configuration update through IoT Core
  getIoTClient(serviceAccount, (client) => {
    client.projects.locations.registries.devices.modifyCloudToDeviceConfig(request,
      (err, data) => {
        if (err) {
          console.log('Message: ', err);
          res.status(500).send(err);
        } else {
          res.status(200).send('Successuly updated device');
        }
      });
  });
});

/**
 * Returns an authorized API client by discovering the Cloud 
 * IoT Core API with the provided API key.
 */
function getIoTClient (serviceAccountJson, cb) {
  return google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  }).then(authClient => {
    const discoveryUrl =`${DISCOVERY_API}?version=${API_VERSION}`;
    google.options({
      auth: authClient
    });

    return google.discoverAPI(discoveryUrl).then((client) => {
       return cb(client);
    }).catch((err) => {
      console.log('Error during API discovery.', err);
    });
  }).catch((err) => {
    console.log('Error', err);
  });
}
