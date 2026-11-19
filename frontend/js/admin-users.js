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

function civicUsersStatus(user) {
  if (user.is_active) {
    return '<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Active</span>';
  }
  return '<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Inactive</span>';
}

function civicUsersAction(user, currentUser) {
  if (currentUser && currentUser.id === user.id) {
    // ROLE GUARD: keep the current admin from disabling their own account.
    return '<span class="text-xs text-stone-500">Current account</span>';
  }
  if (user.is_active) {
    return '<button type="button" class="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50" data-user-action="disable" data-user-id="' +
      civicEscapeHtml(user.id) + '">Disable</button>';
  }
  return '<button type="button" class="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50" data-user-action="enable" data-user-id="' +
    civicEscapeHtml(user.id) + '">Enable</button>';
}

function civicUsersRender() {
  var totalPages = Math.ceil(civicUsersFiltered.length / civicUsersPerPage);
  var start = (civicUsersPage - 1) * civicUsersPerPage;
  var end = start + civicUsersPerPage;
  var body = document.getElementById("users-table-body");
  var mobile = document.getElementById("users-mobile-list");
  var pagination = document.getElementById("users-pagination");
  var currentUser = CivicAuth.getUser();
  var html = "";
  var mobileHtml = "";
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
    html = html + '<tr class="border-b border-stone-200">' +
      '<td class="px-4 py-3 text-stone-900">' + civicEscapeHtml(user.full_name) + "</td>" +
      '<td class="px-4 py-3 text-stone-600">' + civicEscapeHtml(user.email) + "</td>" +
      '<td class="px-4 py-3 text-stone-600">' + civicEscapeHtml(user.role) + "</td>" +
      '<td class="px-4 py-3">' + civicUsersStatus(user) + "</td>" +
      '<td class="px-4 py-3">' + civicUsersAction(user, currentUser) + "</td>" +
      "</tr>";

    mobileHtml = mobileHtml + '<article class="rounded-md border border-stone-200 bg-white p-4">' +
      '<div class="flex items-start justify-between gap-3">' +
      '<div><p class="font-medium text-stone-900">' + civicEscapeHtml(user.full_name) + "</p>" +
      '<p class="mt-1 text-sm text-stone-600">' + civicEscapeHtml(user.email) + "</p></div>" +
      civicUsersStatus(user) + "</div>" +
      '<div class="mt-3 flex items-center justify-between text-xs text-stone-500">' +
      "<span>" + civicEscapeHtml(user.role) + "</span>" + civicUsersAction(user, currentUser) + "</div></article>";
  }

  body.innerHTML = html;
  mobile.innerHTML = mobileHtml;

  document.getElementById("users-count").textContent =
    civicUsersFiltered.length + " user" + (civicUsersFiltered.length === 1 ? "" : "s");

  if (civicUsersFiltered.length === 0) {
    document.getElementById("users-empty").classList.remove("hidden");
    document.getElementById("users-table-wrap").classList.add("hidden");
    mobile.classList.add("hidden");
  } else {
    document.getElementById("users-empty").classList.add("hidden");
    document.getElementById("users-table-wrap").classList.remove("hidden");
    mobile.classList.remove("hidden");
  }

  for (i = 1; i <= totalPages; i++) {
    var style = "rounded-md border px-3 py-2 text-sm ";
    if (i === civicUsersPage) {
      style = style + "border-emerald-700 bg-emerald-700 font-medium text-white";
    } else {
      style = style + "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
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
      CivicUI.showMessage("users-message", action === "disable" ? "User disabled." : "User enabled.", "success");
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
