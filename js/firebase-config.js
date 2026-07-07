const firebaseConfig = {
  apiKey: 'AIzaSyCd3JreTTWX2KjsCSP-J-wALdkCz5C-V8k',
  authDomain: 'esl-vocab-app.firebaseapp.com',
  projectId: 'esl-vocab-app',
  storageBucket: 'esl-vocab-app.firebasestorage.app',
  messagingSenderId: '92463877389',
  appId: '1:92463877389:web:9fff52da148597648a7444',
};

let app, auth, db, analytics;

try {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    try { analytics = firebase.analytics(); } catch (e) { console.log('Analytics not available (optional)'); }
    db.settings({ merge: true });
  }
} catch (e) {
  console.warn('Firebase init skipped (not configured yet):', e.message);
}
