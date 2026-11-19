var civicPromosAll = [];
var civicPromosPage = 1;
var civicPromosPerPage = 6;

function civicPromosShortText(value) {
  var text = value || "";
  if (text.length > 120) {
    return text.substring(0, 120) + "...";
  }
  return text;
}

function civicPromosStatus(promo, isAdmin) {
  if (!isAdmin) {
    return "";
  }
  if (promo.published === false) {
    return '<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Draft</span>';
  }
  return '<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Live</span>';
}

function civicPromosFeatured(promo, isAdmin) {
  var videoUrl = civicEscapeHtml(promo.video_url || "");
  var preview = '<div class="flex h-64 items-center justify-center bg-stone-100 text-sm text-stone-500">Video unavailable</div>';
  if (promo.video_url) {
    preview = '<video controls preload="metadata" class="w-full bg-stone-900" aria-label="Promo video">' +
      'Your browser cannot play this video. <a href="' + videoUrl + '">Open video file</a>.' +
      "</video>";
  }

  var edit = "";
  // ROLE GUARD: the edit link is only rendered for admins.
  if (isAdmin) {
    edit = '<a href="promo-form.html?id=' + encodeURIComponent(promo.id) +
      '" class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Edit</a>';
  }

  return '<section class="overflow-hidden rounded-md border border-stone-200 bg-white lg:col-span-3">' +
    preview +
    '<div class="p-5">' +
    '<div class="flex flex-wrap items-start justify-between gap-2">' +
    '<h2 class="font-serif text-2xl text-stone-900">' + civicEscapeHtml(promo.title) + "</h2>" +
    civicPromosStatus(promo, isAdmin) +
    "</div>" +
    '<p class="mt-2 text-stone-600">' + civicEscapeHtml(civicPromosShortText(promo.description)) + "</p>" +
    '<div class="mt-4 flex flex-wrap gap-2">' +
    '<a href="promo-detail.html?id=' + encodeURIComponent(promo.id) +
    '" class="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Watch</a>' +
    edit +
    "</div></div></section>";
}

function civicPromosListItem(promo, isAdmin) {
  var edit = "";
  // ROLE GUARD: the edit link is only rendered for admins.
  if (isAdmin) {
    edit = '<a href="promo-form.html?id=' + encodeURIComponent(promo.id) +
      '" class="mt-1 block text-xs text-emerald-800 hover:underline">Edit</a>';
  }

  return '<article class="px-4 py-3">' +
    '<a href="promo-detail.html?id=' + encodeURIComponent(promo.id) + '" class="flex items-start gap-3">' +
    '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">Play</span>' +
    '<span class="min-w-0"><span class="block font-medium text-stone-900">' + civicEscapeHtml(promo.title) + "</span>" +
    '<span class="mt-1 block text-xs text-stone-500">' + civicEscapeHtml(civicPromosShortText(promo.description)) + "</span></span>" +
    "</a>" + edit + "</article>";
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
  var items = [];
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
    items[items.length] = civicPromosAll[i];
  }

  if (items.length > 0) {
    html = '<div class="grid gap-6 lg:grid-cols-5">' + civicPromosFeatured(items[0], isAdmin) +
      '<aside class="rounded-md border border-stone-200 bg-white lg:col-span-2">' +
      '<div class="border-b border-stone-200 px-4 py-3"><h2 class="font-serif text-xl text-stone-900">More promos</h2></div>' +
      '<div class="divide-y divide-stone-200">';

    if (items.length === 1) {
      html = html + '<p class="px-4 py-4 text-sm text-stone-500">No more promos.</p>';
    } else {
      for (i = 1; i < items.length; i++) {
        html = html + civicPromosListItem(items[i], isAdmin);
      }
    }
    html = html + "</div></aside></div>";
  }

  list.innerHTML = html;

  document.getElementById("promos-count").textContent =
    civicPromosAll.length + " promo" + (civicPromosAll.length === 1 ? "" : "s");

  if (civicPromosAll.length === 0) {
    document.getElementById("promos-empty").classList.remove("hidden");
  } else {
    document.getElementById("promos-empty").classList.add("hidden");
  }

  for (i = 1; i <= totalPages; i++) {
    var style = "rounded-md border px-3 py-2 text-sm ";
    if (i === civicPromosPage) {
      style = style + "border-emerald-700 bg-emerald-700 font-medium text-white";
    } else {
      style = style + "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
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
