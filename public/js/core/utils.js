/* =========================
   HELPERS
========================= */
console.log("utils.js loaded");

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function getDayName(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(y, m - 1, d);  
  
  if (isNaN(d)) return "";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(dateStr) {
  const settings = getSettings();
const [y, m, d] = dateStr.split("-");
const date = new Date(y, m - 1, d);

  if (settings.displayMode === "compact") {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit"
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  });
}

function normalizeId(id) {
  const settings = getSettings();

  let clean = String(id).trim();

  // remove leading zeros first (important)
  clean = String(parseInt(clean));

  if (!settings.idPadding || settings.idPadding <= 0) {
    return clean; // no padding
  }

  return clean.padStart(settings.idPadding, "0");
}

function getActiveStudents(students) {
  return students.filter(s => s.active !== false);
}

function getVisibleStudents(students) {
  const settings = getSettings();

  if (settings.showInactiveStudents) {
    return students;
  }

  return students.filter(s => s.active !== false);
}


window.getInitials = getInitials;
window.todayString = todayString;
window.getDayName = getDayName;
window.formatDate = formatDate;
window.normalizeId = normalizeId;
window.getActiveStudents = getActiveStudents;
window.getVisibleStudents = getVisibleStudents;
