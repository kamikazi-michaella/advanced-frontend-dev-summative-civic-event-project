var civicPromosAll = [];
var civicPromosPage = 1;
var civicPromosPerPage = 6;

function civicPromosShortText(value) {
  var text = value || "";
  if (text.length > 140) {
    return text.substring(0, 140) + "...";
  }
  return text;
}

function civicPromosCard(promo, isAdmin) {
  var status = "";
  if (isAdmin) {
    status = promo.published === false
      ? '<span class="rounded bg-amber-900 px-2 py-1 text-xs text-amber-200">Unpublished</span>'
      : '<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200">Published</span>';
  }

  var videoUrl = civicEscapeHtml(promo.video_url || "");
  var preview = '<div class="flex h-44 items-center justify-center bg-slate-800 text-sm text-slate-400">Video preview unavailable</div>';
  if (promo.video_url) {
    preview = '<video controls preload="metadata" class="h-44 w-full bg-black" aria-label="Video preview for ' +
      civicEscapeHtml(promo.title) + '">' +
      'Your browser cannot play this video. <a href="' + videoUrl + '">Open the video file</a>.' +
      "</video>";
  }

  var edit = "";
  // ROLE GUARD: edit controls are only rendered for admins.
  if (isAdmin) {
    edit = '<a href="promo-form.html?id=' + encodeURIComponent(promo.id) +
      '" class="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Edit</a>';
  }

  return '<article class="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">' +
    preview +
    '<div class="p-4">' +
    '<div class="flex flex-wrap items-start justify-between gap-2">' +
    '<h2 class="text-lg font-semibold text-cyan-300">' + civicEscapeHtml(promo.title) + "</h2>" +
    status + "</div>" +
    '<p class="mt-2 text-sm text-slate-300">' + civicEscapeHtml(civicPromosShortText(promo.description)) + "</p>" +
    '<div class="mt-4 flex flex-wrap gap-2">' +
    '<a href="promo-detail.html?id=' + encodeURIComponent(promo.id) +
    '" class="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Play or view details</a>' +
    edit + "</div></div></article>";
}

function civicPromosRender() {
  var isAdmin = CivicAuth.isAdmin();
  var totalPages = Math.ceil(civicPromosAll.length / civicPromosPerPage);
  var start = (civicPromosPage - 1) * civicPromosPerPage;
  var end = start + civicPromosPerPage;
  var list = document.getElementById("promos-list");
  var pagination = document.getElementById("promos-pagination");
  var html = "";
  var pageHtml = "";
  var i;

  if (totalPages < 1) {
    totalPages = 1;
  }
  if (civicPromosPage > totalPages) {
    civicPromosPage = totalPages;
    start = (civicPromosPage - 1) * civicPromosPerPage;
    end = start + civicPromosPerPage;
  }

  for (i = start; i < end && i < civicPromosAll.length; i++) {
    html = html + civicPromosCard(civicPromosAll[i], isAdmin);
  }
  list.innerHTML = html;

  document.getElementById("promos-count").textContent =
    "Showing " + civicPromosAll.length + " promo" + (civicPromosAll.length === 1 ? "" : "s") + ".";

  if (civicPromosAll.length === 0) {
    document.getElementById("promos-empty").classList.remove("hidden");
  } else {
    document.getElementById("promos-empty").classList.add("hidden");
  }

  for (i = 1; i <= totalPages; i++) {
    var style = "rounded border px-3 py-2 text-sm ";
    if (i === civicPromosPage) {
      style = style + "border-cyan-500 bg-cyan-500 font-semibold text-slate-950";
    } else {
      style = style + "border-slate-600 text-slate-200 hover:bg-slate-800";
    }
    pageHtml = pageHtml + '<button type="button" class="' + style + '" data-page="' + i + '">' + i + "</button>";
  }
  pagination.innerHTML = pageHtml;

  $("#promos-pagination button").on("click", function () {
    civicPromosPage = Number($(this).attr("data-page"));
    civicPromosRender();
    window.scrollTo(0, 0);
  });
}

function civicPromosLoad() {
  CivicAPI.get("/promos?page=1&limit=100")
    .done(function (response) {
      var data = response.data || [];
      var i;
      civicPromosAll = [];

      for (i = 0; i < data.length; i++) {
        // ROLE GUARD: normal users only see published promos.
        // The backend returns all rows, so this filter runs in the browser.
        if (!CivicAuth.isAdmin() && data[i].published === false) {
          continue;
        }
        civicPromosAll[civicPromosAll.length] = data[i];
      }

      document.getElementById("promos-loading").classList.add("hidden");
      civicPromosRender();
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load promos.");
      document.getElementById("promos-loading").classList.add("hidden");
      CivicUI.showMessage("promos-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }
  civicPromosLoad();
});
