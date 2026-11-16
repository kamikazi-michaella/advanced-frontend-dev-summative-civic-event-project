$(document).ready(function () {
  if (CivicAuth.isLoggedIn()) {
    CivicAuth.redirectAfterLogin();
  }
});
