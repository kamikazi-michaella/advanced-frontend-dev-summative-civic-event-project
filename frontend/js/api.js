var CivicAPI = {};

function civicApiSettings(options) {
  var headers = {};
  var token = "";

  if (options.auth !== false) {
    token = CivicAuth.getToken();
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
  }

  var settings = {
    url: CivicConfig.API_BASE_URL + options.path,
    method: options.method || "GET",
    dataType: "json",
    headers: headers
  };

  if (options.data !== undefined) {
    settings.data = options.data;
  }
  if (options.contentType) {
    settings.contentType = options.contentType;
  }
  if (options.processData === false) {
    settings.processData = false;
  }

  return settings;
}

function civicApiRequest(options) {
  return $.ajax(civicApiSettings(options));
}

function civicNormalizeError(xhr, fallback) {
  var status = xhr && xhr.status ? xhr.status : 0;
  var message = fallback || "Something went wrong. Please try again.";
  var errors = null;

  if (status === 0) {
    message = "Cannot reach the server. Check that the backend is running on port 4000 and try again.";
  } else if (xhr.responseJSON && xhr.responseJSON.message) {
    message = xhr.responseJSON.message;
  } else if (status === 403) {
    message = "You do not have permission to do that.";
  } else if (status === 404) {
    message = "The requested item was not found.";
  } else if (status === 500) {
    message = "The server had a problem. Please try again shortly.";
  }

  if (xhr.responseJSON && xhr.responseJSON.errors) {
    errors = xhr.responseJSON.errors;
  }

  return {
    status: status,
    message: message,
    errors: errors
  };
}

function civicHandleFail(xhr, fallback, redirectOn401) {
  var error = civicNormalizeError(xhr, fallback);
  if (error.status === 401 && redirectOn401 !== false) {
    CivicAuth.redirectToLogin("Your session expired. Please log in again.");
  }
  return error;
}

function civicApiGet(path, data) {
  return civicApiRequest({ path: path, method: "GET", data: data });
}

function civicApiJson(path, method, data) {
  return civicApiRequest({
    path: path,
    method: method,
    data: JSON.stringify(data || {}),
    contentType: "application/json; charset=UTF-8"
  });
}

function civicApiUpload(path, method, formData) {
  return civicApiRequest({
    path: path,
    method: method,
    data: formData,
    processData: false,
    contentType: false
  });
}

CivicAPI.request = civicApiRequest;
CivicAPI.get = civicApiGet;
CivicAPI.postJson = function (path, data) {
  return civicApiJson(path, "POST", data);
};
CivicAPI.putJson = function (path, data) {
  return civicApiJson(path, "PUT", data);
};
CivicAPI.patchJson = function (path, data) {
  return civicApiJson(path, "PATCH", data);
};
CivicAPI.remove = function (path) {
  return civicApiRequest({ path: path, method: "DELETE" });
};
CivicAPI.upload = civicApiUpload;
CivicAPI.publicPost = function (path, data) {
  return civicApiRequest({
    path: path,
    method: "POST",
    data: JSON.stringify(data || {}),
    contentType: "application/json; charset=UTF-8",
    auth: false
  });
};
CivicAPI.normalizeError = civicNormalizeError;
CivicAPI.handleFail = civicHandleFail;
