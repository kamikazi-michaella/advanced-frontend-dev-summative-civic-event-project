var civicEventsAll = [];
var civicEventsFiltered = [];
var civicEventsPage = 1;
var civicEventsPerPage = 6;

function civicEventDateKey(value) {
  if (!value) {
    return "";
  }
  var date = new Date(value);
  if (isNaN(date.getTime())) {
    return "";
  }
  var month = date.getMonth() + 1;
  var day = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return date.getFullYear() + "-" + month + "-" + day;
}

function civicEventsShortText(value) {
  var text = value || "";
  if (text.length > 150) {
    return text.substring(0, 150) + "...";
  }
  return text;
}

function civicEventsApplyFilters(resetPage) {
  var search = $("#events-search").val().trim().toLowerCase();
  var location = $("#events-location").val().trim().toLowerCase();
  var date = $("#events-date").val();
  var i;
  var event;
  var title;
  var description;
  var eventLocation;

  civicEventsFiltered = [];

  for (i = 0; i < civicEventsAll.length; i++) {
    event = civicEventsAll[i];
    title = (event.title || "").toLowerCase();
    description = (event.description || "").toLowerCase();
    eventLocation = (event.location || "").toLowerCase();

    if (search && title.indexOf(search) === -1 && description.indexOf(search) === -1 && eventLocation.indexOf(search) === -1) {
      continue;
    }
    if (location && eventLocation.indexOf(location) === -1) {
      continue;
    }
    if (date && civicEventDateKey(event.starts_at) !== date) {
      continue;
    }

    civicEventsFiltered[civicEventsFiltered.length] = event;
  }

  if (resetPage !== false) {
    civicEventsPage = 1;
  }
  civicEventsRender();
}

function civicEventsCard(event, isAdmin) {
  var imageUrl = "";
  if (event.metadata && event.metadata.image_url) {
    imageUrl = event.metadata.image_url;
  }

  var image = '<div class="flex h-40 items-center justify-center bg-slate-800 text-sm text-slate-400">No image available</div>';
  if (imageUrl) {
    image = '<img src="' + civicEscapeHtml(imageUrl) + '" alt="Event image for ' + civicEscapeHtml(event.title) +
      '" class="h-40 w-full object-cover" loading="lazy">';
  }

  var status = "";
  if (isAdmin) {
    if (event.published === false) {
      status = '<span class="rounded bg-amber-900 px-2 py-1 text-xs text-amber-200">Unpublished</span>';
    } else {
      status = '<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-200">Published</span>';
    }
  }

  var edit = "";
  // ROLE GUARD: the edit link is only rendered for admins. The backend also blocks non-admins.
  if (isAdmin) {
    edit = '<a href="event-form.html?id=' + encodeURIComponent(event.id) +
      '" class="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Edit</a>';
  }

  var card = '<article class="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">' +
    image +
    '<div class="p-4">' +
    '<div class="flex items-start justify-between gap-2">' +
    '<h2 class="text-lg font-semibold text-cyan-300">' + civicEscapeHtml(event.title) + '</h2>' +
    status +
    '</div>' +
    '<p class="mt-2 text-sm text-slate-300">' + civicEscapeHtml(civicFormatDate(event.starts_at)) + '</p>' +
    '<p class="mt-1 text-sm text-slate-400">' + civicEscapeHtml(event.location || "Location not provided") + '</p>' +
    '<p class="mt-3 text-sm text-slate-300">' + civicEscapeHtml(civicEventsShortText(event.description)) + '</p>' +
    '<div class="mt-4 flex flex-wrap gap-2">' +
    '<a href="event-detail.html?id=' + encodeURIComponent(event.id) +
    '" class="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">View event</a>' +
    edit +
    '</div></div></article>';

  return card;
}

function civicEventsRender() {
  var isAdmin = CivicAuth.isAdmin();
  var totalPages = Math.ceil(civicEventsFiltered.length / civicEventsPerPage);
  var start = (civicEventsPage - 1) * civicEventsPerPage;
  var end = start + civicEventsPerPage;
  var list = document.getElementById("events-list");
  var pagination = document.getElementById("events-pagination");
  var html = "";
  var i;

  if (totalPages < 1) {
    totalPages = 1;
  }
  if (civicEventsPage > totalPages) {
    civicEventsPage = totalPages;
    start = (civicEventsPage - 1) * civicEventsPerPage;
    end = start + civicEventsPerPage;
  }

  for (i = start; i < end && i < civicEventsFiltered.length; i++) {
    html = html + civicEventsCard(civicEventsFiltered[i], isAdmin);
  }

  list.innerHTML = html;
  document.getElementById("events-count").textContent =
    "Showing " + civicEventsFiltered.length + " event" + (civicEventsFiltered.length === 1 ? "" : "s") + ".";

  if (civicEventsFiltered.length === 0) {
    document.getElementById("events-empty").classList.remove("hidden");
  } else {
    document.getElementById("events-empty").classList.add("hidden");
  }

  html = "";
  for (i = 1; i <= totalPages; i++) {
    var style = "rounded border px-3 py-2 text-sm ";
    if (i === civicEventsPage) {
      style = style + "border-cyan-500 bg-cyan-500 font-semibold text-slate-950";
    } else {
      style = style + "border-slate-600 text-slate-200 hover:bg-slate-800";
    }
    html = html + '<button type="button" class="' + style + '" data-page="' + i + '">' + i + "</button>";
  }
  pagination.innerHTML = html;

  $('#events-pagination button').on("click", function () {
    civicEventsPage = Number($(this).attr("data-page"));
    civicEventsRender();
    window.scrollTo(0, 0);
  });
}

function civicEventsLoad() {
  document.getElementById("events-loading").classList.remove("hidden");
  CivicUI.showMessage("events-error", "", "error");

  CivicAPI.get("/events")
    .done(function (response) {
      var data = response.data || [];
      var i;
      civicEventsAll = [];

      for (i = 0; i < data.length; i++) {
        // ROLE GUARD: normal users only see published events in the UI.
        // The backend returns all events, so this filter must run in the browser.
        if (!CivicAuth.isAdmin() && data[i].published === false) {
          continue;
        }
        civicEventsAll[civicEventsAll.length] = data[i];
      }

      document.getElementById("events-loading").classList.add("hidden");
      civicEventsApplyFilters();
    })
    .fail(function (xhr) {
      var error = CivicAPI.handleFail(xhr, "Could not load events.");
      document.getElementById("events-loading").classList.add("hidden");
      CivicUI.showMessage("events-error", error.message, "error");
    });
}

$(document).ready(function () {
  if (window.CIVIC_ACCESS_OK !== true) {
    return;
  }

  $("#events-search").val(CivicUI.getQueryParam("q"));
  $("#global-search-input").val(CivicUI.getQueryParam("q"));

  $("#events-filter-form").on("submit", function (event) {
    event.preventDefault();
    civicEventsApplyFilters();
  });

  $("#events-reset").on("click", function () {
    $("#events-search").val("");
    $("#events-location").val("");
    $("#events-date").val("");
    civicEventsApplyFilters();
  });

  $("#events-search").on("input", function () {
    civicEventsApplyFilters();
  });
  $("#events-location").on("input", function () {
    civicEventsApplyFilters();
  });
  $("#events-date").on("change", function () {
    civicEventsApplyFilters();
  });

  civicEventsLoad();
});
