function civicDashboardRenderEvents(events) {
  var list = document.getElementById("dashboard-events-list");
  var html = "";
  var shown = 0;
  var now = new Date().getTime();
  var i;

  for (i = 0; i < events.length && shown < 3; i++) {
    if (events[i].published === false) {
      continue;
    }
    if (new Date(events[i].starts_at).getTime() < now) {
      continue;
    }

    html = html + '<a href="event-detail.html?id=' + encodeURIComponent(events[i].id) +
      '" class="block px-5 py-4 hover:bg-stone-50">' +
      '<div class="flex items-start justify-between gap-3">' +
      '<div><p class="font-medium text-stone-900">' + civicEscapeHtml(events[i].title) + "</p>" +
      '<p class="mt-1 text-sm text-stone-500">' + civicEscapeHtml(civicFormatDate(events[i].starts_at)) + "</p>" +
      '<p class="text-sm text-stone-500">' + civicEscapeHtml(events[i].location || "Location not provided") + "</p></div>" +
      '<span class="text-sm font-medium text-emerald-800">View</span>' +
      "</div></a>";
    shown++;
  }

  list.innerHTML = html;
  document.getElementById("dashboard-events-loading").classList.add("hidden");

  if (shown === 0) {
    document.getElementById("dashboard-events-empty").classList.remove("hidden");
  }
}

function civicDashboardLoadEvents() {
  CivicAPI.get("/events")
    .done(function (response) {
      civicDashboardRenderEvents(response.data || []);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load upcoming events.");
      document.getElementById("dashboard-events-loading").classList.add("hidden");
      CivicUI.showMessage("dashboard-events-error", error.message, "error");
    });
}

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
      civicDashboardLoadEvents();
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
