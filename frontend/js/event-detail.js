var civicCurrentEvent = null;
var civicCurrentEventId = "";
var civicRegistrationActive = false;

function civicEventDetailShowError(message) {
  document.getElementById("event-loading").classList.add("hidden");
  document.getElementById("event-content").classList.add("hidden");
  CivicUI.showMessage("event-error", message, "error");
}

function civicEventDetailRender(event) {
  var isAdmin = CivicAuth.isAdmin();
  var status = document.getElementById("event-status");
  var imageWrap = document.getElementById("event-image-wrap");
  var image = document.getElementById("event-image");
  var mapLink = document.getElementById("event-map-link");
  var location = event.location || "Location not provided";

  document.title = event.title + " | CivicEvents+";
  document.getElementById("event-title").textContent = event.title || "Untitled event";
  document.getElementById("event-starts").textContent = civicFormatDate(event.starts_at);
  document.getElementById("event-ends").textContent = civicFormatDate(event.ends_at);
  document.getElementById("event-location").textContent = location;
  document.getElementById("event-description").textContent = event.description || "No description provided.";

  if (event.location) {
    mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.location);
  } else {
    mapLink.classList.add("hidden");
  }

  if (event.metadata && event.metadata.image_url) {
    image.src = event.metadata.image_url;
    image.alt = "Event image for " + (event.title || "event");
    imageWrap.classList.remove("hidden");
  }

  if (isAdmin) {
    status.classList.remove("hidden");
    status.textContent = event.published === false ? "Unpublished event" : "Published event";
    status.className = event.published === false
      ? "mt-2 hidden rounded bg-amber-900 px-2 py-1 text-xs text-amber-200"
      : "mt-2 hidden rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200";
    status.classList.remove("hidden");
    document.getElementById("event-edit-link").href = "event-form.html?id=" + encodeURIComponent(event.id);
    document.getElementById("event-admin-actions").classList.remove("hidden");
  }

  document.getElementById("event-loading").classList.add("hidden");
  document.getElementById("event-content").classList.remove("hidden");
}

function civicEventDetailLoadAttendees() {
  document.getElementById("attendees-loading").classList.remove("hidden");
  document.getElementById("attendees-section").classList.remove("hidden");

  CivicAPI.get("/event-registrations/event/" + encodeURIComponent(civicCurrentEventId) + "/attendees")
    .done(function (response) {
      var attendees = response.data || [];
      var body = document.getElementById("attendees-body");
      var html = "";
      var i;

      for (i = 0; i < attendees.length; i++) {
        html = html + "<tr class=\"border-b border-slate-800\">" +
          "<td class=\"px-3 py-2\">" + civicEscapeHtml(attendees[i].full_name) + "</td>" +
          "<td class=\"px-3 py-2\">" + civicEscapeHtml(attendees[i].email) + "</td>" +
          "<td class=\"px-3 py-2\">" + civicEscapeHtml(civicFormatDate(attendees[i].created_at)) + "</td>" +
          "</tr>";
      }

      body.innerHTML = html;
      document.getElementById("attendees-loading").classList.add("hidden");

      if (attendees.length === 0) {
        document.getElementById("attendees-empty").classList.remove("hidden");
      } else {
        document.getElementById("attendees-table-wrap").classList.remove("hidden");
      }
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load attendees.");
      document.getElementById("attendees-loading").classList.add("hidden");
      CivicUI.showMessage("attendees-error", error.message, "error");
    });
}

function civicEventDetailSetRegistrationButtons(registered) {
  var registerButton = document.getElementById("register-button");
  var cancelButton = document.getElementById("cancel-registration-button");
  var message = document.getElementById("registration-message");

  civicRegistrationActive = registered;

  if (registered) {
    registerButton.classList.add("hidden");
    cancelButton.classList.remove("hidden");
    civicShowMessage("registration-message", "You are registered for this event.", "success");
  } else {
    registerButton.classList.remove("hidden");
    cancelButton.classList.add("hidden");
    civicShowMessage("registration-message", "You are not registered for this event yet.", "info");
  }
}

