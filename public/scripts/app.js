/** Import necessary Material Web Components */
import {MDCRipple} from '@material/ripple';
import {MDCTopAppBar} from '@material/top-app-bar/index';
import {MDCDialog} from '@material/dialog';

/** Instantiation of necessary Material Web Components */
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);
const dialog = new MDCDialog(document.querySelector('#gw-menu-dialog'));


(function() {

  /** User Authentification Functions */

  var currentUid = null; // Track the UID of the current user

  // Monitor user auth changes
  firebase.auth().onAuthStateChanged(function(user) { 
    // If auth change is a sign-in
    if (user && user.uid != currentUid) {
      currentUid = user.uid;     // save userID
      handleSignedInUser(user);  // do something
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


  /** Functions for dashboard monitoring/control  */



  /** Miscellaneous Functioons */

  var menu = document.getElementById('gw-menu');

  menu.addEventListener('click', function (evt) {
    dialog.lastFocusedTarget = evt.target;
    dialog.show();
  });

})();
