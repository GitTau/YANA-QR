/**
 * app.js
 * Yana MVP - QR Scan + Firestore
 * Features:
 *  - Google Sign-In
 *  - QR Scanner for scooters & batteries
 *  - Assign / Deregister logic
 *  - Firestore logs
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* --------------------------
   FIREBASE CONFIG
   -------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCP7KKqJhtauDVonZ-6ApHRitu7CCdV0Ns",
  authDomain: "yana-qr.firebaseapp.com",
  projectId: "yana-qr",
  storageBucket: "yana-qr.firebasestorage.app",
  messagingSenderId: "905613005387",
  appId: "1:905613005387:web:b0d8464d826972654b73ce",
  measurementId: "G-9P9DLJGQHQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* --------------------------
   UI ELEMENTS
   -------------------------- */
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const statusP = document.getElementById('status');
const userInfo = document.getElementById('user-info');
const userEmailP = document.getElementById('userEmail');
const firestoreStatus = document.getElementById('firestoreStatus');
const scannerSection = document.getElementById('scanner-section');
const scanResult = document.getElementById('scanResult');

let currentUser = null;
let html5QrCode;

/* --------------------------
   EVENT LISTENERS
   -------------------------- */
googleSignInBtn.addEventListener('click', () => signInWithGoogle());
signOutBtn.addEventListener('click', () => signOutUser());

/* --------------------------
   AUTH FUNCTIONS
   -------------------------- */
async function signInWithGoogle(){
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    await ensureUserInFirestore(currentUser);
    updateUIForSignedInUser(currentUser);
    startScanner();
  } catch (err) {
    console.error(err);
    statusP.textContent = "Sign-in failed.";
  }
}

async function signOutUser(){
  await signOut(auth);
  currentUser = null;
  stopScanner();
  statusP.textContent = "Signed out";
  userInfo.classList.add("hidden");
  scannerSection.classList.add("hidden");
  googleSignInBtn.classList.remove("hidden");
  signOutBtn.classList.add("hidden");
}

/* --------------------------
   FIRESTORE HELPERS
   -------------------------- */
async function ensureUserInFirestore(user){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()){
    await setDoc(ref, {
      email: user.email,
      assignedScooter: null,
      assignedBattery: null,
      createdAt: serverTimestamp()
    });
    firestoreStatus.textContent = "User created in Firestore.";
  } else {
    firestoreStatus.textContent = "User exists in Firestore.";
  }
}

async function logAction(userEmail, assetType, assetId, action){
  await addDoc(collection(db, "logs"), {
    userEmail,
    assetType,
    assetId,
    action,
    timestamp: serverTimestamp()
  });
}

/* --------------------------
   QR SCAN LOGIC
   -------------------------- */
function startScanner(){
  scannerSection.classList.remove("hidden");
  html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: 250 };

  Html5Qrcode.getCameras()
    .then(cameras => {
      if (cameras && cameras.length) {
        // pick back camera if available, else first camera
        let cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;
        html5QrCode.start(cameraId, config, onScanSuccess)
          .catch(err => {
            console.error("QR start failed", err);
            firestoreStatus.textContent = "QR Scanner failed to start: " + err;
          });
      } else {
        firestoreStatus.textContent = "No cameras found.";
      }
    })
    .catch(err => {
      console.error("Camera access error", err);
      firestoreStatus.textContent = "Camera error: " + err;
    });
}
}

function stopScanner(){
  if (html5QrCode){
    html5QrCode.stop().catch(err => console.error("Stop scanner error", err));
  }
}

async function onScanSuccess(decodedText){
  scanResult.textContent = "Scanned: " + decodedText;

  // Example format: scooter:123 or battery:456
  let [type, id] = decodedText.split(":");
  if (!type || !id) {
    firestoreStatus.textContent = "Invalid QR format. Use scooter:ID or battery:ID";
    return;
  }

  if (type !== "scooter" && type !== "battery"){
    firestoreStatus.textContent = "Unknown asset type: " + type;
    return;
  }

  await handleAssetScan(type, id);
}

async function handleAssetScan(assetType, assetId){
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);
  let userData = userSnap.data();

  const assignedField = assetType === "scooter" ? "assignedScooter" : "assignedBattery";

  if (userData[assignedField] === assetId){
    // Deregister
    await updateDoc(userRef, { [assignedField]: null });
    await logAction(userData.email, assetType, assetId, "deregister");
    firestoreStatus.textContent = `${assetType} ${assetId} deregistered.`;
  } else if (userData[assignedField] === null){
    // Register
    await updateDoc(userRef, { [assignedField]: assetId });
    await logAction(userData.email, assetType, assetId, "register");
    firestoreStatus.textContent = `${assetType} ${assetId} registered.`;
  } else {
    firestoreStatus.textContent = `You already have another ${assetType} assigned.`;
  }
}

/* --------------------------
   UI HELPERS
   -------------------------- */
function updateUIForSignedInUser(user){
  userInfo.classList.remove("hidden");
  googleSignInBtn.classList.add("hidden");
  signOutBtn.classList.remove("hidden");
  statusP.textContent = "Signed in";
  userEmailP.textContent = user.email;
  scannerSection.classList.remove("hidden");
}

/* --------------------------
   MONITOR AUTH STATE
   -------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (user){
    currentUser = user;
    await ensureUserInFirestore(user);
    updateUIForSignedInUser(user);
    startScanner();
  } else {
    currentUser = null;
    stopScanner();
    statusP.textContent = "Not signed in";
  }
});
