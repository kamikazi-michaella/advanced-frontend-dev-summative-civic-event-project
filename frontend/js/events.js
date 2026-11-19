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

  var image = '<div class="flex h-24 w-full items-center justify-center rounded-md bg-stone-100 text-xs text-stone-600 sm:w-28">No image</div>';
  if (imageUrl) {
    image = '<img src="' + civicEscapeHtml(imageUrl) + '" alt="Event image for ' + civicEscapeHtml(event.title) +
      '" class="h-24 w-full rounded-md object-cover sm:w-28" loading="lazy">';
  }

  var status = "";
  if (isAdmin) {
    if (event.published === false) {
      status = '<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Draft</span>';
    } else {
      status = '<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Live</span>';
    }
  }

  var edit = "";
  // ROLE GUARD: the edit link is only rendered for admins. The backend also blocks non-admins.
  if (isAdmin) {
    edit = '<a href="event-form.html?id=' + encodeURIComponent(event.id) +
      '" class="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Edit</a>';
  }

  return '<article class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">' +
    image +
    '<div class="min-w-0 flex-1">' +
    '<div class="flex flex-wrap items-center gap-2">' +
    '<h2 class="font-serif text-xl text-stone-900">' + civicEscapeHtml(event.title) + "</h2>" +
    status +
    "</div>" +
    '<p class="mt-1 text-sm text-stone-600">' + civicEscapeHtml(civicFormatDate(event.starts_at)) + "</p>" +
    '<p class="text-sm text-stone-500">' + civicEscapeHtml(event.location || "Location not provided") + "</p>" +
    "</div>" +
    '<div class="flex shrink-0 flex-wrap gap-2">' +
    '<a href="event-detail.html?id=' + encodeURIComponent(event.id) +
    '" class="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800">View event</a>' +
    edit +
    "</div></article>";
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
    civicEventsFiltered.length + " event" + (civicEventsFiltered.length === 1 ? "" : "s");

  if (civicEventsFiltered.length === 0) {
    document.getElementById("events-empty").classList.remove("hidden");
  } else {
    document.getElementById("events-empty").classList.add("hidden");
  }

  html = "";
  for (i = 1; i <= totalPages; i++) {
    var style = "rounded-md border px-3 py-2 text-sm ";
    if (i === civicEventsPage) {
      style = style + "border-emerald-700 bg-emerald-700 font-medium text-white";
    } else {
      style = style + "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
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
  $("#mobile-global-search-input").val(CivicUI.getQueryParam("q"));

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
