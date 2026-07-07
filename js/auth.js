let currentUser = null;
let userProfile = null;
let authListeners = [];

function getAuth() { return typeof auth !== 'undefined' && auth ? auth : window.auth; }
function getDb() { return typeof db !== 'undefined' && db ? db : window.db; }

function onAuthChange(callback) {
  authListeners.push(callback);
  if (currentUser) callback(currentUser);
}

function notifyAuthListeners(user) {
  currentUser = user;
  authListeners.forEach(cb => cb(user));
}

async function signUp(email, password, displayName) {
  const _auth = getAuth();
  const _db = getDb();
  if (!_auth) return { success: false, error: 'Firebase not configured. Update js/firebase-config.js with your project credentials.' };
  try {
    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    await _db.collection('users').doc(cred.user.uid).set({
      displayName,
      email,
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: { soundEnabled: true, theme: 'light', notifications: true }
    });
    await initUserProgress(cred.user.uid);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function signIn(email, password) {
  const _auth = getAuth();
  const _db = getDb();
  if (!_auth) return { success: false, error: 'Firebase not configured.' };
  try {
    const cred = await _auth.signInWithEmailAndPassword(email, password);
    await _db.collection('users').doc(cred.user.uid).update({
      lastLogin: new Date().toISOString()
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function signOut() {
  const _auth = getAuth();
  if (!_auth) return { success: true };
  try {
    await _auth.signOut();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function initUserProgress(userId) {
  const _db = getDb();
  const initData = {
    totalPoints: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    wordsLearned: 0,
    totalExercisesCompleted: 0,
    averageAccuracy: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    badges: [],
    categoryProgress: {}
  };
  try { await _db.collection('users').doc(userId).collection('progress').doc('stats').set(initData); } catch(e) {}
  return initData;
}

async function getUserProgress(userId) {
  const _db = getDb();
  try {
    const doc = await _db.collection('users').doc(userId).collection('progress').doc('stats').get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function updateUserProgress(userId, updates) {
  const _db = getDb();
  try { await _db.collection('users').doc(userId).collection('progress').doc('stats').update(updates); } catch(e) {}
}

async function saveCategoryProgress(userId, categoryId, data) {
  const _db = getDb();
  try { await _db.collection('users').doc(userId).collection('categories').doc(categoryId).set(data, { merge: true }); } catch(e) {}
}

async function getCategoryProgress(userId, categoryId) {
  const _db = getDb();
  try {
    const doc = await _db.collection('users').doc(userId).collection('categories').doc(categoryId).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function saveExerciseResult(userId, data) {
  const _db = getDb();
  try { await _db.collection('users').doc(userId).collection('exercises').add({ ...data, completedAt: new Date().toISOString() }); } catch(e) {}
}

async function getUserBadges(userId) {
  const progress = await getUserProgress(userId);
  return progress?.badges || [];
}

async function addBadge(userId, badge) {
  const progress = await getUserProgress(userId);
  const badges = progress?.badges || [];
  if (!badges.find(b => b.id === badge.id)) {
    badges.push({ ...badge, earnedAt: new Date().toISOString() });
    await updateUserProgress(userId, { badges });
  }
}

async function getLeaderboard(limit = 20) {
  const _db = getDb();
  try {
    const snapshot = await _db.collection('users').orderBy('totalPoints', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch(e) { return []; }
}

var _authInit = getAuth();
if (_authInit && _authInit.onAuthStateChanged) {
  _authInit.onAuthStateChanged(user => {
    notifyAuthListeners(user);
    if (user) {
      loadUserProfile(user.uid);
    } else {
      userProfile = null;
    }
  });
}

async function loadUserProfile(userId) {
  const _db = getDb();
  if (!_db) return;
  try {
    const doc = await _db.collection('users').doc(userId).get();
    if (doc.exists) {
      userProfile = doc.data();
      const progress = await getUserProgress(userId);
      if (progress) {
        userProfile.progress = progress;
      }
    }
  } catch (e) {
    console.warn('Could not load user profile:', e.message);
  }
}
