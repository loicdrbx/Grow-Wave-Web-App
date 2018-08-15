(function () {
  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User successfully signed in.
        // Do something?
        console.log("Login successful!");
        return true;
      }
    },
    signInFlow: 'redirect',  
    signInSuccessUrl: 'home.html',  
    signInOptions: [  
      // The authentification providers we offer
      firebase.auth.GoogleAuthProvider.PROVIDER_ID  
    ],
    // TODO: Update Terms of Service and Privacy Policy urls  
    tosUrl: 'https://www.tesla.com/?redirect=no',
    privacyPolicyUrl: 'https://www.tesla.com/?redirect=no'
  };
  // Initialize the FirebaseUI Widget using Firebase.  
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded.  
  ui.start('#firebaseui-auth-container', uiConfig);  
}());