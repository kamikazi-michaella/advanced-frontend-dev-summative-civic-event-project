var CivicAuth = {};

function civicGetActiveStorage() {
  if (localStorage.getItem(CivicConfig.TOKEN_KEY)) {
    return localStorage;
  }
  if (sessionStorage.getItem(CivicConfig.TOKEN_KEY)) {
    return sessionStorage;
  }
  return sessionStorage;
}

function civicGetToken() {
  return civicGetActiveStorage().getItem(CivicConfig.TOKEN_KEY);
}

function civicGetUser() {
  var stored = civicGetActiveStorage().getItem(CivicConfig.USER_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

function civicClearSession() {
  sessionStorage.removeItem(CivicConfig.TOKEN_KEY);
  sessionStorage.removeItem(CivicConfig.USER_KEY);
  sessionStorage.removeItem(CivicConfig.LOGIN_TIME_KEY);
  localStorage.removeItem(CivicConfig.TOKEN_KEY);
  localStorage.removeItem(CivicConfig.USER_KEY);
  localStorage.removeItem(CivicConfig.LOGIN_TIME_KEY);
}

function civicSaveSession(token, user, remember) {
  civicClearSession();
  var storage = remember ? localStorage : sessionStorage;
  var safeUser = {
    id: user.id,
    full_name: user.full_name,
    role: user.role
  };

  storage.setItem(CivicConfig.TOKEN_KEY, token);
  storage.setItem(CivicConfig.USER_KEY, JSON.stringify(safeUser));
  storage.setItem(CivicConfig.LOGIN_TIME_KEY, String(new Date().getTime()));
}

function civicUpdateStoredUser(user) {
  var storage = civicGetActiveStorage();
  var storedUser = civicGetUser();
  if (!storedUser) {
    return;
  }

  storedUser.full_name = user.full_name;
  if (user.id) {
    storedUser.id = user.id;
  }
  if (user.role) {
    storedUser.role = user.role;
  }
  storage.setItem(CivicConfig.USER_KEY, JSON.stringify(storedUser));
}

function civicIsLoggedIn() {
  var storage = civicGetActiveStorage();
  var token = storage.getItem(CivicConfig.TOKEN_KEY);
  var user = civicGetUser();
  var loginTime = Number(storage.getItem(CivicConfig.LOGIN_TIME_KEY));

  if (!token || !user || !loginTime) {
    civicClearSession();
    return false;
  }

  if (new Date().getTime() - loginTime > CivicConfig.LOGIN_MAX_AGE_MS) {
    civicClearSession();
    return false;
  }

  return true;
}

function civicIsAdmin() {
  var user = civicGetUser();
  return user && user.role === "admin";
}

function civicIsMember() {
  var user = civicGetUser();
  return user && user.role === "user";
}

function civicRedirectToLogin(message) {
  if (message) {
    sessionStorage.setItem("civic_login_message", message);
  }
  window.location.href = "login.html";
}

function civicRedirectAfterLogin() {
  if (civicIsAdmin()) {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

function civicLogout() {
  civicClearSession();
  window.location.href = "login.html";
}

CivicAuth.getToken = civicGetToken;
CivicAuth.getUser = civicGetUser;
CivicAuth.saveSession = civicSaveSession;
CivicAuth.updateStoredUser = civicUpdateStoredUser;
CivicAuth.isLoggedIn = civicIsLoggedIn;
CivicAuth.isAdmin = civicIsAdmin;
CivicAuth.isMember = civicIsMember;
CivicAuth.clearSession = civicClearSession;
CivicAuth.redirectToLogin = civicRedirectToLogin;
CivicAuth.redirectAfterLogin = civicRedirectAfterLogin;
CivicAuth.logout = civicLogout;
