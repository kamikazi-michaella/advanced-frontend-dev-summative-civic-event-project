function civicLoginStart() {
  var flash = sessionStorage.getItem("civic_flash");
  var loginMessage = sessionStorage.getItem("civic_login_message");

  if (flash) {
    sessionStorage.removeItem("civic_flash");
    CivicUI.showToast(flash, "success");
  }
  if (loginMessage) {
    sessionStorage.removeItem("civic_login_message");
    CivicUI.showMessage("login-error", loginMessage, "error");
  }

  CivicUI.setupPasswordToggle("toggle-login-password", "login-password");

  $("#login-form").on("submit", function (event) {
    event.preventDefault();
    CivicUI.clearFieldErrors("login-form");
    CivicUI.showMessage("login-error", "", "error");

    var email = $("#login-email").val().trim();
    var password = $("#login-password").val();
    var remember = $("#login-remember").is(":checked");
    var valid = true;

    if (!email) {
      CivicUI.showFieldError("login-email", "Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      CivicUI.showFieldError("login-email", "Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      CivicUI.showFieldError("login-password", "Password is required.");
      valid = false;
    }

    if (!valid) {
      return;
    }

    var button = document.getElementById("login-submit");
    CivicUI.setLoading(button, true, "Logging in...");

    CivicAPI.publicPost("/auth/login", { email: email, password: password })
      .done(function (response) {
        if (!response.data || !response.data.token || !response.data.user) {
          CivicUI.setLoading(button, false);
          CivicUI.showMessage("login-error", "The login response was incomplete. Please try again.", "error");
          return;
        }

        CivicAuth.saveSession(response.data.token, response.data.user, remember);
        CivicAuth.redirectAfterLogin();
      })
      .fail(function (xhr) {
        CivicUI.setLoading(button, false);
        var error = CivicAPI.normalizeError(xhr, "Could not log in. Check your details and try again.");
        if (error.status === 401) {
          error.message = "Email or password is incorrect.";
        }
        CivicUI.showMessage("login-error", error.message, "error");
      });
  });
}

$(document).ready(function () {
  civicLoginStart();
});
