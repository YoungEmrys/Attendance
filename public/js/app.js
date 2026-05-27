// ===== Shared App Utilities =====

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("history")) || [];
  } catch (e) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem("history", JSON.stringify(history));
}

function getWeekdaysInMonth(year, month, excludeDays) {
  let date = new Date(year, month, 1);
  let count = 0;

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate().toString();

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !excludeDays.includes(dayOfMonth)) {
      count++;
    }

    date.setDate(date.getDate() + 1);
  }

  return count;
}