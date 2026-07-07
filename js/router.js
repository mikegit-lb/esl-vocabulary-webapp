const ROUTES = {
  'landing': { render: renderLanding, auth: false },
  'login': { render: renderLogin, auth: false },
  'signup': { render: renderSignup, auth: false },
  'dashboard': { render: renderDashboard, auth: true },
  'categories': { render: renderCategories, auth: true },
  'category': { render: renderCategory, auth: true },
  'word': { render: renderWord, auth: true },
  'exercise': { render: renderExercise, auth: true },
  'quiz': { render: renderQuiz, auth: true },
  'quiz-result': { render: renderQuizResult, auth: true },
  'progress': { render: renderProgress, auth: true },
  'badges': { render: renderBadges, auth: true },
  'profile': { render: renderProfile, auth: true },
  'leaderboard': { render: renderLeaderboard, auth: true },
  'settings': { render: renderSettings, auth: true },
};

let currentRoute = null;
let routeParams = {};

function navigateTo(path, params = {}) {
  routeParams = params;
  const route = ROUTES[path];
  if (!route) { navigateTo('landing'); return; }

  if (route.auth && !currentUser) {
    navigateTo('login');
    return;
  }

  if (!route.auth && currentUser && path === 'landing') {
    navigateTo('dashboard');
    return;
  }

  currentRoute = path;
  const app = document.getElementById('app');
  route.render(app, params);
  window.scrollTo(0, 0);
}

function getRouteParam(key, defaultVal = null) {
  return routeParams[key] !== undefined ? routeParams[key] : defaultVal;
}
