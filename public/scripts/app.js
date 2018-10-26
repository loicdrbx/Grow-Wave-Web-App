/** Import necessary Material Web Components */
import {MDCRipple} from '@material/ripple';
import {MDCTopAppBar} from '@material/top-app-bar/index';
import {MDCDialog} from '@material/dialog';
import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCLineRipple} from '@material/line-ripple';
import {MDCNotchedOutline} from '@material/notched-outline';
import {MDCSelect} from '@material/select';

/** Instantiation of necessary Material Web Components */
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
const select = new MDCSelect(document.querySelector('.mdc-select'));

(function() {

  // Monitor user auth changes

  var userId = null; // Track the UID of the current user
  var userUnits;
  var userDefaultUnit;

  firebase.auth().onAuthStateChanged(function(user) { 
    // If auth change is a sign-in
    if (user && user.uid != userId) {
      userId = user.uid;     // save userID
      handleUserSignIn(user);  // handle user
      loadDashboard();
      console.log("New login from:", user.displayName);
    } else {
      // Auth change is a sign-out
      userId = null;                      // reset userID
      window.location.replace("index.html");  // redirect to landing page
    }
  });

  /** User authentification helper functions */

  // Handle a signed in user
  function handleUserSignIn(user) {

    // If user is new, add them to the database
    firebase.database().ref('users/' + userId).once('value', function(snapshot) {
      if (!snapshot.exists()) {
        firebase.database().ref('users/' + userId).set({
          units: [''],
          defaultUnit: ''
        });
      }
    })

    // Display user's name and photo on toolbar
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

  // Delete the user's account and information
  function deleteAccount()  {

    var tempId = userId;
    var deleteError = false;

    // Delete acccount
    firebase.auth().currentUser.delete().catch(function(error) {
      if (error.code == 'auth/requires-recent-login') {
        deleteError = true;
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

    // Delete user information only after their account is deleted
    if (!deleteError) {
      firebase.database().ref('users/' + tempId).remove();
    }
  };

  /** Loads and runs dashboard while user is logged in */

  function loadDashboard() {

    // Get a reference to the database
    const db = firebase.database();
    // Create references to frequently used paths
    const deviceRef = db.ref('devices/esp32_1D3438');
    const usersRef = db.ref('users/' + userId);

    // Sync dashboard to latest unit data when app opens
    deviceRef.once('value', function(snapshot) {

      snapshot.forEach(function(childSnapshot) {
        
        var key = childSnapshot.key;
        var data = childSnapshot.val();
        var elem = document.getElementById(key);
        var elemClass = elem.className.split(" ");
        
        if (elemClass[0] == "updatable-text") {
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
          // console.log("Updated " + key + " to " + data);
        }
        
        if (elemClass[0] == "updatable-button") {
          elem.innerText = (data) ? "DISABLE" : "ENABLE";
          toggleIconInit(elem, data);
        }
      });
    });

    // Sync user information to the latest data when app opens
    usersRef.once('value', function(snapshot) {

      userUnits = snapshot.val().units;
      userDefaultUnit = snapshot.val().defaultUnit;
      var select = document.getElementById("unit-select");

      // Populate unit select dropdown
      for (var i = 0; i < userUnits.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.innerHTML = userUnits[i];
        select.appendChild(option);
      }

      // Select user's default unit
      select.value = userDefaultUnit;
      select.focus(); // successive focus and blur
      select.blur();  // to fix UI glitch
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
          console.log(button.id + " set to " + val);
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
          newData[textField.id] = +val;
          deviceRef.update(newData)
          .then(function() {
            console.log(textField.id + " set to " + val);
          }).catch(function() {
            console.log("Got an error: ", error);
          });
        }
      });
    });

    // Monitor any database side changes
    // and update UI accordingly
    deviceRef.on('child_changed', function(snapshot) {

      var key = snapshot.key.toString();
      var data = snapshot.val();
      var elem = document.getElementById(key);
      var elemClass = elem.className.split(" ");
      
      if (elemClass[0] == "updatable-button") {
        elem.innerText = data ? "DISABLE" : "ENABLE";
        toggleIconInit(elem, data);
        // console.log("Updated " + key + " to " + data);
      }

      if(elemClass[0] == "updatable-text") {
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
        // console.log("Updated " + key + " to " + data);
      }
    });

    // Monitor changes in unit select dropdown
    // and update database accordingly
    document.getElementById('unit-select').addEventListener('change', function (evt) {
      usersRef.child("defaultUnit").set(this.value);   
    });

    // Monitor unit delete button
    // The current default unit will be deleted
    document.getElementById('delete-unit').addEventListener('click', function (evt) {

      // Make user confirm delete decision
      if (window.confirm("Are you sure you want to delete this unit?")) {
        // Delete unit from units array
        userUnits.splice(userDefaultUnit, 1);
        // Update html
        var select = document.getElementById("unit-select");
        select.remove(userDefaultUnit);
        // Update firebase
        userDefaultUnit = 0;
        usersRef.child("units").set(userUnits);
        usersRef.child("defaultUnit").set(userDefaultUnit);
      }
    });

  }

  /** Dashboard Helper functions */

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

  document.getElementById('gw-menu').addEventListener('click', function (evt) {
    menuDialog.lastFocusedTarget = evt.target;
    menuDialog.show();
  });

  document.getElementById('add-unit').addEventListener('click', function (evt) {
    addUnitDialog.lastFocusedTarget = evt.target;
    addUnitDialog.show();
    // addUnitDialog.close();
  });

})();
