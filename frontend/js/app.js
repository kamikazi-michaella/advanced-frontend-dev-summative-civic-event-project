var CIVIC_ACCESS_OK = false;

function civicAppShowPageMessage() {
  var message = sessionStorage.getItem("civic_page_message");
  if (message) {
    sessionStorage.removeItem("civic_page_message");
    CivicUI.showMessage("page-message", message, "info");
  }
}

function civicAppSetupHeader() {
  var user = CivicAuth.getUser();
  if (user) {
    $("#header-user-name").text(user.full_name || "User");
    $("#header-user-role").text(user.role === "admin" ? "Administrator" : "Member");
  }

  $("[data-admin-only]").addClass("hidden");
  $("[data-member-only]").addClass("hidden");

  // ROLE GUARD: admin controls are only revealed for admin users.
  // This is a usability guard only. The backend still enforces permissions.
  if (CivicAuth.isAdmin()) {
    $("[data-admin-only]").removeClass("hidden");
  }

  // ROLE GUARD: member controls are only revealed for normal users.
  // Admins cannot register for events or use member-only pages.
  if (CivicAuth.isMember()) {
    $("[data-member-only]").removeClass("hidden");
  }
}

function civicAppSetActiveNav() {
  var page = document.body.getAttribute("data-page");
  if (!page) {
    page = window.location.pathname.split("/").pop().replace(".html", "");
  }

  $("[data-nav]").each(function () {
    var link = $(this);
    if (link.attr("data-nav") === page) {
      link.addClass("bg-slate-800 text-cyan-300");
      link.attr("aria-current", "page");
    }
  });
}

function civicAppSetupProfileMenu() {
  var button = document.getElementById("profile-menu-button");
  var menu = document.getElementById("profile-menu");
  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", function () {
    var expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", expanded ? "false" : "true");
    menu.classList.toggle("hidden");
  });

  $(document).on("click", function (event) {
    if ($(event.target).closest("#profile-menu-wrap").length === 0) {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
    }
  });
}

function civicAppLoadBellCount() {
  if (!CivicAuth.isLoggedIn()) {
    return;
  }

  CivicAPI.get("/notifications").done(function (response) {
    var notifications = response.data || [];
    var unread = 0;
    var i;
    for (i = 0; i < notifications.length; i++) {
      if (notifications[i].read === false) {
        unread++;
      }
    }

    var count = document.getElementById("notification-count");
    if (!count) {
      return;
    }
    if (unread > 0) {
      count.textContent = String(unread);
      count.classList.remove("hidden");
    } else {
      count.textContent = "0";
      count.classList.add("hidden");
    }
  });
}

function civicAppStart() {
  var body = document.body;
  var requireAdmin = body.getAttribute("data-require-admin") === "true";
  var memberPage = body.getAttribute("data-member-page") === "true";

  if (!CivicAuth.isLoggedIn()) {
    CivicAuth.redirectToLogin("Please log in to continue.");
    return;
  }

  // ROLE GUARD: block normal users from admin-only pages.
  // This protects the UI only. The API enforces the real permission check.
  if (requireAdmin && !CivicAuth.isAdmin()) {
    sessionStorage.setItem("civic_page_message", "You do not have permission to open that admin page.");
    window.location.href = "dashboard.html";
    return;
  }

  // ROLE GUARD: block admins from member-only pages such as the member dashboard.
  // Admins do not register for events or submit attendee feedback.
  if (memberPage && !CivicAuth.isMember()) {
    sessionStorage.setItem("civic_page_message", "That page is for member accounts only.");
    window.location.href = "admin-dashboard.html";
    return;
  }

  CIVIC_ACCESS_OK = true;
  window.CIVIC_ACCESS_OK = true;

  civicAppShowPageMessage();
  civicAppSetupHeader();
  civicAppSetActiveNav();
  civicAppSetupProfileMenu();
  civicAppLoadBellCount();

  $(".logout-button").on("click", function () {
    CivicAuth.logout();
  });

  $("#global-search-form").on("submit", function (event) {
    event.preventDefault();
    var term = $("#global-search-input").val();
    if (term) {
      window.location.href = "events.html?q=" + encodeURIComponent(term);
    }
  });

  var user = CivicAuth.getUser();
  if (user && user.full_name) {
    $("#profile-menu-name").text(user.full_name);
  }
}

window.civicRefreshBell = civicAppLoadBellCount;

$(document).ready(function () {
  civicAppStart();
});
