/** Import necessary Material Web Components */
import {MDCRipple} from '@material/ripple';
import {MDCTopAppBar} from '@material/top-app-bar/index';
import {MDCDialog} from '@material/dialog';
import {MDCTextField} from '@material/textfield';
import {MDCNotchedOutline} from '@material/notched-outline';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCLineRipple} from '@material/line-ripple';
import {MDCSnackbar} from '@material/snackbar';
import {MDCSelect} from '@material/select';

/** Instantiate necessary Material Web Components */
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);
const menuDialog = new MDCDialog(document.querySelector('#gw-menu-dialog'));
const addUnitDialog = new MDCDialog(document.querySelector('#gw-add-unit-dialog'));
new MDCRipple(document.querySelector('#tune-fab'));
const buttons = document.querySelectorAll('.mdc-button');
buttons.forEach(function(button) {
  const b = new MDCRipple(button);
})
const textFields = document.querySelectorAll('.mdc-text-field');
textFields.forEach(function(textfield) {
  const t = new MDCTextField(textfield);
});
const helperTexts = document.querySelectorAll('.mdc-text-field-helper-text');
helperTexts.forEach(function(helperText) {
  const h = new MDCTextFieldHelperText(helperText);
})
const lineRipples = document.querySelectorAll('.mdc-line-ripple');
lineRipples.forEach(function(lineRipple) {
  const r = new MDCLineRipple(lineRipple);
});
const notchedOutlines = document.querySelectorAll('.mdc-notched-outline');
notchedOutlines.forEach(function(notchedOutline) {
  const n = new MDCNotchedOutline(notchedOutline);
});
const select = new MDCSelect(document.querySelector('.mdc-select')); // TODO: Replace multiple selects assignments with this one
const notificationSnackbar = new MDCSnackbar(document.querySelector('#gw-notification-snackbar'));

/** Global variables */

var userId; 
var userUnits = [];
var userDefaultUnit;

const db = firebase.database();
var usersRef;
var deviceRef;

/** Monitor user authentification status */

firebase.auth().onAuthStateChanged(function(user) {
  // If auth change is a sign-in
  // Save credentials and load dashboard
  if (user && user.uid != userId) {
    userId = user.uid;  
    usersRef = db.ref('users/' + userId);
    displayUserInfo(user);
    loadDashboard();
  } else {
    // If auth change is a sign-out or delete
    // Reset credentials and redirect to landing page
    userId = null;
    window.location.replace('index.html');
  }
});

/** Loads and runs the dashboard when a user logs in */

function loadDashboard() {
  // Search database for user's data
  usersRef.once('value', function(snapshot) {
    // If they have no data
    // prompt them to add a unit
    if (snapshot.val() == null) {
      notifyUser("Welcome! Add a Growwave unit to get started.");
    } else {
      // If they have data
      // Sync and obtain references to it
      userUnits = snapshot.val().units;
      userDefaultUnit = snapshot.val().defaultUnit;
      deviceRef = db.ref('devices/' + userUnits[userDefaultUnit]);
      // Enable dashboard inputs
      enableInputs();
      // Initialise dashboard fields
      deviceRef.once('value', function(snapshot) {
        initialiseDashboard(snapshot);
      });
      // Sync dashboard with database
      deviceRef.on('child_changed', function(snapshot) {
        syncDashboard(snapshot);
      });
    }    
  });
}

/** Dashboard functions */

// Displays the user's name and photo on toolbar
function displayUserInfo(user) {
  document.querySelector('.gw-username').textContent = user.displayName;
  if (user.photoURL) {
    var photoURL = user.photoURL;
    // Append size to the photo URL for Google hosted images to avoid requesting
    // the image with its original resolution (using more bandwidth than needed)
    // when it is going to be presented in smaller size.
    if ((photoURL.indexOf('googleusercontent.com') != -1) ||
        (photoURL.indexOf('ggpht.com') != -1)) {
      photoURL = photoURL + '?sz=' +
          document.querySelector('.gw-avatar').clientHeight;
    }
    document.querySelector('.gw-avatar').style.backgroundImage = "url(" + photoURL + ")";
  } else {
    document.querySelector('.gw-avatar').style.backgroundImage = "url(./images/avatar.jpg)";
  }  
}

