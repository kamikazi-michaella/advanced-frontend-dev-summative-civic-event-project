var civicAnnouncementFormId = "";
var civicAnnouncementOriginalPublished = true;

function civicAnnouncementValidateAudio() {
  var input = document.getElementById("announcement-audio-input");
  var selected = document.getElementById("announcement-audio-selected");
  if (!input.files || input.files.length === 0) {
    selected.textContent = "";
    return false;
  }

  var file = input.files[0];
  var name = file.name.toLowerCase();
  var allowed = /\.(mp3|wav|m4a|ogg)$/.test(name);

  selected.textContent = file.name + " (" + Math.round(file.size / 1024) + " KB)";

  if (!allowed) {
    CivicUI.showFieldError("announcement-audio-input", "Choose an MP3, WAV, M4A, or OGG audio file.");
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    CivicUI.showFieldError("announcement-audio-input", "The audio file must be 5 MB or smaller.");
    return false;
  }

  CivicUI.showFieldError("announcement-audio-input", "");
  return true;
}

function civicAnnouncementFormGoToDetail(id, message) {
  sessionStorage.setItem("civic_page_message", message);
  window.location.href = "announcement-detail.html?id=" + encodeURIComponent(id);
}

function civicAnnouncementCreate(event) {
  event.preventDefault();
  CivicUI.clearFieldErrors("announcement-form");
  CivicUI.showMessage("announcement-form-error", "", "error");

  var title = $("#announcement-title-input").val().trim();
  var input = document.getElementById("announcement-audio-input");
  var valid = true;

  if (!title) {
    CivicUI.showFieldError("announcement-title-input", "Title is required.");
    valid = false;
  }
  if (!input.files || input.files.length === 0) {
    CivicUI.showFieldError("announcement-audio-input", "Audio file is required.");
    valid = false;
  } else if (!civicAnnouncementValidateAudio()) {
    valid = false;
  }

  if (!valid) {
    return;
  }

  var formData = new FormData();
  formData.append("title", title);
  formData.append("audio", input.files[0]);
  formData.append("published", $("#announcement-published-input").is(":checked") ? "true" : "false");

  var button = document.getElementById("announcement-form-submit");
  civicSetLoading(button, true, "Creating...");

  CivicAPI.upload("/announcements", "POST", formData)
    .done(function (response) {
      var id = response.data ? response.data.id : "";
      sessionStorage.setItem("civic_announcement_flash", "Notice created.");
      window.location.href = "announcement-detail.html?id=" + encodeURIComponent(id);
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not create the announcement.");
      CivicUI.showMessage("announcement-form-error", error.message, "error");
    });
}

function civicAnnouncementEdit(event) {
  event.preventDefault();
  CivicUI.clearFieldErrors("announcement-form");
  CivicUI.showMessage("announcement-form-error", "", "error");

  var title = $("#announcement-title-input").val().trim();
  var desiredPublished = $("#announcement-published-input").is(":checked");

  if (!title) {
    CivicUI.showFieldError("announcement-title-input", "Title is required.");
    return;
  }

  var button = document.getElementById("announcement-form-submit");
  civicSetLoading(button, true, "Saving...");

  CivicAPI.putJson("/announcements/" + encodeURIComponent(civicAnnouncementFormId), { title: title })
    .done(function () {
      if (desiredPublished === civicAnnouncementOriginalPublished) {
        civicSetLoading(button, false);
        civicAnnouncementFormGoToDetail(civicAnnouncementFormId, "Notice updated.");
        return;
      }

      var action = desiredPublished ? "publish" : "unpublish";
      CivicAPI.patchJson("/announcements/" + encodeURIComponent(civicAnnouncementFormId) + "/" + action, {})
        .done(function () {
          civicSetLoading(button, false);
          civicAnnouncementFormGoToDetail(civicAnnouncementFormId, "Notice updated.");
        })
        .fail(function (xhr) {
          civicSetLoading(button, false);
          var error = CivicAPI.handleFail(xhr, "The title was saved, but the publish status could not be updated.");
          CivicUI.showMessage("announcement-form-error", error.message, "error");
        });
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not update the announcement.");
      CivicUI.showMessage("announcement-form-error", error.message, "error");
    });
}

function civicAnnouncementFormLoad() {
  document.getElementById("announcement-form-loading").classList.remove("hidden");

  CivicAPI.get("/announcements/" + encodeURIComponent(civicAnnouncementFormId))
    .done(function (response) {
      var item = response.data;
      if (!item) {
        CivicUI.showMessage("announcement-form-error", "Announcement not found.", "error");
        document.getElementById("announcement-form-loading").classList.add("hidden");
        return;
      }

      $("#announcement-title-input").val(item.title || "");
      $("#announcement-published-input").prop("checked", item.published !== false);
      civicAnnouncementOriginalPublished = item.published !== false;

      var player = document.getElementById("announcement-current-audio-player");
      player.src = item.audio_url || "";
      document.getElementById("announcement-current-audio-link").href = item.audio_url || "#";
      document.getElementById("announcement-current-audio").classList.remove("hidden");

      document.getElementById("announcement-form-loading").classList.add("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load the announcement.");
      document.getElementById("announcement-form-loading").classList.add("hidden");
      CivicUI.showMessage("announcement-form-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  // ROLE GUARD: this form is admin only. The backend also enforces the admin role.
  if (!CivicAuth.isAdmin()) {
    window.location.href = "dashboard.html";
    return;
  }

  civicAnnouncementFormId = CivicUI.getQueryParam("id");

  if (civicAnnouncementFormId) {
    document.getElementById("announcement-form-title").textContent = "Edit announcement";
    document.getElementById("announcement-audio-wrap").classList.add("hidden");
    document.getElementById("announcement-edit-audio-note").classList.remove("hidden");
    civicAnnouncementFormLoad();
  }

  $("#announcement-audio-input").on("change", function () {
    civicAnnouncementValidateAudio();
  });

  $("#announcement-form").on("submit", function (event) {
    if (civicAnnouncementFormId) {
      civicAnnouncementEdit(event);
    } else {
      civicAnnouncementCreate(event);
    }
  });
});
