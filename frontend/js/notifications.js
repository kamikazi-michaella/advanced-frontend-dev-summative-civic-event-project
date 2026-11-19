var civicNotifications = [];

function civicNotificationMeta(item) {
  var meta = item.metadata || {};
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch (error) {
      meta = {};
    }
  }
  return meta;
}

function civicNotificationRelatedLink(item) {
  var meta = civicNotificationMeta(item);
  if (meta.event_id) {
    return '<a href="event-detail.html?id=' + encodeURIComponent(meta.event_id) +
      '" class="text-sm text-cyan-300 hover:underline">Open event</a>';
  }
  if (meta.announcement_id) {
    return '<a href="announcement-detail.html?id=' + encodeURIComponent(meta.announcement_id) +
      '" class="text-sm text-cyan-300 hover:underline">Open announcement</a>';
  }
  if (meta.promo_id) {
    return '<a href="promo-detail.html?id=' + encodeURIComponent(meta.promo_id) +
      '" class="text-sm text-cyan-300 hover:underline">Open promo</a>';
  }
  return "";
}

function civicNotificationCard(item, isAdmin) {
  var status = item.read === false
    ? '<span class="rounded bg-red-900 px-2 py-1 text-xs text-red-200">Unread</span>'
    : '<span class="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">Read</span>';
  var deleteButton = "";

  // ROLE GUARD: notification deletion is admin only. The backend also enforces this.
  if (isAdmin) {
    deleteButton = '<button type="button" class="rounded border border-red-700 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950" data-notification-delete="' +
      civicEscapeHtml(item.id) + '">Delete</button>';
  }

  return '<article class="rounded-lg border border-slate-800 bg-slate-900 p-4">' +
    '<div class="flex flex-wrap items-start justify-between gap-3">' +
    '<div><h2 class="text-lg font-semibold text-cyan-300">' + civicEscapeHtml(item.title) + "</h2>" +
    '<p class="mt-1 text-sm text-slate-300">' + civicEscapeHtml(item.message) + "</p></div>" +
    '<div class="flex flex-wrap gap-2">' + status + "</div></div>" +
    '<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">' +
    "<span>Type: " + civicEscapeHtml(item.type) + "</span>" +
    "<span>" + civicEscapeHtml(civicFormatDate(item.created_at)) + "</span>" +
    civicNotificationRelatedLink(item) +
    deleteButton +
    "</div></article>";
}

function civicNotificationsRender(items) {
  var isAdmin = CivicAuth.isAdmin();
  var list = document.getElementById("notifications-list");
  var html = "";
  var i;

  for (i = 0; i < items.length; i++) {
    html = html + civicNotificationCard(items[i], isAdmin);
  }
  list.innerHTML = html;

  if (items.length === 0) {
    document.getElementById("notifications-empty").classList.remove("hidden");
  } else {
    document.getElementById("notifications-empty").classList.add("hidden");
  }

  $("[data-notification-delete]").on("click", function () {
    civicNotificationDelete($(this).attr("data-notification-delete"));
  });
}

function civicNotificationDelete(id) {
  if (!window.confirm("Delete this notification?")) {
    return;
  }

  CivicAPI.remove("/notifications/" + encodeURIComponent(id))
    .done(function () {
      CivicUI.showMessage("notifications-message", "Notification deleted successfully.", "success");
      civicNotificationsLoad();
      if (window.civicRefreshBell) {
        window.civicRefreshBell();
      }
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not delete this notification.");
      CivicUI.showMessage("notifications-message", error.message, "error");
    });
}

function civicNotificationsLoad() {
  document.getElementById("notifications-loading").classList.remove("hidden");

  CivicAPI.get("/notifications")
    .done(function (response) {
      civicNotifications = response.data || [];
      document.getElementById("notifications-loading").classList.add("hidden");
      civicNotificationsRender(civicNotifications);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load notifications.");
      document.getElementById("notifications-loading").classList.add("hidden");
      CivicUI.showMessage("notifications-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  civicNotificationsLoad();
});
