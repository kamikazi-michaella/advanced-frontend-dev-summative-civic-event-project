var civicCurrentEvent = null;
var civicCurrentEventId = "";
var civicRegistrationActive = false;
var civicFeedbackNotice = "";

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
    status.textContent = event.published === false ? "Draft" : "Live";
    status.className = event.published === false
      ? "mt-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
      : "mt-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800";
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
        html = html + "<tr class=\"border-b border-stone-200\">" +
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

  civicEventDetailLoadFeedback(registered);
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

function civicFeedbackFormHtml(feedback) {
  var ratingOptions = "";
  var i;
  for (i = 5; i >= 1; i--) {
    var selected = "";
    if (feedback && Number(feedback.rating) === i) {
      selected = " selected";
    } else if (!feedback && i === 5) {
      selected = " selected";
    }
    ratingOptions = ratingOptions + '<option value="' + i + '"' + selected + '>' + i + ' star' + (i === 1 ? "" : "s") + "</option>";
  }

  var comment = "";
  if (feedback && feedback.comment) {
    comment = feedback.comment;
  }

  var notice = "";
  if (civicFeedbackNotice) {
    notice = '<div class="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">' +
      civicEscapeHtml(civicFeedbackNotice) + "</div>";
    civicFeedbackNotice = "";
  }

  return notice +
    '<div id="feedback-message" class="mb-3 hidden" role="alert"></div>' +
    '<form id="feedback-form" class="space-y-3" novalidate>' +
    "<div>" +
    '<label for="feedback-rating" class="mb-1 block text-sm font-medium text-stone-700">Rating</label>' +
    '<select id="feedback-rating" class="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900">' +
    ratingOptions + "</select>" +
    "</div>" +
    "<div>" +
    '<label for="feedback-comment" class="mb-1 block text-sm font-medium text-stone-700">Comment</label>' +
    '<textarea id="feedback-comment" rows="4" class="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900">' +
    civicEscapeHtml(comment) + "</textarea>" +
    '<p id="feedback-comment-error" class="mt-1 min-h-4 text-sm text-red-700"></p>' +
    "</div>" +
    '<button id="feedback-submit" type="submit" class="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">' +
    (feedback ? "Update feedback" : "Submit feedback") + "</button>" +
    "</form>";
}

function civicFeedbackSubmit(feedbackId) {
  var rating = Number($("#feedback-rating").val());
  var comment = $("#feedback-comment").val().trim();
  var valid = true;
  var button = document.getElementById("feedback-submit");

  CivicUI.showMessage("feedback-message", "", "error");
  CivicUI.showFieldError("feedback-comment", "");

  if (!rating || rating < 1 || rating > 5) {
    CivicUI.showMessage("feedback-message", "Choose a rating from 1 to 5.", "error");
    valid = false;
  }
  if (!comment) {
    CivicUI.showFieldError("feedback-comment", "Add a short comment about the event.");
    valid = false;
  }
  if (!valid) {
    return;
  }

  var request;
  if (feedbackId) {
    request = CivicAPI.putJson("/event-feedback/" + encodeURIComponent(feedbackId), {
      rating: rating,
      comment: comment
    });
  } else {
    request = CivicAPI.postJson("/event-feedback", {
      event_id: civicCurrentEventId,
      rating: rating,
      comment: comment
    });
  }

  civicSetLoading(button, true, "Saving...");

  request
    .done(function () {
      civicFeedbackNotice = feedbackId ? "Updated." : "Submitted.";
      civicEventDetailLoadFeedback(true);
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not save your feedback.");
      if (error.status === 409) {
        error.message = "You already submitted feedback for this event. Reload the page to edit it.";
      }
      CivicUI.showMessage("feedback-message", error.message, "error");
    });
}

