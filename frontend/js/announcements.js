function civicAnnouncementCard(item, isAdmin, index) {
  var status = "";
  if (isAdmin) {
    status = item.published === false
      ? '<span class="rounded bg-amber-900 px-2 py-1 text-xs text-amber-200">Unpublished</span>'
      : '<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200">Published</span>';
  }

  var edit = "";
  // ROLE GUARD: admin edit controls are only rendered for admins.
  if (isAdmin) {
    edit = '<a href="announcement-form.html?id=' + encodeURIComponent(item.id) +
      '" class="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Edit</a>';
  }

  var durationId = "announcement-duration-" + index;
  var audioId = "announcement-audio-" + index;
  var audioUrl = civicEscapeHtml(item.audio_url || "");

  return '<article class="rounded-lg border border-slate-800 bg-slate-900 p-5">' +
    '<div class="flex flex-wrap items-start justify-between gap-3">' +
    '<div><h2 class="text-xl font-semibold text-cyan-300">' + civicEscapeHtml(item.title) + "</h2>" +
    '<p class="mt-1 text-sm text-slate-400">Created ' + civicEscapeHtml(civicFormatDate(item.created_at)) + "</p></div>" +
    status + "</div>" +
    '<div class="mt-4">' +
    '<audio id="' + audioId + '" controls preload="metadata" src="' + audioUrl +
    '" data-duration-target="' + durationId + '" aria-label="Audio for ' + civicEscapeHtml(item.title) + '">' +
    'Your browser cannot play this audio. <a href="' + audioUrl + '">Open the audio file</a>.' +
    "</audio>" +
    '<p class="mt-2 text-sm text-slate-400">Duration: <span id="' + durationId + '">Loading...</span></p>' +
    '<p class="mt-1 text-xs text-slate-500"><a href="' + audioUrl + '" class="text-cyan-300 hover:underline">Direct audio link</a></p>' +
    "</div>" +
    '<div class="mt-4 flex flex-wrap gap-2">' +
    '<a href="announcement-detail.html?id=' + encodeURIComponent(item.id) +
    '" class="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Open announcement</a>' +
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
        target.textContent = "Duration unavailable";
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
    html = html + civicAnnouncementCard(items[i], isAdmin, i);
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
