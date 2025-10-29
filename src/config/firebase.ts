import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAx6FT5goGyA4QJfA-WEKZbIe_XR7UkvHI",
  authDomain: "escardia-9dc88.firebaseapp.com",
  projectId: "escardia-9dc88",
  storageBucket: "escardia-9dc88.firebasestorage.app",
  messagingSenderId: "926678596581",
  appId: "1:926678596581:web:ee1f70a3f4fe48e06b0d0c"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export default firebase;