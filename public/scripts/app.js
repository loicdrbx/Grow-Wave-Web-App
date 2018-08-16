import {MDCRipple} from '@material/ripple';
const ripple = new MDCRipple(document.querySelector('.foo-button'));

(function() {

  /** User Authentification Functions */

  var currentUid = null; // Track the UID of the current user

  // Monitor user auth. changes
  firebase.auth().onAuthStateChanged(function(user) { 
    // If auth change is a sign-in
    if (user && user.uid != currentUid) {
      currentUid = user.uid;     // save userID
      // handleSignedInUser(user);  // do something
      console.log("New login from:", user.displayName);
    } else {
      // Auth change is a sign-out
      currentUid = null;                      // reset userID
      window.location.replace("index.html");  // redirect to landing page
    }  
  });



})();
