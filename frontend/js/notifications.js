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
      '" class="font-medium text-emerald-800 hover:underline">Event</a>';
  }
  if (meta.announcement_id) {
    return '<a href="announcement-detail.html?id=' + encodeURIComponent(meta.announcement_id) +
      '" class="font-medium text-emerald-800 hover:underline">Notice</a>';
  }
  if (meta.promo_id) {
    return '<a href="promo-detail.html?id=' + encodeURIComponent(meta.promo_id) +
      '" class="font-medium text-emerald-800 hover:underline">Promo</a>';
  }
  return "";
}

function civicNotificationCard(item, isAdmin) {
  var unread = item.read === false;
  var rowClass = unread
    ? "border-l-4 border-l-emerald-600 bg-emerald-50 px-4 py-4 sm:px-5"
    : "border-l-4 border-l-transparent bg-white px-4 py-4 sm:px-5";
  var dot = unread ? '<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-label="Unread"></span>' : "";
  var deleteButton = "";

  // ROLE GUARD: notification deletion is admin only. The backend also enforces this.
  if (isAdmin) {
    deleteButton = '<button type="button" class="text-xs font-medium text-red-700 hover:underline" data-notification-delete="' +
      civicEscapeHtml(item.id) + '">Delete</button>';
  }

  return '<article class="' + rowClass + '">' +
    '<div class="flex items-start gap-3">' + dot +
    '<div class="min-w-0 flex-1">' +
    '<h2 class="font-medium text-stone-900">' + civicEscapeHtml(item.title) + "</h2>" +
    '<p class="mt-1 text-sm text-stone-600">' + civicEscapeHtml(item.message) + "</p>" +
    '<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">' +
    "<span>" + civicEscapeHtml(item.type) + "</span>" +
    "<span>" + civicEscapeHtml(civicFormatDate(item.created_at)) + "</span>" +
    civicNotificationRelatedLink(item) +
    deleteButton +
    "</div></div></div></article>";
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
      CivicUI.showMessage("notifications-message", "Deleted.", "success");
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
