(function() {
  var firebaseReady = false;

  try {
    if (typeof firebase !== 'undefined' && firebase.app && firebase.app().name) {
      firebaseReady = true;
      console.log('Firebase initialized successfully.');
    }
  } catch(e) {
    console.warn(
      '%c⚠️ Firebase not configured. Running in DEMO mode (no persistence).',
      'font-weight:bold;color:#FF9800'
    );
    console.info(
      '%c📖 To enable auth and data storage:\n' +
      '  1. Go to https://console.firebase.google.com\n' +
      '  2. Create a project and enable Auth + Firestore\n' +
      '  3. Copy your config into js/firebase-config.js\n' +
      '  4. Deploy to Vercel from GitHub!',
      'color:#2196F3'
    );
  }

  if (!firebaseReady) {
    var demoUser = {
      uid: 'demo-' + Date.now(),
      email: 'demo@esl-vocab.app',
      displayName: 'Demo Learner',
    };
    var currentUser = null;
    var userProfile = null;

    window.auth = {
      onAuthStateChanged: function(cb) {
        setTimeout(function() { cb(demoUser); }, 100);
        return function() {};
      },
      createUserWithEmailAndPassword: function() { return Promise.reject(new Error('Setup Firebase first - see console for instructions')); },
      signInWithEmailAndPassword: function() { return Promise.reject(new Error('Setup Firebase first - see console for instructions')); },
      signOut: function() {
        demoUser = null;
        currentUser = null;
        userProfile = { displayName: 'Demo Learner', email: 'demo@esl-vocab.app', progress: { totalPoints: 0, level: 1, currentStreak: 0, wordsLearned: 0, totalExercisesCompleted: 0, averageAccuracy: 0, totalCorrect: 0, totalAttempts: 0, badges: [] } };
        return Promise.resolve();
      },
      currentUser: demoUser,
    };

    currentUser = demoUser;
    userProfile = {
      displayName: 'Demo Learner',
      email: 'demo@esl-vocab.app',
      progress: {
        totalPoints: 0,
        level: 1,
        currentStreak: 3,
        longestStreak: 7,
        lastPracticeDate: new Date().toISOString(),
        wordsLearned: 15,
        totalExercisesCompleted: 8,
        averageAccuracy: 78,
        totalCorrect: 60,
        totalAttempts: 77,
        badges: [
          { id: 'first-exercise', name: 'First Steps', description: 'Complete your first exercise', icon: '👶', earnedAt: new Date().toISOString() },
        ],
      },
    };

    window.db = {
      collection: function() {
        return {
          doc: function() {
            return {
              get: function() { return Promise.resolve({ exists: true, data: function() { return userProfile; } }); },
              set: function() { return Promise.resolve(); },
              update: function() { return Promise.resolve(); },
            };
          },
          add: function() { return Promise.resolve(); },
          orderBy: function() { return this; },
          limit: function() { return this; },
          get: function() { return Promise.resolve({ docs: [] }); },
        };
      },
    };
  }
})();
