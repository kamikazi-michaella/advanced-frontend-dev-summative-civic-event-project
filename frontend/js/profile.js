function civicProfileLoad() {
  CivicAPI.get("/users/profile/me")
    .done(function (response) {
      var user = response.data;
      if (!user) {
        CivicUI.showMessage("profile-error", "Profile not found.", "error");
        document.getElementById("profile-loading").classList.add("hidden");
        return;
      }

      $("#profile-full-name").val(user.full_name || "");
      $("#profile-email").val(user.email || "");
      document.getElementById("profile-role").textContent = user.role === "admin" ? "Administrator" : "Member";
      document.getElementById("profile-status").textContent = user.is_active ? "Active" : "Inactive";
      document.getElementById("profile-status").className = user.is_active
        ? "mt-1 font-semibold text-emerald-300"
        : "mt-1 font-semibold text-amber-300";

      document.getElementById("profile-loading").classList.add("hidden");
      document.getElementById("profile-content").classList.remove("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load your profile.");
      document.getElementById("profile-loading").classList.add("hidden");
      CivicUI.showMessage("profile-error", error.message, "error");
    });
}

function civicProfileSubmit(event) {
  event.preventDefault();
  CivicUI.clearFieldErrors("profile-form");
  CivicUI.showMessage("profile-message", "", "error");

  var fullName = $("#profile-full-name").val().trim();
  var email = $("#profile-email").val().trim();
  var valid = true;

  if (!fullName) {
    CivicUI.showFieldError("profile-full-name", "Full name is required.");
    valid = false;
  }
  if (!email) {
    CivicUI.showFieldError("profile-email", "Email is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    CivicUI.showFieldError("profile-email", "Enter a valid email address.");
    valid = false;
  }

  if (!valid) {
    return;
  }

  var button = document.getElementById("profile-submit");
  civicSetLoading(button, true, "Saving...");

  // Only full_name and email are sent. The backend rejects role and is_active.
  CivicAPI.patchJson("/users/profile/me", { full_name: fullName, email: email })
    .done(function (response) {
      var user = response.data || {};
      civicSetLoading(button, false);
      CivicAuth.updateStoredUser(user);
      $("#profile-menu-name").text(user.full_name || fullName);
      CivicUI.showMessage("profile-message", "Profile updated successfully.", "success");
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not update your profile.");
      if (error.status === 409) {
        error.message = "That email address is already used by another account.";
      }
      CivicUI.showMessage("profile-message", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }

  $("#profile-form").on("submit", function (event) {
    civicProfileSubmit(event);
  });

  civicProfileLoad();
});
