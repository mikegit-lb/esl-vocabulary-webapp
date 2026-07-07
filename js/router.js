const ROUTES = {};

let currentRoute = null;
let routeParams = {};

function registerRoutes(routes) {
  Object.assign(ROUTES, routes);
}

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
  const content = document.getElementById('page-content') || document.getElementById('app');
  route.render(content, params);
  window.scrollTo(0, 0);
}

function getRouteParam(key, defaultVal = null) {
  return routeParams[key] !== undefined ? routeParams[key] : defaultVal;
}
