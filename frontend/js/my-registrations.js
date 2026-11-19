function civicRegistrationsRender(items) {
  var list = document.getElementById("registrations-list");
  var html = "";
  var i;

  for (i = 0; i < items.length; i++) {
    html = html + '<article class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">' +
      '<div><h2 class="font-serif text-lg text-stone-900">' + civicEscapeHtml(items[i].title) + "</h2>" +
      '<p class="mt-1 text-sm text-stone-600">' + civicEscapeHtml(civicFormatDate(items[i].starts_at)) + "</p>" +
      '<p class="text-sm text-stone-500">' + civicEscapeHtml(items[i].location || "Location not provided") + "</p></div>" +
      '<div class="flex shrink-0 flex-wrap gap-2">' +
      '<a href="event-detail.html?id=' + encodeURIComponent(items[i].event_id) +
      '" class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">View</a>' +
      '<button type="button" class="rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50" data-cancel-event="' +
      civicEscapeHtml(items[i].event_id) + '">Cancel</button>' +
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
      CivicUI.showMessage("registrations-message", "Registration cancelled.", "success");
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
