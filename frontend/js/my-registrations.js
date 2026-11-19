function civicRegistrationsRender(items) {
  var list = document.getElementById("registrations-list");
  var html = "";
  var i;

  for (i = 0; i < items.length; i++) {
    html = html + '<article class="rounded-lg border border-slate-800 bg-slate-900 p-4">' +
      '<div class="flex flex-wrap items-start justify-between gap-3">' +
      '<div><h2 class="text-lg font-semibold text-cyan-300">' + civicEscapeHtml(items[i].title) + "</h2>" +
      '<p class="mt-1 text-sm text-slate-300">' + civicEscapeHtml(civicFormatDate(items[i].starts_at)) + "</p>" +
      '<p class="mt-1 text-sm text-slate-400">' + civicEscapeHtml(items[i].location || "Location not provided") + "</p></div>" +
      '<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200">Registered</span>' +
      "</div>" +
      '<div class="mt-4 flex flex-wrap gap-2">' +
      '<a href="event-detail.html?id=' + encodeURIComponent(items[i].event_id) +
      '" class="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">View event</a>' +
      '<button type="button" class="rounded border border-red-700 px-3 py-2 text-sm text-red-200 hover:bg-red-950" data-cancel-event="' +
      civicEscapeHtml(items[i].event_id) + '">Cancel registration</button>' +
      "</div></article>";
  }

  list.innerHTML = html;

  if (items.length === 0) {
    document.getElementById("registrations-empty").classList.remove("hidden");
  } else {
    document.getElementById("registrations-empty").classList.add("hidden");
  }

  $("[data-cancel-event]").on("click", function () {
    civicRegistrationCancel($(this).attr("data-cancel-event"));
  });
}

function civicRegistrationsLoad() {
  document.getElementById("registrations-loading").classList.remove("hidden");

  CivicAPI.get("/event-registrations/my-registrations")
    .done(function (response) {
      var data = response.data || [];
      var active = [];
      var i;

      // The endpoint includes cancelled rows, so only show active registrations.
      for (i = 0; i < data.length; i++) {
        if (data[i].status === "registered") {
          active[active.length] = data[i];
        }
      }

      document.getElementById("registrations-loading").classList.add("hidden");
      civicRegistrationsRender(active);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load your registrations.");
      document.getElementById("registrations-loading").classList.add("hidden");
      CivicUI.showMessage("registrations-error", error.message, "error");
    });
}

function civicRegistrationCancel(eventId) {
  if (!window.confirm("Cancel this event registration?")) {
    return;
  }

  CivicAPI.postJson("/event-registrations/cancel", { event_id: eventId })
    .done(function () {
      CivicUI.showMessage("registrations-message", "Registration cancelled. The backend keeps the cancelled row.", "success");
      civicRegistrationsLoad();
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not cancel this registration.");
      CivicUI.showMessage("registrations-message", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  civicRegistrationsLoad();
});
