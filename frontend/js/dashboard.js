function civicDashboardLoad() {
  CivicAPI.get("/dashboard/me")
    .done(function (response) {
      var data = response.data || {};
      var registrations = data.registrations || {};
      var feedbacks = data.feedbacks || {};
      var notifications = data.notifications || {};
      var announcements = data.announcements || {};
      var promos = data.promos || {};

      document.getElementById("stat-registrations").textContent = registrations.total_registered_events || "0";
      document.getElementById("stat-feedbacks").textContent = feedbacks.total_feedbacks || "0";
      document.getElementById("stat-notifications").textContent = notifications.total_notifications || "0";
      document.getElementById("stat-unread").textContent = (notifications.unread_notifications || "0") + " unread";
      document.getElementById("stat-announcements").textContent = announcements.total_announcements || "0";
      document.getElementById("stat-promos").textContent = promos.total_promos || "0";

      document.getElementById("dashboard-loading").classList.add("hidden");
      document.getElementById("dashboard-content").classList.remove("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load your dashboard.");
      document.getElementById("dashboard-loading").classList.add("hidden");
      CivicUI.showMessage("dashboard-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  civicDashboardLoad();
});
