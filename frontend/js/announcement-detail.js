var civicAnnouncementCurrent = null;
var civicAnnouncementId = "";

function civicAnnouncementDetailShowError(message) {
  document.getElementById("announcement-loading").classList.add("hidden");
  document.getElementById("announcement-content").classList.add("hidden");
  CivicUI.showMessage("announcement-error", message, "error");
}

function civicAnnouncementRender(item) {
  var isAdmin = CivicAuth.isAdmin();
  var audio = document.getElementById("announcement-audio");
  var status = document.getElementById("announcement-status");
  var publishButton = document.getElementById("announcement-publish-button");

  civicAnnouncementCurrent = item;
  document.title = item.title + " | CivicEvents+";
  document.getElementById("announcement-title").textContent = item.title || "Untitled announcement";
  document.getElementById("announcement-created").textContent = "Created " + civicFormatDate(item.created_at);

  audio.src = item.audio_url || "";
  audio.load();
  document.getElementById("announcement-audio-link").href = item.audio_url || "#";
  document.getElementById("announcement-duration").textContent = "Loading...";

  audio.onloadedmetadata = function () {
    document.getElementById("announcement-duration").textContent = civicFormatDuration(audio.duration);
  };
  audio.onerror = function () {
    document.getElementById("announcement-duration").textContent = "Duration unavailable";
  };

  if (isAdmin) {
    status.classList.remove("hidden");
    if (item.published === false) {
      status.textContent = "Unpublished announcement";
      status.className = "mt-2 rounded bg-amber-900 px-2 py-1 text-xs text-amber-200";
      publishButton.textContent = "Publish";
      publishButton.setAttribute("data-action", "publish");
    } else {
      status.textContent = "Published announcement";
      status.className = "mt-2 rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200";
      publishButton.textContent = "Unpublish";
      publishButton.setAttribute("data-action", "unpublish");
    }
    document.getElementById("announcement-edit-link").href = "announcement-form.html?id=" + encodeURIComponent(item.id);
    document.getElementById("announcement-admin-actions").classList.remove("hidden");
  }

  document.getElementById("announcement-loading").classList.add("hidden");
  document.getElementById("announcement-content").classList.remove("hidden");
}

function civicAnnouncementDetailLoad() {
  civicAnnouncementId = CivicUI.getQueryParam("id");
  if (!civicAnnouncementId) {
    civicAnnouncementDetailShowError("No announcement id was provided.");
    return;
  }

  CivicAPI.get("/announcements/" + encodeURIComponent(civicAnnouncementId))
    .done(function (response) {
      var item = response.data;
      if (!item) {
        civicAnnouncementDetailShowError("Announcement not found.");
        return;
      }

      // ROLE GUARD: normal users cannot open an unpublished announcement by direct URL.
      if (!CivicAuth.isAdmin() && item.published === false) {
        civicAnnouncementDetailShowError("This announcement is not available.");
        return;
      }

      civicAnnouncementRender(item);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load this announcement.");
      civicAnnouncementDetailShowError(error.message);
    });
}

function civicAnnouncementTogglePublish() {
  var button = document.getElementById("announcement-publish-button");
  var action = button.getAttribute("data-action");
  var endpoint = "/announcements/" + encodeURIComponent(civicAnnouncementId) + "/" + action;
  civicSetLoading(button, true, "Saving...");

  CivicAPI.patchJson(endpoint, {})
    .done(function (response) {
      civicSetLoading(button, false);
      civicAnnouncementRender(response.data || civicAnnouncementCurrent);
      CivicUI.showMessage("announcement-message", action === "publish" ? "Announcement published." : "Announcement unpublished.", "success");
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not change the publish status.");
      CivicUI.showMessage("announcement-message", error.message, "error");
    });
}

function civicAnnouncementDelete() {
  if (!window.confirm("Delete this announcement? This cannot be undone.")) {
    return;
  }
  var button = document.getElementById("announcement-delete-button");
  civicSetLoading(button, true, "Deleting...");

  CivicAPI.remove("/announcements/" + encodeURIComponent(civicAnnouncementId))
    .done(function () {
      sessionStorage.setItem("civic_page_message", "Announcement deleted successfully.");
      window.location.href = "announcements.html";
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not delete this announcement.");
      CivicUI.showMessage("announcement-message", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }

  var flash = sessionStorage.getItem("civic_announcement_flash");
  if (flash) {
    sessionStorage.removeItem("civic_announcement_flash");
    CivicUI.showToast(flash, "success");
  }

  var pageMessage = sessionStorage.getItem("civic_page_message");
  if (pageMessage) {
    sessionStorage.removeItem("civic_page_message");
    CivicUI.showMessage("announcement-message", pageMessage, "success");
  }

  $("#announcement-publish-button").on("click", function () {
    civicAnnouncementTogglePublish();
  });
  $("#announcement-delete-button").on("click", function () {
    civicAnnouncementDelete();
  });

  civicAnnouncementDetailLoad();
});
