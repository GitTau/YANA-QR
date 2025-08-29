// firebase-config.js

// ✅ Your web app's Firebase configuration (copied correctly from Firebase Console)
var firebaseConfig = {
  apiKey: "AIzaSyCmmmJh7xhwJ5S_aa5gDpf1z37lg2JGGu8",
  authDomain: "yana-app-43d76.firebaseapp.com",
  projectId: "yana-app-43d76",
  storageBucket: "yana-app-43d76.appspot.com",   // ✅ fixed
  messagingSenderId: "746812065904",
  appId: "1:746812065904:web:196a90926c59edf9468cb5",
  measurementId: "G-W7E6WB8Y6D"
};

// ✅ Initialize Firebase (v8 style)
firebase.initializeApp(firebaseConfig);

// ✅ Services you’ll use across pages
const db = firebase.firestore();
const auth = firebase.auth();
