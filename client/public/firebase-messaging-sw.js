importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyA4jbp9YpJPZZmcFhL7Pm75-TOzlNE_V8w",
    authDomain: "unitime-db5fa.firebaseapp.com",
    projectId: "unitime-db5fa",
    storageBucket: "unitime-db5fa.firebasestorage.app",
    messagingSenderId: "806375496068",
    appId: "1:806375496068:web:771e800ba5d61d864ba5d1",
    measurementId: "G-4FWL8BHPR8"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png', // Fallback to a standard logo if available, or just use browser default
        badge: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
