function civicAdminSetText(id, value) {
  var element = document.getElementById(id);
  if (element) {
    element.textContent = value || "0";
  }
}

function civicAdminGrowthChart(growth) {
  var chart = document.getElementById("user-growth-chart");
  var empty = document.getElementById("user-growth-empty");
  var max = 1;
  var html = "";
  var i;

  if (!growth || growth.length === 0) {
    chart.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  for (i = 0; i < growth.length; i++) {
    if (Number(growth[i].new_users) > max) {
      max = Number(growth[i].new_users);
    }
  }

  for (i = 0; i < growth.length; i++) {
    var count = Number(growth[i].new_users || 0);
    var height = Math.round((count / max) * 150);
    if (height < 4) {
      height = 4;
    }
    html = html + '<div class="flex min-w-16 flex-col items-center justify-end gap-1">' +
      '<span class="text-xs text-slate-300">' + count + "</span>" +
      '<div class="w-8 rounded-t bg-cyan-500" style="height:' + height + 'px" title="' +
      civicEscapeHtml(growth[i].month) + ": " + count + ' new users"></div>' +
      '<span class="text-xs text-slate-400">' + civicEscapeHtml(growth[i].month) + "</span>" +
      "</div>";
  }

  chart.innerHTML = html;
  chart.classList.remove("hidden");
  chart.classList.add("flex");
  empty.classList.add("hidden");
}

function civicAdminDashboardLoad() {
  CivicAPI.get("/dashboard/admin")
    .done(function (response) {
      var data = response.data || {};
      var users = data.users || {};
      var events = data.events || {};
      var registrations = data.registrations || {};
      var feedbacks = data.feedbacks || {};
      var promos = data.promos || {};
      var announcements = data.announcements || {};
      var notifications = data.notifications || {};

      civicAdminSetText("admin-total-users", users.total_users);
      civicAdminSetText("admin-active-users", users.active_users);
      civicAdminSetText("admin-inactive-users", users.inactive_users);
      civicAdminSetText("admin-total-events", events.total_events);
      civicAdminSetText("admin-upcoming-events", events.upcoming_events);
      civicAdminSetText("admin-past-events", events.past_events);
      civicAdminSetText("admin-registrations", registrations.total_registrations);
      civicAdminSetText("admin-feedbacks", feedbacks.total_feedback);
      civicAdminSetText("admin-promos", promos.total_promos);
      civicAdminSetText("admin-announcements", announcements.total_announcements);
      civicAdminSetText("admin-notifications", notifications.total_notifications);

      civicAdminGrowthChart(data.user_growth || []);

      document.getElementById("admin-dashboard-loading").classList.add("hidden");
      document.getElementById("admin-dashboard-content").classList.remove("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load the admin dashboard.");
      document.getElementById("admin-dashboard-loading").classList.add("hidden");
      CivicUI.showMessage("admin-dashboard-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  // ROLE GUARD: this page is admin only. The backend also protects /api/dashboard/admin.
  if (!CivicAuth.isAdmin()) {
    window.location.href = "dashboard.html";
    return;
  }
  civicAdminDashboardLoad();
});
