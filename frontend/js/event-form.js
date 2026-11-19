var civicEventFormId = "";
var civicEventFormPreviewUrl = "";

function civicEventFormLocalValue(value) {
  if (!value) {
    return "";
  }
  var date = new Date(value);
  if (isNaN(date.getTime())) {
    return "";
  }
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return date.getFullYear() + "-" + month + "-" + day + "T" + hours + ":" + minutes;
}

function civicEventFormValidateImage() {
  var input = document.getElementById("event-image-input");
  if (!input.files || input.files.length === 0) {
    return true;
  }

  var file = input.files[0];
  var name = file.name.toLowerCase();
  var allowed = /\.(jpg|jpeg|png|gif)$/.test(name);

  if (!allowed) {
    CivicUI.showFieldError("event-image-input", "Choose a JPG, JPEG, PNG, or GIF image.");
    return false;
  }
  if (file.size > 2 * 1024 * 1024) {
    CivicUI.showFieldError("event-image-input", "The image must be 2 MB or smaller.");
    return false;
  }

  CivicUI.showFieldError("event-image-input", "");
  return true;
}

function civicEventFormShowPreview() {
  var input = document.getElementById("event-image-input");
  var wrap = document.getElementById("event-image-preview-wrap");
  var image = document.getElementById("event-image-preview");

  if (!input.files || input.files.length === 0) {
    wrap.classList.add("hidden");
    return;
  }

  if (civicEventFormPreviewUrl) {
    URL.revokeObjectURL(civicEventFormPreviewUrl);
  }
  civicEventFormPreviewUrl = URL.createObjectURL(input.files[0]);
  image.src = civicEventFormPreviewUrl;
  wrap.classList.remove("hidden");
}

function civicEventFormValidate() {
  CivicUI.clearFieldErrors("event-form");
  CivicUI.showMessage("event-form-error", "", "error");

  var title = $("#event-title-input").val().trim();
  var description = $("#event-description-input").val().trim();
  var location = $("#event-location-input").val().trim();
  var starts = $("#event-starts-input").val();
  var ends = $("#event-ends-input").val();
  var valid = true;

  if (!title) {
    CivicUI.showFieldError("event-title-input", "Title is required.");
    valid = false;
  }
  if (!description) {
    CivicUI.showFieldError("event-description-input", "Description is required.");
    valid = false;
  }
  if (!location) {
    CivicUI.showFieldError("event-location-input", "Location is required.");
    valid = false;
  }
  if (!starts) {
    CivicUI.showFieldError("event-starts-input", "Start date and time are required.");
    valid = false;
  }
  if (!ends) {
    CivicUI.showFieldError("event-ends-input", "End date and time are required.");
    valid = false;
  }
  if (starts && ends && new Date(ends).getTime() <= new Date(starts).getTime()) {
    CivicUI.showFieldError("event-ends-input", "End time must be after the start time.");
    valid = false;
  }
  if (!civicEventFormValidateImage()) {
    valid = false;
  }

  if (!valid) {
    return false;
  }

  return {
    title: title,
    description: description,
    location: location,
    starts_at: starts,
    ends_at: ends
  };
}

function civicEventFormBuildData(values) {
  var formData = new FormData();
  formData.append("title", values.title);
  formData.append("description", values.description);
  formData.append("location", values.location);
  formData.append("starts_at", values.starts_at);
  formData.append("ends_at", values.ends_at);

  var imageInput = document.getElementById("event-image-input");
  if (imageInput.files && imageInput.files.length > 0) {
    formData.append("image", imageInput.files[0]);
  }

  return formData;
}

function civicEventFormSubmit(event) {
  event.preventDefault();
  var values = civicEventFormValidate();
  if (!values) {
    return;
  }

  var button = document.getElementById("event-form-submit");
  var formData = civicEventFormBuildData(values);
  var url = "/events";
  var method = "POST";

  if (civicEventFormId) {
    url = "/events/" + encodeURIComponent(civicEventFormId);
    method = "PUT";
  }

  civicSetLoading(button, true, "Saving...");

  CivicAPI.upload(url, method, formData)
    .done(function (response) {
      var id = civicEventFormId;
      if (response.data && response.data.id) {
        id = response.data.id;
      }
      sessionStorage.setItem("civic_page_message", civicEventFormId ? "Event updated." : "Event created.");
      window.location.href = "event-detail.html?id=" + encodeURIComponent(id);
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not save this event.");
      CivicUI.showMessage("event-form-error", error.message, "error");
    });
}

function civicEventFormLoadEvent() {
  document.getElementById("event-form-loading").classList.remove("hidden");

  CivicAPI.get("/events/" + encodeURIComponent(civicEventFormId))
    .done(function (response) {
      var event = response.data;
      if (!event) {
        CivicUI.showMessage("event-form-error", "Event not found.", "error");
        document.getElementById("event-form-loading").classList.add("hidden");
        return;
      }

      $("#event-title-input").val(event.title || "");
      $("#event-description-input").val(event.description || "");
      $("#event-location-input").val(event.location || "");
      $("#event-starts-input").val(civicEventFormLocalValue(event.starts_at));
      $("#event-ends-input").val(civicEventFormLocalValue(event.ends_at));

      if (event.metadata && event.metadata.image_url) {
        document.getElementById("event-image-current-img").src = event.metadata.image_url;
        document.getElementById("event-image-current").classList.remove("hidden");
      }

      document.getElementById("event-form-loading").classList.add("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load this event.");
      document.getElementById("event-form-loading").classList.add("hidden");
      CivicUI.showMessage("event-form-error", error.message, "error");
    });
}

function civicEventFormStart() {
  civicEventFormId = CivicUI.getQueryParam("id");

  if (civicEventFormId) {
    document.getElementById("event-form-title").textContent = "Edit event";
    civicEventFormLoadEvent();
  }

  $("#event-image-input").on("change", function () {
    civicEventFormValidateImage();
    civicEventFormShowPreview();
  });

  $("#event-form").on("submit", function (event) {
    civicEventFormSubmit(event);
  });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  // ROLE GUARD: only admins can open this form. The backend also enforces admin access.
  if (!CivicAuth.isAdmin()) {
    window.location.href = "dashboard.html";
    return;
  }
  civicEventFormStart();
});
