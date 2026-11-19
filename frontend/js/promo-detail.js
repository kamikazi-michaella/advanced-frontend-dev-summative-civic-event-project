var civicPromoCurrent = null;
var civicPromoId = "";
var civicPromoCaptionUrl = "";

function civicPromoVttTime(totalSeconds) {
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds + ".000";
}

function civicPromoCaptionChunks(text) {
  var words = (text || "").replace(/\s+/g, " ").split(" ");
  var chunks = [];
  var current = "";
  var i;

  for (i = 0; i < words.length; i++) {
    if (!words[i]) {
      continue;
    }
    if ((current + " " + words[i]).length > 80) {
      chunks[chunks.length] = current;
      current = words[i];
    } else if (current) {
      current = current + " " + words[i];
    } else {
      current = words[i];
    }
  }

  if (current) {
    chunks[chunks.length] = current;
  }
  return chunks;
}

function civicPromoBuildCaptions(text) {
  var chunks = civicPromoCaptionChunks(text);
  var vtt = "WEBVTT\n\n";
  var i;
  var start;
  var end;

  for (i = 0; i < chunks.length; i++) {
    start = i * 5;
    end = start + 5;
    vtt = vtt + (i + 1) + "\n" + civicPromoVttTime(start) + " --> " + civicPromoVttTime(end) + "\n" + chunks[i] + "\n\n";
  }

  if (civicPromoCaptionUrl) {
    URL.revokeObjectURL(civicPromoCaptionUrl);
  }
  civicPromoCaptionUrl = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  return civicPromoCaptionUrl;
}

function civicPromoRender(promo) {
  var isAdmin = CivicAuth.isAdmin();
  var video = document.getElementById("promo-video");
  var captionTrack = document.getElementById("promo-caption-track");
  var status = document.getElementById("promo-status");
  var publishButton = document.getElementById("promo-publish-button");

  civicPromoCurrent = promo;
  document.title = promo.title + " | CivicEvents+";
  document.getElementById("promo-title").textContent = promo.title || "Untitled promo";
  document.getElementById("promo-description").textContent = promo.description || "No description provided.";
  document.getElementById("promo-transcript").textContent = promo.caption_text || "No transcript text is available.";
  document.getElementById("promo-video-link").href = promo.video_url || "#";

  video.src = promo.video_url || "";
  if (promo.caption_text) {
    captionTrack.src = civicPromoBuildCaptions(promo.caption_text);
  }

  video.onerror = function () {
    document.getElementById("promo-video-warning").classList.remove("hidden");
  };

  if (promo.video_url && promo.video_url.toLowerCase().indexOf(".mp4") === -1) {
    document.getElementById("promo-video-warning").classList.remove("hidden");
  }

  if (isAdmin) {
    status.classList.remove("hidden");
    if (promo.published === false) {
      status.textContent = "Draft promo";
      status.className = "mt-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800";
      publishButton.textContent = "Publish";
      publishButton.setAttribute("data-action", "publish");
    } else {
      status.textContent = "Live promo";
      status.className = "mt-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800";
      publishButton.textContent = "Unpublish";
      publishButton.setAttribute("data-action", "unpublish");
    }
    document.getElementById("promo-edit-link").href = "promo-form.html?id=" + encodeURIComponent(promo.id);
    document.getElementById("promo-admin-actions").classList.remove("hidden");
  }

  document.getElementById("promo-loading").classList.add("hidden");
  document.getElementById("promo-content").classList.remove("hidden");
}

function civicPromoDetailShowError(message) {
  document.getElementById("promo-loading").classList.add("hidden");
  document.getElementById("promo-content").classList.add("hidden");
  CivicUI.showMessage("promo-error", message, "error");
}

function civicPromoDetailLoad() {
  civicPromoId = CivicUI.getQueryParam("id");
  if (!civicPromoId) {
    civicPromoDetailShowError("No promo id was provided.");
    return;
  }

  CivicAPI.get("/promos/" + encodeURIComponent(civicPromoId))
    .done(function (response) {
      var promo = response.data;
      if (!promo) {
        civicPromoDetailShowError("Promo not found.");
        return;
      }

      // ROLE GUARD: normal users cannot open an unpublished promo by direct URL.
      if (!CivicAuth.isAdmin() && promo.published === false) {
        civicPromoDetailShowError("This promo is not available.");
        return;
      }

      civicPromoRender(promo);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load this promo.");
      civicPromoDetailShowError(error.message);
    });
}

function civicPromoTogglePublish() {
  var button = document.getElementById("promo-publish-button");
  var action = button.getAttribute("data-action");
  civicSetLoading(button, true, "Saving...");

  CivicAPI.patchJson("/promos/" + encodeURIComponent(civicPromoId) + "/" + action, {})
    .done(function (response) {
      civicSetLoading(button, false);
      civicPromoRender(response.data || civicPromoCurrent);
      CivicUI.showMessage("promo-message", action === "publish" ? "Published." : "Unpublished.", "success");
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not change the publish status.");
      CivicUI.showMessage("promo-message", error.message, "error");
    });
}

function civicPromoDelete() {
  if (!window.confirm("Delete this promo? This cannot be undone.")) {
    return;
  }
  var button = document.getElementById("promo-delete-button");
  civicSetLoading(button, true, "Deleting...");

  CivicAPI.remove("/promos/" + encodeURIComponent(civicPromoId))
    .done(function () {
      sessionStorage.setItem("civic_page_message", "Promo deleted.");
      window.location.href = "promos.html";
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not delete this promo.");
      CivicUI.showMessage("promo-message", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }

  var pageMessage = sessionStorage.getItem("civic_page_message");
  if (pageMessage) {
    sessionStorage.removeItem("civic_page_message");
    CivicUI.showMessage("promo-message", pageMessage, "success");
  }

  $("#promo-publish-button").on("click", function () {
    civicPromoTogglePublish();
  });
  $("#promo-delete-button").on("click", function () {
    civicPromoDelete();
  });

  civicPromoDetailLoad();
});
