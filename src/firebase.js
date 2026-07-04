import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBGqTqQayjvCzav1ElCEqABKR5g_ZVaYtw",
  authDomain: "tontine-structurelle-f3361.firebaseapp.com",
  projectId: "tontine-structurelle-f3361",
  storageBucket: "tontine-structurelle-f3361.firebasestorage.app",
  messagingSenderId: "588899032869",
  appId: "1:588899032869:web:13ea76222e523efb6dc4cc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const VAPID_KEY = "BJdKAEM9TQ5Lvyp4j_VZmeH45vXseL-wAgT3Y-zc9cD-eIRoRJNYMZETOXHRg3sJxOLi47tlFn0sqt5F8gQ6wIo";

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.log('Messaging not supported');
}
export { messaging, getToken, onMessage };
