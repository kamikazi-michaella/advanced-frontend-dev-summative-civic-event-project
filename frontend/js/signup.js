function civicSignupValidate() {
  CivicUI.clearFieldErrors("signup-form");
  CivicUI.showMessage("signup-error", "", "error");

  var fullName = $("#signup-full-name").val().trim();
  var email = $("#signup-email").val().trim();
  var password = $("#signup-password").val();
  var confirmPassword = $("#signup-confirm-password").val();
  var score = CivicUI.passwordScore(password);
  var valid = true;

  if (!fullName) {
    CivicUI.showFieldError("signup-full-name", "Full name is required.");
    valid = false;
  }

  if (!email) {
    CivicUI.showFieldError("signup-email", "Email is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    CivicUI.showFieldError("signup-email", "Enter a valid email address.");
    valid = false;
  }

  if (score < 5) {
    CivicUI.showFieldError("signup-password", "Use at least 8 characters with uppercase, lowercase, number, and special character.");
    valid = false;
  }

  if (!confirmPassword) {
    CivicUI.showFieldError("signup-confirm-password", "Confirm your password.");
    valid = false;
  } else if (password !== confirmPassword) {
    CivicUI.showFieldError("signup-confirm-password", "Passwords do not match.");
    valid = false;
  }

  if (!valid) {
    return false;
  }

  return {
    full_name: fullName,
    email: email,
    password: password,
    role: $("#signup-role").val()
  };
}

function civicSignupStart() {
  CivicUI.setupPasswordToggle("toggle-signup-password", "signup-password");
  CivicUI.setupPasswordToggle("toggle-signup-confirm-password", "signup-confirm-password");

  $("#signup-password").on("input", function () {
    CivicUI.updatePasswordMeter($(this).val());
  });

  $("#signup-form").on("submit", function (event) {
    event.preventDefault();
    var data = civicSignupValidate();
    if (!data) {
      return;
    }

    var button = document.getElementById("signup-submit");
    CivicUI.setLoading(button, true, "Creating account...");

    CivicAPI.publicPost("/auth/signup", data)
      .done(function () {
        sessionStorage.setItem("civic_flash", "Account created successfully. Please log in.");
        window.location.href = "login.html";
      })
      .fail(function (xhr) {
        CivicUI.setLoading(button, false);
        var error = CivicAPI.normalizeError(xhr, "Could not create the account. Please try again.");
        CivicUI.showMessage("signup-error", error.message, "error");
      });
  });
}

$(document).ready(function () {
  civicSignupStart();
});
