// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCP7KKqJhtauDVonZ-6ApHRitu7CCdV0Ns",
  authDomain: "yana-qr.firebaseapp.com",
  projectId: "yana-qr",
  storageBucket: "yana-qr.firebasestorage.app",
  messagingSenderId: "905613005387",
  appId: "1:905613005387:web:b0d8464d826972654b73ce",
  measurementId: "G-9P9DLJGQHQ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
