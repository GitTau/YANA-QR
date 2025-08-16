// -------------------- Firebase Config --------------------
const firebaseConfig = {
  // 🔥 Replace with your own config
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

// -------------------- Auth --------------------
const signInBtn = document.getElementById("google-signin");
const signOutBtn = document.getElementById("google-signout");

signInBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});
signOutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    signInBtn.style.display = "none";
    signOutBtn.style.display = "inline-block";
    loadDevices(user.uid);
    loadLogs(user.uid);
  } else {
    signInBtn.style.display = "inline-block";
    signOutBtn.style.display = "none";
    document.getElementById("device-list").innerHTML = "";
    document.getElementById("log-list").innerHTML = "";
  }
});

// -------------------- QR Scanner --------------------
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => { video.srcObject = stream; });

video.addEventListener("play", () => {
  const tick = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) processQRCode(code.data);
    }
    requestAnimationFrame(tick);
  };
  tick();
});

function processQRCode(data) {
  const user = auth.currentUser;
  if (!user) return;

  let type = null;
  let id = null;

  if (data.startsWith("scooter:")) {
    type = "scooter";
    id = data.replace("scooter:", "");
  } else if (data.startsWith("battery:")) {
    type = "battery";
    id = data.replace("battery:", "");
  }

  if (type && id) {
    const deviceRef = db.collection("users").doc(user.uid).collection("devices").doc(id);
    deviceRef.set({ type, linkedAt: firebase.firestore.FieldValue.serverTimestamp() });
    logActivity(user.uid, `${type} ${id} linked`);
  }
}

// -------------------- Firestore Sync --------------------
function loadDevices(uid) {
  db.collection("users").doc(uid).collection("devices")
    .onSnapshot(snapshot => {
      const list = document.getElementById("device-list");
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${doc.data().type}: ${doc.id}`;
        list.appendChild(li);
      });
    });
}

function loadLogs(uid) {
  db.collection("users").doc(uid).collection("logs").orderBy("time", "desc")
    .onSnapshot(snapshot => {
      const list = document.getElementById("log-list");
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${doc.data().time.toDate().toLocaleString()} - ${doc.data().message}`;
        list.appendChild(li);
      });
    });
}

function logActivity(uid, message) {
  db.collection("users").doc(uid).collection("logs").add({
    message,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// -------------------- SVG Upload --------------------
const logoUpload = document.getElementById("logo-upload");
const logoContainer = document.getElementById("logo-container");

logoUpload.addEventListener("change", event => {
  const file = event.target.files[0];
  if (file && file.type === "image/svg+xml") {
    const reader = new FileReader();
    reader.onload = e => {
      logoContainer.innerHTML = e.target.result; // Replace inline SVG
    };
    reader.readAsText(file);
  } else {
    alert("Please upload a valid SVG file.");
  }
});
