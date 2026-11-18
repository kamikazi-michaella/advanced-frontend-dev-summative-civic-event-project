var civicPromoFormId = "";
var civicPromoPreviewUrl = "";

function civicPromoValidateVideo(required) {
  var input = document.getElementById("promo-video-input");
  var selected = document.getElementById("promo-video-selected");

  if (!input.files || input.files.length === 0) {
    selected.textContent = "";
    if (required) {
      CivicUI.showFieldError("promo-video-input", "Choose an MP4 video file.");
      return false;
    }
    return true;
  }

  var file = input.files[0];
  var name = file.name.toLowerCase();
  selected.textContent = file.name + " (" + Math.round(file.size / 1024) + " KB)";

  if (!/\.mp4$/.test(name)) {
    CivicUI.showFieldError("promo-video-input", "Choose an MP4 file only. Other formats do not play reliably in browsers.");
    return false;
  }
  if (file.size > 8 * 1024 * 1024) {
    CivicUI.showFieldError("promo-video-input", "The video must be 8 MB or smaller.");
    return false;
  }

  CivicUI.showFieldError("promo-video-input", "");
  return true;
}

function civicPromoShowPreview() {
  var input = document.getElementById("promo-video-input");
  var wrap = document.getElementById("promo-video-preview-wrap");
  var video = document.getElementById("promo-video-preview");

  if (!input.files || input.files.length === 0) {
    wrap.classList.add("hidden");
    return;
  }

  if (civicPromoPreviewUrl) {
    URL.revokeObjectURL(civicPromoPreviewUrl);
  }
  civicPromoPreviewUrl = URL.createObjectURL(input.files[0]);
  video.src = civicPromoPreviewUrl;
  wrap.classList.remove("hidden");
}

function civicPromoValidateForm(requireVideo) {
  CivicUI.clearFieldErrors("promo-form");
  CivicUI.showMessage("promo-form-error", "", "error");

  var title = $("#promo-title-input").val().trim();
  var description = $("#promo-description-input").val().trim();
  var caption = $("#promo-caption-input").val().trim();
  var valid = true;

  if (!title) {
    CivicUI.showFieldError("promo-title-input", "Title is required.");
    valid = false;
  }
  if (!description) {
    CivicUI.showFieldError("promo-description-input", "Description is required.");
    valid = false;
  }
  if (!caption) {
    CivicUI.showFieldError("promo-caption-input", "Caption text is required.");
    valid = false;
  }
  if (!civicPromoValidateVideo(requireVideo)) {
    valid = false;
  }

  if (!valid) {
    return false;
  }

  return {
    title: title,
    description: description,
    caption_text: caption
  };
}

function civicPromoBuildFormData(values) {
  var formData = new FormData();
  formData.append("title", values.title);
  formData.append("description", values.description);
  formData.append("caption_text", values.caption_text);

  var input = document.getElementById("promo-video-input");
  if (input.files && input.files.length > 0) {
    formData.append("video", input.files[0]);
  }
  return formData;
}

function civicPromoFormSubmit(event) {
  event.preventDefault();
  var values = civicPromoValidateForm(!civicPromoFormId);
  if (!values) {
    return;
  }

  var formData = civicPromoBuildFormData(values);
  var button = document.getElementById("promo-form-submit");
  var url = "/promos";
  var method = "POST";
  var message = "Promo created successfully.";

  if (civicPromoFormId) {
    url = "/promos/" + encodeURIComponent(civicPromoFormId);
    method = "PUT";
    message = "Promo updated successfully.";
  }

  civicSetLoading(button, true, "Saving...");

  CivicAPI.upload(url, method, formData)
    .done(function (response) {
      var id = civicPromoFormId;
      if (response.data && response.data.id) {
        id = response.data.id;
      }
      sessionStorage.setItem("civic_page_message", message);
      window.location.href = "promo-detail.html?id=" + encodeURIComponent(id);
    })
    .fail(function (xhr) {
      civicSetLoading(button, false);
      var error = CivicAPI.handleFail(xhr, "Could not save this promo.");
      CivicUI.showMessage("promo-form-error", error.message, "error");
    });
}

function civicPromoFormLoad() {
  document.getElementById("promo-form-loading").classList.remove("hidden");

  CivicAPI.get("/promos/" + encodeURIComponent(civicPromoFormId))
    .done(function (response) {
      var promo = response.data;
      if (!promo) {
        CivicUI.showMessage("promo-form-error", "Promo not found.", "error");
        document.getElementById("promo-form-loading").classList.add("hidden");
        return;
      }

      $("#promo-title-input").val(promo.title || "");
      $("#promo-description-input").val(promo.description || "");
      $("#promo-caption-input").val(promo.caption_text || "");

      if (promo.video_url) {
        document.getElementById("promo-current-video-player").src = promo.video_url;
        document.getElementById("promo-current-video-link").href = promo.video_url;
        document.getElementById("promo-current-video").classList.remove("hidden");
      }

      document.getElementById("promo-form-loading").classList.add("hidden");
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load this promo.");
      document.getElementById("promo-form-loading").classList.add("hidden");
      CivicUI.showMessage("promo-form-error", error.message, "error");
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

  civicPromoFormId = CivicUI.getQueryParam("id");
  if (civicPromoFormId) {
    document.getElementById("promo-form-title").textContent = "Edit promo";
    civicPromoFormLoad();
  }

  $("#promo-video-input").on("change", function () {
    civicPromoValidateVideo(!civicPromoFormId);
    civicPromoShowPreview();
  });

  $("#promo-form").on("submit", function (event) {
    civicPromoFormSubmit(event);
  });
});