function civicEventDetailShowUserFeedback(feedback) {
  var content = document.getElementById("feedback-content");
  content.innerHTML = civicFeedbackFormHtml(feedback);
  $("#feedback-form").on("submit", function (event) {
    event.preventDefault();
    civicFeedbackSubmit(feedback ? feedback.id : "");
  });
}

function civicEventDetailLoadAdminFeedback() {
  var content = document.getElementById("feedback-content");
  content.innerHTML = '<p class="text-sm text-stone-500">Loading...</p>';

  CivicAPI.get("/event-feedback/event/" + encodeURIComponent(civicCurrentEventId) + "")
    .done(function (response) {
      var feedbacks = response.data || [];
      var html = "";
      var sum = 0;
      var average = 0;
      var i;

      if (feedbacks.length === 0) {
        content.innerHTML = '<p class="text-sm text-stone-500">No feedback yet.</p>';
        return;
      }

      for (i = 0; i < feedbacks.length; i++) {
        sum = sum + Number(feedbacks[i].rating || 0);
      }
      average = Math.round((sum / feedbacks.length) * 10) / 10;

      html = '<div class="mb-4 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">' +
        "Average: <strong class=\"text-emerald-800\">" + average + " / 5</strong> from " +
        feedbacks.length + " response" + (feedbacks.length === 1 ? "" : "s") + "</div>" +
        '<div class="overflow-x-auto"><table class="min-w-full border-collapse text-left text-sm">' +
        '<thead><tr class="border-b border-stone-200 text-stone-500">' +
        '<th class="px-3 py-2">Member</th><th class="px-3 py-2">Rating</th>' +
        '<th class="px-3 py-2">Comment</th><th class="px-3 py-2">Submitted</th></tr></thead><tbody>';

      for (i = 0; i < feedbacks.length; i++) {
        html = html + '<tr class="border-b border-stone-200">' +
          '<td class="px-3 py-2">' + civicEscapeHtml(feedbacks[i].full_name || "Member") + "</td>" +
          '<td class="px-3 py-2">' + civicEscapeHtml(feedbacks[i].rating) + " / 5</td>" +
          '<td class="px-3 py-2">' + civicEscapeHtml(feedbacks[i].comment || "") + "</td>" +
          '<td class="px-3 py-2">' + civicEscapeHtml(civicFormatDate(feedbacks[i].created_at)) + "</td>" +
          "</tr>";
      }

      html = html + "</tbody></table></div>";
      content.innerHTML = html;
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load event feedback.");
      content.innerHTML = '<div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">' +
        civicEscapeHtml(error.message) + "</div>";
    });
}

function civicEventDetailLoadFeedback(registered) {
  var section = document.getElementById("feedback-section");

  // ROLE GUARD: admins see all event feedback and the average rating.
  // Admins do not submit attendee feedback.
  if (CivicAuth.isAdmin()) {
    section.classList.remove("hidden");
    civicEventDetailLoadAdminFeedback();
    return;
  }

  // ROLE GUARD: normal users only see the feedback form when they are registered.
  // The per-event feedback endpoint is admin only, so members cannot load all feedback or an average.
  if (!registered) {
    section.classList.add("hidden");
    document.getElementById("feedback-content").innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  document.getElementById("feedback-content").innerHTML = '<p class="text-sm text-stone-500">Loading...</p>';

  CivicAPI.get("/event-feedback/my-feedback")
    .done(function (response) {
      var feedbacks = response.data || [];
      var ownFeedback = null;
      var i;

      for (i = 0; i < feedbacks.length; i++) {
        if (feedbacks[i].event_id === civicCurrentEventId) {
          ownFeedback = feedbacks[i];
        }
      }
      civicEventDetailShowUserFeedback(ownFeedback);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load your feedback.");
      document.getElementById("feedback-content").innerHTML =
        '<div class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200" role="alert">' +
        civicEscapeHtml(error.message) + "</div>";
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
      sessionStorage.setItem("civic_page_message", "Event deleted.");
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
        civicEventDetailLoadFeedback(true);
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
