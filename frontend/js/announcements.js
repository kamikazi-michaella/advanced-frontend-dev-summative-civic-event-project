function civicAnnouncementRow(item, isAdmin, index) {
  var status = "";
  if (isAdmin) {
    status = item.published === false
      ? '<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Draft</span>'
      : '<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Live</span>';
  }

  var edit = "";
  // ROLE GUARD: admin edit controls are only rendered for admins.
  if (isAdmin) {
    edit = '<a href="announcement-form.html?id=' + encodeURIComponent(item.id) +
      '" class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Edit</a>';
  }

  var durationId = "announcement-duration-" + index;
  var audioUrl = civicEscapeHtml(item.audio_url || "");

  return '<article class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">' +
    '<div class="min-w-0 flex-1">' +
    '<div class="flex flex-wrap items-center gap-2">' +
    '<h2 class="font-serif text-xl text-stone-900">' + civicEscapeHtml(item.title) + "</h2>" + status + "</div>" +
    '<p class="mt-1 text-sm text-stone-500">' + civicEscapeHtml(civicFormatDate(item.created_at)) + "</p>" +
    '<div class="mt-3 max-w-md">' +
    '<audio controls preload="metadata" src="' + audioUrl + '" data-duration-target="' + durationId +
    '" aria-label="Audio for ' + civicEscapeHtml(item.title) + '" class="h-9 w-full">' +
    'Your browser cannot play this audio. <a href="' + audioUrl + '">Open audio file</a>.' +
    "</audio>" +
    '<p class="mt-1 text-xs text-stone-500">Duration: <span id="' + durationId + '">Loading...</span></p>' +
    "</div></div>" +
    '<div class="flex shrink-0 flex-wrap items-center gap-2">' +
    '<a href="announcement-detail.html?id=' + encodeURIComponent(item.id) +
    '" class="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">Open</a>' +
    edit + "</div></article>";
}

function civicAnnouncementsBindDurations() {
  $("#announcements-list audio").each(function () {
    var audio = this;
    var targetId = audio.getAttribute("data-duration-target");
    audio.addEventListener("loadedmetadata", function () {
      var target = document.getElementById(targetId);
      if (target) {
        target.textContent = civicFormatDuration(audio.duration);
      }
    });
    audio.addEventListener("error", function () {
      var target = document.getElementById(targetId);
      if (target) {
        target.textContent = "Unavailable";
      }
    });
  });
}

function civicAnnouncementsRender(items) {
  var isAdmin = CivicAuth.isAdmin();
  var list = document.getElementById("announcements-list");
  var html = "";
  var i;

  for (i = 0; i < items.length; i++) {
    html = html + civicAnnouncementRow(items[i], isAdmin, i);
  }
  list.innerHTML = html;
  civicAnnouncementsBindDurations();

  if (items.length === 0) {
    document.getElementById("announcements-empty").classList.remove("hidden");
  } else {
    document.getElementById("announcements-empty").classList.add("hidden");
  }
}

function civicAnnouncementsLoad() {
  CivicAPI.get("/announcements?limit=100")
    .done(function (response) {
      var data = response.data || [];
      var visible = [];
      var i;

      for (i = 0; i < data.length; i++) {
        // ROLE GUARD: normal users only see published announcements.
        // The backend returns all rows, so the filter runs in the browser.
        if (!CivicAuth.isAdmin() && data[i].published === false) {
          continue;
        }
        visible[visible.length] = data[i];
      }

      document.getElementById("announcements-loading").classList.add("hidden");
      civicAnnouncementsRender(visible);
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load announcements.");
      document.getElementById("announcements-loading").classList.add("hidden");
      CivicUI.showMessage("announcements-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  civicAnnouncementsLoad();
});
