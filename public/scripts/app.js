/** Import necessary Material Web Components */
import {MDCRipple} from '@material/ripple';
import {MDCTopAppBar} from '@material/top-app-bar/index';

/** Instantiation of necessary Material Web Components */
MDCRipple.attachTo(document.querySelector('.foo-button'));
MDCRipple.attachTo(document.querySelector('.gw-usernamelink'));
const topAppBarElement = document.querySelector('.mdc-top-app-bar');
const topAppBar = new MDCTopAppBar(topAppBarElement);


(function() {

  /** User Authentification Functions */

  var currentUid = null; // Track the UID of the current user

  // Monitor user auth. changes
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
})();
