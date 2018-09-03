/** Import necessary Material Web Components */
import {MDCRipple} from '@material/ripple';
import {MDCTopAppBar} from '@material/top-app-bar/index';
import {MDCDialog} from '@material/dialog';
import {MDCTextField} from '@material/textfield';
import {MDCLineRipple} from '@material/line-ripple';
import {MDCNotchedOutline} from '@material/notched-outline';

/** Instantiation of necessary Material Web Components */
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);
const dialog = new MDCDialog(document.querySelector('#gw-menu-dialog'));
new MDCRipple(document.querySelector('#tune-fab'));
const buttons = document.querySelectorAll('.mdc-button');
buttons.forEach(function(button) {
  const b = new MDCRipple(button);
})
const textFields = document.querySelectorAll('.mdc-text-field');
textFields.forEach(function(textfield) {
  const t = new MDCTextField(textfield);
});
const lineRipples = document.querySelectorAll('.mdc-line-ripple');
lineRipples.forEach(function(lineRipple) {
  const r = new MDCLineRipple(lineRipple);
});
const notchedOutlines = document.querySelectorAll('.mdc-notched-outline');
notchedOutlines.forEach(function(notchedOutline) {
  const n = new MDCNotchedOutline(notchedOutline);
});

(function() {

  /** User Authentification Functions */

  var currentUid = null; // Track the UID of the current user

  // Monitor user auth changes
  firebase.auth().onAuthStateChanged(function(user) { 
    // If auth change is a sign-in
    if (user && user.uid != currentUid) {
      currentUid = user.uid;     // save userID
      handleSignedInUser(user);  // handle user
      console.log("New login from:", user.displayName);
    } else {
      // Auth change is a sign-out
      currentUid = null;                      // reset userID
      window.location.replace("index.html");  // redirect to landing page
    }  
  });

  // Display user's name and photo on toolbar
  function handleSignedInUser(user) {
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
  
  // Monitor sign-out button
  document.getElementById('sign-out').addEventListener('click', function() {
    firebase.auth().signOut(); // sign user out
  });

  // Monitor delete-account button
  document.getElementById('delete-account').addEventListener('click', function() {
    deleteAccount();
  });

  // Delete the user's account
  function deleteAccount()  {
    firebase.auth().currentUser.delete().catch(function(error) {
      if (error.code == 'auth/requires-recent-login') {
        // The user's credential is too old. They need to sign in again.
        firebase.auth().signOut().then(function() {
          // The timeout allows the message to be displayed after the UI has
          // changed to the signed out state.
          setTimeout(function() {
            alert('Please sign in again to delete your account.');
          }, 1);
        });
      }
    });
  };

  /** Dashboard-Control Functions  */

  // Get a reference to the database
  const db = firebase.database();
  // Create references to freuquently used paths
  const deviceRef = db.ref('devices/esp32_1D3438');

  // Sync dashboard to latest data when app opens
  deviceRef.once('value', function(snapshot) {

    snapshot.forEach(function(childSnapshot) {
      
      var key = childSnapshot.key;
      var data = childSnapshot.val();
      var elem = document.getElementById(key);
      var elemClass = elem.className.split(" ");
      
      if (elemClass[0] == "updatable-text") {
        // Special case for time elements
        if (elemClass[1] == "time") {
          data = minutesToTime(data);
        }
        elem.value = data;
        // console.log("Updated " + key + " to " + data);
      }
      
      if (elemClass[0] == "updatable-button") {
        elem.innerText = (data) ? "DISABLE" : "ENABLE";
        toggleIconInit(elem, data);
      }
    });
  });

  // Monitor updatable buttons for clicks
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
        console.log(button.id + "set to " + val);
      }).catch(function() {
        console.log("Got an error: ", error);
      });
    });
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
        console.log(val);
        val = checkAndConvertTime(val);
        isValid = val != null;
      }
      // Commit change to database if data is valid
      if (isValid) {
        var newData = new Object();
        newData[textField.id] = val;
        deviceRef.update(newData)
        .then(function() {
          console.log(textField.id + " set to " + val);
        }).catch(function() {
          console.log("Got an error: ", error);
        });
      }
    });
  });

  // Toggles the icon associated with a given
  // HTML element from one state to another
  function toggleIcon(elem) {

    var iconElem = document.getElementById(elem.id + "-icon")
    var iconClass = iconElem.className;

    // Special case for grow lights
    if (iconClass.indexOf("mdi-led") > -1) {
      iconElem.className = iconClass.indexOf("off") > -1 ?
                           "card-icon mdi mdi-led-on" :
                           "card-icon mdi mdi-led-variant-off";
    } // Every other case (-off is the only change is className)
    else if (iconClass.indexOf("off") > -1) {
      iconElem.className = iconClass.slice(0, -4);
    } else {
      iconElem.className = iconClass += "-off";
    }
  }
  
  // Overloaded version of toggleIcon() used when app opens 
  function toggleIconInit(elem, data) {

    var iconElem = document.getElementById(elem.id + "-icon")
    var iconClass = iconElem.className;
    
    // call toggleIcon() only if icon and button text don't match
    if ((iconClass.indexOf("off") > -1 && data) ||
        (iconClass.indexOf("off") < 0 && !data))
    {
        toggleIcon(elem);
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

  /** Miscellaneous Functioons */

  var menu = document.getElementById('gw-menu');

  menu.addEventListener('click', function (evt) {
    dialog.lastFocusedTarget = evt.target;
    dialog.show();
  });

})();