// Keep dashboard in sycn with any database side changes
function syncDashboard(snapshot) {
  // Obtain the key and value of any changed data
  var key = snapshot.key.toString();
  var data = snapshot.val();
  // Obtain the html element related to the key
  var elem = document.getElementById(key);
  // Determine the type of the html element
  var elemClass = elem.className.split(" ");
  // If html element is a button  
  if (elemClass[0] == "updatable-button") {
    // Toggle the text and icon according to 
    // the the boolean value of data
    elem.innerText = data ? "DISABLE" : "ENABLE";
    toggleIconInit(elem, data);
  }
  // If html element is a textfield
  if(elemClass[0] == "updatable-text") {
    // Format the data according to the type of textfield
    switch(elemClass[1]) {
      case "time": 
        data = minutesToTime(data);
        elem.value = data;
        break;
      case "tmp":
        elem.innerText = data += "°C";
        break;
      case "pH":
        elem.innerHTML = data;
        break;
      default:
        elem.value = data;
    }
  }
}

// Initialise dashboard when app opens
function initialiseDashboard(snapshot) {
  // Initialise unit-select dropdown
  populateSelect();
  // Get a snaphots of the unit's data
  // and update dashboard fields
  snapshot.forEach(function(childSnapshot) {
    // Iterate over each key-value pair
    // and obtain the key and value
    var key = childSnapshot.key;
    var data = childSnapshot.val();
    // Obtain the html element related to the key
    var elem = document.getElementById(key);
    // Determine the type of the html element
    var elemClass = elem.className.split(" ");
    // If html element is a textfield
    if (elemClass[0] == "updatable-text") {
      // Format the data according to the type of textfield
      switch(elemClass[1]) {
        case "time": 
          data = minutesToTime(data);
          elem.value = data;
          break;
        case "tmp":
          elem.innerText = data += "°C";
          break;
        case "pH":
          elem.innerHTML = data;
          break;
        default:
          elem.value = data;
      }
    }
    // If html element is a button
    if (elemClass[0] == "updatable-button") {
      // Toggle the text and icon according to 
      // the the boolean value of data
      elem.innerText = (data) ? "DISABLE" : "ENABLE";
      toggleIconInit(elem, data);
    }    
  });
}


/** Dashboard helper functions */

// Displays a snackbar containing
// a notification for the user
function notifyUser(message) {
  const dataObj = {
    message: message
  };
  notificationSnackbar.show(dataObj);
}

// Populates the unit-select dropwdown
function populateSelect() {
  var select = document.getElementById('unit-select');
  // Create an option for every unit in the userUnits list
  for (var i = 0; i < userUnits.length; i++) {
    var option = document.createElement("option");
    option.value = i;
    option.innerHTML = userUnits[i];
    if (!select.options.item(option.value)) {
      // Append option to select only if it is not already there
      // Prevents the creation of duplicate options
      select.appendChild(option);
    }
  }
  // Select user's default unit
  select.selectedIndex = userDefaultUnit;
  select.focus(); // successive focus and blur
  select.blur();  // to fix UI glitch
}

// Enables all dashboard inputs
function enableInputs() {
  // Enable dashboard textfields
  var textfields = document.querySelectorAll('.gw-textfield');
  textfields.forEach(function(textfield) {
    textfield.classList.remove('mdc-text-field--disabled');
  });
  var inputs = document.querySelectorAll('.updatable-text');
  inputs.forEach(function(input) {
    input.removeAttribute('disabled');
  });
  // Enable dashboard buttons
  var buttons = document.querySelectorAll('.updatable-button');
  buttons.forEach(function(button) {
    button.removeAttribute('disabled');
  });
}

// Disables all dashboard inputs
function disableInputs() {
  // Disable dashboard textfields
  var textfields = document.querySelectorAll('.gw-textfield');
  textfields.forEach(function(textfield) {
    textfield.classList.add('mdc-text-field--disabled');
  });
  var inputs = document.querySelectorAll('.updatable-text');
  inputs.forEach(function(input) {
    input.setAttribute('disabled', 'disabled');
  });
  var labels = document.querySelectorAll('mdc-floating-label');
  labels.forEach(function(label) {
    label.removeAttribute('mdc-floating-label--float-above');
  });
  // Disable dashboard buttons
  var buttons = document.querySelectorAll('.updatable-button');
  buttons.forEach(function(button) {
    button.setAttribute('disabled', 'disabled');
  });
}

// Toggles the icon associated with a given
// HTML element from one state to another
function toggleIcon(elem) {
  // Identify the icon related to the given element
  var iconElem = document.getElementById(elem.id + "-icon");
  // Obtain the icon's class name
  var iconClass = iconElem.className;
  // If the class name is that of an led (for the grow lights card)
  if (iconClass.indexOf("mdi-led") > -1) {
    // Toggle between the on and off led icons
    iconElem.className = iconClass.indexOf("off") > -1 ?
                          "card-icon mdi mdi-led-on" :
                          "card-icon mdi mdi-led-variant-off";
  }  else if (iconClass.indexOf("off") > -1) {
    // If the icon class name contains "-off"
    // Trim it off
    iconElem.className = iconClass.slice(0, -4);
  } else {
    // The icon class is not that of an led and is on
    // Modify the class to the off variant
    iconElem.className = iconClass += "-off";
  }
}

