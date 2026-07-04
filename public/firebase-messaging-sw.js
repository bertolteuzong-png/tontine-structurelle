importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBGqTqQayjvCzav1ElCEqABKR5g_ZVaYtw",
  authDomain: "tontine-structurelle-f3361.firebaseapp.com",
  projectId: "tontine-structurelle-f3361",
  storageBucket: "tontine-structurelle-f3361.firebasestorage.app",
  messagingSenderId: "588899032869",
  appId: "1:588899032869:web:13ea76222e523efb6dc4cc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  });
});
