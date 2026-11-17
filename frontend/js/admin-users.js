var civicUsersAll = [];
var civicUsersFiltered = [];
var civicUsersPage = 1;
var civicUsersPerPage = 8;

function civicUsersApplyFilter(resetPage) {
  var term = $("#users-search").val().trim().toLowerCase();
  var i;
  var user;
  civicUsersFiltered = [];

  for (i = 0; i < civicUsersAll.length; i++) {
    user = civicUsersAll[i];
    if (!term ||
      (user.full_name || "").toLowerCase().indexOf(term) !== -1 ||
      (user.email || "").toLowerCase().indexOf(term) !== -1 ||
      (user.role || "").toLowerCase().indexOf(term) !== -1) {
      civicUsersFiltered[civicUsersFiltered.length] = user;
    }
  }

  if (resetPage !== false) {
    civicUsersPage = 1;
  }
  civicUsersRender();
}

function civicUsersRender() {
  var totalPages = Math.ceil(civicUsersFiltered.length / civicUsersPerPage);
  var start = (civicUsersPage - 1) * civicUsersPerPage;
  var end = start + civicUsersPerPage;
  var body = document.getElementById("users-table-body");
  var pagination = document.getElementById("users-pagination");
  var currentUser = CivicAuth.getUser();
  var html = "";
  var pageHtml = "";
  var i;

  if (totalPages < 1) {
    totalPages = 1;
  }
  if (civicUsersPage > totalPages) {
    civicUsersPage = totalPages;
    start = (civicUsersPage - 1) * civicUsersPerPage;
    end = start + civicUsersPerPage;
  }

  for (i = start; i < end && i < civicUsersFiltered.length; i++) {
    var user = civicUsersFiltered[i];
    var status = user.is_active
      ? '<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200">Active</span>'
      : '<span class="rounded bg-amber-900 px-2 py-1 text-xs text-amber-200">Inactive</span>';
    var action = "";

    if (currentUser && currentUser.id === user.id) {
      // ROLE GUARD: keep the current admin from disabling their own account.
      action = '<span class="text-xs text-slate-400">Current account</span>';
    } else if (user.is_active) {
      action = '<button type="button" class="rounded border border-red-700 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950" data-user-action="disable" data-user-id="' +
        civicEscapeHtml(user.id) + '">Disable</button>';
    } else {
      action = '<button type="button" class="rounded border border-emerald-700 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-950" data-user-action="enable" data-user-id="' +
        civicEscapeHtml(user.id) + '">Enable</button>';
    }

    html = html + "<tr class=\"border-b border-slate-800\">" +
      '<td class="px-4 py-3">' + civicEscapeHtml(user.full_name) + "</td>" +
      '<td class="px-4 py-3">' + civicEscapeHtml(user.email) + "</td>" +
      '<td class="px-4 py-3">' + civicEscapeHtml(user.role) + "</td>" +
      '<td class="px-4 py-3">' + status + "</td>" +
      '<td class="px-4 py-3">' + action + "</td>" +
      "</tr>";
  }

  body.innerHTML = html;
  document.getElementById("users-count").textContent =
    "Showing " + civicUsersFiltered.length + " user" + (civicUsersFiltered.length === 1 ? "" : "s") + ".";

  if (civicUsersFiltered.length === 0) {
    document.getElementById("users-empty").classList.remove("hidden");
    document.getElementById("users-table-wrap").classList.add("hidden");
  } else {
    document.getElementById("users-empty").classList.add("hidden");
    document.getElementById("users-table-wrap").classList.remove("hidden");
  }

  for (i = 1; i <= totalPages; i++) {
    var style = "rounded border px-3 py-2 text-sm ";
    if (i === civicUsersPage) {
      style = style + "border-cyan-500 bg-cyan-500 font-semibold text-slate-950";
    } else {
      style = style + "border-slate-600 text-slate-200 hover:bg-slate-800";
    }
    pageHtml = pageHtml + '<button type="button" class="' + style + '" data-page="' + i + '">' + i + "</button>";
  }
  pagination.innerHTML = pageHtml;

  $('[data-user-action]').on("click", function () {
    civicUsersChangeStatus($(this).attr("data-user-id"), $(this).attr("data-user-action"));
  });
  $('#users-pagination button').on("click", function () {
    civicUsersPage = Number($(this).attr("data-page"));
    civicUsersRender();
    window.scrollTo(0, 0);
  });
}

function civicUsersChangeStatus(userId, action) {
  var label = action === "disable" ? "disable" : "enable";
  if (action === "disable" && !window.confirm("Disable this user account?")) {
    return;
  }

  var endpoint = "/users/" + encodeURIComponent(userId) + "/" + (action === "disable" ? "disable" : "enable");

  CivicAPI.patchJson(endpoint, {})
    .done(function (response) {
      var updated = response.data || {};
      var i;
      for (i = 0; i < civicUsersAll.length; i++) {
        if (civicUsersAll[i].id === userId) {
          civicUsersAll[i].is_active = updated.is_active;
        }
      }
      CivicUI.showMessage("users-message", "User " + label + "d successfully.", "success");
      civicUsersApplyFilter(false);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not " + label + " this user.");
      CivicUI.showMessage("users-message", error.message, "error");
    });
}

function civicUsersLoad() {
  // ROLE GUARD: this page and the users endpoint are admin only.
  // The endpoint returns a plain array, so request a high limit and page in the browser.
  CivicAPI.get("/users?limit=1000")
    .done(function (response) {
      civicUsersAll = response.data || [];
      document.getElementById("users-loading").classList.add("hidden");
      civicUsersApplyFilter();
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load users.");
      document.getElementById("users-loading").classList.add("hidden");
      CivicUI.showMessage("users-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  if (!CivicAuth.isAdmin()) {
    window.location.href = "dashboard.html";
    return;
  }

  $("#users-search").on("input", function () {
    civicUsersApplyFilter();
  });

  civicUsersLoad();
});
