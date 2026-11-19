var CivicUI = {};

function civicShowMessage(containerId, message, type) {
  var box = document.getElementById(containerId);
  if (!box) {
    return;
  }

  if (!message) {
    box.textContent = "";
    box.className = "hidden";
    return;
  }

  var style = "rounded-md border px-4 py-3 text-sm";
  if (type === "success") {
    style = style + " border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (type === "error") {
    style = style + " border-red-200 bg-red-50 text-red-700";
  } else {
    style = style + " border-stone-200 bg-white text-stone-700";
  }

  box.className = style;
  box.textContent = message;
  box.setAttribute("role", type === "error" ? "alert" : "status");
}

function civicShowFieldError(fieldId, message) {
  var field = document.getElementById(fieldId);
  var error = document.getElementById(fieldId + "-error");
  if (field) {
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }
  if (error) {
    error.textContent = message || "";
  }
}

function civicClearFieldErrors(formId) {
  var form = document.getElementById(formId);
  if (!form) {
    return;
  }
  var errors = form.querySelectorAll('[id$="-error"]');
  var i;
  for (i = 0; i < errors.length; i++) {
    errors[i].textContent = "";
  }
  var fields = form.querySelectorAll("input, select, textarea");
  for (i = 0; i < fields.length; i++) {
    fields[i].setAttribute("aria-invalid", "false");
  }
}

function civicSetLoading(button, loading, loadingText) {
  if (!button) {
    return;
  }
  if (loading) {
    if (!button.getAttribute("data-original-text")) {
      button.setAttribute("data-original-text", button.textContent);
    }
    button.disabled = true;
    button.textContent = loadingText || "Please wait...";
  } else {
    button.disabled = false;
    button.textContent = button.getAttribute("data-original-text") || "Submit";
  }
}

function civicShowToast(message, type) {
  var toast = document.createElement("div");
  if (type === "error") {
    toast.className = "civic-toast rounded-md border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-sm";
  } else {
    toast.className = "civic-toast rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-sm";
  }
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 4500);
}

function civicPasswordScore(password) {
  var score = 0;
  if (password.length >= 8) {
    score++;
  }
  if (/[A-Z]/.test(password)) {
    score++;
  }
  if (/[a-z]/.test(password)) {
    score++;
  }
  if (/[0-9]/.test(password)) {
    score++;
  }
  if (/[\W_]/.test(password)) {
    score++;
  }
  return score;
}

function civicUpdatePasswordMeter(password) {
  var score = civicPasswordScore(password);
  var bars = document.querySelectorAll(".password-bar");
  var label = document.getElementById("password-strength-label");
  var colorClass = "active-weak";
  var text = "Weak";
  var i;

  if (score >= 5) {
    colorClass = "active-strong";
    text = "Strong";
  } else if (score >= 3) {
    colorClass = "active-medium";
    text = "Medium";
  }

  for (i = 0; i < bars.length; i++) {
    bars[i].className = "password-bar";
    if (i < score) {
      bars[i].className = "password-bar " + colorClass;
    }
  }

  if (label) {
    label.textContent = password ? "Password strength: " + text : "";
  }
}

function civicFormatDate(value) {
  if (!value) {
    return "Not provided";
  }
  var date = new Date(value);
  if (isNaN(date.getTime())) {
    return "Not provided";
  }
  return date.toLocaleString();
}

function civicFormatDateOnly(value) {
  if (!value) {
    return "Not provided";
  }
  var date = new Date(value);
  if (isNaN(date.getTime())) {
    return "Not provided";
  }
  return date.toLocaleDateString();
}

function civicFormatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) {
    return "Duration unavailable";
  }
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = Math.floor(totalSeconds % 60);
  if (seconds < 10) {
    return minutes + ":0" + seconds;
  }
  return minutes + ":" + seconds;
}

function civicEscapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return $("<div>").text(String(value)).html();
}

function civicGetQueryParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function civicSetupPasswordToggle(buttonId, inputId) {
  var button = document.getElementById(buttonId);
  var input = document.getElementById(inputId);
  if (!button || !input) {
    return;
  }
  button.addEventListener("click", function () {
    if (input.type === "password") {
      input.type = "text";
      button.textContent = "Hide";
    } else {
      input.type = "password";
      button.textContent = "Show";
    }
  });
}

CivicUI.showMessage = civicShowMessage;
CivicUI.showFieldError = civicShowFieldError;
CivicUI.clearFieldErrors = civicClearFieldErrors;
CivicUI.setLoading = civicSetLoading;
CivicUI.showToast = civicShowToast;
CivicUI.passwordScore = civicPasswordScore;
CivicUI.updatePasswordMeter = civicUpdatePasswordMeter;
CivicUI.formatDate = civicFormatDate;
CivicUI.formatDateOnly = civicFormatDateOnly;
CivicUI.formatDuration = civicFormatDuration;
CivicUI.escapeHtml = civicEscapeHtml;
CivicUI.getQueryParam = civicGetQueryParam;
CivicUI.setupPasswordToggle = civicSetupPasswordToggle;