function civicEventDetailLoadRegistration() {
  // ROLE GUARD: registration controls are hidden for admins.
  // Admins must not register for events.
  if (!CivicAuth.isMember()) {
    return;
  }

  document.getElementById("registration-section").classList.remove("hidden");

  CivicAPI.get("/event-registrations/my-registrations")
    .done(function (response) {
      var registrations = response.data || [];
      var registered = false;
      var i;

      for (i = 0; i < registrations.length; i++) {
        if (registrations[i].event_id === civicCurrentEventId && registrations[i].status === "registered") {
          registered = true;
        }
      }
      civicEventDetailSetRegistrationButtons(registered);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load your registration.");
      civicShowMessage("registration-message", error.message, "error");
    });
}

function civicEventDetailRegister() {
  var button = document.getElementById("register-button");
  civicSetLoading(button, true, "Registering...");

  CivicAPI.postJson("/event-registrations/register", { event_id: civicCurrentEventId })
    .done(function () {
      civicSetLoading(button, false);
      civicEventDetailLoadRegistration();
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not register for this event.");
      if (error.status === 409) {
        error.message = "This account already has a registration for this event. If you cancelled before, the backend does not allow registering again.";
      }
      civicShowMessage("registration-message", error.message, "error");
    });
}

function civicEventDetailCancel() {
  var button = document.getElementById("cancel-registration-button");
  if (!window.confirm("Cancel your registration for this event?")) {
    return;
  }

  civicSetLoading(button, true, "Cancelling...");

  CivicAPI.postJson("/event-registrations/cancel", { event_id: civicCurrentEventId })
    .done(function () {
      civicSetLoading(button, false);
      civicEventDetailLoadRegistration();
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not cancel this registration.");
      civicShowMessage("registration-message", error.message, "error");
    });
}

function civicEventDetailDelete() {
  if (!window.confirm("Delete this event? This cannot be undone.")) {
    return;
  }

  var button = document.getElementById("event-delete-button");
  civicSetLoading(button, true, "Deleting...");

  CivicAPI.remove("/events/" + encodeURIComponent(civicCurrentEventId))
    .done(function () {
      sessionStorage.setItem("civic_page_message", "Event deleted successfully.");
      window.location.href = "events.html";
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not delete this event.");
      if (error.status === 500) {
        error.message = "This event may still have registrations. The database blocked the delete, so the event was not removed.";
      }
      CivicUI.showMessage("event-error", error.message, "error");
    });
}

function civicEventDetailLoad() {
  civicCurrentEventId = CivicUI.getQueryParam("id");

  if (!civicCurrentEventId) {
    civicEventDetailShowError("No event id was provided. Return to the events list and choose an event.");
    return;
  }

  CivicAPI.get("/events/" + encodeURIComponent(civicCurrentEventId))
    .done(function (response) {
      var event = response.data;
      if (!event) {
        civicEventDetailShowError("Event not found.");
        return;
      }

      // ROLE GUARD: normal users cannot view an unpublished event by direct URL.
      // The UI blocks it, and the backend remains the final security layer.
      if (!CivicAuth.isAdmin() && event.published === false) {
        civicEventDetailShowError("This event is not available.");
        return;
      }

      civicCurrentEvent = event;
      civicEventDetailRender(event);

      if (CivicAuth.isAdmin()) {
        civicEventDetailLoadAttendees();
      } else {
        civicEventDetailLoadRegistration();
      }
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load this event.");
      civicEventDetailShowError(error.message);
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }

  var flash = sessionStorage.getItem("civic_page_message");
  if (flash) {
    sessionStorage.removeItem("civic_page_message");
    CivicUI.showMessage("event-error", flash, "success");
  }

  $("#register-button").on("click", function () {
    civicEventDetailRegister();
  });
  $("#cancel-registration-button").on("click", function () {
    civicEventDetailCancel();
  });
  $("#event-delete-button").on("click", function () {
    civicEventDetailDelete();
  });

  civicEventDetailLoad();
});