// Toggles the icon associated with a given
// HTML element from one state to another
// (used when app opens) 
function toggleIconInit(elem, data) {
  // Identify the icon related to the given element
  var iconElem = document.getElementById(elem.id + "-icon");
  // Obtain the icon's class name
  var iconClass = iconElem.className;
  // call toggleIcon() only if icon and boolean value of data don't match
  // Ex: if lts-enabled is true, the icon must be the "on" variant
  if ((iconClass.indexOf("off") > -1 && data) ||
      (iconClass.indexOf("off") < 0 && !data))
  {
      toggleIcon(elem);
  }
}

// Returns true if val is a valid input for 
// its text-field type and false otherwise
function validateInput(val, textType) {
  switch(textType) {
    case "dp1-amount": 
      return /^[0-9]+$/.test(val) && val >= 25 && val <= 1000;
    case "dp2-amount": 
      return /^[0-9]+$/.test(val) && val >= 25 && val <= 1000;
    case "mp-offTime":
      return /^[0-9]+$/.test(val) && val >= 5 && val <= 120;
    case "mp-onTime":
      return /^[0-9]+$/.test(val) && val >= 5 && val <= 120;
    default: return false;
  }
}

// Converts number of minutes to a string representing
// time in hours and minutes (ex: 45 -> "00:45", 960 -> "16:00")
function minutesToTime(minutes) {
  
  var hrs = Math.floor(minutes / 60);
  hrs = ("0" + hrs).slice(-2); // formats 1 hr to 01 hr
  var mins = minutes % 60;
  mins = ("0" + mins).slice(-2); // formats 1 min to 01 min
  if (Number(hrs) > 0) {
    return hrs + ":" + mins;
  } else {
    return "00:" + mins;
  }
}

// Checks if hh:mm input is valid. Returns a number representing
// the total amount of minutes if valid (ex: "16:00" -> 960) and null
// otherwise
function checkAndConvertTime(timeString) {
  var minutes = null;
  // Check that input is a valid hh:mm
  var isValid = /^([01]\d|2[0-3]):?([0-5]\d)$/.test(timeString);
  if(isValid) {
    // Convert hh:mm to an int representing minutes
    var half = timeString.split(":");
    minutes = +half[0] * 60 + (+half[1]);
  }
  return minutes;
}

/** Event Listeners for user inputs */

// Monitor changes in unit select dropdown
document.getElementById('unit-select').addEventListener('change', function (evt) {
  // update default unit to the one that vas selected
  userDefaultUnit = this.value;
  usersRef.child("defaultUnit").set(userDefaultUnit);
  // reload dashboard
  loadDashboard()
});

// Monitor add unit button (the dashboard one) for clicks
document.getElementById('add-unit__dashboard').addEventListener('click', function (evt) {
  // Display add-unit dialog
  addUnitDialog.lastFocusedTarget = evt.target;
  addUnitDialog.show();
});

// Monitor add unit button (the dialog one) for clicks
document.getElementById('add-unit__dialog').addEventListener('click', function (evt) {
  var newUnitId = document.getElementById('add-unit-id').value;
  // Validate unit ID
  // TODO: Improve validation. There is a bug where "/" and other chars get through
  db.ref('devices/' + newUnitId).once('value', function(snapshot) {
    // If unit if registered in the database
    if (snapshot.exists()) {
      if (userUnits.includes(newUnitId)) {
        // Notify user if unit is already added
        notifyUser(newUnitId + " is already added.");
      } else {
        // Add new unit to user's account
        userDefaultUnit = userUnits.push(newUnitId) - 1;
        usersRef.child("units").set(userUnits);
        usersRef.child("defaultUnit").set(userDefaultUnit);
        // Update unit-select dropdown
        populateSelect();
        // Notify user of unit addition
        notifyUser(newUnitId + " has been added.");
        // Update deviceRef 
        deviceRef = db.ref('devices/' + newUnitId);
        // Close add-unit dialog and relaod dashboard
        addUnitDialog.close();
        loadDashboard();
      }
    } else {
      // If unit ID does not exist, notify the user.
      notifyUser(newUnitId + " is not a valid unit ID.");      
    }
  });

});

