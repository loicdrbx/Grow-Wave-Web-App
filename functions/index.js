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

/** Update device configuration when data is written to firebase */
exports.updateConfig = functions.database.ref('/devices/{deviceId}/{setting}')
  .onUpdate((change, context) => {
    
    if (context.authType === 'USER') {
      const data = change.after.val();
      const setting = context.params.setting;
      const deviceId = context.params.deviceId;
      const device_name = `projects/${PROJECT_ID}/locations/${REGION}/registries/${REGISTRY}/devices/${deviceId}`;

      var newConfig = new Object();
      newConfig[setting] = data;
      newConfig = JSON.stringify(newConfig);

      const binaryData = Buffer.from(newConfig).toString('base64');

      const request = {
        name: device_name,
        version_to_update: VERSION,
        binary_data: binaryData
      };

      return getIoTClient(serviceAccount, (client) => {
        client.projects.locations.registries.devices.modifyCloudToDeviceConfig(request,
          (err, data) => {
            if (err) {
              console.log('Could not update config for:', deviceId, 'Message: ', err);
            } else {
              console.log('Success :', data);
            }
          });
      });
    } else {
      // Do nothing
      console.log("You must be an authenticated user to update a device's configuration");
      return null;
    }
    
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
