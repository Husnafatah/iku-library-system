// firebase-config.js
// TO BE COMPLETED BY CLIENT
const firebaseConfig = {
  apiKey: "AIzaSyBKOxtcaXm1S78EVPhvgWGl-wlmx9ney2I",
  authDomain: "iku-library-system.firebaseapp.com",
  projectId: "iku-library-system",
  storageBucket: "iku-library-system.firebasestorage.app",
  messagingSenderId: "566708922213",
  appId: "1:566708922213:web:d814cfe2c543264df3a38c",
  measurementId: "G-Y3BYPWX8H8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