// Monitor the delete-unit button for clicks
document.getElementById('delete-unit').addEventListener('click', function (evt) {
  // If there are no units stored
  if (userUnits.length == 0) {
    // Notify user that there are no units to delete
    notifyUser("There are no units to delete.");    
  } else {
    // Make user confirm delete decision
    // TODO: implement a dialog instead of using an alert
    if (window.confirm("Are you sure you want to delete this unit?")) {
      // Delete the selected unit (userDefaultUnit) from the units array
      var deletedUnit = userUnits.splice(userDefaultUnit, 1);
      // Update the unit-select dropdown
      var select = document.getElementById("unit-select");
      select.remove(userDefaultUnit);
      // Set new default unit as unit 0 or null if the select is empty
      userDefaultUnit = select.options.item(0) ? 0 : null;
      // Update the database
      usersRef.child("units").set(userUnits);
      usersRef.child("defaultUnit").set(userDefaultUnit);      
      // Notify user of the deletion
      notifyUser(deletedUnit[0] + " has been deleted.");
      // If user has no more units, disable the dashboard
      if (userUnits.length == 0) {
        disableInputs();
        deviceRef.off()
        window.location.reload(); // Reload to force dummy values. TODO: find a better way
      } else {
        // Switch device reference to default unit and reload dashboard
        deviceRef = db.ref('devices' + userUnits[userDefaultUnit]);
        loadDashboard();
      }
    }
  }
});

// Monitor menu button for clicks
document.getElementById('gw-menu').addEventListener('click', function (evt) {
  // Display menu dialog
  menuDialog.lastFocusedTarget = evt.target;
  menuDialog.show();
});

// Monitor sign-out button for clicksF
document.getElementById('sign-out').addEventListener('click', function() {
  firebase.auth().signOut(); // sign user out
});

// Monitor delete-account button for clicks
document.getElementById('delete-account').addEventListener('click', function() {
  // Attempt to delete the user's account
  firebase.auth().currentUser.delete().catch(function(error) {
    // If the user's credentials are too old. They need to sign in again.
    if (error.code == 'auth/requires-recent-login') {
      firebase.auth().signOut().then(function() {
        // The timeout allows the message to be displayed after the UI has
        // changed to the signed out state.
        setTimeout(function() {
          alert('Please sign in again to delete your account.');
        }, 1);
      });
    }
  });
  // TODO: Make user confirm deletion before deleting their account
  // TODO: Figure out how to delete user's information when their account gets deleted
});

// Monitor updatable textfields for changes
document.querySelectorAll('.updatable-text').forEach(function(textField) {
  textField.addEventListener('change', function() {
    var elem = document.getElementById(textField.id);
    var elemClass = elem.className.split(" ");
    var val = this.value
    var isValid = validateInput(val, textField.id)
    // Special case for time objects
    if (elemClass[1] == "time") {
      val = checkAndConvertTime(val);
      isValid = val != null;
    }
    // Commit change to database if data is valid
    if (isValid) {
      var newData = new Object();
      newData[textField.id] = +val;
      deviceRef.update(newData)
      .then(function() {
        // console.log(textField.id + " set to " + val);
        // Update Grow Wave unit
        updateDeviceConfig(newData);
      }).catch(function() {
        // console.log("Got an error: ", error);
      });
    }
  });
});

// Monitor enable/disable buttons for clicks
document.querySelectorAll('.updatable-button').forEach(function(button) {
  button.addEventListener('click', function() {
    // Toggle button text and icon
    var val = (button.innerText == "ENABLE") ? true : false;
    button.innerText = val ? "DISABLE" : "ENABLE";
    toggleIcon(button);
    // Commit change to database
    var newData = new Object();
    newData[button.id] = val;
    deviceRef.update(newData)
    .then(function() {
      // console.log(button.id + " set to " + val);
      // Update Grow Wave unit
      updateDeviceConfig(newData);
    }).catch(function() {
      // console.log("Got an error: ", error);
    });
  });
});

// Makes HTTP request to cloud functions to update Grow Wave device configuration
function updateDeviceConfig(data) {
  // Device ID and function url required for request
  data["deviceId"] = userUnits[userDefaultUnit];
  const url = 'https://us-central1-grow-wave.cloudfunctions.net/updateDeviceConfig';
  // Call to fetch API to make request
  fetch(url, {
    method: 'POST',  
    body: JSON.stringify(data),
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(function(response) {
    // console.log('Success:', JSON.stringify(response));
  }).catch(function(error) {
    // console.log("Got an error: ", error);
  });
}