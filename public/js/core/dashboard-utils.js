console.log("dashboard-utils.js Loaded")

//FORMAT FULL DATE
function formatFullDate(dateString) {

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// WEEKDAYS IN A MONTH
function getWeekdaysInMonth(year, month) {

  let weekdays = [];

  let date = new Date(year, month, 1);

  while (date.getMonth() === month) {

    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      weekdays.push(date.toISOString().split("T")[0]);
    }

    date.setDate(date.getDate() + 1);
  }

  return weekdays;
}

// GET WEEK RANGE
function getWeekRange(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

// MONTH
function getMonth(date) {
  return date.slice(0, 7);
}

window.formatFullDate = formatFullDate;
window.getWeekdaysInMonth = getWeekdaysInMonth;
window.getWeekRange = getWeekRange;
window.getMonth = getMonth;

